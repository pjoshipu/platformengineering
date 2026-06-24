import { useState } from "react";
import {
  Terminal,
  GitBranch,
  Shield,
  Users,
  LogOut,
  UserCog,
  Flag,
  DollarSign,
  AlertTriangle
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import DemoRunner from "@/components/DemoRunner";
import ProfileManagementDialog from "@/components/ProfileManagementDialog";
import { useAuth } from "@/contexts/AuthContext";

const AdminView = () => {
  const { user, logout } = useAuth();
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);

  const demos = [
    {
      id: "developer-onboarding",
      title: "Developer Onboarding",
      description: "Persona-specific checklist for new hires that accelerates ramp time from days to hours.",
      icon: Users,
      color: "tech-orange",
      problem: "Manual onboarding checklists are generic and time-consuming",
      solution: "AI generates personalized plans based on experience level and background",
      pythonFile: "section1_onboarding.py",
    },
    {
      id: "workflow-diagnostic",
      title: "CI/CD Diagnostic",
      description: "Automatically diagnoses failed CI/CD workflows and provides root cause analysis with suggested fixes.",
      icon: Terminal,
      color: "primary",
      problem: "Cryptic error messages in failed workflows waste developer time",
      solution: "Agent analyzes logs, context, and provides actionable explanations",
      pythonFile: "section2_diagnostic.py",
    },
    {
      id: "release-readiness",
      title: "Release Readiness",
      description: "Evaluates quality gates (test coverage, performance, security) to make intelligent release/rollback decisions.",
      icon: GitBranch,
      color: "tech-cyan",
      problem: "Binary pass/fail gates don't capture nuanced deployment risks",
      solution: "Contextual evaluation with confidence scores and full rationale",
      pythonFile: "section3_release_readiness.py",
    },
    {
      id: "feature-flag-lifecycle",
      title: "Feature Flags",
      description: "Detect stale flags, enforce hygiene, recommend cleanup and consolidation.",
      icon: Flag,
      color: "accent",
      problem: "Stale feature flags accumulate technical debt and create confusion",
      solution: "Agent identifies cleanup opportunities and prevents flag sprawl",
      pythonFile: "section4_feature_flags.py",
    },
    {
      id: "security-posture",
      title: "Security Posture",
      description: "CVE triage, secret scanning, IaC drift detection with prioritized remediation.",
      icon: Shield,
      color: "destructive",
      problem: "Manual security reviews are slow and miss context-specific risks",
      solution: "Automated scanning with intelligent prioritization and recommendations",
      pythonFile: "section5_security.py",
    },
    {
      id: "cost-optimization",
      title: "Cost Optimization",
      description: "Identify underutilized resources, recommend rightsizing with savings estimates.",
      icon: DollarSign,
      color: "green",
      problem: "Infrastructure costs drift upward without continuous optimization",
      solution: "Agent finds rightsizing opportunities and quantifies savings",
      pythonFile: "section6_cost.py",
    },
    {
      id: "incident-response",
      title: "Incident Response",
      description: "P1-P4 classification, deployment correlation, ServiceNow ticket pre-fill.",
      icon: AlertTriangle,
      color: "destructive",
      problem: "Manual incident triage slows response time and misses context",
      solution: "Automated classification with deployment correlation and escalation",
      pythonFile: "section7_incident.py",
    },
    {
      id: "developer-portal",
      title: "Developer Portal",
      description: "AI-driven self-service endpoint that understands developer needs and provides guidance.",
      icon: Users,
      color: "tech-orange",
      problem: "Manual documentation hunts slow developer productivity",
      solution: "Conversational AI provides personalized context-aware help",
      pythonFile: "section8_developer_portal.py",
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
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-8 overflow-y-auto">
            {demos.map((demo) => (
              <TabsTrigger key={demo.id} value={demo.id} className="text-xs">
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
    </div>
  );
};

export default AdminView;
