import { useState, useMemo, useEffect } from 'react';
import { MainLayout, PageHeader, PageContent } from '@/components/layout';
import { useDataStore } from '@/stores/dataStore';
import { Customer } from '@/types/pos';
import { formatCurrency, formatNumber } from '@/lib/pos-utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Plus, Users, Star, ShoppingBag, Eye, Edit, Trash2, Mail, MoreVertical } from 'lucide-react';
import { CustomerModal, DeleteConfirmModal } from '@/components/modals';
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

const Customers = () => {
  const { customers, deleteCustomer, fetchCustomers } = useDataStore();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch customers on mount
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Modal states
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const filteredCustomers = useMemo(() => {
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone.includes(searchQuery)
    );
  }, [customers, searchQuery]);

  const stats = useMemo(() => {
    const total = customers.length;
    const totalPoints = customers.reduce((sum, c) => sum + c.loyaltyPoints, 0);
    const totalPurchases = customers.reduce((sum, c) => sum + c.totalPurchases, 0);
    return { total, totalPoints, totalPurchases };
  }, [customers]);

  const handleAddNew = () => {
    setSelectedCustomer(null);
    setCustomerModalOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerModalOpen(true);
  };

  const handleView = (customer: Customer) => {
    setSelectedCustomer(customer);
    setViewModalOpen(true);
  };

  const handleDelete = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedCustomer) {
      deleteCustomer(selectedCustomer.id);
      toast({ title: 'Customer deleted', description: `${selectedCustomer.name} has been removed.` });
    }
  };

  const handleSendEmail = (customer: Customer) => {
    toast({
      title: 'Email feature',
      description: `Opening email to ${customer.email || 'no email available'}`,
    });
  };

  // Mobile Customer Card
  const MobileCustomerCard = ({ customer }: { customer: Customer }) => (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold shrink-0">
            {customer.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-foreground truncate">{customer.name}</p>
            <p className="text-xs text-muted-foreground truncate">{customer.email || customer.phone}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleView(customer)}>
              <Eye className="h-4 w-4 mr-2" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEdit(customer)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSendEmail(customer)}>
              <Mail className="h-4 w-4 mr-2" />
              Email
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDelete(customer)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <Badge variant="secondary" className="gap-1 text-xs">
          <Star className="h-3 w-3 text-warning" />
          {formatNumber(customer.loyaltyPoints)} pts
        </Badge>
        <span className="font-medium text-sm">{formatCurrency(customer.totalPurchases)}</span>
      </div>
    </div>
  );

  return (
    <MainLayout>
      <PageContent>
        <PageHeader title="Customers" description="Manage customer relationships">
          <Button size="sm" className="gap-2" onClick={handleAddNew}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add</span> Customer
          </Button>
        </PageHeader>

        {/* Stats */}
        <div className="grid gap-3 sm:gap-4 mt-4 sm:mt-6 grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-3 sm:p-4 flex items-center gap-2 sm:gap-4">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Total</p>
              <p className="text-lg sm:text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 sm:p-4 flex items-center gap-2 sm:gap-4">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-warning-light flex items-center justify-center shrink-0">
              <Star className="h-5 w-5 sm:h-6 sm:w-6 text-warning" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Points</p>
              <p className="text-lg sm:text-2xl font-bold text-foreground">{formatNumber(stats.totalPoints)}</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 sm:p-4 flex items-center gap-2 sm:gap-4">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-success-light flex items-center justify-center shrink-0">
              <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Purchases</p>
              <p className="text-sm sm:text-xl font-bold text-foreground truncate">{formatCurrency(stats.totalPurchases)}</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-4 sm:mt-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Customers - Cards on mobile, Table on desktop */}
        {isMobile ? (
          <div className="mt-4 space-y-3">
            {filteredCustomers.map((customer) => (
              <MobileCustomerCard key={customer.id} customer={customer} />
            ))}
            {filteredCustomers.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mb-4 opacity-50" />
                <p>No customers found</p>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Customer</TableHead>
                  <TableHead className="font-semibold">Contact</TableHead>
                  <TableHead className="font-semibold">Location</TableHead>
                  <TableHead className="font-semibold text-center">Loyalty Points</TableHead>
                  <TableHead className="font-semibold text-right">Total Purchases</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{customer.name}</p>
                          <p className="text-xs text-muted-foreground">{customer.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{customer.phone}</TableCell>
                    <TableCell className="text-muted-foreground">{customer.address}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="gap-1">
                        <Star className="h-3 w-3 text-warning" />
                        {formatNumber(customer.loyaltyPoints)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(customer.totalPurchases)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleView(customer)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(customer)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSendEmail(customer)}>
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(customer)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredCustomers.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mb-4 opacity-50" />
                <p>No customers found</p>
              </div>
            )}
          </div>
        )}
      </PageContent>

      <CustomerModal
        open={customerModalOpen}
        onOpenChange={setCustomerModalOpen}
        customer={selectedCustomer}
      />
      <DeleteConfirmModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title="Delete Customer"
        description={`Are you sure you want to delete "${selectedCustomer?.name}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
      />

      {/* View Customer Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
            <DialogDescription>View customer information</DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedCustomer.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>
                </div>
              </div>
              <div className="grid gap-3 grid-cols-2">
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-medium text-sm">{selectedCustomer.phone}</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="font-medium text-sm truncate">{selectedCustomer.address || 'N/A'}</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Loyalty Points</p>
                  <p className="font-medium text-sm">{formatNumber(selectedCustomer.loyaltyPoints)}</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Total Purchases</p>
                  <p className="font-medium text-sm">{formatCurrency(selectedCustomer.totalPurchases)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Customers;
