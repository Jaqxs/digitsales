import { MainLayout, PageHeader, PageContent } from '@/components/layout';
import { mockCustomers } from '@/data/mock-data';
import { formatCurrency, formatNumber } from '@/lib/pos-utils';
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
import { useState, useMemo } from 'react';
import { Search, Plus, Users, Star, ShoppingBag, Eye, Edit, Mail } from 'lucide-react';

// Extended mock customers
const customers = [
  ...mockCustomers,
  {
    id: '3',
    name: 'Dodoma Builders',
    email: 'sales@dodomabuilders.co.tz',
    phone: '+255 744 555 000',
    address: 'Dodoma City Center',
    loyaltyPoints: 5200,
    totalPurchases: 45000000,
    createdAt: new Date('2024-02-18'),
  },
  {
    id: '4',
    name: 'Arusha Hardware',
    email: 'info@arushahardware.co.tz',
    phone: '+255 788 123 456',
    address: 'Arusha Town',
    loyaltyPoints: 3800,
    totalPurchases: 32000000,
    createdAt: new Date('2024-04-10'),
  },
  {
    id: '5',
    name: 'Morogoro Construction',
    email: 'orders@morogoroconst.co.tz',
    phone: '+255 755 999 888',
    address: 'Morogoro CBD',
    loyaltyPoints: 2100,
    totalPurchases: 18500000,
    createdAt: new Date('2024-06-05'),
  },
];

const Customers = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCustomers = useMemo(() => {
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone.includes(searchQuery)
    );
  }, [searchQuery]);

  const stats = useMemo(() => {
    const total = customers.length;
    const totalPoints = customers.reduce((sum, c) => sum + c.loyaltyPoints, 0);
    const totalPurchases = customers.reduce((sum, c) => sum + c.totalPurchases, 0);
    return { total, totalPoints, totalPurchases };
  }, []);

  return (
    <MainLayout>
      <PageContent>
        <PageHeader title="Customers" description="Manage customer relationships and loyalty">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Customer
          </Button>
        </PageHeader>

        {/* Stats */}
        <div className="grid gap-4 mt-6 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Customers</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-warning-light flex items-center justify-center">
              <Star className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Points</p>
              <p className="text-2xl font-bold text-foreground">{formatNumber(stats.totalPoints)}</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-success-light flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Purchases</p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(stats.totalPurchases)}</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Customers Table */}
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
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Mail className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </PageContent>
    </MainLayout>
  );
};

export default Customers;
