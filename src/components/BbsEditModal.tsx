import React, { useState, useMemo } from 'react';
import {
  X,
  Scale,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  HelpCircle,
  Eye,
  Layers,
  ArrowRight,
  ShieldCheck,
  History
} from 'lucide-react';
import {
  RccRebarRegisterItem,
  BarCountRule,
  RebarType,
  SteelRebarGrade,
  BbsVerificationStatus
} from '../types';
import {
  computeCuttingLength,
  calculateBarCount,
  calculateRebarUnitWeight,
  STANDARD_REBAR_DIAMETERS
} from '../engine/rccReinforcementEngine';

interface BbsEditModalProps {
  rebarItem: RccRebarRegisterItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedItem: RccRebarRegisterItem) => void;
  onResetToSource: (itemId: string) => void;
  onViewSourceDrawing?: (documentId: string, page: number) => void;
}

export const BbsEditModal: React.FC<BbsEditModalProps> = ({
  rebarItem,
  isOpen,
  onClose,
  onSave,
  onResetToSource,
  onViewSourceDrawing,
}) => {
  // Editable form state
  const [barMark, setBarMark] = useState(rebarItem.barMark);
  const [memberDescription, setMemberDescription] = useState(rebarItem.memberDescription);
  const [barDiameterMm, setBarDiameterMm] = useState<number>(rebarItem.barDiameterMm);
  const [rebarType, setRebarType] = useState<RebarType>(rebarItem.rebarType);
  const [rebarGrade, setRebarGrade] = useState<SteelRebarGrade>(rebarItem.rebarGrade);
  const [shapeCode, setShapeCode] = useState<string>(rebarItem.shapeCode);
  
  // Dimensions
  const [aMm, setAMm] = useState<number>(rebarItem.dimensions.aMm || 0);
  const [bMm, setBMm] = useState<number>(rebarItem.dimensions.bMm || 0);
  const [cMm, setCMm] = useState<number>(rebarItem.dimensions.cMm || 0);
  const [dMm, setDMm] = useState<number>(rebarItem.dimensions.dMm || 0);
  const [eMm, setEMm] = useState<number>(rebarItem.dimensions.eMm || 0);
  const [fMm, setFMm] = useState<number>(rebarItem.dimensions.fMm || 0);
  
  // Quantity & Spacing
  const [quantity, setQuantity] = useState<number | null>(rebarItem.quantity);
  const [spacingMm, setSpacingMm] = useState<number | null>(rebarItem.spacingMm);
  const [distributionLengthMm, setDistributionLengthMm] = useState<number | null>(rebarItem.distributionLengthMm);
  const [barCountRule, setBarCountRule] = useState<BarCountRule>(rebarItem.barCountRule);
  const [memberCount, setMemberCount] = useState<number>(rebarItem.memberCount || 1);
  
  // Parameters
  const [coverMm, setCoverMm] = useState<number | null>(rebarItem.coverMm);
  const [lapLengthMm, setLapLengthMm] = useState<number>(rebarItem.lap?.lapLengthMm || 0);
  const [lapRequired, setLapRequired] = useState<boolean>(rebarItem.lap?.lapRequired || false);
  const [notes, setNotes] = useState(rebarItem.notes || '');
  
  // Mandatory Reason for Audit
  const [changeReason, setChangeReason] = useState('Engineer verification & geometric adjustment');

  // Real-time recalculated values
  const liveCalculation = useMemo(() => {
    const clRes = computeCuttingLength({
      shapeCode,
      diameterMm: barDiameterMm,
      aMm,
      bMm,
      cMm,
      dMm,
      eMm,
      fMm,
      coverMm,
      hook: rebarItem.hook,
      bend: rebarItem.bend,
      lap: { ...rebarItem.lap, lapRequired, lapLengthMm },
      anchorage: rebarItem.anchorage,
      stockLengthLimitM: rebarItem.stockLengthLimitM,
    });

    const countRes = calculateBarCount(distributionLengthMm, spacingMm, barCountRule, quantity);
    const barsPerMember = countRes.count;
    const totalBars = barsPerMember * Math.max(1, memberCount);
    const totalLengthM = Number((clRes.cuttingLengthM * totalBars).toFixed(2));
    const unitWt = calculateRebarUnitWeight(barDiameterMm);
    const totalWeightKg = Number((totalLengthM * unitWt.unitWeightKgM).toFixed(2));

    return {
      clRes,
      countRes,
      barsPerMember,
      totalBars,
      totalLengthM,
      unitWeightKgM: unitWt.unitWeightKgM,
      totalWeightKg,
    };
  }, [
    shapeCode,
    barDiameterMm,
    aMm,
    bMm,
    cMm,
    dMm,
    eMm,
    fMm,
    coverMm,
    lapRequired,
    lapLengthMm,
    distributionLengthMm,
    spacingMm,
    barCountRule,
    quantity,
    memberCount,
    rebarItem,
  ]);

  if (!isOpen) return null;

  const isModified =
    barMark !== rebarItem.barMark ||
    memberDescription !== rebarItem.memberDescription ||
    barDiameterMm !== rebarItem.barDiameterMm ||
    rebarType !== rebarItem.rebarType ||
    shapeCode !== rebarItem.shapeCode ||
    aMm !== rebarItem.dimensions.aMm ||
    bMm !== (rebarItem.dimensions.bMm || 0) ||
    cMm !== (rebarItem.dimensions.cMm || 0) ||
    dMm !== (rebarItem.dimensions.dMm || 0) ||
    spacingMm !== rebarItem.spacingMm ||
    quantity !== rebarItem.quantity ||
    coverMm !== rebarItem.coverMm;

  const handleSave = () => {
    const isHumanCorrected = isModified;
    const newStatus: BbsVerificationStatus = isHumanCorrected ? 'USER CORRECTED' : 'USER VERIFIED';

    const updatedItem: RccRebarRegisterItem = {
      ...rebarItem,
      barMark,
      memberDescription,
      barDiameterMm,
      rebarType,
      rebarGrade,
      shapeCode,
      shapeDescription: liveCalculation.clRes.shapeDescription,
      dimensions: {
        aMm,
        bMm: bMm || undefined,
        cMm: cMm || undefined,
        dMm: dMm || undefined,
        eMm: eMm || undefined,
        fMm: fMm || undefined,
      },
      quantity,
      spacingMm,
      distributionLengthMm,
      barCountRule,
      memberCount,
      barsPerMember: liveCalculation.barsPerMember,
      totalBars: liveCalculation.totalBars,
      coverMm,
      cuttingLengthM: liveCalculation.clRes.cuttingLengthM,
      cuttingFormula: liveCalculation.clRes.formulaNotation,
      cuttingFormulaWithValues: liveCalculation.clRes.formulaWithValues,
      stockLengthExceeded: liveCalculation.clRes.stockLengthExceeded,
      totalLengthM: liveCalculation.totalLengthM,
      unitWeightKgM: liveCalculation.unitWeightKgM,
      totalWeightKg: liveCalculation.totalWeightKg,
      notes,
      verificationStatus: newStatus,
      isBlocked: false,
      blockedReason: null,
      userCorrection: isHumanCorrected
        ? {
            originalAiNotation: rebarItem.rawNotation,
            correctedNotation: `Ø${barDiameterMm} Shape ${shapeCode} (${liveCalculation.clRes.cuttingLengthM}m) x ${liveCalculation.totalBars} bars`,
            changedBy: 'Senior Estimation Engineer',
            changedAt: new Date().toISOString(),
            reason: changeReason || 'Verified against revised design drawings',
          }
        : rebarItem.userCorrection,
      auditTrail: [
        {
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toISOString(),
          user: 'Senior QS / Estimator',
          action: isHumanCorrected ? 'INPUT_MODIFIED' : 'VERIFIED',
          previousValue: rebarItem.totalWeightKg,
          newValue: liveCalculation.totalWeightKg,
          reason: changeReason || (isHumanCorrected ? 'User correction of rebar geometry' : 'User verified rebar without modifications'),
        },
        ...rebarItem.auditTrail,
      ],
      updatedAt: new Date().toISOString(),
    };

    onSave(updatedItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Edit & Verify BBS Bar Record
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {rebarItem.barMark}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  ({rebarItem.elementMark} • {rebarItem.level})
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Deterministic cutting length calculation with live recalculation and audit preservation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onResetToSource(rebarItem.id);
                onClose();
              }}
              title="Restore initial AI extracted data without deleting audit history"
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
              <span>Reset to Source</span>
            </button>

            {onViewSourceDrawing && (
              <button
                onClick={() => {
                  onViewSourceDrawing(rebarItem.sourceDrawing.documentId, rebarItem.sourceDrawing.page);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Source Drawing</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* RAW PROVENANCE NOTATION BANNER (Never Overwritten) */}
        <div className="px-6 py-2.5 bg-amber-50/70 border-b border-amber-200/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-amber-900">
            <FileText className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>RAW DRAWING NOTATION:</strong> <span className="font-mono bg-white px-2 py-0.5 rounded border border-amber-300 font-bold">{rebarItem.rawNotation}</span>
            </span>
          </div>
          <span className="text-[11px] text-amber-700">
            Source: Sheet {rebarItem.sourceDrawing.drawingNumber} Rev {rebarItem.sourceDrawing.revision} (Pg {rebarItem.sourceDrawing.page})
          </span>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
          {/* Section 1: Identification & Grade */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              <span>1. Bar Identification & Material</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Bar Mark *</label>
                <input
                  type="text"
                  value={barMark}
                  onChange={(e) => setBarMark(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold text-indigo-950 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Bar Diameter (mm) *</label>
                <select
                  value={barDiameterMm}
                  onChange={(e) => setBarDiameterMm(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                >
                  {STANDARD_REBAR_DIAMETERS.map((d) => (
                    <option key={d} value={d}>
                      Ø{d} mm ({calculateRebarUnitWeight(d).unitWeightKgM.toFixed(3)} kg/m)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Rebar Type</label>
                <select
                  value={rebarType}
                  onChange={(e) => setRebarType(e.target.value as RebarType)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="Main bar">Main bar</option>
                  <option value="Distribution bar">Distribution bar</option>
                  <option value="Top bar">Top bar</option>
                  <option value="Bottom bar">Bottom bar</option>
                  <option value="Extra top bar">Extra top bar</option>
                  <option value="Extra bottom bar">Extra bottom bar</option>
                  <option value="Stirrup">Stirrup</option>
                  <option value="Link">Link</option>
                  <option value="Tie">Tie</option>
                  <option value="U-bar">U-bar</option>
                  <option value="L-bar">L-bar</option>
                  <option value="Starter bar">Starter bar</option>
                  <option value="Chair">Chair bar</option>
                  <option value="Trimmer bar">Trimmer / Opening bar</option>
                </select>
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Steel Grade</label>
                <select
                  value={rebarGrade}
                  onChange={(e) => setRebarGrade(e.target.value as SteelRebarGrade)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 focus:bg-white focus:outline-hidden focus:border-indigo-500"
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
          </div>

          {/* Section 2: Bar Shape & Dimensional Parameters */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              <span>2. Bar Shape Code & Segment Geometry (BS 8666 / IS 2502)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-3">
                <label className="text-slate-600 font-semibold block mb-1">Shape Code & Description *</label>
                <select
                  value={shapeCode}
                  onChange={(e) => setShapeCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="00">Shape 00: Straight Main Bar (CL = A)</option>
                  <option value="11">Shape 11: L-Bar Single 90° Bend (CL = A + B - 2d)</option>
                  <option value="21">Shape 21: U-Bar Double 90° Bends (CL = A + B + C - 4d)</option>
                  <option value="31">Shape 31: Cranked Bent-up Shear Bar (CL = A + B + C + 0.42D - 2d)</option>
                  <option value="41">Shape 41: Closed Beam Stirrup Link (CL = 2(A+B) + 20d - 12d bend)</option>
                  <option value="51">Shape 51: Column Seismic Link 135° Hooks (CL = 2(A+B) + 24d - 14d bend)</option>
                  <option value="61">Shape 61: Circular Ring / Spiral Hoop (CL = πA + 48d Lap)</option>
                  <option value="71">Shape 71: Chair Bar Support (CL = A + 2B + 2C)</option>
                  <option value="77">Shape 77: Hairpin / U-Cap Link (CL = A + 2B - 2d)</option>
                  <option value="81">Shape 81: Opening Trimmer / Diagonal Rebar (CL = A + 2B)</option>
                  <option value="99">Shape 99: Custom Multi-Bend Variable Profile</option>
                </select>
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Dimension A (mm) *</label>
                <input
                  type="number"
                  value={aMm}
                  onChange={(e) => setAMm(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Dimension B (mm)</label>
                <input
                  type="number"
                  value={bMm}
                  onChange={(e) => setBMm(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Dimension C (mm)</label>
                <input
                  type="number"
                  value={cMm}
                  onChange={(e) => setCMm(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {(shapeCode === '31' || shapeCode === '99') && (
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Dimension D / Crank (mm)</label>
                  <input
                    type="number"
                    value={dMm}
                    onChange={(e) => setDMm(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Concrete Cover (mm)</label>
                <input
                  type="number"
                  value={coverMm !== null ? coverMm : ''}
                  placeholder="e.g. 40"
                  onChange={(e) => setCoverMm(e.target.value === '' ? null : Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Lap Length (mm)</label>
                <input
                  type="number"
                  value={lapLengthMm}
                  onChange={(e) => setLapLengthMm(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Quantity & Spacing Rules */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              <span>3. Bar Spacing & Count Rules</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Count Rule</label>
                <select
                  value={barCountRule}
                  onChange={(e) => setBarCountRule(e.target.value as BarCountRule)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="CEILING_PLUS_1">CEILING(L / S) + 1 (Standard)</option>
                  <option value="CEILING">CEILING(L / S)</option>
                  <option value="ROUND_PLUS_1">ROUND(L / S) + 1</option>
                  <option value="MANUAL">MANUAL Count</option>
                </select>
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Spacing S (mm)</label>
                <input
                  type="number"
                  value={spacingMm !== null ? spacingMm : ''}
                  placeholder="e.g. 150"
                  onChange={(e) => setSpacingMm(e.target.value === '' ? null : Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Distribution Length L (mm)</label>
                <input
                  type="number"
                  value={distributionLengthMm !== null ? distributionLengthMm : ''}
                  placeholder="e.g. 6000"
                  onChange={(e) => setDistributionLengthMm(e.target.value === '' ? null : Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">No. of Identical Members</label>
                <input
                  type="number"
                  value={memberCount}
                  onChange={(e) => setMemberCount(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Live Recalculation & Comparison Preview */}
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-indigo-600" />
                <span>Deterministic Calculation Live Preview</span>
              </span>
              <span className="font-mono text-xs text-indigo-700 font-bold">
                Formula: {liveCalculation.clRes.formulaNotation}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded-lg border border-indigo-100 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Cutting Length:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {liveCalculation.clRes.cuttingLengthM.toFixed(3)} m
                </span>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  ({liveCalculation.clRes.formulaWithValues})
                </p>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px]">Total Quantity:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {liveCalculation.totalBars} Bars
                </span>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  ({liveCalculation.barsPerMember} bars × {memberCount} member)
                </p>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px]">Total Rebar Length:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {liveCalculation.totalLengthM.toFixed(2)} m
                </span>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  ({liveCalculation.clRes.cuttingLengthM}m × {liveCalculation.totalBars})
                </p>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px]">Calculated Weight:</span>
                <span className="font-mono font-black text-indigo-700 text-sm">
                  {liveCalculation.totalWeightKg.toFixed(2)} kg
                </span>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  ({liveCalculation.unitWeightKgM.toFixed(3)} kg/m)
                </p>
              </div>
            </div>

            {/* OLD vs NEW delta compare */}
            {isModified && (
              <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="font-semibold text-amber-900">Geometric Input Delta:</span>
                  <span className="font-mono text-slate-500 line-through">
                    Old Weight: {rebarItem.totalWeightKg.toFixed(2)} kg
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-600" />
                  <span className="font-mono font-bold text-amber-900">
                    New Weight: {liveCalculation.totalWeightKg.toFixed(2)} kg
                  </span>
                </div>
                <span className="font-mono text-[11px] font-bold text-indigo-700">
                  Δ = {(liveCalculation.totalWeightKg - rebarItem.totalWeightKg).toFixed(2)} kg
                </span>
              </div>
            )}
          </div>

          {/* Section 5: Engineering Change Reason (Audit Compliance) */}
          <div>
            <label className="text-slate-700 font-bold block mb-1 text-xs">
              Engineering Change Reason / Justification (Audit Logged) *
            </label>
            <input
              type="text"
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              placeholder="e.g. Adjusted bar length to match Addendum 2 structural drawing revision"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs focus:bg-white focus:outline-hidden focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Audit trail will record user timestamp and original AI provenance.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save & Verify BBS Bar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
