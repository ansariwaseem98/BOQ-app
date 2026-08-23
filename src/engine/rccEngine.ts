/**
 * Deterministic RCC (Reinforced Cement Concrete) & Substructure Calculation Engine
 * Strict engineering arithmetic without language model guessing
 */

import { DetectedElement, CalculationRecord, CalculationAuditStep, DeductionItem } from '../types';

export interface RccCalculationInput {
  type: 'footing' | 'pcc' | 'column' | 'beam' | 'slab' | 'staircase' | 'shear_wall' | 'retaining_wall' | 'ground_beam' | 'pedestal' | 'parapet';
  length: number;
  width: number;
  depthOrThickness: number;
  height?: number;
  count: number;
  slabThicknessDeduction?: number; // for monolithic T-beam calculation
  diameterMm?: number;            // for circular columns / piles
  riserHeight?: number;           // for staircase
  treadWidth?: number;            // for staircase
  stepsCount?: number;            // for staircase
  landingLength?: number;
  landingWidth?: number;
  deductions?: DeductionItem[];
}

export function calculateRccElement(input: RccCalculationInput): CalculationRecord {
  const steps: CalculationAuditStep[] = [];
  let grossQuantity = 0;
  let deductionsTotal = 0;
  let formula = '';
  let expressionWithValues = '';
  let formworkAreaM2 = 0;
  let formworkFormula = '';
  const unit = 'm³';

  const count = Math.max(1, input.count || 1);
  const L = input.length || 0;
  const W = input.width || 0;
  const D = input.depthOrThickness || 0;
  const H = input.height || D;

  switch (input.type) {
    case 'pcc':
    case 'footing':
    case 'pedestal':
    case 'ground_beam':
    case 'parapet': {
      grossQuantity = L * W * D * count;
      formula = 'Length × Width × Depth × Count';
      expressionWithValues = `${L.toFixed(2)}m × ${W.toFixed(2)}m × ${D.toFixed(2)}m × ${count} = ${grossQuantity.toFixed(3)} m³`;
      
      steps.push({
        stepNumber: 1,
        label: `Gross Volume (${input.type.toUpperCase()})`,
        expression: `${L} × ${W} × ${D} × ${count}`,
        subtotal: grossQuantity,
        unit: 'm³',
      });

      // Formwork: 2 * (L + W) * D * count (excluding bottom and top)
      formworkAreaM2 = 2 * (L + W) * D * count;
      formworkFormula = `2 × (${L.toFixed(2)} + ${W.toFixed(2)}) × ${D.toFixed(2)} × ${count} = ${formworkAreaM2.toFixed(2)} m²`;
      break;
    }

    case 'column': {
      if (input.diameterMm && input.diameterMm > 0) {
        // Circular column
        const radius = (input.diameterMm / 1000) / 2;
        const colHeight = H || D;
        grossQuantity = Math.PI * Math.pow(radius, 2) * colHeight * count;
        formula = 'π × (Diameter / 2)² × Height × Count';
        expressionWithValues = `3.14159 × (${(input.diameterMm / 1000).toFixed(2)}/2)² × ${colHeight.toFixed(2)}m × ${count} = ${grossQuantity.toFixed(3)} m³`;
        
        steps.push({
          stepNumber: 1,
          label: 'Circular Column Concrete Volume',
          expression: `π × ${(radius).toFixed(3)}² × ${colHeight} × ${count}`,
          subtotal: grossQuantity,
          unit: 'm³',
        });

        // Formwork: π * D * H * count
        formworkAreaM2 = Math.PI * (input.diameterMm / 1000) * colHeight * count;
        formworkFormula = `π × ${(input.diameterMm / 1000).toFixed(2)} × ${colHeight.toFixed(2)} × ${count} = ${formworkAreaM2.toFixed(2)} m²`;
      } else {
        // Rectangular column
        const colHeight = H || D;
        grossQuantity = L * W * colHeight * count;
        formula = 'Length × Width × Clear Height × Count';
        expressionWithValues = `${L.toFixed(2)}m × ${W.toFixed(2)}m × ${colHeight.toFixed(2)}m × ${count} = ${grossQuantity.toFixed(3)} m³`;

        steps.push({
          stepNumber: 1,
          label: 'Rectangular Column Concrete Volume',
          expression: `${L} × ${W} × ${colHeight} × ${count}`,
          subtotal: grossQuantity,
          unit: 'm³',
        });

        // Formwork: 2 * (L + W) * Height * count
        formworkAreaM2 = 2 * (L + W) * colHeight * count;
        formworkFormula = `2 × (${L.toFixed(2)} + ${W.toFixed(2)}) × ${colHeight.toFixed(2)} × ${count} = ${formworkAreaM2.toFixed(2)} m²`;
      }
      break;
    }

    case 'beam': {
      // For T-beam monolithic casting, web depth = Total Depth - Slab Thickness
      const effectiveDepth = input.slabThicknessDeduction ? Math.max(0.1, D - input.slabThicknessDeduction) : D;
      grossQuantity = L * W * effectiveDepth * count;
      
      if (input.slabThicknessDeduction) {
        formula = 'Length × Width × (Total Depth - Slab Thickness) × Count (Monolithic Web)';
        expressionWithValues = `${L.toFixed(2)}m × ${W.toFixed(2)}m × (${D.toFixed(2)} - ${input.slabThicknessDeduction.toFixed(2)})m × ${count} = ${grossQuantity.toFixed(3)} m³`;
      } else {
        formula = 'Length × Width × Depth × Count';
        expressionWithValues = `${L.toFixed(2)}m × ${W.toFixed(2)}m × ${D.toFixed(2)}m × ${count} = ${grossQuantity.toFixed(3)} m³`;
      }

      steps.push({
        stepNumber: 1,
        label: 'Beam Concrete Volume',
        expression: `${L} × ${W} × ${effectiveDepth.toFixed(2)} × ${count}`,
        subtotal: grossQuantity,
        unit: 'm³',
      });

      // Formwork: Soffit (L * W) + 2 Sides (2 * L * effectiveDepth)
      formworkAreaM2 = (L * W + 2 * L * effectiveDepth) * count;
      formworkFormula = `(${L.toFixed(2)} × ${W.toFixed(2)} + 2 × ${L.toFixed(2)} × ${effectiveDepth.toFixed(2)}) × ${count} = ${formworkAreaM2.toFixed(2)} m²`;
      break;
    }

    case 'slab': {
      const grossArea = L * W * count;
      grossQuantity = grossArea * D;
      formula = 'Gross Slab Area (Length × Width) × Slab Thickness';
      expressionWithValues = `${L.toFixed(2)}m × ${W.toFixed(2)}m × ${count} × ${D.toFixed(2)}m = ${grossQuantity.toFixed(3)} m³`;

      steps.push({
        stepNumber: 1,
        label: `Gross Slab Volume (${D * 1000}mm thk)`,
        expression: `${grossArea.toFixed(2)} m² × ${D.toFixed(2)} m`,
        subtotal: grossQuantity,
        unit: 'm³',
      });

      // Soffit Formwork + Perimeter Edge Formwork
      const perimeter = 2 * (L + W) * count;
      const edgeFormwork = perimeter * D;
      const soffitFormwork = grossArea;
      formworkAreaM2 = soffitFormwork + edgeFormwork;
      formworkFormula = `Soffit (${soffitFormwork.toFixed(2)} m²) + Edge (${edgeFormwork.toFixed(2)} m²) = ${formworkAreaM2.toFixed(2)} m²`;
      break;
    }

    case 'staircase': {
      // Waist slab + Triangular steps + Landings
      const riser = input.riserHeight || 0.15;
      const tread = input.treadWidth || 0.30;
      const stepsCount = input.stepsCount || 10;
      const width = W || 1.2;
      const waistThk = D || 0.15;

      // Incline slope length = sqrt(tread^2 + riser^2) * steps
      const inclinedSlopeLen = Math.sqrt(Math.pow(tread, 2) + Math.pow(riser, 2)) * stepsCount;
      const waistVolume = inclinedSlopeLen * width * waistThk * count;
      
      // Triangular steps volume = 0.5 * tread * riser * width * steps * count
      const stepsVolume = 0.5 * tread * riser * width * stepsCount * count;
      
      // Landing volume
      const landingL = input.landingLength || 1.2;
      const landingW = input.landingWidth || width;
      const landingVolume = landingL * landingW * waistThk * count;

      grossQuantity = waistVolume + stepsVolume + landingVolume;
      formula = 'Waist Slab Vol + Steps Triangular Vol + Landing Slab Vol';
      expressionWithValues = `Waist (${waistVolume.toFixed(3)}) + Steps (${stepsVolume.toFixed(3)}) + Landing (${landingVolume.toFixed(3)}) = ${grossQuantity.toFixed(3)} m³`;

      steps.push({
        stepNumber: 1,
        label: 'Waist Slab (Inclined)',
        expression: `${inclinedSlopeLen.toFixed(2)}m × ${width}m × ${waistThk}m`,
        subtotal: waistVolume,
        unit: 'm³',
      });
      steps.push({
        stepNumber: 2,
        label: 'Steps Triangular Volume',
        expression: `0.5 × ${tread}m × ${riser}m × ${width}m × ${stepsCount}`,
        subtotal: stepsVolume,
        unit: 'm³',
      });
      steps.push({
        stepNumber: 3,
        label: 'Landing Slab Volume',
        expression: `${landingL}m × ${landingW}m × ${waistThk}m`,
        subtotal: landingVolume,
        unit: 'm³',
      });

      // Staircase formwork: Soffit + Risers + Side stringers
      const riserFormwork = stepsCount * riser * width * count;
      const soffitFormwork = (inclinedSlopeLen + landingL) * width * count;
      formworkAreaM2 = soffitFormwork + riserFormwork;
      formworkFormula = `Soffit (${soffitFormwork.toFixed(2)}) + Risers (${riserFormwork.toFixed(2)}) = ${formworkAreaM2.toFixed(2)} m²`;
      break;
    }

    case 'shear_wall':
    case 'retaining_wall': {
      grossQuantity = L * (H || D) * (input.depthOrThickness || 0.2) * count;
      formula = 'Wall Length × Wall Height × Thickness × Count';
      expressionWithValues = `${L.toFixed(2)}m × ${(H || D).toFixed(2)}m × ${D.toFixed(2)}m × ${count} = ${grossQuantity.toFixed(3)} m³`;

      steps.push({
        stepNumber: 1,
        label: 'Shear Wall Concrete Volume',
        expression: `${L} × ${(H || D)} × ${D} × ${count}`,
        subtotal: grossQuantity,
        unit: 'm³',
      });

      // 2 faces formwork
      formworkAreaM2 = 2 * L * (H || D) * count;
      formworkFormula = `2 × ${L.toFixed(2)}m × ${(H || D).toFixed(2)}m × ${count} = ${formworkAreaM2.toFixed(2)} m²`;
      break;
    }
  }

  // Deductions calculation (e.g. openings, shafts, beam intersections)
  if (input.deductions && input.deductions.length > 0) {
    input.deductions.forEach((d, idx) => {
      if (d.isDeductible) {
        const dCount = d.count || 1;
        const dVol = (d.volumeM3 || (d.length * d.width * (d.depth || D))) * dCount;
        deductionsTotal += dVol;
        steps.push({
          stepNumber: steps.length + 1,
          label: `Deduction #${idx + 1}: ${d.name} (${d.type})`,
          expression: `-${d.length.toFixed(2)} × ${d.width.toFixed(2)} × ${(d.depth || D).toFixed(2)} × ${dCount}`,
          subtotal: -dVol,
          unit: 'm³',
        });
      }
    });
  }

  const netQuantity = Math.max(0, grossQuantity - deductionsTotal);

  return {
    formula,
    expressionWithValues,
    grossQuantity: Number(grossQuantity.toFixed(3)),
    deductionsTotal: Number(deductionsTotal.toFixed(3)),
    netQuantity: Number(netQuantity.toFixed(3)),
    unit,
    auditSteps: steps,
    formworkAreaM2: Number(formworkAreaM2.toFixed(2)),
    formworkFormula,
    lastCalculatedAt: new Date().toISOString(),
  };
}
