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
import { Printer, Download, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
}: ReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                font-family: 'Courier New', Courier, monospace;
                font-size: 10px;
                line-height: 1.3;
                color: #000;
                background: #fff;
                padding: 8px;
                width: 80mm; /* Thermal printer width */
                max-width: 80mm;
              }
              img {
                max-width: 100%;
                height: auto;
              }
              .receipt-container {
                width: 100%;
              }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .font-bold { font-weight: bold; }
              .flex { display: flex; }
              .justify-between { justify-content: space-between; }
              .items-center { align-items: center; }
              .flex-1 { flex: 1; }
              .truncate { 
                overflow: hidden; 
                text-overflow: ellipsis; 
                white-space: nowrap; 
              }
              .space-y-1 > * + * { margin-top: 4px; }
              .mb-2 { margin-bottom: 8px; }
              .mb-3 { margin-bottom: 12px; }
              .mb-4 { margin-bottom: 16px; }
              .mt-1 { margin-top: 4px; }
              .mt-3 { margin-top: 12px; }
              .mt-4 { margin-top: 16px; }
              .my-2 { margin-top: 8px; margin-bottom: 8px; }
              .my-3 { margin-top: 12px; margin-bottom: 12px; }
              .pt-1 { padding-top: 4px; }
              .pt-2 { padding-top: 8px; }
              .pl-2 { padding-left: 8px; }
              .pr-1 { padding-right: 4px; }
              .w-8 { width: 32px; }
              .w-20 { width: 80px; }
              .border-t { border-top: 1px dashed #000; }
              .border-dashed { border-style: dashed; }
              .border-black { border-color: #000; }
              .text-gray-600 { color: #666; }
              .inline-block { display: inline-block; }
              .gap-\\[1px\\] { gap: 1px; }
              .justify-center { justify-content: center; }
              .h-12 { height: 48px; }
              .mx-auto { margin-left: auto; margin-right: auto; }
              .text-sm { font-size: 12px; }
              .text-\\[10px\\] { font-size: 10px; }
              .text-\\[9px\\] { font-size: 9px; }
              .text-\\[8px\\] { font-size: 8px; }
              .leading-tight { line-height: 1.2; }
              @media print {
                body { 
                  width: 80mm;
                  padding: 4px;
                }
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
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                font-family: 'Courier New', Courier, monospace;
                font-size: 10px;
                line-height: 1.3;
                color: #000;
                background: #fff;
                padding: 16px;
                width: 80mm;
              }
              img {
                max-width: 100%;
                height: auto;
              }
              .receipt-container {
                width: 100%;
              }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .font-bold { font-weight: bold; }
              .flex { display: flex; }
              .justify-between { justify-content: space-between; }
              .flex-1 { flex: 1; }
              .truncate { 
                overflow: hidden; 
                text-overflow: ellipsis; 
                white-space: nowrap; 
              }
              .space-y-1 > * + * { margin-top: 4px; }
              .mb-2 { margin-bottom: 8px; }
              .mb-3 { margin-bottom: 12px; }
              .mb-4 { margin-bottom: 16px; }
              .mt-1 { margin-top: 4px; }
              .mt-3 { margin-top: 12px; }
              .mt-4 { margin-top: 16px; }
              .my-2 { margin-top: 8px; margin-bottom: 8px; }
              .my-3 { margin-top: 12px; margin-bottom: 12px; }
              .pt-1 { padding-top: 4px; }
              .pt-2 { padding-top: 8px; }
              .pl-2 { padding-left: 8px; }
              .pr-1 { padding-right: 4px; }
              .w-8 { width: 32px; }
              .w-20 { width: 80px; }
              .border-t { border-top: 1px dashed #000; }
              .border-dashed { border-style: dashed; }
              .border-black { border-color: #000; }
              .text-gray-600 { color: #666; }
              .inline-block { display: inline-block; }
              .h-12 { height: 48px; }
              .mx-auto { margin-left: auto; margin-right: auto; }
              .text-sm { font-size: 12px; }
              .text-\\[10px\\] { font-size: 10px; }
              .text-\\[9px\\] { font-size: 9px; }
              .text-\\[8px\\] { font-size: 8px; }
              .leading-tight { line-height: 1.2; }
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
            <span>Receipt</span>
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
    </Dialog>
  );
}
