import React from 'react';
import { Sale } from '@/types/pos';
import { format } from 'date-fns';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSettingsStore } from '@/stores/settingsStore';

interface DeliveryNoteProps {
    sale: Sale;
    customerInfo?: {
        name: string;
        representative?: string;
        address?: string;
        mobile?: string;
    };
    printedBy?: string;
}

const DeliveryNote: React.FC<DeliveryNoteProps> = ({
    sale,
    customerInfo,
    printedBy = 'System'
}) => {
    const { business } = useSettingsStore();

    return (
        <div className="bg-white text-black p-8 w-full max-w-[800px] mx-auto font-sans text-sm" id="delivery-note-content">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-accent pb-4 mb-4">
                <div className="flex items-start gap-4">
                    <img src={business.logo || digitsalesLogo} alt="Business Logo" className="w-20 h-20 object-contain" />
                    <div>
                        <h1 className="text-xl font-bold text-primary">{business.name}</h1>
                        <p className="text-xs text-gray-600">{business.address}</p>
                        <p className="text-xs text-gray-600">TEL: {business.phone}</p>
                        <p className="text-xs text-gray-600">Email: {business.email}</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-2xl font-black text-accent uppercase tracking-tighter">Delivery Note</h2>
                    <p className="text-xs mt-1 font-bold"><span className="text-zinc-400">TIN No:</span> {business.tin}</p>
                    <p className="text-xs font-bold pt-4"><span className="text-zinc-400">Order Ref:</span> #{sale.id.toUpperCase()}</p>
                    <p className="text-xs font-bold"><span className="text-zinc-400">Date:</span> {format(new Date(sale.createdAt), 'dd/MM/yyyy')}</p>
                </div>
            </div>

            {/* Recipient & Logistics Info */}
            <div className="grid grid-cols-2 gap-8 mb-6 p-5 bg-zinc-50 rounded-xl border border-zinc-100">
                <div>
                    <h3 className="font-black text-primary mb-3 uppercase text-[10px] tracking-widest">Ship To / Receiver:</h3>
                    <div className="space-y-1.5">
                        <p className="text-sm font-black text-zinc-900">{customerInfo?.name || sale.customerName || 'Walk-in Customer'}</p>
                        <p className="text-xs text-zinc-600"><span className="font-bold">Contact:</span> {customerInfo?.mobile || '-'}</p>
                        <p className="text-xs text-zinc-600"><span className="font-bold">Address:</span> {customerInfo?.address || '-'}</p>
                    </div>
                </div>
                <div className="flex flex-col justify-end text-right">
                    <div className="space-y-1 text-xs">
                        <p><span className="font-bold text-zinc-400 uppercase tracking-tighter mr-2">Status:</span>
                            <span className="font-black text-emerald-600 uppercase italic">Ready for Dispatch</span>
                        </p>
                        <p><span className="font-bold text-zinc-400 uppercase tracking-tighter mr-2">Payment:</span>
                            <span className="font-black text-zinc-900 uppercase">{sale.paymentMethod}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Description Header */}
            <div className="bg-primary text-white px-4 py-2 font-black text-xs uppercase tracking-[0.2em] rounded-t-lg">
                Inventory Checklist / Items to Deliver:
            </div>

            {/* Items Table */}
            <table className="w-full border-collapse mb-8">
                <thead>
                    <tr className="bg-zinc-100">
                        <th className="border border-zinc-200 px-4 py-3 text-left text-xs font-black uppercase tracking-wider">Item SKU</th>
                        <th className="border border-zinc-200 px-4 py-3 text-left text-xs font-black uppercase tracking-wider">Description</th>
                        <th className="border border-zinc-200 px-4 py-3 text-center text-xs font-black uppercase tracking-wider">Unit</th>
                        <th className="border border-zinc-200 px-4 py-3 text-center text-xs font-black uppercase tracking-wider w-32">Qty Ordered</th>
                        <th className="border border-zinc-200 px-4 py-3 text-center text-xs font-black uppercase tracking-wider w-32">Qty Delivered</th>
                    </tr>
                </thead>
                <tbody>
                    {sale.items.map((item, index) => (
                        <tr key={index} className="hover:bg-zinc-50 transition-colors">
                            <td className="border border-zinc-200 px-4 py-3 text-xs font-mono font-bold text-primary">{item.product.sku}</td>
                            <td className="border border-zinc-200 px-4 py-3 text-xs font-bold text-zinc-800">{item.product.name}</td>
                            <td className="border border-zinc-200 px-4 py-3 text-center text-xs font-medium text-zinc-500">{item.product.unit || 'PCS'}</td>
                            <td className="border border-zinc-200 px-4 py-3 text-center text-sm font-black text-zinc-900">{item.quantity}</td>
                            <td className="border border-zinc-200 px-4 py-3 text-center text-xs italic text-zinc-300">__________</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Delivery Confirmation Area */}
            <div className="grid grid-cols-2 gap-12 mt-12 mb-12">
                <div className="space-y-6">
                    <div className="border-t-2 border-zinc-900 pt-3">
                        <h4 className="font-black text-[10px] uppercase tracking-widest text-zinc-400 mb-8">Store Keeper / Released By</h4>
                        <div className="flex flex-col gap-1">
                            <p className="text-xs font-bold">Name: _______________________</p>
                            <p className="text-xs font-bold pt-2">Sign: _______________________</p>
                        </div>
                    </div>
                </div>
                <div className="space-y-6 text-right">
                    <div className="border-t-2 border-accent pt-3">
                        <h4 className="font-black text-[10px] uppercase tracking-widest text-zinc-400 mb-8">Customer / Received By</h4>
                        <div className="flex flex-col items-end gap-1">
                            <p className="text-xs font-bold">Name: _______________________</p>
                            <p className="text-xs font-bold pt-2">Sign: _______________________</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Note Section */}
            <div className="mb-8 p-4 bg-accent/5 border-l-4 border-accent rounded-r-lg">
                <p className="text-xs text-accent font-black uppercase tracking-widest mb-1 italic">Important Note for Store Keeper:</p>
                <p className="text-xs text-zinc-600">Please verify all items and quantities before releasing the goods. The receiver must sign this document as proof of collection. Any discrepancies must be noted immediately.</p>
            </div>

            {/* Footer */}
            <div className="border-t border-zinc-200 pt-6 text-center text-[10px] text-zinc-400 uppercase tracking-[0.2em] font-bold">
                <p>{business.name} &bull; Document of Delivery</p>
                <div className="flex justify-between mt-4 font-medium tracking-normal text-zinc-300 lowercase italic">
                    <span>Printed: {format(new Date(), 'dd/mm/yyyy hh:mm:ss a')}</span>
                    <span>By: {printedBy}</span>
                    <span>Control Copy: Alpha-01</span>
                </div>
            </div>
        </div >
    );
};

export default DeliveryNote;
