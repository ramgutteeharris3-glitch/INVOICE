
import React, { useState, useMemo } from 'react';
import { Receipt, StockMovement } from '../types';
import { ClipboardList, Filter, Search, Download, RefreshCw, AlertCircle, CheckCircle2, Link2, FileWarning, Eye, Edit2, Check, X, Package, User, MapPin, Calendar, Hash } from 'lucide-react';

interface Props {
  history: Receipt[];
  movements: StockMovement[];
  onDownload: () => void;
  isDownloading?: boolean;
  onUpdateLinkedId: (type: 'RECEIPT' | 'TRANSFER_OUT' | 'TRANSFER_IN', primaryId: string, newLinkedId: string) => void;
}

const VoucherTracker: React.FC<Props> = ({ history, movements, onDownload, isDownloading, onUpdateLinkedId }) => {
  const [showOnlyMissing, setShowOnlyMissing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [viewDetailRecord, setViewDetailRecord] = useState<any | null>(null);

  const formatDate = (isoDate: string) => {
    if (!isoDate) return '';
    return isoDate.split('-').reverse().join('/');
  };

  const combinedData = useMemo(() => {
    const records: any[] = [];

    // Map Receipts
    history.forEach(r => {
      const isMissing = !r.relatedInvoiceNo;
      records.push({
        id: `rct-${r.receiptNumber}`,
        rawType: 'RECEIPT',
        date: r.date,
        type: 'RECEIPT',
        primaryId: String(r.receiptNumber),
        secondaryId: String(r.relatedInvoiceNo || ''),
        entity: r.receivedFrom || 'CASH SALE',
        isMissing,
        statusLabel: isMissing ? 'MISSING INVOICE' : 'LINKED',
        color: 'blue',
        // Attach full items for the detail view
        items: r.items.map(i => ({ code: i.code, name: i.description, qty: i.quantity, rate: i.rate })),
        paymentMethod: r.paymentMethod,
        total: r.items.reduce((s, i) => s + (i.quantity * i.rate), 0)
      });
    });

    // Group Movements by Reference and Type
    const groupedMovements = movements.reduce((acc: Record<string, any>, m) => {
      if (m.type === 'SALE') return acc;
      const key = `${m.type}-${m.reference}`;
      if (!acc[key]) {
        acc[key] = {
          rawType: m.type,
          date: m.date,
          type: m.type.replace('_', ' '),
          primaryId: String(m.reference),
          secondaryId: String(m.associatedWtn || ''),
          entity: m.location,
          color: m.type === 'TRANSFER_IN' ? 'emerald' : 'amber',
          items: []
        };
      }
      acc[key].items.push({ code: m.itemCode, name: m.itemName, qty: m.quantity });
      return acc;
    }, {} as Record<string, any>);

    Object.values(groupedMovements).forEach((m: any) => {
      const isMissing = !m.secondaryId;
      records.push({
        ...m,
        id: `mv-${m.rawType}-${m.primaryId}`,
        isMissing,
        statusLabel: isMissing ? (m.rawType === 'TRANSFER_IN' ? 'MISSING REF' : 'MISSING WTN') : 'LINKED'
      });
    });

    return records
      .filter(rec => {
        if (showOnlyMissing && !rec.isMissing) return false;
        const matchesSearch = 
           rec.primaryId.toLowerCase().includes(searchQuery.toLowerCase()) || 
           rec.secondaryId.toLowerCase().includes(searchQuery.toLowerCase()) || 
           rec.entity.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [history, movements, showOnlyMissing, searchQuery]);

  const stats = useMemo(() => {
    const missing = combinedData.filter(r => r.isMissing).length;
    return {
      total: combinedData.length,
      missing,
      linked: combinedData.length - missing
    };
  }, [combinedData]);

  const formatHeader = (rec: any) => {
     if (rec.rawType === 'RECEIPT') return { primary: 'Receipt #', secondary: 'Invoice #' };
     if (rec.rawType === 'TRANSFER_IN') return { primary: 'Order #', secondary: 'Supplier Ref' };
     return { primary: 'DN #', secondary: 'WTN #' };
  };

  const startEdit = (rec: any) => {
    setEditingId(rec.id);
    setEditValue(rec.secondaryId);
  };

  const saveEdit = (rec: any) => {
    onUpdateLinkedId(rec.rawType, rec.primaryId, editValue);
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  return (
    <div className="bg-white p-6 min-h-full flex flex-col h-full w-[793px] mx-auto border border-slate-200 relative">
      
      {/* Detail Modal Overlay */}
      {viewDetailRecord && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-8 animate-in fade-in duration-200 no-print">
          <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border-8 border-white">
            <div className="p-8 border-b border-slate-100 flex justify-between items-start">
              <div className="flex items-center gap-4">
                 <div className={`p-3 rounded-2xl ${viewDetailRecord.color === 'blue' ? 'bg-blue-600' : (viewDetailRecord.color === 'emerald' ? 'bg-emerald-600' : 'bg-amber-600')} text-white`}>
                    <ClipboardList size={24} />
                 </div>
                 <div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none mb-2">
                       {viewDetailRecord.type} Details
                    </h3>
                    <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                       <span className="flex items-center gap-1"><Hash size={12}/> {viewDetailRecord.primaryId}</span>
                       <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                       <span className="flex items-center gap-1"><Calendar size={12}/> {formatDate(viewDetailRecord.date)}</span>
                    </div>
                 </div>
              </div>
              <button onClick={() => setViewDetailRecord(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
               <div className="grid grid-cols-2 gap-8">
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 flex items-center gap-2"><User size={12}/> Entity / Client</span>
                     <p className="text-sm font-black text-slate-900 uppercase leading-tight">{viewDetailRecord.entity}</p>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 flex items-center gap-2"><Link2 size={12}/> Linked Ref</span>
                     <p className={`text-sm font-black uppercase ${viewDetailRecord.secondaryId ? 'text-blue-600' : 'text-slate-300 italic'}`}>
                        {viewDetailRecord.secondaryId || 'NOT LINKED'}
                     </p>
                  </div>
               </div>

               <div>
                 <div className="flex items-center justify-between mb-4 px-2">
                   <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Itemized Breakdown</span>
                   <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase">{viewDetailRecord.items.length} Lines</span>
                 </div>
                 <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left">
                       <thead className="bg-slate-50 border-b border-slate-200">
                          <tr className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                             <th className="p-4 w-12">SN</th>
                             <th className="p-4 w-28">SKU</th>
                             <th className="p-4">Description</th>
                             <th className="p-4 w-16 text-center">Qty</th>
                             {viewDetailRecord.rawType === 'RECEIPT' && <th className="p-4 w-32 text-right">Total (Rs)</th>}
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                          {viewDetailRecord.items.map((item: any, idx: number) => (
                             <tr key={idx} className="text-[11px] font-bold text-slate-700">
                                <td className="p-4 text-slate-300 tabular-nums">{idx + 1}</td>
                                <td className="p-4"><span className="bg-slate-900 text-white px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter">{item.code || '---'}</span></td>
                                <td className="p-4 uppercase truncate max-w-[200px]">{item.name}</td>
                                <td className="p-4 text-center font-black text-slate-900 tabular-nums">{item.qty}</td>
                                {viewDetailRecord.rawType === 'RECEIPT' && (
                                   <td className="p-4 text-right font-black text-blue-600 tabular-nums">
                                      {(item.qty * item.rate).toLocaleString('en-MU', { minimumFractionDigits: 2 })}
                                   </td>
                                )}
                             </tr>
                          ))}
                       </tbody>
                       {viewDetailRecord.rawType === 'RECEIPT' && (
                          <tfoot className="bg-blue-50/50">
                             <tr>
                                <td colSpan={4} className="p-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Grand Total</td>
                                <td className="p-4 text-right text-base font-black text-blue-900 tabular-nums">
                                   Rs {viewDetailRecord.total.toLocaleString('en-MU', { minimumFractionDigits: 2 })}
                                </td>
                             </tr>
                          </tfoot>
                       )}
                    </table>
                 </div>
               </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
               <button 
                  onClick={() => setViewDetailRecord(null)}
                  className="px-8 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-black transition-all active:scale-95"
               >
                 Close Detail
               </button>
            </div>
          </div>
        </div>
      )}

      <div className="no-print mb-8 space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-slate-900 text-white rounded-2xl shadow-lg">
                <Link2 size={24} />
             </div>
             <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Cross-Reference Sheet</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Audit Linked Transaction Numbers</p>
             </div>
          </div>
          <button 
            onClick={onDownload} 
            disabled={isDownloading}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-black transition-all"
          >
            {isDownloading ? <RefreshCw className="animate-spin" size={14} /> : <Download size={14} />} 
            PDF Report
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4 items-center">
           <div className="col-span-1 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Critical Issues</span>
              <span className="text-xl font-black text-red-600 flex items-center gap-2">
                 <FileWarning size={18} /> {stats.missing}
              </span>
           </div>
           <div className="col-span-3 flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="relative flex-1">
                 <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                 <input 
                    placeholder="Quick Search ID..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs"
                 />
              </div>
              <button 
                onClick={() => setShowOnlyMissing(!showOnlyMissing)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showOnlyMissing ? 'bg-red-600 text-white shadow-lg scale-[1.05]' : 'bg-white text-slate-500 border border-slate-200'}`}
              >
                <AlertCircle size={14} /> Only Missing
              </button>
           </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[24px] border-2 border-slate-900 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto no-scrollbar">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-900 text-[9px] font-black uppercase text-white tracking-widest text-center">
                <th className="p-4 w-24 text-left">Date</th>
                <th className="p-4 w-32 text-left">Category</th>
                <th className="p-4 w-32 text-left">Document ID</th>
                <th className="p-4 w-32 text-left">Linked ID</th>
                <th className="p-4 text-left">Entity / Location</th>
                <th className="p-4 w-32 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {combinedData.length > 0 ? (
                combinedData.map((rec) => {
                  const headers = formatHeader(rec);
                  const isEditingThis = editingId === rec.id;

                  return (
                    <tr key={rec.id} className={`hover:bg-slate-50 transition-colors ${rec.isMissing ? 'bg-red-50/20' : ''}`}>
                      <td className="p-4 text-[10px] font-black text-slate-900 tabular-nums">{formatDate(rec.date)}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-tighter ${rec.color === 'blue' ? 'bg-blue-100 text-blue-800' : (rec.color === 'emerald' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800')}`}>
                          {rec.type}
                        </span>
                      </td>
                      <td className="p-4">
                         <div className="flex flex-col">
                            <span className="text-[7px] text-slate-400 font-black uppercase tracking-widest mb-0.5">{headers.primary}</span>
                            <span className="text-xs font-black text-slate-900">{rec.primaryId}</span>
                         </div>
                      </td>
                      <td className="p-4">
                         <div className="flex flex-col">
                            <span className="text-[7px] text-slate-400 font-black uppercase tracking-widest mb-0.5">{headers.secondary}</span>
                            {isEditingThis ? (
                              <div className="flex items-center gap-1 mt-1">
                                <input 
                                  autoFocus
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="w-full px-2 py-1 bg-white border border-blue-500 rounded text-xs font-black outline-none ring-2 ring-blue-100"
                                  placeholder="Enter ID..."
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveEdit(rec);
                                    if (e.key === 'Escape') cancelEdit();
                                  }}
                                />
                                <button onClick={() => saveEdit(rec)} className="p-1 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors">
                                  <Check size={12} />
                                </button>
                                <button onClick={cancelEdit} className="p-1 bg-slate-200 text-slate-600 rounded hover:bg-slate-300 transition-colors">
                                  <X size={12} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center group/edit">
                                <span className={`text-xs font-black ${rec.secondaryId ? 'text-blue-600' : 'text-slate-300 italic'}`}>
                                  {rec.secondaryId || 'NOT LINKED'}
                                </span>
                                <button 
                                  onClick={() => startEdit(rec)} 
                                  className="ml-2 p-1 text-slate-300 hover:text-blue-600 opacity-0 group-hover/edit:opacity-100 transition-all no-print"
                                  title="Edit Linked ID"
                                >
                                  <Edit2 size={10} />
                                </button>
                              </div>
                            )}
                         </div>
                      </td>
                      <td className="p-4">
                        <p className="text-[10px] font-black text-slate-700 uppercase truncate max-w-[150px]">{rec.entity}</p>
                      </td>
                      <td className="p-4 text-center">
                         <div className="flex items-center justify-center gap-2">
                            <button 
                               onClick={() => setViewDetailRecord(rec)}
                               className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white rounded-lg transition-all shadow-sm flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest no-print"
                            >
                               <Eye size={12} /> View
                            </button>
                            <div className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-full text-[7px] font-black uppercase tracking-widest ${rec.isMissing ? 'bg-red-600 text-white shadow-sm' : 'bg-emerald-100 text-emerald-800'}`}>
                              {rec.isMissing ? <AlertCircle size={8} /> : <CheckCircle2 size={8} />}
                              {rec.statusLabel.split(' ')[0]}
                            </div>
                         </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-32 text-center">
                     <ClipboardList size={48} className="mx-auto text-slate-100 mb-4" />
                     <p className="text-xs font-black text-slate-300 uppercase tracking-widest">Linked transactions will appear here</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mt-4 text-center">
         <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Enterprise Audit Control • Document Lifecycle Management</p>
      </div>
    </div>
  );
};

export default VoucherTracker;
