import { useState, useEffect } from 'react';
import { UserRole, Employee } from '@/types/pos';
import { useDataStore } from '@/stores/dataStore';
import { useAuth } from '@/contexts/AuthContext';
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
import { Loader2, UserCircle, Target } from 'lucide-react';

interface EmployeeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: Employee | null;
  onSuccess?: () => void;
}

export function EmployeeModal({ open, onOpenChange, employee, onSuccess }: EmployeeModalProps) {
  const { user: currentUser, hasPermission } = useAuth();
  const { toast } = useToast();
  const { addEmployee, updateEmployee } = useDataStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check permissions
  const canAssignRoles = hasPermission(['admin']);
  const canSetTargets = hasPermission(['admin', 'manager']);

  const [formData, setFormData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    phone: string;
    role: UserRole;
    employeeId: string;
    salesTarget: number;
    commission: number;
  }>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    role: 'sales' as UserRole,
    employeeId: '',
    salesTarget: 0,
    commission: 0,
  });

  useEffect(() => {
    if (employee) {
      // Split name into first and last
      const nameParts = employee.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      setFormData({
        firstName,
        lastName,
        email: employee.email,
        phone: employee.phone || '',
        role: employee.role,
        employeeId: '', // Employee ID not in store type yet, ignore for now
        salesTarget: employee.salesTarget || 0,
        commission: employee.commission || 0,
      });
    } else {
      // For creating new employee
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
        role: 'sales' as UserRole,
        employeeId: '',
        salesTarget: 0,
        commission: 0,
      });
    }
  }, [employee, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();

      if (employee) {
        // Update existing employee
        await updateEmployee(employee.id, {
          name: fullName,
          email: formData.email,
          role: formData.role,
          phone: formData.phone,
          salesTarget: formData.salesTarget,
          commission: formData.commission,
        });
        toast({
          title: 'Employee updated',
          description: `${fullName} has been updated.`
        });
      } else {
        // Create new employee
        await addEmployee({
          name: fullName,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          phone: formData.phone,
          employeeId: formData.employeeId,
          avatar: '',
          salesTarget: formData.salesTarget,
          commission: formData.commission,
        } as any);
        toast({
          title: 'Employee added',
          description: `${fullName} has been added.`
        });
      }

      setIsSubmitting(false);
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save employee',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
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
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="e.g. John"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="e.g. Mwanga"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. john@digitsales.io"
                required
              />
            </div>
            {!employee && (
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password"
                  required
                />
                {formData.password && (
                  <div className="text-xs space-y-1 mt-2">
                    <p className={formData.password.length >= 8 ? "text-success" : "text-muted-foreground"}>
                      ✓ At least 8 characters
                    </p>
                    <p className={/[A-Z]/.test(formData.password) ? "text-success" : "text-muted-foreground"}>
                      ✓ One uppercase letter
                    </p>
                    <p className={/[a-z]/.test(formData.password) ? "text-success" : "text-muted-foreground"}>
                      ✓ One lowercase letter
                    </p>
                    <p className={/\d/.test(formData.password) ? "text-success" : "text-muted-foreground"}>
                      ✓ One number
                    </p>
                    <p className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? "text-success" : "text-muted-foreground"}>
                      ✓ One special character
                    </p>
                  </div>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. +255 712 345 678"
              />
            </div>

            {/* Employee ID - visible to all */}
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee ID</Label>
              <Input
                id="employeeId"
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                placeholder="e.g. EMP001"
              />
            </div>

            {/* Role Assignment - Admin Only */}
            {canAssignRoles && (
              <div className="space-y-2">
                <Label htmlFor="role" className="flex items-center gap-2">
                  Role
                  <span className="text-xs text-muted-foreground">(Admin only)</span>
                </Label>
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
                    <SelectItem value="stock_keeper">Stock Keeper</SelectItem>
                    <SelectItem value="support">Customer Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Commission - Admin/Manager Only */}
            {canSetTargets && (
              <div className="space-y-2">
                <Label htmlFor="commission" className="flex items-center gap-2">
                  Commission (%)
                  <span className="text-xs text-muted-foreground">(Admin/Manager only)</span>
                </Label>
                <Input
                  id="commission"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.commission}
                  onChange={(e) => setFormData({ ...formData, commission: Number(e.target.value) })}
                />
              </div>
            )}

            {/* Sales Target - Admin/Manager Only */}
            {canSetTargets && (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="salesTarget" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Sales Target (TZS)
                  <span className="text-xs text-muted-foreground">(Admin/Manager only)</span>
                </Label>
                <Input
                  id="salesTarget"
                  type="number"
                  min="0"
                  value={formData.salesTarget}
                  onChange={(e) => setFormData({ ...formData, salesTarget: Number(e.target.value) })}
                  placeholder="e.g. 5000000"
                />
              </div>
            )}
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
