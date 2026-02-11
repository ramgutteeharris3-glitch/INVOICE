import React from 'react';
import { Invoice, LineItem, CompanyInfo, Currency } from '../types';
import { professionalizeDescription } from './services/geminiService';
import { Plus, Trash2, Sparkles, Building2, User, Info, Receipt } from 'lucide-react';

interface Props {
  invoice: Invoice;
  onUpdateInvoice: (updates: Partial<Invoice>) => void;
  onUpdateSender: (updates: Partial<CompanyInfo>) => void;
  onUpdateClient: (updates: Partial<CompanyInfo>) => void;
}

const InvoiceForm: React.FC<Props> = ({ invoice, onUpdateInvoice, onUpdateSender, onUpdateClient }) => {
  // IMPROVED: High contrast, ultra-large text for the secondary invoice form
  const inputClasses = "w-full px-5 py-5 bg-white border-2 border-slate-300 rounded-2xl focus:ring-8 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-black font-black placeholder:text-slate-300 text-2xl shadow-sm";
  const labelClasses = "block text-sm font-black text-slate-700 uppercase tracking-widest mb-3";
  
  const addItem = () => {
    const newItem: LineItem = {
      id: Math.random().toString(36).substr(2, 9),
      description: '',
      quantity: 1,
      rate: 0,
    };
    onUpdateInvoice({ items: [...invoice.items, newItem] });
  };

  const updateItem = (id: string, updates: Partial<LineItem>) => {
    const newItems = invoice.items.map(item => item.id === id ? { ...item, ...updates } : item);
    onUpdateInvoice({ items: newItems });
  };

  const removeItem = (id: string) => {
    if (invoice.items.length === 1) return;
    onUpdateInvoice({ items: invoice.items.filter(item => item.id !== id) });
  };

  const handleSmartPolish = async (id: string) => {
    const item = invoice.items.find(i => i.id === id);
    if (!item) return;
    
    const polished = await professionalizeDescription(item.description);
    updateItem(id, { description: polished });
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Basic Details */}
      <section className="bg-white rounded-[40px] p-10 shadow-2xl border border-slate-200">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg"><Info size={24} /></div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Voucher Metadata</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          <div className="col-span-2 sm:col-span-1">
            <label className={labelClasses}>Voucher #</label>
            <input
              type="text"
              value={invoice.invoiceNumber}
              onChange={(e) => onUpdateInvoice({ invoiceNumber: e.target.value })}
              className={inputClasses}
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className={labelClasses}>Currency</label>
            <select
              value={invoice.currency}
              onChange={(e) => onUpdateInvoice({ currency: e.target.value as Currency })}
              className={`${inputClasses} appearance-none cursor-pointer`}
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="MUR">MUR (Rs)</option>
              <option value="JPY">JPY (¥)</option>
            </select>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className={labelClasses}>Issue Date</label>
            <input
              type="date"
              value={invoice.date}
              onChange={(e) => onUpdateInvoice({ date: e.target.value })}
              className={inputClasses}
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className={labelClasses}>Due By</label>
            <input
              type="date"
              value={invoice.dueDate}
              onChange={(e) => onUpdateInvoice({ dueDate: e.target.value })}
              className={inputClasses}
            />
          </div>
        </div>
      </section>

      {/* Parties */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <section className="bg-white rounded-[40px] p-10 shadow-2xl border border-slate-200">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-slate-900 rounded-2xl text-white shadow-lg"><Building2 size={24} /></div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Vendor (Sender)</h2>
          </div>
          <div className="space-y-8">
            <div>
              <label className={labelClasses}>Trading Name</label>
              <input
                placeholder="Enterprise Name"
                value={invoice.sender.name}
                onChange={(e) => onUpdateSender({ name: e.target.value })}
                className={inputClasses}
              />
            </div>
            <div>
              <label className={labelClasses}>Contact Email</label>
              <input
                placeholder="accounts@corp.com"
                value={invoice.sender.email}
                onChange={(e) => onUpdateSender({ email: e.target.value })}
                className={inputClasses}
              />
            </div>
            <div>
              <label className={labelClasses}>Physical Address</label>
              <textarea
                placeholder="Head Office Address..."
                rows={3}
                value={invoice.sender.address}
                onChange={(e) => onUpdateSender({ address: e.target.value })}
                className={`${inputClasses} resize-none leading-relaxed`}
              />
            </div>
          </div>
        </section>

        <section className="bg-white rounded-[40px] p-10 shadow-2xl border border-slate-200">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-slate-900 rounded-2xl text-white shadow-lg"><User size={24} /></div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Client (Payee)</h2>
          </div>
          <div className="space-y-8">
            <div>
              <label className={labelClasses}>Customer Name</label>
              <input
                placeholder="Payee Identity"
                value={invoice.client.name}
                onChange={(e) => onUpdateClient({ name: e.target.value })}
                className={inputClasses}
              />
            </div>
            <div>
              <label className={labelClasses}>Email Address</label>
              <input
                placeholder="inbox@client.mu"
                value={invoice.client.email}
                onChange={(e) => onUpdateClient({ email: e.target.value })}
                className={inputClasses}
              />
            </div>
            <div>
              <label className={labelClasses}>Billing Address</label>
              <textarea
                placeholder="Registered Office..."
                rows={3}
                value={invoice.client.address}
                onChange={(e) => onUpdateClient({ address: e.target.value })}
                className={`${inputClasses} resize-none leading-relaxed`}
              />
            </div>
          </div>
        </section>
      </div>

      {/* Items List */}
      <section className="bg-white rounded-[40px] p-10 shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg"><Receipt size={24} /></div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Service Manifest</h2>
          </div>
          <button
            onClick={addItem}
            className="flex items-center gap-4 px-10 py-5 bg-indigo-600 text-white rounded-[24px] hover:bg-indigo-700 transition-all text-lg font-black uppercase shadow-2xl active:scale-95"
          >
            <Plus size={24} /> Append Row
          </button>
        </div>
        
        <div className="space-y-8">
          {invoice.items.map((item) => (
            <div key={item.id} className="group p-8 bg-slate-50/50 rounded-[32px] border-2 border-slate-200 transition-all hover:border-indigo-400 shadow-sm">
              <div className="grid grid-cols-12 gap-8">
                <div className="col-span-12 sm:col-span-6 relative">
                  <label className={labelClasses}>Goods/Service Description</label>
                  <div className="relative">
                    <input
                      value={item.description}
                      onChange={(e) => updateItem(item.id, { description: e.target.value })}
                      placeholder="Line item description"
                      className="w-full pl-6 pr-16 py-6 bg-white border-2 border-slate-300 rounded-2xl outline-none focus:ring-8 focus:ring-indigo-500/10 text-black font-black text-2xl uppercase tracking-tight"
                    />
                    <button
                      onClick={() => handleSmartPolish(item.id)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-2xl transition-all border border-indigo-100 shadow-md"
                    >
                      <Sparkles size={28} />
                    </button>
                  </div>
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <label className={labelClasses}>Units</label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) })}
                    className="w-full px-5 py-6 bg-white border-2 border-slate-300 rounded-2xl outline-none focus:ring-8 focus:ring-indigo-500/10 text-black font-black text-2xl text-center tabular-nums"
                  />
                </div>
                <div className="col-span-5 sm:col-span-3">
                  <label className={labelClasses}>Rate (Unit)</label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black text-2xl tabular-nums">Rs</span>
                    <input
                      type="number"
                      min="0"
                      value={item.rate}
                      onChange={(e) => updateItem(item.id, { rate: Number(e.target.value) })}
                      className="w-full pl-16 pr-6 py-6 bg-white border-2 border-slate-300 rounded-2xl outline-none focus:ring-8 focus:ring-indigo-500/10 text-black font-black text-2xl tabular-nums"
                    />
                  </div>
                </div>
                <div className="col-span-3 sm:col-span-1 flex items-end justify-center pb-3">
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all shadow-sm hover:shadow-md"
                  >
                    <Trash2 size={32} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t-4 border-slate-100 pt-10 grid grid-cols-1 md:grid-cols-2 gap-12">
           <div className="space-y-8">
              <div>
                <label className={labelClasses}>Payment Protocol & Notes</label>
                <textarea
                  rows={4}
                  value={invoice.notes}
                  onChange={(e) => onUpdateInvoice({ notes: e.target.value })}
                  placeholder="Terms of service..."
                  className={`${inputClasses} resize-none`}
                />
              </div>
           </div>
           
           <div className="bg-slate-900 p-10 rounded-[32px] border-2 border-slate-800 space-y-6 shadow-2xl">
              <div className="flex justify-between items-center">
                <span className="text-sm font-black uppercase text-slate-400 tracking-[0.2em]">VAT Liability</span>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={invoice.taxRate}
                    onChange={(e) => onUpdateInvoice({ taxRate: Number(e.target.value) })}
                    className="w-32 px-5 py-4 bg-slate-800 border-2 border-slate-700 rounded-xl text-right outline-none text-white font-black text-2xl tabular-nums"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-lg font-black text-indigo-400">%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-black uppercase text-slate-400 tracking-[0.2em]">Discount Adjust</span>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={invoice.discount}
                    onChange={(e) => onUpdateInvoice({ discount: Number(e.target.value) })}
                    className="w-32 px-5 py-4 bg-slate-800 border-2 border-slate-700 rounded-xl text-right outline-none text-white font-black text-2xl tabular-nums"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-lg font-black text-indigo-400">%</span>
                </div>
              </div>
              <div className="pt-6 border-t border-slate-800 flex justify-between items-center">
                 <span className="text-xl font-black text-white uppercase tracking-[0.3em]">Payable</span>
                 <span className="text-4xl font-black text-indigo-400 tabular-nums">Rs {invoice.items.reduce((s,i)=>s+(i.quantity*i.rate),0).toFixed(2)}</span>
              </div>
           </div>
        </div>
      </section>
    </div>
  );
};

export default InvoiceForm;