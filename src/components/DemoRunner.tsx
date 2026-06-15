import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Play,
  X,
  Terminal,
  Loader2,
  Eye,
  Workflow,
  FileText,
  Code,
  History,
  Clock,
  RefreshCw,
  Trash2,
  Sparkles,
  Bot,
  Search
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getPayloadForDemo, formatDemoOutput, getInputPreview } from "./DemoRunnerHelpers";
import WorkflowDiagram from "./WorkflowDiagram";
import ReactMarkdown from "react-markdown";
import DynamicDemoInputs from "./DynamicDemoInputs";

interface DemoRun {
  id: string;
  demo_id: string;
  demo_title: string;
  input_payload: any;
  output_data: any;
  execution_mode: string;
  model_used: string;
  created_at: string;
}

interface DemoRunnerProps {
  demo: {
    id: string;
    title: string;
    description: string;
    pythonFile: string;
  };
  onClose: () => void;
  userRole?: 'admin' | 'developer';
  developerProfileId?: string;
}

const CLAUDE_MODEL = "claude-3-haiku-20240307";
const CLAUDE_MODEL_LABEL = "Claude 3 Haiku";

// Fallback UUID generator for environments where crypto.randomUUID is not available
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const getClaudeApiEndpoint = () => {
  if (import.meta.env.VITE_ANTHROPIC_PROXY_URL) {
    return import.meta.env.VITE_ANTHROPIC_PROXY_URL;
  }
  if (import.meta.env.DEV) {
    return "/anthropic/v1/messages";
  }
  return "https://api.anthropic.com/v1/messages";
};

