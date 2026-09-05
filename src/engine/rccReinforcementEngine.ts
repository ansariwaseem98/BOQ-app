/**
 * PHASE 5 — RCC REINFORCEMENT ENGINE + PROFESSIONAL BBS
 * Deterministic Bar Bending Schedule calculation engine adhering strictly to BS 8666 / IS 2502 / Eurocode 2
 * ZERO GUESSWORK: Rebar must never be invented. Missing inputs trigger OPEN ITEM blocking.
 */

import {
  RccElementCategory,
  RccElementRegisterItem,
  RccRebarRegisterItem,
  RebarType,
  BarCountRule,
  RebarHookInfo,
  RebarBendInfo,
  RebarLapInfo,
  RebarAnchorageInfo,
  BbsVerificationStatus,
  BbsSummaryData,
  BbsRevisionDelta,
  RebarConflictRecord,
  SteelRebarGrade,
  CalculationAuditRecord,
  DrawingBoundingBox
} from '../types';

// =========================================================================
// 1. REBAR UNIT WEIGHT MATRIX (d² / 162.28 standard or project override)
// =========================================================================

export const STANDARD_REBAR_DIAMETERS = [6, 8, 10, 12, 16, 20, 25, 28, 32, 36, 40] as const;

export const STANDARD_UNIT_WEIGHTS: Record<number, number> = {
  6: 0.222,   // 6² / 162.28
  8: 0.395,   // 8² / 162.28
  10: 0.617,  // 10² / 162.28
  12: 0.888,  // 12² / 162.28
  16: 1.579,  // 16² / 162.28 (or 1.580 for /162)
  20: 2.466,  // 20² / 162.28
  25: 3.854,  // 25² / 162.28
  28: 4.834,  // 28² / 162.28
  32: 6.313,  // 32² / 162.28
  36: 7.990,  // 36² / 162.28
  40: 9.865,  // 40² / 162.28
};

/**
 * Calculates unit weight in kg/m from diameter using d² / 162.28
 */
export function calculateRebarUnitWeight(
  diameterMm: number,
  overrideTable?: Record<number, number>
): { unitWeightKgM: number; source: 'DEFAULT_FORMULA' | 'PROJECT_OVERRIDE'; formula: string } {
  if (overrideTable && overrideTable[diameterMm] !== undefined) {
    return {
      unitWeightKgM: overrideTable[diameterMm],
      source: 'PROJECT_OVERRIDE',
      formula: `Project Table Override: ${overrideTable[diameterMm].toFixed(3)} kg/m`,
    };
  }
  
  if (STANDARD_UNIT_WEIGHTS[diameterMm]) {
    return {
      unitWeightKgM: STANDARD_UNIT_WEIGHTS[diameterMm],
      source: 'DEFAULT_FORMULA',
      formula: `d² / 162 = (${diameterMm}² / 162.28) = ${STANDARD_UNIT_WEIGHTS[diameterMm].toFixed(3)} kg/m`,
    };
  }

  // Any custom diameter calculation
  const calculated = Number(((diameterMm * diameterMm) / 162.28).toFixed(3));
  return {
    unitWeightKgM: calculated,
    source: 'DEFAULT_FORMULA',
    formula: `d² / 162 = (${diameterMm}² / 162.28) = ${calculated.toFixed(3)} kg/m`,
  };
}

// =========================================================================
// 2. BAR COUNT CALCULATION BY CONFIGURABLE RULE
// =========================================================================

export function calculateBarCount(
  distributionLengthMm: number | null,
  spacingMm: number | null,
  rule: BarCountRule,
  manualQuantity?: number | null
): {
  count: number;
  spaces: number;
  formulaString: string;
  isMissing: boolean;
} {
  if (rule === 'MANUAL' || (!spacingMm && manualQuantity)) {
    const qty = manualQuantity || 1;
    return {
      count: qty,
      spaces: Math.max(0, qty - 1),
      formulaString: `Manual Specification = ${qty} Bars`,
      isMissing: false,
    };
  }

  if (!distributionLengthMm || !spacingMm || spacingMm <= 0) {
    return {
      count: 0,
      spaces: 0,
      formulaString: 'Distribution length or spacing missing (Open Item Required)',
      isMissing: true,
    };
  }

  const exactSpaces = distributionLengthMm / spacingMm;
  let count = 0;
  let spaces = 0;
  let formulaString = '';

  switch (rule) {
    case 'CEILING_PLUS_1':
      spaces = Math.ceil(exactSpaces);
      count = spaces + 1;
      formulaString = `CEILING(${distributionLengthMm} / ${spacingMm}) + 1 = ${spaces} + 1 = ${count} Bars`;
      break;
    case 'CEILING':
      spaces = Math.ceil(exactSpaces);
      count = spaces;
      formulaString = `CEILING(${distributionLengthMm} / ${spacingMm}) = ${count} Bars`;
      break;
    case 'ROUND_PLUS_1':
      spaces = Math.round(exactSpaces);
      count = spaces + 1;
      formulaString = `ROUND(${distributionLengthMm} / ${spacingMm}) + 1 = ${spaces} + 1 = ${count} Bars`;
      break;
    default:
      spaces = Math.ceil(exactSpaces);
      count = spaces + 1;
      formulaString = `CEILING(${distributionLengthMm} / ${spacingMm}) + 1 = ${count} Bars`;
      break;
  }

  return {
    count,
    spaces,
    formulaString,
    isMissing: false,
  };
}

// =========================================================================
// 3. BAR SHAPE SYSTEM & CUTTING LENGTH ENGINE (BS 8666 / IS 2502)
// =========================================================================

export interface CuttingLengthComputationInput {
  shapeCode: string;
  diameterMm: number;
  aMm: number;
  bMm?: number;
  cMm?: number;
  dMm?: number;
  eMm?: number;
  fMm?: number;
  radiusMm?: number;
  coverMm?: number | null;
  hook?: Partial<RebarHookInfo>;
  bend?: Partial<RebarBendInfo>;
  lap?: Partial<RebarLapInfo>;
  anchorage?: Partial<RebarAnchorageInfo>;
  stockLengthLimitM?: number; // default 12.0m
}

export interface CuttingLengthResult {
  cuttingLengthM: number;
  cuttingLengthMm: number;
  formulaNotation: string;
  formulaWithValues: string;
  shapeDescription: string;
  stockLengthExceeded: boolean;
  hookInfo: RebarHookInfo;
  bendInfo: RebarBendInfo;
  lapInfo: RebarLapInfo;
  anchorageInfo: RebarAnchorageInfo;
  isBlocked: boolean;
  blockedReason?: string;
}

