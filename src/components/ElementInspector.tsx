import React, { useState } from 'react';
import { 
  Check, 
  HelpCircle, 
  Trash2, 
  Plus, 
  ShieldCheck, 
  RefreshCw, 
  Layers, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Lock
} from 'lucide-react';
import { DetectedElement, BoqItem, DeductionItem, VerificationStatus } from '../types';

interface ElementInspectorProps {
  element: DetectedElement | null;
  onUpdateElement: (updated: DetectedElement) => void;
  onShowMeWhy: (element: DetectedElement) => void;
  boqItems?: BoqItem[];
  currencySymbol?: string;
}

export const ElementInspector: React.FC<ElementInspectorProps> = ({
  element,
  onUpdateElement,
  onShowMeWhy,
  boqItems = [],
  currencySymbol = '$',
}) => {
  const [showAddDeduction, setShowAddDeduction] = useState(false);
  const [newDed, setNewDed] = useState<{ name: string; length: number; width: number; count: number; reason: string }>({
    name: 'Window Opening',
    length: 1.5,
    width: 1.5,
    count: 1,
    reason: 'Standard opening deduction',
  });

  if (!element) {
    return (
      <aside className="w-80 h-full bg-white border-l border-slate-200 p-6 flex flex-col items-center justify-center text-center text-slate-400 select-none shrink-0">
        <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mb-3">
          <Layers className="w-6 h-6 text-slate-400" />
        </div>
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">No Element Selected</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-[220px]">
          Click any element on the blueprint CAD canvas or from the left drawing register.
        </p>
      </aside>
    );
  }

  const handleDimensionChange = (field: keyof typeof element.dimensions, val: number) => {
    const updated: DetectedElement = {
      ...element,
      dimensions: {
        ...element.dimensions,
        [field]: Math.max(0, val),
      },
      status: element.status === 'verified' ? 'user_input' : element.status,
    };
    onUpdateElement(updated);
  };

  const handleStatusChange = (status: VerificationStatus) => {
    onUpdateElement({ ...element, status });
  };

  const handleVerifyAndLock = () => {
    onUpdateElement({ ...element, status: 'verified' });
  };

  const handleAddDeduction = () => {
    const deduction: DeductionItem = {
      id: `DED-${Date.now().toString(36).slice(-4)}`,
      name: newDed.name,
      type: 'opening',
      length: newDed.length,
      width: newDed.width,
      count: newDed.count,
      areaM2: newDed.length * newDed.width * newDed.count,
      reason: newDed.reason,
      isDeductible: true,
    };
    const updated: DetectedElement = {
      ...element,
      deductions: [...(element.deductions || []), deduction],
    };
    onUpdateElement(updated);
    setShowAddDeduction(false);
  };

  const handleRemoveDeduction = (dedId: string) => {
    const updated: DetectedElement = {
      ...element,
      deductions: element.deductions.filter((d) => d.id !== dedId),
    };
    onUpdateElement(updated);
  };

  // Find linked BOQ items
  const linkedBoqs = (boqItems || []).filter(
    (b) => (element.linkedBoqItemIds || []).includes(b.id) || (b.contributingElementIds || []).includes(element.id)
  );

  return (
    <aside className="w-80 h-full bg-white border-l border-slate-200 flex flex-col shrink-0 overflow-hidden select-none text-slate-800">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Takeoff Details</h2>
        <button
          onClick={() => onShowMeWhy(element)}
          className="text-indigo-600 hover:text-indigo-700 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Show Why
        </button>
      </div>

      {/* Main Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
        {/* Element Header Card */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  element.status === 'verified'
                    ? 'bg-emerald-500'
                    : element.status === 'review_required'
                    ? 'bg-amber-500'
                    : 'bg-indigo-500'
                }`}
              />
              <h3 className="text-xs font-bold text-slate-900 uppercase">
                {element.id}: {element.name}
              </h3>
            </div>
            <span className="text-[10px] font-semibold text-slate-500 font-mono">
              Grid {element.gridLocation}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold text-slate-400">Length / Span (m)</label>
              <input
                type="number"
                step="0.01"
                value={element.dimensions.length}
                onChange={(e) => handleDimensionChange('length', parseFloat(e.target.value) || 0)}
                className="w-full border border-slate-200 rounded px-2 py-1.5 text-xs font-mono bg-white text-slate-800 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold text-slate-400">Width (m)</label>
              <input
                type="number"
                step="0.01"
                value={element.dimensions.width}
                onChange={(e) => handleDimensionChange('width', parseFloat(e.target.value) || 0)}
                className="w-full border border-slate-200 rounded px-2 py-1.5 text-xs font-mono bg-white text-slate-800 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold text-slate-400">Depth / Thk (m)</label>
              <input
                type="number"
                step="0.01"
                value={element.dimensions.depthOrThickness}
                onChange={(e) => handleDimensionChange('depthOrThickness', parseFloat(e.target.value) || 0)}
                className="w-full border border-slate-200 rounded px-2 py-1.5 text-xs font-mono bg-white text-slate-800 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold text-slate-400">Count / Quantity (Nr)</label>
              <input
                type="number"
                step="1"
                min="1"
                value={element.dimensions.count}
                onChange={(e) => handleDimensionChange('count', parseInt(e.target.value) || 1)}
                className="w-full border border-slate-200 rounded px-2 py-1.5 text-xs font-mono bg-white text-slate-800 focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Calculation Logic Box */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Calculation Logic
          </h3>
          <div className="p-3 bg-slate-50 rounded-lg space-y-2 font-mono text-[11px] leading-tight border border-slate-100">
            <div className="text-slate-500"># {element.calculation.formula || 'Volume Calculation'}</div>
            <div className="flex justify-between items-center text-slate-800">
              <span>Gross Qty:</span>
              <span className="font-bold text-slate-900">
                {element.calculation.grossQuantity.toFixed(3)} {element.calculation.unit}
              </span>
            </div>
            {element.calculation.deductionsTotal > 0 && (
              <div className="flex justify-between items-center text-rose-600">
                <span>Deductions:</span>
                <span className="font-bold">
                  -{element.calculation.deductionsTotal.toFixed(3)} {element.calculation.unit}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center text-indigo-700 font-bold border-t border-slate-200 pt-1.5">
              <span>Net Takeoff:</span>
              <span className="text-sm font-extrabold">
                {element.calculation.netQuantity.toLocaleString()} {element.calculation.unit}
              </span>
            </div>
            {element.calculation.formworkAreaM2 && element.calculation.formworkAreaM2 > 0 && (
              <div className="text-[10px] text-slate-500 pt-1">
                Formwork / Shuttering: <span className="font-bold text-slate-700">{element.calculation.formworkAreaM2.toFixed(2)} m²</span>
              </div>
            )}
          </div>
        </div>

        {/* Deductions & Openings */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Deductions ({element.deductions?.length || 0})
            </h3>
            <button
              onClick={() => setShowAddDeduction(!showAddDeduction)}
              className="text-[10px] text-indigo-600 hover:text-indigo-700 font-bold uppercase tracking-wider flex items-center gap-0.5"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>

          {showAddDeduction && (
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
              <input
                type="text"
                placeholder="Opening Name (e.g. D1, Cutout)"
                value={newDed.name}
                onChange={(e) => setNewDed({ ...newDed, name: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800"
              />
              <div className="grid grid-cols-3 gap-1.5">
                <div>
                  <label className="text-[9px] text-slate-400">L (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newDed.length}
                    onChange={(e) => setNewDed({ ...newDed, length: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400">W (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newDed.width}
                    onChange={(e) => setNewDed({ ...newDed, width: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400">Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={newDed.count}
                    onChange={(e) => setNewDed({ ...newDed, count: parseInt(e.target.value) || 1 })}
                    className="w-full bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-800 font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-1.5 pt-1">
                <button
                  onClick={() => setShowAddDeduction(false)}
                  className="px-2 py-1 rounded text-[10px] bg-slate-200 text-slate-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddDeduction}
                  className="px-2 py-1 rounded text-[10px] bg-indigo-600 text-white font-medium hover:bg-indigo-500"
                >
                  Apply Deduction
                </button>
              </div>
            </div>
          )}

          {element.deductions && element.deductions.length > 0 ? (
            <div className="space-y-1.5">
              {element.deductions.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100 text-[11px]"
                >
                  <div>
                    <div className="font-semibold text-slate-800">{d.name}</div>
                    <div className="text-[10px] text-slate-400">
                      {d.length}m × {d.width}m ({d.count || 1} Nr)
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-rose-600 font-bold">
                      -{((d.volumeM3 || d.areaM2 || 0) * (d.count || 1)).toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleRemoveDeduction(d.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-200"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 italic">No standard deductions applied.</p>
          )}
        </div>
      </div>

      {/* Bottom BOQ Verification Card (Sleek Dark Accent) */}
      <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0 text-white">
        <div className="flex justify-between items-end mb-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">BOQ Line Item</span>
          <span className="text-[10px] font-bold text-indigo-400 italic">
            {linkedBoqs[0]?.sectionCode || 'Division 04'}
          </span>
        </div>
        <div className="text-[11px] text-white/90 font-medium mb-3 line-clamp-2">
          {linkedBoqs[0]?.description || `${element.name} - ${element.specification?.concreteGrade || 'Standard Specification'}`}
        </div>
        <button
          onClick={handleVerifyAndLock}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-md text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{element.status === 'verified' ? 'Quantity Locked & Verified' : 'Verify and Lock Quantity'}</span>
        </button>
      </div>
    </aside>
  );
};
