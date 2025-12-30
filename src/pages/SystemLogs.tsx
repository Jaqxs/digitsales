import { useState, useMemo } from 'react';
import { MainLayout, PageHeader, PageContent } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { useDataStore } from '@/stores/dataStore';
import { formatCurrency } from '@/lib/pos-utils';
import { Badge } from '@/components/ui/badge';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    History,
    Search,
    ArrowUpRight,
    ArrowDownLeft,
    RefreshCw,
    Download,
} from 'lucide-react';
import { DateRange } from "react-day-picker";
import { addDays, endOfDay } from "date-fns";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { exportToCSV } from "@/utils/exportUtils";

const SystemLogs = () => {
    const { stockRecords } = useDataStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: addDays(new Date(), -30),
        to: new Date(),
    });

    const filteredRecords = useMemo(() => {
        return stockRecords.filter((record) => {
            const matchesSearch =
                record.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                record.reason.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesType = typeFilter === 'all' || record.type === typeFilter;

            const matchesDate = dateRange?.from ?
                (new Date(record.createdAt) >= dateRange.from && new Date(record.createdAt) <= endOfDay(dateRange.to || dateRange.from)) : true;

            return matchesSearch && matchesType && matchesDate;
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [stockRecords, searchQuery, typeFilter, dateRange]);

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'in':
                return (
                    <Badge className="bg-success text-success-foreground gap-1">
                        <ArrowDownLeft className="h-3 w-3" />
                        Stock In
                    </Badge>
                );
            case 'out':
                return (
                    <Badge variant="destructive" className="gap-1">
                        <ArrowUpRight className="h-3 w-3" />
                        Stock Out
                    </Badge>
                );
            case 'adjustment':
                return (
                    <Badge variant="outline" className="gap-1">
                        <RefreshCw className="h-3 w-3" />
                        Adjustment
                    </Badge>
                );
            default:
                return <Badge variant="secondary">{type}</Badge>;
        }
    };

    const handleExport = () => {
        const dataToExport = filteredRecords.map(r => ({
            'Date': new Date(r.createdAt).toLocaleString(),
            'Type': r.type.toUpperCase(),
            'Product': r.productName,
            'Quantity': r.quantity,
            'Prev Stock': r.previousStock,
            'New Stock': r.newStock,
            'Reason': r.reason,
            'User': r.createdBy
        }));
        exportToCSV(dataToExport, 'System_Logs');
    };

    return (
        <MainLayout>
            <PageContent>
                <PageHeader
                    title="System Logs"
                    description="View system activity and stock movements"
                >
                    <div className="flex items-center gap-2">
                        <DateRangePicker date={dateRange} setDate={setDateRange} />
                        <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
                            <Download className="h-4 w-4" />
                            Export
                        </Button>
                    </div>
                </PageHeader>

                <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search logs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Activity</SelectItem>
                            <SelectItem value="in">Stock In</SelectItem>
                            <SelectItem value="out">Stock Out</SelectItem>
                            <SelectItem value="adjustment">Adjustments</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="mt-6 rounded-xl border border-border bg-card overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead>Date & Time</TableHead>
                                <TableHead>Activity Type</TableHead>
                                <TableHead>Product</TableHead>
                                <TableHead className="text-right">Quantity</TableHead>
                                <TableHead className="text-right">Stock Level</TableHead>
                                <TableHead>Reason / Notes</TableHead>
                                <TableHead>User</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRecords.map((record) => (
                                <TableRow key={record.id} className="hover:bg-muted/30">
                                    <TableCell className="text-muted-foreground whitespace-nowrap">
                                        {new Date(record.createdAt).toLocaleString()}
                                    </TableCell>
                                    <TableCell>{getTypeBadge(record.type)}</TableCell>
                                    <TableCell className="font-medium">{record.productName}</TableCell>
                                    <TableCell className="text-right font-mono">
                                        {record.type === 'out' ? '-' : '+'}{Math.abs(record.quantity)}
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground font-mono text-sm">
                                        {record.previousStock} → {record.newStock}
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate" title={record.reason}>
                                        {record.reason}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {record.createdBy}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredRecords.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center">
                                            <History className="h-8 w-8 mb-2 opacity-50" />
                                            No system activity found
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </PageContent>
        </MainLayout>
    );
};

export default SystemLogs;
