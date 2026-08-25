import React, { useState, useEffect } from 'react';
import {
  TakeoffItemRecord,
  CalculationInputParameter,
  TakeoffDeductionRecord,
  ProjectEngineeringRules
} from '../types';
import { TakeoffCalculationEngine } from '../engine/takeoffCalculationEngine';
import {
  X,
  Calculator,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Layers,
  Sparkles
} from 'lucide-react';

interface FormulaEditModalProps {
  isOpen: boolean;
  item: TakeoffItemRecord;
  rules: ProjectEngineeringRules;
  onClose: () => void;
  onSave: (updatedItem: TakeoffItemRecord, reason: string) => void;
}

export const FormulaEditModal: React.FC<FormulaEditModalProps> = ({
  isOpen,
  item,
  rules,
  onClose,
  onSave
}) => {
  if (!isOpen) return null;

  // Local state for inputs
  const [inputs, setInputs] = useState<CalculationInputParameter[]>(
    JSON.parse(JSON.stringify(item.calculation.inputs || []))
  );
  const [deductions, setDeductions] = useState<TakeoffDeductionRecord[]>(
    JSON.parse(JSON.stringify(item.calculation.deductions || []))
  );
  const [wastagePct, setWastagePct] = useState<number>(item.wastagePercent || 0);
  const [changeReason, setChangeReason] = useState<string>('Updated dimensional parameters');
  const [verificationOption, setVerificationOption] = useState<'USER_CORRECTED' | 'USER_VERIFIED'>('USER_CORRECTED');

  // Live evaluated result
  const [previewResult, setPreviewResult] = useState(() =>
    TakeoffCalculationEngine.evaluate(
      item.calculation.templateType,
      inputs,
      deductions,
      rules,
      wastagePct
    )
  );

  // Re-evaluate whenever inputs or deductions change
  useEffect(() => {
    const res = TakeoffCalculationEngine.evaluate(
      item.calculation.templateType,
      inputs,
      deductions,
      rules,
      wastagePct
    );
    setPreviewResult(res);
  }, [inputs, deductions, wastagePct, rules, item.calculation.templateType]);

  const handleInputChange = (index: number, valStr: string) => {
    const updated = [...inputs];
    const num = valStr.trim() === '' ? null : parseFloat(valStr);
    updated[index] = {
      ...updated[index],
      value: num !== null && !isNaN(num) ? num : null,
      isMissing: num === null || isNaN(num),
      isUserOverridden: true
    };
    setInputs(updated);
  };

  const handleAddDeduction = () => {
    const newDed: TakeoffDeductionRecord = {
      id: `DED-${Date.now()}`,
      parentElementId: item.elementId || item.id,
      parentElementName: item.description,
      openingElementId: `OPEN-${Date.now().toString().slice(-4)}`,
      openingElementName: 'Custom Void / Opening',
      openingType: 'cutout',
      widthM: 1.0,
      heightOrLengthM: 1.0,
      thicknessM: 0.2,
      count: 1,
      deductionAreaM2: 1.0,
      deductionVolumeM3: 0.2,
      ruleUsed: 'User Custom Deduction',
      isDeductible: true,
      sourceDrawing: item.drawingNumber,
      sourceLocation: item.sourceLocation
    };
    setDeductions([...deductions, newDed]);
  };

  const handleRemoveDeduction = (dedId: string) => {
    setDeductions(deductions.filter(d => d.id !== dedId));
  };

  const handleResetToSource = () => {
    const resetInputs = item.calculation.inputs.map(inp => ({
      ...inp,
      value: inp.originalExtractedValue !== undefined ? inp.originalExtractedValue : inp.value,
      isMissing: inp.originalExtractedValue === null || inp.originalExtractedValue === undefined,
      isUserOverridden: false
    }));
    setInputs(resetInputs);
    setDeductions(JSON.parse(JSON.stringify(item.calculation.deductions || [])));
    setWastagePct(item.wastagePercent || 0);
  };

  const handleSave = () => {
    const updatedItem: TakeoffItemRecord = {
      ...item,
      verificationStatus: verificationOption,
      wastagePercent: wastagePct,
      calculation: {
        ...item.calculation,
        inputs,
        deductions
      }
    };
    onSave(updatedItem, changeReason || 'Manual parameter adjustment in Formula Editor');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl text-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-950/80 border border-indigo-700/50 rounded-lg text-indigo-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
                  {item.id}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {item.boqItemId || 'Unmapped BOQ'}
                </span>
                <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                  {item.drawingNumber} {item.revisionId ? `(${item.revisionId})` : ''}
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-100 mt-1 truncate max-w-xl">
                {item.description}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Live Mathematical Formula Preview Banner */}
          <div className={`p-4 rounded-xl border ${previewResult.isBlocked ? 'bg-rose-950/30 border-rose-800/50' : 'bg-indigo-950/30 border-indigo-800/50'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>DETERMINISTIC FORMULA BREAKDOWN</span>
              </div>
              <span className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded ${previewResult.isBlocked ? 'bg-rose-900/60 text-rose-300 border border-rose-700' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-700'}`}>
                {previewResult.isBlocked ? 'STATUS: BLOCKED' : 'STATUS: VALIDATED'}
              </span>
            </div>

            <div className="space-y-1.5 font-mono text-sm">
              <div className="text-xs text-slate-400">
                <span className="text-slate-500 font-sans">Formula: </span>
                <span className="text-indigo-300">{previewResult.formula}</span>
              </div>
              <div className="text-xs text-slate-300">
                <span className="text-slate-500 font-sans">Expression: </span>
                <span className="text-amber-300">{previewResult.evaluatedExpression}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-sans">Net Measured Quantity: </span>
                  <span className="text-lg font-black text-emerald-400">
                    {previewResult.netMeasuredQuantity} {previewResult.unit}
                  </span>
                </div>
                {previewResult.wastageQuantity > 0 && (
                  <div className="text-right">
                    <span className="text-xs text-slate-400 font-sans">Tender Quantity (+{wastagePct}% Wastage): </span>
                    <span className="text-base font-bold text-indigo-300">
                      {previewResult.tenderQuantity} {previewResult.unit}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {previewResult.isBlocked && (
              <div className="mt-3 p-2.5 bg-rose-900/40 border border-rose-700/60 rounded-lg flex items-start gap-2 text-xs text-rose-200">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{previewResult.blockedReason}</span>
              </div>
            )}
          </div>

          {/* Dimensional Inputs Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-indigo-400" />
                <span>Dimensional Parameters & Values</span>
              </h3>
              <button
                type="button"
                onClick={handleResetToSource}
                className="text-xs text-slate-400 hover:text-indigo-400 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Drawing Extraction</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {inputs.map((inp, idx) => (
                <div
                  key={inp.id || idx}
                  className={`p-3 rounded-lg border transition-all ${inp.isMissing ? 'bg-rose-950/20 border-rose-800/60' : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'}`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <span>{inp.label || inp.name}</span>
                      {inp.isMandatory && <span className="text-rose-400 text-xs font-bold">*</span>}
                    </label>
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                      Unit: {inp.unit}
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      placeholder={inp.isMissing ? 'Enter required value...' : '0.00'}
                      value={inp.value !== null && inp.value !== undefined ? inp.value : ''}
                      onChange={(e) => handleInputChange(idx, e.target.value)}
                      className={`w-full px-3 py-2 text-sm font-mono font-bold bg-slate-900 border rounded-lg focus:outline-none transition-colors ${
                        inp.isMissing
                          ? 'border-rose-600 text-rose-300 focus:border-rose-400'
                          : 'border-slate-700 text-slate-100 focus:border-indigo-500'
                      }`}
                    />
                  </div>

                  {inp.sourceDescription && (
                    <p className="text-[11px] text-slate-500 mt-1.5 truncate">
                      Source: {inp.sourceDescription}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Deductions Inspector */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>Deductions & Openings ({deductions.length})</span>
              </h3>
              <button
                type="button"
                onClick={handleAddDeduction}
                className="text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Opening Deduction</span>
              </button>
            </div>

            {deductions.length === 0 ? (
              <div className="p-3 bg-slate-950/40 border border-dashed border-slate-800 rounded-lg text-center text-xs text-slate-500">
                No opening deductions configured for this item.
              </div>
            ) : (
              <div className="space-y-2">
                {deductions.map(ded => (
                  <div
                    key={ded.id}
                    className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-200">{ded.openingElementName}</p>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {ded.widthM}m × {ded.heightOrLengthM}m × {ded.count} Nr = {ded.deductionAreaM2.toFixed(2)} m²
                        {ded.deductionVolumeM3 !== undefined && ` (${ded.deductionVolumeM3.toFixed(3)} m³)`}
                      </p>
                      <p className="text-[10px] text-indigo-400 mt-0.5">Rule: {ded.ruleUsed}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveDeduction(ded.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Wastage & Audit metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Wastage Allowance (%)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                step="0.5"
                value={wastagePct}
                onChange={(e) => setWastagePct(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm font-mono bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Applies to Tender Quantity only. Net measured quantity remains unadulterated.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Verification State
              </label>
              <select
                value={verificationOption}
                onChange={(e) => setVerificationOption(e.target.value as any)}
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="USER_CORRECTED">USER CORRECTED (Overrides AI Extract)</option>
                <option value="USER_VERIFIED">USER VERIFIED (Approved for Final BOQ)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Reason for Change (Mandatory Audit Trail Entry)
              </label>
              <input
                type="text"
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                placeholder="e.g. Corrected beam depth to 600mm as per Section 2-2"
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!changeReason.trim()}
            className={`px-5 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-lg ${
              !changeReason.trim()
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>SAVE & RECALCULATE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