export function computeCuttingLength(input: CuttingLengthComputationInput): CuttingLengthResult {
  const d = input.diameterMm || 0;
  const A = input.aMm || 0;
  const B = input.bMm || 0;
  const C = input.cMm || 0;
  const D = input.dMm || 0;
  const E = input.eMm || 0;
  const F = input.fMm || 0;
  const stockLimitM = input.stockLengthLimitM || 12.0;

  // Validation checks
  if (!d || d <= 0) {
    return {
      cuttingLengthM: 0,
      cuttingLengthMm: 0,
      formulaNotation: 'CL = N/A',
      formulaWithValues: 'Rebar diameter is missing or invalid',
      shapeDescription: 'Unknown Profile',
      stockLengthExceeded: false,
      hookInfo: { angleDeg: 0, hookCount: 0, hookLengthMm: 0, formula: 'None', extensionRule: 'None' },
      bendInfo: { bendCount: 0, bendAngleDeg: 0, bendDeductionMm: 0, formula: 'None', deductionRule: 'None' },
      lapInfo: { lapRequired: false, lapLengthMm: 0, numberOfLaps: 0, totalLapLengthMm: 0, lapRule: 'None', isMissing: false },
      anchorageInfo: { isMissing: false },
      isBlocked: true,
      blockedReason: 'Bar diameter is missing',
    };
  }

  if (A <= 0 && input.shapeCode !== '99') {
    return {
      cuttingLengthM: 0,
      cuttingLengthMm: 0,
      formulaNotation: 'CL = N/A',
      formulaWithValues: 'Mandatory dimension A is missing',
      shapeDescription: 'Unknown Profile',
      stockLengthExceeded: false,
      hookInfo: { angleDeg: 0, hookCount: 0, hookLengthMm: 0, formula: 'None', extensionRule: 'None' },
      bendInfo: { bendCount: 0, bendAngleDeg: 0, bendDeductionMm: 0, formula: 'None', deductionRule: 'None' },
      lapInfo: { lapRequired: false, lapLengthMm: 0, numberOfLaps: 0, totalLapLengthMm: 0, lapRule: 'None', isMissing: false },
      anchorageInfo: { isMissing: false },
      isBlocked: true,
      blockedReason: 'Mandatory dimension A is missing',
    };
  }

  let totalLengthMm = 0;
  let formulaNotation = '';
  let formulaWithValues = '';
  let shapeDescription = '';
  
  // Default hooks & bends
  let hookInfo: RebarHookInfo = {
    angleDeg: input.hook?.angleDeg || 0,
    hookCount: input.hook?.hookCount || 0,
    hookLengthMm: input.hook?.hookLengthMm || 0,
    formula: input.hook?.formula || 'None',
    extensionRule: input.hook?.extensionRule || 'Standard',
  };

  let bendInfo: RebarBendInfo = {
    bendCount: input.bend?.bendCount || 0,
    bendAngleDeg: input.bend?.bendAngleDeg || 0,
    bendDeductionMm: input.bend?.bendDeductionMm || 0,
    formula: input.bend?.formula || 'None',
    deductionRule: input.bend?.deductionRule || '2d per 90° bend',
  };

  let lapInfo: RebarLapInfo = {
    lapRequired: input.lap?.lapRequired || false,
    lapLengthMm: input.lap?.lapLengthMm || 0,
    numberOfLaps: input.lap?.numberOfLaps || 0,
    totalLapLengthMm: input.lap?.totalLapLengthMm || 0,
    lapRule: input.lap?.lapRule || '48d Standard',
    isMissing: input.lap?.isMissing || false,
  };

  let anchorageInfo: RebarAnchorageInfo = {
    anchorageLengthMm: input.anchorage?.anchorageLengthMm || 0,
    developmentLengthMm: input.anchorage?.developmentLengthMm || 0,
    anchorageType: input.anchorage?.anchorageType || 'Straight',
    isMissing: input.anchorage?.isMissing || false,
  };

  switch (input.shapeCode) {
    case '00': {
      // Shape 00: Straight bar
      shapeDescription = 'Shape 00: Straight Bar';
      totalLengthMm = A;
      
      if (input.anchorage?.anchorageLengthMm) {
        totalLengthMm += input.anchorage.anchorageLengthMm;
        formulaNotation = 'CL = A + Anchorage';
        formulaWithValues = `${A} + ${input.anchorage.anchorageLengthMm} = ${totalLengthMm} mm`;
      } else {
        formulaNotation = 'CL = A';
        formulaWithValues = `CL = ${A} mm`;
      }
      break;
    }

    case '11': {
      // Shape 11: L-Bar with single 90° bend
      shapeDescription = 'Shape 11: L-Bar (Single 90° Bend)';
      const bendDeduction = 2 * d;
      totalLengthMm = A + B - bendDeduction;
      
      bendInfo = {
        bendCount: 1,
        bendAngleDeg: 90,
        bendDeductionMm: bendDeduction,
        formula: `1 × (2 × ${d}) = ${bendDeduction} mm`,
        deductionRule: '2d per 90° bend (BS 8666)',
      };
      
      formulaNotation = 'CL = A + B - 2d';
      formulaWithValues = `${A} + ${B} - 2(${d}) = ${totalLengthMm} mm`;
      break;
    }

    case '21': {
      // Shape 21: U-Bar (two 90° bends)
      shapeDescription = 'Shape 21: U-Bar (Double 90° Bends)';
      const bendDeduction = 4 * d; // 2 bends * 2d
      totalLengthMm = A + B + C - bendDeduction;
      
      bendInfo = {
        bendCount: 2,
        bendAngleDeg: 90,
        bendDeductionMm: bendDeduction,
        formula: `2 × (2 × ${d}) = ${bendDeduction} mm`,
        deductionRule: '2d per 90° bend',
      };
      
      formulaNotation = 'CL = A + B + C - 4d';
      formulaWithValues = `${A} + ${B} + ${C} - 4(${d}) = ${totalLengthMm} mm`;
      break;
    }

    case '31': {
      // Shape 31: Cranked bar for slabs / beams (45° bent-up)
      shapeDescription = 'Shape 31: Cranked Bar (45° Bent-up Shear)';
      const crankExtra = Math.round(0.42 * D);
      const bendDeduction = 2 * d;
      totalLengthMm = A + B + C + crankExtra - bendDeduction;
      
      bendInfo = {
        bendCount: 2,
        bendAngleDeg: 45,
        bendDeductionMm: bendDeduction,
        formula: `2 × (1 × ${d}) = ${bendDeduction} mm`,
        deductionRule: '1d per 45° bend',
      };

      formulaNotation = 'CL = A + B + C + 0.42D - 2d';
      formulaWithValues = `${A} + ${B} + ${C} + 0.42(${D}) - 2(${d}) = ${totalLengthMm} mm`;
      break;
    }

    case '41': {
      // Shape 41: Beam Stirrup / Closed Link
      shapeDescription = 'Shape 41: Closed Beam Stirrup / Link (135° Hooks)';
      const hookExtension = 2 * (10 * d); // 2 x 10d
      const bendDeduction = 3 * (2 * d) + 2 * (3 * d); // 3x90° + 2x135° = 12d
      totalLengthMm = 2 * (A + B) + hookExtension - bendDeduction;
      
      hookInfo = {
        angleDeg: 135,
        hookCount: 2,
        hookLengthMm: hookExtension,
        formula: `2 × 10d = 2 × 10(${d}) = ${hookExtension} mm`,
        extensionRule: '10d for 135° link hooks',
      };

      bendInfo = {
        bendCount: 5,
        bendAngleDeg: 135,
        bendDeductionMm: bendDeduction,
        formula: `3×2d + 2×3d = 12(${d}) = ${bendDeduction} mm`,
        deductionRule: 'BS 8666 Stirrup bend allowance',
      };

      formulaNotation = 'CL = 2(A + B) + 2(10d) - 12d';
      formulaWithValues = `2(${A} + ${B}) + ${hookExtension} - ${bendDeduction} = ${totalLengthMm} mm`;
      break;
    }

    case '51': {
      // Shape 51: Column Tie / Seismic Link with 135° hooks
      shapeDescription = 'Shape 51: Column Seismic Link (135° Hooks)';
      const hookExtension = 2 * (12 * d); // 2 x 12d seismic
      const bendDeduction = 3 * (2 * d) + 2 * (4 * d); // 14d bend deduction
      totalLengthMm = 2 * (A + B) + hookExtension - bendDeduction;

      hookInfo = {
        angleDeg: 135,
        hookCount: 2,
        hookLengthMm: hookExtension,
        formula: `2 × 12d = 2 × 12(${d}) = ${hookExtension} mm`,
        extensionRule: '12d seismic hook extension (IS 13920 / ACI 318)',
      };

      bendInfo = {
        bendCount: 5,
        bendAngleDeg: 135,
        bendDeductionMm: bendDeduction,
        formula: `3×2d + 2×4d = 14(${d}) = ${bendDeduction} mm`,
        deductionRule: '14d seismic tie allowance',
      };

      formulaNotation = 'CL = 2(A + B) + 2(12d) - 14d';
      formulaWithValues = `2(${A} + ${B}) + ${hookExtension} - ${bendDeduction} = ${totalLengthMm} mm`;
      break;
    }

    case '61': {
      // Shape 61: Circular column ring / spiral hoop
      shapeDescription = 'Shape 61: Circular Ring / Spiral Hoop';
      const circumference = Math.round(Math.PI * A);
      const lapLength = lapInfo.lapLengthMm > 0 ? lapInfo.lapLengthMm : 48 * d;
      totalLengthMm = circumference + lapLength;

      lapInfo = {
        lapRequired: true,
        lapLengthMm: lapLength,
        numberOfLaps: 1,
        totalLapLengthMm: lapLength,
        lapRule: '48d Standard Lap',
        isMissing: false,
      };

      formulaNotation = 'CL = πA + Lap (48d)';
      formulaWithValues = `π(${A}) + 48(${d}) = ${circumference} + ${lapLength} = ${totalLengthMm} mm`;
      break;
    }

    case '71': {
      // Shape 71: Chair bar for slab top mesh support
      shapeDescription = 'Shape 71: Chair Bar (Slab Top Mesh Support)';
      totalLengthMm = A + 2 * B + 2 * C;
      formulaNotation = 'CL = A + 2B + 2C';
      formulaWithValues = `${A} + 2(${B}) + 2(${C}) = ${totalLengthMm} mm`;
      break;
    }

    case '77': {
      // Shape 77: Hairpin / U-Cap Link
      shapeDescription = 'Shape 77: Hairpin / U-Cap Link';
      const bendDeduction = 2 * d;
      totalLengthMm = A + 2 * B - bendDeduction;
      formulaNotation = 'CL = A + 2B - 2d';
      formulaWithValues = `${A} + 2(${B}) - 2(${d}) = ${totalLengthMm} mm`;
      break;
    }

    case '81': {
      // Shape 81: Opening Trimmer / Diagonal Rebar
      shapeDescription = 'Shape 81: Opening Trimmer / Diagonal Bar';
      totalLengthMm = A + 2 * B;
      formulaNotation = 'CL = A + 2B';
      formulaWithValues = `${A} + 2(${B}) = ${totalLengthMm} mm`;
      break;
    }

    case '99':
    default: {
      // Shape 99: Custom Multi-Bend Profile
      shapeDescription = 'Shape 99: Custom Multi-Bend Profile';
      totalLengthMm = A + B + C + D + E + F;
      if (input.hook?.hookLengthMm) totalLengthMm += input.hook.hookLengthMm;
      if (input.lap?.totalLapLengthMm) totalLengthMm += input.lap.totalLapLengthMm;
      if (input.bend?.bendDeductionMm) totalLengthMm -= input.bend.bendDeductionMm;

      formulaNotation = 'CL = A + B + C + D + E + F + Hooks - Bends';
      formulaWithValues = `${A} + ${B} + ${C} + ${D} + ${E} + ${F} = ${totalLengthMm} mm`;
      break;
    }
  }

  // Stock length check (12.0m standard)
  const cuttingLengthM = Number((totalLengthMm / 1000).toFixed(3));
  const stockLengthExceeded = cuttingLengthM > stockLimitM;

  return {
    cuttingLengthM,
    cuttingLengthMm: totalLengthMm,
    formulaNotation,
    formulaWithValues,
    shapeDescription,
    stockLengthExceeded,
    hookInfo,
    bendInfo,
    lapInfo,
    anchorageInfo,
    isBlocked: false,
  };
}

// =========================================================================
// 4. FULL REBAR ITEM RECALCULATION
// =========================================================================

