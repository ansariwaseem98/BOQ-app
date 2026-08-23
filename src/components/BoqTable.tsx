import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Search, 
  Filter, 
  Plus, 
  ShieldCheck, 
  Edit3, 
  DollarSign, 
  Layers, 
  TrendingUp, 
  Sliders, 
  CheckCircle2, 
  Trash2,
  Check,
  X,
  Coins
} from 'lucide-react';
import { BoqItem, ProjectRecord, DetectedElement } from '../types';

interface BoqTableProps {
  boqItems?: BoqItem[];
  elements?: DetectedElement[];
  projectData?: ProjectRecord | any | null;
  onUpdateBoqItem?: (updated: BoqItem) => void;
  onAddBoqItem?: (item: BoqItem) => void;
  onDeleteBoqItem?: (id: string) => void;
  onShowMeWhyBoq?: (item: BoqItem) => void;
  onTriggerShowMeWhy?: (item: BoqItem) => void;
  onSelectElement?: (elementId: string) => void;
  onExportExcel?: () => void;
}

export const BoqTable: React.FC<BoqTableProps> = ({
  boqItems = [],
  elements = [],
  projectData = null,
  onUpdateBoqItem,
  onAddBoqItem,
  onDeleteBoqItem,
  onShowMeWhyBoq,
  onTriggerShowMeWhy,
  onSelectElement,
  onExportExcel,
}) => {
  const currency = projectData?.tender?.currencySymbol || projectData?.contract?.currencySymbol || '$';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('All');
  const [editingRateItem, setEditingRateItem] = useState<BoqItem | null>(null);

  const handleShowWhy = onShowMeWhyBoq || onTriggerShowMeWhy;

  // Filter sections
  const sections = ['All', ...Array.from(new Set(boqItems.map((b) => b.sectionCode)))];

  const filteredItems = boqItems.filter((item) => {
    const matchesSearch =
      item.itemNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.specificationReference || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSection =
      selectedSection === 'All' || item.sectionCode === selectedSection;
    return matchesSearch && matchesSection;
  });

  const totalFilteredAmount = filteredItems.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
  const grandTotalAmount = boqItems.reduce((sum, item) => sum + (item.totalAmount || 0), 0);

  const handleRateBreakdownUpdate = (
    field: keyof BoqItem['rateBreakdown'],
    value: number
  ) => {
    if (!editingRateItem) return;

    const breakdown = {
      ...editingRateItem.rateBreakdown,
      [field]: Math.max(0, value),
    };

    const directCost =
      breakdown.materialCost +
      breakdown.laborCost +
      breakdown.plantCost +
      breakdown.subcontractCost;
    const wastage = directCost * (breakdown.wastagePercent / 100);
    const primeCost = directCost + wastage;
    const overhead = primeCost * (breakdown.overheadPercent / 100);
    const profit = (primeCost + overhead) * (breakdown.profitPercent / 100);
    const unitRate = Number((primeCost + overhead + profit).toFixed(2));
    const totalAmount = Number((unitRate * editingRateItem.quantity).toFixed(2));

    const updatedItem: BoqItem = {
      ...editingRateItem,
      rateBreakdown: {
        ...breakdown,
        wastageAmount: Number(wastage.toFixed(2)),
        primeCost: Number(primeCost.toFixed(2)),
        overheadAmount: Number(overhead.toFixed(2)),
        profitAmount: Number(profit.toFixed(2)),
        unitRate,
      },
      unitRate,
      totalAmount,
    };

    setEditingRateItem(updatedItem);
    if (onUpdateBoqItem) {
      onUpdateBoqItem(updatedItem);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8FAFC] text-slate-800 select-none overflow-hidden">
      {/* Top Header & Metrics Bar */}
      <div className="bg-white border-b border-slate-200 p-4 shrink-0 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Bill of Quantities (BOQ Schedule)</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600 border border-slate-200">
                  {boqItems.length} Line Items
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                100% Deterministic link between CAD 3D elements and pricing build-ups
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-indigo-50/70 border border-indigo-100 rounded-lg px-3 py-1.5">
              <span className="text-xs font-semibold text-slate-500">Grand Total:</span>
              <span className="font-mono text-sm font-black text-indigo-700">
                {currency}{grandTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {onExportExcel && (
              <button
                onClick={onExportExcel}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Multi-Tab Excel</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter / Search Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search BOQ item code, description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
              />
            </div>

            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:outline-hidden focus:border-indigo-500 truncate"
            >
              {sections.map((s) => (
                <option key={s} value={s}>
                  {s === 'All' ? 'All Trade Divisions' : `Division: ${s}`}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing {filteredItems.length} items • Subtotal: <strong className="text-slate-900 font-mono">{currency}{totalFilteredAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
          </div>
        </div>
      </div>

      {/* BOQ Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-3">Item No.</th>
              <th className="py-2.5 px-3">Description & Scope</th>
              <th className="py-2.5 px-3">Spec Ref</th>
              <th className="py-2.5 px-3 text-right">Quantity</th>
              <th className="py-2.5 px-2 text-center">Unit</th>
              <th className="py-2.5 px-3 text-right">Unit Rate</th>
              <th className="py-2.5 px-3 text-right">Total Amount ({currency})</th>
              <th className="py-2.5 px-3 text-center">Rate Breakdown</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-normal">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  No BOQ items match the query.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-indigo-700 whitespace-nowrap">
                    {item.itemNumber}
                  </td>
                  <td className="py-2.5 px-3">
                    <p className="font-semibold text-slate-900">{item.description}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{item.remarks}</p>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                    {item.specificationReference || '-'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                    {item.quantity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono text-slate-600">
                    {item.unit}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                    {item.unitRate.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">
                    {item.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => setEditingRateItem(item)}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors flex items-center gap-1 mx-auto"
                    >
                      <Sliders className="w-3 h-3 text-indigo-600" />
                      <span>Build-up</span>
                    </button>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {handleShowWhy && (
                        <button
                          onClick={() => handleShowWhy(item)}
                          className="px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold transition-colors flex items-center gap-1"
                          title="Show calculation formula and takeoff sources"
                        >
                          <ShieldCheck className="w-3 h-3" />
                          <span>Audit</span>
                        </button>
                      )}
                      {onDeleteBoqItem && (
                        <button
                          onClick={() => onDeleteBoqItem(item.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Rate Breakdown Modal */}
      {editingRateItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden text-slate-800">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Rate Build-up Analysis: {editingRateItem.itemNumber}
                </h3>
                <p className="text-xs text-slate-500">{editingRateItem.description}</p>
              </div>
              <button
                onClick={() => setEditingRateItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 font-medium block mb-1">Material Cost ({currency})</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingRateItem.rateBreakdown.materialCost}
                    onChange={(e) => handleRateBreakdownUpdate('materialCost', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-mono text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-slate-500 font-medium block mb-1">Labor Cost ({currency})</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingRateItem.rateBreakdown.laborCost}
                    onChange={(e) => handleRateBreakdownUpdate('laborCost', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-mono text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-slate-500 font-medium block mb-1">Plant & Equip ({currency})</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingRateItem.rateBreakdown.plantCost}
                    onChange={(e) => handleRateBreakdownUpdate('plantCost', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-mono text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-slate-500 font-medium block mb-1">Subcontract ({currency})</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingRateItem.rateBreakdown.subcontractCost}
                    onChange={(e) => handleRateBreakdownUpdate('subcontractCost', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-mono text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-slate-500 font-medium block mb-1">Wastage (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editingRateItem.rateBreakdown.wastagePercent}
                    onChange={(e) => handleRateBreakdownUpdate('wastagePercent', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-mono text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-slate-500 font-medium block mb-1">Overhead (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editingRateItem.rateBreakdown.overheadPercent}
                    onChange={(e) => handleRateBreakdownUpdate('overheadPercent', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-mono text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-slate-500 font-medium block mb-1">Profit (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editingRateItem.rateBreakdown.profitPercent}
                    onChange={(e) => handleRateBreakdownUpdate('profitPercent', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-mono text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div className="bg-emerald-50 p-2.5 rounded-md border border-emerald-200 flex flex-col justify-center">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase">Computed Unit Rate</span>
                  <span className="font-mono text-base font-extrabold text-emerald-700">
                    {currency}{editingRateItem.unitRate.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-600">
                  Quantity: <strong>{editingRateItem.quantity.toLocaleString()} {editingRateItem.unit}</strong> × Rate: <strong>{currency}{editingRateItem.unitRate.toFixed(2)}</strong>
                </span>
                <span className="font-mono text-sm font-extrabold text-slate-900">
                  Total: {currency}{editingRateItem.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setEditingRateItem(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
