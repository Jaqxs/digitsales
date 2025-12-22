import { MainLayout, PageHeader, PageContent } from '@/components/layout';
import { mockEmployees } from '@/data/mock-data';
import { formatCurrency, formatPercent } from '@/lib/pos-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useState, useMemo } from 'react';
import { Search, Plus, UserCircle, Target, TrendingUp, Award, Edit, Eye } from 'lucide-react';

const roleColors: Record<string, string> = {
  admin: 'bg-primary text-primary-foreground',
  manager: 'bg-info text-info-foreground',
  sales: 'bg-success text-success-foreground',
  inventory: 'bg-warning text-warning-foreground',
  support: 'bg-secondary text-secondary-foreground',
};

const Employees = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEmployees = useMemo(() => {
    return mockEmployees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  return (
    <MainLayout>
      <PageContent>
        <PageHeader title="Employees" description="Manage staff and track performance">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Employee
          </Button>
        </PageHeader>

        {/* Stats */}
        <div className="grid gap-4 mt-6 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <UserCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Employees</p>
              <p className="text-2xl font-bold text-foreground">{mockEmployees.length}</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-success-light flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Performance</p>
              <p className="text-2xl font-bold text-foreground">94%</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-warning-light flex items-center justify-center">
              <Award className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Top Performer</p>
              <p className="text-lg font-bold text-foreground">John Mwanga</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Employee Cards */}
        <div className="grid gap-4 mt-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEmployees.map((employee) => {
            const progress =
              employee.salesTarget > 0
                ? Math.min((employee.totalSales / employee.salesTarget) * 100, 100)
                : 0;

            return (
              <div
                key={employee.id}
                className="rounded-xl border border-border bg-card p-6 hover:shadow-card-hover transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg">
                      {employee.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{employee.name}</h3>
                      <p className="text-sm text-muted-foreground">{employee.email}</p>
                    </div>
                  </div>
                  <Badge className={roleColors[employee.role]}>{employee.role}</Badge>
                </div>

                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <span className="flex items-center gap-2">
                      📞 {employee.phone}
                    </span>
                  </div>

                  {employee.salesTarget > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Target className="h-4 w-4" />
                          Sales Target
                        </span>
                        <span className="font-medium text-foreground">
                          {progress.toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{formatCurrency(employee.totalSales)}</span>
                        <span>{formatCurrency(employee.salesTarget)}</span>
                      </div>
                    </div>
                  )}

                  {employee.commission > 0 && (
                    <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
                      <span className="text-muted-foreground">Commission Rate</span>
                      <Badge variant="secondary">{employee.commission}%</Badge>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                  <Button variant="outline" size="sm" className="flex-1 gap-1">
                    <Eye className="h-4 w-4" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 gap-1">
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </PageContent>
    </MainLayout>
  );
};

export default Employees;
