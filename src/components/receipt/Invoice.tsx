import React from 'react';
import { Sale } from '@/types/pos';
import { format } from 'date-fns';
import digitsalesLogo from '@/assets/zantrix-logo.png';
import { useSettingsStore } from '@/stores/settingsStore';

interface InvoiceProps {
  sale: Sale;
  invoiceType?: 'proforma' | 'tax';
  customerInfo?: {
    name: string;
    representative?: string;
    address?: string;
    poBox?: string;
    contactPerson?: string;
    mobile?: string;
    tin?: string;
    vrn?: string;
  };
  printedBy?: string;
}

const Invoice: React.FC<InvoiceProps> = ({
  sale,
  invoiceType = 'proforma',
  customerInfo,
  printedBy = 'System'
}) => {
  const { business } = useSettingsStore();
  const subtotal = sale.items.reduce((sum, item) => sum + (item.product.sellingPrice * item.quantity), 0);
  const vatRate = business.vatRate / 100;
  const vatAmount = subtotal * vatRate;
  const netAmount = subtotal + vatAmount;

  return (
    <div className="bg-white text-black p-8 w-full max-w-[800px] mx-auto font-sans text-sm" id="invoice-content">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-primary pb-4 mb-4">
        <div className="flex items-start gap-4">
          <img src={business.logo || digitsalesLogo} alt="Business Logo" className="w-20 h-20 object-contain" />
          <div>
            <h1 className="text-xl font-bold text-primary">{business.name}</h1>
            <p className="text-xs text-gray-600">{business.address}</p>
            <p className="text-xs text-gray-600">Phone: {business.phone}</p>
            <p className="text-xs text-gray-600">Email: {business.email}</p>
            <p className="text-xs text-slate-600">Acc No: {business.accountNumber}</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-lg font-bold text-primary uppercase">
            {invoiceType === 'proforma' ? 'Proforma Invoice' : 'Tax Invoice'}
          </h2>
          <p className="text-xs mt-1"><span className="font-semibold">TIN No:</span> {business.tin}</p>
          <p className="text-xs"><span className="font-semibold">VRN:</span> {business.vatNumber}</p>
          <p className="text-xs mt-2"><span className="font-semibold">Invoice #:</span> {sale.id}</p>
          <p className="text-xs"><span className="font-semibold">Date:</span> {format(new Date(sale.createdAt), 'dd/MM/yyyy')}</p>
        </div>
      </div>

      {/* Customer Info */}
      <div className="grid grid-cols-2 gap-8 mb-6 p-4 bg-gray-50 rounded">
        <div>
          <h3 className="font-bold text-primary mb-2 uppercase text-xs">Bill To:</h3>
          <div className="space-y-1 text-xs">
            <p><span className="font-semibold">Credit On:</span> {customerInfo?.name || 'Walk-in Customer'}</p>
            <p><span className="font-semibold">Repre. Name:</span> {customerInfo?.representative || '-'}</p>
            <p><span className="font-semibold">Address:</span> {customerInfo?.address || '-'}</p>
            <p><span className="font-semibold">P.O.BOX:</span> {customerInfo?.poBox || '-'}</p>
          </div>
        </div>
        <div>
          <h3 className="font-bold text-primary mb-2 uppercase text-xs">&nbsp;</h3>
          <div className="space-y-1 text-xs">
            <p><span className="font-semibold">Contact Person:</span> {customerInfo?.contactPerson || '-'}</p>
            <p><span className="font-semibold">Mobile:</span> {customerInfo?.mobile || '-'}</p>
            <p><span className="font-semibold">TIN:</span> {customerInfo?.tin || '-'}</p>
            <p><span className="font-semibold">VRN:</span> {customerInfo?.vrn || '-'}</p>
          </div>
        </div>
      </div>

      {/* Description Header */}
      <div className="bg-primary text-white px-4 py-2 font-bold text-xs uppercase">
        Description:
      </div>

      {/* Items Table */}
      <table className="w-full border-collapse mb-4">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold">Item Code</th>
            <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold">Item Name</th>
            <th className="border border-gray-300 px-3 py-2 text-center text-xs font-semibold">Unit</th>
            <th className="border border-gray-300 px-3 py-2 text-center text-xs font-semibold">Qty</th>
            <th className="border border-gray-300 px-3 py-2 text-right text-xs font-semibold">Price</th>
            <th className="border border-gray-300 px-3 py-2 text-right text-xs font-semibold">Total</th>
          </tr>
        </thead>
        <tbody>
          {sale.items.map((item, index) => (
            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="border border-gray-300 px-3 py-2 text-xs">{item.product.sku}</td>
              <td className="border border-gray-300 px-3 py-2 text-xs">{item.product.name}</td>
              <td className="border border-gray-300 px-3 py-2 text-center text-xs">{item.product.unit}</td>
              <td className="border border-gray-300 px-3 py-2 text-center text-xs">{item.quantity}</td>
              <td className="border border-gray-300 px-3 py-2 text-right text-xs">
                {item.product.sellingPrice.toLocaleString('en-TZ', { minimumFractionDigits: 2 })}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-right text-xs font-medium">
                {(item.product.sellingPrice * item.quantity).toLocaleString('en-TZ', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-6">
        <div className="w-64">
          <div className="flex justify-between py-1 text-xs">
            <span className="font-semibold">Subtotal:</span>
            <span>{subtotal.toLocaleString('en-TZ', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between py-1 text-xs">
            <span className="font-semibold">VAT ({business.vatRate}%):</span>
            <span>{vatAmount.toLocaleString('en-TZ', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between py-2 text-sm font-bold border-t-2 border-primary mt-1 pt-2 bg-primary/10 px-2 -mx-2">
            <span>NET AMOUNT:</span>
            <span>{netAmount.toLocaleString('en-TZ', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="mb-6 p-4 bg-gray-50 rounded text-xs">
        <h3 className="font-bold text-primary mb-2 uppercase">Sales Order Terms and Conditions</h3>
        <ol className="list-decimal list-inside space-y-1 text-gray-700">
          <li>Delivery: Seller will not assume any responsibility for any damage resulting from any delays beyond its control.</li>
          <li>Return: No goods may be returned to Sellers without the prior written consent of Seller and are subject to a return charge.</li>
          <li>Payments should be made through the authorized bank account details provided by the company.</li>
          <li>The price shown on the proforma is valid for 3 days and is subject to receipt of payment along with the purchase order within the stipulated period.</li>
          <li>The management reserves the right to review the price without any notice.</li>
          <li>In the case of any price escalations, only the quantity paid before the effective date of review will be applicable for supply.</li>
          <li>Force majeure towards effecting supplies shall apply.</li>
        </ol>
      </div>

      {/* Account Details (Dynamic from settings) */}
      {business.accountNumber && (
        <div className="mb-6 p-4 border border-zinc-200 rounded">
          <h3 className="font-bold text-primary mb-2 uppercase text-xs">Payment Information</h3>
          <p className="text-xs">Bank Account Number: <span className="font-bold">{business.accountNumber}</span></p>
          <p className="text-center text-xs mt-3 italic text-gray-600">Make all checks payable to {business.name}</p>
        </div>
      )}

      {/* Thank You Message */}
      <div className="text-center mb-4">
        <p className="text-primary font-semibold">Thank you for your business</p>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-300 pt-3 text-center text-xs text-gray-600">
        <p>{business.name}, {business.address}</p>
        <p>TIN: {business.tin}</p>
        <div className="flex justify-between mt-2 text-[10px]">
          <span>Report Date: {format(new Date(), 'dd/MM/yyyy hh:mm:ss a')}</span>
          <span>Printed by: {printedBy}</span>
          <span>Page 1 / 1</span>
        </div>
      </div>
    </div >
  );
};

export default Invoice;
