import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Sliders,
  Search,
  Filter,
  Layers,
  ArrowUpDown,
  Download,
  Info,
  ExternalLink,
  Eye,
  FileCheck,
  RotateCcw
} from 'lucide-react';
import {
  QuantityComparisonItem,
  ValidationToleranceSettings,
  UnifiedBoqItem,
} from '../types';
import {
  EndToEndValidationEngine,
  DEFAULT_TOLERANCE_SETTINGS,
} from '../engine/endToEndValidationSuite';

interface TakeoffValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  boqItems?: UnifiedBoqItem[];
  onInspectCalculation?: (item: UnifiedBoqItem) => void;
  onInspectDrawing?: (drawingNumber: string) => void;
}

export const TakeoffValidationModal: React.FC<TakeoffValidationModalProps> = ({
  isOpen,
  onClose,
  boqItems,
  onInspectCalculation,
  onInspectDrawing,
}) => {
  const [tolerances, setTolerances] = useState<ValidationToleranceSettings>(DEFAULT_TOLERANCE_SETTINGS);
  const [showToleranceSettings, setShowToleranceSettings] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PASS' | 'REVIEW' | 'FAIL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemForDetails, setSelectedItemForDetails] = useState<QuantityComparisonItem | null>(null);

  if (!isOpen) return null;

  const comparisonData = EndToEndValidationEngine.getValidationComparisonData(tolerances, boqItems);

  // Filter items
  const filteredItems = comparisonData.filter((item) => {
    if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.itemCode.toLowerCase().includes(q) ||
        item.elementName.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.sourceDrawing.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const passCount = comparisonData.filter((i) => i.status === 'PASS').length;
  const reviewCount = comparisonData.filter((i) => i.status === 'REVIEW').length;
  const failCount = comparisonData.filter((i) => i.status === 'FAIL').length;
  const totalCount = comparisonData.length;
  const passRate = totalCount > 0 ? Math.round((passCount / totalCount) * 100) : 0;

  const categories = Array.from(new Set(comparisonData.map((i) => i.category)));

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'Item Code',
      'Category',
      'Element Description',
      'Calculated Qty',
      'Reference Qty',
      'Unit',
      'Difference',
      'Difference %',
      'Tolerance',
      'Status',
      'Source Drawing',
      'Formula / Notes',
    ];
    const rows = comparisonData.map((i) => [
      `"${i.itemCode}"`,
      `"${i.category}"`,
      `"${i.elementName.replace(/"/g, '""')}"`,
      i.calculatedQuantity,
      i.referenceQuantity,
      `"${i.unit}"`,
      i.difference,
      `${i.differencePercent}%`,
      `"${i.toleranceApplied}"`,
      `"${i.status}"`,
      `"${i.sourceDrawing}"`,
      `"${(i.investigationReason || i.formulaUsed).replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Takeoff_Validation_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Takeoff Validation & Comparison Dashboard</h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                  PHASE 10 TEST HARNESS
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Independent validation comparing drawing-calculated quantities against verified manual reference baselines.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowToleranceSettings(!showToleranceSettings)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                showToleranceSettings
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Tolerance Settings</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tolerance Settings Panel (Collapsible) */}
        {showToleranceSettings && (
          <div className="px-6 py-3.5 bg-indigo-50/70 border-b border-indigo-100 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-700" />
                <span className="text-xs font-bold text-indigo-900">Project Validation Tolerances (Analytical Filters Only)</span>
              </div>
              <button
                onClick={() => setTolerances(DEFAULT_TOLERANCE_SETTINGS)}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Defaults
              </button>
            </div>
            <p className="text-[11px] text-indigo-800/80 mb-3">
              Note: Changing validation tolerances alters warning thresholds for QA analysis. It does NOT alter actual calculated quantities.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">RCC Concrete</label>
                <div className="flex items-center bg-white border border-slate-300 rounded px-2 py-1">
                  <span className="text-xs text-slate-400 mr-1">±</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={tolerances.rccTolerancePercent}
                    onChange={(e) => setTolerances({ ...tolerances, rccTolerancePercent: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs font-bold text-slate-800 focus:outline-hidden"
                  />
                  <span className="text-xs text-slate-500">%</span>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Rebar & BBS</label>
                <div className="flex items-center bg-white border border-slate-300 rounded px-2 py-1">
                  <span className="text-xs text-slate-400 mr-1">±</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={tolerances.rebarTolerancePercent}
                    onChange={(e) => setTolerances({ ...tolerances, rebarTolerancePercent: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs font-bold text-slate-800 focus:outline-hidden"
                  />
                  <span className="text-xs text-slate-500">%</span>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Structural Steel</label>
                <div className="flex items-center bg-white border border-slate-300 rounded px-2 py-1">
                  <span className="text-xs text-slate-400 mr-1">±</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={tolerances.steelTolerancePercent}
                    onChange={(e) => setTolerances({ ...tolerances, steelTolerancePercent: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs font-bold text-slate-800 focus:outline-hidden"
                  />
                  <span className="text-xs text-slate-500">%</span>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Architectural</label>
                <div className="flex items-center bg-white border border-slate-300 rounded px-2 py-1">
                  <span className="text-xs text-slate-400 mr-1">±</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={tolerances.architecturalTolerancePercent}
                    onChange={(e) => setTolerances({ ...tolerances, architecturalTolerancePercent: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs font-bold text-slate-800 focus:outline-hidden"
                  />
                  <span className="text-xs text-slate-500">%</span>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">MEP Systems</label>
                <div className="flex items-center bg-white border border-slate-300 rounded px-2 py-1">
                  <span className="text-xs text-slate-400 mr-1">±</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={tolerances.mepTolerancePercent}
                    onChange={(e) => setTolerances({ ...tolerances, mepTolerancePercent: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs font-bold text-slate-800 focus:outline-hidden"
                  />
                  <span className="text-xs text-slate-500">%</span>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Abs. Tolerance</label>
                <div className="flex items-center bg-white border border-slate-300 rounded px-2 py-1">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={tolerances.allowAbsoluteTolerance}
                    onChange={(e) => setTolerances({ ...tolerances, allowAbsoluteTolerance: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs font-bold text-slate-800 focus:outline-hidden"
                  />
                  <span className="text-xs text-slate-500">unit</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Summary Metrics Strip */}
        <div className="px-6 py-3 bg-slate-100/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600">Total Validated:</span>
              <span className="text-sm font-bold text-slate-900">{totalCount} items</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-medium text-slate-600">Pass:</span>
              <span className="text-sm font-bold text-emerald-700">{passCount} ({passRate}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="text-xs font-medium text-slate-600">Review Required:</span>
              <span className="text-sm font-bold text-amber-700">{reviewCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span className="text-xs font-medium text-slate-600">Fail / Mismatch:</span>
              <span className="text-sm font-bold text-rose-700">{failCount}</span>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search item, code, drawing..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs w-56 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden"
            >
              <option value="ALL">All Disciplines</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden"
            >
              <option value="ALL">All Statuses</option>
              <option value="PASS">PASS Only</option>
              <option value="REVIEW">REVIEW Only</option>
              <option value="FAIL">FAIL Only</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Item Code</th>
                  <th className="py-2.5 px-3">Discipline</th>
                  <th className="py-2.5 px-4">Element Description</th>
                  <th className="py-2.5 px-3 text-right">Calculated Qty</th>
                  <th className="py-2.5 px-3 text-right">Reference Qty</th>
                  <th className="py-2.5 px-2">Unit</th>
                  <th className="py-2.5 px-3 text-right">Diff (% Delta)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3">Drawing</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400 italic">
                      No validation comparison items match the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const isMismatched = item.status !== 'PASS';
                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isMismatched ? 'bg-amber-50/30' : ''
                        }`}
                      >
                        <td className="py-2 px-3 font-mono font-bold text-indigo-700 whitespace-nowrap">
                          {item.itemCode}
                        </td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-2 px-4 font-medium text-slate-900 max-w-xs truncate" title={item.elementName}>
                          {item.elementName}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          {item.calculatedQuantity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-600">
                          {item.referenceQuantity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-2 text-slate-500 font-medium whitespace-nowrap">
                          {item.unit}
                        </td>
                        <td className="py-2 px-3 text-right whitespace-nowrap">
                          <span
                            className={`font-mono font-bold ${
                              item.difference === 0
                                ? 'text-emerald-700'
                                : item.status === 'REVIEW'
                                ? 'text-amber-700'
                                : 'text-rose-700'
                            }`}
                          >
                            {item.difference > 0 ? `+${item.difference}` : item.difference}{' '}
                            <span className="text-[10px] text-slate-500">
                              ({item.differencePercent > 0 ? `+${item.differencePercent}%` : `${item.differencePercent}%`})
                            </span>
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center whitespace-nowrap">
                          {item.status === 'PASS' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3" />
                              PASS
                            </span>
                          )}
                          {item.status === 'REVIEW' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              <AlertTriangle className="w-3 h-3" />
                              REVIEW
                            </span>
                          )}
                          {item.status === 'FAIL' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              <AlertOctagon className="w-3 h-3" />
                              FAIL
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                          {item.sourceDrawing} ({item.revision})
                        </td>
                        <td className="py-2 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setSelectedItemForDetails(item)}
                              title="Inspect root cause & details"
                              className="p-1 rounded text-slate-500 hover:text-indigo-600 hover:bg-slate-100"
                            >
                              <Info className="w-4 h-4" />
                            </button>
                            {onInspectDrawing && (
                              <button
                                onClick={() => onInspectDrawing(item.sourceDrawing)}
                                title="Open source drawing preview"
                                className="p-1 rounded text-slate-500 hover:text-indigo-600 hover:bg-slate-100"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Item Detail / Root Cause Drawer */}
        {selectedItemForDetails && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 shrink-0 flex items-start justify-between gap-4 animate-in fade-in duration-100">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                  {selectedItemForDetails.itemCode}
                </span>
                <h4 className="text-xs font-bold text-slate-900">{selectedItemForDetails.elementName}</h4>
                <span className="text-xs text-slate-500">| Tolerance: {selectedItemForDetails.toleranceApplied}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-700">
                <div className="bg-white p-2.5 rounded border border-slate-200">
                  <span className="font-bold text-[10px] uppercase text-slate-500 block mb-0.5">Formula & Derivation:</span>
                  <code className="font-mono text-[11px] text-slate-800">{selectedItemForDetails.formulaUsed}</code>
                </div>
                <div className="bg-white p-2.5 rounded border border-slate-200">
                  <span className="font-bold text-[10px] uppercase text-slate-500 block mb-0.5">Validation Diagnosis:</span>
                  <p className="text-[11px] text-slate-800">
                    {selectedItemForDetails.investigationReason || 'Calculated quantity matches ground-truth reference within tolerance limit. Mathematical lineage verified.'}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedItemForDetails(null)}
              className="p-1 rounded text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Critical Accuracy Rule: Mismatches are never hidden; root causes are surfaced for verification.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
          >
            Close Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
