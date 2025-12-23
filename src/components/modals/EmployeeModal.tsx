import { useState, useEffect } from 'react';
import { Employee, UserRole } from '@/types/pos';
import { useDataStore } from '@/stores/dataStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserCircle } from 'lucide-react';

interface EmployeeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: Employee | null;
}

export function EmployeeModal({ open, onOpenChange, employee }: EmployeeModalProps) {
  const { addEmployee, updateEmployee } = useDataStore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'sales' as UserRole,
    salesTarget: 0,
    commission: 0,
  });

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        role: employee.role,
        salesTarget: employee.salesTarget,
        commission: employee.commission,
      });
    } else {
      setFormData({ name: '', email: '', phone: '', role: 'sales', salesTarget: 0, commission: 0 });
    }
  }, [employee, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 300));

    if (employee) {
      updateEmployee(employee.id, formData);
      toast({ title: 'Employee updated', description: `${formData.name} has been updated.` });
    } else {
      addEmployee(formData);
      toast({ title: 'Employee added', description: `${formData.name} has been added.` });
    }

    setIsSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5 text-primary" />
            {employee ? 'Edit Employee' : 'Add New Employee'}
          </DialogTitle>
          <DialogDescription>
            {employee ? 'Update employee information' : 'Add a new staff member'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. John Mwanga"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. john@zantrix.co.tz"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. +255 712 345 678"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="sales">Sales Staff</SelectItem>
                  <SelectItem value="inventory">Inventory Clerk</SelectItem>
                  <SelectItem value="support">Customer Support</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="commission">Commission (%)</Label>
              <Input
                id="commission"
                type="number"
                min="0"
                max="100"
                value={formData.commission}
                onChange={(e) => setFormData({ ...formData, commission: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="salesTarget">Sales Target (TZS)</Label>
              <Input
                id="salesTarget"
                type="number"
                value={formData.salesTarget}
                onChange={(e) => setFormData({ ...formData, salesTarget: Number(e.target.value) })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {employee ? 'Update' : 'Add Employee'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
