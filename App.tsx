
import React, { useState, useEffect, useRef } from 'react';
import { Receipt, Product, StockMovement, CompanyInfo } from './types';
import ReceiptForm from './components/ReceiptForm';
import ReceiptPreview from './components/ReceiptPreview';
import SalesAnalysis from './components/SalesAnalysis';
import StockManager from './components/StockManager';
import VoucherTracker from './components/VoucherTracker';
import { 
  FileText, 
  ZoomIn, 
  ZoomOut, 
  CheckCircle2, 
  BarChart3, 
  MapPin, 
  Store, 
  ChevronDown, 
  Layout, 
  Maximize, 
  ClipboardList, 
  Boxes,
  RefreshCw,
  Save,
  Download
} from 'lucide-react';

const CORPORATE_IDENTITY = {
  name: 'ab Desai & Co. Ltd',
  taxId: 'VAT20903424',
  brn: 'P07005295',
  email: 'info@abdesai.mu',
};

const BRANCH_PRESETS = [
  { shopName: 'PORT-LOUIS', address: '9, Corderie St., Port Louis, Mauritius', phone: '211 4114' },
  { shopName: 'ROSE-HILL', address: 'Royal Road, Rose Hill, Mauritius', phone: '464 1234' },
  { shopName: 'TRIBECCA', address: 'Tribecca Central, Terre Rouge-Verdun Link Rd, Mauritius', phone: '201 0001' },
  { shopName: 'TRIANON', address: 'Trianon Shopping Park, Quatre Bornes, Mauritius', phone: '467 5555' },
  { shopName: 'ROSE-BELLE', address: 'Plaisance Shopping Mall, Rose Belle, Mauritius', phone: '627 8888' },
  { shopName: 'CASCAVELLE', address: 'Cascavelle Shopping Village, Flic en Flac Road, Mauritius', phone: '489 7777' },
  { shopName: 'BAGATELLE', address: 'Bagatelle Mall of Mauritius, Moka, Mauritius', phone: '468 8888' },
  { shopName: 'MAIN BRANCH', address: 'Head Office, Port Louis, Mauritius', phone: '211 4114' }
];

const DEFAULT_SENDER: CompanyInfo = {
  ...CORPORATE_IDENTITY,
  ...BRANCH_PRESETS[5], // Default to Cascavelle
};

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
  items: [{ id: '1', code: '', description: '', quantity: 1, rate: 0 }],
  chequeNo: '',
  settlementOf: 'Full settlement of above.',
  currency: 'MUR',
  taxRate: 15,
  location: 'cascavelle',
  sender: DEFAULT_SENDER,
  notes: ''
};

const HeaderLogo: React.FC = () => (
  <div className="border border-white/20 p-[1px] bg-white flex flex-col items-center w-10 shrink-0">
    <div className="bg-[#c02428] w-full flex items-center justify-center py-0.5">
      <span className="text-white text-[9px] font-black leading-none">ab</span>
    </div>
    <div className="flex items-center justify-center bg-white w-full py-0.5">
      <span className="text-[#c02428] text-[7px] font-black italic">D</span>
      <span className="text-slate-900 text-[7px] font-black">esai</span>
    </div>
  </div>
);

