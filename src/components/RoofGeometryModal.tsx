import React, { useState } from 'react';
import { X, Triangle, Check, Calculator, Info } from 'lucide-react';
import { RoofGeometryData } from '../types';
import { calculateRoofGeometry } from '../engine/steelRoofEngine';

interface RoofGeometryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: RoofGeometryData;
  onSave?: (data: RoofGeometryData) => void;
}

export const RoofGeometryModal: React.FC<RoofGeometryModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSave,
}) => {
  const [roofType, setRoofType] = useState<'Double Slope' | 'Single Slope' | 'Saw-tooth' | 'Monopitch' | 'Curved'>(
    initialData?.roofType || 'Double Slope'
  );
  const [roofName, setRoofName] = useState(initialData?.roofName || 'Warehouse Gable Roof');
  const [buildingLengthM, setBuildingLengthM] = useState<number>(initialData?.buildingLengthM || 48.0);
  const [spanM, setSpanM] = useState<number>(initialData?.spanM || 30.0);
  const [inputMode, setInputMode] = useState<'rise' | 'pitch'>('rise');
  const [riseM, setRiseM] = useState<number | ''>(initialData?.riseM || 1.5);
  const [pitchDeg, setPitchDeg] = useState<number | ''>(initialData?.pitchDeg || 5.71);
  const [eaveOverhangM, setEaveOverhangM] = useState<number>(initialData?.eaveOverhangM || 0.6);

  if (!isOpen) return null;

  const calculated: RoofGeometryData = calculateRoofGeometry({
    id: initialData?.id || `ROOF-${Date.now()}`,
    roofName,
    roofType,
    buildingLengthM,
    spanM,
    riseM: inputMode === 'rise' ? (riseM === '' ? null : riseM) : null,
    pitchDeg: inputMode === 'pitch' ? (pitchDeg === '' ? null : pitchDeg) : null,
    eaveOverhangM,
  });

  const handleApply = () => {
    if (onSave) {
      onSave(calculated);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
              <Triangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Roof Geometry & Slope Engine
              </h2>
              <p className="text-xs text-slate-500">
                True sloped rafter lengths, pitch trigonometry & roof cladding areas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Form parameters */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Roof Profile Type
              </label>
              <select
                value={roofType}
                onChange={(e) => setRoofType(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Double Slope">Double Slope (Duo-Pitch / Gable Roof)</option>
                <option value="Single Slope">Single Slope (Mono-Pitch / Shed Roof)</option>
                <option value="Saw-tooth">Saw-tooth Industrial Roof</option>
                <option value="Monopitch">Monopitch Canopy</option>
                <option value="Curved">Curved Barrel Vault Roof</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Roof Identifier / Name
              </label>
              <input
                type="text"
                value={roofName}
                onChange={(e) => setRoofName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Building Length (m)
              </label>
              <input
                type="number"
                step="0.1"
                value={buildingLengthM}
                onChange={(e) => setBuildingLengthM(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Total Building Span (m)
              </label>
              <input
                type="number"
                step="0.1"
                value={spanM}
                onChange={(e) => setSpanM(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Eave Overhang (m)
              </label>
              <input
                type="number"
                step="0.05"
                value={eaveOverhangM}
                onChange={(e) => setEaveOverhangM(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Slope Input Mode */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Slope Definition Method:
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInputMode('rise')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                    inputMode === 'rise'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border border-slate-300 text-slate-700'
                  }`}
                >
                  Rise Height (m)
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('pitch')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                    inputMode === 'pitch'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border border-slate-300 text-slate-700'
                  }`}
                >
                  Pitch Angle (Degrees °)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-1">
              {inputMode === 'rise' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vertical Ridge Rise (m)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 1.50"
                    value={riseM}
                    onChange={(e) => setRiseM(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Rise from eave level to apex ridge
                  </span>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Roof Pitch Angle (Degrees °)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 5.71 (1:10) or 10.0"
                    value={pitchDeg}
                    onChange={(e) => setPitchDeg(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Slope angle relative to horizontal
                  </span>
                </div>
              )}

              <div className="p-3 bg-white border border-slate-200 rounded-lg flex flex-col justify-center text-xs">
                <span className="text-slate-500 font-medium">Half-Span Run:</span>
                <span className="font-mono font-bold text-slate-900">
                  {calculated.halfSpanM.toFixed(2)}m (+{eaveOverhangM}m overhang = {calculated.runM.toFixed(2)}m)
                </span>
                <span className="text-slate-500 font-medium mt-1">Calculated Slope:</span>
                <span className="font-mono font-bold text-indigo-600">
                  {calculated.pitchDeg ? `${calculated.pitchDeg.toFixed(2)}° (1 : ${(calculated.runM / (calculated.riseM || 1)).toFixed(1)})` : 'Missing'}
                </span>
              </div>
            </div>
          </div>

          {/* Mathematical Result Showcase */}
          <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
              <Calculator className="w-4 h-4 text-indigo-600" />
              <span>Deterministic Geometric Output</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-white rounded-lg border border-indigo-100 shadow-2xs">
                <span className="text-[11px] text-slate-500 block">Sloping Rafter Length:</span>
                <span className="text-base font-black font-mono text-indigo-700">
                  {calculated.slopingLengthM.toFixed(3)} m
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  √(Run² + Rise²)
                </span>
              </div>

              <div className="p-3 bg-white rounded-lg border border-indigo-100 shadow-2xs">
                <span className="text-[11px] text-slate-500 block">Plan Building Area:</span>
                <span className="text-base font-black font-mono text-slate-900">
                  {calculated.planAreaM2.toFixed(2)} m²
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {buildingLengthM}m × {spanM}m
                </span>
              </div>

              <div className="p-3 bg-white rounded-lg border border-indigo-100 shadow-2xs">
                <span className="text-[11px] text-slate-500 block">Gross Sloping Roof Area:</span>
                <span className="text-base font-black font-mono text-emerald-700">
                  {calculated.grossRoofAreaM2.toFixed(2)} m²
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  2 Slopes × {buildingLengthM}m × {calculated.slopingLengthM.toFixed(2)}m
                </span>
              </div>
            </div>

            <div className="p-2.5 bg-indigo-100/50 rounded-lg text-xs font-mono text-indigo-950 border border-indigo-200">
              <span className="font-bold">Formula: </span>
              {calculated.formulaWithValues}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Info className="w-3.5 h-3.5" />
            <span>Strict standard: Pythogorean true length without approximations.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Apply to Takeoff</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
