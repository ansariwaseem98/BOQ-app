/**
 * Deterministic MEP (Mechanical, Electrical, Plumbing & Fire Fighting) Takeoff Engine
 */

import { CalculationRecord, CalculationAuditStep } from '../types';

export interface HvacDuctInput {
  widthMm: number;
  heightMm: number;
  lengthM: number;
  count?: number;
  gauge?: '24G' | '22G' | '20G' | '18G';
  insulationThicknessMm?: number; // e.g. 25mm or 50mm fiberglass/elastomeric
}

export function calculateHvacDuct(input: HvacDuctInput): {
  sheetMetalAreaM2: CalculationRecord;
  insulationAreaM2: CalculationRecord;
  ductWeightKg: number;
} {
  const count = Math.max(1, input.count || 1);
  const wM = input.widthMm / 1000;
  const hM = input.heightMm / 1000;
  const L = input.lengthM;
  
  // Perimeter of rectangular duct = 2 * (Width + Height)
  const perimeterM = 2 * (wM + hM);
  // Sheet metal area with 15% allowance for seams, flanges, bends, transitions (DW144 / SMACNA)
  const baseAreaM2 = perimeterM * L * count;
  const fittingAllowance = 1.15;
  const totalSheetMetalAreaM2 = baseAreaM2 * fittingAllowance;

  // Standard sheet weight kg/m2 by gauge
  const gaugeWeights: Record<string, number> = {
    '24G': 5.86,
    '22G': 7.03,
    '20G': 8.21,
    '18G': 10.55,
  };
  const unitWeightKgM2 = gaugeWeights[input.gauge || '22G'] || 7.03;
  const ductWeightKg = totalSheetMetalAreaM2 * unitWeightKgM2;

  const steps: CalculationAuditStep[] = [
    {
      stepNumber: 1,
      label: `Duct Perimeter (2 × (${input.widthMm}mm + ${input.heightMm}mm))`,
      expression: `2 × (${wM} + ${hM})`,
      subtotal: perimeterM,
      unit: 'm',
    },
    {
      stepNumber: 2,
      label: 'Straight Duct Surface Area',
      expression: `${perimeterM.toFixed(2)}m × ${L}m × ${count}`,
      subtotal: baseAreaM2,
      unit: 'm²',
    },
    {
      stepNumber: 3,
      label: 'Fittings & Flange Allowance (+15% SMACNA/DW144)',
      expression: `${baseAreaM2.toFixed(2)} × 1.15`,
      subtotal: totalSheetMetalAreaM2,
      unit: 'm²',
    },
  ];

  const sheetMetalAreaM2: CalculationRecord = {
    formula: '2 × (Width + Height) × Length × 1.15 (Flanges & Fittings Allowance)',
    expressionWithValues: `2 × (${wM.toFixed(2)}m + ${hM.toFixed(2)}m) × ${L.toFixed(2)}m × ${count} × 1.15 = ${totalSheetMetalAreaM2.toFixed(2)} m² (${ductWeightKg.toFixed(1)} kg @ ${input.gauge || '22G'})`,
    grossQuantity: Number(totalSheetMetalAreaM2.toFixed(2)),
    deductionsTotal: 0,
    netQuantity: Number(totalSheetMetalAreaM2.toFixed(2)),
    unit: 'm²',
    auditSteps: steps,
    lastCalculatedAt: new Date().toISOString(),
  };

  const insulationAreaM2: CalculationRecord = {
    formula: 'Sheet Metal Area + Outer Perimeter Increase Factor',
    expressionWithValues: `${totalSheetMetalAreaM2.toFixed(2)} m² × 1.05 = ${(totalSheetMetalAreaM2 * 1.05).toFixed(2)} m²`,
    grossQuantity: Number((totalSheetMetalAreaM2 * 1.05).toFixed(2)),
    deductionsTotal: 0,
    netQuantity: Number((totalSheetMetalAreaM2 * 1.05).toFixed(2)),
    unit: 'm²',
    auditSteps: [
      {
        stepNumber: 1,
        label: `External Duct Insulation (${input.insulationThicknessMm || 25}mm thk)`,
        expression: `${totalSheetMetalAreaM2.toFixed(2)} × 1.05`,
        subtotal: totalSheetMetalAreaM2 * 1.05,
        unit: 'm²',
      },
    ],
    lastCalculatedAt: new Date().toISOString(),
  };

  return {
    sheetMetalAreaM2,
    insulationAreaM2,
    ductWeightKg: Number(ductWeightKg.toFixed(1)),
  };
}

export interface PipeRunInput {
  system: 'Chilled Water' | 'Drainage' | 'Water Supply' | 'Fire Fighting';
  diameterMm: number;
  material: 'Black Steel' | 'PPR' | 'UPVC' | 'HDPE' | 'Copper';
  lengthM: number;
  count?: number;
  fittingsAllowancePercent?: number; // e.g. 10% for elbows, tees, couplings
}

export function calculatePipeRun(input: PipeRunInput): CalculationRecord {
  const count = Math.max(1, input.count || 1);
  const L = input.lengthM * count;
  const allowancePercent = input.fittingsAllowancePercent ?? 10.0;
  const netPipeLengthM = L * (1 + allowancePercent / 100);

  const steps: CalculationAuditStep[] = [
    {
      stepNumber: 1,
      label: `Base Pipe Run (${input.lengthM}m × ${count})`,
      expression: `${input.lengthM} × ${count}`,
      subtotal: L,
      unit: 'm',
    },
    {
      stepNumber: 2,
      label: `Fittings & Joinery Allowance (+${allowancePercent}%)`,
      expression: `${L.toFixed(2)} × ${(1 + allowancePercent / 100).toFixed(2)}`,
      subtotal: netPipeLengthM,
      unit: 'm',
    },
  ];

  return {
    formula: 'Pipe Length × Count × (1 + Fittings Allowance %)',
    expressionWithValues: `${input.lengthM.toFixed(2)}m × ${count} × 1.${allowancePercent} = ${netPipeLengthM.toFixed(2)} Lm (DN${input.diameterMm} ${input.material})`,
    grossQuantity: Number(netPipeLengthM.toFixed(2)),
    deductionsTotal: 0,
    netQuantity: Number(netPipeLengthM.toFixed(2)),
    unit: 'm',
    auditSteps: steps,
    lastCalculatedAt: new Date().toISOString(),
  };
}
