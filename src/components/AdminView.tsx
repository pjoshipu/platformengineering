import { useState } from "react";
import {
  Terminal,
  GitBranch,
  Shield,
  Users,
  LogOut,
  UserCog
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import DemoRunner from "@/components/DemoRunner";
import ProfileManagementDialog from "@/components/ProfileManagementDialog";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";

const AdminView = () => {
  const { user, logout } = useAuth();
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);

  const demos = [
    {
      id: "developer-portal",
      title: "Developer Portal Agent",
      description: "AI-driven onboarding and self-service endpoint that understands developer needs and provides intelligent guidance.",
      icon: Shield,
      color: "tech-orange",
      problem: "Manual onboarding and documentation hunts slow developer productivity",
      solution: "Conversational AI provides personalized onboarding and context-aware help",
      pythonFile: "section4_developer_portal.py",
    },
    {
      id: "workflow-diagnostic",
      title: "Workflow Diagnostic Agent",
      description: "Automatically diagnoses failed CI/CD workflows and provides root cause analysis with suggested fixes.",
      icon: Terminal,
      color: "primary",
      problem: "Cryptic error messages in failed workflows waste developer time",
      solution: "Agent analyzes logs, context, and provides actionable explanations",
      pythonFile: "section1_diagnostic_agent.py",
    },
    {
      id: "release-readiness",
      title: "Release Readiness Agent",
      description: "Evaluates quality gates (test coverage, performance, security) to make intelligent release/rollback decisions.",
      icon: GitBranch,
      color: "tech-cyan",
      problem: "Binary pass/fail gates don't capture nuanced deployment risks",
      solution: "Contextual evaluation with confidence scores and full rationale",
      pythonFile: "section2_release_readiness.py",
    },
    {
      id: "multi-agent",
      title: "Multi-Agent Orchestration",
      description: "Cost optimizer and incident responder agents coordinate to balance efficiency with reliability.",
      icon: Users,
      color: "accent",
      problem: "Siloed optimization leads to cost overruns or service degradation",
      solution: "Specialized agents communicate and resolve conflicts intelligently",
      pythonFile: "section3_multi_agent.py",
    },
  ];

  const [selectedDemo, setSelectedDemo] = useState<string>(demos[0]?.id || "");

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-primary" />
              <div>
                <h2 className="font-semibold">Admin Dashboard</h2>
                <p className="text-xs text-muted-foreground">Logged in as {user?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsProfileDialogOpen(true)}>
                <UserCog className="w-4 h-4 mr-2" />
                Manage Profiles
              </Button>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <section className="container mx-auto px-6 py-16">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold">Internal Developer Platform</h1>
          <p className="text-muted-foreground mt-2">Full admin access to all agents and workflows</p>
        </div>

        <Tabs value={selectedDemo} onValueChange={setSelectedDemo} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            {demos.map((demo) => (
              <TabsTrigger key={demo.id} value={demo.id}>
                {demo.title}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </section>

      {/* Demo Runner Section */}
      {selectedDemo && (
        <section id="demo-runner-section" className="container mx-auto px-6 py-16 border-t border-border">
          <DemoRunner
            demo={demos.find((d) => d.id === selectedDemo)!}
            onClose={() => setSelectedDemo(demos[0]?.id || "")}
            userRole="admin"
          />
        </section>
      )}

      {/* Profile Management Dialog */}
      <ProfileManagementDialog
        open={isProfileDialogOpen}
        onOpenChange={setIsProfileDialogOpen}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default AdminView;
