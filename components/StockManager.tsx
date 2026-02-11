
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { StockMovement, Product, MovementType } from '../types';
import { Search, Boxes, Package, Plus, ClipboardList, FileText, ArrowRight, Upload, X, ShieldAlert, FileSpreadsheet, RefreshCw, Download } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface Props {
  movements: StockMovement[];
  productList: Product[];
  setProductList: (list: Product[]) => void;
  onAddMovement: (move: StockMovement | StockMovement[]) => void;
}

const StockManager: React.FC<Props> = ({ movements, productList, setProductList, onAddMovement }) => {
  const [selectedSKU, setSelectedSKU] = useState<string>('');
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const [formSearch, setFormSearch] = useState('');
  const [lookupSearch, setLookupSearch] = useState('');
  const [showFormDropdown, setShowFormDropdown] = useState(false);
  const [showLookupDropdown, setShowLookupDropdown] = useState(false);

  const formDropdownRef = useRef<HTMLDivElement>(null);
  const lookupDropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newMove, setNewMove] = useState<{
    type: MovementType;
    sku: string;
    qty: number;
    ref: string;
    wtn: string;
    loc: string;
  }>({
    type: 'TRANSFER_IN',
    sku: '',
    qty: 1,
    ref: '',
    wtn: '',
    loc: ''
  });

  const formatDate = (isoDate: string) => {
    if (!isoDate) return '';
    return isoDate.split('-').reverse().join('/');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formDropdownRef.current && !formDropdownRef.current.contains(event.target as Node)) {
        setShowFormDropdown(false);
      }
      if (lookupDropdownRef.current && !lookupDropdownRef.current.contains(event.target as Node)) {
        setShowLookupDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedProduct = useMemo(() => 
    productList.find(p => p.code === selectedSKU),
    [productList, selectedSKU]
  );

  const selectedFormProduct = useMemo(() =>
    productList.find(p => p.code === newMove.sku),
    [productList, newMove.sku]
  );

  const filteredHistory = useMemo(() => {
    if (!selectedSKU) return [];
    return movements
      .filter(m => m.itemCode === selectedSKU)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [movements, selectedSKU]);

  const stockBalance = useMemo(() => {
    return filteredHistory.reduce((acc, move) => {
      if (move.type === 'TRANSFER_IN') return acc + move.quantity;
      return acc - move.quantity;
    }, 0);
  }, [filteredHistory]);

  const filterProducts = (query: string) => {
    if (!query) return productList.slice(0, 10);
    const lowQuery = query.toLowerCase();
    return productList.filter(p => 
      p.code.toLowerCase().includes(lowQuery) || 
      p.name.toLowerCase().includes(lowQuery)
    ).slice(0, 15);
  };

  const formResults = useMemo(() => filterProducts(formSearch), [formSearch, productList]);
  const lookupResults = useMemo(() => filterProducts(lookupSearch), [lookupSearch, productList]);

  const handleManualPost = () => {
    if (!newMove.sku || !newMove.ref || newMove.qty <= 0) {
      alert("Please fill all required fields (SKU, Ref, Qty)");
      return;
    }
    
    const prod = productList.find(p => p.code === newMove.sku);
    
    onAddMovement({
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().split('T')[0],
      itemCode: newMove.sku,
      itemName: prod?.name || 'Unknown Product',
      type: newMove.type,
      reference: newMove.ref,
      associatedWtn: newMove.wtn,
      quantity: newMove.qty,
      location: newMove.loc || (newMove.type === 'TRANSFER_IN' ? 'FROM SUPPLIER' : 'TO BRANCH'),
      notes: `Manual Stock Entry: ${newMove.ref}`
    });

    setShowTransferForm(false);
    setNewMove({ type: 'TRANSFER_IN', sku: '', qty: 1, ref: '', wtn: '', loc: '' });
    setFormSearch('');
  };

  const handleExportMasterList = () => {
    if (productList.length === 0) {
      alert("The product catalog is empty. Nothing to export.");
      return;
    }

    setIsExporting(true);
    try {
      const movementMap = new Map<string, number>();
      movements.forEach(m => {
        const current = movementMap.get(m.itemCode) || 0;
        const change = (m.type === 'TRANSFER_IN') ? m.quantity : -m.quantity;
        movementMap.set(m.itemCode, current + change);
      });

      const exportData = productList
        .map(p => ({
          'SKU Code': p.code,
          'Description': p.name,
          'Stock Balance': movementMap.get(p.code) || 0
        }))
        .filter(row => row['Stock Balance'] !== 0);

      if (exportData.length === 0) {
        alert("No items found with a non-zero stock balance. Export cancelled.");
        setIsExporting(false);
        return;
      }

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wscols = [{ wch: 15 }, { wch: 60 }, { wch: 20 }];
      ws['!cols'] = wscols;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Inventory Master");
      XLSX.writeFile(wb, `Stock_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error(err);
      alert("Failed to generate Excel report.");
    } finally {
      setIsExporting(false);
    }
  };

  const processFile = async (file: File, mode: 'replace' | 'append') => {
    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      const data = e.target?.result;
      if (!data) {
        alert("Error: File data is empty.");
        setIsProcessing(false);
        return;
      }

      let jsonData: any[] = [];

      try {
        if (file.name.toLowerCase().endsWith('.csv')) {
          const text = new TextDecoder().decode(data as ArrayBuffer);
          const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
          jsonData = parsed.data;
        } else {
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          jsonData = XLSX.utils.sheet_to_json(firstSheet);
        }

        const newProducts: Product[] = [];
        const openingMovements: StockMovement[] = [];
        const today = new Date().toISOString().split('T')[0];

        jsonData.forEach((row: any) => {
          // Robust column detection
          const keys = Object.keys(row);
          const codeKey = keys.find(k => /code|sku|id|reference|item#|part/i.test(k)) || keys[0];
          const nameKey = keys.find(k => /name|description|desc|item|product/i.test(k)) || keys[1];
          const priceKey = keys.find(k => /price|rate|cost|value|amount/i.test(k)) || keys[2];
          const qtyKey = keys.find(k => /qty|quantity|stock|balance|onhand|units/i.test(k)) || keys[3];

          const code = String(row[codeKey] || '').trim();
          const name = String(row[nameKey] || '').trim();
          const price = parseFloat(String(row[priceKey] || '0').replace(/[^0-9.]/g, ''));
          const qty = parseFloat(String(row[qtyKey] || '0').replace(/[^0-9.]/g, ''));

          if (code && name) {
            newProducts.push({ 
              code, 
              name, 
              price: isNaN(price) ? 0 : price 
            });
            
            if (!isNaN(qty) && qty > 0) {
              openingMovements.push({
                id: Math.random().toString(36).substr(2, 9),
                date: today,
                itemCode: code,
                itemName: name,
                type: 'TRANSFER_IN',
                reference: 'OPENING STOCK',
                quantity: qty,
                location: 'INITIAL IMPORT',
                notes: `Bulk Import - ${file.name}`
              });
            }
          }
        });

        if (newProducts.length > 0) {
          if (mode === 'replace') {
            setProductList(newProducts);
          } else {
            const existingCodes = new Set(productList.map(p => p.code));
            const distinctNew = newProducts.filter(p => !existingCodes.has(p.code));
            setProductList([...productList, ...distinctNew]);
          }
          
          if (openingMovements.length > 0) {
            onAddMovement(openingMovements);
          }
          
          alert(`SUCCESS:\n- ${newProducts.length} items cataloged.\n- ${openingMovements.length} stock levels initialized.`);
          setShowImportModal(false);
        } else {
          alert("NO DATA DETECTED:\nEnsure the file has columns named roughly 'Code', 'Name', 'Price', 'Quantity'.");
        }
      } catch (err) {
        console.error("Import Error:", err);
        alert("CRITICAL ERROR:\nFailed to parse file. Please check if the file format is valid.");
      } finally {
        setIsProcessing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.onerror = () => {
      alert("Error reading file.");
      setIsProcessing(false);
    };

    reader.readAsArrayBuffer(file);
  };

  const labelClasses = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5";
  const inputClasses = "w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm text-black";

  return (
    <div className="bg-white p-8 min-h-full rounded-sm shadow-none print-reset flex flex-col h-full w-[793px] mx-auto overflow-hidden border border-slate-200">
      
      <div className="no-print mb-8 space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-slate-900 text-white rounded-2xl shadow-lg">
                <Boxes size={24} />
             </div>
             <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Stock Management Hub</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Enterprise Inventory Control • {productList.length} SKUs Online</p>
             </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleExportMasterList}
              disabled={isExporting}
              className="flex items-center gap-2 px-6 py-2.5 bg-white border-2 border-slate-900 text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
              {isExporting ? <RefreshCw className="animate-spin" size={14} /> : <Download size={14} />} 
              Export Stock
            </button>
            <button 
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg active:scale-95"
            >
              <Upload size={14} /> Master Import
            </button>
            <button 
              onClick={() => setShowTransferForm(!showTransferForm)}
              className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95"
            >
              <Plus size={14} /> Manual Movement
            </button>
          </div>
        </div>

        {showImportModal && (
          <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden border-8 border-white">
              <div className="p-10 text-center relative">
                <button onClick={() => setShowImportModal(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400">
                  <X size={24} />
                </button>
                
                <div className="inline-flex p-5 bg-blue-50 text-blue-600 rounded-3xl mb-6 shadow-inner">
                  <FileSpreadsheet size={48} />
                </div>
                
                <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-2">Inventory Sync Engine</h3>
                <p className="text-sm font-bold text-slate-500 mb-8 px-8">Upload CSV or Excel. Use columns like: <span className="text-slate-900 font-black">Code, Name, Price, Quantity</span>.</p>
                
                <div className="space-y-4">
                   <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept=".csv,.xlsx,.xls"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (confirm("Choose Import Mode:\n\n'OK' to REPLACE current catalog (Full Sync)\n'Cancel' to APPEND new items (Add missing)")) {
                            processFile(file, 'replace');
                          } else {
                            processFile(file, 'append');
                          }
                        }
                      }}
                   />
                   
                   <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessing}
                      className="w-full py-6 bg-slate-900 text-white rounded-[32px] text-xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl flex items-center justify-center gap-4 border-b-8 border-slate-950 disabled:opacity-50"
                   >
                     {isProcessing ? <RefreshCw className="animate-spin" size={24} /> : <Upload size={24} />}
                     {isProcessing ? 'Processing Data...' : 'Select Inventory File'}
                   </button>
                   
                   <div className="flex items-center gap-2 p-4 bg-amber-50 rounded-2xl border border-amber-200 text-left">
                      <ShieldAlert size={20} className="text-amber-500 shrink-0" />
                      <p className="text-[10px] font-black text-amber-800 uppercase leading-tight">Importing a 'Quantity' column will create opening stock movements automatically for the current date.</p>
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showTransferForm && (
          <div className="bg-slate-50 p-6 rounded-[32px] border-2 border-slate-900 animate-in slide-in-from-top-4 duration-300">
             <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                <div>
                  <label className={labelClasses}>Movement Type</label>
                  <select 
                    value={newMove.type} 
                    onChange={e => setNewMove({...newMove, type: e.target.value as MovementType})}
                    className={inputClasses}
                  >
                    <option value="TRANSFER_IN">TRANSFER IN</option>
                    <option value="TRANSFER_OUT">TRANSFER OUT (DN)</option>
                  </select>
                </div>

                <div className="relative" ref={formDropdownRef}>
                  <label className={labelClasses}>Select Product</label>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="SKU or Name..."
                      value={newMove.sku && !showFormDropdown ? `${newMove.sku} (Active)` : formSearch}
                      onFocus={() => {
                        setShowFormDropdown(true);
                      }}
                      onChange={e => {
                        setFormSearch(e.target.value);
                        setShowFormDropdown(true);
                        if (newMove.sku) setNewMove(prev => ({...prev, sku: ''}));
                      }}
                      className={`${inputClasses} pl-9 ${newMove.sku ? 'bg-blue-50 border-blue-200' : ''}`}
                    />
                  </div>
                  {showFormDropdown && (
                    <div className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.2)] border border-slate-200 max-h-72 overflow-y-auto overflow-x-hidden no-scrollbar">
                      {formResults.map(p => (
                        <button 
                          key={p.code} 
                          onClick={() => {
                            setNewMove({...newMove, sku: p.code});
                            setShowFormDropdown(false);
                            setFormSearch(p.name);
                          }}
                          className="w-full text-left px-4 py-4 hover:bg-blue-50 border-b border-slate-50 last:border-0 flex justify-between items-start group transition-colors"
                        >
                          <div className="flex-1 pr-4">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="bg-slate-900 text-white text-[9px] px-2 py-0.5 rounded font-black uppercase">{p.code}</span>
                            </div>
                            <span className="text-xs font-black text-slate-900 uppercase leading-tight block whitespace-normal">{p.name}</span>
                          </div>
                          <ArrowRight size={14} className="text-slate-200 group-hover:text-blue-500 mt-1 shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                   <label className={labelClasses}>Full Item Description</label>
                   <textarea 
                      readOnly 
                      rows={2}
                      value={selectedFormProduct?.name || '---'} 
                      className={`${inputClasses} bg-slate-100 text-slate-600 font-black uppercase text-[11px] leading-tight resize-none border-dashed`}
                      placeholder="Select a product to see details..."
                   />
                </div>

                <div>
                  <label className={labelClasses}>Primary Ref #</label>
                  <input placeholder="DN-2025-XXX" value={newMove.ref} onChange={e => setNewMove({...newMove, ref: e.target.value})} className={inputClasses} />
                </div>
                <div>
                  <label className={labelClasses}>Linked ID # (WTN/Supplier)</label>
                  <div className="relative">
                    <FileText size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      placeholder="Linked Reference" 
                      value={newMove.wtn} 
                      onChange={e => setNewMove({...newMove, wtn: e.target.value})} 
                      className={`${inputClasses} pl-8 border-amber-200 bg-amber-50/20`} 
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClasses}>Quantity</label>
                  <input type="number" value={newMove.qty} onChange={e => setNewMove({...newMove, qty: Number(e.target.value)})} className={inputClasses} />
                </div>
                <div>
                  <label className={labelClasses}>Location Detail</label>
                  <input placeholder="Source or Destination" value={newMove.loc} onChange={e => setNewMove({...newMove, loc: e.target.value})} className={inputClasses} />
                </div>
             </div>
             <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button onClick={() => setShowTransferForm(false)} className="px-6 py-2 text-xs font-black uppercase text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
                <button onClick={handleManualPost} className="px-10 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:bg-blue-700 transition-all active:scale-95">Commit Movement</button>
             </div>
          </div>
        )}

        <div className="bg-blue-50 p-6 rounded-[32px] border border-blue-100 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2 relative" ref={lookupDropdownRef}>
             <label className={labelClasses}>Quick Stock Inquiry</label>
             <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Type Code or Name to search catalog..."
                  value={selectedProduct ? `${selectedProduct.code} - ${selectedProduct.name}` : lookupSearch}
                  onFocus={() => {
                    setShowLookupDropdown(true);
                  }}
                  onChange={e => {
                    setLookupSearch(e.target.value);
                    setShowLookupDropdown(true);
                    if (selectedSKU) setSelectedSKU('');
                  }}
                  className={`${inputClasses} h-12 bg-white text-base pl-12 ${selectedSKU ? 'border-blue-500 ring-4 ring-blue-500/10' : ''}`}
                />
             </div>
             
             {showLookupDropdown && (
               <div className="absolute z-50 left-0 right-0 mt-4 bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.2)] border border-slate-200 max-h-[400px] overflow-y-auto no-scrollbar">
                  {lookupResults.map(p => (
                    <button 
                      key={p.code} 
                      onClick={() => {
                        setSelectedSKU(p.code);
                        setShowLookupDropdown(false);
                        setLookupSearch(p.name);
                      }}
                      className="w-full text-left px-6 py-5 hover:bg-blue-50 border-b border-slate-50 last:border-0 flex justify-between items-start group transition-colors"
                    >
                      <div className="flex-1 pr-6">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="bg-slate-900 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase">{p.code}</span>
                        </div>
                        <span className="text-sm font-black text-slate-900 uppercase tracking-tight leading-tight block whitespace-normal">{p.name}</span>
                      </div>
                      <ArrowRight size={18} className="text-slate-200 group-hover:text-blue-600 transition-all mt-1 shrink-0" />
                    </button>
                  ))}
               </div>
             )}
          </div>
          {selectedProduct && (
            <div className="bg-slate-900 rounded-2xl p-4 text-white animate-in zoom-in-95">
               <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">On-Hand Balance</span>
               <span className="text-2xl font-black text-blue-400">{stockBalance} Units</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[24px] border border-slate-200 flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
           <div className="flex items-center gap-2">
             <ClipboardList size={18} className="text-blue-600" />
             <h3 className="font-black uppercase tracking-widest text-slate-900 text-[10px] max-w-[500px] truncate">
               {selectedProduct ? `SKU: ${selectedProduct.code} - ${selectedProduct.name}` : 'Documented Movement History'}
             </h3>
           </div>
           {selectedProduct && (
              <button 
                onClick={() => { setSelectedSKU(''); setLookupSearch(''); }} 
                className="text-[9px] font-black text-slate-400 uppercase hover:text-[#c02428] transition-colors"
              >
                Reset Ledger View
              </button>
           )}
        </div>
        
        <div className="flex-1 overflow-auto no-scrollbar">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-900 text-[10px] font-black uppercase text-white tracking-widest text-center">
                <th className="p-4 w-28 text-left">Date</th>
                <th className="p-4 w-28 text-left">Type</th>
                <th className="p-4 text-left">Primary ID</th>
                <th className="p-4 text-left">Linked ID #</th>
                <th className="p-4 w-24 text-right">In</th>
                <th className="p-4 w-24 text-right">Out</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((row, i) => (
                  <tr key={i} className="hover:bg-blue-50/30 transition-colors text-xs font-black text-slate-700">
                    <td className="p-4 font-black text-black tabular-nums">{formatDate(row.date)}</td>
                    <td className="p-4">
                       <span className={`uppercase font-black text-[9px] tracking-widest ${row.type === 'TRANSFER_IN' ? 'text-emerald-600' : (row.type === 'SALE' ? 'text-blue-600' : 'text-slate-500')}`}>
                         {row.type.replace('_', ' ')}
                       </span>
                    </td>
                    <td className="p-4 font-black text-black uppercase">{row.reference}</td>
                    <td className="p-4">
                       {row.associatedWtn ? (
                         <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-lg text-[10px] uppercase font-black">{row.associatedWtn}</span>
                       ) : (
                         (row.type === 'TRANSFER_OUT' || row.type === 'SALE' || row.type === 'TRANSFER_IN') ? <span className="text-red-400 font-black italic opacity-50 text-[10px]">MISSING LINK</span> : '-'
                       )}
                    </td>
                    <td className="p-4 text-right tabular-nums font-black text-emerald-600">
                      {row.type === 'TRANSFER_IN' ? `+${row.quantity}` : '-'}
                    </td>
                    <td className="p-4 text-right tabular-nums font-black text-[#c02428]">
                      {row.type !== 'TRANSFER_IN' ? `-${row.quantity}` : '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-20 text-center">
                     <Package size={48} className="mx-auto text-slate-200 mb-4" />
                     <p className="text-sm font-black text-slate-300 uppercase tracking-widest">
                       {selectedSKU ? 'No transaction history for this item' : 'Select a product to view its audit ledger'}
                     </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StockManager;
