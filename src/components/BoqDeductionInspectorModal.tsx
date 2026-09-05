import React from 'react';
import {
  Calculator,
  MinusCircle,
  PlusCircle,
  Layers,
  MapPin,
  FileCheck,
  X,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Boxes
} from 'lucide-react';
import { BOQItemObject } from '../types/boqAssemblyTypes';

interface BoqDeductionInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: BOQItemObject | null;
}

export const BoqDeductionInspectorModal: React.FC<BoqDeductionInspectorModalProps> = ({
  isOpen,
  onClose,
  item
}) => {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl my-6 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-700/60 rounded-xl border border-indigo-500/40">
              <Calculator className="w-6 h-6 text-indigo-200" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Phase 15F — Calculation & Deduction Inspector</h2>
              <p className="text-xs text-indigo-200 mt-0.5 font-medium">
                Complete Mathematical Provenance for Item: {item.itemCode} ({item.description.slice(0, 45)}...)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-indigo-200 hover:text-white hover:bg-indigo-800/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          {/* Summary Math Card */}
          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Formula & Math Derivation
              </span>
              <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                Calculation ID: {item.calculationId}
              </span>
            </div>

            <div className="p-3 bg-slate-900 text-emerald-300 font-mono text-xs rounded-lg overflow-x-auto border border-slate-800">
              {item.formula}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200 text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block mb-1">
                  1. Gross Quantity
                </span>
                <span className="text-lg font-mono font-bold text-blue-950">
                  {item.grossQuantity ? item.grossQuantity.toLocaleString() : item.quantity.toLocaleString()} {item.unit}
                </span>
              </div>

              <div className="p-3 bg-rose-50/60 rounded-lg border border-rose-200 text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 block mb-1">
                  2. Total Deductions
                </span>
                <span className="text-lg font-mono font-bold text-rose-950">
                  -{(item.deductionsTotal || 0).toLocaleString()} {item.unit}
                </span>
              </div>

              <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-200 text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
                  3. Net BOQ Quantity
                </span>
                <span className="text-lg font-mono font-bold text-emerald-950">
                  {item.quantity.toLocaleString()} {item.unit}
                </span>
              </div>
            </div>
          </div>

          {/* Itemized Deductions List */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <MinusCircle className="w-4 h-4 text-rose-600" />
                Itemized Deduction Records ({item.deductions?.length || 0})
              </h4>
              <span className="text-[11px] text-slate-500 font-medium">IS 1200 / POMI Standard Compliant</span>
            </div>

            {!item.deductions || item.deductions.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No opening deductions applicable for this solid continuous element.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-bold uppercase text-[11px]">
                      <th className="py-2.5 px-4">Deduction Type</th>
                      <th className="py-2.5 px-4">Opening Ref / Description</th>
                      <th className="py-2.5 px-4 text-center">Count (Nos)</th>
                      <th className="py-2.5 px-4 text-right">Dimensions (L × W × H)</th>
                      <th className="py-2.5 px-4 text-right">Deducted Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {item.deductions.map(d => (
                      <tr key={d.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-slate-800">{d.type}</td>
                        <td className="py-3 px-4 text-slate-700">{d.description}</td>
                        <td className="py-3 px-4 text-center font-mono font-semibold">{d.count}</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-600">
                          {d.dimensions.length}m × {d.dimensions.width}m {d.dimensions.height ? `× ${d.dimensions.height}m` : ''}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-rose-700">
                          -{d.quantity} {item.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Source Provenance & Traceability Chain */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-600" />
              Complete Chain of Traceability
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase">1. Primary Drawing:</span>
                <span className="font-mono font-bold text-slate-900">{item.sourceDrawing}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase">2. Source Region:</span>
                <span className="font-medium text-slate-800">{item.sourceRegion}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase">3. Drawing Revision:</span>
                <span className="font-semibold text-indigo-700">{item.revision}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase">4. Verification Status:</span>
                <span className="font-bold text-emerald-700">{item.status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Mathematical Integrity Rule: Net Quantity = Gross Quantity - Openings/Voids
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
