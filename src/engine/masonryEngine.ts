/**
 * Deterministic Masonry, Architectural & Finishes Calculation Engine
 * Deductions according to IS 1200 / POMI / NRM2 Standard Method of Measurement
 */

import { CalculationRecord, CalculationAuditStep, DeductionItem, MeasurementStandard } from '../types';

export interface MasonryWallInput {
  length: number;
  height: number;
  thickness: number; // in meters (e.g. 0.20m for 200mm block)
  count?: number;
  openings?: {
    id: string;
    name: string; // e.g. "D1 - Main Door", "W2 - Window"
    width: number;
    height: number;
    count: number;
    sillLevel?: number;
    lintelHeight?: number;
  }[];
  standard?: MeasurementStandard;
  includeDpc?: boolean;
  blockDimensionsMm?: { length: number; height: number; width: number }; // default 400x200x200
}

export function calculateMasonryWall(input: MasonryWallInput): {
  wallCalculation: CalculationRecord;
  dpcCalculation?: CalculationRecord;
  plasterInternalCalc: CalculationRecord;
  plasterExternalCalc: CalculationRecord;
  paintInternalCalc: CalculationRecord;
  blockCountEstimate: number;
} {
  const count = Math.max(1, input.count || 1);
  const L = input.length || 0;
  const H = input.height || 0;
  const T = input.thickness || 0.20;
  const standard = input.standard || 'POMI';

  // 1. Gross Wall Area & Volume
  const grossArea = L * H * count;
  const grossVolume = grossArea * T;

  const masonrySteps: CalculationAuditStep[] = [
    {
      stepNumber: 1,
      label: `Gross Wall Area (${L}m × ${H}m × ${count})`,
      expression: `${L} × ${H} × ${count}`,
      subtotal: grossArea,
      unit: 'm²',
    },
    {
      stepNumber: 2,
      label: `Gross Wall Volume (Area × ${T}m Thk)`,
      expression: `${grossArea.toFixed(2)} × ${T}`,
      subtotal: grossVolume,
      unit: 'm³',
    },
  ];

  let totalOpeningArea = 0;
  let totalOpeningVolume = 0;
  let singleFacePlasterDeductionArea = 0;
  let doubleFacePlasterDeductionArea = 0;

  const deductions: DeductionItem[] = [];

  if (input.openings && input.openings.length > 0) {
    input.openings.forEach((op, idx) => {
      const opCount = op.count || 1;
      const opArea = op.width * op.height * opCount;
      const opVolume = opArea * T;
      const individualArea = op.width * op.height;

      let isDeductibleMasonry = true;
      let plasterDeductRule = '';

      // Standard measurement deduction rules
      if (standard === 'IS1200') {
        if (individualArea < 0.1) {
          isDeductibleMasonry = false;
          plasterDeductRule = 'No deduction (area < 0.1 m²)';
        } else if (individualArea <= 0.5) {
          isDeductibleMasonry = true;
          plasterDeductRule = 'Masonry deducted, no plaster deduction (0.1 to 0.5 m²)';
        } else if (individualArea <= 3.0) {
          isDeductibleMasonry = true;
          singleFacePlasterDeductionArea += opArea;
          plasterDeductRule = 'Masonry deducted, 1 face plaster deducted (0.5 to 3.0 m²)';
        } else {
          isDeductibleMasonry = true;
          doubleFacePlasterDeductionArea += opArea;
          plasterDeductRule = 'Masonry deducted, 2 faces plaster deducted (> 3.0 m²)';
        }
      } else {
        // POMI / NRM2: deduct all net openings > 0.1 m2
        if (individualArea >= 0.1) {
          isDeductibleMasonry = true;
          doubleFacePlasterDeductionArea += opArea;
          plasterDeductRule = 'Deduct opening and both faces';
        } else {
          isDeductibleMasonry = false;
          plasterDeductRule = 'No deduction (< 0.1 m²)';
        }
      }

      if (isDeductibleMasonry) {
        totalOpeningArea += opArea;
        totalOpeningVolume += opVolume;

        deductions.push({
          id: op.id || `OP-${idx + 1}`,
          type: op.name.toLowerCase().includes('door') ? 'door' : 'window',
          name: op.name,
          length: op.width,
          width: op.height,
          depth: T,
          count: opCount,
          areaM2: opArea,
          volumeM3: opVolume,
          reason: plasterDeductRule,
          isDeductible: true,
        });

        masonrySteps.push({
          stepNumber: masonrySteps.length + 1,
          label: `Opening Deduction: ${op.name} (${op.width}m × ${op.height}m × ${opCount})`,
          expression: `-${op.width} × ${op.height} × ${opCount} × ${T}m thk`,
          subtotal: -opVolume,
          unit: 'm³',
        });
      }
    });
  }

  const netVolume = Math.max(0, grossVolume - totalOpeningVolume);
  const netArea = Math.max(0, grossArea - totalOpeningArea);

  const wallCalculation: CalculationRecord = {
    formula: '(Gross Wall Area - Deductible Openings) × Wall Thickness',
    expressionWithValues: `(${grossArea.toFixed(2)}m² - ${totalOpeningArea.toFixed(2)}m²) × ${T}m = ${netVolume.toFixed(3)} m³ (${netArea.toFixed(2)} m²)`,
    grossQuantity: Number(grossVolume.toFixed(3)),
    deductionsTotal: Number(totalOpeningVolume.toFixed(3)),
    netQuantity: Number(netVolume.toFixed(3)),
    unit: 'm³',
    auditSteps: masonrySteps,
    lastCalculatedAt: new Date().toISOString(),
  };

  // 2. DPC (Damp Proof Course) under wall: Length * Thickness (m²)
  const dpcArea = L * T * count;
  const dpcCalculation: CalculationRecord = {
    formula: 'Wall Length × Wall Thickness × Count',
    expressionWithValues: `${L.toFixed(2)}m × ${T.toFixed(2)}m × ${count} = ${dpcArea.toFixed(3)} m²`,
    grossQuantity: Number(dpcArea.toFixed(3)),
    deductionsTotal: 0,
    netQuantity: Number(dpcArea.toFixed(3)),
    unit: 'm²',
    auditSteps: [
      {
        stepNumber: 1,
        label: `DPC Under Wall Base (${T * 1000}mm thk wall)`,
        expression: `${L} × ${T} × ${count}`,
        subtotal: dpcArea,
        unit: 'm²',
      },
    ],
    lastCalculatedAt: new Date().toISOString(),
  };

  // 3. Plaster Internal (1 Face minus applicable deductions)
  const internalPlasterGross = grossArea;
  const internalPlasterDeduction = (standard === 'IS1200')
    ? (singleFacePlasterDeductionArea + doubleFacePlasterDeductionArea)
    : doubleFacePlasterDeductionArea;
  const internalPlasterNet = Math.max(0, internalPlasterGross - internalPlasterDeduction);

  const plasterInternalCalc: CalculationRecord = {
    formula: 'Gross Wall Area (1 Face) - Standard Plaster Deductions',
    expressionWithValues: `${internalPlasterGross.toFixed(2)}m² - ${internalPlasterDeduction.toFixed(2)}m² = ${internalPlasterNet.toFixed(2)} m²`,
    grossQuantity: Number(internalPlasterGross.toFixed(2)),
    deductionsTotal: Number(internalPlasterDeduction.toFixed(2)),
    netQuantity: Number(internalPlasterNet.toFixed(2)),
    unit: 'm²',
    auditSteps: [
      {
        stepNumber: 1,
        label: 'Internal Plaster Gross Face',
        expression: `${L} × ${H} × ${count}`,
        subtotal: internalPlasterGross,
        unit: 'm²',
      },
      {
        stepNumber: 2,
        label: 'Opening Deductions',
        expression: `-${internalPlasterDeduction.toFixed(2)}`,
        subtotal: -internalPlasterDeduction,
        unit: 'm²',
      },
    ],
    lastCalculatedAt: new Date().toISOString(),
  };

  // 4. Plaster External
  const plasterExternalCalc: CalculationRecord = {
    ...plasterInternalCalc,
    formula: 'External Face Gross Area - Opening Deductions + Jambs Allowance',
  };

  // 5. Paint Internal (Equals net internal plaster area)
  const paintInternalCalc: CalculationRecord = {
    ...plasterInternalCalc,
    formula: 'Net Plastered Surface Area (1 Primer + 2 Coats Acrylic Emulsion)',
  };

  // 6. Block Count (Standard 400x200x200mm = 12.5 blocks/m2 of elevation wall)
  const blockDim = input.blockDimensionsMm || { length: 400, height: 200, width: 200 };
  const blockFaceAreaM2 = (blockDim.length / 1000) * (blockDim.height / 1000);
  const blockCountEstimate = Math.ceil((netArea / blockFaceAreaM2) * 1.05); // 5% breakage allowance

  return {
    wallCalculation,
    dpcCalculation,
    plasterInternalCalc,
    plasterExternalCalc,
    paintInternalCalc,
    blockCountEstimate,
  };
}
