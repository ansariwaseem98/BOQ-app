import React, { useState } from 'react';
import {
  X,
  Plus,
  Search,
  Filter,
  Trash2,
  Copy,
  Edit2,
  AlertTriangle,
  CheckCircle2,
  Layers,
  DollarSign,
  Calendar,
  Building,
  Info,
  ArrowRightLeft,
} from 'lucide-react';
import {
  RateDatabaseItem,
  RateComponentCategory,
  CurrencyExchangeRate,
} from '../types/rateAnalysis';
import { RateAnalysisEngine } from '../engine/rateAnalysisEngine';

interface RateDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  rateDatabase: RateDatabaseItem[];
  exchangeRates: CurrencyExchangeRate[];
  onSaveItem: (item: RateDatabaseItem) => void;
  onDeleteItem: (id: string) => void;
  onDuplicateItem: (item: RateDatabaseItem) => void;
  onUpdateExchangeRate: (rate: CurrencyExchangeRate) => void;
}

export const RateDatabaseModal: React.FC<RateDatabaseModalProps> = ({
  isOpen,
  onClose,
  rateDatabase,
  exchangeRates,
  onSaveItem,
  onDeleteItem,
  onDuplicateItem,
  onUpdateExchangeRate,
}) => {
  const [activeCategory, setActiveCategory] = useState<RateComponentCategory | 'ALL' | 'CURRENCIES'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState<RateDatabaseItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const categories: (RateComponentCategory | 'ALL')[] = [
    'ALL',
    'MATERIAL',
    'LABOUR',
    'EQUIPMENT',
    'SUBCONTRACT',
    'TRANSPORT',
    'OTHER',
  ];

  const filteredItems = rateDatabase.filter((item) => {
    const matchesCategory = activeCategory === 'ALL' || item.category === activeCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.specification.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.supplier && item.supplier.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleStartCreate = () => {
    const defaultCat: RateComponentCategory = activeCategory === 'ALL' || activeCategory === 'CURRENCIES' ? 'MATERIAL' : activeCategory;
    setEditingItem({
      id: `RDB-${Date.now()}`,
      category: defaultCat,
      code: `RDB-${defaultCat.substring(0, 3)}-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      specification: '',
      unit: defaultCat === 'LABOUR' ? 'man-day' : defaultCat === 'EQUIPMENT' ? 'hour' : 'm³',
      rate: 0,
      currency: 'USD',
      supplier: '',
      location: 'Central Project Site',
      date: new Date().toISOString().split('T')[0],
      validityFrom: new Date().toISOString().split('T')[0],
      validityTo: '2026-12-31',
      source: 'Rate Database',
      notes: '',
    });
    setIsCreating(true);
  };

  const handleSaveCurrent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.name.trim()) return;
    onSaveItem(editingItem);
    setEditingItem(null);
    setIsCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight uppercase">
                Master Rate Database & Standard Rates
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Standard price catalog for Materials, Labour trades, Equipment, Subcontracts, and Logistics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleStartCreate}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Database Rate</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Tabs & Search Bar */}
        <div className="px-6 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-white shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setEditingItem(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  activeCategory === cat
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat} {cat !== 'ALL' && `(${rateDatabase.filter((i) => i.category === cat).length})`}
              </button>
            ))}
            <button
              onClick={() => {
                setActiveCategory('CURRENCIES');
                setEditingItem(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
                activeCategory === 'CURRENCIES'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Exchange Rates ({exchangeRates.length})</span>
            </button>
          </div>

          {activeCategory !== 'CURRENCIES' && (
            <div className="relative min-w-[260px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search catalog by name, code, spec..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
              />
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {activeCategory === 'CURRENCIES' ? (
            /* Currency Exchange Rates Table */
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-700 tracking-wider">
                  Project Base & Foreign Exchange Rates
                </span>
                <span className="text-xs text-slate-500">Base Currency: USD ($)</span>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-4">Base Currency</th>
                    <th className="py-2.5 px-4">Target Currency</th>
                    <th className="py-2.5 px-4">Exchange Rate (1 Base = X Target)</th>
                    <th className="py-2.5 px-4">Effective Date</th>
                    <th className="py-2.5 px-4">Source / Reference</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {exchangeRates.map((ex) => (
                    <tr key={ex.targetCurrency} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{ex.baseCurrency}</td>
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600">{ex.targetCurrency}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.0001"
                            value={ex.exchangeRate}
                            onChange={(e) =>
                              onUpdateExchangeRate({
                                ...ex,
                                exchangeRate: parseFloat(e.target.value) || 1.0,
                                isUserOverridden: true,
                              })
                            }
                            className="w-28 px-2 py-1 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                          />
                          {ex.isUserOverridden && (
                            <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-1.5 py-0.5 rounded border border-amber-200">
                              OVERRIDDEN
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{ex.effectiveDate}</td>
                      <td className="py-3 px-4 text-slate-600 text-[11px]">{ex.source}</td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-[11px] font-bold text-emerald-600">Active</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : editingItem ? (
            /* Item Edit Form */
            <form onSubmit={handleSaveCurrent} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm max-w-3xl mx-auto space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="text-sm font-black uppercase text-slate-900">
                  {isCreating ? 'Add New Catalog Rate' : `Edit Rate: ${editingItem.name}`}
                </h4>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="text-xs text-slate-500 hover:text-slate-800 font-bold"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={editingItem.category}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value as RateComponentCategory })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-medium"
                  >
                    <option value="MATERIAL">MATERIAL</option>
                    <option value="LABOUR">LABOUR</option>
                    <option value="EQUIPMENT">EQUIPMENT</option>
                    <option value="SUBCONTRACT">SUBCONTRACT</option>
                    <option value="TRANSPORT">TRANSPORT</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Item Code *</label>
                  <input
                    type="text"
                    required
                    value={editingItem.code}
                    onChange={(e) => setEditingItem({ ...editingItem, code: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Resource Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. OPC 53 Grade Cement / Skilled Brick Mason"
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-bold"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Technical Specification / Standard</label>
                  <input
                    type="text"
                    placeholder="e.g. IS 269 / ASTM C150 Type I 50kg Bags"
                    value={editingItem.specification}
                    onChange={(e) => setEditingItem({ ...editingItem, specification: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Measurement Unit *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. bag, m³, man-day, hour, tonne, trip"
                    value={editingItem.unit}
                    onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Base Unit Rate ($ USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editingItem.rate}
                    onChange={(e) => setEditingItem({ ...editingItem, rate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-mono font-bold text-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Supplier / Trade Source</label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Materials Corp"
                    value={editingItem.supplier || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, supplier: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Location / Market Area</label>
                  <input
                    type="text"
                    value={editingItem.location}
                    onChange={(e) => setEditingItem({ ...editingItem, location: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Validity Start Date</label>
                  <input
                    type="date"
                    value={editingItem.validityFrom}
                    onChange={(e) => setEditingItem({ ...editingItem, validityFrom: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Validity Expiry Date</label>
                  <input
                    type="date"
                    value={editingItem.validityTo}
                    onChange={(e) => setEditingItem({ ...editingItem, validityTo: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-sm"
                >
                  Save Rate Item
                </button>
              </div>
            </form>
          ) : (
            /* Items Catalog Grid / Table */
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Code / Category</th>
                    <th className="py-2.5 px-4">Resource Description & Spec</th>
                    <th className="py-2.5 px-4">Unit</th>
                    <th className="py-2.5 px-4">Base Rate</th>
                    <th className="py-2.5 px-4">Supplier / Source</th>
                    <th className="py-2.5 px-4">Validity</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                        No rate database items found matching current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const isExpired = RateAnalysisEngine.isRateExpired(item.validityTo);
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className="font-mono font-bold text-slate-900">{item.code}</span>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                {item.category}
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900">{item.name}</span>
                              <span className="text-[11px] text-slate-500 truncate max-w-sm">
                                {item.specification || 'Standard specification'}
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {item.unit}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-mono font-black text-indigo-700 text-sm">
                              ${item.rate.toFixed(2)}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className="text-slate-800 font-medium">{item.supplier || 'Standard Reference'}</span>
                              <span className="text-[10px] text-slate-400">{item.source}</span>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            {isExpired ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Expired ({item.validityTo})</span>
                              </span>
                            ) : (
                              <span className="text-[11px] font-mono text-slate-600">
                                Until {item.validityTo}
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingItem(item);
                                  setIsCreating(false);
                                }}
                                title="Edit Rate"
                                className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onDuplicateItem(item)}
                                title="Duplicate Rate"
                                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onDeleteItem(item.id)}
                                title="Delete Rate"
                                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Catalog size: {rateDatabase.length} entries loaded across all disciplines</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors"
          >
            Close Catalog
          </button>
        </div>
      </div>
    </div>
  );
};