const App: React.FC = () => {
  const [shopSettings, setShopSettings] = useState<CompanyInfo>(() => {
    const saved = localStorage.getItem('shop_settings_v3');
    return saved ? JSON.parse(saved) : DEFAULT_SENDER;
  });

  const [receipt, setReceipt] = useState<Receipt>(() => {
    const saved = localStorage.getItem('last_receipt_v5');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...parsed, sender: shopSettings };
      } catch (e) {
        return { ...INITIAL_STATE, sender: shopSettings };
      }
    }
    return { ...INITIAL_STATE, sender: shopSettings };
  });

  const [productList, setProductList] = useState<Product[]>(() => {
    const saved = localStorage.getItem('inventory_v1');
    return saved ? JSON.parse(saved) : [];
  });

  const [receiptHistory, setReceiptHistory] = useState<Receipt[]>(() => {
    const saved = localStorage.getItem('history_v1');
    return saved ? JSON.parse(saved) : [];
  });

  const [movements, setMovements] = useState<StockMovement[]>(() => {
    const saved = localStorage.getItem('movements_v1');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeTab, setActiveTab] = useState<'form' | 'preview' | 'analysis' | 'stock' | 'tracker'>('form');
  const [scale, setScale] = useState(0.85);
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const docToPrintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('shop_settings_v3', JSON.stringify(shopSettings));
    setReceipt(prev => ({ ...prev, sender: shopSettings, location: shopSettings.shopName?.toLowerCase() }));
  }, [shopSettings]);

  useEffect(() => localStorage.setItem('last_receipt_v5', JSON.stringify(receipt)), [receipt]);
  useEffect(() => localStorage.setItem('inventory_v1', JSON.stringify(productList)), [productList]);
  useEffect(() => localStorage.setItem('history_v1', JSON.stringify(receiptHistory)), [receiptHistory]);
  useEffect(() => localStorage.setItem('movements_v1', JSON.stringify(movements)), [movements]);

  const handleUpdate = (updates: Partial<Receipt>) => setReceipt(prev => ({ ...prev, ...updates }));

  const handleRecall = (recalledReceipt: Receipt, targetTab: 'form' | 'preview' = 'form') => {
    setReceipt({ ...recalledReceipt });
    setIsEditingExisting(true);
    setActiveTab(targetTab);
  };

  const validateAndPost = () => {
    const hasItems = receipt.items.some(i => i.description && i.rate > 0);
    if (!receipt.receivedFrom || !hasItems) {
      alert("Missing customer name or item data.");
      return;
    }

    const currentReceipt = { ...receipt };
    
    // Update Stock Movements for this sale
    const newMovements: StockMovement[] = receipt.items.map(item => ({
      id: Math.random().toString(36).substr(2, 9),
      date: receipt.date,
      itemCode: item.code || 'NA',
      itemName: item.description,
      type: 'SALE',
      reference: receipt.receiptNumber,
      associatedWtn: receipt.relatedInvoiceNo,
      quantity: item.quantity,
      location: shopSettings.shopName || 'STORE',
      notes: `Sale to ${receipt.receivedFrom}`
    }));

    setMovements(prev => [...newMovements, ...prev]);
    setReceiptHistory(prev => [currentReceipt, ...prev.filter(r => r.receiptNumber !== currentReceipt.receiptNumber)]);
    
    if (!isEditingExisting) {
      const nextId = (parseInt(receipt.receiptNumber) + 1).toString();
      setReceipt({
        ...INITIAL_STATE,
        receiptNumber: nextId,
        sender: shopSettings,
        location: shopSettings.shopName?.toLowerCase()
      });
    }

    alert("Invoice recorded and stock levels updated.");
    setActiveTab('preview');
  };

  const handleUpdateLinkedId = (type: 'RECEIPT' | 'TRANSFER_OUT' | 'TRANSFER_IN', primaryId: string, newLinkedId: string) => {
    if (type === 'RECEIPT') {
      setReceiptHistory(prev => prev.map(r => r.receiptNumber === primaryId ? { ...r, relatedInvoiceNo: newLinkedId } : r));
    } else {
      setMovements(prev => prev.map(m => (m.type === type && m.reference === primaryId) ? { ...m, associatedWtn: newLinkedId } : m));
    }
  };

  const handleDownloadPDF = async () => {
    if (!docToPrintRef.current) return;
    setIsGeneratingPDF(true);
    const win = window as any;
    if (!win.html2pdf) {
      alert("PDF library loading error.");
      setIsGeneratingPDF(false);
      return;
    }
    const opt = {
      margin: 0,
      filename: `ABDESAI_${receipt.receiptNumber}_${receipt.receivedFrom.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: activeTab === 'analysis' || activeTab === 'tracker' ? 'landscape' : 'portrait' }
    };
    try {
      await win.html2pdf().set(opt).from(docToPrintRef.current).save();
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col overflow-hidden">
      <header className="bg-slate-900 text-white z-[60] h-14 flex items-center px-4 justify-between border-b border-white/5 no-print">
        <div className="flex items-center gap-4">
          <HeaderLogo />
          <div className="relative">
            <button 
              onClick={() => setShowBranchMenu(!showBranchMenu)}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-white/10 transition-all group"
            >
              <MapPin size={14} className="text-red-500" />
              <div className="text-left">
                <p className="text-[10px] font-black uppercase leading-none text-red-500">{shopSettings.shopName}</p>
                <p className="text-[7px] font-bold text-slate-400 truncate max-w-[120px]">{shopSettings.address.split(',')[0]}</p>
              </div>
              <ChevronDown size={14} className={`text-slate-500 transition-transform ${showBranchMenu ? 'rotate-180' : ''}`} />
            </button>

            {showBranchMenu && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-[70]">
                <div className="p-3 bg-slate-50 border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest">Select Branch Location</div>
                <div className="max-h-72 overflow-y-auto">
                  {BRANCH_PRESETS.map((branch) => (
                    <button 
                      key={branch.shopName}
                      onClick={() => {
                        setShopSettings({ ...CORPORATE_IDENTITY, ...branch });
                        setShowBranchMenu(false);
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-red-50 flex items-center gap-3 border-b border-slate-50 last:border-0 transition-colors ${shopSettings.shopName === branch.shopName ? 'bg-red-50' : ''}`}
                    >
                      <Store size={16} className={shopSettings.shopName === branch.shopName ? 'text-red-600' : 'text-slate-300'} />
                      <div>
                        <p className={`text-[10px] font-black uppercase ${shopSettings.shopName === branch.shopName ? 'text-red-600' : 'text-slate-900'}`}>{branch.shopName}</p>
                        <p className="text-[8px] font-bold text-slate-400 truncate">{branch.address}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <nav className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl">
          <button onClick={() => setActiveTab('form')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${activeTab === 'form' ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'}`}>EDITOR</button>
          <button onClick={() => setActiveTab('preview')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${activeTab === 'preview' ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'}`}>PREVIEW</button>
          <button onClick={() => setActiveTab('analysis')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${activeTab === 'analysis' ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'}`}>SALES LOG</button>
          <button onClick={() => setActiveTab('stock')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${activeTab === 'stock' ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'}`}>INVENTORY</button>
          <button onClick={() => setActiveTab('tracker')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${activeTab === 'tracker' ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'}`}>TRACKER</button>
        </nav>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleDownloadPDF} 
            disabled={isGeneratingPDF}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-all border border-white/5"
          >
            {isGeneratingPDF ? <RefreshCw className="animate-spin" size={18}/> : <Download size={18}/>}
          </button>
          <button onClick={validateAndPost} className="bg-red-600 hover:bg-red-500 px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg border-b-4 border-red-900 active:translate-y-0.5 active:border-b-0">
            {isEditingExisting ? 'SAVE UPDATE' : 'POST INVOICE'}
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Always visible form for quick editing */}
        <div className="w-[380px] bg-white border-r border-slate-200 overflow-y-auto no-scrollbar no-print">
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
        
        {/* Main viewing area */}
        <div className="flex-1 relative bg-slate-200/50 flex flex-col items-center p-10 overflow-auto no-scrollbar">
          <div className="preview-scale-wrapper" style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}>
            <div ref={docToPrintRef} className="bg-white shadow-2xl">
              {activeTab === 'form' && <ReceiptPreview receipt={receipt} />}
              {activeTab === 'preview' && <ReceiptPreview receipt={receipt} />}
              {activeTab === 'analysis' && <SalesAnalysis history={receiptHistory} onDownload={handleDownloadPDF} />}
              {activeTab === 'stock' && <StockManager movements={movements} productList={productList} setProductList={setProductList} onAddMovement={(m) => setMovements(prev => Array.isArray(m) ? [...m, ...prev] : [m, ...prev])} />}
              {activeTab === 'tracker' && <VoucherTracker history={receiptHistory} movements={movements} onDownload={handleDownloadPDF} onUpdateLinkedId={handleUpdateLinkedId} />}
            </div>
          </div>

          <div className="fixed bottom-8 flex items-center gap-2 bg-slate-900/90 text-white p-2 rounded-2xl border border-white/20 shadow-2xl no-print">
            <button onClick={() => setScale(Math.max(0.4, scale - 0.05))} className="p-2 hover:bg-white/10 rounded-lg"><ZoomOut size={16}/></button>
            <span className="text-[10px] font-black px-2 w-12 text-center">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(Math.min(1.5, scale + 0.05))} className="p-2 hover:bg-white/10 rounded-lg"><ZoomIn size={16}/></button>
          </div>
        </div>
      </main>

      <style>{`
        .preview-scale-wrapper { transition: transform 0.1s ease-out; }
        @media print {
          .no-print { display: none !important; }
          .print-reset { transform: none !important; width: 100% !important; margin: 0 !important; box-shadow: none !important; border: none !important; }
          body, html { overflow: visible !important; height: auto !important; }
        }
      `}</style>
    </div>
  );
};

export default App;
