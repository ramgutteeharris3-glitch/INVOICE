
import React, { useState, useMemo } from 'react';
import { Receipt } from '../types';
import { Calendar, Filter, Search, Download, BarChart2, TrendingUp, PieChart, Layers, CreditCard, Phone, Mail, RefreshCw, UserCheck } from 'lucide-react';

interface Props {
  history: Receipt[];
  onDownload: () => void;
  isDownloading?: boolean;
}

const SalesAnalysis: React.FC<Props> = ({ history, onDownload, isDownloading }) => {
  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30); // Show last 30 days by default
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');

  const formatDate = (isoDate: string) => {
    if (!isoDate) return '';
    return isoDate.split('-').reverse().join('/');
  };

  const filteredHistory = useMemo(() => {
    return history.filter(rec => {
      const recDate = rec.date;
      const withinDate = recDate >= fromDate && recDate <= toDate;
      const matchesSearch = 
        rec.receivedFrom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(rec.receiptNumber).includes(searchQuery) ||
        rec.salesRep?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.items.some(i => i.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return withinDate && matchesSearch;
    });
  }, [history, fromDate, toDate, searchQuery]);

  const reportData = useMemo(() => {
    const allItems: any[] = [];
    filteredHistory.forEach(rec => {
      rec.items.forEach(item => {
        const taxFactor = 1 + (rec.taxRate / 100);
        const unitRateIncl = item.rate;
        const unitRateExcl = item.rate / taxFactor;
        
        const lineTotalIncl = item.quantity * unitRateIncl;
        const lineTotalExcl = item.quantity * unitRateExcl;
        const lineVat = lineTotalIncl - lineTotalExcl;

        allItems.push({
          date: rec.date,
          invNo: rec.receiptNumber,
          customer: rec.receivedFrom,
          customerPhone: rec.clientPhone,
          customerEmail: rec.clientEmail,
          salesRep: rec.salesRep,
          code: item.code,
          description: item.description,
          qty: item.quantity,
          unitEx: unitRateExcl,
          unitIn: unitRateIncl,
          vat: lineVat,
          total: lineTotalIncl,
          method: rec.paymentMethod
        });
      });
    });
    // Sorting by Receipt Number descending
    return allItems.sort((a, b) => String(b.invNo).localeCompare(String(a.invNo)));
  }, [filteredHistory]);

  const totals = useMemo(() => {
    return reportData.reduce((acc, row) => ({
      qty: acc.qty + row.qty,
      total: acc.total + row.total,
      vat: acc.vat + row.vat
    }), { qty: 0, total: 0, vat: 0 });
  }, [reportData]);

  const formatCurrency = (val: number) => {
    return val.toLocaleString('en-MU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const SummaryCard = ({ title, value, icon: Icon, colorClass }: any) => (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center justify-between">
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <p className={`text-2xl font-black ${colorClass}`}>Rs {formatCurrency(value)}</p>
      </div>
      <div className={`p-4 rounded-2xl ${colorClass.replace('text-', 'bg-')}/10 ${colorClass}`}>
        <Icon size={24} />
      </div>
    </div>
  );

  return (
    <div className="bg-white p-6 min-h-full rounded-sm shadow-none print-reset flex flex-col h-full w-[793px] mx-auto overflow-hidden border border-slate-200">
      {/* 1. FILTERS & HEADER - Hidden in Print */}
      <div className="no-print mb-8 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Consolidated Sales Journal</h2>
          <button 
            onClick={onDownload} 
            disabled={isDownloading}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            {isDownloading ? <RefreshCw className="animate-spin" size={14} /> : <Download size={14} />} 
            {isDownloading ? 'Processing...' : 'Export Audit Report (PDF)'}
          </button>
        </div>

        <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Start Date</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">End Date</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Universal Filter</label>
            <input placeholder="Search client, product or receipt..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm" />
          </div>
        </div>
      </div>

      {/* 2. SUMMARY DASHBOARD - Hidden in Print */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 no-print">
        <SummaryCard title="Net Collections (Excl. VAT)" value={totals.total - totals.vat} icon={TrendingUp} colorClass="text-slate-900" />
        <SummaryCard title="Total Sales (Incl. VAT)" value={totals.total} icon={BarChart2} colorClass="text-blue-600" />
      </div>

      {/* 3. DETAILED LOG */}
      <div className="flex-1 bg-white rounded-[24px] border border-slate-200 flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
           <div className="flex items-center gap-2">
             <Layers size={18} className="text-blue-600" />
             <h3 className="font-black uppercase tracking-widest text-slate-900 text-[10px]">Sales Ledger Audit Log</h3>
           </div>
           <span className="text-[10px] font-black text-slate-400 bg-white px-3 py-1 rounded-full uppercase border border-slate-100">{reportData.length} records</span>
        </div>
        
        <div className="flex-1 overflow-auto no-scrollbar">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-900 text-[10px] font-black uppercase text-white tracking-widest text-center">
                <th className="p-4 w-24 text-left">Date</th>
                <th className="p-4 w-28 text-left">Receipt No.</th>
                <th className="p-4 w-28 text-left">Customer</th>
                <th className="p-4 text-left min-w-[150px]">Full Description</th>
                <th className="p-4 w-12">Qty</th>
                <th className="p-4 w-24 text-right">Price (Excl)</th>
                <th className="p-4 w-24 text-right">Price (Incl)</th>
                <th className="p-4 w-28 text-right bg-[#c02428]">Total (Rs)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportData.map((row, i) => (
                <tr key={i} className="hover:bg-blue-50/30 transition-colors text-xs font-black text-slate-700">
                  <td className="p-4 font-black text-black tabular-nums">{formatDate(row.date)}</td>
                  <td className="p-4 font-black text-black tabular-nums">{row.invNo}</td>
                  <td className="p-4">
                    <p className="text-black uppercase font-black text-[10px] truncate max-w-[100px]">{row.customer || "CASH"}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-[11px] text-slate-800 uppercase font-black leading-tight break-words">{row.description}</p>
                  </td>
                  <td className="p-4 text-center font-black text-black tabular-nums">{row.qty}</td>
                  <td className="p-4 text-right tabular-nums font-black text-slate-500">{formatCurrency(row.unitEx)}</td>
                  <td className="p-4 text-right tabular-nums font-black text-slate-900">{formatCurrency(row.unitIn)}</td>
                  <td className="p-4 text-right tabular-nums font-black text-black bg-slate-50/50">{formatCurrency(row.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="sticky bottom-0 z-20 bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest">
              <tr>
                <td colSpan={4} className="p-4 text-right">Journal Summary Totals:</td>
                <td className="p-4 text-center">{totals.qty}</td>
                <td className="p-4 text-right text-white" colSpan={2}>Gross Liability Included</td>
                <td className="p-4 text-right bg-blue-600 text-white">{formatCurrency(totals.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesAnalysis;