const DemoRunner = ({ demo, onClose, userRole = 'admin', developerProfileId }: DemoRunnerProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"raw" | "formatted">("raw");
  const [previousRuns, setPreviousRuns] = useState<DemoRun[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedRun, setSelectedRun] = useState<DemoRun | null>(null);
  const [dynamicPayload, setDynamicPayload] = useState<any>(getPayloadForDemo(demo.id));
  const [searchQuery, setSearchQuery] = useState("");

  const isDeveloper = userRole === 'developer';
  const isAdmin = userRole === 'admin';

  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY || "";
  const endpoint = getClaudeApiEndpoint();
  const supabaseConfigured = Boolean(
    import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  );

  const localStorageKey = `demoRuns:${demo.id}`;

  const getLocalRuns = (): DemoRun[] => {
    try {
      const raw = localStorage.getItem(localStorageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const saveLocalRun = (run: DemoRun) => {
    const existing = getLocalRuns();
    const next = [run, ...existing].slice(0, 20);
    localStorage.setItem(localStorageKey, JSON.stringify(next));
    setPreviousRuns(next);
  };

  // Load previous runs on mount
  useEffect(() => {
    loadPreviousRuns();
  }, [demo.id]);

  const loadPreviousRuns = async () => {
    setIsLoadingHistory(true);
    if (!supabaseConfigured) {
      let runs = getLocalRuns();
      // Filter by developer profile if applicable
      if (isDeveloper && developerProfileId) {
        runs = runs.filter(run =>
          run.input_payload?.developerContext?.name === developerProfileId ||
          run.demo_id === 'developer-portal'
        );
      }
      setPreviousRuns(runs);
      setIsLoadingHistory(false);
      return;
    }
    try {
      let query = supabase
        .from('demo_runs')
        .select('*')
        .eq('demo_id', demo.id);

      // Filter by developer profile for non-admin users
      if (isDeveloper && developerProfileId) {
        // For developers, only show their own runs
        query = query.or(`input_payload->developerContext->>name.eq.${developerProfileId},demo_id.eq.developer-portal`);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error loading previous runs:', error);
        toast.error('History unavailable. Using local history.');
        let runs = getLocalRuns();
        if (isDeveloper && developerProfileId) {
          runs = runs.filter(run =>
            run.input_payload?.developerContext?.name === developerProfileId ||
            run.demo_id === 'developer-portal'
          );
        }
        setPreviousRuns(runs);
      } else {
        setPreviousRuns(data || []);
      }
    } catch (error) {
      console.error('Error loading previous runs:', error);
      toast.error('History unavailable. Using local history.');
      let runs = getLocalRuns();
      if (isDeveloper && developerProfileId) {
        runs = runs.filter(run =>
          run.input_payload?.developerContext?.name === developerProfileId ||
          run.demo_id === 'developer-portal'
        );
      }
      setPreviousRuns(runs);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const saveRun = async (outputData: any, payload: any, mode: string) => {
    console.log('Attempting to save run...', { demo_id: demo.id, mode });
    try {
      const insertData = {
        demo_id: demo.id,
        demo_title: demo.title,
        input_payload: payload,
        output_data: outputData,
        execution_mode: mode,
        model_used: outputData.model_used || CLAUDE_MODEL
      };
      console.log('Insert data:', insertData);

      if (!supabaseConfigured) {
        const localRun: DemoRun = {
          id: generateUUID(),
          demo_id: insertData.demo_id,
          demo_title: insertData.demo_title,
          input_payload: insertData.input_payload,
          output_data: insertData.output_data,
          execution_mode: insertData.execution_mode,
          model_used: insertData.model_used,
          created_at: new Date().toISOString()
        };
        saveLocalRun(localRun);
        return;
      }

      const { data, error } = await supabase
        .from('demo_runs')
        .insert(insertData)
        .select();

      if (error) {
        console.error('Error saving run:', error);
        toast.error('Failed to save run to history. Using local history.');
        const localRun: DemoRun = {
          id: generateUUID(),
          demo_id: insertData.demo_id,
          demo_title: insertData.demo_title,
          input_payload: insertData.input_payload,
          output_data: insertData.output_data,
          execution_mode: insertData.execution_mode,
          model_used: insertData.model_used,
          created_at: new Date().toISOString()
        };
        saveLocalRun(localRun);
      } else {
        console.log('Run saved successfully:', data);
        // Reload history to show new run
        loadPreviousRuns();
      }
    } catch (error) {
      console.error('Error saving run:', error);
      toast.error('Failed to save run to history. Using local history.');
      const localRun: DemoRun = {
        id: generateUUID(),
        demo_id: demo.id,
        demo_title: demo.title,
        input_payload: payload,
        output_data: outputData,
        execution_mode: mode,
        model_used: outputData.model_used || CLAUDE_MODEL,
        created_at: new Date().toISOString()
      };
      saveLocalRun(localRun);
    }
  };

  const loadRun = (run: DemoRun) => {
    setSelectedRun(run);
    const formattedOutput = formatDemoOutput(run.demo_id, run.output_data);
    setOutput([
      `📂 Loaded saved run from ${new Date(run.created_at).toLocaleString()}`,
      `🔧 Mode: ${run.execution_mode === 'cloud' ? 'Cloud Backend' : 'Local'}`,
      `🤖 Model: Claude (${run.model_used || CLAUDE_MODEL})`,
      ``,
      formattedOutput
    ]);
    toast.success("Loaded previous run");
  };

  const runDemo = async () => {
    setSelectedRun(null);
    if (!apiKey) {
      toast.error("API key not configured. Please set VITE_ANTHROPIC_API_KEY in your .env file.");
      return;
    }

    setIsRunning(true);
    const trimmedKey = apiKey.trim();

    setOutput([
      `🤖 AI Copilot activated...`,
      `📡 Connecting to AI...`
    ]);

    try {
      const payload = dynamicPayload;

      console.log('[debug] endpoint:', endpoint);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'x-api-key': trimmedKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          max_tokens: 2048,
          messages: [{ role: 'user', content: generatePromptForDemo(demo.id, payload) }],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Claude API error:', response.status, errorText);

        if (response.status === 429) {
          toast.error('Rate limit exceeded');
          setOutput(prev => [...prev, '❌ <error>Error: Rate limit exceeded</error>']);
        } else if (response.status === 401) {
          toast.error('Invalid API key');
          setOutput(prev => [...prev, `❌ <error>Error: Invalid API key (${response.status})</error>`, `📋 Anthropic says: ${errorText}`]);
        } else {
          toast.error('Claude API error');
          setOutput(prev => [...prev, `❌ <error>Error (${response.status}): ${errorText}</error>`]);
        }
        setIsRunning(false);
        return;
      }

      const data = await response.json();
      const result = data.content?.[0]?.text || 'No response generated';
      
      const outputData = {
        result,
        model_used: CLAUDE_MODEL,
        timestamp: new Date().toISOString()
      };

      // Save the run
      await saveRun(outputData, payload, 'local');
      
      setOutput(prev => [...prev, `✓ <success>Analysis complete!</success>`, `🤖 Model: ${CLAUDE_MODEL_LABEL}`, ``, result]);
      toast.success("Demo completed and saved!");

    } catch (error) {
      console.error('Error running local demo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('Failed to fetch')) {
        toast.error('Browser could not reach Claude. Run through the dev proxy or provide VITE_ANTHROPIC_PROXY_URL.');
        setOutput(prev => [...prev, '❌ <error>Network error: browser cannot call Claude directly. Run `npm run dev` (which adds a proxy) or configure VITE_ANTHROPIC_PROXY_URL to a server-side proxy.</error>']);
      } else {
        toast.error('An unexpected error occurred');
        setOutput(prev => [...prev, `❌ <error>Unexpected error: ${errorMessage}</error>`]);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getRunContext = (run: DemoRun): string => {
    const payload = run.input_payload;
    if (run.demo_id === "developer-portal") {
      return payload?.query || payload?.developerContext?.name || "No query available";
    } else if (run.demo_id === "workflow-diagnostic") {
      const errorPreview = payload?.errorLog?.split('\n')[0] || "Error log";
      return errorPreview.substring(0, 60) + (errorPreview.length > 60 ? "..." : "");
    } else if (run.demo_id === "release-readiness") {
      const coverage = payload?.qualityMetrics?.test_coverage || "N/A";
      return `Test coverage: ${coverage}%`;
    } else if (run.demo_id === "multi-agent") {
      const cost = payload?.infrastructureState?.monthly_total_cost || "N/A";
      return `Infra cost: $${cost}/mo`;
    }
    return "Context not available";
  };

  const filteredRuns = previousRuns.filter(run => {
    if (!searchQuery) return true;
    const context = getRunContext(run).toLowerCase();
    const timestamp = formatTimestamp(run.created_at).toLowerCase();
    return context.includes(searchQuery.toLowerCase()) ||
           timestamp.includes(searchQuery.toLowerCase());
  });

  const clearOutput = () => {
    setOutput([]);
    setSelectedRun(null);
    toast.success("Output cleared");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{demo.title}</h2>
          <p className="text-muted-foreground">{demo.description}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      <Tabs defaultValue="inputs" className="w-full">
        <TabsList className={`grid w-full ${isDeveloper ? 'grid-cols-2' : 'grid-cols-3'}`}>
          <TabsTrigger value="inputs">
            <Eye className="w-4 h-4 mr-2" />
            Inputs & Run
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="workflow">
              <Workflow className="w-4 h-4 mr-2" />
              Workflow
            </TabsTrigger>
          )}
          <TabsTrigger value="history">
            <History className="w-4 h-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center">
                  <History className="w-5 h-5 mr-2 text-primary" />
                  Previous Runs
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadPreviousRuns}
                  disabled={isLoadingHistory}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              {previousRuns.length > 0 && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by query or date..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              )}
            </div>

            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : previousRuns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No previous runs found.</p>
                <p className="text-sm">Run the demo to save results here.</p>
              </div>
            ) : filteredRuns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No runs match your search.</p>
                <p className="text-sm">Try a different search term.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[50vh] overflow-y-auto mt-4">
                {filteredRuns.map((run) => (
                  <div
                    key={run.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedRun?.id === run.id ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                    onClick={() => loadRun(run)}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm line-clamp-2">
                            {getRunContext(run)}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          Load
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimestamp(run.created_at)}</span>
                        <span className={`px-1.5 py-0.5 rounded ${
                          run.execution_mode === 'cloud' ? 'bg-primary/20 text-primary' : 'bg-secondary'
                        }`}>
                          {run.execution_mode === 'cloud' ? 'Cloud' : 'Local'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {output.length > 0 && (
            <Card className="p-6 border-2 border-primary/20">
              <div className="flex items-center justify-between mb-4 sticky top-0 bg-card z-10 pb-2">
                <h3 className="text-lg font-semibold flex items-center">
                  <Terminal className="w-5 h-5 mr-2 text-primary" />
                  {selectedRun ? 'Loaded Output' : 'Latest Output'}
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === "raw" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("raw")}
                  >
                    <Code className="w-4 h-4 mr-1" />
                    Raw
                  </Button>
                  <Button
                    variant={viewMode === "formatted" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("formatted")}
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    Formatted
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={clearOutput}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                </div>
              </div>
              
              {viewMode === "raw" ? (
                <div className="bg-secondary rounded-lg p-4 font-mono text-sm space-y-1 max-h-[60vh] overflow-y-auto">
                  {output.map((line, index) => (
                    <div 
                      key={index} 
                      className="whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ 
                        __html: line
                          .replace(/<error>(.*?)<\/error>/g, '<span class="text-destructive font-bold">$1</span>')
                          .replace(/<success>(.*?)<\/success>/g, '<span class="text-success font-bold">$1</span>')
                          .replace(/<warning>(.*?)<\/warning>/g, '<span class="text-warning font-bold">$1</span>')
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-900 border rounded-lg p-6 max-h-[60vh] overflow-y-auto">
                  <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:text-slate-900 dark:prose-headings:text-slate-100 prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-strong:text-slate-900 dark:prose-strong:text-slate-100 prose-li:text-slate-700 dark:prose-li:text-slate-300 prose-code:bg-slate-200 prose-code:text-slate-900 dark:prose-code:bg-slate-700 dark:prose-code:text-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-slate-200 dark:prose-pre:bg-slate-800 prose-pre:text-slate-900 dark:prose-pre:text-slate-100">
                    <ReactMarkdown>
                      {output
                        .join('\n')
                        .replace(/<error>(.*?)<\/error>/g, '**❌ Error: $1**')
                        .replace(/<success>(.*?)<\/success>/g, '**✅ $1**')
                        .replace(/<warning>(.*?)<\/warning>/g, '**⚠️ $1**')}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </Card>
          )}
        </TabsContent>

        <TabsContent value="inputs" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Eye className="w-5 h-5 mr-2 text-primary" />
              Configure Inputs
            </h3>
            <DynamicDemoInputs
              demoId={demo.id}
              onPayloadChange={setDynamicPayload}
              developerProfileId={developerProfileId}
            />
          </Card>

          {/* AI Copilot Section */}
          <Card className="p-6 bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                <p className="text-sm font-medium">
                  Ask AI Copilot anything about your platform
                </p>
              </div>

              <Button
                onClick={runDemo}
                disabled={isRunning || !apiKey}
                className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                size="lg"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    AI is thinking...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Ask AI Copilot
                  </>
                )}
              </Button>

              {!apiKey && (
                <p className="text-xs text-muted-foreground italic">
                  ℹ️ Note: This is a demo environment. AI features require API configuration.
                </p>
              )}
            </div>
          </Card>

          {/* Output Section */}
          {output.length > 0 && (
            <Card className="p-6 border-2 border-primary/20">
              <div className="flex items-center justify-between mb-4 sticky top-0 bg-card z-10 pb-2">
                <h3 className="text-lg font-semibold flex items-center">
                  <Terminal className="w-5 h-5 mr-2 text-primary" />
                  {selectedRun ? 'Loaded Output' : 'Latest Output'}
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === "raw" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("raw")}
                  >
                    <Code className="w-4 h-4 mr-1" />
                    Raw
                  </Button>
                  <Button
                    variant={viewMode === "formatted" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("formatted")}
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    Formatted
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={clearOutput}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                </div>
              </div>

              {viewMode === "raw" ? (
                <div className="bg-secondary rounded-lg p-4 font-mono text-sm space-y-1 max-h-[60vh] overflow-y-auto">
                  {output.map((line, index) => (
                    <div
                      key={index}
                      className="whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{
                        __html: line
                          .replace(/<error>(.*?)<\/error>/g, '<span class="text-destructive font-bold">$1</span>')
                          .replace(/<success>(.*?)<\/success>/g, '<span class="text-success font-bold">$1</span>')
                          .replace(/<warning>(.*?)<\/warning>/g, '<span class="text-warning font-bold">$1</span>')
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-900 border rounded-lg p-6 max-h-[60vh] overflow-y-auto">
                  <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:text-slate-900 dark:prose-headings:text-slate-100 prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-strong:text-slate-900 dark:prose-strong:text-slate-100 prose-li:text-slate-700 dark:prose-li:text-slate-300 prose-code:bg-slate-200 prose-code:text-slate-900 dark:prose-code:bg-slate-700 dark:prose-code:text-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-slate-200 dark:prose-pre:bg-slate-800 prose-pre:text-slate-900 dark:prose-pre:text-slate-100">
                    <ReactMarkdown>
                      {output
                        .join('\n')
                        .replace(/<error>(.*?)<\/error>/g, '**❌ Error: $1**')
                        .replace(/<success>(.*?)<\/success>/g, '**✅ $1**')
                        .replace(/<warning>(.*?)<\/warning>/g, '**⚠️ $1**')}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </Card>
          )}
        </TabsContent>

        {isAdmin && (
          <TabsContent value="workflow" className="space-y-4">
            <WorkflowDiagram demoId={demo.id} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

function generatePromptForDemo(demoId: string, payload: any): string {
  switch (demoId) {
    case "workflow-diagnostic":
      return `You are a platform engineering diagnostic agent powered by Claude.

Developer Context:
${JSON.stringify(payload.developerContext, null, 2)}

A CI/CD workflow has failed with the following error:

${payload.errorLog}

Workflow Context:
${payload.workflowContext}

Please provide a diagnosis tailored to the developer's experience level and tech stack:
1. Root cause analysis (explain at the appropriate technical depth for ${payload.developerContext?.experience_level || 'intermediate'} level)
2. Step-by-step fix recommendations (specific to ${payload.developerContext?.team || 'their team'} workflows and ${payload.developerContext?.tech_stack?.join(', ') || 'their tech stack'})
3. Prevention strategies for future occurrences
4. Relevant documentation or resources

Format your response as structured analysis with clear sections. Tailor the technical depth and terminology to the developer's experience level. Do not mention or reference any AI model names like Gemini in your response.`;

    case "release-readiness":
      return `You are a release readiness evaluation agent powered by Claude.

Analyze the following quality metrics and provide a release decision:

${JSON.stringify(payload.qualityMetrics, null, 2)}

Quality Gates:
- Test Coverage: Minimum 80% (Critical)
- Performance: Response time < 200ms (High)
- Security Scan: No critical vulnerabilities (Critical)
- Code Quality: Maintainability score > 70 (Medium)

Provide:
1. Overall release recommendation (Deploy/Rollback/Hold)
2. Confidence score (0-100%)
3. Detailed rationale for each quality gate
4. Risk assessment and mitigation strategies

Be specific and actionable. Do not mention or reference any AI model names like Gemini in your response.`;

    case "multi-agent":
      return `You are coordinating multiple agents (powered by Claude) to balance cost and reliability.

Infrastructure State:
${JSON.stringify(payload.infrastructureState, null, 2)}

Provide a comprehensive analysis covering:
1. Cost optimization opportunities
2. Reliability impact assessment
3. Balanced recommendations
4. Implementation plan

Do not mention or reference any AI model names like Gemini in your response.`;

    case "developer-portal":
      return `You are an intelligent developer portal agent powered by Claude.

Developer Context:
${JSON.stringify(payload.developerContext, null, 2)}

Developer Query: ${payload.query}

Provide:
1. Clear, actionable answer
2. Code examples if applicable
3. Next steps as a task list

Do not mention or reference any AI model names like Gemini in your response.`;

    default:
      return "";
  }
}

export default DemoRunner;
