import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, User, LogIn } from 'lucide-react';
import { useAuth, DeveloperUser, AdminUser } from '@/contexts/AuthContext';

const DEVELOPER_PROFILES = {
  'kevin-backend': { name: 'Kevin Johnson', team: 'Backend', experience: 'intermediate' },
  'sarah-senior': { name: 'Sarah Chen', team: 'Platform', experience: 'advanced' },
  'mike-frontend': { name: 'Mike Rodriguez', team: 'Frontend', experience: 'intermediate' },
  'priya-platform': { name: 'Priya Sharma', team: 'Platform', experience: 'expert' },
  'emma-mobile': { name: 'Emma Davis', team: 'Mobile', experience: 'advanced' },
  'james-ios': { name: 'James Park', team: 'Mobile (iOS)', experience: 'intermediate' },
  'lisa-android': { name: 'Lisa Wang', team: 'Mobile (Android)', experience: 'advanced' },
  'tom-junior': { name: 'Tom Wilson', team: 'Backend', experience: 'beginner' },
  'alex-fullstack': { name: 'Alex Kumar', team: 'Full Stack', experience: 'advanced' },
};

const Login = () => {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'admin' | 'developer' | ''>('');
  const [selectedProfile, setSelectedProfile] = useState<string>('');

  const handleLogin = () => {
    if (selectedRole === 'admin') {
      const adminUser: AdminUser = {
        role: 'admin',
        name: 'Admin User',
      };
      login(adminUser);
    } else if (selectedRole === 'developer' && selectedProfile) {
      const profile = DEVELOPER_PROFILES[selectedProfile as keyof typeof DEVELOPER_PROFILES];
      const developerUser: DeveloperUser = {
        role: 'developer',
        profileId: selectedProfile,
        name: profile.name,
        team: profile.team,
        experience: profile.experience,
      };
      login(developerUser);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Internal Developer Platform</h1>
          <p className="text-muted-foreground">Sign in to continue</p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="role">Select Role</Label>
            <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as 'admin' | 'developer')}>
              <SelectTrigger id="role" className="mt-2">
                <SelectValue placeholder="Choose your role..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <div>
                      <div className="font-semibold">Admin</div>
                      <div className="text-xs text-muted-foreground">Full platform access</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="developer">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    <div>
                      <div className="font-semibold">Developer</div>
                      <div className="text-xs text-muted-foreground">Personal developer portal</div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedRole === 'developer' && (
            <div>
              <Label htmlFor="profile">Select Your Profile</Label>
              <Select value={selectedProfile} onValueChange={setSelectedProfile}>
                <SelectTrigger id="profile" className="mt-2">
                  <SelectValue placeholder="Choose your profile..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  {Object.entries(DEVELOPER_PROFILES).map(([key, profile]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex flex-col">
                        <div className="font-medium">{profile.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {profile.team} • {profile.experience}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button
            onClick={handleLogin}
            disabled={!selectedRole || (selectedRole === 'developer' && !selectedProfile)}
            className="w-full"
            size="lg"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Sign In
          </Button>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          <p>Demo environment - No actual authentication required</p>
        </div>
      </Card>
      </div>
    </div>
  );
};

export default Login;
