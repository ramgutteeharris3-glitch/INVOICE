
import React from 'react';
import { Receipt } from '../types';
import { formatAmountInWords } from '../utils/numberToWords';

interface Props {
  receipt: Receipt;
}

const ABDesaiLogo: React.FC = () => (
  <div className="border-[1.5px] border-[#c02428] p-[3px] bg-white flex flex-col items-center w-20 shrink-0">
    <div className="bg-[#c02428] w-full flex items-center justify-center py-0.5">
      <span className="text-white text-xl font-black leading-none tracking-tighter select-none">ab</span>
    </div>
    <div className="flex items-center justify-center py-0.5 bg-white w-full">
      <span className="text-[#c02428] text-lg font-black leading-none italic mr-[1px]">D</span>
      <span className="text-slate-900 text-lg font-black leading-none tracking-tighter">esai</span>
    </div>
    <div className="w-full border-t border-slate-100 mt-0.5 pt-0.5 flex items-center justify-center gap-1">
      <span className="text-[4px] font-black text-slate-900 uppercase tracking-tighter whitespace-nowrap leading-none">Great Brands</span>
      <span className="text-[#c02428] text-[5px] leading-none">•</span>
      <span className="text-[4px] font-black text-slate-900 uppercase tracking-tighter whitespace-nowrap leading-none">Great Value</span>
    </div>
  </div>
);

