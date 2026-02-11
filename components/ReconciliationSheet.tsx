
import React from 'react';
import { Receipt } from '../types';

interface Props {
  history: Receipt[];
}

const ReconciliationSheet: React.FC<Props> = ({ history }) => {
  const formatCurrency = (val: number) => {
    return val === 0 ? '0' : val.toLocaleString('en-MU', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const formatDate = (isoDate: string) => {
    if (!isoDate) return '';
    return isoDate.split('-').reverse().join('/');
  };

  const getRowData = (receipt: Receipt) => {
    const totalInclVat = receipt.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const qtyTotal = receipt.items.reduce((sum, item) => sum + item.quantity, 0);
    const taxFactor = 1 + (receipt.taxRate / 100);
    const totalExclVat = totalInclVat / taxFactor;
    const vatAmount = totalInclVat - totalExclVat;

    const isBank = ['Bank Transfer', 'Juice', 'Blink', 'MyT'].includes(receipt.paymentMethod);

    return {
      invNo: receipt.receiptNumber,
      description: receipt.receivedFrom || receipt.items[0]?.description || '---',
      qty: qtyTotal,
      rctpNo: receipt.chequeNo || '',
      net: totalExclVat,
      vat: vatAmount,
      total: totalInclVat,
      cash: receipt.paymentMethod === 'Cash' ? totalInclVat : 0,
      card: receipt.paymentMethod === 'Card' ? totalInclVat : 0,
      bank: isBank ? totalInclVat : 0,
      credit: receipt.paymentMethod === 'Credit' ? totalInclVat : 0,
      gift: receipt.paymentMethod === 'Gift' ? totalInclVat : 0,
      online: receipt.paymentMethod === 'Online' ? totalInclVat : 0,
    };
  };

  const rows = history.map(getRowData);
  
  const totals = rows.reduce((acc, row) => ({
    qty: acc.qty + row.qty,
    net: acc.net + row.net,
    vat: acc.vat + row.vat,
    total: acc.total + row.total,
    cash: acc.cash + row.cash,
    card: acc.card + row.card,
    bank: acc.bank + row.bank,
    credit: acc.credit + row.credit,
    gift: acc.gift + row.gift,
    online: acc.online + row.online,
  }), { qty: 0, net: 0, vat: 0, total: 0, cash: 0, card: 0, bank: 0, credit: 0, gift: 0, online: 0 });

  const cellClasses = "border border-slate-400 p-1 text-[9px] font-bold text-slate-900 h-8";
  const headerClasses = "border border-slate-400 bg-slate-100 p-1 text-[10px] font-black text-slate-900 text-center uppercase tracking-tight";

  const currentFormattedDate = new Date().toISOString().split('T')[0].split('-').reverse().join('/');

  return (
    <div className="bg-white p-6 overflow-x-auto min-w-full rounded-none shadow-none border border-slate-200 recon-page print-reset flex flex-col h-full">
      <div className="mb-4 flex justify-between items-end border-b-[3px] border-slate-900 pb-2">
        <div>
          <h2 className="text-lg font-black uppercase tracking-widest text-slate-900">DAILY RECONCILIATION & TAX LEDGER</h2>
          <div className="flex gap-6 mt-1">
             <div className="flex items-center gap-2">
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Date</span>
               <span className="text-xs font-black text-slate-900">{currentFormattedDate}</span>
             </div>
             <div className="flex items-center gap-2">
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Store</span>
               <span className="text-xs font-black uppercase tracking-widest text-[#c02428]">{history[0]?.location || 'cascavelle'}</span>
             </div>
          </div>
        </div>
        <div className="text-right">
           <span className="bg-slate-900 text-white px-3 py-1 text-[9px] font-black rounded uppercase tracking-widest">A4 LANDSCAPE</span>
        </div>
      </div>

      <div className="flex-1">
        <table className="w-full border-collapse border-2 border-slate-900 table-fixed">
          <thead>
            <tr className="bg-slate-100">
              <th className={`${headerClasses} w-[5%]`} rowSpan={2}>Inv No</th>
              <th className={`${headerClasses} w-[14%]`} rowSpan={2}>Customer / Description</th>
              <th className={`${headerClasses} w-[4%]`} rowSpan={2}>Qty</th>
              <th className={`${headerClasses} w-[8%] bg-slate-200`} colSpan={3}>Tax Analysis (MUR)</th>
              <th className={`${headerClasses} w-[30%] bg-blue-50`} colSpan={4}>Settlement Breakdown</th>
              <th className={`${headerClasses} w-[8%]`} rowSpan={2}>Gift/Online</th>
              <th className={`${headerClasses} w-[8%]`} rowSpan={2}>Remarks</th>
            </tr>
            <tr className="bg-slate-50">
              <th className={`${headerClasses} w-[8%] text-[8px]`}>Net (Excl)</th>
              <th className={`${headerClasses} w-[8%] text-[8px]`}>VAT (15%)</th>
              <th className={`${headerClasses} w-[8%] text-[8px]`}>Total (Incl)</th>
              <th className={`${headerClasses} w-[8%] text-[8px]`}>Cash</th>
              <th className={`${headerClasses} w-[8%] text-[8px]`}>Card</th>
              <th className={`${headerClasses} w-[8%] text-[8px]`}>Bank/Apps</th>
              <th className={`${headerClasses} w-[8%] text-[8px]`}>Credit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                <td className={`${cellClasses} text-center font-black tabular-nums`}>{row.invNo}</td>
                <td className={`${cellClasses} truncate uppercase text-[8px]`}>{row.description}</td>
                <td className={`${cellClasses} text-center font-black tabular-nums`}>{row.qty}</td>
                <td className={`${cellClasses} text-right tabular-nums pr-1 text-slate-500`}>{formatCurrency(row.net)}</td>
                <td className={`${cellClasses} text-right tabular-nums pr-1 text-[#c02428]`}>{formatCurrency(row.vat)}</td>
                <td className={`${cellClasses} text-right tabular-nums pr-1 font-black`}>{formatCurrency(row.total)}</td>
                <td className={`${cellClasses} text-right tabular-nums pr-1 bg-slate-50/50`}>{formatCurrency(row.cash)}</td>
                <td className={`${cellClasses} text-right tabular-nums pr-1 bg-slate-50/50`}>{formatCurrency(row.card)}</td>
                <td className={`${cellClasses} text-right tabular-nums pr-1 bg-slate-50/50`}>{formatCurrency(row.bank)}</td>
                <td className={`${cellClasses} text-right tabular-nums pr-1`}>{formatCurrency(row.credit)}</td>
                <td className={`${cellClasses} text-right tabular-nums pr-1`}>{formatCurrency(row.gift + row.online)}</td>
                <td className={cellClasses}></td>
              </tr>
            ))}
            {rows.length < 18 && Array.from({ length: 18 - rows.length }).map((_, i) => (
              <tr key={`pad-${i}`} className="h-8">
                <td className={cellClasses}></td><td className={cellClasses}></td><td className={cellClasses}></td>
                <td className={cellClasses}></td><td className={cellClasses}></td><td className={cellClasses}></td>
                <td className={cellClasses}></td><td className={cellClasses}></td><td className={cellClasses}></td>
                <td className={cellClasses}></td><td className={cellClasses}></td><td className={cellClasses}></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-900 border-t-2 border-slate-900 text-white">
              <td className="p-1 text-[10px] font-black uppercase tracking-widest text-center" colSpan={2}>TOTAL ACCUMULATED</td>
              <td className="p-1 text-[10px] font-black text-center tabular-nums border-x border-white/10">{totals.qty}</td>
              <td className="p-1 text-[10px] font-black text-right tabular-nums border-x border-white/10 pr-1">{formatCurrency(totals.net)}</td>
              <td className="p-1 text-[10px] font-black text-right tabular-nums border-x border-white/10 pr-1">{formatCurrency(totals.vat)}</td>
              <td className="p-1 text-[10px] font-black text-right tabular-nums border-x border-white/10 pr-1 text-blue-400">{formatCurrency(totals.total)}</td>
              <td className="p-1 text-[10px] font-black text-right tabular-nums border-x border-white/10 pr-1">{formatCurrency(totals.cash)}</td>
              <td className="p-1 text-[10px] font-black text-right tabular-nums border-x border-white/10 pr-1">{formatCurrency(totals.card)}</td>
              <td className="p-1 text-[10px] font-black text-right tabular-nums border-x border-white/10 pr-1">{formatCurrency(totals.bank)}</td>
              <td className="p-1 text-[10px] font-black text-right tabular-nums border-x border-white/10 pr-1">{formatCurrency(totals.credit)}</td>
              <td className="p-1 text-[10px] font-black text-right tabular-nums border-x border-white/10 pr-1" colSpan={2}>{formatCurrency(totals.gift + totals.online)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-4 pt-4 grid grid-cols-4 gap-8">
         <div className="border-t border-slate-400 pt-1">
            <span className="text-[8px] font-black text-slate-400 uppercase block text-center">Cashier Signature</span>
         </div>
         <div className="border-t border-slate-400 pt-1">
            <span className="text-[8px] font-black text-slate-400 uppercase block text-center">Accountant Verification</span>
         </div>
         <div className="border-t border-slate-400 pt-1 col-span-2">
            <span className="text-[8px] font-black text-slate-400 uppercase block text-center">Batch Validation Timestamp: {new Date().toLocaleTimeString()}</span>
         </div>
      </div>
    </div>
  );
};

export default ReconciliationSheet;
