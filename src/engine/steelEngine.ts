/**
 * Deterministic Structural Steel, Roofing & Cladding Calculation Engine
 */

import { CalculationRecord, CalculationAuditStep, StructuralSteelGrade } from '../types';

export interface SteelSectionInfo {
  designation: string; // e.g. "UB 457x191x67", "UC 203x203x46", "HEA 200", "SHS 100x100x6"
  type: 'UB' | 'UC' | 'HEA' | 'HEB' | 'IPE' | 'RHS' | 'SHS' | 'Angle' | 'Channel' | 'Purlin' | 'Plate';
  unitWeightKgM: number; // weight in kg per meter
  depthMm: number;
  widthMm: number;
  webThkMm: number;
  flangeThkMm: number;
}

export const STANDARD_STEEL_CATALOG: Record<string, SteelSectionInfo> = {
  'UB 457x191x67': { designation: 'UB 457x191x67', type: 'UB', unitWeightKgM: 67.2, depthMm: 453.4, widthMm: 189.9, webThkMm: 8.5, flangeThkMm: 12.7 },
  'UB 406x178x54': { designation: 'UB 406x178x54', type: 'UB', unitWeightKgM: 54.1, depthMm: 402.6, widthMm: 177.7, webThkMm: 7.7, flangeThkMm: 10.9 },
  'UB 356x171x45': { designation: 'UB 356x171x45', type: 'UB', unitWeightKgM: 45.0, depthMm: 351.4, widthMm: 171.1, webThkMm: 7.0, flangeThkMm: 9.7 },
  'UB 305x165x40': { designation: 'UB 305x165x40', type: 'UB', unitWeightKgM: 40.3, depthMm: 303.4, widthMm: 165.0, webThkMm: 6.0, flangeThkMm: 10.2 },
  'UB 254x146x31': { designation: 'UB 254x146x31', type: 'UB', unitWeightKgM: 31.1, depthMm: 251.4, widthMm: 146.1, webThkMm: 6.0, flangeThkMm: 8.6 },
  
  'UC 254x254x73': { designation: 'UC 254x254x73', type: 'UC', unitWeightKgM: 73.1, depthMm: 254.1, widthMm: 254.6, webThkMm: 8.6, flangeThkMm: 14.2 },
  'UC 203x203x46': { designation: 'UC 203x203x46', type: 'UC', unitWeightKgM: 46.1, depthMm: 203.2, widthMm: 203.6, webThkMm: 7.2, flangeThkMm: 11.0 },
  'UC 152x152x30': { designation: 'UC 152x152x30', type: 'UC', unitWeightKgM: 30.0, depthMm: 157.5, widthMm: 152.9, webThkMm: 6.5, flangeThkMm: 9.4 },
  
  'IPE 300': { designation: 'IPE 300', type: 'IPE', unitWeightKgM: 42.2, depthMm: 300, widthMm: 150, webThkMm: 7.1, flangeThkMm: 10.7 },
  'IPE 240': { designation: 'IPE 240', type: 'IPE', unitWeightKgM: 30.7, depthMm: 240, widthMm: 120, webThkMm: 6.2, flangeThkMm: 9.8 },
  'HEA 240': { designation: 'HEA 240', type: 'HEA', unitWeightKgM: 60.3, depthMm: 230, widthMm: 240, webThkMm: 7.5, flangeThkMm: 12.0 },
  'HEA 200': { designation: 'HEA 200', type: 'HEA', unitWeightKgM: 42.3, depthMm: 190, widthMm: 200, webThkMm: 6.5, flangeThkMm: 10.0 },
  'HEB 200': { designation: 'HEB 200', type: 'HEB', unitWeightKgM: 61.3, depthMm: 200, widthMm: 200, webThkMm: 9.0, flangeThkMm: 15.0 },

  'SHS 150x150x6.3': { designation: 'SHS 150x150x6.3', type: 'SHS', unitWeightKgM: 28.3, depthMm: 150, widthMm: 150, webThkMm: 6.3, flangeThkMm: 6.3 },
  'SHS 100x100x5': { designation: 'SHS 100x100x5', type: 'SHS', unitWeightKgM: 14.8, depthMm: 100, widthMm: 100, webThkMm: 5.0, flangeThkMm: 5.0 },
  'RHS 200x100x6': { designation: 'RHS 200x100x6', type: 'RHS', unitWeightKgM: 26.8, depthMm: 200, widthMm: 100, webThkMm: 6.0, flangeThkMm: 6.0 },
  'RHS 150x75x5': { designation: 'RHS 150x75x5', type: 'RHS', unitWeightKgM: 16.8, depthMm: 150, widthMm: 75, webThkMm: 5.0, flangeThkMm: 5.0 },
  
  'L 100x100x10': { designation: 'L 100x100x10', type: 'Angle', unitWeightKgM: 15.0, depthMm: 100, widthMm: 100, webThkMm: 10.0, flangeThkMm: 10.0 },
  'L 75x75x6': { designation: 'L 75x75x6', type: 'Angle', unitWeightKgM: 6.85, depthMm: 75, widthMm: 75, webThkMm: 6.0, flangeThkMm: 6.0 },

  'Z-Purlin 200x65x2.0': { designation: 'Z-Purlin 200x65x2.0', type: 'Purlin', unitWeightKgM: 5.45, depthMm: 200, widthMm: 65, webThkMm: 2.0, flangeThkMm: 2.0 },
  'Z-Purlin 250x75x2.5': { designation: 'Z-Purlin 250x75x2.5', type: 'Purlin', unitWeightKgM: 8.12, depthMm: 250, widthMm: 75, webThkMm: 2.5, flangeThkMm: 2.5 },
  'C-Girt 150x50x1.8': { designation: 'C-Girt 150x50x1.8', type: 'Purlin', unitWeightKgM: 3.82, depthMm: 150, widthMm: 50, webThkMm: 1.8, flangeThkMm: 1.8 },
};