export function recalculateRebarItem(item: RccRebarRegisterItem): RccRebarRegisterItem {
  // 1. Check open item blocking triggers
  let isBlocked = false;
  let blockedReason: string | null = null;
  const openItemIds = [...item.associatedOpenItemIds];

  if (!item.barDiameterMm || item.barDiameterMm <= 0) {
    isBlocked = true;
    blockedReason = 'Rebar diameter is missing or unverified.';
  } else if (!item.quantity && !item.spacingMm) {
    isBlocked = true;
    blockedReason = 'Neither bar quantity nor spacing is specified.';
  } else if (item.coverMm === null || item.coverMm === undefined) {
    isBlocked = true;
    blockedReason = 'Concrete cover not specified for member.';
  } else if (item.lap.lapRequired && item.lap.isMissing) {
    isBlocked = true;
    blockedReason = 'Lap length is required but not available.';
  }

  // 2. Bar Count Calculation
  const countResult = calculateBarCount(
    item.distributionLengthMm,
    item.spacingMm,
    item.barCountRule,
    item.quantity
  );

  const barsPerMember = countResult.count;
  const memberCount = Math.max(1, item.memberCount || 1);
  const totalBars = barsPerMember * memberCount;

  // 3. Cutting Length
  const clResult = computeCuttingLength({
    shapeCode: item.shapeCode,
    diameterMm: item.barDiameterMm,
    aMm: item.dimensions.aMm,
    bMm: item.dimensions.bMm,
    cMm: item.dimensions.cMm,
    dMm: item.dimensions.dMm,
    eMm: item.dimensions.eMm,
    fMm: item.dimensions.fMm,
    coverMm: item.coverMm,
    hook: item.hook,
    bend: item.bend,
    lap: item.lap,
    anchorage: item.anchorage,
    stockLengthLimitM: item.stockLengthLimitM,
  });

  if (clResult.isBlocked) {
    isBlocked = true;
    blockedReason = clResult.blockedReason || 'Cutting length calculation blocked.';
  }

  // 4. Total Length
  const totalLengthM = Number((clResult.cuttingLengthM * totalBars).toFixed(2));

  // 5. Unit Weight & Total Weight
  const unitWeightResult = calculateRebarUnitWeight(item.barDiameterMm);
  const totalWeightKg = Number((totalLengthM * unitWeightResult.unitWeightKgM).toFixed(2));

  // 6. Verification Status check: If blocked -> 'BLOCKED'
  let currentStatus = item.verificationStatus;
  if (isBlocked) {
    currentStatus = 'BLOCKED';
  } else if (currentStatus === 'BLOCKED') {
    currentStatus = 'REQUIRES REVIEW';
  }

  return {
    ...item,
    barsPerMember,
    totalBars,
    cuttingLengthM: clResult.cuttingLengthM,
    cuttingFormula: clResult.formulaNotation,
    cuttingFormulaWithValues: clResult.formulaWithValues,
    shapeDescription: clResult.shapeDescription,
    stockLengthExceeded: clResult.stockLengthExceeded,
    hook: clResult.hookInfo,
    bend: clResult.bendInfo,
    lap: clResult.lapInfo,
    anchorage: clResult.anchorageInfo,
    totalLengthM,
    unitWeightKgM: unitWeightResult.unitWeightKgM,
    unitWeightSource: unitWeightResult.source,
    totalWeightKg,
    isBlocked,
    blockedReason,
    associatedOpenItemIds: openItemIds,
    verificationStatus: currentStatus,
    updatedAt: new Date().toISOString(),
  };
}

// =========================================================================
// 5. SUMMARY AGGREGATION & WASTAGE ENGINE
// =========================================================================

export function calculateBbsSummary(
  rebarList: RccRebarRegisterItem[],
  wastagePercent: number = 2.5
): BbsSummaryData {
  let totalBarsCount = 0;
  let totalLengthMeters = 0;
  let totalWeightKg = 0;
  let blockedCount = 0;
  let requiresReviewCount = 0;
  let verifiedCount = 0;

  const diaMap = new Map<number, { totalBars: number; totalLengthM: number; totalWeightKg: number }>();
  const elementMap = new Map<RccElementCategory, { totalBars: number; totalLengthM: number; totalWeightKg: number }>();

  rebarList.forEach((r) => {
    if (!r) return;
    const bars = r.totalBars || 0;
    const len = r.totalLengthM || 0;
    const wt = r.totalWeightKg || 0;

    totalBarsCount += bars;
    totalLengthMeters += len;
    totalWeightKg += wt;

    if (r.isBlocked || r.verificationStatus === 'BLOCKED') {
      blockedCount++;
    } else if (r.verificationStatus === 'USER VERIFIED' || r.verificationStatus === 'FINAL') {
      verifiedCount++;
    } else {
      requiresReviewCount++;
    }

    // Diameter aggregation
    const dia = r.barDiameterMm || 0;
    const existingDia = diaMap.get(dia) || { totalBars: 0, totalLengthM: 0, totalWeightKg: 0 };
    existingDia.totalBars += bars;
    existingDia.totalLengthM += len;
    existingDia.totalWeightKg += wt;
    diaMap.set(dia, existingDia);

    // Element category aggregation
    const elType = r.elementType;
    if (elType) {
      const existingEl = elementMap.get(elType) || { totalBars: 0, totalLengthM: 0, totalWeightKg: 0 };
      existingEl.totalBars += bars;
      existingEl.totalLengthM += len;
      existingEl.totalWeightKg += wt;
      elementMap.set(elType, existingEl);
    }
  });

  const totalWeightTonnes = Number((totalWeightKg / 1000).toFixed(3));

  // Wastage calculations
  const wastageWeightKg = Number(((totalWeightKg * wastagePercent) / 100).toFixed(2));
  const tenderWeightKg = Number((totalWeightKg + wastageWeightKg).toFixed(2));
  const tenderWeightTonnes = Number((tenderWeightKg / 1000).toFixed(3));

  // By Diameter array sorted ascending
  const byDiameter = Array.from(diaMap.entries())
    .map(([diameterMm, data]) => {
      const unitWeight = calculateRebarUnitWeight(diameterMm).unitWeightKgM;
      return {
        diameterMm,
        totalBars: data.totalBars,
        totalLengthM: Number(data.totalLengthM.toFixed(2)),
        unitWeightKgM: unitWeight,
        totalWeightKg: Number(data.totalWeightKg.toFixed(2)),
        totalWeightTonnes: Number((data.totalWeightKg / 1000).toFixed(3)),
      };
    })
    .sort((a, b) => a.diameterMm - b.diameterMm);

  // By Element type array
  const byElementType = Array.from(elementMap.entries()).map(([elementType, data]) => ({
    elementType,
    totalBars: data.totalBars,
    totalLengthM: Number(data.totalLengthM.toFixed(2)),
    totalWeightKg: Number(data.totalWeightKg.toFixed(2)),
    totalWeightTonnes: Number((data.totalWeightKg / 1000).toFixed(3)),
  }));

  return {
    totalBarsCount,
    totalLengthMeters: Number(totalLengthMeters.toFixed(2)),
    totalWeightKg: Number(totalWeightKg.toFixed(2)),
    totalWeightTonnes,
    byDiameter,
    byElementType,
    wastage: {
      calculatedWeightKg: Number(totalWeightKg.toFixed(2)),
      wastagePercentage: wastagePercent,
      wastageWeightKg,
      tenderWeightKg,
      tenderWeightTonnes,
    },
    blockedCount,
    requiresReviewCount,
    verifiedCount,
  };
}

// =========================================================================
// 6. SEED INITIAL RCC ELEMENTS & VERIFIED REINFORCEMENT DATASET
// =========================================================================

export function getInitialRccElements(projectId: string): RccElementRegisterItem[] {
  return [
    {
      id: 'RCC-EL-001',
      elementId: 'F-1',
      elementType: 'Footings',
      mark: 'F1',
      level: 'Foundation Level (-1.80m)',
      grid: 'Grid B/2',
      lengthMm: 2400,
      widthMm: 2400,
      depthMm: 600,
      thicknessMm: 600,
      concreteGrade: 'C35/45',
      coverMm: 50,
      drawingNumber: 'S-101',
      revision: '01',
      pageNumber: 1,
      sourceLocation: 'Foundation Layout Grid B/2',
      status: 'USER VERIFIED',
      rebarCount: 2,
      totalRebarWeightKg: 182.28,
      isBlocked: false,
    },
    {
      id: 'RCC-EL-002',
      elementId: 'C-1',
      elementType: 'Columns',
      mark: 'C1',
      level: 'Ground Floor to Level 01 (+0.00 to +3.60m)',
      grid: 'Grid B/2',
      lengthMm: 500,
      widthMm: 500,
      depthMm: 3600,
      thicknessMm: 500,
      concreteGrade: 'C40/50',
      coverMm: 40,
      drawingNumber: 'S-201',
      revision: '01',
      pageNumber: 1,
      sourceLocation: 'Column Schedule Sheet S-201',
      status: 'USER VERIFIED',
      rebarCount: 3,
      totalRebarWeightKg: 248.65,
      isBlocked: false,
    },
    {
      id: 'RCC-EL-003',
      elementId: 'B-101',
      elementType: 'Beams',
      mark: 'B101',
      level: 'Level 01 (+3.60m)',
      grid: 'Grid B-C / 2',
      lengthMm: 6000,
      widthMm: 300,
      depthMm: 600,
      thicknessMm: 600,
      concreteGrade: 'C30/37',
      coverMm: 35,
      drawingNumber: 'S-202',
      revision: '01',
      pageNumber: 1,
      sourceLocation: 'Beam Framing Plan Grid B-C/2',
      status: 'USER VERIFIED',
      rebarCount: 4,
      totalRebarWeightKg: 312.40,
      isBlocked: false,
    },
    {
      id: 'RCC-EL-004',
      elementId: 'S-01',
      elementType: 'Slabs',
      mark: 'S1',
      level: 'Level 01 (+3.60m)',
      grid: 'Bay B-C / 1-2',
      lengthMm: 6000,
      widthMm: 5000,
      depthMm: 200,
      thicknessMm: 200,
      concreteGrade: 'C30/37',
      coverMm: 25,
      drawingNumber: 'S-203',
      revision: '01',
      pageNumber: 1,
      sourceLocation: 'Slab Layout Bay B-C/1-2',
      status: 'USER VERIFIED',
      rebarCount: 2,
      totalRebarWeightKg: 492.56,
      isBlocked: false,
    },
    {
      id: 'RCC-EL-005',
      elementId: 'W-01',
      elementType: 'Walls',
      mark: 'SW1',
      level: 'Ground Floor (+0.00 to +3.60m)',
      grid: 'Grid A / 1-3',
      lengthMm: 4500,
      widthMm: 250,
      depthMm: 3600,
      thicknessMm: 250,
      concreteGrade: 'C35/45',
      coverMm: 30,
      drawingNumber: 'S-204',
      revision: '01',
      pageNumber: 1,
      sourceLocation: 'Shear Wall SW1 Detail',
      status: 'USER VERIFIED',
      rebarCount: 3,
      totalRebarWeightKg: 378.10,
      isBlocked: false,
    },
    {
      id: 'RCC-EL-006',
      elementId: 'ST-01',
      elementType: 'Stairs',
      mark: 'ST1',
      level: 'Ground to Level 01 (+0.00 to +3.60m)',
      grid: 'Stair Core Grid D/3',
      lengthMm: 4200,
      widthMm: 1200,
      depthMm: 175,
      thicknessMm: 175,
      concreteGrade: 'C30/37',
      coverMm: 25,
      drawingNumber: 'S-205',
      revision: '01',
      pageNumber: 1,
      sourceLocation: 'Staircase Flight Detail',
      status: 'USER VERIFIED',
      rebarCount: 3,
      totalRebarWeightKg: 195.40,
      isBlocked: false,
    },
    {
      id: 'RCC-EL-007',
      elementId: 'GB-01',
      elementType: 'Ground Beams',
      mark: 'GB1',
      level: 'Plinth Level (+0.00m)',
      grid: 'Grid 1 / A-D',
      lengthMm: 8000,
      widthMm: 400,
      depthMm: 700,
      thicknessMm: 700,
      concreteGrade: 'C35/45',
      coverMm: 40,
      drawingNumber: 'S-102',
      revision: '01',
      pageNumber: 1,
      sourceLocation: 'Tie Beam Schedule Grid 1',
      status: 'USER VERIFIED',
      rebarCount: 3,
      totalRebarWeightKg: 425.80,
      isBlocked: false,
    },
    {
      id: 'RCC-EL-008',
      elementId: 'PED-01',
      elementType: 'Pedestals',
      mark: 'PED1',
      level: 'Foundation to Ground (-1.20 to +0.00m)',
      grid: 'Grid B/2',
      lengthMm: 600,
      widthMm: 600,
      depthMm: 1200,
      thicknessMm: 600,
      concreteGrade: 'C35/45',
      coverMm: 50,
      drawingNumber: 'S-101',
      revision: '01',
      pageNumber: 1,
      sourceLocation: 'Footing Pedestal Section',
      status: 'USER VERIFIED',
      rebarCount: 2,
      totalRebarWeightKg: 96.50,
      isBlocked: false,
    },
    {
      id: 'RCC-EL-009',
      elementId: 'RW-01',
      elementType: 'Retaining Walls',
      mark: 'RW1',
      level: 'Basement (-3.20 to +0.00m)',
      grid: 'Perimeter Grid 4',
      lengthMm: 12000,
      widthMm: 300,
      depthMm: 3200,
      thicknessMm: 300,
      concreteGrade: 'C35/45',
      coverMm: 40,
      drawingNumber: 'S-105',
      revision: '01',
      pageNumber: 1,
      sourceLocation: 'Basement Retaining Wall Section',
      status: 'USER VERIFIED',
      rebarCount: 3,
      totalRebarWeightKg: 890.30,
      isBlocked: false,
    },
    {
      id: 'RCC-EL-010',
      elementId: 'C-99_UNSPEC',
      elementType: 'Columns',
      mark: 'C99',
      level: 'Roof Level (+12.00m)',
      grid: 'Grid E/5',
      lengthMm: 400,
      widthMm: 400,
      depthMm: 3000,
      thicknessMm: 400,
      concreteGrade: 'C30/37',
      coverMm: null, // MISSING COVER -> BLOCKED DEMO
      drawingNumber: 'S-301',
      revision: '01',
      pageNumber: 1,
      sourceLocation: 'Roof Plan Grid E/5',
      status: 'BLOCKED',
      rebarCount: 0,
      totalRebarWeightKg: 0,
      isBlocked: true,
      blockedReason: 'Column reinforcement not identified in drawing (Rule 48: No Fabricated Rebar). Open item required.',
    }
  ];
}

