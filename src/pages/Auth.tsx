import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, LogIn, Loader2, Shield, Package, BarChart3, Users, Zap, Settings, Store, Building2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getApiBaseUrl } from '@/services/api';

const Auth = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [tin, setTin] = useState('');
  const [currency, setCurrency] = useState('TZS');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [customApiUrl, setCustomApiUrl] = useState(localStorage.getItem('digitsales_api_url') || '');

  const { login, register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSaveApiUrl = () => {
    const trimmed = customApiUrl.trim();
    if (trimmed) {
      localStorage.setItem('digitsales_api_url', trimmed);
      toast({
        title: 'Settings Saved',
        description: 'The backend API URL has been updated successfully. Reloading...',
      });
    } else {
      localStorage.removeItem('digitsales_api_url');
      toast({
        title: 'Settings Reset',
        description: 'Reset backend API URL to defaults. Reloading...',
      });
    }
    setShowSettings(false);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleResetApiUrl = () => {
    localStorage.removeItem('digitsales_api_url');
    setCustomApiUrl('');
    toast({
      title: 'Settings Reset',
      description: 'Reset backend API URL to defaults. Reloading...',
    });
    setShowSettings(false);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'login') {
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
    } else {
      if (!email || !password || !firstName || !lastName || !companyName) {
        toast({
          title: 'Missing fields',
          description: 'Please fill in all required fields.',
          variant: 'destructive',
        });
        return;
      }

      setIsSubmitting(true);
      const result = await register({ email, password, firstName, lastName, phone, companyName, tin, currency });
      setIsSubmitting(false);

      if (result.success) {
        toast({
          description: 'Welcome to your Dashboard.',
        });
        navigate('/');
      } else {
        toast({
          title: 'Registration failed',
          description: result.error || 'An unexpected error occurred. Please check your connection.',
          variant: 'destructive',
        });
      }
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
      <div className="hidden lg:flex lg:w-[50%] relative overflow-hidden">
        {/* Background with modern gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, hsl(0 0% 8%) 0%, hsl(0 0% 5%) 50%, hsl(0 85% 15%) 100%)',
          }}
        />

        {/* Animated decorative elements */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-primary/10 rounded-full opacity-20" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center p-12 xl:p-24">
          <div className="max-w-md">
            <h2 className="text-4xl xl:text-6xl font-display font-bold text-white mb-6 leading-tight flex items-center gap-3">
              <Package className="h-12 w-12 text-primary" />
              Digitsales POS
            </h2>

            <h1 className="text-4xl xl:text-5xl font-display font-bold text-white mb-6 leading-tight">
              Powerful POS for
              <span className="block text-gradient bg-gradient-to-r from-primary to-accent">Modern Retail</span>
            </h1>

            <p className="text-lg text-white/70 mb-12 leading-relaxed">
              The most advanced retail management system designed to scale your business efficiently.
            </p>

            <div className="grid grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className="group p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md transition-all duration-300 hover:bg-white/10 hover:border-primary/30 animate-fade-in"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-white font-bold text-sm mb-1.5">{feature.title}</p>
                  <p className="text-white/50 text-xs leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-muted/30">
        <div className="w-full max-w-[440px]">
          {/* Mobile logo */}
          <div className="lg:hidden mb-12 text-center">
            <h2 className="text-2xl font-display font-bold text-foreground">Digitsales POS</h2>
          </div>

          <div className="rounded-3xl border border-border bg-card shadow-2xl overflow-hidden animate-scale-in">
            {/* Header Tabs */}
            <div className="flex border-b border-border bg-muted/40 p-1">
              <button
                onClick={() => setMode('login')}
                className={`flex-1 py-3 text-sm font-semibold rounded-2xl transition-all duration-300 ${mode === 'login'
                  ? 'bg-card text-foreground shadow-sm ring-1 ring-border'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setMode('register')}
                className={`flex-1 py-3 text-sm font-semibold rounded-2xl transition-all duration-300 ${mode === 'register'
                  ? 'bg-card text-foreground shadow-sm ring-1 ring-border'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                Create Account
              </button>
            </div>

            <div className="p-8 sm:p-10">
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Shield className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-xs font-bold text-primary uppercase tracking-widest">Enterprise Security</span>
                  </div>
                  <Dialog open={showSettings} onOpenChange={setShowSettings}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md bg-card border-border shadow-2xl rounded-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-lg font-bold">API Server Settings</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="customApiUrl" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Backend API URL</Label>
                          <Input
                            id="customApiUrl"
                            placeholder=""
                            value={customApiUrl}
                            onChange={(e) => setCustomApiUrl(e.target.value)}
                            className="h-11 rounded-xl bg-muted/50 border-border"
                          />
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Specify the full URL to the backend API, including the prefix (usually <code>/api/v1</code>). Leave blank or reset to use the default configuration.
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={handleResetApiUrl} className="rounded-xl">
                          Reset to Default
                        </Button>
                        <Button type="button" onClick={handleSaveApiUrl} className="rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-bold">
                          Save Settings
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <h2 className="text-2xl font-display font-bold text-foreground">
                  {mode === 'login' ? 'Welcome back' : 'Start your journey'}
                </h2>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  {mode === 'login'
                    ? 'Enter your credentials to access your dashboard and manage your branch.'
                    : 'Join hundreds of retailers across Tanzania. Fill in the details to create your account.'
                  }
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'login' ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="admin@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        className="h-12 rounded-xl bg-muted/50 border-border focus:bg-card"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between ml-1">
                        <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Password</Label>
                        <button type="button" className="text-xs font-semibold text-primary hover:underline">Forgot password?</button>
                      </div>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          autoComplete="current-password"
                          className="h-12 rounded-xl bg-muted/50 border-border focus:bg-card pr-12"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-6">
                    {/* Section 1: Shop Registration */}
                    <div className="rounded-2xl border border-border bg-card/40 p-4 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                      <div className="flex items-center gap-2 border-b border-border/60 pb-2 mb-2">
                        <Store className="h-5 w-5 text-primary animate-pulse" />
                        <h3 className="text-sm font-bold text-foreground">1. Shop / Store Registration</h3>
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label htmlFor="companyName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Shop / Company Name *</Label>
                          <Input
                            id="companyName"
                            placeholder="e.g. My Retail Shop"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="h-11 rounded-xl bg-muted/30 border-border focus:bg-card"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label htmlFor="tin" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">TIN Number (Optional)</Label>
                            <Input
                              id="tin"
                              placeholder="e.g. 123-456-789"
                              value={tin}
                              onChange={(e) => setTin(e.target.value)}
                              className="h-11 rounded-xl bg-muted/30 border-border focus:bg-card"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="currency" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Store Currency</Label>
                            <Input
                              id="currency"
                              value="TZS (Tanzanian Shilling)"
                              disabled
                              className="h-11 rounded-xl bg-muted/10 border-border cursor-not-allowed font-medium text-foreground/70"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Account Owner Details */}
                    <div className="rounded-2xl border border-border bg-card/40 p-4 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                      <div className="flex items-center gap-2 border-b border-border/60 pb-2 mb-2">
                        <Users className="h-5 w-5 text-primary" />
                        <h3 className="text-sm font-bold text-foreground">2. Account Owner Details</h3>
                      </div>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label htmlFor="firstName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">First Name *</Label>
                            <Input
                              id="firstName"
                              placeholder="John"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              className="h-11 rounded-xl bg-muted/30 border-border focus:bg-card"
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="lastName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Last Name *</Label>
                            <Input
                              id="lastName"
                              placeholder="Doe"
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              className="h-11 rounded-xl bg-muted/30 border-border focus:bg-card"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Email Address *</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="owner@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            className="h-11 rounded-xl bg-muted/30 border-border focus:bg-card"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Phone Number (Optional)</Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+255 --- --- ---"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="h-11 rounded-xl bg-muted/30 border-border focus:bg-card"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Password *</Label>
                          <div className="relative">
                            <Input
                              id="password"
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              autoComplete="new-password"
                              className="h-11 rounded-xl bg-muted/30 border-border focus:bg-card pr-12"
                              required
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1 ml-1">
                            Must be 8+ chars with uppercase, lowercase, number & symbol.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4">
                  <Button
                    type="submit"
                    variant="brand"
                    size="lg"
                    className="w-full gap-2 h-14 rounded-2xl text-base font-bold shadow-lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <LogIn className="h-5 w-5" />
                    )}
                    {mode === 'login' ? 'Sign in to Dashboard' : 'Create Business Account'}
                  </Button>
                </div>
              </form>

              <p className="mt-8 text-center text-sm text-muted-foreground">
                {mode === 'login' ? (
                  <>
                    Don't have an account yet?{' '}
                    <button
                      onClick={() => setMode('register')}
                      className="text-primary font-bold hover:underline"
                    >
                      Register your branch
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button
                      onClick={() => setMode('login')}
                      className="text-primary font-bold hover:underline"
                    >
                      Sign in here
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground/60 flex items-center justify-center gap-2">
              <span className="h-px w-8 bg-border" />
              © 2024 Digitsales POS Systems
              <span className="h-px w-8 bg-border" />
            </p>
            <div className="flex justify-center gap-4 mt-4">
              <button className="text-[10px] text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest font-bold">Privacy Policy</button>
              <button className="text-[10px] text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest font-bold">Terms of Service</button>
              <button className="text-[10px] text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest font-bold">Help Center</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
