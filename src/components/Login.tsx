import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LogIn, Boxes } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PERSONA_MODULES } from '@/idp/personas/registry';

/**
 * Persona-based login. Choosing an experience logs you in as that persona and
 * drops you straight into the IDP scoped to your role — you only see your own
 * screens (plus the Agentic Experience curated for that role).
 */
const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [selectedPersona, setSelectedPersona] = useState<string>('');

  const handleLogin = () => {
    const persona = PERSONA_MODULES.find((p) => p.id === selectedPersona);
    if (!persona) return;
    login({ persona: persona.id, name: persona.label });
    const first = persona.nav[0]?.path ?? 'dashboard';
    navigate(`/${persona.id}/${first}`);
  };

  const selected = PERSONA_MODULES.find((p) => p.id === selectedPersona);

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
            <p className="text-muted-foreground">Choose your experience to sign in</p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="persona">Experience</Label>
              <Select value={selectedPersona} onValueChange={setSelectedPersona}>
                <SelectTrigger id="persona" className="mt-2">
                  <SelectValue placeholder="Select your role…" />
                </SelectTrigger>
                <SelectContent>
                  {PERSONA_MODULES.map((persona) => {
                    const Icon = persona.icon;
                    return (
                      <SelectItem key={persona.id} value={persona.id}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-primary" />
                          <div>
                            <div className="font-semibold">{persona.label}</div>
                            <div className="text-xs text-muted-foreground">{persona.blurb}</div>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {selected && (
              <p className="text-xs text-muted-foreground">
                You'll land in the {selected.label} workspace with an Agentic Experience tailored to that role.
              </p>
            )}

            <Button onClick={handleLogin} disabled={!selectedPersona} className="w-full" size="lg">
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
