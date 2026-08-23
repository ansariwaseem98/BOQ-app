/**
 * Deterministic Bar Bending Schedule (BBS) & Reinforcement Calculation Engine
 * Strict BS 8666 / IS 2502 calculation standards
 */

import { BbsBarRecord, BarShapeCode, SteelRebarGrade, VerificationStatus } from '../types';

export const REBAR_UNIT_WEIGHTS: Record<number, number> = {
  8: 0.395,   // 8^2 / 162.28
  10: 0.617,  // 10^2 / 162.28
  12: 0.888,  // 12^2 / 162.28
  16: 1.579,  // 16^2 / 162.28
  20: 2.466,  // 20^2 / 162.28
  25: 3.854,  // 25^2 / 162.28
  32: 6.313,  // 32^2 / 162.28
  40: 9.865,  // 40^2 / 162.28
};

export interface BbsInput {
  barMark: string;
  memberId: string;
  memberName: string;
  level: string;
  diameterMm: 8 | 10 | 12 | 16 | 20 | 25 | 32 | 40;
  rebarGrade?: SteelRebarGrade;
  shapeCode: BarShapeCode;
  aMm: number;
  bMm?: number;
  cMm?: number;
  dMm?: number;
  eMm?: number;
  hookLengthMm?: number;
  lapLengthMm?: number;
  spacingMm?: number;
  spanLengthMm?: number;
  memberCount?: number;
  barsPerMember?: number;
  drawingReference: string;
  drawingId: string;
  status?: VerificationStatus;
}

export function calculateCuttingLength(input: BbsInput): {
  cuttingLengthM: number;
  formulaString: string;
  shapeDescription: string;
} {
  const d = input.diameterMm;
  const A = input.aMm || 0;
  const B = input.bMm || 0;
  const C = input.cMm || 0;
  const D = input.dMm || 0;
  const E = input.eMm || 0;
  const hook = input.hookLengthMm || (9 * d); // Standard 9d hook for 90 deg or 12d for 135 deg

  let lengthMm = 0;
  let formulaString = '';
  let shapeDescription = '';

  switch (input.shapeCode) {
    case '00': // Straight bar
      lengthMm = A;
      formulaString = `A = ${A}mm`;
      shapeDescription = 'Straight Main Bar';
      break;

    case '11': // Single 90 bend (L-Bar)
      // Length = A + B - 2d (bend deduction 2d for 90°)
      const bend11 = 2 * d;
      lengthMm = A + B - bend11;
      formulaString = `A (${A}) + B (${B}) - 2d (${bend11}) = ${lengthMm}mm`;
      shapeDescription = 'L-Bar (90° Bend)';
      break;

    case '21': // U-Bar / Two 90 bends
      const bend21 = 4 * d; // 2 bends * 2d
      lengthMm = A + B + C - bend21;
      formulaString = `A (${A}) + B (${B}) + C (${C}) - 4d (${bend21}) = ${lengthMm}mm`;
      shapeDescription = 'U-Bar (Double 90° Bends)';
      break;

    case '31': // Cranked bar for slabs / beams
      // Crank length offset = 0.42 * D (for 45° crank) or 0.58 * D (for 30°)
      const crankExtra = Math.round(0.42 * D);
      const bend31 = 2 * d;
      lengthMm = A + B + C + crankExtra - bend31;
      formulaString = `A (${A}) + B (${B}) + C (${C}) + 0.42D (${crankExtra}) - 2d = ${lengthMm}mm`;
      shapeDescription = 'Cranked Bar (45° Bent-up)';
      break;

    case '41': // Rectangular Beam Stirrup
      // Perimeter = 2*(A + B) + 2 * hooks (24d total) - 5 bends (3*90° + 2*135°)
      const hook41 = 2 * (10 * d);
      const bend41 = 3 * (2 * d) + 2 * (3 * d); // 12d bend deduction
      lengthMm = 2 * (A + B) + hook41 - bend41;
      formulaString = `2×(A+B) [2×(${A}+${B})] + 2×10d (${hook41}) - 12d bend (${bend41}) = ${lengthMm}mm`;
      shapeDescription = 'Beam Stirrup (Closed Link)';
      break;

    case '51': // Column Tie / Seismic Link with 135° hooks
      const hook51 = 2 * (12 * d); // 12d seismic hook
      const bend51 = 3 * (2 * d) + 2 * (4 * d); // 14d bend deduction
      lengthMm = 2 * (A + B) + hook51 - bend51;
      formulaString = `2×(A+B) [2×(${A}+${B})] + 2×12d (${hook51}) - 14d bend (${bend51}) = ${lengthMm}mm`;
      shapeDescription = 'Column Link (135° Seismic Hooks)';
      break;

    case '61': // Circular Column Ring / Spiral
      const circumference = Math.PI * A;
      const lap61 = input.lapLengthMm || (45 * d);
      lengthMm = Math.round(circumference + lap61);
      formulaString = `π × Dia (${A}) + Lap 45d (${lap61}) = ${lengthMm}mm`;
      shapeDescription = 'Circular Ring / Spiral Link';
      break;

    case '71': // Chair Bar for Top Mat Slab
      // Top horizontal + 2 vertical legs + 2 bottom feet
      lengthMm = A + 2 * B + 2 * C;
      formulaString = `A (${A}) + 2×B (2×${B}) + 2×C (2×${C}) = ${lengthMm}mm`;
      shapeDescription = 'Chair Bar Support';
      break;

    case '99': // Custom
    default:
      lengthMm = A + B + C + D + E;
      formulaString = `A+B+C+D+E = ${lengthMm}mm`;
      shapeDescription = 'Custom Rebar Profile';
      break;
  }

  return {
    cuttingLengthM: Number((lengthMm / 1000).toFixed(3)),
    formulaString,
    shapeDescription,
  };
}

