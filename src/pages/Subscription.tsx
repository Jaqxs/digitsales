import React from 'react';
import { MainLayout, PageHeader, PageContent } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, CreditCard, Shield, Zap } from 'lucide-react';

const Subscription = () => {
  return (
    <MainLayout>
      <PageContent>
        <PageHeader 
          title="Subscription & Billing" 
          description="Manage your system plan, billing cycle, and upgrades"
        />

        <div className="grid gap-6 mt-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Free Tier */}
          <div className="rounded-xl border border-border bg-card p-6 flex flex-col relative opacity-70">
            <h3 className="text-xl font-bold text-foreground">Basic</h3>
            <div className="mt-4 flex items-baseline text-3xl font-extrabold text-foreground">
              Tsh 0
              <span className="ml-1 text-sm font-medium text-muted-foreground">/mo</span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Essential POS features for small businesses just getting started.
            </p>
            <ul className="mt-6 space-y-3 flex-1">
              {['Single User', 'Up to 100 Products', 'Basic Reports', 'Email Support'].map((feature) => (
                <li key={feature} className="flex gap-2">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm text-foreground">{feature}</span>
                </li>
              ))}
            </ul>
            <Button variant="outline" className="mt-8 w-full" disabled>
              Downgrade
            </Button>
          </div>

          {/* Pro Tier (Current) */}
          <div className="rounded-xl border-2 border-primary bg-card p-6 flex flex-col relative shadow-xl shadow-primary/10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground hover:bg-primary font-bold tracking-widest px-3 py-1">
                CURRENT PLAN
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-bold text-foreground">Professional</h3>
            </div>
            <div className="mt-4 flex items-baseline text-3xl font-extrabold text-foreground">
              Tsh 50,000
              <span className="ml-1 text-sm font-medium text-muted-foreground">/mo</span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Advanced features and multi-user support for growing retail stores.
            </p>
            <ul className="mt-6 space-y-3 flex-1">
              {[
                'Up to 5 Users',
                'Unlimited Products',
                'Advanced Analytics',
                'Priority Support',
                'Stock Management',
                'Role-based Permissions'
              ].map((feature) => (
                <li key={feature} className="flex gap-2">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm text-foreground font-medium">{feature}</span>
                </li>
              ))}
            </ul>
            <Button className="mt-8 w-full" variant="outline">
              Manage Billing
            </Button>
          </div>

          {/* Enterprise Tier */}
          <div className="rounded-xl border border-border bg-card p-6 flex flex-col relative">
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-accent" />
              <h3 className="text-xl font-bold text-foreground">Enterprise</h3>
            </div>
            <div className="mt-4 flex items-baseline text-3xl font-extrabold text-foreground">
              Tsh 150,000
              <span className="ml-1 text-sm font-medium text-muted-foreground">/mo</span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Full-scale solution for multiple branches and high-volume sales.
            </p>
            <ul className="mt-6 space-y-3 flex-1">
              {[
                'Unlimited Users',
                'Multiple Branches',
                'API Integration',
                'Dedicated Account Manager',
                'Custom Reporting',
                '24/7 Phone Support'
              ].map((feature) => (
                <li key={feature} className="flex gap-2">
                  <Check className="h-4 w-4 text-accent shrink-0" />
                  <span className="text-sm text-foreground">{feature}</span>
                </li>
              ))}
            </ul>
            <Button className="mt-8 w-full bg-accent text-white hover:bg-accent/90">
              Upgrade Now
            </Button>
          </div>
        </div>

        {/* Billing Information Section */}
        <div className="mt-8 rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-6 border-b border-border flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-foreground">Payment Methods</h3>
              <p className="text-sm text-muted-foreground mt-1">Manage your connected credit cards and mobile money accounts.</p>
            </div>
            <Button variant="outline" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Add Method
            </Button>
          </div>
          <div className="p-6 bg-muted/20">
            <div className="flex items-center justify-between p-4 bg-background border border-border rounded-lg max-w-md">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-primary/10 rounded-md flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Visa ending in **** 4242</p>
                  <p className="text-xs text-muted-foreground">Expires 12/2027</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-success/10 text-success border-success/20">Default</Badge>
            </div>
          </div>
        </div>

      </PageContent>
    </MainLayout>
  );
};

export default Subscription;
