import React, { useState } from 'react';
import { X, Save, Edit3, AlertCircle, Calculator, CheckCircle2 } from 'lucide-react';
import { SteelMemberRegisterItem, StructuralSteelGrade, SteelCategory } from '../types';
import { calculateSteelMemberItem } from '../engine/steelRoofEngine';
import { getAllAvailableSections, lookupSteelSection } from '../engine/steelSectionDatabase';

interface SteelEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: SteelMemberRegisterItem | null;
  onSave: (updated: SteelMemberRegisterItem) => void;
}

export const SteelEditModal: React.FC<SteelEditModalProps> = ({
  isOpen,
  onClose,
  member,
  onSave,
}) => {
  if (!isOpen || !member) return null;

  const [mark, setMark] = useState(member.mark);
  const [section, setSection] = useState(member.section);
  const [lengthM, setLengthM] = useState<number | ''>(member.lengthM ?? '');
  const [quantity, setQuantity] = useState<number>(member.quantity || 1);
  const [materialGrade, setMaterialGrade] = useState<StructuralSteelGrade>(member.materialGrade || 'S355');
  const [level, setLevel] = useState(member.level);
  const [grid, setGrid] = useState(member.grid);
  const [editReason, setEditReason] = useState('Engineer verification / drawing dimension adjustment');

  const availableSections = getAllAvailableSections();
  const foundSection = lookupSteelSection(section);

  const preview = calculateSteelMemberItem({
    id: member.id,
    physicalMemberId: member.physicalMemberId,
    mark,
    category: member.category,
    memberType: member.memberType,
    section,
    materialGrade,
    lengthM: lengthM === '' ? null : Number(lengthM),
    quantity,
    level,
    grid,
    drawingNumber: member.drawingNumber,
    drawingType: member.drawingType,
    revision: member.revision,
    pageNumber: member.pageNumber,
    sourceLocation: member.sourceLocation,
    customUnitWeightKgM: foundSection?.massKgM,
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedItem: SteelMemberRegisterItem = {
      ...preview.item,
      verificationStatus: 'USER CORRECTED',
      userCorrection: {
        originalAiNotation: `${member.section} (Len: ${member.lengthM}m, Qty: ${member.quantity})`,
        correctedNotation: `${section} (Len: ${lengthM}m, Qty: ${quantity})`,
        changedBy: 'Current User (Engineer)',
        changedAt: new Date().toISOString(),
        reason: editReason,
      },
      auditTrail: [
        ...member.auditTrail,
        {
          id: `AUD-EDIT-${Date.now()}`,
          timestamp: new Date().toISOString(),
          user: 'Engineer Verification',
          action: 'INPUT_MODIFIED',
          previousValue: member.totalWeightKg,
          newValue: preview.item.totalWeightKg,
          previousFormula: member.formulaWithValues,
          newFormula: preview.item.formulaWithValues,
          reason: editReason,
        },
      ],
    };

    onSave(updatedItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Edit Steel Member: {member.mark}
              </h2>
              <p className="text-xs text-slate-500">
                Category: {member.category} | Source: {member.drawingNumber}
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

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Member Mark *
              </label>
              <input
                type="text"
                required
                value={mark}
                onChange={(e) => setMark(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Steel Grade
              </label>
              <select
                value={materialGrade}
                onChange={(e) => setMaterialGrade(e.target.value as StructuralSteelGrade)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
              >
                <option value="S355">S355 (Structural Steel 355 MPa)</option>
                <option value="S275">S275 (Structural Steel 275 MPa)</option>
                <option value="A36">ASTM A36</option>
                <option value="A992">ASTM A992</option>
                <option value="A572 Gr50">ASTM A572 Gr50</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Structural Steel Section *
            </label>
            <div className="flex gap-2">
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500"
              >
                {availableSections.map((s) => (
                  <option key={s.sectionId} value={s.designation}>
                    {s.designation} ({s.massKgM.toFixed(1)} kg/m) - {s.standard}
                  </option>
                ))}
              </select>
            </div>
            {foundSection && (
              <span className="text-[11px] text-slate-500 mt-1 block">
                Standard mass: <strong>{foundSection.massKgM} kg/m</strong> | Depth: {foundSection.depthMm}mm | Flange: {foundSection.widthMm}mm
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Member Length (m) *
              </label>
              <input
                type="number"
                step="0.001"
                required
                placeholder="e.g. 12.000"
                value={lengthM}
                onChange={(e) => setLengthM(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Quantity (Nr) *
              </label>
              <input
                type="number"
                step="1"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Level / Elevation
              </label>
              <input
                type="text"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Grid Line Reference
              </label>
              <input
                type="text"
                value={grid}
                onChange={(e) => setGrid(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Engineering Reason for Edit *
            </label>
            <input
              type="text"
              required
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Live Recalculation Preview */}
          <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-indigo-600" />
                Live Recalculation Output:
              </span>
              <span className="text-xs font-mono font-bold text-indigo-700">
                {preview.item.totalWeightKg.toFixed(2)} kg ({preview.item.totalWeightTonnes.toFixed(3)} Tonnes)
              </span>
            </div>
            <div className="text-[11px] font-mono text-indigo-950 bg-white p-2 rounded border border-indigo-100">
              {preview.item.formulaWithValues}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save & Update Takeoff</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