export function getInitialRccRebarRegister(projectId: string): RccRebarRegisterItem[] {
  return [
    // 1. FOOTING F1 (Bottom X & Bottom Y Mesh)
    {
      id: 'REBAR-0001',
      elementId: 'RCC-EL-001',
      elementMark: 'F1',
      elementType: 'Footings',
      memberDescription: 'Isolated Footing F1 (2400x2400x600) Bottom X Main Bars',
      level: 'Foundation (-1.80m)',
      grid: 'Grid B/2',
      barMark: 'F1-BX',
      barDiameterMm: 16,
      rebarType: 'Bottom bar',
      rebarGrade: 'Fe500D',
      quantity: 17,
      spacingMm: 150,
      distributionLengthMm: 2400,
      barCountRule: 'CEILING_PLUS_1',
      direction: 'X',
      layer: 'B1 (Bottom Layer)',
      position: 'Bottom',
      face: 'Bottom',
      startLocation: 'Left Footing Edge',
      endLocation: 'Right Footing Edge',
      shapeCode: '11',
      shapeDescription: 'Shape 11: L-Bar (90° Bend)',
      dimensions: {
        aMm: 2300, // 2400 - 2x50 cover
        bMm: 500,  // 600 - 2x50 cover
      },
      hook: { angleDeg: 0, hookCount: 0, hookLengthMm: 0, formula: 'None', extensionRule: 'Standard' },
      bend: { bendCount: 1, bendAngleDeg: 90, bendDeductionMm: 32, formula: '2d = 32mm', deductionRule: '2d per 90° bend' },
      lap: { lapRequired: false, lapLengthMm: 0, numberOfLaps: 0, totalLapLengthMm: 0, lapRule: 'None', isMissing: false },
      anchorage: { isMissing: false },
      coverMm: 50,
      cuttingLengthM: 2.768,
      cuttingFormula: 'CL = A + B - 2d',
      cuttingFormulaWithValues: '2300 + 500 - 32 = 2768 mm',
      memberCount: 1,
      barsPerMember: 17,
      totalBars: 17,
      totalLengthM: 47.06,
      unitWeightKgM: 1.579,
      unitWeightSource: 'DEFAULT_FORMULA',
      totalWeightKg: 74.31,
      stockLengthLimitM: 12.0,
      stockLengthExceeded: false,
      rawNotation: 'RAW: T16 @ 150 c/c B1 (L-Bend 500mm up)',
      interpretedData: { diameterMm: 16, spacingMm: 150, position: 'Bottom', quantity: 17 },
      sourceDrawing: {
        documentId: 'DOC-S-101',
        drawingNumber: 'S-101',
        revision: '01',
        page: 1,
        locationDescription: 'Footing Schedule Section 1-1',
        boundingBox: { x: 18, y: 35, width: 22, height: 16, label: 'F1 Footing Rebar', color: '#6366f1' },
      },
      confidence: 0.98,
      verificationStatus: 'USER VERIFIED',
      isBlocked: false,
      blockedReason: null,
      associatedOpenItemIds: [],
      notes: 'Bottom X direction rebar with 500mm end hooks turned upwards.',
      auditTrail: [
        {
          id: 'AUD-001',
          timestamp: '2026-08-24T06:10:00Z',
          user: 'AI Intake Engine',
          action: 'CREATED',
          previousValue: null,
          newValue: 74.31,
          reason: 'Extracted from Footing Detail S-101 Rev 01',
        }
      ],
      createdAt: '2026-08-24T06:10:00Z',
      updatedAt: '2026-08-24T06:10:00Z',
    },
    {
      id: 'REBAR-0002',
      elementId: 'RCC-EL-001',
      elementMark: 'F1',
      elementType: 'Footings',
      memberDescription: 'Isolated Footing F1 (2400x2400x600) Bottom Y Main Bars',
      level: 'Foundation (-1.80m)',
      grid: 'Grid B/2',
      barMark: 'F1-BY',
      barDiameterMm: 16,
      rebarType: 'Bottom bar',
      rebarGrade: 'Fe500D',
      quantity: 17,
      spacingMm: 150,
      distributionLengthMm: 2400,
      barCountRule: 'CEILING_PLUS_1',
      direction: 'Y',
      layer: 'B2 (Bottom Second Layer)',
      position: 'Bottom',
      face: 'Bottom',
      startLocation: 'Bottom Footing Edge',
      endLocation: 'Top Footing Edge',
      shapeCode: '11',
      shapeDescription: 'Shape 11: L-Bar (90° Bend)',
      dimensions: {
        aMm: 2300,
        bMm: 500,
      },
      hook: { angleDeg: 0, hookCount: 0, hookLengthMm: 0, formula: 'None', extensionRule: 'Standard' },
      bend: { bendCount: 1, bendAngleDeg: 90, bendDeductionMm: 32, formula: '2d = 32mm', deductionRule: '2d per 90° bend' },
      lap: { lapRequired: false, lapLengthMm: 0, numberOfLaps: 0, totalLapLengthMm: 0, lapRule: 'None', isMissing: false },
      anchorage: { isMissing: false },
      coverMm: 50,
      cuttingLengthM: 2.768,
      cuttingFormula: 'CL = A + B - 2d',
      cuttingFormulaWithValues: '2300 + 500 - 32 = 2768 mm',
      memberCount: 1,
      barsPerMember: 17,
      totalBars: 17,
      totalLengthM: 47.06,
      unitWeightKgM: 1.579,
      unitWeightSource: 'DEFAULT_FORMULA',
      totalWeightKg: 74.31,
      stockLengthLimitM: 12.0,
      stockLengthExceeded: false,
      rawNotation: 'RAW: T16 @ 150 c/c B2 (L-Bend 500mm up)',
      interpretedData: { diameterMm: 16, spacingMm: 150, position: 'Bottom', quantity: 17 },
      sourceDrawing: {
        documentId: 'DOC-S-101',
        drawingNumber: 'S-101',
        revision: '01',
        page: 1,
        locationDescription: 'Footing Schedule Section 1-1',
        boundingBox: { x: 18, y: 35, width: 22, height: 16, label: 'F1 Footing Rebar', color: '#6366f1' },
      },
      confidence: 0.98,
      verificationStatus: 'USER VERIFIED',
      isBlocked: false,
      blockedReason: null,
      associatedOpenItemIds: [],
      notes: 'Bottom Y direction transverse rebar.',
      auditTrail: [],
      createdAt: '2026-08-24T06:10:00Z',
      updatedAt: '2026-08-24T06:10:00Z',
    },

    // 2. COLUMN C1 (Main Bars + Confined Ties + Unconfined Ties)
    {
      id: 'REBAR-0003',
      elementId: 'RCC-EL-002',
      elementMark: 'C1',
      elementType: 'Columns',
      memberDescription: 'Column C1 (500x500) Vertical Main Bars',
      level: 'Ground Floor to Level 01 (+0.00 to +3.60m)',
      grid: 'Grid B/2',
      barMark: 'C1-M1',
      barDiameterMm: 20,
      rebarType: 'Main bar',
      rebarGrade: 'Fe500D',
      quantity: 8,
      spacingMm: null,
      distributionLengthMm: null,
      barCountRule: 'MANUAL',
      direction: 'Longitudinal',
      layer: 'Outer',
      position: 'Main',
      face: 'Both',
      startLocation: 'Ground Floor Level +0.00m',
      endLocation: 'Level 01 Floor +3.60m + 50d Lap',
      shapeCode: '00',
      shapeDescription: 'Shape 00: Straight Main Bar',
      dimensions: {
        aMm: 4600, // 3600 height + 1000mm lap (50d)
      },
      hook: { angleDeg: 0, hookCount: 0, hookLengthMm: 0, formula: 'None', extensionRule: 'Standard' },
      bend: { bendCount: 0, bendAngleDeg: 0, bendDeductionMm: 0, formula: 'None', deductionRule: 'None' },
      lap: { lapRequired: true, lapLengthMm: 1000, numberOfLaps: 1, totalLapLengthMm: 1000, lapRule: '50d Column Lap (IS 456 / BS 8110)', isMissing: false },
      anchorage: { isMissing: false },
      coverMm: 40,
      cuttingLengthM: 4.600,
      cuttingFormula: 'CL = A (Height + Lap)',
      cuttingFormulaWithValues: '3600 + 1000 = 4600 mm',
      memberCount: 1,
      barsPerMember: 8,
      totalBars: 8,
      totalLengthM: 36.80,
      unitWeightKgM: 2.466,
      unitWeightSource: 'DEFAULT_FORMULA',
      totalWeightKg: 90.75,
      stockLengthLimitM: 12.0,
      stockLengthExceeded: false,
      rawNotation: 'RAW: 8T20 (Vertical Rebar with 50d lap above slab)',
      interpretedData: { diameterMm: 20, quantity: 8, position: 'Main' },
      sourceDrawing: {
        documentId: 'DOC-S-201',
        drawingNumber: 'S-201',
        revision: '01',
        page: 1,
        locationDescription: 'Column Detail C1 Grid B/2',
        boundingBox: { x: 42, y: 28, width: 16, height: 28, label: 'Column C1 Rebar', color: '#10b981' },
      },
      confidence: 0.99,
      verificationStatus: 'USER VERIFIED',
      isBlocked: false,
      blockedReason: null,
      associatedOpenItemIds: [],
      notes: '8-T20 longitudinal bars with 1000mm starter projection for Level 02.',
      auditTrail: [],
      createdAt: '2026-08-24T06:10:00Z',
      updatedAt: '2026-08-24T06:10:00Z',
    },
    {
      id: 'REBAR-0004',
      elementId: 'RCC-EL-002',
      elementMark: 'C1',
      elementType: 'Columns',
      memberDescription: 'Column C1 End Zone Confining Ties (0-600mm & 3000-3600mm)',
      level: 'Ground Floor to Level 01 (+0.00 to +3.60m)',
      grid: 'Grid B/2',
      barMark: 'C1-T1',
      barDiameterMm: 10,
      rebarType: 'Tie',
      rebarGrade: 'Fe500D',
      quantity: 14,
      spacingMm: 100,
      distributionLengthMm: 1200, // 2 zones of 600mm
      barCountRule: 'CEILING_PLUS_1',
      direction: 'Transverse',
      layer: 'Outer Link',
      position: 'Ties',
      face: 'Internal',
      startLocation: 'Top & Bottom 600mm Confined Zones',
      endLocation: 'End of Confinement Zones',
      shapeCode: '51',
      shapeDescription: 'Shape 51: Column Seismic Link (135° Hooks)',
      dimensions: {
        aMm: 420, // 500 - 2x40 cover
        bMm: 420, // 500 - 2x40 cover
      },
      hook: { angleDeg: 135, hookCount: 2, hookLengthMm: 240, formula: '2 × 12d = 240mm', extensionRule: '12d Seismic hook' },
      bend: { bendCount: 5, bendAngleDeg: 135, bendDeductionMm: 140, formula: '14d = 140mm', deductionRule: '14d tie allowance' },
      lap: { lapRequired: false, lapLengthMm: 0, numberOfLaps: 0, totalLapLengthMm: 0, lapRule: 'None', isMissing: false },
      anchorage: { isMissing: false },
      coverMm: 40,
      cuttingLengthM: 1.780,
      cuttingFormula: 'CL = 2(A + B) + 2(12d) - 14d',
      cuttingFormulaWithValues: '2(420 + 420) + 240 - 140 = 1780 mm',
      memberCount: 1,
      barsPerMember: 14,
      totalBars: 14,
      totalLengthM: 24.92,
      unitWeightKgM: 0.617,
      unitWeightSource: 'DEFAULT_FORMULA',
      totalWeightKg: 15.38,
      stockLengthLimitM: 12.0,
      stockLengthExceeded: false,
      rawNotation: 'RAW: T10 @ 100 c/c in Confined Zones (0-600mm, 3000-3600mm)',
      interpretedData: { diameterMm: 10, spacingMm: 100, position: 'Ties', quantity: 14 },
      sourceDrawing: {
        documentId: 'DOC-S-201',
        drawingNumber: 'S-201',
        revision: '01',
        page: 1,
        locationDescription: 'Column Tie Schedule',
        boundingBox: { x: 42, y: 28, width: 16, height: 28, label: 'Column C1 Rebar', color: '#10b981' },
      },
      confidence: 0.95,
      verificationStatus: 'USER VERIFIED',
      isBlocked: false,
      blockedReason: null,
      associatedOpenItemIds: [],
      notes: 'Confined seismic ties at support joints.',
      auditTrail: [],
      createdAt: '2026-08-24T06:10:00Z',
      updatedAt: '2026-08-24T06:10:00Z',
    },
    {
      id: 'REBAR-0005',
      elementId: 'RCC-EL-002',
      elementMark: 'C1',
      elementType: 'Columns',
      memberDescription: 'Column C1 Middle Zone Ties (600mm to 3000mm)',
      level: 'Ground Floor to Level 01 (+0.00 to +3.60m)',
      grid: 'Grid B/2',
      barMark: 'C1-T2',
      barDiameterMm: 10,
      rebarType: 'Tie',
      rebarGrade: 'Fe500D',
      quantity: 17,
      spacingMm: 150,
      distributionLengthMm: 2400,
      barCountRule: 'CEILING_PLUS_1',
      direction: 'Transverse',
      layer: 'Outer Link',
      position: 'Ties',
      face: 'Internal',
      startLocation: 'Elevation +0.60m',
      endLocation: 'Elevation +3.00m',
      shapeCode: '51',
      shapeDescription: 'Shape 51: Column Seismic Link (135° Hooks)',
      dimensions: {
        aMm: 420,
        bMm: 420,
      },
      hook: { angleDeg: 135, hookCount: 2, hookLengthMm: 240, formula: '2 × 12d = 240mm', extensionRule: '12d Seismic hook' },
      bend: { bendCount: 5, bendAngleDeg: 135, bendDeductionMm: 140, formula: '14d = 140mm', deductionRule: '14d tie allowance' },
      lap: { lapRequired: false, lapLengthMm: 0, numberOfLaps: 0, totalLapLengthMm: 0, lapRule: 'None', isMissing: false },
      anchorage: { isMissing: false },
      coverMm: 40,
      cuttingLengthM: 1.780,
      cuttingFormula: 'CL = 2(A + B) + 2(12d) - 14d',
      cuttingFormulaWithValues: '2(420 + 420) + 240 - 140 = 1780 mm',
      memberCount: 1,
      barsPerMember: 17,
      totalBars: 17,
      totalLengthM: 30.26,
      unitWeightKgM: 0.617,
      unitWeightSource: 'DEFAULT_FORMULA',
      totalWeightKg: 18.67,
      stockLengthLimitM: 12.0,
      stockLengthExceeded: false,
      rawNotation: 'RAW: T10 @ 150 c/c in Middle Zone (600-3000mm)',
      interpretedData: { diameterMm: 10, spacingMm: 150, position: 'Ties', quantity: 17 },
      sourceDrawing: {
        documentId: 'DOC-S-201',
        drawingNumber: 'S-201',
        revision: '01',
        page: 1,
        locationDescription: 'Column Tie Schedule',
        boundingBox: { x: 42, y: 28, width: 16, height: 28, label: 'Column C1 Rebar', color: '#10b981' },
      },
      confidence: 0.95,
      verificationStatus: 'USER VERIFIED',
      isBlocked: false,
      blockedReason: null,
      associatedOpenItemIds: [],
      notes: 'Middle zone lateral links.',
      auditTrail: [],
      createdAt: '2026-08-24T06:10:00Z',
      updatedAt: '2026-08-24T06:10:00Z',
    },

    // 3. BEAM B101 (Bottom Bars + Top Bars + Extra Top Bars + Stirrups)
    {
      id: 'REBAR-0006',
      elementId: 'RCC-EL-003',
      elementMark: 'B101',
      elementType: 'Beams',
      memberDescription: 'Floor Beam B101 (300x600) Bottom Through Bars',
      level: 'Level 01 (+3.60m)',
      grid: 'Grid B-C / 2',
      barMark: 'B101-B1',
      barDiameterMm: 20,
      rebarType: 'Bottom bar',
      rebarGrade: 'Fe500D',
      quantity: 3,
      spacingMm: null,
      distributionLengthMm: null,
      barCountRule: 'MANUAL',
      direction: 'Longitudinal',
      layer: 'B1',
      position: 'Bottom',
      face: 'Bottom',
      startLocation: 'Left Column Support B/2',
      endLocation: 'Right Column Support C/2',
      shapeCode: '11',
      shapeDescription: 'Shape 11: L-Bar (Single 90° Bend into Column)',
      dimensions: {
        aMm: 6300, // 6000 span + 300 anchorage into column
        bMm: 500,  // 90 deg hook into column core
      },
      hook: { angleDeg: 90, hookCount: 1, hookLengthMm: 180, formula: '9d = 180mm', extensionRule: '9d standard 90° hook' },
      bend: { bendCount: 1, bendAngleDeg: 90, bendDeductionMm: 40, formula: '2d = 40mm', deductionRule: '2d per 90° bend' },
      lap: { lapRequired: false, lapLengthMm: 0, numberOfLaps: 0, totalLapLengthMm: 0, lapRule: 'None', isMissing: false },
      anchorage: { anchorageLengthMm: 300, anchorageType: 'Standard 90° Hook', isMissing: false },
      coverMm: 35,
      cuttingLengthM: 6.760,
      cuttingFormula: 'CL = A + B - 2d',
      cuttingFormulaWithValues: '6300 + 500 - 40 = 6760 mm',
      memberCount: 1,
      barsPerMember: 3,
      totalBars: 3,
      totalLengthM: 20.28,
      unitWeightKgM: 2.466,
      unitWeightSource: 'DEFAULT_FORMULA',
      totalWeightKg: 50.01,
      stockLengthLimitM: 12.0,
      stockLengthExceeded: false,
      rawNotation: 'RAW: 3T20 BOT (Anchored into column core with standard 90° hook)',
      interpretedData: { diameterMm: 20, quantity: 3, position: 'Bottom' },
      sourceDrawing: {
        documentId: 'DOC-S-202',
        drawingNumber: 'S-202',
        revision: '01',
        page: 1,
        locationDescription: 'Beam B101 Longitudinal Section',
        boundingBox: { x: 25, y: 52, width: 50, height: 18, label: 'Beam B101 Rebar', color: '#3b82f6' },
      },
      confidence: 0.98,
      verificationStatus: 'USER VERIFIED',
      isBlocked: false,
      blockedReason: null,
      associatedOpenItemIds: [],
      notes: 'Bottom tension steel continuous across span.',
      auditTrail: [],
      createdAt: '2026-08-24T06:10:00Z',
      updatedAt: '2026-08-24T06:10:00Z',
    },
    {
      id: 'REBAR-0007',
      elementId: 'RCC-EL-003',
      elementMark: 'B101',
      elementType: 'Beams',
      memberDescription: 'Floor Beam B101 (300x600) Top Hanger Bars',
      level: 'Level 01 (+3.60m)',
      grid: 'Grid B-C / 2',
      barMark: 'B101-T1',
      barDiameterMm: 16,
      rebarType: 'Top bar',
      rebarGrade: 'Fe500D',
      quantity: 2,
      spacingMm: null,
      distributionLengthMm: null,
      barCountRule: 'MANUAL',
      direction: 'Longitudinal',
      layer: 'T1',
      position: 'Top',
      face: 'Top',
      startLocation: 'Left Support B/2',
      endLocation: 'Right Support C/2',
      shapeCode: '11',
      shapeDescription: 'Shape 11: L-Bar (Single 90° Bend)',
      dimensions: {
        aMm: 6300,
        bMm: 450,
      },
      hook: { angleDeg: 90, hookCount: 1, hookLengthMm: 144, formula: '9d = 144mm', extensionRule: '9d standard 90° hook' },
      bend: { bendCount: 1, bendAngleDeg: 90, bendDeductionMm: 32, formula: '2d = 32mm', deductionRule: '2d per 90° bend' },
      lap: { lapRequired: false, lapLengthMm: 0, numberOfLaps: 0, totalLapLengthMm: 0, lapRule: 'None', isMissing: false },
      anchorage: { isMissing: false },
      coverMm: 35,
      cuttingLengthM: 6.718,
      cuttingFormula: 'CL = A + B - 2d',
      cuttingFormulaWithValues: '6300 + 450 - 32 = 6718 mm',
      memberCount: 1,
      barsPerMember: 2,
      totalBars: 2,
      totalLengthM: 13.44,
      unitWeightKgM: 1.579,
      unitWeightSource: 'DEFAULT_FORMULA',
      totalWeightKg: 21.22,
      stockLengthLimitM: 12.0,
      stockLengthExceeded: false,
      rawNotation: 'RAW: 2T16 TOP (Hanger Bars across full beam length)',
      interpretedData: { diameterMm: 16, quantity: 2, position: 'Top' },
      sourceDrawing: {
        documentId: 'DOC-S-202',
        drawingNumber: 'S-202',
        revision: '01',
        page: 1,
        locationDescription: 'Beam B101 Longitudinal Section',
        boundingBox: { x: 25, y: 52, width: 50, height: 18, label: 'Beam B101 Rebar', color: '#3b82f6' },
      },
      confidence: 0.98,
      verificationStatus: 'USER VERIFIED',
      isBlocked: false,
      blockedReason: null,
      associatedOpenItemIds: [],
      notes: 'Top rebar for stirrup support.',
      auditTrail: [],
      createdAt: '2026-08-24T06:10:00Z',
      updatedAt: '2026-08-24T06:10:00Z',
    },
    {
      id: 'REBAR-0008',
      elementId: 'RCC-EL-003',
      elementMark: 'B101',
      elementType: 'Beams',
      memberDescription: 'Floor Beam B101 Extra Top Bars over Support',
      level: 'Level 01 (+3.60m)',
      grid: 'Grid B-C / 2',
      barMark: 'B101-EXT1',
      barDiameterMm: 20,
      rebarType: 'Extra top bar',
      rebarGrade: 'Fe500D',
      quantity: 2,
      spacingMm: null,
      distributionLengthMm: null,
      barCountRule: 'MANUAL',
      direction: 'Longitudinal',
      layer: 'T2 (Extra Layer)',
      position: 'Top',
      face: 'Top',
      startLocation: 'Support Center - 1500mm (0.25L)',
      endLocation: 'Support Center + 1500mm (0.25L)',
      shapeCode: '00',
      shapeDescription: 'Shape 00: Straight Bar',
      dimensions: {
        aMm: 3000, // 0.25L each side
      },
      hook: { angleDeg: 0, hookCount: 0, hookLengthMm: 0, formula: 'None', extensionRule: 'Standard' },
      bend: { bendCount: 0, bendAngleDeg: 0, bendDeductionMm: 0, formula: 'None', deductionRule: 'None' },
      lap: { lapRequired: false, lapLengthMm: 0, numberOfLaps: 0, totalLapLengthMm: 0, lapRule: 'None', isMissing: false },
      anchorage: { isMissing: false },
      coverMm: 35,
      cuttingLengthM: 3.000,
      cuttingFormula: 'CL = A',
      cuttingFormulaWithValues: 'CL = 3000 mm',
      memberCount: 1,
      barsPerMember: 2,
      totalBars: 2,
      totalLengthM: 6.00,
      unitWeightKgM: 2.466,
      unitWeightSource: 'DEFAULT_FORMULA',
      totalWeightKg: 14.80,
      stockLengthLimitM: 12.0,
      stockLengthExceeded: false,
      rawNotation: 'RAW: 2T20 Extra Top over Support (Curtailment 0.25L = 1.5m each side)',
      interpretedData: { diameterMm: 20, quantity: 2, position: 'Top' },
      sourceDrawing: {
        documentId: 'DOC-S-202',
        drawingNumber: 'S-202',
        revision: '01',
        page: 1,
        locationDescription: 'Beam B101 Support Detail',
        boundingBox: { x: 25, y: 52, width: 50, height: 18, label: 'Beam B101 Rebar', color: '#3b82f6' },
      },
      confidence: 0.97,
      verificationStatus: 'USER VERIFIED',
      isBlocked: false,
      blockedReason: null,
      associatedOpenItemIds: [],
      notes: 'Negative moment reinforcement over column B/2.',
      auditTrail: [],
      createdAt: '2026-08-24T06:10:00Z',
      updatedAt: '2026-08-24T06:10:00Z',
    },
    {
      id: 'REBAR-0009',
      elementId: 'RCC-EL-003',
      elementMark: 'B101',
      elementType: 'Beams',
      memberDescription: 'Floor Beam B101 Closed Stirrups (2-Legged)',
      level: 'Level 01 (+3.60m)',
      grid: 'Grid B-C / 2',
      barMark: 'B101-S1',
      barDiameterMm: 8,
      rebarType: 'Stirrup',
      rebarGrade: 'Fe500D',
      quantity: 41,
      spacingMm: 150,
      distributionLengthMm: 6000,
      barCountRule: 'CEILING_PLUS_1',
      direction: 'Transverse',
      layer: 'Outer Stirrup',
      position: 'Stirrup',
      face: 'Internal',
      startLocation: 'Face of Column B/2',
      endLocation: 'Face of Column C/2',
      shapeCode: '41',
      shapeDescription: 'Shape 41: Closed Beam Stirrup / Link (135° Hooks)',
      dimensions: {
        aMm: 230, // 300 - 2x35 cover
        bMm: 530, // 600 - 2x35 cover
      },
      hook: { angleDeg: 135, hookCount: 2, hookLengthMm: 160, formula: '2 × 10d = 160mm', extensionRule: '10d link hooks' },
      bend: { bendCount: 5, bendAngleDeg: 135, bendDeductionMm: 96, formula: '12d = 96mm', deductionRule: '12d stirrup allowance' },
      lap: { lapRequired: false, lapLengthMm: 0, numberOfLaps: 0, totalLapLengthMm: 0, lapRule: 'None', isMissing: false },
      anchorage: { isMissing: false },
      coverMm: 35,
      cuttingLengthM: 1.584,
      cuttingFormula: 'CL = 2(A + B) + 2(10d) - 12d',
      cuttingFormulaWithValues: '2(230 + 530) + 160 - 96 = 1584 mm',
      memberCount: 1,
      barsPerMember: 41,
      totalBars: 41,
      totalLengthM: 64.94,
      unitWeightKgM: 0.395,
      unitWeightSource: 'DEFAULT_FORMULA',
      totalWeightKg: 25.65,
      stockLengthLimitM: 12.0,
      stockLengthExceeded: false,
      rawNotation: 'RAW: R8 @ 150 c/c 2-Legged Stirrups with 135° seismic hooks',
      interpretedData: { diameterMm: 8, spacingMm: 150, position: 'Stirrup', quantity: 41 },
      sourceDrawing: {
        documentId: 'DOC-S-202',
        drawingNumber: 'S-202',
        revision: '01',
        page: 1,
        locationDescription: 'Beam Cross Section Sheet S-202',
        boundingBox: { x: 25, y: 52, width: 50, height: 18, label: 'Beam B101 Rebar', color: '#3b82f6' },
      },
      confidence: 0.99,
      verificationStatus: 'USER VERIFIED',
      isBlocked: false,
      blockedReason: null,
      associatedOpenItemIds: [],
      notes: 'Shear stirrups across entire 6.0m clear beam length.',
      auditTrail: [],
      createdAt: '2026-08-24T06:10:00Z',
      updatedAt: '2026-08-24T06:10:00Z',
    },

    // 4. SLAB S1 (Bottom Main X + Bottom Distribution Y)
    {
      id: 'REBAR-0010',
      elementId: 'RCC-EL-004',
      elementMark: 'S1',
      elementType: 'Slabs',
      memberDescription: 'Slab S1 (200mm thk) Bottom X Main Bars',
      level: 'Level 01 (+3.60m)',
      grid: 'Bay B-C / 1-2',
      barMark: 'S1-BOT-X',
      barDiameterMm: 12,
      rebarType: 'Main bar',
      rebarGrade: 'Fe500D',
      quantity: 34,
      spacingMm: 150,
      distributionLengthMm: 5000,
      barCountRule: 'CEILING_PLUS_1',
      direction: 'X',
      layer: 'B1 (Bottom Outer)',
      position: 'Bottom',
      face: 'Bottom',
      startLocation: 'Grid B Beam Support',
      endLocation: 'Grid C Beam Support',
      shapeCode: '00',
      shapeDescription: 'Shape 00: Straight Bar with End Anchorage',
      dimensions: {
        aMm: 6200, // 6000 bay + 200mm anchorage into support beams
      },
      hook: { angleDeg: 0, hookCount: 0, hookLengthMm: 0, formula: 'None', extensionRule: 'Standard' },
      bend: { bendCount: 0, bendAngleDeg: 0, bendDeductionMm: 0, formula: 'None', deductionRule: 'None' },
      lap: { lapRequired: false, lapLengthMm: 0, numberOfLaps: 0, totalLapLengthMm: 0, lapRule: 'None', isMissing: false },
      anchorage: { anchorageLengthMm: 200, isMissing: false },
      coverMm: 25,
      cuttingLengthM: 6.200,
      cuttingFormula: 'CL = A (Span + 2×Anchorage)',
      cuttingFormulaWithValues: '6000 + 200 = 6200 mm',
      memberCount: 1,
      barsPerMember: 34,
      totalBars: 34,
      totalLengthM: 210.80,
      unitWeightKgM: 0.888,
      unitWeightSource: 'DEFAULT_FORMULA',
      totalWeightKg: 187.19,
      stockLengthLimitM: 12.0,
      stockLengthExceeded: false,
      rawNotation: 'RAW: T12 @ 150 c/c BOT X-WAY (Primary Span)',
      interpretedData: { diameterMm: 12, spacingMm: 150, position: 'Bottom', quantity: 34 },
      sourceDrawing: {
        documentId: 'DOC-S-203',
        drawingNumber: 'S-203',
        revision: '01',
        page: 1,
        locationDescription: 'Slab Layout Sheet S-203',
        boundingBox: { x: 55, y: 20, width: 35, height: 30, label: 'Slab S1 Rebar', color: '#ec4899' },
      },
      confidence: 0.98,
      verificationStatus: 'USER VERIFIED',
      isBlocked: false,
      blockedReason: null,
      associatedOpenItemIds: [],
      notes: 'Bottom tension reinforcement in short direction.',
      auditTrail: [],
      createdAt: '2026-08-24T06:10:00Z',
      updatedAt: '2026-08-24T06:10:00Z',
    },
    {
      id: 'REBAR-0011',
      elementId: 'RCC-EL-004',
      elementMark: 'S1',
      elementType: 'Slabs',
      memberDescription: 'Slab S1 (200mm thk) Bottom Y Distribution Bars',
      level: 'Level 01 (+3.60m)',
      grid: 'Bay B-C / 1-2',
      barMark: 'S1-BOT-Y',
      barDiameterMm: 10,
      rebarType: 'Distribution bar',
      rebarGrade: 'Fe500D',
      quantity: 31,
      spacingMm: 200,
      distributionLengthMm: 6000,
      barCountRule: 'CEILING_PLUS_1',
      direction: 'Y',
      layer: 'B2 (Bottom Inner)',
      position: 'Bottom',
      face: 'Bottom',
      startLocation: 'Grid 1 Beam Support',
      endLocation: 'Grid 2 Beam Support',
      shapeCode: '00',
      shapeDescription: 'Shape 00: Straight Bar',
      dimensions: {
        aMm: 5200, // 5000 + 200mm anchorage
      },
      hook: { angleDeg: 0, hookCount: 0, hookLengthMm: 0, formula: 'None', extensionRule: 'Standard' },
      bend: { bendCount: 0, bendAngleDeg: 0, bendDeductionMm: 0, formula: 'None', deductionRule: 'None' },
      lap: { lapRequired: false, lapLengthMm: 0, numberOfLaps: 0, totalLapLengthMm: 0, lapRule: 'None', isMissing: false },
      anchorage: { anchorageLengthMm: 200, isMissing: false },
      coverMm: 25,
      cuttingLengthM: 5.200,
      cuttingFormula: 'CL = A',
      cuttingFormulaWithValues: '5000 + 200 = 5200 mm',
      memberCount: 1,
      barsPerMember: 31,
      totalBars: 31,
      totalLengthM: 161.20,
      unitWeightKgM: 0.617,
      unitWeightSource: 'DEFAULT_FORMULA',
      totalWeightKg: 99.46,
      stockLengthLimitM: 12.0,
      stockLengthExceeded: false,
      rawNotation: 'RAW: T10 @ 200 c/c BOT Y-WAY (Secondary Span)',
      interpretedData: { diameterMm: 10, spacingMm: 200, position: 'Bottom', quantity: 31 },
      sourceDrawing: {
        documentId: 'DOC-S-203',
        drawingNumber: 'S-203',
        revision: '01',
        page: 1,
        locationDescription: 'Slab Layout Sheet S-203',
        boundingBox: { x: 55, y: 20, width: 35, height: 30, label: 'Slab S1 Rebar', color: '#ec4899' },
      },
      confidence: 0.98,
      verificationStatus: 'USER VERIFIED',
      isBlocked: false,
      blockedReason: null,
      associatedOpenItemIds: [],
      notes: 'Distribution reinforcement in long direction.',
      auditTrail: [],
      createdAt: '2026-08-24T06:10:00Z',
      updatedAt: '2026-08-24T06:10:00Z',
    },

    // 5. SHEAR WALL SW1 (Vertical Face 1, Face 2 & Horizontal Links)
    {
      id: 'REBAR-0012',
      elementId: 'RCC-EL-005',
      elementMark: 'SW1',
      elementType: 'Walls',
      memberDescription: 'Shear Wall SW1 Vertical Rebar Each Face (Face 1 & Face 2)',
      level: 'Ground Floor (+0.00 to +3.60m)',
      grid: 'Grid A / 1-3',
      barMark: 'SW1-V1',
      barDiameterMm: 12,
      rebarType: 'Main bar',
      rebarGrade: 'Fe500D',
      quantity: 46, // 23 bars per face x 2 faces
      spacingMm: 200,
      distributionLengthMm: 4500,
      barCountRule: 'CEILING_PLUS_1',
      direction: 'Longitudinal',
      layer: 'Outer Both Faces',
      position: 'Face 1',
      face: 'Both',
      startLocation: 'Ground Floor +0.00m',
      endLocation: 'Level 01 +3.60m + 50d Lap (600mm)',
      shapeCode: '00',
      shapeDescription: 'Shape 00: Straight Vertical Wall Bar',
      dimensions: {
        aMm: 4200, // 3600 height + 600 lap
      },
      hook: { angleDeg: 0, hookCount: 0, hookLengthMm: 0, formula: 'None', extensionRule: 'Standard' },
      bend: { bendCount: 0, bendAngleDeg: 0, bendDeductionMm: 0, formula: 'None', deductionRule: 'None' },
      lap: { lapRequired: true, lapLengthMm: 600, numberOfLaps: 1, totalLapLengthMm: 600, lapRule: '50d Wall Lap', isMissing: false },
      anchorage: { isMissing: false },
      coverMm: 30,
      cuttingLengthM: 4.200,
      cuttingFormula: 'CL = A (Height + Lap)',
      cuttingFormulaWithValues: '3600 + 600 = 4200 mm',
      memberCount: 2, // 2 faces
      barsPerMember: 23,
      totalBars: 46,
      totalLengthM: 193.20,
      unitWeightKgM: 0.888,
      unitWeightSource: 'DEFAULT_FORMULA',
      totalWeightKg: 171.56,
      stockLengthLimitM: 12.0,
      stockLengthExceeded: false,
      rawNotation: 'RAW: T12 @ 200 c/c EACH FACE VERTICAL (50d lap above slab)',
      interpretedData: { diameterMm: 12, spacingMm: 200, position: 'Both Faces', quantity: 46 },
      sourceDrawing: {
        documentId: 'DOC-S-204',
        drawingNumber: 'S-204',
        revision: '01',
        page: 1,
        locationDescription: 'Wall Section SW1',
        boundingBox: { x: 70, y: 55, width: 25, height: 35, label: 'Wall SW1 Rebar', color: '#8b5cf6' },
      },
      confidence: 0.98,
      verificationStatus: 'USER VERIFIED',
      isBlocked: false,
      blockedReason: null,
      associatedOpenItemIds: [],
      notes: 'Double layer vertical reinforcement (23 bars per face).',
      auditTrail: [],
      createdAt: '2026-08-24T06:10:00Z',
      updatedAt: '2026-08-24T06:10:00Z',
    },
    {
      id: 'REBAR-0013',
      elementId: 'RCC-EL-005',
      elementMark: 'SW1',
      elementType: 'Walls',
      memberDescription: 'Shear Wall SW1 Horizontal Distribution Bars (Face 1 & Face 2)',
      level: 'Ground Floor (+0.00 to +3.60m)',
      grid: 'Grid A / 1-3',
      barMark: 'SW1-H1',
      barDiameterMm: 10,
      rebarType: 'Distribution bar',
      rebarGrade: 'Fe500D',
      quantity: 38, // 19 bars per face x 2 faces
      spacingMm: 200,
      distributionLengthMm: 3600,
      barCountRule: 'CEILING_PLUS_1',
      direction: 'Transverse',
      layer: 'Inner Both Faces',
      position: 'Face 2',
      face: 'Both',
      startLocation: 'Wall Left Edge',
      endLocation: 'Wall Right Edge',
      shapeCode: '11',
      shapeDescription: 'Shape 11: L-Bar (End 90° U-Return)',
      dimensions: {
        aMm: 4440, // 4500 - 2x30 cover
        bMm: 200,  // Return leg
      },
      hook: { angleDeg: 90, hookCount: 1, hookLengthMm: 90, formula: '9d = 90mm', extensionRule: '9d hook' },
      bend: { bendCount: 1, bendAngleDeg: 90, bendDeductionMm: 20, formula: '2d = 20mm', deductionRule: '2d bend' },
      lap: { lapRequired: false, lapLengthMm: 0, numberOfLaps: 0, totalLapLengthMm: 0, lapRule: 'None', isMissing: false },
      anchorage: { isMissing: false },
      coverMm: 30,
      cuttingLengthM: 4.620,
      cuttingFormula: 'CL = A + B - 2d',
      cuttingFormulaWithValues: '4440 + 200 - 20 = 4620 mm',
      memberCount: 2,
      barsPerMember: 19,
      totalBars: 38,
      totalLengthM: 175.56,
      unitWeightKgM: 0.617,
      unitWeightSource: 'DEFAULT_FORMULA',
      totalWeightKg: 108.32,
      stockLengthLimitM: 12.0,
      stockLengthExceeded: false,
      rawNotation: 'RAW: T10 @ 200 c/c EACH FACE HORIZONTAL (with 200mm end returns)',
      interpretedData: { diameterMm: 10, spacingMm: 200, position: 'Both Faces', quantity: 38 },
      sourceDrawing: {
        documentId: 'DOC-S-204',
        drawingNumber: 'S-204',
        revision: '01',
        page: 1,
        locationDescription: 'Wall Section SW1',
        boundingBox: { x: 70, y: 55, width: 25, height: 35, label: 'Wall SW1 Rebar', color: '#8b5cf6' },
      },
      confidence: 0.98,
      verificationStatus: 'USER VERIFIED',
      isBlocked: false,
      blockedReason: null,
      associatedOpenItemIds: [],
      notes: 'Horizontal shear reinforcement on both faces.',
      auditTrail: [],
      createdAt: '2026-08-24T06:10:00Z',
      updatedAt: '2026-08-24T06:10:00Z',
    },

    // 6. STAIRCASE ST1 (Main Flight Inclined Bars + Distribution)
    {
      id: 'REBAR-0014',
      elementId: 'RCC-EL-006',
      elementMark: 'ST1',
      elementType: 'Stairs',
      memberDescription: 'Staircase ST1 Waist Slab Main Inclined Bars',
      level: 'Ground to Level 01 (+0.00 to +3.60m)',
      grid: 'Stair Core Grid D/3',
      barMark: 'ST1-M1',
      barDiameterMm: 16,
      rebarType: 'Main bar',
      rebarGrade: 'Fe500D',
      quantity: 9,
      spacingMm: 150,
      distributionLengthMm: 1200,
      barCountRule: 'CEILING_PLUS_1',
      direction: 'Longitudinal',
      layer: 'Bottom Waist',
      position: 'Bottom',
      face: 'Bottom',
      startLocation: 'Ground Floor Starter Beam',
      endLocation: 'Mid Landing Beam',
      shapeCode: '31',
      shapeDescription: 'Shape 31: Cranked Bar (Waist to Landing Incline)',
      dimensions: {
        aMm: 800,  // Bottom landing
        bMm: 3100, // Inclined waist span
        cMm: 900,  // Top landing
        dMm: 150,  // Crank offset
      },
      hook: { angleDeg: 0, hookCount: 0, hookLengthMm: 0, formula: 'None', extensionRule: 'Standard' },
      bend: { bendCount: 2, bendAngleDeg: 45, bendDeductionMm: 32, formula: '2d = 32mm', deductionRule: '1d per 45° bend' },
      lap: { lapRequired: false, lapLengthMm: 0, numberOfLaps: 0, totalLapLengthMm: 0, lapRule: 'None', isMissing: false },
      anchorage: { isMissing: false },
      coverMm: 25,
      cuttingLengthM: 4.831,
      cuttingFormula: 'CL = A + B + C + 0.42D - 2d',
      cuttingFormulaWithValues: '800 + 3100 + 900 + 0.42(150) - 32 = 4831 mm',
      memberCount: 1,
      barsPerMember: 9,
      totalBars: 9,
      totalLengthM: 43.48,
      unitWeightKgM: 1.579,
      unitWeightSource: 'DEFAULT_FORMULA',
      totalWeightKg: 68.65,
      stockLengthLimitM: 12.0,
      stockLengthExceeded: false,
      rawNotation: 'RAW: T16 @ 150 c/c Cranked Main Flight Rebar',
      interpretedData: { diameterMm: 16, spacingMm: 150, position: 'Bottom', quantity: 9 },
      sourceDrawing: {
        documentId: 'DOC-S-205',
        drawingNumber: 'S-205',
        revision: '01',
        page: 1,
        locationDescription: 'Staircase Flight Detail',
        boundingBox: { x: 10, y: 65, width: 30, height: 25, label: 'Stair ST1 Rebar', color: '#0ea5e9' },
      },
      confidence: 0.97,
      verificationStatus: 'USER VERIFIED',
      isBlocked: false,
      blockedReason: null,
      associatedOpenItemIds: [],
      notes: 'Continuous waist flight bar anchored into landing beams.',
      auditTrail: [],
      createdAt: '2026-08-24T06:10:00Z',
      updatedAt: '2026-08-24T06:10:00Z',
    },

    // 7. OPEN ITEM DEMO REBAR (Blocked due to missing cover/lap)
    {
      id: 'REBAR-0015',
      elementId: 'RCC-EL-010',
      elementMark: 'C99',
      elementType: 'Columns',
      memberDescription: 'Roof Column C99 Vertical Rebar (UNRESOLVED AI EXTRACTION)',
      level: 'Roof Level (+12.00m)',
      grid: 'Grid E/5',
      barMark: 'C99-M1',
      barDiameterMm: 16,
      rebarType: 'Main bar',
      rebarGrade: 'Fe500D',
      quantity: 4,
      spacingMm: null,
      distributionLengthMm: null,
      barCountRule: 'MANUAL',
      direction: 'Longitudinal',
      layer: 'Outer',
      position: 'Main',
      face: 'Both',
      startLocation: 'Roof Slab',
      endLocation: 'Parapet Cap',
      shapeCode: '00',
      shapeDescription: 'Shape 00: Straight Bar',
      dimensions: {
        aMm: 3000,
      },
      hook: { angleDeg: 0, hookCount: 0, hookLengthMm: 0, formula: 'None', extensionRule: 'Standard' },
      bend: { bendCount: 0, bendAngleDeg: 0, bendDeductionMm: 0, formula: 'None', deductionRule: 'None' },
      lap: { lapRequired: true, lapLengthMm: 0, numberOfLaps: 1, totalLapLengthMm: 0, lapRule: 'Unknown Lap Rule', isMissing: true },
      anchorage: { isMissing: true },
      coverMm: null, // MISSING COVER -> TRIGGERS OPEN ITEM
      cuttingLengthM: 0,
      cuttingFormula: 'BLOCKED (Missing Cover & Lap Length)',
      cuttingFormulaWithValues: 'Calculation halted due to missing parameters',
      memberCount: 1,
      barsPerMember: 0,
      totalBars: 0,
      totalLengthM: 0,
      unitWeightKgM: 1.579,
      unitWeightSource: 'DEFAULT_FORMULA',
      totalWeightKg: 0,
      stockLengthLimitM: 12.0,
      stockLengthExceeded: false,
      rawNotation: 'RAW: 4T16 (Cover and Lap not specified in drawing notes)',
      interpretedData: { diameterMm: 16, quantity: 4, position: 'Main' },
      sourceDrawing: {
        documentId: 'DOC-S-301',
        drawingNumber: 'S-301',
        revision: '01',
        page: 1,
        locationDescription: 'Roof Framing Plan Grid E/5',
        boundingBox: { x: 75, y: 15, width: 18, height: 18, label: 'Unverified C99', color: '#ef4444' },
      },
      confidence: 0.45,
      verificationStatus: 'BLOCKED',
      isBlocked: true,
      blockedReason: 'Concrete cover and lap length are missing in drawing notes. Open Item required to prevent fabricated quantities.',
      associatedOpenItemIds: ['OI-REBAR-001'],
      notes: 'BLOCKED: Awaiting engineer input on structural cover and anchorage detail.',
      auditTrail: [
        {
          id: 'AUD-002',
          timestamp: '2026-08-24T06:15:00Z',
          user: 'BBS Rule Engine',
          action: 'CREATED',
          previousValue: null,
          newValue: 0,
          reason: 'Flagged missing cover and lap parameters as Open Item OI-REBAR-001',
        }
      ],
      createdAt: '2026-08-24T06:15:00Z',
      updatedAt: '2026-08-24T06:15:00Z',
    }
  ];
}

