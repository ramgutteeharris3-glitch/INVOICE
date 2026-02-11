
import React, { useState, useEffect, useRef } from 'react';
import { Receipt, Product, StockMovement, MovementType } from './types';
import ReceiptForm from './components/ReceiptForm';
import ReceiptPreview from './components/ReceiptPreview';
import SalesAnalysis from './components/SalesAnalysis';
import StockManager from './components/StockManager';
import VoucherTracker from './components/VoucherTracker';
import { Layout, FileText, Sparkles, ZoomIn, ZoomOut, CheckCircle2, BarChart3, Mail, MessageSquare, Download, Save, Boxes, Maximize, ClipboardList } from 'lucide-react';

const INITIAL_STATE: Receipt = {
  receiptNumber: '116261',
  relatedInvoiceNo: '',
  date: new Date().toISOString().split('T')[0],
  salesRep: '',
  receivedFrom: '',
  clientAddress: '',
  clientPhone: '',
  clientEmail: '',
  addressNotes: '',
  paymentMethod: 'Cash',
  items: [
    { id: '1', code: '', description: 'Enter your first item description...', quantity: 1, rate: 0 }
  ],
  chequeNo: '',
  settlementOf: 'Current Order',
  currency: 'MUR',
  taxRate: 15,
  location: 'cascavelle',
  sender: {
    name: 'ab Desai & Co. Ltd',
    shopName: 'CASCAVELLE SHOP',
    email: 'info@abdesai.mu',
    address: '9, Corderie St., Port Louis, Mauritius',
    phone: '211 4114',
    taxId: 'VAT20903424',
    brn: 'P07005295'
  },
  notes: ''
};

const HeaderLogo: React.FC = () => (
  <div className="border border-white/20 p-[2px] bg-white flex flex-col items-center w-12 shrink-0">
    <div className="bg-[#c02428] w-full flex items-center justify-center py-0.5">
      <span className="text-white text-[10px] font-black leading-none tracking-tighter">ab</span>
    </div>
    <div className="flex items-center justify-center bg-white w-full py-0.5">
      <span className="text-[#c02428] text-[8px] font-black leading-none italic mr-[0.5px]">D</span>
      <span className="text-slate-900 text-[8px] font-black leading-none tracking-tighter">esai</span>
    </div>
  </div>
);

