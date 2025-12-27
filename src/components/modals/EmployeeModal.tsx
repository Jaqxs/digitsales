import { useState, useEffect } from 'react';
import { UserRole } from '@/types/pos';
import { EmployeeApiService, type Employee as ApiEmployee, type CreateEmployeeData, type UpdateEmployeeData } from '@/lib/api/employees';
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
  employee?: ApiEmployee | null;
  onSuccess?: () => void;
}

export function EmployeeModal({ open, onOpenChange, employee, onSuccess }: EmployeeModalProps) {
  const { user: currentUser, hasPermission } = useAuth();
  const { toast } = useToast();
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
  }>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    role: 'sales' as UserRole,
    employeeId: '',
  });

  useEffect(() => {
    if (employee) {
      // For editing existing employee
      setFormData({
        firstName: employee.profile?.firstName || '',
        lastName: employee.profile?.lastName || '',
        email: employee.email,
        phone: employee.profile?.phone || '',
        role: employee.role,
        employeeId: employee.profile?.employeeId || '',
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

    // For new employees, password is required
    if (!employee && !formData.password) {
      toast({
        title: 'Password required',
        description: 'Please provide a password for the new employee.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (employee) {
        // Update existing employee
        await EmployeeApiService.updateEmployee(employee.id, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          role: formData.role,
          phone: formData.phone,
          employeeId: formData.employeeId,
        });
        toast({
          title: 'Employee updated',
          description: `${formData.firstName} ${formData.lastName} has been updated.`
        });
      } else {
        // Create new employee
        await EmployeeApiService.createEmployee({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password!,
          role: formData.role,
          phone: formData.phone,
          employeeId: formData.employeeId,
        });
        toast({
          title: 'Employee added',
          description: `${formData.firstName} ${formData.lastName} has been added.`
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
                placeholder="e.g. john@zantrix.co.tz"
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
