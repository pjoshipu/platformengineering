import { Bot, LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import DemoRunner from "@/components/DemoRunner";
import { useAuth, DeveloperUser } from "@/contexts/AuthContext";

const DeveloperView = () => {
  const { user, logout } = useAuth();
  const developerUser = user as DeveloperUser;

  const demo = {
    id: "developer-portal",
    title: "AI Copilot",
    description: "Your personal AI assistant for platform questions and development guidance",
    icon: Bot,
    color: "tech-orange",
    problem: "Waiting for answers and documentation hunts slow you down",
    solution: "Get instant, personalized answers tailored to your experience and tech stack",
    pythonFile: "section4_developer_portal.py",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Developer Header */}
      <div className="border-b border-border bg-gradient-to-r from-primary/10 to-purple-500/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/20">
                <Bot className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Welcome back, {developerUser.name}!</h2>
                <p className="text-sm text-muted-foreground">
                  {developerUser.team} • {developerUser.experience} level
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted">
                <UserIcon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Developer Access</span>
              </div>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <section className="container mx-auto px-6 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Your Personal AI Copilot</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Ask me anything about deployment, debugging, best practices, or platform questions.
            I'm here to help you ship faster with context-aware guidance tailored to your experience.
          </p>
        </div>
      </section>

      {/* Demo Runner Section - Only Developer Portal */}
      <section className="container mx-auto px-6 pb-16">
        <DemoRunner
          demo={demo}
          onClose={() => {}}
          userRole="developer"
          developerProfileId={developerUser.profileId}
        />
      </section>
    </div>
  );
};

export default DeveloperView;
