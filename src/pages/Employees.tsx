import { useState, useMemo } from 'react';
import { MainLayout, PageHeader, PageContent } from '@/components/layout';
import { useDataStore } from '@/stores/dataStore';
import { Employee } from '@/types/pos';
import { formatCurrency } from '@/lib/pos-utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Search, Plus, UserCircle, Target, TrendingUp, Award, Edit, Eye, Trash2, MoreVertical } from 'lucide-react';
import { EmployeeModal, DeleteConfirmModal } from '@/components/modals';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const roleColors: Record<string, string> = {
  admin: 'bg-primary text-primary-foreground',
  manager: 'bg-info text-info-foreground',
  sales: 'bg-success text-success-foreground',
  inventory: 'bg-warning text-warning-foreground',
  support: 'bg-secondary text-secondary-foreground',
};

const Employees = () => {
  const { employees, deleteEmployee } = useDataStore();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const filteredEmployees = useMemo(() => {
    return employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [employees, searchQuery]);

  const topPerformer = useMemo(() => {
    const salesStaff = employees.filter(e => e.salesTarget > 0);
    if (salesStaff.length === 0) return null;
    return salesStaff.reduce((top, emp) => 
      (emp.totalSales / emp.salesTarget) > (top.totalSales / top.salesTarget) ? emp : top
    );
  }, [employees]);

  const handleAddNew = () => {
    setSelectedEmployee(null);
    setEmployeeModalOpen(true);
  };

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEmployeeModalOpen(true);
  };

  const handleView = (employee: Employee) => {
    setSelectedEmployee(employee);
    setViewModalOpen(true);
  };

  const handleDelete = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedEmployee) {
      deleteEmployee(selectedEmployee.id);
      toast({ title: 'Employee removed', description: `${selectedEmployee.name} has been removed.` });
    }
  };

  return (
    <MainLayout>
      <PageContent>
        <PageHeader title="Employees" description="Manage staff and performance">
          <Button size="sm" className="gap-2" onClick={handleAddNew}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add</span> Employee
          </Button>
        </PageHeader>

        {/* Stats */}
        <div className="grid gap-3 sm:gap-4 mt-4 sm:mt-6 grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-3 sm:p-4 flex items-center gap-2 sm:gap-4">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <UserCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Total</p>
              <p className="text-lg sm:text-2xl font-bold text-foreground">{employees.length}</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 sm:p-4 flex items-center gap-2 sm:gap-4">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-success-light flex items-center justify-center shrink-0">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Avg Perf</p>
              <p className="text-lg sm:text-2xl font-bold text-foreground">94%</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 sm:p-4 flex items-center gap-2 sm:gap-4">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-warning-light flex items-center justify-center shrink-0">
              <Award className="h-5 w-5 sm:h-6 sm:w-6 text-warning" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Top</p>
              <p className="text-sm sm:text-lg font-bold text-foreground truncate">{topPerformer?.name.split(' ')[0] || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-4 sm:mt-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Employee Cards - Responsive grid */}
        <div className="grid gap-3 sm:gap-4 mt-4 sm:mt-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEmployees.map((employee) => {
            const progress =
              employee.salesTarget > 0
                ? Math.min((employee.totalSales / employee.salesTarget) * 100, 100)
                : 0;

            return (
              <div
                key={employee.id}
                className="rounded-xl border border-border bg-card p-4 sm:p-6 hover:shadow-card-hover transition-shadow"
              >
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm sm:text-lg shrink-0">
                      {employee.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">{employee.name}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{employee.email}</p>
                    </div>
                  </div>
                  {isMobile ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleView(employee)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(employee)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(employee)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Badge className={roleColors[employee.role]}>{employee.role}</Badge>
                  )}
                </div>

                {isMobile && (
                  <Badge className={`${roleColors[employee.role]} mb-3`}>{employee.role}</Badge>
                )}

                <div className="space-y-3 sm:space-y-4">
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    <span className="flex items-center gap-2">
                      📞 {employee.phone}
                    </span>
                  </div>

                  {employee.salesTarget > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Target className="h-3 w-3 sm:h-4 sm:w-4" />
                          Target
                        </span>
                        <span className="font-medium text-foreground">
                          {progress.toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <div className="flex justify-between text-[10px] sm:text-xs text-muted-foreground">
                        <span>{formatCurrency(employee.totalSales)}</span>
                        <span>{formatCurrency(employee.salesTarget)}</span>
                      </div>
                    </div>
                  )}

                  {employee.commission > 0 && (
                    <div className="flex items-center justify-between text-xs sm:text-sm pt-2 border-t border-border">
                      <span className="text-muted-foreground">Commission</span>
                      <Badge variant="secondary" className="text-xs">{employee.commission}%</Badge>
                    </div>
                  )}
                </div>

                {!isMobile && (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                    <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => handleView(employee)}>
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => handleEdit(employee)}>
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(employee)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredEmployees.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <UserCircle className="h-12 w-12 mb-4 opacity-50" />
            <p>No employees found</p>
          </div>
        )}
      </PageContent>

      <EmployeeModal
        open={employeeModalOpen}
        onOpenChange={setEmployeeModalOpen}
        employee={selectedEmployee}
      />
      <DeleteConfirmModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title="Remove Employee"
        description={`Are you sure you want to remove "${selectedEmployee?.name}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
      />

      {/* View Employee Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
            <DialogDescription>View employee information</DialogDescription>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                  {selectedEmployee.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedEmployee.name}</h3>
                  <Badge className={roleColors[selectedEmployee.role]}>{selectedEmployee.role}</Badge>
                </div>
              </div>
              <div className="grid gap-3 grid-cols-2">
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium text-sm truncate">{selectedEmployee.email}</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-medium text-sm">{selectedEmployee.phone}</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Sales Target</p>
                  <p className="font-medium text-sm">{formatCurrency(selectedEmployee.salesTarget)}</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Total Sales</p>
                  <p className="font-medium text-sm">{formatCurrency(selectedEmployee.totalSales)}</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Commission</p>
                  <p className="font-medium text-sm">{selectedEmployee.commission}%</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Member Since</p>
                  <p className="font-medium text-sm">{new Date(selectedEmployee.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Employees;
