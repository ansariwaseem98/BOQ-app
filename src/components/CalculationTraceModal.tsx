/**
 * AI BOQ & Tender Estimation Engineer - Phase 15A Calculation Trace & Provenance Modal
 * Complete mathematical trace inspection: Source -> Inputs -> Validation -> Formula -> Substitution -> Deductions -> Result -> BOQ
 */

import React from 'react';
import { CalculationObject } from '../types/measurementEngine';
import { RoundingEngine } from '../engine/measurementEngine';
import {
  FileText,
  Calculator,
  Layers,
  ArrowDown,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  X,
  History,
  Tag,
  Maximize2,
} from 'lucide-react';

interface CalculationTraceModalProps {
  isOpen: boolean;
  onClose: () => void;
  calculation: CalculationObject;
  onOpenEdit?: () => void;
  onViewDrawing?: (drawingNumber: string, page?: number) => void;
}

export const CalculationTraceModal: React.FC<CalculationTraceModalProps> = ({
  isOpen,
  onClose,
  calculation,
  onOpenEdit,
  onViewDrawing,
}) => {
  if (!isOpen || !calculation) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-850 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                  {calculation.calculationId}
                </span>
                <span className="text-xs text-slate-400 font-mono">Rev {calculation.revision}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    calculation.status === 'VERIFIED'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : calculation.status === 'CONFLICT'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : calculation.status === 'MISSING_INPUT'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                  }`}
                >
                  {calculation.status}
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-100 mt-0.5">[VIEW CALCULATION TRACE] — {calculation.description}</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Execution Pipeline */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* STEP 1: SOURCE PROVENANCE */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-400 font-mono text-xs font-bold flex items-center justify-center border border-indigo-500/40">
                  1
                </span>
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Source Provenance & Drawing Region
                </span>
              </div>
              {onViewDrawing && (
                <button
                  type="button"
                  onClick={() => onViewDrawing(calculation.drawingId)}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 underline flex items-center gap-1"
                >
                  <Maximize2 className="w-3 h-3" />
                  [INSPECT DRAWING REGION]
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
              <div>
                <span className="text-slate-500 block">Drawing File:</span>
                <span className="font-semibold text-slate-200">{calculation.drawingId || 'A-101'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Discipline:</span>
                <span className="font-semibold text-slate-200">{calculation.category}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Element Identifier:</span>
                <span className="font-semibold text-slate-200">{calculation.elementId}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Source Extraction Type:</span>
                <span className="font-semibold text-slate-200">{calculation.inputs[0]?.source || 'EXPLICIT_CAD'}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <ArrowDown className="w-4 h-4 text-slate-600" />
          </div>

          {/* STEP 2: EXTRACTED INPUTS */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-400 font-mono text-xs font-bold flex items-center justify-center border border-indigo-500/40">
                2
              </span>
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Inputs & Normalized Dimensions
              </span>
            </div>

            <div className="space-y-2">
              {calculation.inputs.map((inp) => (
                <div
                  key={inp.inputId}
                  className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">{inp.name}</span>
                      <span className="font-mono text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded">
                        Raw: {String(inp.originalValue)} {inp.originalUnit}
                      </span>
                      {inp.status === 'USER_CORRECTED' && (
                        <span className="text-[9px] font-bold text-indigo-400 bg-indigo-950 px-1.5 py-0.2 rounded border border-indigo-800">
                          USER VERIFIED
                        </span>
                      )}
                    </div>
                    {inp.description && <p className="text-[11px] text-slate-400 mt-0.5">{inp.description}</p>}
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-sm font-bold text-emerald-400">
                      {inp.normalizedValue !== undefined && !isNaN(inp.normalizedValue)
                        ? inp.normalizedValue.toFixed(3)
                        : 'UNKNOWN'}{' '}
                      {inp.normalizedUnit}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Confidence: {inp.confidence}</span>
                  </div>
                </div>
              ))}

              {calculation.instances > 1 && (
                <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-200">Repeated Instances</span>
                    <span className="text-[10px] text-slate-400 block">Source: {calculation.instanceSource}</span>
                  </div>
                  <span className="font-mono text-sm font-bold text-indigo-400">{calculation.instances} nos</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-center">
            <ArrowDown className="w-4 h-4 text-slate-600" />
          </div>

          {/* STEP 3: FORMULA & SUBSTITUTION */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-400 font-mono text-xs font-bold flex items-center justify-center border border-indigo-500/40">
                3
              </span>
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Formula Execution & Parameter Substitution
              </span>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Algebraic Formula ({calculation.formulaVersion}):</span>
                <code className="font-mono text-indigo-300 font-bold">{calculation.formula}</code>
              </div>

              <div className="text-xs">
                <span className="text-slate-400 block mb-1">Parameter Substitution:</span>
                <code className="font-mono text-emerald-400 font-bold bg-slate-950 px-3 py-2 rounded border border-slate-800 block text-sm">
                  {calculation.substitution}
                </code>
              </div>
            </div>
          </div>

          {/* STEP 4: DEDUCTIONS (IF ANY) */}
          {calculation.deductions && calculation.deductions.length > 0 && (
            <>
              <div className="flex justify-center">
                <ArrowDown className="w-4 h-4 text-slate-600" />
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-rose-600/30 text-rose-400 font-mono text-xs font-bold flex items-center justify-center border border-rose-500/40">
                    4
                  </span>
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Opening Deductions & Cutouts
                  </span>
                </div>

                <div className="space-y-2">
                  {calculation.deductions.map((ded) => (
                    <div
                      key={ded.deductionId}
                      className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-200">{ded.name}</span>
                        <span className="text-[10px] font-mono text-slate-400 block">{ded.substitution || ded.formula}</span>
                      </div>
                      <span className="font-mono font-bold text-rose-400 text-sm">
                        -{ded.grossDeduction.toFixed(4)} {ded.unit}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center text-xs font-bold text-slate-300 pt-2 border-t border-slate-800">
                    <span>Total Deductions:</span>
                    <span className="font-mono text-rose-400">-{calculation.totalDeduction.toFixed(4)} {calculation.unit}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex justify-center">
            <ArrowDown className="w-4 h-4 text-slate-600" />
          </div>

          {/* STEP 5: FINAL RESULT & BOQ MAPPING */}
          <div className="bg-slate-950/90 border border-emerald-900/60 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600/30 text-emerald-400 font-mono text-xs font-bold flex items-center justify-center border border-emerald-500/40">
                  5
                </span>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Final Verified Result & BOQ Aggregation
                </span>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Rounding Rule: {calculation.roundingRule}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900 p-3.5 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-400 block">Gross Calculated Volume/Area</span>
                <div className="text-lg font-mono font-bold text-slate-200 mt-1">
                  {calculation.grossResult.toFixed(4)} {calculation.unit}
                </div>
              </div>

              <div className="bg-slate-900 p-3.5 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-400 block">Internal Raw Result (Full Precision)</span>
                <div className="text-lg font-mono font-bold text-slate-200 mt-1">
                  {calculation.rawResult.toFixed(6)} {calculation.unit}
                </div>
              </div>

              <div className="bg-emerald-950/40 p-3.5 rounded-lg border border-emerald-600/40">
                <span className="text-xs text-emerald-400 font-bold block">Final Displayed BOQ Quantity</span>
                <div className="text-2xl font-mono font-black text-emerald-300 mt-1">
                  {RoundingEngine.formatDisplay(calculation.displayedResult, calculation.roundingRule)} {calculation.unit}
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-400" />
                <span className="text-slate-300">Mapped BOQ Item: <strong>{calculation.boqItemId}</strong> ({calculation.itemCode})</span>
              </div>
              <span className="text-emerald-400 font-bold">Ready for Tender Schedule</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-850 border-t border-slate-700 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          >
            Close Trace
          </button>

          {onOpenEdit && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenEdit();
              }}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md transition-all flex items-center gap-2"
            >
              <Calculator className="w-4 h-4" />
              <span>[EDIT & RECALCULATE INPUTS]</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
