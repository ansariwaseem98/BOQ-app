import React, { useState } from 'react';
import { TakeoffItemRecord } from '../types';
import {
  X,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight
} from 'lucide-react';

interface BulkEditModalProps {
  isOpen: boolean;
  selectedItems: TakeoffItemRecord[];
  onClose: () => void;
  onApply: (
    changes: {
      parameterName?: string;
      parameterValue?: number;
      wastagePercent?: number;
      verificationStatus?: 'USER_VERIFIED' | 'USER_CORRECTED';
      notes?: string;
    },
    reason: string
  ) => void;
}

export const BulkEditModal: React.FC<BulkEditModalProps> = ({
  isOpen,
  selectedItems,
  onClose,
  onApply
}) => {
  if (!isOpen || selectedItems.length === 0) return null;

  const [editMode, setEditMode] = useState<'DIMENSION' | 'WASTAGE' | 'VERIFICATION'>('DIMENSION');
  const [selectedParamName, setSelectedParamName] = useState<string>('thickness');
  const [paramValue, setParamValue] = useState<string>('0.20');
  const [wastageValue, setWastageValue] = useState<string>('5.0');
  const [verificationStatus, setVerificationStatus] = useState<'USER_VERIFIED' | 'USER_CORRECTED'>('USER_VERIFIED');
  const [reason, setReason] = useState<string>('Mass update applied across selected group');
  const [confirmed, setConfirmed] = useState<boolean>(false);

  // Collect distinct parameter names available across selected items
  const paramNames: string[] = Array.from(
    new Set<string>(
      selectedItems.flatMap(item =>
        item.calculation.inputs.map(inp => inp.name)
      )
    )
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmed) {
      setConfirmed(true);
      return;
    }

    if (editMode === 'DIMENSION') {
      const num = parseFloat(paramValue);
      if (isNaN(num)) return;
      onApply(
        {
          parameterName: selectedParamName,
          parameterValue: num
        },
        reason
      );
    } else if (editMode === 'WASTAGE') {
      const num = parseFloat(wastageValue);
      if (isNaN(num)) return;
      onApply(
        {
          wastagePercent: num
        },
        reason
      );
    } else if (editMode === 'VERIFICATION') {
      onApply(
        {
          verificationStatus
        },
        reason
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-xl text-slate-100 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-950/80 border border-indigo-700/50 rounded-lg text-indigo-400">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Mass Edit Takeoff Items
              </h2>
              <p className="text-xs text-slate-400">
                Applying batch modifications to {selectedItems.length} selected element quantities
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Mode Selector Tabs */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => { setEditMode('DIMENSION'); setConfirmed(false); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                editMode === 'DIMENSION' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Dimension / Parameter
            </button>
            <button
              type="button"
              onClick={() => { setEditMode('WASTAGE'); setConfirmed(false); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                editMode === 'WASTAGE' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Wastage Rate
            </button>
            <button
              type="button"
              onClick={() => { setEditMode('VERIFICATION'); setConfirmed(false); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                editMode === 'VERIFICATION' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Batch Approval
            </button>
          </div>

          {/* Form Fields */}
          {editMode === 'DIMENSION' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Select Parameter to Update
                </label>
                <select
                  value={selectedParamName}
                  onChange={(e) => { setSelectedParamName(e.target.value); setConfirmed(false); }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                >
                  {paramNames.map(p => (
                    <option key={p} value={p}>
                      Parameter: {p.toUpperCase()}
                    </option>
                  ))}
                  <option value="thickness">Wall / Slab Thickness (thickness)</option>
                  <option value="height">Height (height)</option>
                  <option value="depth">Depth (depth)</option>
                  <option value="unitWeightKgM">Unit Weight (unitWeightKgM)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  New Value for {selectedParamName}
                </label>
                <input
                  type="number"
                  step="any"
                  value={paramValue}
                  onChange={(e) => { setParamValue(e.target.value); setConfirmed(false); }}
                  placeholder="e.g. 0.20"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-sm font-mono focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>
          )}

          {editMode === 'WASTAGE' && (
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Wastage Percentage Allowance (%)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="50"
                value={wastageValue}
                onChange={(e) => { setWastageValue(e.target.value); setConfirmed(false); }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-sm font-mono focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
          )}

          {editMode === 'VERIFICATION' && (
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                New Verification Status
              </label>
              <select
                value={verificationStatus}
                onChange={(e) => { setVerificationStatus(e.target.value as any); setConfirmed(false); }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="USER_VERIFIED">USER VERIFIED (Promote to Final BOQ Quantity)</option>
                <option value="USER_CORRECTED">USER CORRECTED (Custom Override)</option>
              </select>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Reason for Mass Modification (Audit Trail)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          {/* Safety Confirmation Warning */}
          {confirmed ? (
            <div className="p-3.5 bg-amber-950/40 border border-amber-600/60 rounded-lg text-amber-200 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Confirmation Required:</p>
                <p className="mt-0.5">
                  {selectedItems.length} takeoff quantities will be recalculated and recorded in the audit trail.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-lg text-xs text-slate-400">
              Selected elements: <span className="font-mono text-slate-200">{selectedItems.map(i => i.id).join(', ')}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className={`px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-lg ${
                confirmed
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              <span>{confirmed ? `CONFIRM & RECALCULATE (${selectedItems.length})` : 'REVIEW & APPLY'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
