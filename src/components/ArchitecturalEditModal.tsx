import React, { useState } from 'react';
import { X, Save, Edit3, ShieldAlert, Check } from 'lucide-react';
import { WallRegisterItem } from '../types';

interface ArchitecturalEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: WallRegisterItem | null;
  onSave: (updatedItem: WallRegisterItem) => void;
}

export const ArchitecturalEditModal: React.FC<ArchitecturalEditModalProps> = ({
  isOpen,
  onClose,
  item,
  onSave,
}) => {
  if (!isOpen || !item) return null;

  const [wallMark, setWallMark] = useState(item.wallMark);
  const [wallType, setWallType] = useState(item.wallType);
  const [material, setMaterial] = useState(item.material);
  const [lengthM, setLengthM] = useState(item.lengthM);
  const [heightM, setHeightM] = useState(item.heightM);
  const [thicknessM, setThicknessM] = useState(item.thicknessM);
  const [verificationStatus, setVerificationStatus] = useState(item.verificationStatus);
  const [changeReason, setChangeReason] = useState('Manual dimension adjustment by QS engineer');

  const handleSave = () => {
    const grossArea = lengthM * heightM;
    const totalOpeningArea = item.deductedOpeningAreaM2 || 0;
    const netArea = Math.max(0, grossArea - totalOpeningArea);
    const grossVol = grossArea * thicknessM;
    const deductedOpeningVol = totalOpeningArea * thicknessM;
    const netVol = Math.max(0, grossVol - deductedOpeningVol);
    const blockEst = thicknessM > 0 ? Math.ceil((netArea / (0.4 * 0.2)) * 1.05) : 0;

    const newFormula = `(${lengthM.toFixed(2)}m × ${heightM.toFixed(2)}m - ${totalOpeningArea.toFixed(2)}m² openings) × ${thicknessM.toFixed(3)}m thk = ${netVol.toFixed(3)} m³ (${netArea.toFixed(2)} m²)`;

    const updatedAuditTrail = [
      ...item.auditTrail,
      {
        id: `AUD-MOD-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: 'Lead QS Engineer',
        action: 'MODIFIED',
        previousValue: item.netVolumeM3,
        newValue: netVol,
        newFormula,
        reason: changeReason,
      },
    ];

    const isBlocked = thicknessM <= 0 || heightM <= 0 || lengthM <= 0;

    const updated: WallRegisterItem = {
      ...item,
      wallMark,
      wallType,
      material,
      lengthM,
      heightM,
      thicknessM,
      grossAreaM2: Number(grossArea.toFixed(3)),
      netAreaM2: Number(netArea.toFixed(3)),
      grossVolumeM3: Number(grossVol.toFixed(3)),
      deductedOpeningVolumeM3: Number(deductedOpeningVol.toFixed(3)),
      netVolumeM3: Number(netVol.toFixed(3)),
      blockCountEstimate: blockEst,
      formulaWithValues: newFormula,
      verificationStatus: isBlocked ? 'unverified' : verificationStatus,
      isBlocked,
      blockedReason: isBlocked ? 'Missing positive dimensions' : undefined,
      auditTrail: updatedAuditTrail,
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-xl w-full flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-lg">Edit Wall Parameters</h3>
              <p className="text-xs text-slate-400">
                Adjust geometric dimensions and recalculate deterministic volume
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Wall Mark / Tag
              </label>
              <input
                type="text"
                value={wallMark}
                onChange={(e) => setWallMark(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Wall Type</label>
              <select
                value={wallType}
                onChange={(e) => setWallType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="Concrete block">Concrete block</option>
                <option value="AAC block">AAC block</option>
                <option value="Brick masonry">Brick masonry</option>
                <option value="Drywall">Drywall</option>
                <option value="Stone masonry">Stone masonry</option>
                <option value="Partition wall">Partition wall</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Material Specification
            </label>
            <input
              type="text"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Length (m)</label>
              <input
                type="number"
                step="0.01"
                value={lengthM}
                onChange={(e) => setLengthM(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Height (m)</label>
              <input
                type="number"
                step="0.01"
                value={heightM}
                onChange={(e) => setHeightM(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Thickness (m)
              </label>
              <input
                type="number"
                step="0.005"
                value={thicknessM}
                onChange={(e) => setThicknessM(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Verification Status
              </label>
              <select
                value={verificationStatus}
                onChange={(e) => setVerificationStatus(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
                <option value="flagged">Flagged</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Drawing Reference
              </label>
              <input
                type="text"
                disabled
                value={`${item.drawingNumber} Rev ${item.revision}`}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Reason for Audit Trail
            </label>
            <input
              type="text"
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              placeholder="e.g. As-built survey adjustment / site instruction update"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-800/40 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors"
          >
            <Save className="w-4 h-4" />
            Recalculate & Save
          </button>
        </div>
      </div>
    </div>
  );
};
