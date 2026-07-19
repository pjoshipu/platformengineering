import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LogIn, Boxes, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { EMPLOYEES, getEmployee } from '@/idp/identity/directory';
import { resolvePersona, dashboardForPersona } from '@/idp/identity/resolvePersona';

/**
 * Identity-based sign-in. You choose a *person* (as SSO would identify you) —
 * not a role. The platform derives the persona from their profile and drops you
 * into the matching workspace.
 */
const Login = () => {
  const { signInAs } = useAuth();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string>('');

  const selected = selectedId ? getEmployee(selectedId) : undefined;
  const match = selected ? resolvePersona(selected) : undefined;

  const handleLogin = () => {
    if (!selected || !match) return;
    signInAs(selected.id);
    navigate(dashboardForPersona(match.personaId));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="p-2 rounded-xl bg-primary/10">
                <Boxes className="w-7 h-7 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold">Platform IDP</h1>
            <p className="text-muted-foreground">Sign in — we detect your workspace from your profile</p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="identity">Who are you?</Label>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger id="identity" className="mt-2">
                  <SelectValue placeholder="Select your name…" />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYEES.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      <div className="flex flex-col text-left">
                        <span className="font-semibold">{emp.name}</span>
                        <span className="text-xs text-muted-foreground">{emp.title} · {emp.team}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {match && (
              <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                {match.reason}
              </p>
            )}

            <Button onClick={handleLogin} disabled={!selected} className="w-full" size="lg">
              <LogIn className="w-4 h-4 mr-2" />
              Enter Platform
            </Button>
          </div>

          <div className="text-center text-xs text-muted-foreground">
            <p>Demo environment — no actual authentication required</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
