import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Printer, Download, Truck } from 'lucide-react';
import DeliveryNote from './DeliveryNote';
import { Sale } from '@/types/pos';
import { useAuth } from '@/contexts/AuthContext';

interface DeliveryNoteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sale: Sale;
}

const DeliveryNoteModal: React.FC<DeliveryNoteModalProps> = ({ open, onOpenChange, sale }) => {
    const { currentUser } = useAuth();
    const [customerInfo, setCustomerInfo] = useState({
        name: sale.customerName || '',
        address: '',
        mobile: '',
    });

    const handlePrint = () => {
        const printContent = document.getElementById('delivery-note-content');
        if (!printContent) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Delivery Note - ${sale.id}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Inter', Arial, sans-serif; font-size: 11px; color: #18181b; }
            @page { size: A4; margin: 10mm; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
            .bg-white { background-color: white; }
            .bg-zinc-50 { background-color: #fafafa; }
            .bg-zinc-100 { background-color: #f4f4f5; }
            .bg-primary { background-color: hsl(221, 83%, 53%); }
            .bg-accent { background-color: hsl(38, 92%, 50%); }
            .bg-accent\\/5 { background-color: hsla(38, 92%, 50%, 0.05); }
            .text-primary { color: hsl(221, 83%, 53%); }
            .text-accent { color: hsl(38, 92%, 50%); }
            .text-white { color: white; }
            .text-zinc-300 { color: #d4d4d8; }
            .text-zinc-400 { color: #a1a1aa; }
            .text-zinc-500 { color: #71717a; }
            .text-zinc-600 { color: #52525b; }
            .text-zinc-800 { color: #27272a; }
            .text-zinc-900 { color: #18181b; }
            .text-emerald-600 { color: #059669; }
            .font-bold { font-weight: 700; }
            .font-black { font-weight: 900; }
            .font-mono { font-family: monospace; }
            .italic { font-style: italic; }
            .uppercase { text-transform: uppercase; }
            .tracking-widest { letter-spacing: 0.1em; }
            .tracking-tighter { letter-spacing: -0.05em; }
            .text-xs { font-size: 10px; }
            .text-sm { font-size: 12px; }
            .text-lg { font-size: 18px; }
            .text-2xl { font-size: 24px; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .p-4 { padding: 16px; }
            .p-5 { padding: 20px; }
            .p-8 { padding: 32px; }
            .px-4 { padding-left: 16px; padding-right: 16px; }
            .py-2 { padding-top: 8px; padding-bottom: 8px; }
            .py-3 { padding-top: 12px; padding-bottom: 12px; }
            .pb-4 { padding-bottom: 16px; }
            .pt-3 { padding-top: 12px; }
            .pt-6 { padding-top: 24px; }
            .mb-1 { margin-bottom: 4px; }
            .mb-3 { margin-bottom: 12px; }
            .mb-4 { margin-bottom: 16px; }
            .mb-6 { margin-bottom: 24px; }
            .mb-8 { margin-bottom: 32px; }
            .mb-12 { margin-bottom: 48px; }
            .mt-4 { margin-top: 16px; }
            .mt-12 { margin-top: 48px; }
            .mr-2 { margin-right: 8px; }
            .w-full { width: 100%; }
            .w-20 { width: 80px; }
            .w-32 { width: 128px; }
            .h-20 { height: 80px; }
            .max-w-\\[800px\\] { max-width: 800px; }
            .flex { display: flex; }
            .flex-col { flex-direction: column; }
            .items-start { align-items: flex-start; }
            .items-end { align-items: flex-end; }
            .justify-between { justify-content: space-between; }
            .justify-end { justify-content: flex-end; }
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
            .gap-4 { gap: 16px; }
            .gap-8 { gap: 32px; }
            .gap-12 { gap: 48px; }
            .border { border: 1px solid #e4e4e7; }
            .border-t { border-top: 1px solid #e4e4e7; }
            .border-t-2 { border-top: 2px solid #18181b; }
            .border-b-2 { border-bottom: 2px solid #18181b; }
            .border-accent { border-color: hsl(38, 92%, 50%); }
            .border-l-4 { border-left-width: 4px; }
            .rounded-lg { border-radius: 8px; }
            .rounded-xl { border-radius: 12px; }
            .rounded-r-lg { border-top-right-radius: 8px; border-bottom-right-radius: 8px; }
          </style>
        </head>
        <body>
          ${printContent.outerHTML}
        </body>
      </html>
    `);

        printWindow.document.close();
        setTimeout(() => {
            printWindow.print();
        }, 250);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Truck className="h-5 w-5 text-accent" />
                        Generate Delivery Note
                    </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="details" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="details">Logistics Info</TabsTrigger>
                        <TabsTrigger value="preview">Document Preview</TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="space-y-4 mt-4">
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="customerName">Receiver / Company Name</Label>
                                <Input
                                    id="customerName"
                                    value={customerInfo.name}
                                    onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                                    placeholder="Enter receiver name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address">Delivery Address</Label>
                                <Input
                                    id="address"
                                    value={customerInfo.address}
                                    onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                                    placeholder="Enter destination address"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="mobile">Receiver Phone</Label>
                                <Input
                                    id="mobile"
                                    value={customerInfo.mobile}
                                    onChange={(e) => setCustomerInfo({ ...customerInfo, mobile: e.target.value })}
                                    placeholder="Enter contact number"
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-accent/5 rounded-lg border border-accent/20">
                            <p className="text-sm font-medium text-accent flex items-center gap-2">
                                <Truck className="h-4 w-4" />
                                This document will not show prices. It is for warehouse/logistics use.
                            </p>
                        </div>
                    </TabsContent>

                    <TabsContent value="preview" className="mt-4">
                        <div className="border rounded-lg overflow-auto max-h-[60vh] bg-zinc-100 p-8 shadow-inner">
                            <DeliveryNote
                                sale={sale}
                                customerInfo={customerInfo}
                                printedBy={currentUser?.name || 'Store Keeper'}
                            />
                        </div>
                    </TabsContent>
                </Tabs>

                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                    <Button onClick={handlePrint} variant="brand" className="flex-1 gap-2">
                        <Printer className="h-4 w-4" />
                        Print Note
                    </Button>
                    <Button onClick={handlePrint} variant="outline" className="flex-1 gap-2">
                        <Download className="h-4 w-4" />
                        Save as PDF
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default DeliveryNoteModal;
