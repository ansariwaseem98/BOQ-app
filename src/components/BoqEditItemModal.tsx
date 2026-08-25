import React, { useState } from 'react';
import { X, Edit3, Save, AlertTriangle, ShieldCheck, History } from 'lucide-react';
import { UnifiedBoqItem, UnifiedBoqStatus } from '../types';

interface BoqEditItemModalProps {
  item: UnifiedBoqItem;
  isFrozen: boolean;
  onSave: (updatedItem: UnifiedBoqItem) => void;
  onClose: () => void;
}

export const BoqEditItemModal: React.FC<BoqEditItemModalProps> = ({
  item,
  isFrozen,
  onSave,
  onClose,
}) => {
  const [itemCode, setItemCode] = useState(item.itemCode);
  const [section, setSection] = useState(item.section);
  const [subsection, setSubsection] = useState(item.subsection);
  const [description, setDescription] = useState(item.description);
  const [specification, setSpecification] = useState(item.specification);
  const [specificationFlag, setSpecificationFlag] = useState(item.specificationFlag || 'CONFIRMED');
  const [unit, setUnit] = useState(item.unit);
  const [isOverridden, setIsOverridden] = useState(item.isManuallyOverridden || false);
  const [overrideQuantity, setOverrideQuantity] = useState<number | string>(
    item.overrideQuantity !== undefined ? item.overrideQuantity : item.finalQuantity
  );
  const [overrideReason, setOverrideReason] = useState(item.overrideReason || '');
  const [status, setStatus] = useState<UnifiedBoqStatus>(item.status);
  const [notes, setNotes] = useState(item.notes || '');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFrozen) return;

    const numOverride = isOverridden ? Number(overrideQuantity) : undefined;
    const finalQty = isOverridden && numOverride !== undefined ? numOverride : item.calculatedQuantity;

    const auditEntry = {
      timestamp: new Date().toISOString(),
      action: isOverridden ? 'Quantity Override' : 'Metadata Update',
      modifiedBy: 'Responsible Estimator',
      previousValue: `${item.finalQuantity} ${item.unit}`,
      newValue: `${finalQty} ${unit}`,
      reason: overrideReason || 'Manual adjustment in BOQ editor',
    };

    const updatedItem: UnifiedBoqItem = {
      ...item,
      itemCode,
      section,
      subsection,
      description,
      specification,
      specificationFlag: specificationFlag as any,
      unit: unit as any,
      isManuallyOverridden: isOverridden,
      overrideQuantity: numOverride,
      finalQuantity: finalQty,
      overrideReason: isOverridden ? overrideReason : undefined,
      status,
      notes,
      lastCalculatedAt: new Date().toISOString(),
      auditTrail: [auditEntry, ...(item.auditTrail || [])],
    };

    onSave(updatedItem);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Edit BOQ Line Item</h3>
              <p className="text-xs text-slate-400 font-mono">ID: {item.id} | Code: {item.itemCode}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 flex-1">
          {isFrozen && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-800 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>This BOQ revision is currently <strong>FROZEN (Read-Only)</strong>. Create a new revision to make modifications.</span>
            </div>
          )}

          {/* Section & Subsection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Item Code</label>
              <input
                type="text"
                disabled={isFrozen}
                value={itemCode}
                onChange={(e) => setItemCode(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Section</label>
              <input
                type="text"
                disabled={isFrozen}
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subsection</label>
            <input
              type="text"
              disabled={isFrozen}
              value={subsection}
              onChange={(e) => setSubsection(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description (Functional Scope)
            </label>
            <textarea
              rows={3}
              disabled={isFrozen}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 leading-relaxed"
              required
            />
          </div>

          {/* Technical Specification */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">
                Technical Specification (Separated from Description)
              </label>
              <select
                disabled={isFrozen}
                value={specificationFlag}
                onChange={(e) => setSpecificationFlag(e.target.value as any)}
                className="text-2xs font-semibold px-2 py-0.5 rounded border border-slate-300 bg-white"
              >
                <option value="CONFIRMED">CONFIRMED SPEC</option>
                <option value="MISSING_SPEC">MISSING SPEC</option>
                <option value="PARTIAL">PARTIAL SPEC</option>
              </select>
            </div>
            <textarea
              rows={2}
              disabled={isFrozen}
              value={specification}
              onChange={(e) => setSpecification(e.target.value)}
              placeholder="Material grade, density, standards, thickness, testing requirements..."
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          {/* Quantities & Overrides */}
          <div className="p-4 rounded-lg bg-blue-50/50 border border-blue-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-950">Quantity Management</span>
              <label className="flex items-center gap-1.5 text-xs text-blue-900 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={isFrozen}
                  checked={isOverridden}
                  onChange={(e) => setIsOverridden(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Enable Manual Quantity Override</span>
              </label>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <span className="text-2xs uppercase text-slate-500 block">Calculated Quantity</span>
                <span className="font-mono text-sm font-bold text-slate-700">
                  {item.calculatedQuantity} {item.unit}
                </span>
              </div>

              <div>
                <label className="block text-2xs uppercase text-slate-500 mb-0.5">Unit</label>
                <select
                  disabled={isFrozen}
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as any)}
                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs bg-white font-mono"
                >
                  <option value="m³">m³</option>
                  <option value="m²">m²</option>
                  <option value="m">m</option>
                  <option value="Ton">Ton</option>
                  <option value="tonne">tonne</option>
                  <option value="kg">kg</option>
                  <option value="No.">No.</option>
                  <option value="Item">Item</option>
                  <option value="Set">Set</option>
                  <option value="Lump Sum">Lump Sum</option>
                </select>
              </div>

              <div>
                <label className="block text-2xs uppercase text-slate-500 mb-0.5">Final Quantity</label>
                {isOverridden ? (
                  <input
                    type="number"
                    step="any"
                    disabled={isFrozen}
                    value={overrideQuantity}
                    onChange={(e) => setOverrideQuantity(e.target.value)}
                    className="w-full px-2 py-1 border border-blue-400 bg-white rounded text-xs font-mono font-bold text-blue-700"
                    required
                  />
                ) : (
                  <span className="font-mono text-sm font-bold text-indigo-600">
                    {item.calculatedQuantity} {unit}
                  </span>
                )}
              </div>
            </div>

            {isOverridden && (
              <div>
                <label className="block text-xs font-semibold text-blue-900 mb-1">
                  Reason for Override <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  disabled={isFrozen}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g. Site boundary adjustment, approved addendum RFI-08..."
                  className="w-full px-3 py-1.5 border border-blue-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500"
                  required={isOverridden}
                />
              </div>
            )}
          </div>

          {/* Verification Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Verification Status</label>
              <select
                disabled={isFrozen}
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white"
              >
                <option value="USER_VERIFIED">USER_VERIFIED (Sign-off)</option>
                <option value="FINAL">FINAL (Approved for BOQ)</option>
                <option value="USER_CORRECTED">USER_CORRECTED (Overridden)</option>
                <option value="REQUIRES_REVIEW">REQUIRES_REVIEW</option>
                <option value="OPEN_ITEM">OPEN_ITEM (Blocked)</option>
                <option value="CONFLICT">CONFLICT (Blocked)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Audit Notes</label>
              <input
                type="text"
                disabled={isFrozen}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional engineering notes..."
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isFrozen}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Item Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
