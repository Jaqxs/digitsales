import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Printer, Download, FileText } from 'lucide-react';
import Invoice from './Invoice';
import { Sale } from '@/types/pos';
import { useAuth } from '@/contexts/AuthContext';

interface InvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: Sale;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ open, onOpenChange, sale }) => {
  const { user } = useAuth();
  const [invoiceType, setInvoiceType] = useState<'proforma' | 'tax'>('proforma');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    representative: '',
    address: '',
    poBox: '',
    contactPerson: '',
    mobile: '',
    tin: '',
    vrn: '',
  });

  const handlePrint = () => {
    const printContent = document.getElementById('invoice-content');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${sale.id}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; font-size: 12px; }
            @page { size: A4; margin: 10mm; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
            .bg-white { background-color: white; }
            .bg-gray-50 { background-color: #f9fafb; }
            .bg-gray-100 { background-color: #f3f4f6; }
            .bg-primary { background-color: #0f172a; }
            .bg-primary\\/10 { background-color: rgba(15, 23, 42, 0.1); }
            .text-primary { color: #0f172a; }
            .text-white { color: white; }
            .text-black { color: black; }
            .text-gray-600 { color: #4b5563; }
            .text-gray-700 { color: #374151; }
            .font-bold { font-weight: bold; }
            .font-semibold { font-weight: 600; }
            .font-medium { font-weight: 500; }
            .text-xs { font-size: 10px; }
            .text-sm { font-size: 12px; }
            .text-lg { font-size: 16px; }
            .text-xl { font-size: 18px; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            .uppercase { text-transform: uppercase; }
            .italic { font-style: italic; }
            .p-4 { padding: 12px; }
            .p-8 { padding: 24px; }
            .px-2 { padding-left: 6px; padding-right: 6px; }
            .px-3 { padding-left: 9px; padding-right: 9px; }
            .px-4 { padding-left: 12px; padding-right: 12px; }
            .py-1 { padding-top: 3px; padding-bottom: 3px; }
            .py-2 { padding-top: 6px; padding-bottom: 6px; }
            .pb-4 { padding-bottom: 12px; }
            .pt-2 { padding-top: 6px; }
            .pt-3 { padding-top: 9px; }
            .mb-1 { margin-bottom: 3px; }
            .mb-2 { margin-bottom: 6px; }
            .mb-3 { margin-bottom: 9px; }
            .mb-4 { margin-bottom: 12px; }
            .mb-6 { margin-bottom: 18px; }
            .mt-1 { margin-top: 3px; }
            .mt-2 { margin-top: 6px; }
            .mt-3 { margin-top: 9px; }
            .-mx-2 { margin-left: -6px; margin-right: -6px; }
            .mx-auto { margin-left: auto; margin-right: auto; }
            .w-full { width: 100%; }
            .w-64 { width: 200px; }
            .w-20 { width: 60px; }
            .h-20 { height: 60px; }
            .max-w-\\[800px\\] { max-width: 800px; }
            .flex { display: flex; }
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
            .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
            .gap-4 { gap: 12px; }
            .gap-8 { gap: 24px; }
            .items-start { align-items: flex-start; }
            .justify-between { justify-content: space-between; }
            .justify-end { justify-content: flex-end; }
            .space-y-1 > * + * { margin-top: 3px; }
            .border { border: 1px solid #d1d5db; }
            .border-t { border-top: 1px solid #d1d5db; }
            .border-t-2 { border-top: 2px solid #0f172a; }
            .border-b-2 { border-bottom: 2px solid #0f172a; }
            .border-gray-300 { border-color: #d1d5db; }
            .border-primary\\/30 { border-color: rgba(15, 23, 42, 0.3); }
            .rounded { border-radius: 4px; }
            .border-collapse { border-collapse: collapse; }
            .list-decimal { list-style-type: decimal; }
            .list-inside { list-style-position: inside; }
            .object-contain { object-fit: contain; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #d1d5db; padding: 6px 9px; }
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

  const handleSavePDF = () => {
    handlePrint();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Invoice
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Customer Details</TabsTrigger>
            <TabsTrigger value="preview">Invoice Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="flex gap-4 mb-4">
              <Button
                variant={invoiceType === 'proforma' ? 'default' : 'outline'}
                onClick={() => setInvoiceType('proforma')}
                className="flex-1"
              >
                Proforma Invoice
              </Button>
              <Button
                variant={invoiceType === 'tax' ? 'default' : 'outline'}
                onClick={() => setInvoiceType('tax')}
                className="flex-1"
              >
                Tax Invoice
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Company/Customer Name</Label>
                <Input
                  id="customerName"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                  placeholder="Enter company name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="representative">Representative Name</Label>
                <Input
                  id="representative"
                  value={customerInfo.representative}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, representative: e.target.value })}
                  placeholder="Enter representative name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={customerInfo.address}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                  placeholder="Enter address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="poBox">P.O. Box</Label>
                <Input
                  id="poBox"
                  value={customerInfo.poBox}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, poBox: e.target.value })}
                  placeholder="Enter P.O. Box"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPerson">Contact Person</Label>
                <Input
                  id="contactPerson"
                  value={customerInfo.contactPerson}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, contactPerson: e.target.value })}
                  placeholder="Enter contact person"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile</Label>
                <Input
                  id="mobile"
                  value={customerInfo.mobile}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, mobile: e.target.value })}
                  placeholder="Enter mobile number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tin">TIN</Label>
                <Input
                  id="tin"
                  value={customerInfo.tin}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, tin: e.target.value })}
                  placeholder="Enter TIN number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vrn">VRN</Label>
                <Input
                  id="vrn"
                  value={customerInfo.vrn}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, vrn: e.target.value })}
                  placeholder="Enter VRN number"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-4">
            <div className="border rounded-lg overflow-auto max-h-[60vh] bg-gray-100 p-4">
              <Invoice 
                sale={sale} 
                invoiceType={invoiceType}
                customerInfo={customerInfo}
                printedBy={user?.name || 'System'}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <Button onClick={handlePrint} className="flex-1 gap-2">
            <Printer className="h-4 w-4" />
            Print Invoice
          </Button>
          <Button onClick={handleSavePDF} variant="outline" className="flex-1 gap-2">
            <Download className="h-4 w-4" />
            Save as PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceModal;
