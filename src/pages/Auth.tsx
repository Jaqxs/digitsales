import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, LogIn, Loader2, Shield, Package, BarChart3, Users, Zap } from 'lucide-react';
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

  const features = [
    { icon: Package, title: 'Inventory Management', desc: 'Real-time stock tracking & alerts' },
    { icon: BarChart3, title: 'Sales Analytics', desc: 'Comprehensive reports & insights' },
    { icon: Users, title: 'Customer CRM', desc: 'Manage relationships & loyalty' },
    { icon: Zap, title: 'Quick Checkout', desc: 'Fast POS with multi-payment' },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        {/* Background with gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, hsl(0 0% 8%) 0%, hsl(0 0% 5%) 50%, hsl(0 85% 15%) 100%)',
          }}
        />
        
        {/* Decorative elements */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-primary/10 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-primary/5 rounded-full" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center p-12 xl:p-20">
          <div className="max-w-lg">
            <img src={zantrixLogo} alt="Zantrix" className="h-20 w-auto mb-10 drop-shadow-2xl" />
            
            <h1 className="text-4xl xl:text-5xl font-display font-bold text-white mb-4 leading-tight">
              Powerful POS for
              <span className="block text-gradient bg-gradient-to-r from-primary to-orange-400">Construction Retail</span>
            </h1>
            
            <p className="text-lg text-white/70 mb-12 leading-relaxed">
              Complete point of sale solution designed for Tanzania's construction equipment and hardware retail industry.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div 
                  key={feature.title}
                  className="group p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-primary/30 animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-white font-semibold text-sm mb-1">{feature.title}</p>
                  <p className="text-white/50 text-xs">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-10 text-center">
            <img src={zantrixLogo} alt="Zantrix" className="h-16 w-auto mx-auto mb-4" />
            <h2 className="text-xl font-display font-bold text-foreground">Zantrix POS System</h2>
          </div>
          
          <div className="rounded-2xl border border-border bg-card p-8 shadow-elevated animate-scale-in">
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-primary" />
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">Secure Login</span>
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground">Welcome back</h2>
              <p className="text-muted-foreground mt-2">Enter your credentials to access the system</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@zantrix.co.tz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="h-12 rounded-xl border-2 transition-all duration-200 focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="h-12 rounded-xl border-2 transition-all duration-200 focus:border-primary pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                variant="glow"
                size="lg"
                className="w-full gap-2 h-12 rounded-xl text-base" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <LogIn className="h-5 w-5" />
                )}
                Sign in to Dashboard
              </Button>
            </form>

            {/* Demo credentials */}
            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                Demo Accounts Available
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center bg-muted/50 rounded-lg p-3 border border-border/50 transition-colors hover:border-primary/30">
                  <span className="text-muted-foreground font-medium">Admin</span>
                  <span className="font-mono text-foreground bg-background px-2 py-1 rounded">admin@zantrix.co.tz / admin123</span>
                </div>
                <div className="flex justify-between items-center bg-muted/50 rounded-lg p-3 border border-border/50 transition-colors hover:border-primary/30">
                  <span className="text-muted-foreground font-medium">Manager</span>
                  <span className="font-mono text-foreground bg-background px-2 py-1 rounded">manager@zantrix.co.tz / manager123</span>
                </div>
                <div className="flex justify-between items-center bg-muted/50 rounded-lg p-3 border border-border/50 transition-colors hover:border-primary/30">
                  <span className="text-muted-foreground font-medium">Sales</span>
                  <span className="font-mono text-foreground bg-background px-2 py-1 rounded">sales@zantrix.co.tz / sales123</span>
                </div>
              </div>
            </div>
          </div>
          
          <p className="text-center text-xs text-muted-foreground mt-6">
            © 2024 Zantrix Group Company. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
