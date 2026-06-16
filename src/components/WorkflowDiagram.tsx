import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useRef, useState } from "react";
import { Edit, Eye, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface WorkflowDiagramProps {
  demoId: string;
}

const WorkflowDiagram = ({ demoId }: WorkflowDiagramProps) => {
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [customDiagram, setCustomDiagram] = useState<string>("");
  const [editedDiagram, setEditedDiagram] = useState<string>("");

  const diagrams: Record<string, { title: string; diagram: string; legend: string[] }> = {
    "workflow-diagnostic": {
      title: "Workflow Diagnostic Agent Flow",
      diagram: `graph TD
    A[CI/CD Pipeline Running] -->|Failure Detected| B[🤖 Agent Triggered]
    B -->|Automatic| C[Collect Error Logs]
    C -->|Automatic| D[Gather Workflow Context]
    D -->|Automatic| E[Claude API Analysis]
    E -->|AI Reasoning| F[Root Cause Identified]
    F -->|Automatic| G[Generate Fix Recommendations]
    G -->|Automatic| H[Create Prevention Strategies]
    H -->|Manual Review| I[Engineer Reviews Analysis]
    I -->|Manual Action| J[Apply Fix]
    J --> K[Re-run Pipeline]
    
    style B fill:#4ade80,color:#0f172a
    style E fill:#60a5fa,color:#0f172a
    style I fill:#fbbf24,color:#0f172a
    style J fill:#fbbf24,color:#0f172a
    
    L[Before: Manual log diving, 30+ mins] -.->|vs| M[After: Automatic analysis, 2 mins]`,
      legend: [
        "🟢 Green: Automatic AI-powered steps",
        "🔵 Blue: AI reasoning/analysis",
        "🟡 Yellow: Manual intervention required",
        "📊 Before/After: Time savings comparison"
      ]
    },
    "release-readiness": {
      title: "Release Readiness Agent Flow",
      diagram: `graph TD
    A[Pull Request Opened] -->|Trigger| B[🤖 Quality Gate Agent]
    B -->|Automatic| C[Collect Test Coverage]
    B -->|Automatic| D[Gather Performance Metrics]
    B -->|Automatic| E[Run Security Scans]
    B -->|Automatic| F[Check Code Quality]
    
    C --> G[Aggregate All Metrics]
    D --> G
    E --> G
    F --> G
    
    G -->|Automatic| H[Claude API Evaluation]
    H -->|AI Reasoning| I{Decision Point}
    I -->|Deploy| J[✅ Approve Release]
    I -->|Hold| K[⏸️ Request Changes]
    I -->|Rollback| L[❌ Block Release]
    
    J -->|Manual Review| M[Engineering Approval]
    K -->|Manual Action| N[Developer Fixes Issues]
    L -->|Manual Review| O[Emergency Review]
    
    M --> P[Deploy to Production]
    N --> A
    
    style B fill:#4ade80,color:#0f172a
    style H fill:#60a5fa,color:#0f172a
    style I fill:#8b5cf6,color:#0f172a
    style M fill:#fbbf24,color:#0f172a
    style N fill:#fbbf24,color:#0f172a
    style O fill:#fbbf24,color:#0f172a
    
    Q[Before: 2-hour manual review meetings] -.->|vs| R[After: 5-min AI analysis + human decision]`,
      legend: [
        "🟢 Green: Automatic collection & triggering",
        "🔵 Blue: AI analysis with Claude",
        "🟣 Purple: AI decision point with reasoning",
        "🟡 Yellow: Human review & approval",
        "📊 Time Savings: 2 hours → 5 minutes"
      ]
    },
    "multi-agent": {
      title: "Multi-Agent Coordination Flow",
      diagram: `graph TD
    A[Infrastructure State Snapshot] -->|Input| B[Agent Orchestrator]
    
    B -->|Parallel| C[💰 Cost Optimizer Agent]
    B -->|Parallel| D[🛡️ Incident Responder Agent]
    
    C -->|Analyze| E[Identify Cost Savings]
    E --> F[Oversized Resources]
    E --> G[Idle Resources]
    E --> H[Pricing Optimizations]
    
    D -->|Assess| I[Reliability Impact]
    I --> J[Availability Risks]
    I --> K[Failure Modes]
    I --> L[Rollback Complexity]
    
    F --> M[Conflict Resolution Agent]
    G --> M
    H --> M
    J --> M
    K --> M
    L --> M
    
    M -->|Claude Synthesis| N{Balance Cost vs Reliability}
    N -->|Approve| O[✅ Low-Risk Optimizations]
    N -->|Conditional| P[⚠️ Staged Rollout]
    N -->|Reject| Q[❌ High-Risk Changes]
    
    O -->|Automatic| R[Apply Changes]
    P -->|Manual Review| S[Gradual Implementation]
    Q -->|Manual Override| T[Emergency Review]
    
    style C fill:#4ade80,color:#0f172a
    style D fill:#4ade80,color:#0f172a
    style M fill:#60a5fa,color:#0f172a
    style N fill:#8b5cf6,color:#0f172a
    style S fill:#fbbf24,color:#0f172a
    style T fill:#fbbf24,color:#0f172a
    
    U[Before: Siloed decisions, cost overruns OR outages] -.->|vs| V[After: Balanced AI coordination, 45% cost savings with 99.9% SLA]`,
      legend: [
        "🟢 Green: Specialized AI agents working in parallel",
        "🔵 Blue: Conflict resolution & synthesis",
        "🟣 Purple: Balanced decision making",
        "🟡 Yellow: Human oversight for staged changes",
        "💡 Key Insight: Multiple AI perspectives prevent one-sided optimization"
      ]
    },
    "developer-portal": {
      title: "AI Copilot for Developers",
      diagram: `graph TD
    A[👤 Developer Asks Question] -->|Query Submitted| B[🤖 AI Copilot]
    B -->|Instant| C{Analyze Context}

    C -->|Profile| D[Experience Level<br/>Junior/Mid/Senior]
    C -->|Tech Stack| E[Tech Stack<br/>Python/Kotlin/Swift/React]
    C -->|Team| F[Team Context<br/>Backend/Mobile/Platform]

    D --> G[🧠 AI Processing]
    E --> G
    F --> G

    G -->|Smart Analysis| H{Question Type}

    H -->|How-To| I[📝 Step-by-Step Guide]
    H -->|Debugging| J[🐛 Root Cause + Fix]
    H -->|Best Practice| K[⭐ Recommendations]
    H -->|Code Review| L[💡 Code Suggestions]

    I --> M[✨ Personalized Response]
    J --> M
    K --> M
    L --> M

    M --> N[Code Examples<br/>Tailored to Tech Stack]
    M --> O[Runnable Commands]
    M --> P[Links to Docs]
    M --> Q[Next Steps Checklist]

    N --> R[Developer Implements]
    O --> R
    P --> R
    Q --> R

    R -->|Works| S[✅ Problem Solved]
    R -->|Stuck| T[Ask Follow-up]
    T --> B

    S --> U[Knowledge Retained<br/>Team Velocity ⬆]

    style B fill:#4ade80,color:#0f172a
    style G fill:#60a5fa,color:#0f172a
    style M fill:#8b5cf6,color:#0f172a
    style R fill:#fbbf24,color:#0f172a
    style S fill:#10b981,color:#fff

    V[❌ Before: Wait hours/days for senior dev] -.->|vs| W[✅ After: Instant AI guidance, self-serve]`,
      legend: [
        "🤖 AI Copilot: Acts as your senior developer pair",
        "🧠 Context-Aware: Adapts to your experience & tech stack",
        "✨ Personalized: Answers tailored to your exact situation",
        "🔄 Interactive: Ask follow-ups, refine solutions",
        "📈 Impact: 10x faster onboarding, zero wait time",
        "💡 Smart: Debugging, how-tos, best practices, code review"
      ]
    },
    "developer-onboarding": {
      title: "Developer Onboarding Agent Flow",
      diagram: `graph TD
    A[👤 New Hire Starts] -->|Profile Submitted| B[🤖 Onboarding Agent]
    B -->|Analyze| C{Experience Level}

    C -->|Junior| D[14-day Ramp Plan]
    C -->|Intermediate| E[7-day Ramp Plan]
    C -->|Senior| F[5-day Ramp Plan]

    D --> G[Personalized Checklist]
    E --> G
    F --> G

    G -->|Generate| H[Learning Resources]
    H -->|Curate| I[Docs by Tech Stack]
    H -->|Recommend| J[Pairing Sessions]
    H -->|Schedule| K[Key Stakeholder Meetings]

    I --> L[🧠 AI Processing]
    J --> L
    K --> L

    L -->|Output| M[Onboarding Plan]
    M --> N[First Week Agenda]
    M --> O[Success Metrics]
    M --> P[Mentor Assignment]

    N --> Q[Developer Follows Plan]
    O --> Q
    P --> Q

    Q -->|Track| R[Day 1-2: Setup]
    Q -->|Track| S[Day 3-5: Core Systems]
    Q -->|Track| T[Day 6-7: First Task]

    R --> U[✅ Ready to Contribute]
    S --> U
    T --> U

    style B fill:#4ade80,color:#0f172a
    style G fill:#60a5fa,color:#0f172a
    style M fill:#8b5cf6,color:#0f172a
    style Q fill:#fbbf24,color:#0f172a

    V[❌ Before: 30 days to productivity] -.->|vs| W[✅ After: 5-14 days personalized ramp]`,
      legend: [
        "🟢 Green: Automatic plan generation",
        "🔵 Blue: AI-curated resources by profile",
        "🟣 Purple: Personalized onboarding output",
        "🟡 Yellow: Developer execution",
        "⏱️ Impact: 2-6x faster time to productivity"
      ]
    },
    "feature-flag-lifecycle": {
      title: "Feature Flag Lifecycle Agent Flow",
      diagram: `graph TD
    A[Feature Flags Inventory] -->|Input| B[🤖 Flag Lifecycle Agent]
    B -->|Scan| C[Analyze All Flags]

    C -->|Age Check| D[Stale Candidates<br/>90+ days old]
    C -->|Usage Check| E[Access Patterns]
    C -->|Duplication| F[v1/v2 Duplicates]

    D --> G[🧠 Evaluate Risks]
    E --> G
    F --> G

    G -->|Decision| H{Recommendation}

    H -->|Safe to Remove| I[❌ Remove Flag]
    H -->|Needs Refresh| J[🔄 Refresh Owner]
    H -->|Archive| K[📦 Archive Flag]

    I --> L[Generate Cleanup Plan]
    J --> L
    K --> L

    L -->|Organize| M[Phase 1: Low Risk]
    L -->|Organize| N[Phase 2: Medium Risk]
    L -->|Organize| O[Phase 3: High Risk]

    M --> P[👥 Notify Owners]
    N --> P
    O --> P

    P -->|Execute| Q[Code Cleanup]
    Q -->|Verify| R[Regression Tests]
    R -->|Confirm| S[✅ Flags Cleaned]

    style B fill:#4ade80,color:#0f172a
    style G fill:#60a5fa,color:#0f172a
    style H fill:#8b5cf6,color:#0f172a
    style P fill:#fbbf24,color:#0f172a

    T[❌ Before: Stale flags slow down codebase] -.->|vs| U[✅ After: Clean, efficient flag management]`,
      legend: [
        "🟢 Green: Automatic flag scanning",
        "🔵 Blue: AI risk assessment",
        "🟣 Purple: Intelligent recommendations",
        "🟡 Yellow: Phased cleanup execution",
        "🧹 Impact: Technical debt elimination"
      ]
    },
    "security-posture": {
      title: "Security Posture Agent Flow",
      diagram: `graph TD
    A[Security Scan Results] -->|Input| B[🤖 Security Agent]

    B -->|Scan CVEs| C[CVE Database Analysis]
    B -->|Scan Secrets| D[Secret Detection]
    B -->|Scan IaC| E[Infrastructure Drift Check]

    C -->|Grade| F[CVSS Scoring]
    D -->|Assess| G[Exposure Type]
    E -->|Detect| H[Configuration Deviations]

    F --> I[🧠 Threat Assessment]
    G --> I
    H --> I

    I -->|Evaluate| J[Calculate Exposure Score]
    J -->|Prioritize| K{Severity Level}

    K -->|Critical| L[🚨 Immediate Action Required]
    K -->|High| M[⚠️ High Priority]
    K -->|Medium| N[📋 Medium Priority]
    K -->|Low| O[✓ Monitor]

    L --> P[Generate Fix Approach]
    M --> P
    N --> P
    O --> P

    P -->|Output| Q[Remediation Plan]
    Q -->|Specify| R[Timeline & Resources]
    Q -->|Identify| S[Automation Opportunities]

    R --> T[👥 Notify Security Team]
    S --> T

    T -->|Execute| U[Apply Patches]
    U -->|Rotate| V[Refresh Secrets]
    V -->|Sync| W[Reconcile IaC]

    W -->|Verify| X[✅ Compliance Restored]

    style B fill:#4ade80,color:#0f172a
    style I fill:#60a5fa,color:#0f172a
    style J fill:#8b5cf6,color:#0f172a
    style P fill:#fbbf24,color:#0f172a

    Y[❌ Before: Manual security reviews, slow response] -.->|vs| Z[✅ After: Automated scanning, instant prioritization]`,
      legend: [
        "🟢 Green: Automated threat scanning",
        "🔵 Blue: Risk assessment & scoring",
        "🟣 Purple: Intelligent prioritization",
        "🟡 Yellow: Remediation planning",
        "🛡️ Impact: Faster vulnerability patching"
      ]
    },
    "cost-optimization": {
      title: "Cost Optimization Agent Flow",
      diagram: `graph TD
    A[Infrastructure Metrics] -->|Input| B[🤖 Cost Agent]

    B -->|Analyze| C[Compute Utilization]
    B -->|Analyze| D[Database Usage]
    B -->|Analyze| E[Storage Consumption]
    B -->|Analyze| F[Network Costs]

    C --> G[🧠 Opportunity Analysis]
    D --> G
    E --> G
    F --> G

    G -->|Compare| H[Actual vs Baseline]
    H -->|Identify| I[Underutilized Resources]
    H -->|Identify| J[Oversized Instances]
    H -->|Identify| J[Reserved Instance Gaps]

    I --> K[Estimate Savings]
    J --> K

    K -->|Prioritize| L{Recommendation Type}

    L -->|Downsize| M[Reduce Instance Size]
    L -->|Consolidate| N[Merge Underutilized]
    L -->|Reserved| O[Reserved Instance Strategy]
    L -->|Spot| P[Use Spot Instances]

    M --> Q[Calculate Monthly Savings]
    N --> Q
    O --> Q
    P --> Q

    Q -->|Organize| R[Phase Implementation Plan]
    R -->|Risk Assess| S[Reliability Impact]

    S -->|Output| T[Recommendations Report]
    T --> U[Cost Savings Potential]
    T --> V[Risk Assessment]
    T --> W[Implementation Timeline]

    U --> X[👥 Present to Finance]
    V --> X
    W --> X

    X -->|Approve| Y[Execute Changes]
    Y -->|Monitor| Z[✅ Cost Reduced]

    style B fill:#4ade80,color:#0f172a
    style G fill:#60a5fa,color:#0f172a
    style L fill:#8b5cf6,color:#0f172a
    style T fill:#fbbf24,color:#0f172a

    AA[❌ Before: Infrastructure costs drift upward] -.->|vs| AB[✅ After: Continuous optimization, 20-40% savings]`,
      legend: [
        "🟢 Green: Automated resource analysis",
        "🔵 Blue: Opportunity identification",
        "🟣 Purple: Recommendation engine",
        "🟡 Yellow: Implementation planning",
        "💰 Impact: Significant cost savings with low risk"
      ]
    },
    "incident-response": {
      title: "Incident Response Agent Flow",
      diagram: `graph TD
    A[🚨 Incident Detected] -->|Alert Triggered| B[🤖 Response Agent]

    B -->|Classify| C[Assess Severity]
    C -->|Impact| D[Service Availability]
    C -->|Scope| E[Affected Users]
    C -->|Duration| F[Estimated Duration]

    D --> G[🧠 Classification Engine]
    E --> G
    F --> G

    G -->|Determine| H{Severity Level}

    H -->|Down| I[🚨 P1: Critical]
    H -->|Degraded| J[⚠️ P2: High]
    H -->|Minor| K[📋 P3: Medium]
    H -->|Trivial| L[✓ P4: Low]

    I --> M[Immediate Escalation]
    J --> M
    K --> M
    L --> M

    M -->|Correlate| N[Check Recent Deployments]
    N -->|Analyze| O[Find Deployment Window]
    O -->|Link| P[Identify Likely Cause]

    P -->|Generate| Q[Incident Response Plan]
    Q -->|Create| R[ServiceNow Ticket]
    Q -->|Alert| S[Notify On-Call Team]

    R --> T[👥 Assign Incident Commander]
    S --> T

    T -->|Execute| U[Immediate Actions]
    U -->|Mitigate| V[Reduce Impact]
    V -->|Root Cause| W[Investigate Root Cause]
    W -->|Fix| X[Deploy Resolution]

    X -->|Verify| Y[Monitor for Stability]
    Y -->|Post-incident| Z[✅ Incident Resolved]

    style B fill:#4ade80,color:#0f172a
    style G fill:#60a5fa,color:#0f172a
    style H fill:#8b5cf6,color:#0f172a
    style Q fill:#fbbf24,color:#0f172a

    AA[❌ Before: Manual triage, 30+ min MTTR] -.->|vs| AB[✅ After: AI classification, 5 min response]`,
      legend: [
        "🟢 Green: Automated incident detection",
        "🔵 Blue: Severity classification",
        "🟣 Purple: Root cause correlation",
        "🟡 Yellow: Response coordination",
        "⏱️ Impact: Reduced MTTR by 80%"
      ]
    }
  };

  const config = diagrams[demoId] || diagrams["workflow-diagnostic"];
  const defaultDiagram = config.diagram;
  const currentDiagram = customDiagram || defaultDiagram;

  // Initialize edited diagram when switching demos
  useEffect(() => {
    setCustomDiagram("");
    setEditedDiagram(defaultDiagram);
    setIsEditMode(false);
  }, [demoId]);

  const handleSaveDiagram = () => {
    try {
      setCustomDiagram(editedDiagram);
      setIsEditMode(false);
      toast.success("Workflow updated! Rendering...");
    } catch (error) {
      toast.error("Invalid diagram syntax");
    }
  };

  const handleResetDiagram = () => {
    setCustomDiagram("");
    setEditedDiagram(defaultDiagram);
    setIsEditMode(false);
    toast.success("Workflow reset to default");
  };

  const handleEditDiagram = () => {
    setEditedDiagram(currentDiagram);
    setIsEditMode(true);
  };

  useEffect(() => {
    const renderMermaid = async () => {
      if (!mermaidRef.current) return;
      
      try {
        // Wait for mermaid to be available
        const waitForMermaid = (): Promise<any> => {
          return new Promise((resolve) => {
            const check = () => {
              if (typeof (window as any).mermaid !== 'undefined') {
                resolve((window as any).mermaid);
              } else {
                setTimeout(check, 50);
              }
            };
            check();
          });
        };
        
        const mermaid = await waitForMermaid();
        
        // Clear any previous content
        mermaidRef.current.innerHTML = '';
        mermaidRef.current.removeAttribute('data-processed');
        
        // Generate unique ID
        const uniqueId = `mermaid-${demoId}-${Date.now()}`;

        // Render the diagram
        const { svg } = await mermaid.render(uniqueId, currentDiagram);
        
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = svg;
        }
      } catch (error) {
        console.error('Mermaid rendering error:', error);
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = `
            <div class="text-destructive p-4">
              <p class="font-semibold">Error rendering diagram</p>
              <p class="text-sm mt-2">Please refresh the page to try again.</p>
            </div>
          `;
        }
      }
    };
    
    // Small delay to ensure component is mounted
    const timeoutId = setTimeout(renderMermaid, 100);
    return () => clearTimeout(timeoutId);
  }, [demoId, currentDiagram]);

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-semibold mb-2">{config.title}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Visualizing the agent workflow: automatic triggers, AI reasoning, and manual interventions
          </p>
        </div>
        <div className="flex gap-2">
          {!isEditMode ? (
            <>
              <Button variant="outline" size="sm" onClick={handleEditDiagram}>
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
              {customDiagram && (
                <Button variant="outline" size="sm" onClick={handleResetDiagram}>
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Reset
                </Button>
              )}
            </>
          ) : (
            <>
              <Button variant="default" size="sm" onClick={handleSaveDiagram}>
                <Eye className="w-4 h-4 mr-1" />
                Preview
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsEditMode(false)}>
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      {isEditMode ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Edit the Mermaid diagram syntax below. See{" "}
            <a
              href="https://mermaid.js.org/syntax/flowchart.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Mermaid documentation
            </a>{" "}
            for syntax help.
          </p>
          <Textarea
            value={editedDiagram}
            onChange={(e) => setEditedDiagram(e.target.value)}
            className="font-mono text-xs min-h-[400px]"
            placeholder="Enter Mermaid diagram syntax..."
          />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg p-6 overflow-x-auto">
          <div ref={mermaidRef} className="mermaid" />
        </div>
      )}

      <div className="space-y-2">
        <h4 className="font-semibold text-sm">Legend:</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          {config.legend.map((item, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
};

export default WorkflowDiagram;