// =========================================================================
// 7. BBS REVISION DELTA & CONFLICT SAMPLES
// =========================================================================

export function getInitialBbsRevisions(): BbsRevisionDelta[] {
  return [
    {
      id: 'REV-DELTA-01',
      barMark: 'B101-B1',
      element: 'Beam B101 Bottom Rebar',
      oldRevision: 'Rev 00',
      newRevision: 'Rev 01',
      oldNotation: '2T20 BOT (Total 33.34 kg)',
      newNotation: '3T20 BOT (Total 50.01 kg)',
      oldWeightKg: 33.34,
      newWeightKg: 50.01,
      deltaKg: 16.67,
      changeSummary: 'Structural Consultant increased bottom reinforcement from 2T20 to 3T20 due to revised superimposed live load of 4.0 kN/m².',
      reviewed: false,
    },
    {
      id: 'REV-DELTA-02',
      barMark: 'S1-BOT-X',
      element: 'Slab S1 Main Rebar',
      oldRevision: 'Rev 00',
      newRevision: 'Rev 01',
      oldNotation: 'T10 @ 150 c/c (Total 129.80 kg)',
      newNotation: 'T12 @ 150 c/c (Total 187.19 kg)',
      oldWeightKg: 129.80,
      newWeightKg: 187.19,
      deltaKg: 57.39,
      changeSummary: 'Bar diameter upgraded from T10 to T12 following deflection check calculation.',
      reviewed: true,
    }
  ];
}

export function getInitialRebarConflicts(): RebarConflictRecord[] {
  return [
    {
      id: 'CONF-REBAR-01',
      barMark: 'B101-B1',
      element: 'Beam B101 Bottom Reinforcement',
      drawingA: {
        drawingNumber: 'S-201',
        revision: 'Rev 01',
        notation: '3T20 BOT Main Steel',
        location: 'Beam Framing Plan Grid B-C/2',
      },
      drawingB: {
        drawingNumber: 'S-305',
        revision: 'Rev 00',
        notation: '2T20 + 1T16 BOT',
        location: 'Typical Beam Standard Detail Sheet',
      },
      status: 'OPEN',
      resolutionNote: undefined,
    }
  ];
}
