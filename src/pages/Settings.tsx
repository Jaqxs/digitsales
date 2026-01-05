import { MainLayout, PageHeader, PageContent } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Bell, Shield, Printer, Globe, Save, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import zantrixLogo from '@/assets/zantrix-logo.png';
import { api } from '@/services/api';

import { useSettingsStore } from '@/stores/settingsStore';

const Settings = () => {
  const { toast } = useToast();
  const { business, notifications, pos, security, updateBusiness, updateNotifications, updatePos, updateSecurity } = useSettingsStore();

  const handleSave = () => {
    toast({
      title: 'Settings saved',
      description: 'Your changes have been saved successfully.',
    });
  };

  const handleClearSales = async () => {
    if (confirm('Are you sure you want to delete ALL sales? This cannot be undone.')) {
      try {
        await api.sales.deleteAllSales();
        toast({
          title: 'Success',
          description: 'All sales data has been cleared.'
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to clear sales data.',
          variant: 'destructive'
        });
      }
    }
  };

  return (
    <MainLayout>
      <PageContent>
        <PageHeader title="Settings" description="Configure your POS system preferences" />

        <Tabs defaultValue="business" className="mt-6">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="business">Business</TabsTrigger>
            <TabsTrigger value="notifications">Alerts</TabsTrigger>
            <TabsTrigger value="pos">POS</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          {/* Business Settings */}
          <TabsContent value="business" className="mt-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Business Information</h3>
                  <p className="text-sm text-muted-foreground">Update your company details</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <img src={zantrixLogo} alt="Zantrix Logo" className="h-16 w-auto" />
                  <Button variant="outline">Change Logo</Button>
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input
                      id="businessName"
                      value={business.name}
                      onChange={(e) => updateBusiness({ name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tradingName">Trading Name</Label>
                    <Input
                      id="tradingName"
                      value={business.tradingName}
                      onChange={(e) => updateBusiness({ tradingName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tinNumber">TIN Number</Label>
                    <Input
                      id="tinNumber"
                      value={business.tin}
                      onChange={(e) => updateBusiness({ tin: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vatNumber">VAT Number</Label>
                    <Input
                      id="vatNumber"
                      value={business.vatNumber}
                      onChange={(e) => updateBusiness({ vatNumber: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={business.phone}
                      onChange={(e) => updateBusiness({ phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={business.email}
                      onChange={(e) => updateBusiness({ email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={business.address}
                      onChange={(e) => updateBusiness({ address: e.target.value })}
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={business.currency}
                      onValueChange={(value) => updateBusiness({ currency: value })}
                    >
                      <SelectTrigger id="currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TZS">TZS - Tanzanian Shilling</SelectItem>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vatRate">VAT Rate (%)</Label>
                    <Input
                      id="vatRate"
                      type="number"
                      value={business.vatRate}
                      onChange={(e) => updateBusiness({ vatRate: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSave} className="gap-2">
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications" className="mt-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-warning-light flex items-center justify-center">
                  <Bell className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Notification Preferences</h3>
                  <p className="text-sm text-muted-foreground">Configure alerts and notifications</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Low Stock Alerts</p>
                    <p className="text-sm text-muted-foreground">Get notified when stock is low</p>
                  </div>
                  <Switch
                    checked={notifications.lowStock}
                    onCheckedChange={(checked) => updateNotifications({ lowStock: checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Daily Sales Summary</p>
                    <p className="text-sm text-muted-foreground">Receive daily sales report via email</p>
                  </div>
                  <Switch
                    checked={notifications.dailySales}
                    onCheckedChange={(checked) => updateNotifications({ dailySales: checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">New Order Notifications</p>
                    <p className="text-sm text-muted-foreground">Alert on new customer orders</p>
                  </div>
                  <Switch
                    checked={notifications.newOrders}
                    onCheckedChange={(checked) => updateNotifications({ newOrders: checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">SMS Notifications</p>
                    <p className="text-sm text-muted-foreground">Send alerts via SMS</p>
                  </div>
                  <Switch
                    checked={notifications.smsAlerts}
                    onCheckedChange={(checked) => updateNotifications({ smsAlerts: checked })}
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSave} className="gap-2">
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* POS Settings */}
          <TabsContent value="pos" className="mt-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-info-light flex items-center justify-center">
                  <Printer className="h-5 w-5 text-info" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">POS Configuration</h3>
                  <p className="text-sm text-muted-foreground">Point of sale settings</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Auto-print Receipts</p>
                    <p className="text-sm text-muted-foreground">Print receipt after each sale</p>
                  </div>
                  <Switch
                    checked={pos.autoPrint}
                    onCheckedChange={(checked) => updatePos({ autoPrint: checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Include VAT in Prices</p>
                    <p className="text-sm text-muted-foreground">Display prices with VAT included</p>
                  </div>
                  <Switch
                    checked={pos.includeVat}
                    onCheckedChange={(checked) => updatePos({ includeVat: checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Require Customer for Sales</p>
                    <p className="text-sm text-muted-foreground">Mandate customer selection</p>
                  </div>
                  <Switch
                    checked={pos.requireCustomer}
                    onCheckedChange={(checked) => updatePos({ requireCustomer: checked })}
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="defaultPayment">Default Payment Method</Label>
                  <Select
                    value={pos.defaultPayment}
                    onValueChange={(value) => updatePos({ defaultPayment: value })}
                  >
                    <SelectTrigger id="defaultPayment" className="w-full sm:w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="mpesa">M-Pesa</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSave} className="gap-2">
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="mt-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-destructive-light flex items-center justify-center">
                  <Shield className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Security Settings</h3>
                  <p className="text-sm text-muted-foreground">Manage access and security</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">Add extra security to admin accounts</p>
                  </div>
                  <Switch
                    checked={security.twoFactor}
                    onCheckedChange={(checked) => updateSecurity({ twoFactor: checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Session Timeout</p>
                    <p className="text-sm text-muted-foreground">Auto-logout after inactivity</p>
                  </div>
                  <Select
                    value={security.sessionTimeout}
                    onValueChange={(value) => updateSecurity({ sessionTimeout: value })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="never">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Audit Logging</p>
                    <p className="text-sm text-muted-foreground">Track all system actions</p>
                  </div>
                  <Switch
                    checked={security.auditLogging}
                    onCheckedChange={(checked) => updateSecurity({ auditLogging: checked })}
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSave} className="gap-2">
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                </div>

                <Separator />

                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Trash2 className="h-5 w-5 text-destructive" />
                    <h4 className="font-semibold text-destructive">Danger Zone</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Irreversible actions. Please be certain.
                  </p>
                  <Button variant="destructive" onClick={handleClearSales}>
                    Clear All Sales Data
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </PageContent>
    </MainLayout>
  );
};

export default Settings;
