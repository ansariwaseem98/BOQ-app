/**
 * AI BOQ & Tender Estimation Engineer - Phase 15A Live Calculation Editor & Recalculation Modal
 * Supports dynamic live recalculation, Old vs New diffs, Downstream Impact Analysis & Dependency Ripple Graph
 */

import React, { useState, useMemo } from 'react';
import {
  CalculationObject,
  ProjectMeasurementSettings,
} from '../types/measurementEngine';
import {
  ProfessionalCalculationEngine,
  DependencyGraphEngine,
  RoundingEngine,
} from '../engine/measurementEngine';
import {
  Calculator,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ArrowRight,
  TrendingUp,
  History,
  Lock,
  Unlock,
  Layers,
  FileText,
  DollarSign,
  X,
  RefreshCw,
  GitBranch,
} from 'lucide-react';

interface EditCalculationModalProps {
  isOpen: boolean;
  onClose: () => void;
  calculation: CalculationObject;
  allCalculations: CalculationObject[];
  settings: ProjectMeasurementSettings;
  onSaveCalculation: (updated: CalculationObject) => void;
  onViewDrawing?: (drawingNumber: string, page?: number) => void;
}

export const EditCalculationModal: React.FC<EditCalculationModalProps> = ({
  isOpen,
  onClose,
  calculation,
  allCalculations,
  settings,
  onSaveCalculation,
  onViewDrawing,
}) => {
  if (!isOpen || !calculation) return null;

  // Local state for live editable inputs
  const [inputValues, setInputValues] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    calculation.inputs.forEach((inp) => {
      init[inp.inputId] = inp.value;
    });
    return init;
  });

  const [instances, setInstances] = useState<number>(calculation.instances || 1);
  const [formulaLock, setFormulaLock] = useState<boolean>(true);
  const [customFormula, setCustomFormula] = useState<string>(calculation.formula);
  const [editReason, setEditReason] = useState<string>('Verified dimension on site architectural drawing');
  const [userName, setUserName] = useState<string>('Senior Estimator');

  // Compute live recalculated object in real-time
  const { simulatedCalc, impactResult } = useMemo(() => {
    // Clone calculation with updated inputs
    const updatedInputs = calculation.inputs.map((inp) => ({
      ...inp,
      value: inputValues[inp.inputId] ?? inp.value,
      normalizedValue: inputValues[inp.inputId] ?? inp.value,
      originalValue: inputValues[inp.inputId] ?? inp.value,
    }));

    const draftCalc: CalculationObject = {
      ...calculation,
      inputs: updatedInputs,
      instances: instances > 0 ? instances : 1,
      formula: customFormula,
      formulaExpression: customFormula,
    };

    const recomputed = ProfessionalCalculationEngine.executeCalculation(draftCalc, settings);

    // Compute downstream impact analysis for any changed input
    let impact = null;
    const changedInput = calculation.inputs.find(
      (inp) => inputValues[inp.inputId] !== undefined && inputValues[inp.inputId] !== inp.value
    );

    if (changedInput) {
      impact = DependencyGraphEngine.analyzeDownstreamImpact(
        allCalculations,
        calculation.calculationId,
        changedInput.name,
        inputValues[changedInput.inputId],
        { [calculation.boqItemId]: 150 }
      );
    }

    return { simulatedCalc: recomputed, impactResult: impact };
  }, [calculation, inputValues, instances, customFormula, settings, allCalculations]);

  const oldResult = calculation.displayedResult;
  const newResult = simulatedCalc.displayedResult;
  const diff = newResult - oldResult;
  const diffPercent = oldResult !== 0 ? (diff / oldResult) * 100 : 0;
  const isModified = Math.abs(diff) > 1e-6 || JSON.stringify(inputValues) !== JSON.stringify(calculation.inputs.reduce((acc, i) => ({ ...acc, [i.inputId]: i.value }), {}));

  const handleInputChange = (inputId: string, valStr: string) => {
    const num = parseFloat(valStr);
    setInputValues((prev) => ({
      ...prev,
      [inputId]: isNaN(num) ? 0 : num,
    }));
  };

  const handleSave = () => {
    // Record audit trails for all modified inputs
    let runningCalc = { ...calculation };

    calculation.inputs.forEach((inp) => {
      const newVal = inputValues[inp.inputId];
      if (newVal !== undefined && newVal !== inp.value) {
        const { updatedCalc } = ProfessionalCalculationEngine.updateInput(
          runningCalc,
          inp.inputId,
          newVal,
          userName,
          editReason,
          settings
        );
        runningCalc = updatedCalc;
      }
    });

    runningCalc.instances = instances;
    if (customFormula !== calculation.formula) {
      runningCalc.formula = customFormula;
      runningCalc.formulaExpression = customFormula;
      runningCalc.formulaVersion = `V${(parseFloat(runningCalc.formulaVersion.replace('V', '')) + 0.1).toFixed(1)}`;
    }

    const finalized = ProfessionalCalculationEngine.executeCalculation(runningCalc, settings);
    onSaveCalculation(finalized);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-850 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/60">
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
              <h2 className="text-base font-bold text-slate-100 mt-0.5">{calculation.description}</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: SOURCE PROVENANCE */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                Drawing Provenance & Source
              </span>
              {onViewDrawing && calculation.inputs[0]?.sourceRegion && (
                <button
                  type="button"
                  onClick={() => onViewDrawing(calculation.inputs[0]?.sourceRegion?.drawingNumber || calculation.drawingId)}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 underline flex items-center gap-1"
                >
                  [VIEW DRAWING REGION]
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Drawing Reference:</span>
                <span className="font-semibold text-slate-200">{calculation.drawingId || 'A-101'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Element Tag:</span>
                <span className="font-semibold text-slate-200">{calculation.elementId}</span>
              </div>
              <div>
                <span className="text-slate-500 block">BOQ Item ID:</span>
                <span className="font-semibold text-slate-200">{calculation.boqItemId}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Confidence:</span>
                <span
                  className={`font-bold ${
                    calculation.confidence === 'HIGH'
                      ? 'text-emerald-400'
                      : calculation.confidence === 'MEDIUM'
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {calculation.confidence}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: EDITABLE INPUTS */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-emerald-400" />
                Calculation Inputs (Live Recalculation)
              </span>
              <span className="text-[11px] text-slate-400 italic">Changes recompute arithmetic instantly</span>
            </div>

            <div className="space-y-3">
              {calculation.inputs.map((inp) => {
                const currentVal = inputValues[inp.inputId] ?? inp.value;
                const isChanged = currentVal !== inp.value;

                return (
                  <div
                    key={inp.inputId}
                    className={`p-3 rounded-lg border transition-all ${
                      isChanged
                        ? 'bg-amber-950/20 border-amber-500/40'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-200">{inp.name}</span>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                            {inp.unit}
                          </span>
                          {inp.status === 'CONFLICT' && (
                            <span className="text-[10px] font-bold text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800 flex items-center gap-1">
                              <AlertOctagon className="w-3 h-3" />
                              CONFLICT
                            </span>
                          )}
                          {inp.status === 'MISSING' && (
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              MISSING
                            </span>
                          )}
                        </div>
                        {inp.description && (
                          <p className="text-[11px] text-slate-400 mt-0.5">{inp.description}</p>
                        )}
                        {inp.conflictDetails && (
                          <div className="mt-2 p-2 bg-rose-950/40 border border-rose-900 rounded text-[11px] text-rose-300 space-y-1">
                            <div className="font-bold">Source Conflict Discrepancy:</div>
                            <div>• {inp.conflictDetails.sourceA.drawing}: {inp.conflictDetails.sourceA.value} {inp.conflictDetails.sourceA.unit}</div>
                            <div>• {inp.conflictDetails.sourceB.drawing}: {inp.conflictDetails.sourceB.value} {inp.conflictDetails.sourceB.unit}</div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="any"
                          value={isNaN(currentVal) ? '' : currentVal}
                          onChange={(e) => handleInputChange(inp.inputId, e.target.value)}
                          className="w-32 bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-right font-mono text-sm font-bold text-emerald-400 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                        <span className="text-xs text-slate-400 font-mono w-8">{inp.unit}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Instances Count Input */}
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200">Number of Instances</span>
                  <p className="text-[11px] text-slate-400">Repeated identical members (Source: {calculation.instanceSource})</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={instances}
                    onChange={(e) => setInstances(parseInt(e.target.value) || 1)}
                    className="w-24 bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-right font-mono text-sm font-bold text-indigo-400 focus:outline-hidden focus:border-indigo-500"
                  />
                  <span className="text-xs text-slate-400 font-mono w-8">nos</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: FORMULA & DEDUCTIONS */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                Mathematical Formula & Deductions
              </span>
              <button
                type="button"
                onClick={() => setFormulaLock(!formulaLock)}
                className="text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                {formulaLock ? <Lock className="w-3.5 h-3.5 text-emerald-400" /> : <Unlock className="w-3.5 h-3.5 text-amber-400" />}
                <span>{formulaLock ? 'Formula Locked' : 'Formula Unlocked (Admin)'}</span>
              </button>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Formula Expression ({calculation.formulaVersion}):</span>
                {formulaLock ? (
                  <code className="font-mono text-indigo-300 font-bold">{calculation.formula}</code>
                ) : (
                  <input
                    type="text"
                    value={customFormula}
                    onChange={(e) => setCustomFormula(e.target.value)}
                    className="bg-slate-950 border border-amber-500/50 rounded px-2 py-1 font-mono text-xs text-amber-300 w-2/3"
                  />
                )}
              </div>

              <div className="text-xs">
                <span className="text-slate-400 block mb-1">Live Parameter Substitution:</span>
                <code className="font-mono text-emerald-400 font-bold bg-slate-950 px-2.5 py-1.5 rounded border border-slate-800 block">
                  {simulatedCalc.substitution || 'N/A'}
                </code>
              </div>

              {/* Deductions breakdown */}
              {calculation.deductions && calculation.deductions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-300 block">Deductions (Openings & Cutouts):</span>
                  {calculation.deductions.map((ded) => (
                    <div key={ded.deductionId} className="flex items-center justify-between text-xs bg-slate-950 p-2 rounded border border-slate-800">
                      <div>
                        <span className="font-semibold text-slate-200">{ded.name}</span>
                        <span className="text-slate-500 font-mono text-[10px] block">{ded.substitution || ded.formula}</span>
                      </div>
                      <span className="font-mono text-rose-400 font-bold">
                        -{ded.grossDeduction.toFixed(3)} {ded.unit}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 4: LIVE RECALCULATION COMPARISON */}
          <div className="bg-slate-950/80 border border-indigo-900/50 rounded-lg p-4 space-y-3">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Live Recalculation Diff & Validation
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-400 block">Original Quantity</span>
                <div className="text-base font-mono font-bold text-slate-200 mt-1">
                  {RoundingEngine.formatDisplay(oldResult, calculation.roundingRule)} {calculation.unit}
                </div>
              </div>

              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-400 block">Recalculated Quantity</span>
                <div className="text-base font-mono font-bold text-emerald-400 mt-1">
                  {RoundingEngine.formatDisplay(newResult, calculation.roundingRule)} {calculation.unit}
                </div>
              </div>

              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-400 block">Net Difference</span>
                <div
                  className={`text-base font-mono font-bold mt-1 ${
                    diff > 0 ? 'text-amber-400' : diff < 0 ? 'text-cyan-400' : 'text-slate-400'
                  }`}
                >
                  {diff > 0 ? `+${diff.toFixed(3)}` : diff.toFixed(3)} {calculation.unit}
                </div>
              </div>

              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-400 block">Variance %</span>
                <div
                  className={`text-base font-mono font-bold mt-1 ${
                    Math.abs(diffPercent) > 5 ? 'text-amber-400' : 'text-slate-300'
                  }`}
                >
                  {diffPercent > 0 ? `+${diffPercent.toFixed(2)}%` : `${diffPercent.toFixed(2)}%`}
                </div>
              </div>
            </div>

            {/* Quality gate status */}
            {simulatedCalc.qualityGate.warnings.length > 0 && (
              <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-lg text-xs text-amber-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Engineering Warnings:
                </div>
                {simulatedCalc.qualityGate.warnings.map((w, idx) => (
                  <div key={idx}>• {w}</div>
                ))}
              </div>
            )}
          </div>

          {/* Section 5: DOWNSTREAM IMPACT & DEPENDENCY ANALYSIS */}
          {impactResult && impactResult.affectedCalculations.length > 0 && (
            <div className="bg-slate-950/80 border border-amber-900/40 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5" />
                  Downstream Impact Analysis ({impactResult.affectedCalculations.length} items affected)
                </span>
                <span className="text-[11px] text-slate-400">
                  {impactResult.unaffectedCount} unrelated items safe & unchanged
                </span>
              </div>

              <div className="space-y-2">
                {impactResult.affectedCalculations.map((aff) => (
                  <div
                    key={aff.calculationId}
                    className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-200">{aff.description}</span>
                      <span className="text-[10px] font-mono text-slate-400 block">{aff.calculationId}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono text-slate-400">
                        {aff.oldNet.toFixed(3)} →{' '}
                        <strong className="text-amber-300">{aff.newNet.toFixed(3)}</strong> {aff.unit}
                      </span>
                      <span className="font-mono text-xs font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
                        {aff.diffPercent > 0 ? `+${aff.diffPercent.toFixed(1)}%` : `${aff.diffPercent.toFixed(1)}%`}
                      </span>
                    </div>
                  </div>
                ))}

                {/* BOQ Cost Impact */}
                {impactResult.affectedBoqItems.map((boq) => (
                  <div
                    key={boq.boqItemId}
                    className="p-2.5 bg-emerald-950/30 border border-emerald-800/40 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      <div>
                        <span className="font-bold text-emerald-300">BOQ Impact: {boq.description}</span>
                        <span className="text-[10px] text-slate-400 block">Rate @ ${boq.unitRate?.toFixed(2)}/{boq.unit}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-slate-300 block">
                        ${boq.oldCost?.toFixed(2)} → <strong className="text-emerald-400">${boq.newCost?.toFixed(2)}</strong>
                      </span>
                      <span className="text-[10px] font-bold text-emerald-400">
                        Diff: {boq.costDiff && boq.costDiff > 0 ? `+$${boq.costDiff.toFixed(2)}` : `$${boq.costDiff?.toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 6: AUDIT TRAIL ENTRY INPUT */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-4 space-y-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-indigo-400" />
              Audit Trail Verification Record
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Reason for Adjustment / Verification *</label>
                <input
                  type="text"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-slate-200 focus:outline-hidden focus:border-indigo-500"
                  placeholder="e.g. Verified on architectural section A-301"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Engineer / User Name *</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-slate-200 focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Historical Audit Trail List */}
            {calculation.auditTrail && calculation.auditTrail.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-800">
                <span className="text-xs font-semibold text-slate-400 block mb-2">Previous Audit History:</span>
                <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                  {calculation.auditTrail.map((entry) => (
                    <div key={entry.id} className="p-2 bg-slate-900/60 rounded border border-slate-800 text-[11px] flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-300">{entry.fieldChanged}</span>
                        <span className="text-slate-500 ml-2">by {entry.user} ({new Date(entry.timestamp).toLocaleDateString()})</span>
                        <p className="text-slate-400 text-[10px] mt-0.5">{entry.reason}</p>
                      </div>
                      <span className="font-mono text-slate-300">
                        {String(entry.beforeValue)} → {String(entry.afterValue)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-850 border-t border-slate-700 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={!isModified && !customFormula}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-md hover:shadow-indigo-500/20 transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>[SAVE & RECALCULATE BOQ]</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