export function generateBbsRecord(input: BbsInput): BbsBarRecord {
  const { cuttingLengthM, formulaString, shapeDescription } = calculateCuttingLength(input);
  
  // Bars calculation
  let barsPerMember = input.barsPerMember || 1;
  if (input.spacingMm && input.spacingMm > 0 && input.spanLengthMm && input.spanLengthMm > 0) {
    // Number of bars = (Span / Spacing) + 1
    barsPerMember = Math.floor(input.spanLengthMm / input.spacingMm) + 1;
  }

  const memberCount = Math.max(1, input.memberCount || 1);
  const totalBars = barsPerMember * memberCount;
  const totalLengthM = Number((cuttingLengthM * totalBars).toFixed(2));
  
  const unitWeight = REBAR_UNIT_WEIGHTS[input.diameterMm] || Number((Math.pow(input.diameterMm, 2) / 162.28).toFixed(3));
  const totalWeightKg = Number((totalLengthM * unitWeight).toFixed(2));

  return {
    id: `BBS-${input.barMark}-${Date.now().toString(36).slice(-4)}`,
    barMark: input.barMark,
    memberId: input.memberId,
    memberName: input.memberName,
    level: input.level,
    diameterMm: input.diameterMm,
    rebarGrade: input.rebarGrade || 'Fe500D',
    shapeCode: input.shapeCode,
    shapeDescription,
    aMm: input.aMm,
    bMm: input.bMm,
    cMm: input.cMm,
    dMm: input.dMm,
    eMm: input.eMm,
    hookLengthMm: input.hookLengthMm,
    lapLengthMm: input.lapLengthMm,
    spacingMm: input.spacingMm,
    memberCount,
    barsPerMember,
    totalBars,
    cuttingLengthM,
    cuttingFormula: formulaString,
    totalLengthM,
    unitWeightKgM: unitWeight,
    totalWeightKg,
    drawingReference: input.drawingReference,
    drawingId: input.drawingId,
    status: input.status || 'verified',
  };
}

export interface BbsDiameterSummary {
  diameterMm: number;
  totalLengthM: number;
  unitWeightKgM: number;
  totalWeightKg: number;
  totalWeightTons: number;
  wastageKg: number; // e.g. 3%
  grandTotalKg: number;
}

export function computeBbsSummary(records: BbsBarRecord[], wastagePercent = 3.0): {
  byDiameter: BbsDiameterSummary[];
  totalWeightKg: number;
  totalWeightTons: number;
  grandTotalWeightTonsWithWastage: number;
} {
  const map = new Map<number, { length: number; weight: number }>();
  
  const standardDias = [8, 10, 12, 16, 20, 25, 32, 40];
  standardDias.forEach((d) => map.set(d, { length: 0, weight: 0 }));

  records.forEach((r) => {
    const existing = map.get(r.diameterMm) || { length: 0, weight: 0 };
    existing.length += r.totalLengthM;
    existing.weight += r.totalWeightKg;
    map.set(r.diameterMm, existing);
  });

  const byDiameter: BbsDiameterSummary[] = [];
  let totalWeightKg = 0;

  standardDias.forEach((d) => {
    const data = map.get(d) || { length: 0, weight: 0 };
    if (data.length > 0) {
      const unitW = REBAR_UNIT_WEIGHTS[d] || (d * d) / 162.28;
      const wastage = data.weight * (wastagePercent / 100);
      const grandTotal = data.weight + wastage;
      totalWeightKg += data.weight;

      byDiameter.push({
        diameterMm: d,
        totalLengthM: Number(data.length.toFixed(2)),
        unitWeightKgM: unitW,
        totalWeightKg: Number(data.weight.toFixed(2)),
        totalWeightTons: Number((data.weight / 1000).toFixed(3)),
        wastageKg: Number(wastage.toFixed(2)),
        grandTotalKg: Number(grandTotal.toFixed(2)),
      });
    }
  });

  const totalWeightTons = Number((totalWeightKg / 1000).toFixed(3));
  const grandTotalWeightTonsWithWastage = Number((totalWeightTons * (1 + wastagePercent / 100)).toFixed(3));

  return {
    byDiameter,
    totalWeightKg: Number(totalWeightKg.toFixed(2)),
    totalWeightTons,
    grandTotalWeightTonsWithWastage,
  };
}
