import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, LogIn, Loader2 } from 'lucide-react';
import zantrixLogo from '@/assets/zantrix-logo.png';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: 'Missing credentials',
        description: 'Please enter both email and password.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);
    
    if (result.success) {
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });
      navigate('/');
    } else {
      toast({
        title: 'Login failed',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar items-center justify-center p-12">
        <div className="max-w-md text-center">
          <img src={zantrixLogo} alt="Zantrix" className="h-24 w-auto mx-auto mb-8" />
          <h1 className="text-3xl font-bold text-sidebar-foreground mb-4">
            Zantrix POS System
          </h1>
          <p className="text-sidebar-foreground/70 text-lg">
            Complete Point of Sale solution for construction equipment and hardware retail in Tanzania.
          </p>
          <div className="mt-12 grid grid-cols-2 gap-6 text-left">
            <div className="bg-sidebar-accent/30 rounded-lg p-4">
              <p className="text-sidebar-foreground font-semibold">Inventory Management</p>
              <p className="text-sidebar-foreground/60 text-sm mt-1">Track stock levels in real-time</p>
            </div>
            <div className="bg-sidebar-accent/30 rounded-lg p-4">
              <p className="text-sidebar-foreground font-semibold">Sales Analytics</p>
              <p className="text-sidebar-foreground/60 text-sm mt-1">Comprehensive reports & insights</p>
            </div>
            <div className="bg-sidebar-accent/30 rounded-lg p-4">
              <p className="text-sidebar-foreground font-semibold">Customer CRM</p>
              <p className="text-sidebar-foreground/60 text-sm mt-1">Manage relationships & loyalty</p>
            </div>
            <div className="bg-sidebar-accent/30 rounded-lg p-4">
              <p className="text-sidebar-foreground font-semibold">Multi-Payment</p>
              <p className="text-sidebar-foreground/60 text-sm mt-1">Cash, Card, M-Pesa support</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <img src={zantrixLogo} alt="Zantrix" className="h-16 w-auto mx-auto mb-4" />
          </div>
          
          <div className="rounded-xl border border-border bg-card p-8 shadow-card">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-foreground">Sign in</h2>
              <p className="text-muted-foreground mt-2">Enter your credentials to access the POS system</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@zantrix.co.tz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="h-4 w-4" />
                )}
                Sign in
              </Button>
            </form>

            {/* Demo credentials */}
            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground mb-3">Demo Accounts:</p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between bg-muted/50 rounded p-2">
                  <span className="text-muted-foreground">Admin:</span>
                  <span className="font-mono text-foreground">admin@zantrix.co.tz / admin123</span>
                </div>
                <div className="flex justify-between bg-muted/50 rounded p-2">
                  <span className="text-muted-foreground">Manager:</span>
                  <span className="font-mono text-foreground">manager@zantrix.co.tz / manager123</span>
                </div>
                <div className="flex justify-between bg-muted/50 rounded p-2">
                  <span className="text-muted-foreground">Sales:</span>
                  <span className="font-mono text-foreground">sales@zantrix.co.tz / sales123</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
