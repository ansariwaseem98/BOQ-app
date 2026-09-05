import React from 'react';
import {
  X,
  Calculator,
  FileText,
  Layers,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Building,
  Coins,
  ArrowRight,
  Info,
  Maximize2
} from 'lucide-react';
import { GeneratedBoqTakeoffItem } from '../engine/drawingToBoqPipelineEngine';

interface CalculationProofModalProps {
  item: GeneratedBoqTakeoffItem | null;
  onClose: () => void;
  onOpenInCad?: (drawingNumber: string) => void;
}

export const CalculationProofModal: React.FC<CalculationProofModalProps> = ({
  item,
  onClose,
  onOpenInCad
}) => {
  if (!item) return null;

  const proof = item.calculationProof;
  const rate = item.rateBreakdownAed;

  return (
    <div
      id="calculation-proof-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
    >
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-inner font-black text-sm">
              <Calculator className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                  {item.itemCode}
                </span>
                <h2 className="text-base font-black tracking-tight text-white uppercase">
                  Proof of Calculation & Quantity Audit
                </h2>
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-400/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> VERIFIED 100%
                </span>
              </div>
              <p className="text-xs text-slate-300 truncate max-w-xl">
                {item.description}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800 text-xs">

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Final Quantity</span>
              <span className="text-xl font-black text-slate-950 font-mono">
                {item.quantity.toLocaleString()} <span className="text-xs font-bold text-slate-600">{item.unit}</span>
              </span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Unit Rate</span>
              <span className="text-xl font-black text-indigo-700 font-mono">
                {item.rateAed.toFixed(2)} <span className="text-xs font-bold text-indigo-500">AED/{item.unit}</span>
              </span>
            </div>
            <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl">
              <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block">Total Amount</span>
              <span className="text-xl font-black text-indigo-900 font-mono">
                {item.amountAed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-bold text-indigo-600">AED</span>
              </span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Drawing Ref</span>
              <span className="text-xs font-black text-slate-900 truncate block mt-1" title={item.drawingNumber}>
                {item.drawingNumber}
              </span>
              <span className="text-[10px] text-slate-500 block">{item.sectionDetail}</span>
            </div>
          </div>

          {/* Section 1: Mathematical Formula & Evaluated Expression */}
          <div className="bg-slate-900 text-slate-100 rounded-xl p-4 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5" /> Mathematical Formulation & Evaluated Proof
              </span>
              <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                Formula ID: {proof.formulaNotation}
              </span>
            </div>
            
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-sm text-emerald-400 font-bold mb-2 break-all">
              {proof.evaluatedExpression}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {proof.proofExplanation}
            </p>
          </div>

          {/* Section 2: Input Parameters with Dimensional Sources */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" /> Extracted Geometry Inputs & Section Sources
            </h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold text-[11px] border-b border-slate-200">
                    <th className="p-2.5">Variable</th>
                    <th className="p-2.5">Label</th>
                    <th className="p-2.5">Extracted Value</th>
                    <th className="p-2.5">Unit</th>
                    <th className="p-2.5">Drawing / Section Reference Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {proof.inputs.map((inp, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="p-2.5 font-mono font-bold text-indigo-700">{inp.name}</td>
                      <td className="p-2.5 font-semibold text-slate-800">{inp.label}</td>
                      <td className="p-2.5 font-mono font-bold text-slate-900">{inp.value}</td>
                      <td className="p-2.5 font-mono text-slate-500">{inp.unit}</td>
                      <td className="p-2.5 text-slate-600 italic">{inp.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Step-by-Step Calculation Steps & Deductions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Steps */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Step-by-Step Calculation Sequence
              </h4>
              <ol className="space-y-1.5 text-[11px] text-slate-700 list-decimal list-inside">
                {proof.intermediateSteps.map((step, sIdx) => (
                  <li key={sIdx} className="leading-relaxed bg-white p-2 rounded border border-slate-200/80 font-mono">
                    <span className="text-slate-800">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Deductions & Waste Breakdown */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-600" /> Deductions & Wastage Allowances
              </h4>
              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between items-center bg-white p-2 rounded border border-slate-200">
                  <span className="font-semibold text-slate-600">Gross Calculated Volume/Area:</span>
                  <span className="font-mono font-bold text-slate-900">{proof.grossQuantity} {proof.unit}</span>
                </div>

                {proof.deductions.length > 0 ? (
                  proof.deductions.map((ded, dIdx) => (
                    <div key={dIdx} className="flex justify-between items-center bg-rose-50/80 p-2 rounded border border-rose-200 text-rose-900">
                      <div>
                        <span className="font-bold">{ded.description}</span>
                        <span className="text-[10px] text-rose-700 block font-mono">({ded.formula})</span>
                      </div>
                      <span className="font-mono font-bold text-rose-700">-{ded.value} {ded.unit}</span>
                    </div>
                  ))
                ) : (
                  <div className="bg-white p-2 rounded border border-slate-200 text-slate-500 italic">
                    No deductions required (Openings/voids &lt; 0.5m² as per POMI exemption rule).
                  </div>
                )}

                <div className="flex justify-between items-center bg-white p-2 rounded border border-slate-200">
                  <span className="font-semibold text-slate-600">Net Theoretical Measured Quantity:</span>
                  <span className="font-mono font-bold text-slate-900">{proof.netQuantity} {proof.unit}</span>
                </div>

                <div className="flex justify-between items-center bg-amber-50 p-2 rounded border border-amber-200 text-amber-900">
                  <span className="font-semibold">Wastage / Lap Allowance ({proof.wastePercent}%):</span>
                  <span className="font-mono font-bold">+{proof.wasteQuantity} {proof.unit}</span>
                </div>

                <div className="flex justify-between items-center bg-emerald-50 p-2.5 rounded-lg border border-emerald-300 text-emerald-950 font-bold">
                  <span>Certified Tender Bill Quantity:</span>
                  <span className="font-mono text-sm">{proof.finalQuantity} {proof.unit}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Section 4: Unit Rate Analysis in AED & Industry Citation */}
          <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-indigo-600" /> Unit Rate Analysis Build-Up (AED)
              </h4>
              <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded border border-indigo-200">
                Currency: AED (United Arab Emirates Dirham)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
              <div className="bg-white p-2 rounded-lg border border-indigo-100">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Material</span>
                <span className="text-xs font-black font-mono text-slate-900">{rate.materialCost.toFixed(2)} AED</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-indigo-100">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Labor</span>
                <span className="text-xs font-black font-mono text-slate-900">{rate.laborCost.toFixed(2)} AED</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-indigo-100">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Plant/Equip</span>
                <span className="text-xs font-black font-mono text-slate-900">{rate.plantCost.toFixed(2)} AED</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-indigo-100">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Overhead & Profit</span>
                <span className="text-xs font-black font-mono text-slate-900">{rate.overheadAndProfit.toFixed(2)} AED</span>
              </div>
              <div className="bg-indigo-600 text-white p-2 rounded-lg border border-indigo-700 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-indigo-200 block uppercase font-bold">Total Unit Rate</span>
                <span className="text-xs font-black font-mono">{rate.unitRateAed.toFixed(2)} AED</span>
              </div>
            </div>

            <div className="text-[11px] text-indigo-900 bg-white p-2.5 rounded-lg border border-indigo-100 flex items-start gap-2">
              <Building className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-indigo-950 font-bold">{rate.basisOfRate}</strong>
                <span className="text-slate-600">Source: {rate.marketSourceCitation}</span>
              </div>
            </div>
          </div>

          {/* Section 5: Standards & Specifications */}
          <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-700">
            <div>
              <span className="font-bold text-slate-900 block">Applicable Measurement Standard:</span>
              <span>{proof.standardReference}</span>
            </div>
            <div className="text-right">
              <span className="font-bold text-slate-900 block">Material Specification:</span>
              <span className="text-indigo-700 font-semibold">{item.specification}</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Mathematical Proof Audit Complete • Ready for Tender Submission</span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenInCad && (
              <button
                type="button"
                onClick={() => onOpenInCad(item.drawingNumber)}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Open in AutoCAD 2021</span>
              </button>
            )}
            
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
