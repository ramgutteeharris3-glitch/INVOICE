
import React from 'react';
import { Invoice, CURRENCY_SYMBOLS } from '../types';

interface Props {
  invoice: Invoice;
}

const InvoicePreview: React.FC<Props> = ({ invoice }) => {
  const subtotal = invoice.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const taxAmount = (subtotal * invoice.taxRate) / 100;
  const discountAmount = (subtotal * invoice.discount) / 100;
  const total = subtotal + taxAmount - discountAmount;

  const symbol = CURRENCY_SYMBOLS[invoice.currency] || '$';

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: invoice.currency,
      minimumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="bg-white invoice-shadow rounded-none sm:rounded-2xl border border-slate-200 overflow-hidden transition-all duration-500 shadow-2xl shadow-indigo-100/50">
      {/* Decorative top bar */}
      <div className="h-2 bg-indigo-600 no-print" />

      <div className="p-8 sm:p-12">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-8 mb-12">
          <div>
            <div className="mb-6">
               {invoice.sender.name ? (
                 <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{invoice.sender.name}</h2>
               ) : (
                 <div className="text-3xl font-black text-slate-200 tracking-tighter uppercase italic">Your Company</div>
               )}
            </div>
            <div className="text-slate-500 text-sm leading-relaxed max-w-xs whitespace-pre-line">
              {invoice.sender.address || "Address details will appear here"}
              <br />
              {invoice.sender.email}
            </div>
          </div>
          
          <div className="text-right">
            <h1 className="text-5xl font-light text-slate-300 tracking-tight mb-2 uppercase">Invoice</h1>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-900">#{invoice.invoiceNumber}</p>
              <div className="flex flex-col items-end gap-1">
                <div className="flex gap-4 text-xs text-slate-400">
                  <span>DATE</span>
                  <span className="font-bold text-slate-600">{invoice.date}</span>
                </div>
                <div className="flex gap-4 text-xs text-slate-400">
                  <span>DUE DATE</span>
                  <span className="font-bold text-slate-600">{invoice.dueDate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bill To */}
        <div className="mb-12">
          <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-3">Bill To</h3>
          <div className="text-slate-900 font-bold text-lg mb-1">
            {invoice.client.name || "Client Name"}
          </div>
          <div className="text-slate-500 text-sm whitespace-pre-line leading-relaxed max-w-xs">
            {invoice.client.address}
            <br />
            {invoice.client.email}
          </div>
        </div>

        {/* Table */}
        <div className="mb-12">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-slate-900">
                <th className="py-4 text-left text-[10px] font-black text-slate-900 uppercase tracking-widest">Description</th>
                <th className="py-4 text-center text-[10px] font-black text-slate-900 uppercase tracking-widest w-20">Qty</th>
                <th className="py-4 text-right text-[10px] font-black text-slate-900 uppercase tracking-widest w-32">Price</th>
                <th className="py-4 text-right text-[10px] font-black text-slate-900 uppercase tracking-widest w-32">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-5">
                    <div className="text-slate-800 font-bold">{item.description || "New Item"}</div>
                  </td>
                  <td className="py-5 text-center text-slate-500 font-medium">{item.quantity}</td>
                  <td className="py-5 text-right text-slate-500 font-medium">{formatCurrency(item.rate)}</td>
                  <td className="py-5 text-right text-slate-900 font-bold">{formatCurrency(item.quantity * item.rate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculation Section */}
        <div className="flex flex-col sm:flex-row justify-between gap-12 pt-8 border-t-2 border-slate-900">
          <div className="flex-1">
             {invoice.notes && (
               <>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Notes & Terms</h4>
                <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-line italic">
                  {invoice.notes}
                </p>
               </>
             )}
          </div>
          
          <div className="sm:w-64">
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-slate-500 font-medium">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {invoice.taxRate > 0 && (
                <div className="flex justify-between text-sm text-slate-500 font-medium">
                  <span>Tax ({invoice.taxRate}%)</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
              )}
              {invoice.discount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600 font-medium">
                  <span>Discount ({invoice.discount}%)</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                <span className="text-lg font-black text-slate-900 uppercase">Total Due</span>
                <span className="text-2xl font-black text-indigo-600">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-20 text-center border-t border-slate-50 pt-8">
           <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">Thank you for your business</p>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;