export interface SteelMemberInput {
  sectionKey: string;
  length: number; // in meters
  count: number;
  grade?: StructuralSteelGrade;
  connectionAllowancePercent?: number; // default 5-8% for gusset plates, bolts, splices
  paintSpec?: string;
}

export function calculateSteelMember(input: SteelMemberInput): CalculationRecord {
  const section = STANDARD_STEEL_CATALOG[input.sectionKey] || {
    designation: input.sectionKey || 'Custom Section',
    type: 'UB',
    unitWeightKgM: 50.0,
    depthMm: 300,
    widthMm: 150,
    webThkMm: 8,
    flangeThkMm: 12,
  };

  const count = Math.max(1, input.count || 1);
  const L = input.length || 0;
  const totalLengthM = L * count;
  const baseWeightKg = totalLengthM * section.unitWeightKgM;
  const allowancePercent = input.connectionAllowancePercent ?? 5.0; // 5% for connection plates/weld
  const connectionWeightKg = baseWeightKg * (allowancePercent / 100);
  const totalWeightKg = baseWeightKg + connectionWeightKg;
  const totalWeightTons = totalWeightKg / 1000;

  const steps: CalculationAuditStep[] = [
    {
      stepNumber: 1,
      label: `Total Member Length (${L}m × ${count})`,
      expression: `${L} × ${count}`,
      subtotal: totalLengthM,
      unit: 'm',
    },
    {
      stepNumber: 2,
      label: `Base Steel Weight (${section.designation} @ ${section.unitWeightKgM} kg/m)`,
      expression: `${totalLengthM.toFixed(2)}m × ${section.unitWeightKgM} kg/m`,
      subtotal: baseWeightKg,
      unit: 'kg',
    },
    {
      stepNumber: 3,
      label: `Connections & Gusset Plates Allowance (${allowancePercent}%)`,
      expression: `+${baseWeightKg.toFixed(2)} × ${allowancePercent}%`,
      subtotal: connectionWeightKg,
      unit: 'kg',
    },
    {
      stepNumber: 4,
      label: 'Total Structural Steel Weight',
      expression: `${baseWeightKg.toFixed(2)} + ${connectionWeightKg.toFixed(2)}`,
      subtotal: totalWeightTons,
      unit: 'Ton',
    },
  ];

  return {
    formula: 'Length × Count × Section Unit Weight (kg/m) × (1 + Connection Allowance %)',
    expressionWithValues: `${L.toFixed(2)}m × ${count} × ${section.unitWeightKgM} kg/m × 1.${allowancePercent} = ${totalWeightTons.toFixed(3)} Tons (${totalWeightKg.toFixed(2)} kg)`,
    grossQuantity: Number(totalWeightTons.toFixed(3)),
    deductionsTotal: 0,
    netQuantity: Number(totalWeightTons.toFixed(3)),
    unit: 'Ton',
    auditSteps: steps,
    lastCalculatedAt: new Date().toISOString(),
  };
}

