import React, { useState } from 'react';
import { 
  X, 
  Check, 
  RotateCcw, 
  AlertCircle, 
  Building2, 
  Layers, 
  Grid, 
  Info,
  ShieldCheck
} from 'lucide-react';
import { ExtractedElementItem, IntelligenceVerificationStatus } from '../types';

interface ElementEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  element: ExtractedElementItem | null;
  onSave: (
    elementId: string,
    updatedValues: {
      type?: ExtractedElementItem['type'];
      mark?: string;
      level?: string;
      gridLocation?: string;
      geometry?: ExtractedElementItem['geometry'];
      material?: string;
      reinforcementNotation?: string;
      status: IntelligenceVerificationStatus;
      reason: string;
      user: string;
    }
  ) => void;
}

export const ElementEditModal: React.FC<ElementEditModalProps> = ({
  isOpen,
  onClose,
  element,
  onSave,
}) => {
  if (!isOpen || !element) return null;

  const [type, setType] = useState<ExtractedElementItem['type']>(element.type);
  const [mark, setMark] = useState(element.mark);
  const [level, setLevel] = useState(element.level);
  const [gridLocation, setGridLocation] = useState(element.gridLocation);
  const [length, setLength] = useState(element.geometry?.length?.toString() || '');
  const [width, setWidth] = useState(element.geometry?.width?.toString() || '');
  const [depthOrThk, setDepthOrThk] = useState(element.geometry?.thicknessOrDepth?.toString() || '');
  const [height, setHeight] = useState(element.geometry?.height?.toString() || '');
  const [material, setMaterial] = useState(element.material || '');
  const [reinforcementNotation, setReinforcementNotation] = useState(element.reinforcementNotation || '');
  const [correctionReason, setCorrectionReason] = useState('');
  const [engineerName, setEngineerName] = useState('Senior Quantity Surveyor');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionReason.trim()) {
      alert('Please provide a reason or justification for this engineering correction.');
      return;
    }

    onSave(element.id, {
      type,
      mark,
      level,
      gridLocation,
      geometry: {
        length: length ? parseFloat(length) : undefined,
        width: width ? parseFloat(width) : undefined,
        thicknessOrDepth: depthOrThk ? parseFloat(depthOrThk) : undefined,
        height: height ? parseFloat(height) : undefined,
        unit: 'mm',
      },
      material,
      reinforcementNotation,
      status: 'USER CORRECTED',
      reason: correctionReason,
      user: engineerName,
    });

    onClose();
  };

  const handleVerifyAsIs = () => {
    onSave(element.id, {
      status: 'USER VERIFIED',
      reason: 'Verified against drawing layout dimensions.',
      user: engineerName,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Correct Extracted Element — {element.elementId}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {element.sourceLocation} • {element.drawingNumber} (Rev {element.revision})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Audit Rule Notice */}
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <strong className="font-bold">Never Overwrite AI Extraction:</strong> The original AI interpretation (
              <span className="font-mono bg-amber-100 px-1 py-0.5 rounded text-amber-950">
                {element.rawDimensionsText || element.rawText}
              </span>
              ) is permanently preserved in the audit log. Your correction will be marked as{' '}
              <span className="font-bold text-emerald-800">USER CORRECTED</span> with your timestamp and justification.
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Element Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Column">Column</option>
                <option value="Beam">Beam</option>
                <option value="Slab">Slab</option>
                <option value="Wall">Wall</option>
                <option value="Shear Wall">Shear Wall</option>
                <option value="Footing">Footing / Foundation</option>
                <option value="Ground Beam">Ground Beam</option>
                <option value="Door">Door</option>
                <option value="Window">Window</option>
                <option value="Stair">Staircase</option>
                <option value="DPC">DPC Damp Proof Course</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Element Mark
              </label>
              <input
                type="text"
                value={mark}
                onChange={(e) => setMark(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. C12, B101, W-01"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Grid Location
              </label>
              <input
                type="text"
                value={gridLocation}
                onChange={(e) => setGridLocation(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Grid B/4"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Level / Elevation
              </label>
              <input
                type="text"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Ground Floor, +3.600"
              />
            </div>
          </div>

          {/* Geometry Inputs in mm */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              Dimensions (Millimeters — mm)
            </h3>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Length (mm)</label>
                <input
                  type="number"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  className="w-full text-xs font-mono font-bold px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. 6000"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Width (mm)</label>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  className="w-full text-xs font-mono font-bold px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. 500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Thk / Depth (mm)</label>
                <input
                  type="number"
                  value={depthOrThk}
                  onChange={(e) => setDepthOrThk(e.target.value)}
                  className="w-full text-xs font-mono font-bold px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. 200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Height (mm)</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full text-xs font-mono font-bold px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. 3600"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Material Specification
              </label>
              <input
                type="text"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Concrete Grade C30/37"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Reinforcement Notation
              </label>
              <input
                type="text"
                value={reinforcementNotation}
                onChange={(e) => setReinforcementNotation(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. 8Y20 Vertical, T10@150 Links"
              />
            </div>
          </div>

          {/* Justification / Reason */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Engineering Reason / Justification <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={correctionReason}
              onChange={(e) => setCorrectionReason(e.target.value)}
              className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Dimension corrected according to architectural detail section sheet A-301."
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleVerifyAsIs}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Verify As-Is (No Changes)</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors shadow-2xs"
              >
                <Check className="w-4 h-4" />
                <span>Save Correction</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