const App: React.FC = () => {
  const [receipt, setReceipt] = useState<Receipt>(() => {
    const saved = localStorage.getItem('last_receipt_v4');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed;
      } catch (e) {
        return INITIAL_STATE;
      }
    }
    return INITIAL_STATE;
  });

  const [productList, setProductList] = useState<Product[]>(() => {
    const saved = localStorage.getItem('user_product_inventory');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [receiptHistory, setReceiptHistory] = useState<Receipt[]>(() => {
    const saved = localStorage.getItem('receipt_history_v4');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [movements, setMovements] = useState<StockMovement[]>(() => {
    const saved = localStorage.getItem('stock_movements_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [activeTab, setActiveTab] = useState<'form' | 'preview' | 'analysis' | 'stock' | 'tracker'>('form');
  const [scale, setScale] = useState(1);
  const [autoScaleFactor, setAutoScaleFactor] = useState(1);
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const docToPrintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('last_receipt_v4', JSON.stringify(receipt));
  }, [receipt]);

  useEffect(() => {
    localStorage.setItem('user_product_inventory', JSON.stringify(productList));
  }, [productList]);

  useEffect(() => {
    localStorage.setItem('receipt_history_v4', JSON.stringify(receiptHistory));
  }, [receiptHistory]);

  useEffect(() => {
    localStorage.setItem('stock_movements_v1', JSON.stringify(movements));
  }, [movements]);

  const calculateAutoScale = () => {
    if (containerRef.current) {
      const padding = 80; 
      const containerWidth = containerRef.current.clientWidth - padding;
      const docWidth = (activeTab === 'analysis' || activeTab === 'stock' || activeTab === 'tracker') ? 793 : 770; 
      const newScale = Math.min(containerWidth / docWidth, 1.1);
      setAutoScaleFactor(newScale);
      setScale(newScale);
    }
  };

  useEffect(() => {
    const handleResize = () => calculateAutoScale();
    window.addEventListener('resize', handleResize);
    const timer = setTimeout(calculateAutoScale, 100);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [activeTab]);

  const handleUpdate = (updates: Partial<Receipt>) => {
    setReceipt(prev => ({ ...prev, ...updates }));
  };

  const handleRecall = (recalledReceipt: Receipt, targetTab: 'form' | 'preview' = 'form') => {
    const freshData = JSON.parse(JSON.stringify(recalledReceipt)) as Receipt;
    setReceipt(freshData);
    setIsEditingExisting(true);
    setActiveTab(targetTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateLinkedId = (type: 'RECEIPT' | 'TRANSFER_OUT' | 'TRANSFER_IN', primaryId: string, newLinkedId: string) => {
    if (type === 'RECEIPT') {
      // 1. Update Receipt History
      setReceiptHistory(prev => prev.map(r => {
        if (String(r.receiptNumber) === primaryId) {
          return { ...r, relatedInvoiceNo: newLinkedId };
        }
        return r;
      }));

      // 2. Synchronize current editor state if matching
      if (String(receipt.receiptNumber) === primaryId) {
        setReceipt(prev => ({ ...prev, relatedInvoiceNo: newLinkedId }));
      }
    }

    // ALWAYS synchronize any movement associated with this primary reference ID
    // This handles SALE (linked to receipts), TRANSFER_OUT (linked to DNs), and TRANSFER_IN
    setMovements(prev => prev.map(m => {
      if (String(m.reference) === primaryId) {
        return { ...m, associatedWtn: newLinkedId };
      }
      return m;
    }));
  };

  const validateAndPost = () => {
    const hasItems = receipt.items.some(i => i.description && i.rate > 0);
    if (!receipt.receivedFrom || !hasItems) {
      alert("Validation Failed: Please ensure Customer Name and at least one item are filled.");
      return;
    }
    
    const validatedReceipt = JSON.parse(JSON.stringify(receipt)) as Receipt;
    
    // Create movements with linked invoice number (associatedWtn) if available
    const salesMovements: StockMovement[] = validatedReceipt.items.map(item => ({
      id: Math.random().toString(36).substr(2, 9),
      date: validatedReceipt.date,
      itemCode: item.code || 'NO-CODE',
      itemName: item.description,
      type: 'SALE',
      reference: validatedReceipt.receiptNumber,
      associatedWtn: validatedReceipt.relatedInvoiceNo, // Auto-link to invoice number entered in form
      quantity: item.quantity,
      location: validatedReceipt.receivedFrom || 'CASH SALE',
      notes: `Sale to ${validatedReceipt.receivedFrom}`
    }));

    // Update Movements Ledger
    if (isEditingExisting) {
      // Replace existing movements for this receipt to avoid duplicates
      setMovements(prev => {
        const otherMovements = prev.filter(m => !(m.type === 'SALE' && String(m.reference) === String(validatedReceipt.receiptNumber)));
        return [...salesMovements, ...otherMovements];
      });
    } else {
      setMovements(prev => [...salesMovements, ...prev]);
    }

    setReceiptHistory(prev => {
      const existingIdx = prev.findIndex(r => String(r.receiptNumber) === String(validatedReceipt.receiptNumber));
      if (existingIdx !== -1) {
        const newHistory = [...prev];
        newHistory[existingIdx] = validatedReceipt;
        return newHistory;
      }
      return [validatedReceipt, ...prev];
    });

    if (isEditingExisting) {
      alert(`SUCCESS: Invoice #${receipt.receiptNumber} updated.`);
      setIsEditingExisting(false);
    } else {
      alert(`POSTED: Invoice #${receipt.receiptNumber} recorded.`);
      const currentNum = parseInt(receipt.receiptNumber);
      const nextNum = isNaN(currentNum) ? '116261' : (currentNum + 1).toString();
      
      setReceipt(prev => ({
        ...prev,
        receiptNumber: nextNum,
        relatedInvoiceNo: '',
        receivedFrom: '',
        clientAddress: '',
        clientPhone: '',
        clientEmail: '',
        items: [{ id: Math.random().toString(36).substr(2, 9), code: '', description: '', quantity: 1, rate: 0 }],
        settlementOf: 'Current Order'
      }));
    }
    setActiveTab('preview');
  };

  const addManualMovement = (move: StockMovement | StockMovement[]) => {
    if (Array.isArray(move)) {
      setMovements(prev => [...move, ...prev]);
    } else {
      setMovements(prev => [move, ...prev]);
    }
  };

  const handleDownloadPDF = async () => {
    if (!docToPrintRef.current) return;
    setIsGeneratingPDF(true);
    
    const win = window as any;
    const html2pdfLib = win.html2pdf;
    
    if (!html2pdfLib) {
      alert('PDF Engine loading...');
      setIsGeneratingPDF(false);
      return;
    }

    const isReport = activeTab === 'analysis' || activeTab === 'stock' || activeTab === 'tracker';
    const opt = {
      margin: 0,
      filename: `Doc_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { 
        scale: 3, 
        useCORS: true, 
        letterRendering: true,
        scrollX: 0,
        scrollY: 0,
      },
      jsPDF: { 
        unit: 'mm', 
        format: isReport ? 'a4' : 'a5', 
        orientation: isReport ? 'portrait' : 'landscape', 
        compress: true 
      }
    };

    try {
      window.scrollTo(0,0);
      await html2pdfLib().set(opt).from(docToPrintRef.current).save();
    } catch (error) {
      console.error(error);
      alert('PDF generation failed.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const shareViaWhatsApp = () => {
    const total = receipt.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0).toFixed(2);
    const text = encodeURIComponent(`Hello,\nAttached is Invoice #${receipt.receiptNumber}.\nTotal: Rs ${total}\nThank you!`);
    const phone = receipt.clientPhone ? receipt.clientPhone.replace(/\s+/g, '') : '';
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  const adjustScale = (delta: number) => {
    setScale(prev => Math.min(Math.max(0.4, prev + delta), 2.5));
  };

  const resetScale = () => {
    setScale(autoScaleFactor);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col overflow-hidden">
      <header className="bg-slate-900 text-white z-50 shadow-2xl no-print shrink-0 border-b border-white/5">
        <div className="w-full px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 shrink-0">
            <HeaderLogo />
            <div className="hidden sm:block">
              <h1 className="text-lg font-black uppercase tracking-[0.2em] leading-none">AB Desai</h1>
              <p className="text-[9px] font-bold text-[#c02428] uppercase tracking-widest mt-1 text-center">Invoicing</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-2xl border border-white/10 shadow-lg shrink-0">
            <button
              onClick={() => setActiveTab('form')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black transition-all ${activeTab === 'form' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <Layout size={14} /> EDITOR
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black transition-all ${activeTab === 'preview' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <FileText size={14} /> PREVIEW
            </button>
            <button
              onClick={() => setActiveTab('stock')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black transition-all ${activeTab === 'stock' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <Boxes size={14} /> STOCK
            </button>
            <button
              onClick={() => setActiveTab('tracker')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black transition-all ${activeTab === 'tracker' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <ClipboardList size={14} /> TRACKER
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black transition-all ${activeTab === 'analysis' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <BarChart3 size={14} /> HISTORY
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleDownloadPDF} 
              disabled={isGeneratingPDF}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black transition-all border-b-4 border-blue-800 disabled:opacity-50"
            >
              <Download size={14} /> PDF
            </button>
            
            <button onClick={shareViaWhatsApp} className="p-2.5 bg-slate-800 hover:bg-slate-700 text-green-400 rounded-xl border border-white/10 transition-all shadow-lg">
              <MessageSquare size={18} />
            </button>

            <button 
              onClick={validateAndPost}
              className={`flex items-center gap-2 px-4 py-2.5 ${isEditingExisting ? 'bg-emerald-600 border-emerald-800' : 'bg-[#c02428] border-red-900'} text-white rounded-xl text-[10px] font-black transition-all border-b-4`}
            >
              {isEditingExisting ? <Save size={16} /> : <CheckCircle2 size={16} />} 
              {isEditingExisting ? 'UPDATE' : 'POST'}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col xl:flex-row w-full h-full p-4 gap-6">
          <div className={`w-full xl:w-[460px] shrink-0 h-full flex flex-col gap-4 ${activeTab !== 'form' ? 'hidden xl:flex' : 'flex'}`}>
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
               <ReceiptForm 
                  receipt={receipt} 
                  onUpdate={handleUpdate} 
                  productList={productList}
                  setProductList={setProductList}
                  onValidate={validateAndPost}
                  receiptHistory={receiptHistory}
                  onRecall={handleRecall}
                  isEditing={isEditingExisting}
                />
            </div>
          </div>

          <div className={`flex-1 h-full rounded-[48px] bg-slate-200/40 border border-slate-300/50 flex flex-col overflow-hidden relative shadow-inner ${activeTab === 'form' ? 'hidden xl:flex' : 'flex'}`}>
            <div ref={containerRef} className="flex-1 overflow-auto p-10 flex items-start justify-start bg-[radial-gradient(#cbd5e1_1.5px,transparent_1.5px)] [background-size:32px_32px] relative scroll-smooth">
              <div 
                className="preview-scale-wrapper flex items-start justify-start" 
                style={{ 
                  transform: `scale(${scale})`,
                  width: (activeTab === 'analysis' || activeTab === 'stock' || activeTab === 'tracker') ? `${793 * scale}px` : `${770 * scale}px`,
                  minWidth: (activeTab === 'analysis' || activeTab === 'stock' || activeTab === 'tracker') ? '793px' : '770px',
                  height: 'auto',
                  transformOrigin: 'top left'
                }}
              >
                 <div ref={docToPrintRef} className="bg-white shadow-2xl print-reset" style={{ width: (activeTab === 'analysis' || activeTab === 'stock' || activeTab === 'tracker') ? '793px' : '770px' }}>
                    {activeTab === 'analysis' && <SalesAnalysis history={receiptHistory} onDownload={handleDownloadPDF} isDownloading={isGeneratingPDF} />}
                    {activeTab === 'preview' && <ReceiptPreview receipt={receipt} />}
                    {activeTab === 'tracker' && (
                      <VoucherTracker 
                        history={receiptHistory} 
                        movements={movements} 
                        onDownload={handleDownloadPDF} 
                        isDownloading={isGeneratingPDF} 
                        onUpdateLinkedId={handleUpdateLinkedId}
                      />
                    )}
                    {activeTab === 'stock' && (
                      <StockManager 
                        movements={movements} 
                        productList={productList} 
                        setProductList={setProductList}
                        onAddMovement={addManualMovement}
                      />
                    )}
                 </div>
              </div>
            </div>

            {/* FLOATING ZOOM CONTROLS */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-1 p-2 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.3)] no-print z-50">
               <button 
                  onClick={() => adjustScale(-0.1)} 
                  className="p-3 text-white hover:bg-white/10 rounded-xl transition-all"
                  title="Zoom Out"
               >
                 <ZoomOut size={18} />
               </button>
               <div className="w-[1px] h-6 bg-white/10 mx-1"></div>
               <button 
                  onClick={resetScale} 
                  className="px-4 py-2 text-white hover:bg-white/10 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                  title="Fit to Screen"
               >
                 <Maximize size={16} /> {Math.round(scale * 100)}%
               </button>
               <div className="w-[1px] h-6 bg-white/10 mx-1"></div>
               <button 
                  onClick={() => adjustScale(0.1)} 
                  className="p-3 text-white hover:bg-white/10 rounded-xl transition-all"
                  title="Zoom In"
               >
                 <ZoomIn size={18} />
               </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
