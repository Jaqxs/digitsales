import { forwardRef } from 'react';
import { Sale, CartItem } from '@/types/pos';
import { formatCurrency, formatDateTime } from '@/lib/pos-utils';
import zantrixLogo from '@/assets/zantrix-logo.png';
import { useSettingsStore } from '@/stores/settingsStore';

interface ReceiptProps {
  sale: Sale | null;
  items?: CartItem[];
  subtotal?: number;
  vat?: number;
  total?: number;
  paymentMethod?: string;
  customerName?: string;
  cashierName?: string;
}

export const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(
  ({ sale, items, subtotal, vat, total, paymentMethod, customerName, cashierName }, ref) => {
    const { business } = useSettingsStore();

    // Use sale data if provided, otherwise use individual props
    const receiptItems = sale?.items || items || [];
    const receiptSubtotal = sale?.subtotal || subtotal || 0;
    const receiptVat = sale?.vat || vat || 0;
    const receiptTotal = sale?.total || total || 0;
    const receiptPayment = sale?.paymentMethod || paymentMethod || 'cash';
    const receiptDate = sale?.createdAt ? new Date(sale.createdAt) : new Date();
    // Simplified, cleaner receipt number (last 8 chars if it's a long hex ID)
    const receiptId = sale?.id
      ? (sale.id.length > 10 ? sale.id.slice(-8).toUpperCase() : sale.id.toUpperCase())
      : `TXN${Date.now().toString().slice(-6)}`;
    const receiptCustomer = sale?.customerName || customerName || 'Walk-in Customer';

    const paymentLabels: Record<string, string> = {
      cash: 'CASH',
      card: 'CARD',
      mpesa: 'M-PESA',
      'bank-transfer': 'BANK TRANSFER',
    };

    return (
      <div
        ref={ref}
        className="receipt-container bg-white text-zinc-900 p-6 w-full max-w-[340px] mx-auto font-sans shadow-sm"
        style={{ fontSize: '12px', lineHeight: '1.4' }}
      >
        {/* Header - Brand Identity */}
        <div className="text-center mb-6">
          <img
            src={zantrixLogo}
            alt="Zantrix"
            className="h-14 mx-auto mb-3"
          />
          <h1 className="font-bold text-base tracking-tight text-primary uppercase">{business.name}</h1>
          <div className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider font-medium">
            <p>Building Solutions & Hardware</p>
            <p>{business.address}</p>
            <p>TEL: {business.phone}</p>
            <p>TIN: {business.tin}</p>
          </div>
        </div>

        {/* Simplified & Clean Reference Section */}
        <div className="mb-6 border-y-2 border-zinc-100 py-4 space-y-4">
          <div className="text-center">
            <p className="text-[9px] text-zinc-400 uppercase font-black tracking-[0.2em] mb-1">Receipt Number</p>
            <p className="text-xl font-black text-zinc-900 tracking-tighter">#{receiptId}</p>
          </div>

          <div className="grid grid-cols-2 gap-y-2.5 px-1">
            <div className="space-y-0.5 text-left font-medium">
              <p className="text-[8px] text-zinc-400 uppercase tracking-widest leading-none">Date & Time</p>
              <p className="text-[10px] text-zinc-800 leading-none">{formatDateTime(receiptDate)}</p>
            </div>
            <div className="space-y-0.5 text-right font-medium">
              <p className="text-[8px] text-zinc-400 uppercase tracking-widest leading-none">Cashier</p>
              <p className="text-[10px] text-zinc-800 leading-none uppercase">{cashierName || 'John Doe'}</p>
            </div>
            <div className="space-y-0.5 text-left font-medium col-span-2 pt-1 border-t border-zinc-50">
              <p className="text-[8px] text-zinc-400 uppercase tracking-widest leading-none">Customer Information</p>
              <p className="text-[11px] text-primary font-black leading-none">{receiptCustomer}</p>
            </div>
          </div>
        </div>

        {/* Order Details Header */}
        <div className="flex justify-between font-bold text-[10px] uppercase tracking-widest text-zinc-400 mb-2 px-1">
          <span>Description</span>
          <span>Total</span>
        </div>

        {/* Items List - Clean Format */}
        <div className="space-y-3 mb-6">
          {receiptItems.map((item, index) => (
            <div key={index} className="flex flex-col gap-0.5 border-b border-zinc-50 pb-2 last:border-0 last:pb-0">
              <div className="flex justify-between gap-4">
                <span className="font-bold text-zinc-800 leading-tight flex-1">
                  {item.product.name}
                </span>
                <span className="font-bold text-zinc-900 whitespace-nowrap">
                  {formatCurrency(item.product.sellingPrice * item.quantity)}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-zinc-500 font-medium">
                <span>{item.quantity} {item.product.unit || 'PCS'} × {formatCurrency(item.product.sellingPrice)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Financial Summary */}
        <div className="space-y-2 border-t-2 border-zinc-900 pt-4 mb-6">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500 font-medium lowercase italic">Subtotal</span>
            <span className="font-semibold">{formatCurrency(receiptSubtotal)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500 font-medium lowercase italic">Vat ({business.vatRate}%)</span>
            <span className="font-semibold">{formatCurrency(receiptVat)}</span>
          </div>

          <div className="flex justify-between items-center bg-primary text-primary-foreground p-3 rounded-lg mt-2 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Total Amount</span>
            <span className="text-lg font-black tracking-tight">
              {formatCurrency(receiptTotal)}
            </span>
          </div>

          <div className="flex justify-between items-center pt-2 px-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Paid via</span>
            <span className="text-xs font-black text-primary underline underline-offset-4 decoration-2">
              {paymentLabels[receiptPayment] || receiptPayment}
            </span>
          </div>
        </div>

        {/* Footer - Professional Tone */}
        <div className="text-center space-y-4 pt-4 border-t border-dashed border-zinc-200">
          <div className="space-y-1">
            <p className="font-black text-xs text-primary italic uppercase tracking-widest">Ujenzi Wetu, Nguvu Zetu</p>
            <p className="text-[10px] text-zinc-400 font-medium max-w-[200px] mx-auto uppercase">
              Thank you for choosing {business.name} for your construction needs.
            </p>
          </div>

          <div className="text-[9px] text-zinc-500 leading-relaxed bg-zinc-50 rounded p-2 border border-zinc-100">
            <p className="font-bold text-zinc-900 mb-0.5">Return Policy</p>
            <p>Goods once sold are not returnable without the original receipt. Returns subject to 10% restocking fee.</p>
          </div>

          {/* Barcode Section */}
          <div className="pt-4 flex flex-col items-center">
            <div className="flex justify-center gap-[1.5px] h-8 opacity-80">
              {Array.from({ length: 40 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-black"
                  style={{
                    width: [1, 1, 2, 1, 3, 1, 1, 2][i % 8] + 'px',
                    height: '32px',
                  }}
                />
              ))}
            </div>
            <p className="text-[9px] font-mono mt-2 tracking-widest text-zinc-400">*{receiptId}*</p>
          </div>

          <p className="text-[10px] text-zinc-300 font-medium pt-3 italic border-t border-zinc-50">
            POWERED BY ZANTRIX POS
          </p>
        </div>
      </div>
    );
  }
);

Receipt.displayName = 'Receipt';

