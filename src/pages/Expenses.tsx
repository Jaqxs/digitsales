import { useState, useMemo } from 'react';
import { MainLayout, PageHeader, PageContent } from '@/components/layout';
import { useDataStore } from '@/stores/dataStore';
import { formatCurrency } from '@/lib/pos-utils';
import { format } from 'date-fns';
import { 
  Receipt, 
  Plus, 
  Search, 
  Filter, 
  TrendingDown, 
  Calendar as CalendarIcon,
  Tag,
  MoreVertical,
  Trash2,
  Edit,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RecordExpenseModal } from '@/components/modals/RecordModals';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const categoryColors: Record<string, string> = {
  rent: 'bg-blue-100 text-blue-700 border-blue-200',
  utilities: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  salaries: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  supplies: 'bg-orange-100 text-orange-700 border-orange-200',
  maintenance: 'bg-amber-100 text-amber-700 border-amber-200',
  marketing: 'bg-purple-100 text-purple-700 border-purple-200',
  taxes: 'bg-red-100 text-red-700 border-red-200',
  others: 'bg-slate-100 text-slate-700 border-slate-200',
};

const categoryLabels: Record<string, string> = {
  rent: 'Rent & Lease',
  utilities: 'Utilities',
  salaries: 'Salaries',
  supplies: 'Supplies',
  maintenance: 'Maintenance',
  marketing: 'Marketing',
  taxes: 'Taxes',
  others: 'Others',
};

const Expenses = () => {
  const { expenses, deleteExpense } = useDataStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const matchesSearch = exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          exp.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || exp.category === categoryFilter;
      return matchesSearch && matchesCategory;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, searchQuery, categoryFilter]);

  const stats = useMemo(() => {
    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const thisMonth = expenses
      .filter(exp => new Date(exp.date).getMonth() === new Date().getMonth())
      .reduce((sum, exp) => sum + exp.amount, 0);
    const count = expenses.length;
    
    return { total, thisMonth, count };
  }, [expenses]);

  return (
    <MainLayout>
      <PageHeader 
        title="Business Expenses" 
        subtitle="Manage and track your operational costs"
        icon={<Receipt className="h-6 w-6 text-primary" />}
      >
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="hidden sm:flex font-bold">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => setIsModalOpen(true)} size="sm" className="font-bold shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </PageHeader>

      <PageContent>
        {/* Stats Summary */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card className="border-none shadow-sm bg-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingDown className="h-12 w-12 text-primary" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-primary">{formatCurrency(stats.total)}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Lifetime recorded expenses</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <CalendarIcon className="h-12 w-12 text-emerald-500" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-emerald-600">{formatCurrency(stats.thisMonth)}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Operational costs for {format(new Date(), 'MMMM yyyy')}</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <Tag className="h-12 w-12 text-blue-500" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Records Count</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-blue-600">{stats.count}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Total individual expense entries</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search expenses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px] bg-slate-50 border-none">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(categoryLabels).map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4">Date</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Expense Title</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Category</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Amount</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((expense) => (
                  <TableRow key={expense.id} className="hover:bg-slate-50/50 border-slate-50 transition-colors group">
                    <TableCell className="py-4">
                      <div className="text-xs font-bold text-slate-900">
                        {format(new Date(expense.date), 'dd MMM yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">{expense.title}</span>
                        {expense.description && (
                          <span className="text-[10px] text-muted-foreground line-clamp-1">{expense.description}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-tight px-2 py-0.5 border ${categoryColors[expense.category]}`}>
                        {categoryLabels[expense.category]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="text-sm font-black text-slate-900">
                        {formatCurrency(expense.amount)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem className="text-xs font-medium cursor-pointer">
                            <Edit className="h-3.5 w-3.5 mr-2" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-xs font-medium text-destructive cursor-pointer"
                            onClick={() => deleteExpense(expense.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                            Delete Entry
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center">
                        <Receipt className="h-6 w-6 text-slate-300" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-900">No expenses found</p>
                        <p className="text-xs text-muted-foreground">Start by recording your first business expense.</p>
                      </div>
                      <Button onClick={() => setIsModalOpen(true)} variant="outline" size="sm" className="mt-2 font-bold">
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Expense
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </PageContent>

      <RecordExpenseModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
      />
    </MainLayout>
  );
};

export default Expenses;
