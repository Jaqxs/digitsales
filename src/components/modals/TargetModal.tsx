import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Employee } from '@/types/pos';
import { useDataStore } from '@/stores/dataStore';
import { useToast } from '@/hooks/use-toast';
import { Target } from 'lucide-react';

interface TargetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  onSuccess?: () => void;
}

const TargetModal = ({ open, onOpenChange, employee, onSuccess }: TargetModalProps) => {
  const { toast } = useToast();
  const { updateEmployee } = useDataStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    targetType: 'sales_revenue' as const,
    targetValue: '',
    period: 'monthly' as const,
    startDate: '',
    endDate: '',
    commissionRate: '',
    bonusAmount: '',
  });

  // Set default dates when modal opens
  useEffect(() => {
    if (open) {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      setFormData(prev => ({
        ...prev,
        startDate: startOfMonth.toISOString().split('T')[0],
        endDate: endOfMonth.toISOString().split('T')[0],
      }));
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;

    if (!formData.targetValue) {
      toast({
        title: 'Validation Error',
        description: 'Please set a target value',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // We are simplifying to just update the main sales target and commission
      // since the simple store doesn't support complex target objects yet.
      await updateEmployee(employee.id, {
        salesTarget: parseFloat(formData.targetValue),
        commission: formData.commissionRate ? parseFloat(formData.commissionRate) : undefined,
      });

      toast({
        title: 'Success',
        description: 'Target updated successfully',
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update target',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Set Target for {employee?.name}
          </DialogTitle>
          <DialogDescription>
            Set performance targets and incentives for this employee.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="targetType">Target Type</Label>
              <Select
                value={formData.targetType}
                onValueChange={(value) => handleInputChange('targetType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select target type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales_revenue">Sales Revenue</SelectItem>
                  <SelectItem value="sales_quantity">Sales Quantity</SelectItem>
                  <SelectItem value="customer_acquisition">Customer Acquisition</SelectItem>
                  <SelectItem value="profit_margin">Profit Margin</SelectItem>
                  <SelectItem value="task_completion">Task Completion</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="targetValue">Target Value</Label>
              <Input
                id="targetValue"
                type="number"
                step="0.01"
                placeholder="Enter target value"
                value={formData.targetValue}
                onChange={(e) => handleInputChange('targetValue', e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="period">Period</Label>
              <Select
                value={formData.period}
                onValueChange={(value) => handleInputChange('period', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="commissionRate">Commission (%)</Label>
                <Input
                  id="commissionRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="5.0"
                  value={formData.commissionRate}
                  onChange={(e) => handleInputChange('commissionRate', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bonusAmount">Bonus Amount</Label>
                <Input
                  id="bonusAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="1000.00"
                  value={formData.bonusAmount}
                  onChange={(e) => handleInputChange('bonusAmount', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Setting...' : 'Set Target'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TargetModal;
