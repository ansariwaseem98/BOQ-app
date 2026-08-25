import React, { useState } from 'react';
import {
  X,
  Settings2,
  CheckCircle2,
  Sliders,
  Scale,
  ShieldAlert,
  Info
} from 'lucide-react';
import { STANDARD_UNIT_WEIGHTS } from '../engine/rccReinforcementEngine';

interface BbsRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BbsRulesModal: React.FC<BbsRulesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [lapMultiplier, setLapMultiplier] = useState<number>(50); // 50d
  const [hook90Rule, setHook90Rule] = useState<number>(9); // 9d
  const [hook135Rule, setHook135Rule] = useState<number>(12); // 12d
  const [hook180Rule, setHook180Rule] = useState<number>(16); // 16d
  const [bend90Deduction, setBend90Deduction] = useState<number>(2); // 2d
  const [bend135Deduction, setBend135Deduction] = useState<number>(3); // 3d
  const [maxStockLengthM, setMaxStockLengthM] = useState<number>(12.0);
  const [wastagePercent, setWastagePercent] = useState<number>(2.5);

  // Standard covers
  const [coverFooting, setCoverFooting] = useState<number>(50);
  const [coverColumn, setCoverColumn] = useState<number>(40);
  const [coverBeam, setCoverBeam] = useState<number>(35);
  const [coverSlab, setCoverSlab] = useState<number>(25);
  const [coverWall, setCoverWall] = useState<number>(30);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Project Reinforcement & BBS Calculation Rules
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  BS 8666 / IS 2502
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure deterministic lap multipliers, hook extensions, bend deductions, and standard covers.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
          {/* Lap & Stock Length Rules */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              <span>1. Lap Splices & Stock Length Limits</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Standard Lap Multiplier (Tension)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={lapMultiplier}
                    onChange={(e) => setLapMultiplier(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                  />
                  <span className="font-mono font-bold text-slate-600 text-xs shrink-0">× d</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">e.g. 50d = 1000mm for Ø20 bar</span>
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Max Commercial Stock Bar Length</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    value={maxStockLengthM}
                    onChange={(e) => setMaxStockLengthM(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                  />
                  <span className="font-mono font-bold text-slate-600 text-xs shrink-0">m</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Standard transport limit = 12.0m</span>
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Rebar Wastage Allowance</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    value={wastagePercent}
                    onChange={(e) => setWastagePercent(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                  />
                  <span className="font-mono font-bold text-slate-600 text-xs shrink-0">%</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Added to net weight for tender BOQ</span>
              </div>
            </div>
          </div>

          {/* Hook Extensions & Bend Deductions */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              <span>2. Hook Extensions & Bend Deductions (BS 8666)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">90° Hook Extension</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={hook90Rule}
                    onChange={(e) => setHook90Rule(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 focus:bg-white focus:outline-hidden"
                  />
                  <span className="font-mono text-slate-600 shrink-0">× d</span>
                </div>
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">135° Seismic Link Hook</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={hook135Rule}
                    onChange={(e) => setHook135Rule(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 focus:bg-white focus:outline-hidden"
                  />
                  <span className="font-mono text-slate-600 shrink-0">× d</span>
                </div>
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">180° Full U-Hook Extension</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={hook180Rule}
                    onChange={(e) => setHook180Rule(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 focus:bg-white focus:outline-hidden"
                  />
                  <span className="font-mono text-slate-600 shrink-0">× d</span>
                </div>
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">90° Bend Deduction</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={bend90Deduction}
                    onChange={(e) => setBend90Deduction(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 focus:bg-white focus:outline-hidden"
                  />
                  <span className="font-mono text-slate-600 shrink-0">× d</span>
                </div>
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">135° Bend Deduction</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={bend135Deduction}
                    onChange={(e) => setBend135Deduction(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 focus:bg-white focus:outline-hidden"
                  />
                  <span className="font-mono text-slate-600 shrink-0">× d</span>
                </div>
              </div>
            </div>
          </div>

          {/* Default Concrete Covers */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              <span>3. Project Concrete Cover Standards (mm)</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Footings</label>
                <input
                  type="number"
                  value={coverFooting}
                  onChange={(e) => setCoverFooting(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Columns</label>
                <input
                  type="number"
                  value={coverColumn}
                  onChange={(e) => setCoverColumn(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Beams</label>
                <input
                  type="number"
                  value={coverBeam}
                  onChange={(e) => setCoverBeam(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Slabs</label>
                <input
                  type="number"
                  value={coverSlab}
                  onChange={(e) => setCoverSlab(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Walls</label>
                <input
                  type="number"
                  value={coverWall}
                  onChange={(e) => setCoverWall(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Unit Weight Table Preview */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <span className="font-bold text-slate-800 text-[11px] block">
              STANDARD REBAR DENSITY TABLE (d² / 162.28 kg/m)
            </span>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 text-[11px] font-mono">
              {Object.entries(STANDARD_UNIT_WEIGHTS).map(([dia, wt]) => (
                <div key={dia} className="bg-white p-1.5 rounded border border-slate-200 text-center">
                  <div className="font-bold text-indigo-950">Ø{dia}</div>
                  <div className="text-slate-600">{wt} kg/m</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <Info className="w-4 h-4 text-indigo-600" />
            <span>Rules are applied deterministically across all cutting length calculations.</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors shadow-2xs cursor-pointer"
          >
            Save Rules & Close
          </button>
        </div>
      </div>
    </div>
  );
};
