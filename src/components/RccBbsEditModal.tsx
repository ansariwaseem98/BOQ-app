/**
 * PHASE 15B — PROFESSIONAL BBS EDITOR & CORRECTION MODAL
 * 8-Section Comprehensive Modal with real-time recalculation and impact analysis
 */

import React, { useState, useMemo } from 'react';
import {
  ReinforcementBarRecord,
  RebarShapeCode,
  BarSpacingDistributionRule,
  RebarShapeType
} from '../types/rccBbsTypes';
import {
  calculateRebarUnitWeight,
  calculateBarCountFromSpacing,
  calculateCuttingLength,
  recalculateRebarRecord
} from '../engine/rccBbsEngine';
import { RebarShapeVisualizer } from './RebarShapeVisualizer';
import {
  X,
  Save,
  RotateCcw,
  Calculator,
  AlertTriangle,
  FileText,
  History,
  CheckCircle2,
  TrendingUp,
  Layers,
  ShieldCheck,
  Eye
} from 'lucide-react';

interface RccBbsEditModalProps {
  bar: ReinforcementBarRecord;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedBar: ReinforcementBarRecord, correctionReason: string) => void;
}

export const RccBbsEditModal: React.FC<RccBbsEditModalProps> = ({
  bar,
  isOpen,
  onClose,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'BAR_INFO' | 'GEOMETRY' | 'CUTTING' | 'LAP_ANCHOR' | 'QUANTITY' | 'WEIGHT' | 'SOURCE' | 'AUDIT'>('BAR_INFO');

  // Form State
  const [barMark, setBarMark] = useState(bar.barMark);
  const [member, setMember] = useState(bar.member);
  const [level, setLevel] = useState(bar.level);
  const [grade, setGrade] = useState(bar.grade);
  const [diameterMm, setDiameterMm] = useState<number>(bar.diameterMm);
  const [shapeCode, setShapeCode] = useState<RebarShapeCode>(bar.shapeCode);
  const [shape, setShape] = useState<RebarShapeType>(bar.shape);

  // Dimensions
  const [aMm, setAMm] = useState<number>(bar.dimensions.aMm || 0);
  const [bMm, setBMm] = useState<number>(bar.dimensions.bMm || 0);
  const [cMm, setCMm] = useState<number>(bar.dimensions.cMm || 0);
  const [dMm, setDMm] = useState<number>(bar.dimensions.dMm || 0);
  const [eMm, setEMm] = useState<number>(bar.dimensions.eMm || 0);
  const [clearCoverMm, setClearCoverMm] = useState<number>(bar.clearCoverMm || 35);

  // Spacing & Quantity
  const [spacingMm, setSpacingMm] = useState<number | null>(bar.spacingMm);
  const [distributionLengthMm, setDistributionLengthMm] = useState<number | null>(bar.distributionLengthMm);
  const [spacingRule, setSpacingRule] = useState<BarSpacingDistributionRule>(bar.spacingDistributionRule);
  const [explicitCount, setExplicitCount] = useState<number | null>(bar.explicitNumberFromDrawing);
  const [numberOfMembers, setNumberOfMembers] = useState<number>(bar.numberOfMembers || 1);

  // Lap & Anchorage
  const [lapRequired, setLapRequired] = useState<boolean>(bar.lap.lapRequired);
  const [lapLengthMm, setLapLengthMm] = useState<number>(bar.lap.lapLengthMm);
  const [numberOfLaps, setNumberOfLaps] = useState<number>(bar.lap.numberOfLaps || 1);
  const [lapReason, setLapReason] = useState<string>(bar.lap.lapReason || '');
  const [anchorageLdMm, setAnchorageLdMm] = useState<number>(bar.anchorage.developmentLengthLdMm || 0);

  // Correction Tracking
  const [correctionReason, setCorrectionReason] = useState<string>('');

  // Live Recalculation
  const recalculatedDraft = useMemo(() => {
    const draft: ReinforcementBarRecord = {
      ...bar,
      barMark,
      member,
      level,
      grade,
      diameterMm,
      shapeCode,
      shape,
      dimensions: { aMm, bMm, cMm, dMm, eMm },
      clearCoverMm,
      spacingMm,
      distributionLengthMm,
      spacingDistributionRule: spacingRule,
      explicitNumberFromDrawing: explicitCount,
      numberOfMembers,
      lap: {
        ...bar.lap,
        lapRequired,
        lapLengthMm,
        numberOfLaps: lapRequired ? numberOfLaps : 0,
        totalLapLengthMm: lapRequired ? lapLengthMm * numberOfLaps : 0,
        lapReason,
      },
      anchorage: {
        ...bar.anchorage,
        developmentLengthLdMm: anchorageLdMm,
      },
    };

    return recalculateRebarRecord(draft);
  }, [
    bar,
    barMark,
    member,
    level,
    grade,
    diameterMm,
    shapeCode,
    shape,
    aMm,
    bMm,
    cMm,
    dMm,
    eMm,
    clearCoverMm,
    spacingMm,
    distributionLengthMm,
    spacingRule,
    explicitCount,
    numberOfMembers,
    lapRequired,
    lapLengthMm,
    numberOfLaps,
    lapReason,
    anchorageLdMm,
  ]);

  // Delta Impact Analysis
  const deltaLengthM = recalculatedDraft.totalLengthM - bar.totalLengthM;
  const deltaWeightKg = recalculatedDraft.totalWeightKg - bar.totalWeightKg;

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(recalculatedDraft, correctionReason || 'User engineering parameter adjustment');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">BBS Rebar Editor & Verification Gate</h2>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                  {bar.barMark}
                </span>
                <span className="text-xs text-slate-500 font-medium">({bar.member})</span>
              </div>
              <p className="text-xs text-slate-500">
                Deterministic cutting length, unit weight formula, and provenance audit trail.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Delta Summary Ribbon */}
        <div className="px-6 py-2.5 bg-indigo-50/70 border-b border-indigo-100 flex flex-wrap items-center justify-between text-xs gap-3">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-slate-500">Unit Weight: </span>
              <span className="font-mono font-bold text-indigo-900">{recalculatedDraft.unitWeightKgM.toFixed(3)} kg/m</span>
              {recalculatedDraft.unitWeightKgM !== bar.unitWeightKgM && (
                <span className="text-[10px] text-amber-700 ml-1 font-semibold">
                  (was {bar.unitWeightKgM.toFixed(3)})
                </span>
              )}
            </div>
            <div>
              <span className="text-slate-500">Cutting Length: </span>
              <span className="font-mono font-bold text-slate-900">{recalculatedDraft.cuttingLengthM.toFixed(3)} m</span>
            </div>
            <div>
              <span className="text-slate-500">Total Bars: </span>
              <span className="font-mono font-bold text-slate-900">{recalculatedDraft.totalNumberOfBars}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 font-mono font-bold">
            <div className="text-slate-700">
              Total Weight: <span className="text-indigo-700">{recalculatedDraft.totalWeightKg.toFixed(2)} kg</span> ({recalculatedDraft.totalWeightTonnes.toFixed(3)} t)
            </div>
            {Math.abs(deltaWeightKg) > 0.001 && (
              <div className={`px-2 py-0.5 rounded text-xs ${deltaWeightKg > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                Impact Delta: {deltaWeightKg > 0 ? `+${deltaWeightKg.toFixed(2)}` : deltaWeightKg.toFixed(2)} kg
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-6 bg-white overflow-x-auto text-xs font-semibold">
          {[
            { id: 'BAR_INFO', label: '1. Bar Information' },
            { id: 'GEOMETRY', label: '2. Geometry & Segments' },
            { id: 'CUTTING', label: '3. Cutting Length' },
            { id: 'LAP_ANCHOR', label: '4. Lap & Anchorage' },
            { id: 'QUANTITY', label: '5. Quantity & Spacing' },
            { id: 'WEIGHT', label: '6. Weight & BOQ' },
            { id: 'SOURCE', label: '7. Source Traceability' },
            { id: 'AUDIT', label: '8. Audit & History' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-3.5 border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-700 font-bold bg-indigo-50/40'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: BAR INFORMATION */}
          {activeTab === 'BAR_INFO' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bar Mark / Tag</label>
                  <input
                    type="text"
                    value={barMark}
                    onChange={(e) => setBarMark(e.target.value)}
                    className="w-full text-xs font-mono font-bold border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Member Reference</label>
                  <input
                    type="text"
                    value={member}
                    onChange={(e) => setMember(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Level / Story</label>
                  <input
                    type="text"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Steel Grade</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Fe500D">Fe500D (High Ductility)</option>
                    <option value="Fe500">Fe500</option>
                    <option value="Fe415">Fe415</option>
                    <option value="Fe550">Fe550</option>
                    <option value="Grade 60">Grade 60 (ASTM A615)</option>
                    <option value="Grade 500B">Grade 500B (BS 4449)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nominal Diameter (mm)</label>
                  <select
                    value={diameterMm}
                    onChange={(e) => setDiameterMm(Number(e.target.value))}
                    className="w-full text-xs font-mono font-bold border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                  >
                    {[8, 10, 12, 16, 20, 25, 32, 40].map((d) => (
                      <option key={d} value={d}>
                        Ø{d} mm (Unit Weight: {calculateRebarUnitWeight(d).unitWeightKgM.toFixed(3)} kg/m)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                  <span className="text-xs font-bold text-slate-800">Raw Drawing Callout Notation:</span>
                  <div className="font-mono text-xs text-indigo-950 font-bold bg-white p-2.5 rounded border border-indigo-100">
                    {bar.rawNotation}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Raw notation is immutable in provenance register to maintain full auditability.
                  </p>
                </div>

                <RebarShapeVisualizer bar={recalculatedDraft} width={280} />
              </div>
            </div>
          )}

          {/* TAB 2: GEOMETRY & SEGMENTS */}
          {activeTab === 'GEOMETRY' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Standard Shape Code (BS 8666 / IS 2502)</label>
                  <select
                    value={shapeCode}
                    onChange={(e) => {
                      const code = e.target.value as RebarShapeCode;
                      setShapeCode(code);
                    }}
                    className="w-full text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="00">Code 00: Straight Main Bar</option>
                    <option value="11">Code 11: L-Bar (90° Bend)</option>
                    <option value="21">Code 21: U-Bar (Double 90° Bends)</option>
                    <option value="31">Code 31: Cranked / Bent-up Bar</option>
                    <option value="41">Code 41: Beam Stirrup / Closed Link</option>
                    <option value="51">Code 51: Column Tie / Seismic Link (135° Hooks)</option>
                    <option value="61">Code 61: Circular Ring / Spiral</option>
                    <option value="71">Code 71: Chair Bar Support</option>
                    <option value="77">Code 77: Hairpin / Cap Bar</option>
                    <option value="81">Code 81: Hooked Bar (9d Hook)</option>
                    <option value="99">Code 99: Custom Bar Shape</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Segment A (mm)</label>
                    <input
                      type="number"
                      value={aMm}
                      onChange={(e) => setAMm(Number(e.target.value))}
                      className="w-full text-xs font-mono font-bold border border-slate-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Segment B (mm)</label>
                    <input
                      type="number"
                      value={bMm}
                      onChange={(e) => setBMm(Number(e.target.value))}
                      className="w-full text-xs font-mono font-bold border border-slate-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Segment C (mm)</label>
                    <input
                      type="number"
                      value={cMm}
                      onChange={(e) => setCMm(Number(e.target.value))}
                      className="w-full text-xs font-mono font-bold border border-slate-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Segment D / Crank (mm)</label>
                    <input
                      type="number"
                      value={dMm}
                      onChange={(e) => setDMm(Number(e.target.value))}
                      className="w-full text-xs font-mono font-bold border border-slate-300 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Clear Cover (mm)</label>
                  <input
                    type="number"
                    value={clearCoverMm}
                    onChange={(e) => setClearCoverMm(Number(e.target.value))}
                    className="w-full text-xs font-mono font-bold border border-slate-300 rounded-lg px-3 py-2"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Source: {bar.coverSource || 'General Notes'}</p>
                </div>
              </div>

              <div>
                <RebarShapeVisualizer bar={recalculatedDraft} width={340} />
              </div>
            </div>
          )}

          {/* TAB 3: CUTTING LENGTH */}
          {activeTab === 'CUTTING' && (
            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Cutting Length Formula:</span>
                  <span className="font-mono text-xs font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                    {recalculatedDraft.cuttingFormula}
                  </span>
                </div>
                <div className="font-mono text-sm font-bold text-slate-900 bg-white p-3 rounded-lg border border-slate-200">
                  {recalculatedDraft.cuttingFormulaWithValues}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-1">
                  <span className="text-slate-500">Geometric Sum (A + B + ...):</span>
                  <p className="font-mono font-bold text-base text-slate-800">{recalculatedDraft.geometricLengthM.toFixed(3)} m</p>
                </div>
                <div className="border border-indigo-200 rounded-xl p-3 bg-indigo-50/50 space-y-1">
                  <span className="text-indigo-700 font-semibold">Final Cutting Length (with Hooks, Bends & Laps):</span>
                  <p className="font-mono font-bold text-base text-indigo-900">{recalculatedDraft.cuttingLengthM.toFixed(3)} m ({recalculatedDraft.cuttingLengthMm} mm)</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LAP & ANCHORAGE */}
          {activeTab === 'LAP_ANCHOR' && (
            <div className="space-y-4 max-w-xl">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="lapReq"
                  checked={lapRequired}
                  onChange={(e) => setLapRequired(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <label htmlFor="lapReq" className="text-xs font-bold text-slate-800">
                  Splice / Lap Required (e.g. span &gt; 12m or column starter splice)
                </label>
              </div>

              {lapRequired && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Lap Length (mm)</label>
                      <input
                        type="number"
                        value={lapLengthMm}
                        onChange={(e) => setLapLengthMm(Number(e.target.value))}
                        className="w-full text-xs font-mono font-bold border border-slate-300 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Number of Laps</label>
                      <input
                        type="number"
                        value={numberOfLaps}
                        onChange={(e) => setNumberOfLaps(Number(e.target.value))}
                        className="w-full text-xs font-mono font-bold border border-slate-300 rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Lap Reason / Engineering Note</label>
                    <input
                      type="text"
                      value={lapReason}
                      onChange={(e) => setLapReason(e.target.value)}
                      placeholder="e.g. 50d column vertical splice as per Addendum 1"
                      className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Development Length Ld / Anchorage (mm)</label>
                <input
                  type="number"
                  value={anchorageLdMm}
                  onChange={(e) => setAnchorageLdMm(Number(e.target.value))}
                  className="w-full text-xs font-mono font-bold border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>
          )}

          {/* TAB 5: QUANTITY & SPACING */}
          {activeTab === 'QUANTITY' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Spacing Distribution Rule</label>
                  <select
                    value={spacingRule}
                    onChange={(e) => setSpacingRule(e.target.value as BarSpacingDistributionRule)}
                    className="w-full text-xs font-semibold border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="CEILING_PLUS_1">CEILING(Span / Spacing) + 1</option>
                    <option value="CEILING">CEILING(Span / Spacing)</option>
                    <option value="EXPLICIT_SOURCE">Explicit Drawing Count (e.g. 12Y16)</option>
                  </select>
                </div>

                {spacingRule === 'EXPLICIT_SOURCE' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Explicit Bar Count per Member</label>
                    <input
                      type="number"
                      value={explicitCount || 0}
                      onChange={(e) => setExplicitCount(Number(e.target.value))}
                      className="w-full text-xs font-mono font-bold border border-slate-300 rounded-lg px-3 py-2"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Distribution Span (mm)</label>
                      <input
                        type="number"
                        value={distributionLengthMm || 0}
                        onChange={(e) => setDistributionLengthMm(Number(e.target.value))}
                        className="w-full text-xs font-mono font-bold border border-slate-300 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Spacing (mm)</label>
                      <input
                        type="number"
                        value={spacingMm || 0}
                        onChange={(e) => setSpacingMm(Number(e.target.value))}
                        className="w-full text-xs font-mono font-bold border border-slate-300 rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Number of Identical Members</label>
                  <input
                    type="number"
                    value={numberOfMembers}
                    onChange={(e) => setNumberOfMembers(Math.max(1, Number(e.target.value)))}
                    className="w-full text-xs font-mono font-bold border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <span className="text-xs font-bold text-slate-800">Quantity Derivation Result:</span>
                <div className="p-3 bg-white rounded border border-slate-200 font-mono text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Bars per Member:</span>
                    <span className="font-bold text-slate-900">{recalculatedDraft.numberOfBarsPerMember}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Members Count:</span>
                    <span className="font-bold text-slate-900">{recalculatedDraft.numberOfMembers}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-1 text-indigo-900 font-extrabold">
                    <span>Total Calculated Bars:</span>
                    <span>{recalculatedDraft.totalNumberOfBars}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: WEIGHT & BOQ */}
          {activeTab === 'WEIGHT' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <span className="text-xs font-bold text-slate-800">Theoretical Unit Weight Formula (d² / 162):</span>
                <div className="font-mono text-sm font-bold text-indigo-950 bg-white p-3 rounded border border-indigo-100">
                  {recalculatedDraft.unitWeightFormula}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-xs font-mono">
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-slate-500">Total Length:</span>
                  <p className="font-bold text-base text-slate-900 mt-1">{recalculatedDraft.totalLengthM.toFixed(3)} m</p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-slate-500">Unit Weight:</span>
                  <p className="font-bold text-base text-slate-900 mt-1">{recalculatedDraft.unitWeightKgM.toFixed(3)} kg/m</p>
                </div>
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                  <span className="text-indigo-700 font-bold">Total Weight:</span>
                  <p className="font-bold text-base text-indigo-900 mt-1">{recalculatedDraft.totalWeightKg.toFixed(2)} kg</p>
                  <span className="text-[10px] text-indigo-600">({recalculatedDraft.totalWeightTonnes.toFixed(3)} Tonnes)</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: SOURCE TRACEABILITY */}
          {activeTab === 'SOURCE' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Primary Source Document:</span>
                  <span className="font-mono font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                    {bar.primarySource.drawingNumber}
                  </span>
                </div>
                <p className="text-slate-600">
                  Page: <span className="font-bold text-slate-800">{bar.primarySource.pageNumber}</span> | Region / Detail: <span className="font-bold text-slate-800">{bar.primarySource.region}</span>
                </p>
                <p className="text-[11px] text-slate-500">
                  All BBS rows link back to the exact structural drawings and detail sheets.
                </p>
              </div>

              {bar.sources && bar.sources.length > 1 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-800 mb-2">Additional Registered Sources (Deduplicated Master Bar):</h4>
                  <div className="space-y-1.5">
                    {bar.sources.map((s, idx) => (
                      <div key={idx} className="text-xs font-mono p-2 bg-white border border-slate-200 rounded flex justify-between">
                        <span>{s.sourceType}: {s.drawingNumber}</span>
                        <span className="text-slate-500">{s.region}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 8: AUDIT & HISTORY */}
          {activeTab === 'AUDIT' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Adjustment / Correction <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="e.g. Updated column splice to 50d lap as per Addendum 1 Drawing S-101 Note 2"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {bar.corrections && bar.corrections.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-800">Historical Corrections Register:</h4>
                  <div className="space-y-2">
                    {bar.corrections.map((c) => (
                      <div key={c.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>{c.user}</span>
                          <span>{c.timestamp}</span>
                        </div>
                        <p className="font-semibold text-slate-800">
                          {c.fieldChanged}: <span className="line-through text-red-600">{c.originalValue}</span> &rarr; <span className="text-emerald-700 font-bold">{c.correctedValue}</span>
                        </p>
                        <p className="text-[11px] text-slate-600 italic">Reason: {c.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all"
            >
              <Save className="w-4 h-4" />
              Save & Recalculate BBS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
