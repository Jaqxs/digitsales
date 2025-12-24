import { forwardRef } from 'react';
import { Sale, CartItem } from '@/types/pos';
import { formatCurrency, formatDateTime } from '@/lib/pos-utils';
import zantrixLogo from '@/assets/zantrix-logo.png';

interface ReceiptProps {
  sale: Sale | null;
  items?: CartItem[];
  subtotal?: number;
  vat?: number;
  total?: number;
  paymentMethod?: string;
  customerName?: string;
}

export const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(
  ({ sale, items, subtotal, vat, total, paymentMethod, customerName }, ref) => {
    // Use sale data if provided, otherwise use individual props
    const receiptItems = sale?.items || items || [];
    const receiptSubtotal = sale?.subtotal || subtotal || 0;
    const receiptVat = sale?.vat || vat || 0;
    const receiptTotal = sale?.total || total || 0;
    const receiptPayment = sale?.paymentMethod || paymentMethod || 'cash';
    const receiptDate = sale?.createdAt ? new Date(sale.createdAt) : new Date();
    const receiptId = sale?.id || `INV-${Date.now()}`;

    const paymentLabels: Record<string, string> = {
      cash: 'Cash',
      card: 'Card',
      mpesa: 'M-Pesa',
      'bank-transfer': 'Bank Transfer',
    };

    return (
      <div
        ref={ref}
        className="receipt-container bg-white text-black p-4 w-full max-w-[300px] mx-auto font-mono text-xs"
        style={{ fontFamily: "'Courier New', Courier, monospace" }}
      >
        {/* Header */}
        <div className="text-center mb-4">
          <img
            src={zantrixLogo}
            alt="Zantrix"
            className="h-12 mx-auto mb-2 print:h-10"
          />
          <h1 className="font-bold text-sm">ZANTRIX GROUP LIMITED</h1>
          <p className="text-[10px] leading-tight">
            Hardware & Construction Supplies
          </p>
          <p className="text-[10px] leading-tight">
            Posta Street, Kariakoo, Dar es Salaam
          </p>
          <p className="text-[10px] leading-tight">Tel: +255 22 123 4567</p>
          <p className="text-[10px] leading-tight">TIN: 123-456-789</p>
        </div>

        {/* Divider */}
        <div className="border-t border-dashed border-black my-2" />

        {/* Receipt Info */}
        <div className="mb-3 text-[10px]">
          <div className="flex justify-between">
            <span>Receipt #:</span>
            <span className="font-bold">{receiptId}</span>
          </div>
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{formatDateTime(receiptDate)}</span>
          </div>
          {customerName && (
            <div className="flex justify-between">
              <span>Customer:</span>
              <span>{customerName}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Payment:</span>
            <span>{paymentLabels[receiptPayment] || receiptPayment}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-dashed border-black my-2" />

        {/* Items Header */}
        <div className="flex justify-between font-bold text-[10px] mb-1">
          <span className="flex-1">Item</span>
          <span className="w-8 text-center">Qty</span>
          <span className="w-20 text-right">Amount</span>
        </div>

        {/* Items */}
        <div className="space-y-1">
          {receiptItems.map((item, index) => (
            <div key={index} className="text-[10px]">
              <div className="flex justify-between">
                <span className="flex-1 truncate pr-1">{item.product.name}</span>
                <span className="w-8 text-center">{item.quantity}</span>
                <span className="w-20 text-right">
                  {formatCurrency(item.product.sellingPrice * item.quantity)}
                </span>
              </div>
              <div className="text-[9px] text-gray-600 pl-2">
                @ {formatCurrency(item.product.sellingPrice)} each
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-dashed border-black my-2" />

        {/* Totals */}
        <div className="space-y-1 text-[10px]">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(receiptSubtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>VAT (18%):</span>
            <span>{formatCurrency(receiptVat)}</span>
          </div>
          <div className="flex justify-between font-bold text-sm mt-1 pt-1 border-t border-black">
            <span>TOTAL:</span>
            <span>{formatCurrency(receiptTotal)}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-dashed border-black my-3" />

        {/* Footer */}
        <div className="text-center text-[9px] space-y-1">
          <p className="font-bold">Thank you for your business!</p>
          <p>Goods once sold cannot be returned</p>
          <p>unless with original receipt</p>
          <div className="mt-3 pt-2 border-t border-dashed border-black">
            <p>Served by: Zantrix POS</p>
            <p className="mt-1">www.zantrix.co.tz</p>
          </div>
        </div>

        {/* Barcode placeholder */}
        <div className="mt-4 text-center">
          <div className="inline-block">
            <div className="flex justify-center gap-[1px]">
              {Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-black"
                  style={{
                    width: Math.random() > 0.5 ? '2px' : '1px',
                    height: '24px',
                  }}
                />
              ))}
            </div>
            <p className="text-[8px] mt-1">{receiptId}</p>
          </div>
        </div>
      </div>
    );
  }
);

Receipt.displayName = 'Receipt';