const ReceiptPreview: React.FC<Props> = ({ receipt }) => {
  const totalAmountInclVat = receipt.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const taxFactor = 1 + (receipt.taxRate / 100);
  const totalAmountExclVat = totalAmountInclVat / taxFactor;
  const vatAmountTotal = totalAmountInclVat - totalAmountExclVat;
  
  const amountInWords = formatAmountInWords(totalAmountInclVat);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-MU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const formattedDate = receipt.date ? receipt.date.split('-').reverse().join('/') : '';

  return (
    <div className="bg-white border-[6px] border-slate-900 p-4 text-slate-900 font-sans relative flex flex-col w-[794px] h-[560px] select-none overflow-hidden box-border">
      
      {/* 1. TOP BRANDING */}
      <div className="flex justify-between items-stretch mb-2 gap-4 h-16">
        <div className="flex gap-3 items-center flex-[1.6]">
          <ABDesaiLogo />
          <div className="flex flex-col justify-center">
            <h2 className="text-sm font-black uppercase tracking-tighter text-slate-900 leading-tight">
              {receipt.sender.shopName || receipt.sender.name}
            </h2>
            <div className="flex gap-2 border-t border-slate-100 mt-0.5 pt-0.5">
              <div className="flex items-center gap-1 text-[6px] font-bold text-slate-500 uppercase">
                 <span>VAT:</span>
                 <span className="text-slate-900 font-black tracking-widest">{receipt.sender.taxId}</span>
              </div>
              <div className="flex items-center gap-1 text-[6px] font-bold text-slate-500 uppercase">
                 <span>BRN:</span>
                 <span className="text-slate-900 font-black tracking-widest">{receipt.sender.brn}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center border-x border-slate-100 px-1">
           <h1 className="text-lg font-black uppercase tracking-tighter text-slate-900 leading-none text-center">VAT Receipt</h1>
           <p className="text-[6px] font-black uppercase tracking-[0.2em] text-[#c02428] font-serif italic text-center mt-1">Official Document</p>
        </div>

        <div className="text-right flex-1 flex flex-col items-end justify-between py-0.5">
           <div className="bg-slate-900 text-white px-3 py-1.5 rounded-sm shadow-md w-full max-w-[140px]">
              <div className="text-left">
                <span className="text-[6px] font-black uppercase tracking-widest opacity-50 leading-none">Voucher No.</span>
              </div>
              <p className="text-lg font-black leading-none tracking-tight text-right tabular-nums">
                {receipt.receiptNumber}
              </p>
           </div>
           <div className="text-[6px] font-bold text-slate-500 leading-none text-right w-full mt-1">
              <p className="truncate font-black text-slate-900 uppercase tracking-tighter mb-0.5">{receipt.sender.address}</p>
              <p className="font-bold">{receipt.sender.phone}</p>
           </div>
        </div>
      </div>

      {/* 2. TRANSACTION INFORMATION */}
      <div className="grid grid-cols-12 mb-2 border-[1.5px] border-slate-900 bg-white">
        <div className="col-span-8 p-2 space-y-1 border-r-[1.5px] border-slate-900">
           <div className="flex items-baseline gap-2">
              <span className="font-black uppercase text-[6px] text-slate-400 tracking-[0.1em] shrink-0">Billed To:</span>
              <div className="font-serif text-base font-black italic text-slate-900 leading-none truncate flex-1 uppercase">
                 {receipt.receivedFrom || "WALKING CUSTOMER"}
              </div>
           </div>
           <div className="flex items-start gap-2">
              <span className="font-black uppercase text-[5px] text-slate-400 tracking-[0.1em] shrink-0 mt-0.5">Address:</span>
              <div className="font-black text-slate-500 text-[8px] leading-tight flex-1 uppercase truncate">
                 {receipt.clientAddress || "No address specified"}
              </div>
           </div>
        </div>

        <div className="col-span-4 bg-slate-50 flex flex-col h-full divide-y divide-slate-200">
           <div className="flex flex-1 divide-x divide-slate-200">
             <div className="flex-1 p-1 flex flex-col justify-center">
                <span className="text-[5px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Date:</span>
                <span className="text-[9px] font-black text-slate-900 tracking-tighter tabular-nums leading-none">{formattedDate}</span>
             </div>
             <div className="flex-1 p-1 flex flex-col justify-center bg-blue-50/50">
                <span className="text-[5px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Method:</span>
                <span className="text-[8px] font-black text-slate-900 truncate uppercase leading-none">{receipt.paymentMethod}</span>
             </div>
           </div>
           <div className="p-1 bg-slate-100/50 flex flex-col justify-center">
              <span className="text-[5px] font-black text-slate-400 uppercase tracking-widest leading-none block mb-0.5">Sales Rep:</span>
              <span className="text-[9px] font-black text-slate-900 uppercase truncate block leading-none">
                {receipt.salesRep || "SYSTEM"}
              </span>
           </div>
        </div>
      </div>

      {/* 3. ITEM DATA TABLE */}
      <div className="flex-1 border-[1.5px] border-slate-900 overflow-hidden mb-2 bg-white">
        <table className="w-full border-collapse h-full">
          <thead className="bg-slate-900 text-white border-b-[1.5px] border-slate-900 text-center">
            <tr className="divide-x divide-white/20 uppercase text-[7px] font-black tracking-[0.1em]">
              <th className="p-1.5 w-6">SN</th>
              <th className="p-1.5 w-14">Ref</th>
              <th className="p-1.5 text-left">Description</th>
              <th className="p-1.5 w-10">Qty</th>
              <th className="p-1.5 w-24">Rate (Ex)</th>
              <th className="p-1.5 w-24 bg-[#c02428]/80">VAT</th>
              <th className="p-1.5 w-32 bg-[#c02428]">Total (Rs)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900">
            {receipt.items.map((item, index) => {
              const itemTotal = item.quantity * item.rate;
              const itemEx = itemTotal / taxFactor;
              const itemVat = itemTotal - itemEx;
              
              return (
                <tr key={item.id} className="divide-x divide-slate-900 text-slate-900 hover:bg-slate-50 transition-colors">
                  <td className="p-1.5 text-center font-black text-slate-400 text-[10px] tabular-nums align-middle">{index + 1}</td>
                  <td className="p-1.5 text-center font-black text-[10px] uppercase tracking-tighter text-slate-900 align-middle">{item.code || "---"}</td>
                  <td className="px-2 py-1.5 font-bold font-serif italic text-[11px] align-middle uppercase truncate">{item.description}</td>
                  <td className="p-1.5 text-center font-black text-[12px] tabular-nums align-middle text-black">{item.quantity}</td>
                  <td className="p-1.5 text-right font-black text-[11px] tracking-tight tabular-nums align-middle text-black">{formatCurrency(itemEx / item.quantity)}</td>
                  <td className="p-1.5 text-right font-black text-[11px] tracking-tight tabular-nums align-middle text-black">{formatCurrency(itemVat)}</td>
                  <td className="p-1.5 text-right font-black text-[14px] bg-slate-50 tabular-nums align-middle border-l-[1.5px] border-slate-900 text-black">{formatCurrency(itemTotal)}</td>
                </tr>
              );
            })}
            {/* Pad with empty rows if needed to maintain layout structure */}
            {receipt.items.length < 5 && Array.from({ length: 5 - receipt.items.length }).map((_, i) => (
               <tr key={`pad-${i}`} className="h-8 divide-x divide-slate-900 opacity-5 border-t border-slate-100">
                 <td colSpan={7}></td>
               </tr>
            ))}
          </tbody>
          <tfoot className="bg-white border-t-[1.5px] border-slate-900">
             <tr className="divide-x divide-slate-900 border-b border-slate-100">
               <td className="px-3 py-1 text-right text-[7px] font-black uppercase text-slate-400" colSpan={6}>Sub-Total (Excl. VAT)</td>
               <td className="px-3 py-1 text-right text-[12px] font-black tabular-nums border-l-[1.5px] border-slate-900 text-black">{formatCurrency(totalAmountExclVat)}</td>
             </tr>
             <tr className="divide-x divide-slate-900 border-b border-slate-100">
               <td className="px-3 py-1 text-right text-[7px] font-black uppercase text-slate-400" colSpan={6}>VAT Amount ({receipt.taxRate}%)</td>
               <td className="px-3 py-1 text-right text-[12px] font-black tabular-nums border-l-[1.5px] border-slate-900 text-black">{formatCurrency(vatAmountTotal)}</td>
             </tr>
             <tr className="divide-x divide-slate-900 bg-slate-900">
               <td className="px-3 py-2 text-right text-[10px] font-black uppercase tracking-widest text-white" colSpan={6}>Grand Total Amount (Incl. VAT)</td>
               <td className="px-3 py-2 text-right text-[18px] bg-white tabular-nums border-l-[1.5px] border-slate-900 font-black text-[#c02428] shadow-[inset_0_0_10px_rgba(0,0,0,0.1)]">{formatCurrency(totalAmountInclVat)}</td>
             </tr>
          </tfoot>
        </table>
      </div>

      {/* 4. SETTLEMENT & FOOTER */}
      <div className="mb-2 border-[1.5px] border-slate-900 bg-slate-50 p-1">
         <div className="flex items-center gap-2">
            <span className="text-[6px] font-black uppercase text-slate-400 tracking-[0.1em] shrink-0">Settlement:</span>
            <div className="text-[9px] font-black italic text-slate-900 uppercase truncate">{receipt.settlementOf || "Full settlement of above."}</div>
         </div>
      </div>

      <div className="grid grid-cols-12 gap-4 items-end mt-auto">
         <div className="col-span-8 flex flex-col gap-2">
            <div className="border-[1.5px] border-slate-900 p-2 bg-white">
               <span className="text-[6px] font-black uppercase text-slate-400 block mb-1 tracking-[0.1em]">Total In Words:</span>
               <div className="text-[9px] font-serif italic font-black text-slate-900 uppercase leading-none">{amountInWords}</div>
            </div>
         </div>
         <div className="col-span-4 flex flex-col items-center gap-1">
            <div className="relative w-full h-8 flex items-center justify-center">
                <div className="absolute border border-[#c02428]/20 rounded-full w-12 h-12 flex flex-col items-center justify-center -rotate-12 opacity-10">
                    <span className="text-[4px] font-black text-[#c02428] uppercase font-serif italic">DESAI</span>
                </div>
            </div>
            <div className="w-full border-t-[2px] border-slate-900 pt-1 text-center">
               <span className="text-[7px] font-black uppercase tracking-[0.1em] text-slate-700 leading-none">Authorized Signatory</span>
            </div>
         </div>
      </div>
    </div>
  );
};

export default ReceiptPreview;
