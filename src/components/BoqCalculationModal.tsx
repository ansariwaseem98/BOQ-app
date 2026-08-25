import React from 'react';
import { X, Calculator, ShieldCheck, FileText, CheckCircle2, Layers, Tag } from 'lucide-react';
import { UnifiedBoqItem } from '../types';

interface BoqCalculationModalProps {
  item: UnifiedBoqItem;
  onClose: () => void;
}

export const BoqCalculationModal: React.FC<BoqCalculationModalProps> = ({ item, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-indigo-300 font-bold tracking-wider">{item.itemCode}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">{item.discipline}</span>
              </div>
              <h3 className="text-base font-semibold text-white truncate max-w-md">{item.description}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Main Metric Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Gross Quantity</div>
              <div className="text-xl font-bold font-mono text-slate-800 mt-1">
                {item.grossQuantity.toLocaleString()} <span className="text-sm font-normal text-slate-500">{item.unit}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Deductions</div>
              <div className="text-xl font-bold font-mono text-amber-600 mt-1">
                {item.deductionsTotal > 0 ? `-${item.deductionsTotal.toLocaleString()}` : '0.00'}{' '}
                <span className="text-sm font-normal text-slate-500">{item.unit}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-indigo-50/50 border border-indigo-200">
              <div className="text-xs text-indigo-700 font-medium uppercase tracking-wider">Final Net Quantity</div>
              <div className="text-xl font-bold font-mono text-indigo-700 mt-1">
                {item.finalQuantity.toLocaleString()} <span className="text-sm font-normal text-indigo-500">{item.unit}</span>
              </div>
            </div>
          </div>

          {/* Mathematical Derivation Box */}
          <div className="p-4 rounded-lg bg-slate-900 text-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>DERIVATION FORMULA</span>
              <span className="text-indigo-400 font-semibold">{item.sourceModule}</span>
            </div>
            <div className="font-mono text-sm text-indigo-300 font-semibold">{item.formula}</div>
            <div className="font-mono text-xs text-emerald-400 bg-slate-800 p-2.5 rounded-md border border-slate-700 break-all">
              {item.expressionWithValues}
            </div>
          </div>

          {/* Deductions Breakdown Table if exists */}
          {item.deductionsList && item.deductionsList.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-slate-500" />
                Itemized Void / Opening Deductions
              </h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Opening Mark</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">Formula / Dimensions</th>
                      <th className="py-2 px-3 text-right">Deduction</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {item.deductionsList.map((ded, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 font-semibold text-slate-800">{ded.openingMark || 'VOID'}</td>
                        <td className="py-2 px-3 text-slate-600">{ded.openingType}</td>
                        <td className="py-2 px-3 text-slate-500">{ded.formula}</td>
                        <td className="py-2 px-3 text-right text-amber-600 font-bold">
                          -{ded.deductionQuantity.toFixed(2)} {ded.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Source Provenance */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-500" />
              Source Drawing & Takeoff Reference
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Drawing Ref</span>
                <span className="font-semibold text-slate-800">{item.primaryDrawingNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Revision</span>
                <span className="font-semibold text-slate-800">{item.revision}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Source Takeoff ID</span>
                <span className="font-mono text-indigo-600 font-semibold">{item.takeoffSourceId}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Verification Status</span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {item.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Close Calculation
          </button>
        </div>
      </div>
    </div>
  );
};