export interface SlopedRoofInput {
  buildingLength: number;
  halfSpan: number; // horizontal distance from eave to ridge
  ridgeRise?: number; // vertical height of ridge
  pitchDegrees?: number; // e.g. 5.71° for 1:10 slope
  countRafters?: number;
  purlinSpacingM?: number; // e.g. 1.25m
  eaveOverhangM?: number;  // e.g. 0.6m
  skylightPercent?: number; // e.g. 5%
}

export function calculateSlopedRoofCladding(input: SlopedRoofInput): {
  claddingCalculation: CalculationRecord;
  purlinsCalculation: CalculationRecord;
  ridgeFlashingCalculation: CalculationRecord;
  eaveGuttersCalculation: CalculationRecord;
  skylightAreaM2: number;
} {
  const L = input.buildingLength || 0;
  const halfSpan = input.halfSpan || 0;
  const overhang = input.eaveOverhangM || 0.6;
  const totalHorizontalHalf = halfSpan + overhang;

  // Sloped rafter length = sqrt(Run^2 + Rise^2) or Run / cos(pitch)
  let slopedLengthOneSide = 0;
  let slopeAngleDeg = 0;

  if (input.ridgeRise && input.ridgeRise > 0) {
    slopedLengthOneSide = Math.sqrt(Math.pow(totalHorizontalHalf, 2) + Math.pow(input.ridgeRise, 2));
    slopeAngleDeg = (Math.atan(input.ridgeRise / halfSpan) * 180) / Math.PI;
  } else if (input.pitchDegrees && input.pitchDegrees > 0) {
    slopeAngleDeg = input.pitchDegrees;
    const rad = (slopeAngleDeg * Math.PI) / 180;
    slopedLengthOneSide = totalHorizontalHalf / Math.cos(rad);
  } else {
    // Default 1:10 pitch (~5.71 deg)
    slopeAngleDeg = 5.71;
    const rad = (slopeAngleDeg * Math.PI) / 180;
    slopedLengthOneSide = totalHorizontalHalf / Math.cos(rad);
  }

  // 2 sloped sides for gable roof
  const totalRoofAreaGross = 2 * slopedLengthOneSide * L;
  const skylightPercent = input.skylightPercent || 0;
  const skylightAreaM2 = totalRoofAreaGross * (skylightPercent / 100);
  const netCladdingAreaM2 = totalRoofAreaGross - skylightAreaM2;

  const claddingSteps: CalculationAuditStep[] = [
    {
      stepNumber: 1,
      label: `Sloped Length Per Side (${totalHorizontalHalf.toFixed(2)}m run @ ${slopeAngleDeg.toFixed(1)}° pitch)`,
      expression: `√(${totalHorizontalHalf.toFixed(2)}² + Rise²)`,
      subtotal: slopedLengthOneSide,
      unit: 'm',
    },
    {
      stepNumber: 2,
      label: `Gross Gable Roof Area (2 Sides × ${L}m Length)`,
      expression: `2 × ${slopedLengthOneSide.toFixed(2)}m × ${L}m`,
      subtotal: totalRoofAreaGross,
      unit: 'm²',
    },
  ];

  if (skylightAreaM2 > 0) {
    claddingSteps.push({
      stepNumber: 3,
      label: `Skylight Deduction (${skylightPercent}%)`,
      expression: `-${totalRoofAreaGross.toFixed(2)} × ${skylightPercent}%`,
      subtotal: -skylightAreaM2,
      unit: 'm²',
    }, {
      stepNumber: 4,
      label: 'Net Insulated Sandwich Roof Cladding',
      expression: `${totalRoofAreaGross.toFixed(2)} - ${skylightAreaM2.toFixed(2)}`,
      subtotal: netCladdingAreaM2,
      unit: 'm²',
    });
  }

  const claddingCalculation: CalculationRecord = {
    formula: '2 × Sloped Rafter Length (√(Run² + Rise²)) × Building Length - Skylights',
    expressionWithValues: `2 × ${slopedLengthOneSide.toFixed(2)}m × ${L.toFixed(2)}m = ${totalRoofAreaGross.toFixed(2)} m² (Net: ${netCladdingAreaM2.toFixed(2)} m²)`,
    grossQuantity: Number(totalRoofAreaGross.toFixed(2)),
    deductionsTotal: Number(skylightAreaM2.toFixed(2)),
    netQuantity: Number(netCladdingAreaM2.toFixed(2)),
    unit: 'm²',
    auditSteps: claddingSteps,
    lastCalculatedAt: new Date().toISOString(),
  };

  // Purlins: Spacing (e.g. 1.25m) -> Number of purlin lines per side
  const purlinSpacing = input.purlinSpacingM || 1.25;
  const purlinLinesPerSide = Math.ceil(slopedLengthOneSide / purlinSpacing) + 1;
  const totalPurlinLines = 2 * purlinLinesPerSide;
  const totalPurlinLengthM = totalPurlinLines * L;
  const purlinUnitWeight = 5.45; // Z200x65x2.0 kg/m
  const purlinsWeightTon = (totalPurlinLengthM * purlinUnitWeight) / 1000;

  const purlinsCalculation: CalculationRecord = {
    formula: 'Total Purlin Lines (2 × ⌈Slope / Spacing⌉) × Building Length',
    expressionWithValues: `${totalPurlinLines} lines × ${L.toFixed(2)}m = ${totalPurlinLengthM.toFixed(2)} Lm (${purlinsWeightTon.toFixed(3)} Ton)`,
    grossQuantity: Number(totalPurlinLengthM.toFixed(2)),
    deductionsTotal: 0,
    netQuantity: Number(totalPurlinLengthM.toFixed(2)),
    unit: 'm',
    auditSteps: [
      {
        stepNumber: 1,
        label: `Purlin Lines (${purlinLinesPerSide} per slope side @ ${purlinSpacing}m c/c)`,
        expression: `2 × ${purlinLinesPerSide} lines`,
        subtotal: totalPurlinLines,
        unit: 'Nr',
      },
      {
        stepNumber: 2,
        label: 'Total Purlin Length',
        expression: `${totalPurlinLines} × ${L}m`,
        subtotal: totalPurlinLengthM,
        unit: 'm',
      },
    ],
    lastCalculatedAt: new Date().toISOString(),
  };

  // Ridge Flashing: 1 line along roof ridge
  const ridgeFlashingCalculation: CalculationRecord = {
    formula: 'Building Length + 5% Overlap',
    expressionWithValues: `${L.toFixed(2)}m × 1.05 = ${(L * 1.05).toFixed(2)} Lm`,
    grossQuantity: Number((L * 1.05).toFixed(2)),
    deductionsTotal: 0,
    netQuantity: Number((L * 1.05).toFixed(2)),
    unit: 'm',
    auditSteps: [
      {
        stepNumber: 1,
        label: 'Ridge Flashing with Lap',
        expression: `${L} × 1.05`,
        subtotal: L * 1.05,
        unit: 'm',
      },
    ],
    lastCalculatedAt: new Date().toISOString(),
  };

  // Eave Gutters: 2 sides * Building length
  const eaveGuttersCalculation: CalculationRecord = {
    formula: '2 × Building Length (Both Eaves) + Lap',
    expressionWithValues: `2 × ${L.toFixed(2)}m × 1.05 = ${(2 * L * 1.05).toFixed(2)} Lm`,
    grossQuantity: Number((2 * L * 1.05).toFixed(2)),
    deductionsTotal: 0,
    netQuantity: Number((2 * L * 1.05).toFixed(2)),
    unit: 'm',
    auditSteps: [
      {
        stepNumber: 1,
        label: 'Box Gutters (2 Eave Sides)',
        expression: `2 × ${L} × 1.05`,
        subtotal: 2 * L * 1.05,
        unit: 'm',
      },
    ],
    lastCalculatedAt: new Date().toISOString(),
  };

  return {
    claddingCalculation,
    purlinsCalculation,
    ridgeFlashingCalculation,
    eaveGuttersCalculation,
    skylightAreaM2: Number(skylightAreaM2.toFixed(2)),
  };
}
