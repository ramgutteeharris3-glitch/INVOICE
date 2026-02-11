
import React, { useState, useRef, useEffect } from 'react';
import { Receipt, PAYMENT_METHODS, ReceiptItem, Product } from '../types';
import { professionalizeDescription } from './services/geminiService';
import { User, Plus, Trash2, ShoppingBag, Hash, Calculator, ShieldCheck, Sparkles, Edit3, Check, Upload, Database, Search, ArrowRight, Store, CheckCircle2, Phone, Mail, History, RefreshCw, Save, UserCheck, Eye, Layout, FileText, MapPin } from 'lucide-react';
import Papa from 'papaparse';

interface Props {
  receipt: Receipt;
  onUpdate: (updates: Partial<Receipt>) => void;
  productList: Product[];
  setProductList: (list: Product[]) => void;
  onValidate: () => void;
  receiptHistory: Receipt[];
  onRecall: (recalledReceipt: Receipt, targetTab?: 'form' | 'preview') => void;
  isEditing: boolean;
}

const ReceiptForm: React.FC<Props> = ({ receipt, onUpdate, productList, setProductList, onValidate, receiptHistory, onRecall, isEditing }) => {
  const [isPolishing, setIsPolishing] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(receipt.items[0]?.id || null);
  const [searchTerm, setSearchTerm] = useState('');
  const [recallSearch, setRecallSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const totalAmountInclVat = receipt.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const taxFactor = 1 + (receipt.taxRate / 100);
  const totalExclVat = totalAmountInclVat / taxFactor;
  const vatValue = totalAmountInclVat - totalExclVat;

  // Condensed styles
  const inputClasses = "w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-900/5 focus:border-blue-900 outline-none transition-all text-black font-bold placeholder:text-slate-300 text-sm shadow-sm";
  const labelClasses = "block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5";
  const sectionClasses = "bg-white rounded-2xl p-5 shadow-sm border border-slate-200";

  const formatDate = (isoDate: string) => {
    if (!isoDate) return '';
    return isoDate.split('-').reverse().join('/');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      complete: (results) => {
        const data = results.data as any[];
        const parsedProducts: Product[] = data
          .map(row => {
            const values = Object.values(row);
            const code = String(values[0] || '').trim();
            const name = String(values[1] || '').trim();
            const priceStr = String(values[2] || '0').replace(/[^0-9.]/g, '');
            const price = parseFloat(priceStr);
            return { code, name, price };
          })
          .filter(p => p.name && !isNaN(p.price));

        if (parsedProducts.length > 0) {
          setProductList(parsedProducts);
          alert(`Successfully imported ${parsedProducts.length} products!`);
        } else {
          alert('CSV Import Error: Could not find valid products. Ensure format is: Code, Name, Price');
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
      header: false,
      skipEmptyLines: true
    });
  };

  const addItem = () => {
    const newItem: ReceiptItem = {
      id: Math.random().toString(36).substr(2, 9),
      code: '',
      description: '',
      quantity: 1,
      rate: 0
    };
    onUpdate({ items: [...receipt.items, newItem] });
    setEditingItemId(newItem.id);
    setSearchTerm('');
  };

  const updateItem = (id: string, updates: Partial<ReceiptItem>) => {
    const newItems = receipt.items.map(item => {
      if (item.id === id) {
        return { ...item, ...updates };
      }
      return item;
    });
    onUpdate({ items: newItems });
  };

  const selectProduct = (id: string, product: Product) => {
    updateItem(id, { 
      description: product.name, 
      code: product.code, 
      rate: product.price 
    });
    setShowDropdown(null);
    setSearchTerm('');
  };

  const removeItem = (id: string) => {
    if (receipt.items.length <= 1) {
      updateItem(id, { code: '', description: '', quantity: 1, rate: 0 });
      return;
    }
    onUpdate({ items: receipt.items.filter(item => item.id !== id) });
    if (editingItemId === id) setEditingItemId(null);
  };

  const handleSmartPolish = async (id: string) => {
    const item = receipt.items.find(i => i.id === id);
    if (!item || !item.description) return;
    setIsPolishing(id);
    const polished = await professionalizeDescription(item.description);
    updateItem(id, { description: polished });
    setIsPolishing(null);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-MU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const filteredProducts = productList.filter(p => {
    const nameStr = (p.name || '').toLowerCase();
    const codeStr = (p.code || '').toLowerCase();
    const query = (searchTerm || '').toLowerCase();
    return nameStr.includes(query) || codeStr.includes(query);
  }).slice(0, 10);

  const foundHistory = recallSearch.length > 2 
    ? receiptHistory.find(r => String(r.receiptNumber).includes(recallSearch))
    : null;

  const handleRecallClick = (targetTab: 'form' | 'preview') => {
    if (foundHistory) {
      const msg = `Recall Invoice #${foundHistory.receiptNumber}?`;
      if (confirm(msg)) {
        onRecall(foundHistory, targetTab);
        setRecallSearch('');
      }
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex-1 overflow-y-auto pr-1 no-scrollbar pb-32">
        <div className="space-y-4">
          <section className="bg-slate-900 rounded-2xl p-5 shadow-lg border border-slate-800 text-white">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Database size={16} className="text-blue-400" />
                <h2 className="text-xs font-black uppercase tracking-widest">Inventory</h2>
              </div>
              <div className="flex items-center gap-2">
                <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileUpload} />
                <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border border-blue-900/30">Import CSV</button>
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50 flex justify-between items-center">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">SKU Pool</span>
                <span className="text-blue-400 font-black text-sm">{productList.length} Items</span>
            </div>
          </section>

          <section className="bg-indigo-900 rounded-2xl p-5 shadow-lg border border-indigo-800 text-white animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-2 mb-4">
              <History size={16} className="text-indigo-400" />
              <h2 className="text-[10px] font-black uppercase tracking-widest text-indigo-200">History Recall</h2>
            </div>
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" />
              <input 
                type="text" 
                placeholder="Search ID..." 
                value={recallSearch}
                onChange={(e) => setRecallSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-indigo-950/50 border border-indigo-700/50 rounded-xl focus:border-white outline-none transition-all text-white font-bold placeholder:text-indigo-400/50 text-sm"
              />
            </div>

            {foundHistory && (
              <div className="mt-4 p-4 bg-white/10 rounded-xl border border-white/10 animate-in zoom-in-95 duration-200">
                 <div className="flex justify-between items-start mb-2 border-b border-white/10 pb-2">
                    <div className="min-w-0 flex-1">
                       <p className="text-[10px] font-black uppercase text-indigo-300 truncate">{foundHistory.receivedFrom || 'WALKING'}</p>
                       <p className="text-[8px] font-bold opacity-60 tabular-nums">{formatDate(foundHistory.date)}</p>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                       <p className="text-xs font-black text-indigo-200 tabular-nums">Rs {foundHistory.items.reduce((s,i) => s + (i.quantity*i.rate), 0).toFixed(2)}</p>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                   <button onClick={() => handleRecallClick('preview')} className="py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all">View</button>
                   <button onClick={() => handleRecallClick('form')} className="py-2 bg-white text-indigo-900 hover:bg-blue-50 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all">Edit</button>
                 </div>
              </div>
            )}
          </section>

          <section className={sectionClasses}>
            <div className="flex items-center gap-2 mb-4">
              <Hash size={16} className="text-slate-900" />
              <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Document Meta</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-1">
                <label className={labelClasses}>Voucher ID</label>
                <input type="text" value={receipt.receiptNumber} onChange={(e) => onUpdate({ receiptNumber: e.target.value })} className={`${inputClasses} ${isEditing ? 'border-emerald-500' : ''}`} />
              </div>
              <div className="col-span-1">
                 <label className={labelClasses}>Linked Invoice</label>
                 <input type="text" placeholder="INV-XXX" value={receipt.relatedInvoiceNo || ''} onChange={(e) => onUpdate({ relatedInvoiceNo: e.target.value })} className={`${inputClasses} border-blue-200 bg-blue-50/20`} />
              </div>
              <div className="col-span-1">
                <label className={labelClasses}>Issue Date</label>
                <input type="date" value={receipt.date} onChange={(e) => onUpdate({ date: e.target.value })} className={inputClasses} />
              </div>
              <div className="col-span-1">
                <label className={labelClasses}>Sales Rep</label>
                <input type="text" placeholder="Name" value={receipt.salesRep} onChange={(e) => onUpdate({ salesRep: e.target.value })} className={inputClasses} />
              </div>
            </div>
          </section>

          <section className={sectionClasses}>
            <div className="flex items-center gap-2 mb-4">
              <User size={16} className="text-slate-900" />
              <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Client Details</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className={labelClasses}>Customer Name</label>
                <input type="text" placeholder="Full Name" value={receipt.receivedFrom} onChange={(e) => onUpdate({ receivedFrom: e.target.value })} className={inputClasses} />
              </div>
              <div>
                <label className={labelClasses}>Billing Address</label>
                <textarea 
                  rows={2} 
                  placeholder="Street, City, Country" 
                  value={receipt.clientAddress || ''} 
                  onChange={(e) => onUpdate({ clientAddress: e.target.value })} 
                  className={`${inputClasses} resize-none text-[11px] leading-tight uppercase`} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className={labelClasses}>Phone</label>
                   <input type="tel" placeholder="+230..." value={receipt.clientPhone || ''} onChange={(e) => onUpdate({ clientPhone: e.target.value })} className={inputClasses} />
                 </div>
                 <div>
                   <label className={labelClasses}>Email</label>
                   <input type="email" placeholder="client@mu" value={receipt.clientEmail || ''} onChange={(e) => onUpdate({ clientEmail: e.target.value })} className={inputClasses} />
                 </div>
              </div>
            </div>
          </section>

          <section className={sectionClasses}>
            <div className="flex items-center gap-2 mb-4">
              <Calculator size={16} className="text-slate-900" />
              <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Settlement</h2>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method}
                  onClick={() => onUpdate({ paymentMethod: method })}
                  className={`px-2 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border ${receipt.paymentMethod === method ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                >
                  {method}
                </button>
              ))}
            </div>
          </section>

          <section className={sectionClasses}>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <ShoppingBag size={16} className="text-slate-900" />
                <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Line Items</h2>
              </div>
              <button onClick={addItem} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-sm"><Plus size={12} /> Add</button>
            </div>
            
            <div className="space-y-3">
              {receipt.items.map((item, idx) => {
                const isEditingItem = editingItemId === item.id;
                
                if (!isEditingItem) {
                  return (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-blue-300 transition-all group">
                       <div className="min-w-0 flex-1">
                          <p className="text-xs font-black text-black truncate uppercase">{item.description || "New Item"}</p>
                          <p className="text-[9px] font-bold text-slate-400 tabular-nums">{item.quantity} x Rs {formatCurrency(item.rate)}</p>
                       </div>
                       <div className="flex items-center gap-3 ml-2">
                          <span className="text-xs font-black text-blue-900 tabular-nums">Rs {formatCurrency(item.quantity * item.rate)}</span>
                          <button onClick={() => setEditingItemId(item.id)} className="p-2 bg-white text-blue-600 border border-slate-200 rounded-lg hover:bg-blue-600 hover:text-white transition-all"><Edit3 size={14} /></button>
                       </div>
                    </div>
                  );
                }

                return (
                  <div key={item.id} className="p-4 bg-blue-50/40 rounded-2xl border border-blue-400/50 space-y-4 shadow-sm animate-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center border-b border-blue-200/50 pb-2">
                      <span className="text-[8px] font-black uppercase text-blue-800 tracking-widest">Item #{idx + 1}</span>
                      <button onClick={() => setEditingItemId(null)} className="flex items-center gap-1.5 px-3 py-1 bg-blue-900 text-white rounded-lg text-[9px] font-black uppercase"><Check size={12} /> Lock</button>
                    </div>

                    <div className="space-y-3">
                      <div className="relative" ref={dropdownRef}>
                        <label className={labelClasses}>SKU Search</label>
                        <div className="relative">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder="SKU or Name..."
                            value={searchTerm}
                            onFocus={() => setShowDropdown(item.id)}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`${inputClasses} pl-9`}
                          />
                        </div>
                        {showDropdown === item.id && (
                          <div className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 max-h-48 overflow-y-auto no-scrollbar">
                            {filteredProducts.map((p) => (
                                <button key={p.code + p.name} onClick={() => selectProduct(item.id, p)} className="w-full text-left p-3 hover:bg-blue-50 border-b border-slate-50 last:border-0 flex justify-between items-center group">
                                  <div className="flex-1 min-w-0 pr-2">
                                    <span className="bg-slate-900 text-white px-1.5 py-0.5 rounded text-[8px] font-black mr-2">{p.code}</span>
                                    <span className="text-[10px] font-black text-slate-700 uppercase truncate block whitespace-normal mt-1 leading-tight">{p.name}</span>
                                  </div>
                                  <ArrowRight size={14} className="text-slate-300 group-hover:text-blue-600" />
                                </button>
                              ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelClasses}>Ref Code</label>
                          <input value={item.code} onChange={(e) => updateItem(item.id, { code: e.target.value })} className={inputClasses} />
                        </div>
                        <div>
                          <label className={labelClasses}>Quantity</label>
                          <input type="number" value={item.quantity} onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) })} className={inputClasses} />
                        </div>
                      </div>

                      <div className="relative">
                        <label className={labelClasses}>Description</label>
                        <input value={item.description} onChange={(e) => updateItem(item.id, { description: e.target.value })} className={`${inputClasses} pr-10 uppercase`} />
                        <button onClick={() => handleSmartPolish(item.id)} disabled={isPolishing === item.id} className="absolute right-2 bottom-1.5 p-1.5 text-slate-300 hover:text-blue-600 transition-colors"><Sparkles size={16} /></button>
                      </div>

                      <div>
                        <label className={labelClasses}>Rate (MUR)</label>
                        <input type="number" value={item.rate || ''} onChange={(e) => updateItem(item.id, { rate: Number(e.target.value) })} className={inputClasses} />
                      </div>
                      
                      <button onClick={() => removeItem(item.id)} className="w-full py-2 bg-red-50 text-red-600 rounded-lg text-[9px] font-black uppercase hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2"><Trash2 size={12} /> Remove Line</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className={sectionClasses}>
            <div className="flex items-center gap-2 mb-4">
              <Store size={16} className="text-slate-900" />
              <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Accounting</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
               <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Net (Ex)</span>
                  <span className="text-sm font-black text-black tabular-nums">Rs {formatCurrency(totalExclVat)}</span>
               </div>
               <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">VAT (15%)</span>
                  <span className="text-sm font-black text-[#c02428] tabular-nums">Rs {formatCurrency(vatValue)}</span>
               </div>
            </div>
            <div>
              <label className={labelClasses}>Notes</label>
              <textarea rows={2} value={receipt.settlementOf} onChange={(e) => onUpdate({ settlementOf: e.target.value })} className={`${inputClasses} resize-none text-[10px]`} />
            </div>
          </section>

          <div className="py-6 text-center">
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center justify-center gap-2"><ShieldCheck size={14} /> Enterprise v5.5 Secure</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-sm border-t border-slate-200 z-40 rounded-t-2xl shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col gap-3">
           <div className="flex justify-between items-center px-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</span>
              <span className="text-2xl font-black text-blue-600 tabular-nums">Rs {totalAmountInclVat.toFixed(2)}</span>
           </div>
           <button
              onClick={onValidate}
              className={`w-full py-3.5 ${isEditing ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-blue-600 hover:bg-blue-500'} text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2`}
            >
              {isEditing ? <Save size={16} /> : <CheckCircle2 size={16} />} 
              {isEditing ? 'Save Revision' : 'Post & Preview'}
           </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptForm;
