import React, { useState } from 'react';
import {
  X,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Truck,
  DollarSign,
  Calendar,
  Building,
  Check,
  Paperclip,
  ExternalLink,
} from 'lucide-react';
import { SupplierQuoteItem } from '../types/rateAnalysis';
import { RateAnalysisEngine } from '../engine/rateAnalysisEngine';

interface SupplierQuotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotes: SupplierQuoteItem[];
  onSelectQuote: (id: string) => void;
  onAddQuote: (quote: SupplierQuoteItem) => void;
}

export const SupplierQuotesModal: React.FC<SupplierQuotesModalProps> = ({
  isOpen,
  onClose,
  quotes,
  onSelectQuote,
  onAddQuote,
}) => {
  const [activeTab, setActiveTab] = useState<'REGISTER' | 'COMPARISON'>('COMPARISON');
  const [selectedMaterialFilter, setSelectedMaterialFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingQuote, setIsAddingQuote] = useState(false);

  const [newQuote, setNewQuote] = useState<Partial<SupplierQuoteItem>>({
    supplierName: '',
    materialOrService: '',
    specification: '',
    unit: 'bag',
    quotedRate: 0,
    currency: 'AED',
    transportIncluded: true,
    transportCostPerUnit: 0,
    taxIncluded: false,
    taxPercent: 5.0,
    validityStartDate: new Date().toISOString().split('T')[0],
    validityEndDate: '2026-12-31',
    deliveryLeadDays: 3,
    paymentTerms: '30 Days Net',
    notes: '',
  });

  if (!isOpen) return null;

  // Extract unique materials
  const distinctMaterials = Array.from(new Set(quotes.map((q) => q.materialOrService)));

  const filteredQuotes = quotes.filter((q) => {
    const matchMat = selectedMaterialFilter === 'ALL' || q.materialOrService === selectedMaterialFilter;
    const matchSearch =
      q.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.materialOrService.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.specification.toLowerCase().includes(searchQuery.toLowerCase());
    return matchMat && matchSearch;
  });

  const handleSaveQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuote.supplierName || !newQuote.materialOrService || !newQuote.quotedRate) return;

    const base = newQuote.quotedRate || 0;
    const transport = newQuote.transportCostPerUnit || 0;
    const tax = newQuote.taxIncluded ? 0 : base * ((newQuote.taxPercent || 0) / 100);
    const delivered = base + transport + tax;

    const completeQuote: SupplierQuoteItem = {
      id: `SQ-2026-${Math.floor(100 + Math.random() * 900)}`,
      supplierName: newQuote.supplierName,
      contactPerson: newQuote.contactPerson || 'Sales Dept',
      phone: newQuote.phone || '+1 555-0100',
      email: newQuote.email || 'sales@supplier.com',
      materialOrService: newQuote.materialOrService,
      specification: newQuote.specification || 'Standard Spec',
      quantityAvailable: newQuote.quantityAvailable || 1000,
      unit: newQuote.unit || 'm³',
      quotedRate: base,
      currency: newQuote.currency || 'AED',
      transportIncluded: Boolean(newQuote.transportIncluded),
      transportCostPerUnit: transport,
      taxIncluded: Boolean(newQuote.taxIncluded),
      taxPercent: newQuote.taxPercent || 5.0,
      deliveredUnitCost: Number(delivered.toFixed(4)),
      validityStartDate: newQuote.validityStartDate || new Date().toISOString().split('T')[0],
      validityEndDate: newQuote.validityEndDate || '2026-12-31',
      isExpired: false,
      deliveryLeadDays: newQuote.deliveryLeadDays || 3,
      paymentTerms: newQuote.paymentTerms || '30 Days Net',
      notes: newQuote.notes || '',
      attachmentFileName: 'Supplier_Quotation_Document.pdf',
      isSelectedForRateAnalysis: false,
    };

    onAddQuote(completeQuote);
    setIsAddingQuote(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight uppercase">
                Supplier Quotes Register & Comparison Matrix
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Side-by-side quotation comparison with delivered cost breakdown (Material + Transport + Taxes)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddingQuote(true)}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Supplier Quote</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Switcher & Material Filter */}
        <div className="px-6 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-white shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-slate-100 p-0.5 rounded-lg flex items-center">
              <button
                onClick={() => {
                  setActiveTab('COMPARISON');
                  setIsAddingQuote(false);
                }}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  activeTab === 'COMPARISON' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Comparison Matrix
              </button>
              <button
                onClick={() => {
                  setActiveTab('REGISTER');
                  setIsAddingQuote(false);
                }}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  activeTab === 'REGISTER' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Full Quotes Register ({quotes.length})
              </button>
            </div>

            <select
              value={selectedMaterialFilter}
              onChange={(e) => setSelectedMaterialFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700"
            >
              <option value="ALL">All Materials & Scopes</option>
              {distinctMaterials.map((mat) => (
                <option key={mat} value={mat}>
                  {mat}
                </option>
              ))}
            </select>
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search supplier, material..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {isAddingQuote ? (
            /* Add Quote Form */
            <form onSubmit={handleSaveQuote} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm max-w-3xl mx-auto space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="text-sm font-black uppercase text-slate-900">Add Supplier Quotation Record</h4>
                <button type="button" onClick={() => setIsAddingQuote(false)} className="text-xs text-slate-500 hover:text-slate-800 font-bold">
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Supplier Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Steel Industries"
                    value={newQuote.supplierName}
                    onChange={(e) => setNewQuote({ ...newQuote, supplierName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Material or Trade Scope *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. OPC 53 Grade Cement / TMT Rebar Fe500D"
                    value={newQuote.materialOrService}
                    onChange={(e) => setNewQuote({ ...newQuote, materialOrService: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Specification / Grade</label>
                  <input
                    type="text"
                    placeholder="e.g. IS 1786 Fe500D 8mm-32mm Bundles"
                    value={newQuote.specification}
                    onChange={(e) => setNewQuote({ ...newQuote, specification: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quoted Unit Rate (AED) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={newQuote.quotedRate || ''}
                    onChange={(e) => setNewQuote({ ...newQuote, quotedRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-mono font-bold text-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. bag, tonne, m³, hour"
                    value={newQuote.unit}
                    onChange={(e) => setNewQuote({ ...newQuote, unit: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Transport Cost per Unit ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newQuote.transportCostPerUnit || 0}
                    onChange={(e) => setNewQuote({ ...newQuote, transportCostPerUnit: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Applicable Tax / VAT %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newQuote.taxPercent || 5.0}
                    onChange={(e) => setNewQuote({ ...newQuote, taxPercent: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Validity Expiry Date</label>
                  <input
                    type="date"
                    value={newQuote.validityEndDate}
                    onChange={(e) => setNewQuote({ ...newQuote, validityEndDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Delivery Lead Time (Days)</label>
                  <input
                    type="number"
                    value={newQuote.deliveryLeadDays || 3}
                    onChange={(e) => setNewQuote({ ...newQuote, deliveryLeadDays: parseInt(e.target.value) || 3 })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddingQuote(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm"
                >
                  Save Supplier Quote
                </button>
              </div>
            </form>
          ) : activeTab === 'COMPARISON' ? (
            /* Comparison Matrix Cards Grouped by Material */
            <div className="space-y-6">
              {distinctMaterials.map((mat) => {
                const matQuotes = quotes.filter((q) => q.materialOrService === mat);
                if (matQuotes.length === 0) return null;

                return (
                  <div key={mat} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                          Material Scope: {mat}
                        </h4>
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {matQuotes.length} competing quotations
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
                      {matQuotes.map((q) => {
                        const isExpired = RateAnalysisEngine.isRateExpired(q.validityEndDate);
                        return (
                          <div
                            key={q.id}
                            className={`rounded-xl p-4 border transition-all flex flex-col justify-between ${
                              q.isSelectedForRateAnalysis
                                ? 'bg-emerald-50/50 border-emerald-400 shadow-xs ring-2 ring-emerald-500/20'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div>
                                  <h5 className="text-xs font-black text-slate-900">{q.supplierName}</h5>
                                  <span className="text-[10px] text-slate-500">{q.contactPerson}</span>
                                </div>
                                {q.isSelectedForRateAnalysis && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                                    <Check className="w-3 h-3" />
                                    <span>Selected</span>
                                  </span>
                                )}
                              </div>

                              <div className="bg-slate-50 rounded-lg p-3 space-y-1.5 mb-3 border border-slate-100">
                                <div className="flex justify-between text-xs">
                                  <span className="text-slate-500">Quoted Rate:</span>
                                  <span className="font-mono font-bold text-slate-900">
                                    ${q.quotedRate.toFixed(2)} / {q.unit}
                                  </span>
                                </div>
                                <div className="flex justify-between text-[11px]">
                                  <span className="text-slate-500">Transport:</span>
                                  <span className="font-mono text-slate-700">
                                    {q.transportCostPerUnit > 0 ? `+$${q.transportCostPerUnit.toFixed(2)}` : 'Included'}
                                  </span>
                                </div>
                                <div className="flex justify-between text-[11px]">
                                  <span className="text-slate-500">Tax / VAT ({q.taxPercent}%):</span>
                                  <span className="font-mono text-slate-700">
                                    +${(q.quotedRate * (q.taxPercent / 100)).toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex justify-between text-xs pt-1.5 border-t border-slate-200 font-bold">
                                  <span className="text-slate-900">Delivered Rate:</span>
                                  <span className="font-mono text-emerald-700 font-black">
                                    ${q.deliveredUnitCost.toFixed(2)} / {q.unit}
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-1 text-[11px] text-slate-500 mb-4">
                                <div>Lead Time: <strong className="text-slate-700">{q.deliveryLeadDays} days</strong></div>
                                <div>Terms: <strong className="text-slate-700">{q.paymentTerms}</strong></div>
                                <div className="flex items-center gap-1 text-[10px] text-indigo-600">
                                  <Paperclip className="w-3 h-3" />
                                  <span>{q.attachmentFileName || 'Quotation.pdf'}</span>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => onSelectQuote(q.id)}
                              className={`w-full py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                                q.isSelectedForRateAnalysis
                                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{q.isSelectedForRateAnalysis ? 'Active in Rate Analysis' : 'Select for Pricing'}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Full Quotes Register Table */
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Ref / Supplier</th>
                    <th className="py-2.5 px-4">Scope / Material</th>
                    <th className="py-2.5 px-4">Unit</th>
                    <th className="py-2.5 px-4">Quoted Rate</th>
                    <th className="py-2.5 px-4">Transport</th>
                    <th className="py-2.5 px-4">Delivered Cost</th>
                    <th className="py-2.5 px-4">Validity</th>
                    <th className="py-2.5 px-4 text-right">Selection</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredQuotes.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{q.supplierName}</span>
                          <span className="text-[10px] font-mono text-slate-400">{q.id}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">{q.materialOrService}</span>
                          <span className="text-[10px] text-slate-500">{q.specification}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-slate-700">{q.unit}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">${q.quotedRate.toFixed(2)}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">${q.transportCostPerUnit.toFixed(2)}</td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-700">${q.deliveredUnitCost.toFixed(2)}</td>
                      <td className="py-3 px-4 text-[11px] font-mono text-slate-600">{q.validityEndDate}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onSelectQuote(q.id)}
                          className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
                            q.isSelectedForRateAnalysis
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {q.isSelectedForRateAnalysis ? 'Selected' : 'Use Rate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>{quotes.length} total quotations archived with full commercial terms</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors"
          >
            Close Quotes Register
          </button>
        </div>
      </div>
    </div>
  );
};
