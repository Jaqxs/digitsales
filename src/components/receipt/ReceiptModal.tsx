import { useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Receipt } from './Receipt';
import { Sale, CartItem } from '@/types/pos';
import { Printer, Download, Truck, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DeliveryNoteModal } from './';
import { useState } from 'react';

interface ReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale?: Sale | null;
  items?: CartItem[];
  subtotal?: number;
  vat?: number;
  total?: number;
  paymentMethod?: string;
  customerName?: string;
  cashierName?: string;
}

export function ReceiptModal({
  open,
  onOpenChange,
  sale,
  items,
  subtotal,
  vat,
  total,
  paymentMethod,
  customerName,
  cashierName,
}: ReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [deliveryNoteOpen, setDeliveryNoteOpen] = useState(false);

  const handlePrint = () => {
    if (!receiptRef.current) return;

    const printContent = receiptRef.current.innerHTML;
    const printWindow = window.open('', '_blank', 'width=320,height=600');

    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Receipt - Zantrix POS</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
              
              :root {
                --primary: 221 66% 45%;
                --primary-foreground: 210 40% 98%;
              }

              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              body {
                font-family: 'Inter', -apple-system, sans-serif;
                font-size: 11px;
                line-height: 1.4;
                color: #18181b;
                background: #fff;
                width: 80mm;
                max-width: 80mm;
              }
              .receipt-container {
                width: 100%;
                padding: 10mm 4mm;
              }
              img {
                max-width: 100%;
                height: auto;
              }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .text-zinc-900 { color: #18181b; }
              .text-zinc-800 { color: #27272a; }
              .text-zinc-500 { color: #71717a; }
              .text-zinc-400 { color: #a1a1aa; }
              .text-zinc-300 { color: #d4d4d8; }
              .bg-zinc-50 { background-color: #fafafa; }
              .bg-zinc-200 { background-color: #e4e4e7; }
              .border-zinc-100 { border: 1px solid #f4f4f5; }
              .border-zinc-50 { border-bottom: 1px solid #fafafa; }
              .border-zinc-200 { border-color: #e4e4e7; }
              .border-t { border-top: 1px solid #18181b; }
              .border-t-2 { border-top: 2px solid #18181b; }
              .border-y-2 { border-top: 2px solid #f4f4f5; border-bottom: 2px solid #f4f4f5; }
              .border-dashed { border-style: dashed; }
              .font-bold { font-weight: 700; }
              .font-black { font-weight: 900; }
              .font-medium { font-weight: 500; }
              .font-semibold { font-weight: 600; }
              .italic { font-style: italic; }
              .uppercase { text-transform: uppercase; }
              .lowercase { text-transform: lowercase; }
              .flex { display: flex; }
              .flex-col { flex-direction: column; }
              .grid { display: grid; }
              .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
              .col-span-2 { grid-column: span 2 / span 2; }
              .justify-between { justify-content: space-between; }
              .justify-center { justify-content: center; }
              .items-center { align-items: center; }
              .gap-0\\.5 { gap: 2px; }
              .gap-1\\.5 { gap: 6px; }
              .gap-2\\.5 { gap: 10px; }
              .gap-4 { gap: 16px; }
              .mb-1 { margin-bottom: 4px; }
              .mb-2 { margin-bottom: 8px; }
              .mb-3 { margin-bottom: 12px; }
              .mb-4 { margin-bottom: 16px; }
              .mb-6 { margin-bottom: 24px; }
              .mt-1 { margin-top: 4px; }
              .mt-2 { margin-top: 8px; }
              .my-1 { margin-top: 4px; margin-bottom: 4px; }
              .p-2 { padding: 8px; }
              .p-3 { padding: 12px; }
              .p-4 { padding: 16px; }
              .p-6 { padding: 24px; }
              .px-1 { padding-left: 4px; padding-right: 4px; }
              .py-2 { padding-top: 8px; padding-bottom: 8px; }
              .py-4 { padding-top: 16px; padding-bottom: 16px; }
              .pt-1 { padding-top: 4px; }
              .pt-3 { padding-top: 12px; }
              .pt-4 { padding-top: 16px; }
              .pb-2 { padding-bottom: 8px; }
              .space-y-0\\.5 > * + * { margin-top: 2px; }
              .space-y-1 { margin-top: 4px; }
              .space-y-1\\.5 > * + * { margin-top: 6px; }
              .space-y-2 > * + * { margin-top: 8px; }
              .space-y-3 > * + * { margin-top: 12px; }
              .space-y-4 > * + * { margin-top: 16px; }
              .text-left { text-align: left; }
              .rounded-lg { border-radius: 8px; }
              .rounded { border-radius: 4px; }
              .tracking-tight { letter-spacing: -0.025em; }
              .tracking-tighter { letter-spacing: -0.05em; }
              .tracking-wider { letter-spacing: 0.05em; }
              .tracking-widest { letter-spacing: 0.1em; }
              .text-base { font-size: 14px; }
              .text-xs { font-size: 11px; }
              .text-lg { font-size: 16px; }
              .text-xl { font-size: 20px; }
              .text-\\[10px\\] { font-size: 10px; }
              .text-\\[9px\\] { font-size: 9px; }
              .text-\\[8px\\] { font-size: 8px; }
              .text-\\[11px\\] { font-size: 11px; }
              .text-primary { color: hsl(221, 66%, 45%); }
              .bg-primary { background-color: hsl(221, 66%, 45%); }
              .text-primary-foreground { color: #f8fafc; }
              .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
              .max-w-\\[140px\\] { max-width: 140px; }
              .max-w-\\[200px\\] { max-width: 200px; }
              .h-14 { height: 56px; }
              .h-px { height: 1px; }
              .h-8 { height: 32px; }
              .opacity-80 { opacity: 0.8; }
              .whitespace-nowrap { white-space: nowrap; }
              .underline { text-decoration: underline; }
              .underline-offset-4 { underline-offset: 4px; }
              .decoration-2 { text-decoration-thickness: 2px; }
              
              @media print {
                @page {
                  size: 80mm auto;
                  margin: 0;
                }
              }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `);
      printWindow.document.close();

      // Wait for images to load then print
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };

      // Fallback if onload doesn't fire
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  const handleDownloadPDF = () => {
    // Use browser's print to PDF functionality
    if (!receiptRef.current) return;

    const printContent = receiptRef.current.innerHTML;
    const printWindow = window.open('', '_blank', 'width=320,height=600');

    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Receipt - Zantrix POS</title>
            <style>
               @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
              
              :root {
                --primary: 221 66% 45%;
                --primary-foreground: 210 40% 98%;
              }

              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              body {
                font-family: 'Inter', -apple-system, sans-serif;
                font-size: 11px;
                line-height: 1.4;
                color: #18181b;
                background: #fff;
                width: 80mm;
                max-width: 80mm;
              }
              .receipt-container {
                width: 100%;
                padding: 10mm 4mm;
              }
              img {
                max-width: 100%;
                height: auto;
              }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .text-zinc-900 { color: #18181b; }
              .text-zinc-800 { color: #27272a; }
              .text-zinc-500 { color: #71717a; }
              .text-zinc-400 { color: #a1a1aa; }
              .text-zinc-300 { color: #d4d4d8; }
              .bg-zinc-50 { background-color: #fafafa; }
              .bg-zinc-200 { background-color: #e4e4e7; }
              .border-zinc-100 { border: 1px solid #f4f4f5; }
              .border-zinc-50 { border-bottom: 1px solid #fafafa; }
              .border-zinc-200 { border-color: #e4e4e7; }
              .border-t { border-top: 1px solid #18181b; }
              .border-t-2 { border-top: 2px solid #18181b; }
              .border-y-2 { border-top: 2px solid #f4f4f5; border-bottom: 2px solid #f4f4f5; }
              .border-dashed { border-style: dashed; }
              .font-bold { font-weight: 700; }
              .font-black { font-weight: 900; }
              .font-medium { font-weight: 500; }
              .font-semibold { font-weight: 600; }
              .italic { font-style: italic; }
              .uppercase { text-transform: uppercase; }
              .lowercase { text-transform: lowercase; }
              .flex { display: flex; }
              .flex-col { flex-direction: column; }
              .grid { display: grid; }
              .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
              .col-span-2 { grid-column: span 2 / span 2; }
              .justify-between { justify-content: space-between; }
              .justify-center { justify-content: center; }
              .items-center { align-items: center; }
              .gap-0\\.5 { gap: 2px; }
              .gap-1\\.5 { gap: 6px; }
              .gap-2\\.5 { gap: 10px; }
              .gap-4 { gap: 16px; }
              .mb-1 { margin-bottom: 4px; }
              .mb-2 { margin-bottom: 8px; }
              .mb-3 { margin-bottom: 12px; }
              .mb-4 { margin-bottom: 16px; }
              .mb-6 { margin-bottom: 24px; }
              .mt-1 { margin-top: 4px; }
              .mt-2 { margin-top: 8px; }
              .my-1 { margin-top: 4px; margin-bottom: 4px; }
              .p-2 { padding: 8px; }
              .p-3 { padding: 12px; }
              .p-4 { padding: 16px; }
              .p-6 { padding: 24px; }
              .px-1 { padding-left: 4px; padding-right: 4px; }
              .py-2 { padding-top: 8px; padding-bottom: 8px; }
              .py-4 { padding-top: 16px; padding-bottom: 16px; }
              .pt-1 { padding-top: 4px; }
              .pt-3 { padding-top: 12px; }
              .pt-4 { padding-top: 16px; }
              .pb-2 { padding-bottom: 8px; }
              .space-y-0\\.5 > * + * { margin-top: 2px; }
              .space-y-1 { margin-top: 4px; }
              .space-y-1\\.5 > * + * { margin-top: 6px; }
              .space-y-2 > * + * { margin-top: 8px; }
              .space-y-3 > * + * { margin-top: 12px; }
              .space-y-4 > * + * { margin-top: 16px; }
              .text-left { text-align: left; }
              .rounded-lg { border-radius: 8px; }
              .rounded { border-radius: 4px; }
              .tracking-tight { letter-spacing: -0.025em; }
              .tracking-tighter { letter-spacing: -0.05em; }
              .tracking-wider { letter-spacing: 0.05em; }
              .tracking-widest { letter-spacing: 0.1em; }
              .text-base { font-size: 14px; }
              .text-xs { font-size: 11px; }
              .text-lg { font-size: 16px; }
              .text-xl { font-size: 20px; }
              .text-\\[10px\\] { font-size: 10px; }
              .text-\\[9px\\] { font-size: 9px; }
              .text-\\[8px\\] { font-size: 8px; }
              .text-\\[11px\\] { font-size: 11px; }
              .text-primary { color: hsl(221, 66%, 45%); }
              .bg-primary { background-color: hsl(221, 66%, 45%); }
              .text-primary-foreground { color: #f8fafc; }
              .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
              .max-w-\\[140px\\] { max-width: 140px; }
              .max-w-\\[200px\\] { max-width: 200px; }
              .h-14 { height: 56px; }
              .h-px { height: 1px; }
              .h-8 { height: 32px; }
              .opacity-80 { opacity: 0.8; }
              .whitespace-nowrap { white-space: nowrap; }
              .underline { text-decoration: underline; }
              .underline-offset-4 { underline-offset: 4px; }
              .decoration-2 { text-decoration-thickness: 2px; }
              
              @page {
                size: 80mm auto;
                margin: 8mm;
              }
            </style>
          </head>
          <body>
            ${printContent}
            <script>
              window.onload = function() {
                window.print();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();

      toast({
        title: 'PDF Export',
        description: 'Use "Save as PDF" in the print dialog to download',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-md p-0 overflow-hidden max-h-[90vh]">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>Receipt</span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 text-[10px] font-bold border-accent text-accent hover:bg-accent hover:text-white"
                onClick={() => setDeliveryNoteOpen(true)}
              >
                <Truck className="h-3 w-3" />
                Delivery Note
              </Button>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 -mr-2"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Receipt Preview */}
        <div className="max-h-[60vh] overflow-y-auto px-4 py-2 bg-muted/50">
          <div className="shadow-lg rounded-lg overflow-hidden">
            <Receipt
              ref={receiptRef}
              sale={sale}
              items={items}
              subtotal={subtotal}
              vat={vat}
              total={total}
              paymentMethod={paymentMethod}
              customerName={customerName}
              cashierName={cashierName}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-border bg-card flex gap-2">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={handleDownloadPDF}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Save PDF</span>
            <span className="sm:hidden">PDF</span>
          </Button>
          <Button className="flex-1 gap-2" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Print Receipt</span>
            <span className="sm:hidden">Print</span>
          </Button>
        </div>
      </DialogContent>

      {
        sale && (
          <DeliveryNoteModal
            open={deliveryNoteOpen}
            onOpenChange={setDeliveryNoteOpen}
            sale={sale}
          />
        )
      }
    </Dialog >
  );
}
