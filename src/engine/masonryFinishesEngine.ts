/**
 * PHASE 15C — DETERMINISTIC MASONRY, DPC, DOORS/WINDOWS & FINISHES ENGINE
 * Standard-compliant geometric arithmetic complying with POMI / IS 1200 / NRM2
 * Zero guesswork architecture with explicit formulas, substitutions, and dependency cascades.
 */

import {
  MasonryElementRecord,
  DpcElementRecord,
  DoorScheduleRecord,
  WindowScheduleRecord,
  PlasterTakeoffRecord,
  FloorFinishRecord,
  PaintingRecord,
  WaterproofingRecord,
  CeilingRecord,
  WallFinishCladdingRecord,
  RoomFinishScheduleRecord,
  ArchitecturalOpenItem,
  ArchitecturalConflict,
  ArchitecturalRevisionRecord,
  ProjectArchitecturalSettings,
  MasonryOpeningObject,
  UserCorrectionAudit
} from '../types/masonryFinishesTypes';

export const DEFAULT_ARCHITECTURAL_SETTINGS: ProjectArchitecturalSettings = {
  measurementStandard: 'POMI',
  dpcMeasurementUnit: 'm²',
  openingPlasterDeductionThresholdM2: 0.1,
  deductFullOpeningForPlasterTwoFaces: true,
  defaultMortarMix: '1:4 Cement Sand',
  includeMortarTakeoff: false,
  defaultPlasterInternalThicknessMm: 12,
  defaultPlasterExternalThicknessMm: 20,
  paintCoatWiseMeasurementRequired: false,
};

/**
 * 1. Calculate Single Opening Quantities (Area & Volume)
 */
export function calculateOpeningMetrics(
  widthM: number,
  heightM: number,
  wallThicknessM: number,
  quantity: number = 1,
  standard: string = 'POMI'
): {
  singleAreaM2: number;
  totalAreaM2: number;
  singleVolumeM3: number;
  totalVolumeM3: number;
  isDeductibleMasonry: boolean;
  isDeductiblePlasterOneFace: boolean;
  isDeductiblePlasterTwoFaces: boolean;
} {
  const singleAreaM2 = Number((widthM * heightM).toFixed(4));
  const totalAreaM2 = Number((singleAreaM2 * quantity).toFixed(4));
  const singleVolumeM3 = Number((singleAreaM2 * wallThicknessM).toFixed(4));
  const totalVolumeM3 = Number((totalAreaM2 * wallThicknessM).toFixed(4));

  let isDeductibleMasonry = true;
  let isDeductiblePlasterOneFace = true;
  let isDeductiblePlasterTwoFaces = true;

  if (standard === 'IS1200') {
    if (singleAreaM2 < 0.1) {
      isDeductibleMasonry = false;
      isDeductiblePlasterOneFace = false;
      isDeductiblePlasterTwoFaces = false;
    } else if (singleAreaM2 <= 0.5) {
      isDeductibleMasonry = true;
      isDeductiblePlasterOneFace = false;
      isDeductiblePlasterTwoFaces = false;
    } else if (singleAreaM2 <= 3.0) {
      isDeductibleMasonry = true;
      isDeductiblePlasterOneFace = true;
      isDeductiblePlasterTwoFaces = false;
    } else {
      isDeductibleMasonry = true;
      isDeductiblePlasterOneFace = true;
      isDeductiblePlasterTwoFaces = true;
    }
  } else {
    // POMI / NRM2 Standard: Deduct all openings >= 0.1 m2
    isDeductibleMasonry = singleAreaM2 >= 0.05;
    isDeductiblePlasterOneFace = singleAreaM2 >= 0.1;
    isDeductiblePlasterTwoFaces = singleAreaM2 >= 0.1;
  }

  return {
    singleAreaM2,
    totalAreaM2,
    singleVolumeM3,
    totalVolumeM3,
    isDeductibleMasonry,
    isDeductiblePlasterOneFace,
    isDeductiblePlasterTwoFaces,
  };
}

/**
 * 2. Calculate Masonry Wall Gross & Net Quantities
 */
export function calculateMasonryElement(
  wall: MasonryElementRecord,
  settings: ProjectArchitecturalSettings = DEFAULT_ARCHITECTURAL_SETTINGS
): MasonryElementRecord {
  const qty = Math.max(1, wall.quantity || 1);
  const L = wall.lengthM || 0;
  const H = wall.heightM || 0;
  const T = wall.thicknessM || 0;

  // Zero-thickness or zero-height check
  if (!T || T <= 0 || !H || H <= 0 || !L || L <= 0) {
    return {
      ...wall,
      grossAreaM2: 0,
      grossVolumeM3: 0,
      deductionsAreaM2: 0,
      deductionsVolumeM3: 0,
      netAreaM2: 0,
      netVolumeM3: 0,
      isBlocked: true,
      blockedReason: !T || T <= 0 ? 'Missing or ambiguous wall thickness.' : 'Missing wall height/length.',
      calculationFormulaWithValues: 'Incomplete geometric parameters (L, H or T missing).',
    };
  }

  const grossAreaM2 = Number((L * H * qty).toFixed(4));
  const grossVolumeM3 = Number((grossAreaM2 * T).toFixed(4));

  // Deductions from openings
  let totalDeductionsAreaM2 = 0;
  let totalDeductionsVolumeM3 = 0;

  const recalculatedOpenings: MasonryOpeningObject[] = (wall.openings || []).map((op) => {
    const opMetrics = calculateOpeningMetrics(op.widthM, op.heightM, T, op.quantity, settings.measurementStandard);
    
    if (opMetrics.isDeductibleMasonry) {
      totalDeductionsAreaM2 += opMetrics.totalAreaM2;
      totalDeductionsVolumeM3 += opMetrics.totalVolumeM3;
    }

    return {
      ...op,
      wallThicknessM: T,
      singleAreaM2: opMetrics.singleAreaM2,
      totalAreaM2: opMetrics.totalAreaM2,
      singleVolumeM3: opMetrics.singleVolumeM3,
      totalVolumeM3: opMetrics.totalVolumeM3,
      isDeductibleMasonry: opMetrics.isDeductibleMasonry,
      isDeductiblePlasterOneFace: opMetrics.isDeductiblePlasterOneFace,
      isDeductiblePlasterTwoFaces: opMetrics.isDeductiblePlasterTwoFaces,
    };
  });

  totalDeductionsAreaM2 = Number(totalDeductionsAreaM2.toFixed(4));
  totalDeductionsVolumeM3 = Number(totalDeductionsVolumeM3.toFixed(4));

  const netAreaM2 = Math.max(0, Number((grossAreaM2 - totalDeductionsAreaM2).toFixed(4)));
  const netVolumeM3 = Math.max(0, Number((grossVolumeM3 - totalDeductionsVolumeM3).toFixed(4)));

  const formulaWithValues =
    recalculatedOpenings.length > 0
      ? `Gross Vol: (${L.toFixed(2)}m × ${H.toFixed(2)}m × ${T.toFixed(3)}m × ${qty}) = ${grossVolumeM3.toFixed(3)} m³ | Deductions: (${recalculatedOpenings.map(o => `${o.openingMark}: ${o.widthM}×${o.heightM}×${T} = ${(o.totalVolumeM3).toFixed(3)}m³`).join(' + ')}) = -${totalDeductionsVolumeM3.toFixed(3)} m³ | Net Vol = ${netVolumeM3.toFixed(3)} m³`
      : `Gross & Net Vol: (${L.toFixed(2)}m × ${H.toFixed(2)}m × ${T.toFixed(3)}m × ${qty}) = ${netVolumeM3.toFixed(3)} m³`;

  return {
    ...wall,
    openings: recalculatedOpenings,
    grossAreaM2,
    grossVolumeM3,
    deductionsAreaM2: totalDeductionsAreaM2,
    deductionsVolumeM3: totalDeductionsVolumeM3,
    netAreaM2,
    netVolumeM3,
    isBlocked: false,
    blockedReason: null,
    calculationFormulaWithValues: formulaWithValues,
  };
}

/**
 * 3. Calculate DPC Quantities
 */
export function calculateDpcElement(
  dpc: DpcElementRecord,
  settings: ProjectArchitecturalSettings = DEFAULT_ARCHITECTURAL_SETTINGS
): DpcElementRecord {
  const L = dpc.lengthM || 0;
  const W = dpc.widthM || 0;
  const qty = Math.max(1, dpc.quantity || 1);

  if (!L || L <= 0 || !W || W <= 0) {
    return {
      ...dpc,
      areaM2: 0,
      linearLengthM: 0,
      isBlocked: true,
      blockedReason: 'DPC length or width dimension missing.',
      calculationFormulaWithValues: 'DPC dimension missing.',
    };
  }

  const areaM2 = Number((L * W * qty).toFixed(4));
  const linearLengthM = Number((L * qty).toFixed(3));

  const formulaWithValues =
    settings.dpcMeasurementUnit === 'm'
      ? `DPC Linear Length: ${L.toFixed(2)}m × ${qty} = ${linearLengthM.toFixed(2)} m (Width: ${W.toFixed(3)}m)`
      : `DPC Area: ${L.toFixed(2)}m (L) × ${W.toFixed(3)}m (W) × ${qty} = ${areaM2.toFixed(3)} m²`;

  return {
    ...dpc,
    areaM2,
    linearLengthM,
    isBlocked: false,
    blockedReason: null,
    calculationFormulaWithValues: formulaWithValues,
  };
}

/**
 * 4. Calculate Plaster Takeoff Item
 */
export function calculatePlasterElement(
  plaster: PlasterTakeoffRecord,
  associatedWall?: MasonryElementRecord,
  settings: ProjectArchitecturalSettings = DEFAULT_ARCHITECTURAL_SETTINGS
): PlasterTakeoffRecord {
  if (associatedWall) {
    const faces = plaster.faceType === 'Both Faces' ? 2 : 1;
    const grossAreaM2 = Number((associatedWall.grossAreaM2 * faces).toFixed(4));
    
    let totalDeductionM2 = 0;
    (associatedWall.openings || []).forEach((op) => {
      const opMetrics = calculateOpeningMetrics(op.widthM, op.heightM, associatedWall.thicknessM, op.quantity, settings.measurementStandard);
      if (faces === 1 && opMetrics.isDeductiblePlasterOneFace) {
        totalDeductionM2 += opMetrics.totalAreaM2;
      } else if (faces === 2 && opMetrics.isDeductiblePlasterTwoFaces) {
        totalDeductionM2 += opMetrics.totalAreaM2 * 2;
      }
    });

    totalDeductionM2 = Number(totalDeductionM2.toFixed(4));
    const netAreaM2 = Math.max(0, Number((grossAreaM2 - totalDeductionM2).toFixed(4)));
    const volumeM3 = plaster.thicknessMm > 0 ? Number((netAreaM2 * (plaster.thicknessMm / 1000)).toFixed(4)) : undefined;

    const formulaWithValues =
      totalDeductionM2 > 0
        ? `Gross Plaster: (${associatedWall.lengthM}m × ${associatedWall.heightM}m × ${faces} faces) = ${grossAreaM2.toFixed(2)} m² | Deductions: -${totalDeductionM2.toFixed(2)} m² | Net Plaster Area: ${netAreaM2.toFixed(2)} m²`
        : `Gross & Net Plaster: (${associatedWall.lengthM}m × ${associatedWall.heightM}m × ${faces} faces) = ${netAreaM2.toFixed(2)} m²`;

    return {
      ...plaster,
      facesCount: faces,
      grossAreaM2,
      deductionAreaM2: totalDeductionM2,
      netAreaM2,
      volumeM3,
      calculationFormulaWithValues: formulaWithValues,
    };
  }

  // Standalone plaster record
  const netAreaM2 = Math.max(0, Number((plaster.grossAreaM2 - (plaster.deductionAreaM2 || 0)).toFixed(4)));
  const volumeM3 = plaster.thicknessMm > 0 ? Number((netAreaM2 * (plaster.thicknessMm / 1000)).toFixed(4)) : undefined;

  return {
    ...plaster,
    netAreaM2,
    volumeM3,
    calculationFormulaWithValues: `Gross: ${plaster.grossAreaM2.toFixed(2)} m² − Deduction: ${(plaster.deductionAreaM2 || 0).toFixed(2)} m² = Net: ${netAreaM2.toFixed(2)} m²`,
  };
}

/**
 * 5. Calculate Waterproofing Item (Horizontal + Upstand Area)
 */
export function calculateWaterproofingElement(
  wp: WaterproofingRecord
): WaterproofingRecord {
  const horizontalAreaM2 = Number((wp.horizontalAreaM2 || 0).toFixed(4));
  const upstandLengthM = Number((wp.upstandLengthM || 0).toFixed(3));
  const upstandHeightM = Number((wp.upstandHeightM || 0).toFixed(3));
  const upstandAreaM2 = Number((upstandLengthM * upstandHeightM).toFixed(4));
  const totalWaterproofingAreaM2 = Number((horizontalAreaM2 + upstandAreaM2).toFixed(4));

  const formulaWithValues =
    upstandAreaM2 > 0
      ? `Horizontal Floor Area: ${horizontalAreaM2.toFixed(2)} m² + Vertical Upstand: (${upstandLengthM.toFixed(2)}m (L) × ${upstandHeightM.toFixed(2)}m (H) = ${upstandAreaM2.toFixed(2)} m²) = Total WP: ${totalWaterproofingAreaM2.toFixed(2)} m²`
      : `Horizontal Floor Area: ${horizontalAreaM2.toFixed(2)} m² (No Upstand)`;

  return {
    ...wp,
    upstandAreaM2,
    totalWaterproofingAreaM2,
    calculationFormulaWithValues: formulaWithValues,
  };
}

/**
 * 6. Cascading Dependency Recalculation Engine
 * When wall geometry or thickness changes, cascades update to:
 * - Masonry Volume
 * - DPC Area & Linear length
 * - Plaster Area & Volume
 * - Painting Area
 * - Wall Cladding / Dado Tiles
 */
export function cascadeWallGeometricChange(
  wall: MasonryElementRecord,
  newLengthM: number,
  newHeightM: number,
  newThicknessM: number,
  allDpcs: DpcElementRecord[],
  allPlasters: PlasterTakeoffRecord[],
  allPaints: PaintingRecord[],
  allCladdings: WallFinishCladdingRecord[],
  userReason: string = 'Geometry Revision'
): {
  updatedWall: MasonryElementRecord;
  updatedDpcs: DpcElementRecord[];
  updatedPlasters: PlasterTakeoffRecord[];
  updatedPaints: PaintingRecord[];
  updatedCladdings: WallFinishCladdingRecord[];
  auditEntry: UserCorrectionAudit;
} {
  const originalSnapshot = `L=${wall.lengthM}m, H=${wall.heightM}m, T=${wall.thicknessM}m | Net Vol=${wall.netVolumeM3}m³`;

  const modifiedWallDraft: MasonryElementRecord = {
    ...wall,
    lengthM: newLengthM,
    heightM: newHeightM,
    thicknessM: newThicknessM,
    status: 'USER CORRECTED',
  };

  const updatedWall = calculateMasonryElement(modifiedWallDraft);
  const newSnapshot = `L=${updatedWall.lengthM}m, H=${updatedWall.heightM}m, T=${updatedWall.thicknessM}m | Net Vol=${updatedWall.netVolumeM3}m³`;

  const auditEntry: UserCorrectionAudit = {
    id: `AUDIT-${Date.now()}`,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
    user: 'Lead Quantity Surveyor',
    fieldChanged: 'Wall Geometry (Length / Height / Thickness)',
    originalValue: originalSnapshot,
    correctedValue: newSnapshot,
    reason: userReason,
    sourceReference: 'Architectural Edit Modal with Cascading Dependency Engine',
  };

  updatedWall.corrections = [auditEntry, ...(wall.corrections || [])];

  // 1. Update Associated DPC
  const updatedDpcs = allDpcs.map((dpc) => {
    if (dpc.associatedWallId === wall.id) {
      const dpcDraft: DpcElementRecord = {
        ...dpc,
        lengthM: newLengthM,
        widthM: newThicknessM, // DPC width matches wall thickness
        status: 'USER CORRECTED',
        corrections: [auditEntry, ...(dpc.corrections || [])],
      };
      return calculateDpcElement(dpcDraft);
    }
    return dpc;
  });

  // 2. Update Associated Plasters
  const updatedPlasters = allPlasters.map((plaster) => {
    if (plaster.associatedWallId === wall.id) {
      return calculatePlasterElement(plaster, updatedWall);
    }
    return plaster;
  });

  // 3. Update Associated Paints
  const updatedPaints = allPaints.map((pnt) => {
    const matchingPlaster = updatedPlasters.find((pl) => pl.associatedWallId === wall.id);
    if (matchingPlaster) {
      return {
        ...pnt,
        netAreaM2: matchingPlaster.netAreaM2,
        calculationFormulaWithValues: `Derived from updated plaster surface: ${matchingPlaster.netAreaM2.toFixed(2)} m²`,
        status: 'USER CORRECTED' as const,
      };
    }
    return pnt;
  });

  // 4. Update Associated Claddings
  const updatedCladdings = allCladdings.map((clad) => {
    if (clad.roomZone === wall.zone || clad.claddingMark.includes(wall.wallMark)) {
      const grossArea = Number((newLengthM * clad.claddingHeightM).toFixed(4));
      const netArea = Math.max(0, Number((grossArea - clad.openingDeductionsM2).toFixed(4)));
      return {
        ...clad,
        wallPerimeterLengthM: newLengthM,
        grossAreaM2: grossArea,
        netAreaM2: netArea,
        status: 'USER CORRECTED' as const,
      };
    }
    return clad;
  });

  return {
    updatedWall,
    updatedDpcs,
    updatedPlasters,
    updatedPaints,
    updatedCladdings,
    auditEntry,
  };
}

/**
 * 7. Initial Seed Dataset Generator for Phase 15C
 */
export function getInitialArchitecturalDataset(): {
  walls: MasonryElementRecord[];
  dpcs: DpcElementRecord[];
  doors: DoorScheduleRecord[];
  windows: WindowScheduleRecord[];
  plasters: PlasterTakeoffRecord[];
  floorings: FloorFinishRecord[];
  paints: PaintingRecord[];
  waterproofings: WaterproofingRecord[];
  ceilings: CeilingRecord[];
  claddings: WallFinishCladdingRecord[];
  roomSchedules: RoomFinishScheduleRecord[];
  openItems: ArchitecturalOpenItem[];
  conflicts: ArchitecturalConflict[];
  revisions: ArchitecturalRevisionRecord[];
} {
  // 1. Initial Walls
  const rawWalls: MasonryElementRecord[] = [
    {
      id: 'WALL-EXT-GF-01',
      wallMark: 'W-EXT-01',
      wallType: 'Block Masonry',
      level: 'Ground Floor',
      zone: 'Grid A/1-4 (North Facade)',
      lengthM: 36.0,
      heightM: 3.45,
      heightDerivationMethod: 'Floor-to-Floor Minus Slab Depth',
      heightDerivationFormula: '3.600m (F2F) − 0.150m (Slab) = 3.450m',
      thicknessM: 0.20,
      quantity: 1,
      material: '200mm Hollow Concrete Block (Grade 7.5)',
      blockBrickType: '400x200x200 Concrete Block',
      mortarSpec: {
        cementRatio: 1,
        sandRatio: 4,
        mixNotation: '1:4 Cement Sand',
        jointThicknessMm: 10,
        volumeMethod: 'Standard Brick Table',
      },
      lintelType: 'RCC Lintel',
      linkedRccLintelId: 'LINTEL-L01',
      linkedDpcId: 'DPC-GF-01',
      openings: [
        {
          id: 'OP-D01-1',
          openingMark: 'D-01',
          type: 'Door',
          widthM: 1.8,
          heightM: 2.4,
          sillHeightM: 0.0,
          headHeightM: 2.4,
          wallThicknessM: 0.20,
          quantity: 1,
          singleAreaM2: 4.32,
          totalAreaM2: 4.32,
          singleVolumeM3: 0.864,
          totalVolumeM3: 0.864,
          isFullHeight: false,
          deductionRule: 'POMI: Deduct net opening > 0.1 m²',
          isDeductibleMasonry: true,
          isDeductiblePlasterOneFace: true,
          isDeductiblePlasterTwoFaces: true,
          primarySource: {
            drawingNumber: 'A-101',
            drawingTitle: 'Ground Floor Architectural GA Plan',
            drawingType: 'Plan',
            revision: '02',
            pageNumber: 1,
            gridOrZone: 'Grid A/2',
          },
          crossReferences: [
            {
              drawingNumber: 'A-601',
              drawingTitle: 'Door & Window Master Schedule',
              drawingType: 'Schedule',
              revision: '02',
              pageNumber: 1,
              gridOrZone: 'Schedule Row 1',
            },
          ],
          status: 'VERIFIED',
        },
        {
          id: 'OP-W01-1',
          openingMark: 'W-01',
          type: 'Window',
          widthM: 2.4,
          heightM: 1.5,
          sillHeightM: 0.9,
          headHeightM: 2.4,
          wallThicknessM: 0.20,
          quantity: 4,
          singleAreaM2: 3.6,
          totalAreaM2: 14.4,
          singleVolumeM3: 0.72,
          totalVolumeM3: 2.88,
          isFullHeight: false,
          deductionRule: 'POMI: Deduct net opening > 0.1 m²',
          isDeductibleMasonry: true,
          isDeductiblePlasterOneFace: true,
          isDeductiblePlasterTwoFaces: true,
          primarySource: {
            drawingNumber: 'A-101',
            drawingTitle: 'Ground Floor Architectural GA Plan',
            drawingType: 'Plan',
            revision: '02',
            pageNumber: 1,
            gridOrZone: 'Grid A/1-4',
          },
          crossReferences: [
            {
              drawingNumber: 'A-601',
              drawingTitle: 'Door & Window Master Schedule',
              drawingType: 'Schedule',
              revision: '02',
              pageNumber: 1,
              gridOrZone: 'Schedule Row 4',
            },
          ],
          status: 'VERIFIED',
        },
      ],
      grossAreaM2: 124.2,
      grossVolumeM3: 24.84,
      deductionsAreaM2: 18.72,
      deductionsVolumeM3: 3.744,
      netAreaM2: 105.48,
      netVolumeM3: 21.096,
      calculationId: 'CALC-WALL-01',
      calculationFormulaWithValues: 'Gross Vol: (36.00m × 3.45m × 0.200m) = 24.840 m³ − Deductions: 3.744 m³ = 21.096 m³',
      primarySource: {
        drawingNumber: 'A-101',
        drawingTitle: 'Ground Floor Architectural GA Plan',
        drawingType: 'Plan',
        revision: '02',
        pageNumber: 1,
        gridOrZone: 'Grid A/1-4',
      },
      associatedSources: [
        {
          drawingNumber: 'A-301',
          drawingTitle: 'Building Cross Section A-A',
          drawingType: 'Section',
          revision: '02',
          pageNumber: 1,
          gridOrZone: 'Grid A',
        },
      ],
      status: 'VERIFIED',
      isBlocked: false,
      associatedOpenItemIds: [],
      associatedConflictIds: [],
      corrections: [],
    },
    {
      id: 'WALL-INT-GF-02',
      wallMark: 'W-INT-02',
      wallType: 'Brick Masonry',
      level: 'Ground Floor',
      zone: 'Main Corridor Partition',
      lengthM: 28.0,
      heightM: 3.0,
      heightDerivationMethod: 'Explicit Drawing Dimension',
      thicknessM: 0.23,
      quantity: 1,
      material: '230mm First Class Wire-Cut Red Clay Brick',
      blockBrickType: '230x115x75 Brick',
      mortarSpec: {
        cementRatio: 1,
        sandRatio: 6,
        mixNotation: '1:6 Cement Sand',
        jointThicknessMm: 10,
        volumeMethod: 'Standard Brick Table',
      },
      lintelType: 'RCC Lintel',
      linkedDpcId: 'DPC-GF-02',
      openings: [
        {
          id: 'OP-D02-1',
          openingMark: 'D-02',
          type: 'Door',
          widthM: 0.9,
          heightM: 2.1,
          sillHeightM: 0.0,
          headHeightM: 2.1,
          wallThicknessM: 0.23,
          quantity: 4,
          singleAreaM2: 1.89,
          totalAreaM2: 7.56,
          singleVolumeM3: 0.4347,
          totalVolumeM3: 1.7388,
          isFullHeight: false,
          deductionRule: 'POMI: Deduct net opening > 0.1 m²',
          isDeductibleMasonry: true,
          isDeductiblePlasterOneFace: true,
          isDeductiblePlasterTwoFaces: true,
          primarySource: {
            drawingNumber: 'A-101',
            drawingTitle: 'Ground Floor Architectural GA Plan',
            drawingType: 'Plan',
            revision: '02',
            pageNumber: 1,
            gridOrZone: 'Corridor',
          },
          crossReferences: [],
          status: 'VERIFIED',
        },
      ],
      grossAreaM2: 84.0,
      grossVolumeM3: 19.32,
      deductionsAreaM2: 7.56,
      deductionsVolumeM3: 1.7388,
      netAreaM2: 76.44,
      netVolumeM3: 17.5812,
      calculationId: 'CALC-WALL-02',
      calculationFormulaWithValues: 'Gross Vol: (28.00m × 3.00m × 0.230m) = 19.320 m³ − Deductions: 1.739 m³ = 17.581 m³',
      primarySource: {
        drawingNumber: 'A-101',
        drawingTitle: 'Ground Floor Architectural GA Plan',
        drawingType: 'Plan',
        revision: '02',
        pageNumber: 1,
        gridOrZone: 'Corridor',
      },
      associatedSources: [],
      status: 'VERIFIED',
      isBlocked: false,
      associatedOpenItemIds: [],
      associatedConflictIds: [],
      corrections: [],
    },
    {
      id: 'WALL-PARAPET-RF-01',
      wallMark: 'W-PARA-01',
      wallType: 'Parapet',
      level: 'Roof Level',
      zone: 'Roof Perimeter Coping',
      lengthM: 88.0,
      heightM: 1.0,
      heightDerivationMethod: 'Explicit Drawing Dimension',
      thicknessM: 0.20,
      quantity: 1,
      material: '200mm Solid Concrete Block Parapet with Cast Coping',
      lintelType: 'None',
      openings: [],
      grossAreaM2: 88.0,
      grossVolumeM3: 17.6,
      deductionsAreaM2: 0,
      deductionsVolumeM3: 0,
      netAreaM2: 88.0,
      netVolumeM3: 17.6,
      calculationId: 'CALC-WALL-03',
      calculationFormulaWithValues: 'Gross & Net Vol: (88.00m × 1.00m × 0.200m) = 17.600 m³',
      primarySource: {
        drawingNumber: 'A-103',
        drawingTitle: 'Roof Architectural Plan & Details',
        drawingType: 'Plan',
        revision: '01',
        pageNumber: 1,
        gridOrZone: 'Perimeter',
      },
      associatedSources: [],
      status: 'VERIFIED',
      isBlocked: false,
      associatedOpenItemIds: [],
      associatedConflictIds: [],
      corrections: [],
    },
    {
      id: 'WALL-PART-L1-01',
      wallMark: 'W-PART-01',
      wallType: 'Partition Wall',
      level: 'First Floor',
      zone: 'Office Cabins',
      lengthM: 42.0,
      heightM: 3.2,
      heightDerivationMethod: 'Floor-to-Floor Minus Slab Depth',
      thicknessM: 0.10,
      quantity: 1,
      material: '100mm AAC Light Block Partition',
      lintelType: 'Precast Lintel',
      openings: [
        {
          id: 'OP-D03-1',
          openingMark: 'D-03',
          type: 'Door',
          widthM: 0.9,
          heightM: 2.1,
          sillHeightM: 0.0,
          headHeightM: 2.1,
          wallThicknessM: 0.10,
          quantity: 6,
          singleAreaM2: 1.89,
          totalAreaM2: 11.34,
          singleVolumeM3: 0.189,
          totalVolumeM3: 1.134,
          isFullHeight: false,
          deductionRule: 'POMI: Deduct net opening > 0.1 m²',
          isDeductibleMasonry: true,
          isDeductiblePlasterOneFace: true,
          isDeductiblePlasterTwoFaces: true,
          primarySource: {
            drawingNumber: 'A-102',
            drawingTitle: 'First Floor Architectural Layout',
            drawingType: 'Plan',
            revision: '01',
            pageNumber: 1,
            gridOrZone: 'Cabins 1-6',
          },
          crossReferences: [],
          status: 'VERIFIED',
        },
      ],
      grossAreaM2: 134.4,
      grossVolumeM3: 13.44,
      deductionsAreaM2: 11.34,
      deductionsVolumeM3: 1.134,
      netAreaM2: 123.06,
      netVolumeM3: 12.306,
      calculationId: 'CALC-WALL-04',
      calculationFormulaWithValues: 'Gross Vol: (42.00m × 3.20m × 0.100m) = 13.440 m³ − Deductions: 1.134 m³ = 12.306 m³',
      primarySource: {
        drawingNumber: 'A-102',
        drawingTitle: 'First Floor Architectural Layout',
        drawingType: 'Plan',
        revision: '01',
        pageNumber: 1,
        gridOrZone: 'Cabins 1-6',
      },
      associatedSources: [],
      status: 'VERIFIED',
      isBlocked: false,
      associatedOpenItemIds: [],
      associatedConflictIds: [],
      corrections: [],
    },
    {
      id: 'WALL-DISPUTE-01',
      wallMark: 'W-DISP-01',
      wallType: 'External Wall',
      level: 'Ground Floor',
      zone: 'East Elevation Wing C',
      lengthM: 18.0,
      heightM: 3.5,
      heightDerivationMethod: 'Explicit Drawing Dimension',
      thicknessM: 0.23, // Plan says 230mm, Section says 200mm
      quantity: 1,
      material: 'Brick/Block Exterior Wall',
      lintelType: 'Unspecified',
      openings: [],
      grossAreaM2: 63.0,
      grossVolumeM3: 14.49,
      deductionsAreaM2: 0,
      deductionsVolumeM3: 0,
      netAreaM2: 63.0,
      netVolumeM3: 14.49,
      calculationId: 'CALC-WALL-DISP',
      calculationFormulaWithValues: 'Plan shows 230mm vs Section shows 200mm',
      primarySource: {
        drawingNumber: 'A-101',
        drawingTitle: 'Ground Floor GA Plan',
        drawingType: 'Plan',
        revision: '02',
        pageNumber: 1,
        gridOrZone: 'Grid E/1-3',
      },
      associatedSources: [
        {
          drawingNumber: 'A-302',
          drawingTitle: 'East Elevation & Wall Section',
          drawingType: 'Section',
          revision: '01',
          pageNumber: 1,
          gridOrZone: 'Wall Section 3',
        },
      ],
      status: 'CONFLICT',
      isBlocked: true,
      blockedReason: 'Drawing Conflict: Plan specifies 230mm brick wall while Wall Section 3 specifies 200mm block.',
      associatedOpenItemIds: [],
      associatedConflictIds: ['CONF-ARCH-01'],
      corrections: [],
    },
  ];

  const calculatedWalls = rawWalls.map((w) => calculateMasonryElement(w));

  // 2. Initial DPCs
  const rawDpcs: DpcElementRecord[] = [
    {
      id: 'DPC-GF-01',
      dpcMark: 'DPC-01',
      associatedWallId: 'WALL-EXT-GF-01',
      associatedWallMark: 'W-EXT-01',
      level: 'Ground Floor (+0.150m)',
      locationType: 'Plinth Level',
      systemType: 'DPC Membrane (Bituminous 2-ply)',
      lengthM: 36.0,
      widthM: 0.20,
      thicknessMm: 4,
      quantity: 1,
      measurementUnit: 'm²',
      areaM2: 7.2,
      linearLengthM: 36.0,
      specification: '2-ply Bituminous Felt DPC embedded in cement mortar',
      primarySource: {
        drawingNumber: 'A-101',
        drawingTitle: 'Ground Floor Architectural GA Plan',
        drawingType: 'Plan',
        revision: '02',
        pageNumber: 1,
        gridOrZone: 'Plinth Detail 1',
      },
      status: 'VERIFIED',
      isBlocked: false,
      associatedOpenItemIds: [],
      calculationFormulaWithValues: 'DPC Area: 36.00m (L) × 0.200m (W) = 7.200 m²',
      corrections: [],
    },
    {
      id: 'DPC-GF-02',
      dpcMark: 'DPC-02',
      associatedWallId: 'WALL-INT-GF-02',
      associatedWallMark: 'W-INT-02',
      level: 'Ground Floor (+0.150m)',
      locationType: 'Plinth Level',
      systemType: 'DPC Polythene Sheet (500 gauge)',
      lengthM: 28.0,
      widthM: 0.23,
      quantity: 1,
      measurementUnit: 'm²',
      areaM2: 6.44,
      linearLengthM: 28.0,
      specification: '500 gauge Heavy Duty Polythene DPC Sheet',
      primarySource: {
        drawingNumber: 'A-101',
        drawingTitle: 'Ground Floor Architectural GA Plan',
        drawingType: 'Plan',
        revision: '02',
        pageNumber: 1,
        gridOrZone: 'Plinth Detail 2',
      },
      status: 'VERIFIED',
      isBlocked: false,
      associatedOpenItemIds: [],
      calculationFormulaWithValues: 'DPC Area: 28.00m (L) × 0.230m (W) = 6.440 m²',
      corrections: [],
    },
  ];

  const calculatedDpcs = rawDpcs.map((d) => calculateDpcElement(d));

  // 3. Doors Master Schedule
  const doors: DoorScheduleRecord[] = [
    {
      id: 'DOOR-D01',
      doorMark: 'D-01',
      description: 'Main Entrance Double Leaf Glazed Aluminium Door',
      doorType: 'Glazed Panel',
      widthM: 1.8,
      heightM: 2.4,
      wallThicknessM: 0.20,
      frameMaterial: 'Thermally Broken Heavy Duty Aluminium Frame',
      shutterMaterial: '10mm Toughened Clear Glass with SS Push Pull Handles',
      fireRating: 'Non-FR',
      hardwareSchedule: ['Concealed Floor Spring (EN 1154)', 'SS 600mm Pull Handles', 'Euro Profile Cylinder Deadlock'],
      quantity: 1,
      level: 'Ground Floor',
      roomRef: 'Entrance Lobby',
      singleAreaM2: 4.32,
      totalAreaM2: 4.32,
      primarySource: {
        drawingNumber: 'A-101',
        drawingTitle: 'Ground Floor Architectural GA Plan',
        drawingType: 'Plan',
        revision: '02',
        pageNumber: 1,
        gridOrZone: 'Entrance',
      },
      scheduleSource: {
        drawingNumber: 'A-601',
        drawingTitle: 'Door & Window Master Schedule',
        drawingType: 'Schedule',
        revision: '02',
        pageNumber: 1,
        gridOrZone: 'Row 1',
      },
      status: 'VERIFIED',
      isBlocked: false,
      associatedConflictIds: [],
    },
    {
      id: 'DOOR-D02',
      doorMark: 'D-02',
      description: 'Single Leaf Solid Core Timber Flush Door',
      doorType: 'Fire Rated',
      widthM: 0.9,
      heightM: 2.1,
      wallThicknessM: 0.23,
      frameMaterial: 'Pressed Steel Frame 1.6mm Thick (BS 1245)',
      shutterMaterial: '44mm Solid Particle Core Timber Veneered Shutter',
      fireRating: 'FD30 (30 min integrity BS 476)',
      hardwareSchedule: ['Overhead Rack & Pinion Closer', 'Lever Handle Mortise Latch', 'Intumescent Acoustic Smoke Seals'],
      quantity: 8,
      level: 'Ground Floor',
      roomRef: 'Corridor & Admin',
      singleAreaM2: 1.89,
      totalAreaM2: 15.12,
      primarySource: {
        drawingNumber: 'A-101',
        drawingTitle: 'Ground Floor Architectural GA Plan',
        drawingType: 'Plan',
        revision: '02',
        pageNumber: 1,
        gridOrZone: 'Corridor',
      },
      scheduleSource: {
        drawingNumber: 'A-601',
        drawingTitle: 'Door & Window Master Schedule',
        drawingType: 'Schedule',
        revision: '02',
        pageNumber: 1,
        gridOrZone: 'Row 2',
      },
      status: 'VERIFIED',
      isBlocked: false,
      associatedConflictIds: [],
    },
    {
      id: 'DOOR-D03',
      doorMark: 'D-03',
      description: 'Office Cabin Single Leaf Flush Door',
      doorType: 'Single Leaf Flush',
      widthM: 0.9,
      heightM: 2.1,
      wallThicknessM: 0.10,
      frameMaterial: 'Anodized Aluminium Frame',
      shutterMaterial: 'Semi-solid Timber Shutter with Laminate Finish',
      fireRating: 'Non-FR',
      quantity: 6,
      level: 'First Floor',
      roomRef: 'Office Cabins',
      singleAreaM2: 1.89,
      totalAreaM2: 11.34,
      primarySource: {
        drawingNumber: 'A-102',
        drawingTitle: 'First Floor Layout Plan',
        drawingType: 'Plan',
        revision: '01',
        pageNumber: 1,
        gridOrZone: 'Cabins',
      },
      scheduleSource: {
        drawingNumber: 'A-601',
        drawingTitle: 'Door & Window Master Schedule',
        drawingType: 'Schedule',
        revision: '02',
        pageNumber: 1,
        gridOrZone: 'Row 3',
      },
      status: 'VERIFIED',
      isBlocked: false,
      associatedConflictIds: [],
    },
    {
      id: 'DOOR-DISPUTE-01',
      doorMark: 'D-DISP-01',
      description: 'Disputed Fire Exit Door Size',
      doorType: 'Fire Rated',
      widthM: 0.9, // Schedule says 900mm, Plan annotation says 1000mm
      heightM: 2.1,
      wallThicknessM: 0.20,
      frameMaterial: 'Galvanized Steel Frame',
      shutterMaterial: 'Double Skin Insulated Steel Fire Shutter',
      fireRating: 'FD60',
      quantity: 2,
      level: 'Ground Floor',
      roomRef: 'Fire Staircase Core',
      singleAreaM2: 1.89,
      totalAreaM2: 3.78,
      primarySource: {
        drawingNumber: 'A-101',
        drawingTitle: 'Ground Floor GA Plan',
        drawingType: 'Plan',
        revision: '02',
        pageNumber: 1,
        gridOrZone: 'Stair Core West (shows 1000×2100mm)',
      },
      scheduleSource: {
        drawingNumber: 'A-601',
        drawingTitle: 'Door Master Schedule',
        drawingType: 'Schedule',
        revision: '02',
        pageNumber: 1,
        gridOrZone: 'Schedule Entry D-DISP-01 (shows 900×2100mm)',
      },
      status: 'CONFLICT',
      isBlocked: true,
      blockedReason: 'Door Schedule lists 900×2100mm while GA Floor Plan A-101 dimensions 1000×2100mm.',
      associatedConflictIds: ['CONF-ARCH-02'],
    },
  ];

  // 4. Windows Master Schedule
  const windows: WindowScheduleRecord[] = [
    {
      id: 'WIN-W01',
      windowMark: 'W-01',
      description: 'Two-Track Sliding Window with Fixed Top Fanlight',
      windowType: 'Sliding 2-Track',
      widthM: 2.4,
      heightM: 1.5,
      sillHeightM: 0.9,
      headHeightM: 2.4,
      frameMaterial: 'Powder Coated Aluminium (RAL 7016 Anthracite)',
      glazingSpec: '24mm Double Glazed Unit (6mm Toughened Clear + 12mm Air Gap + 6mm Low-E)',
      quantity: 8,
      level: 'Ground Floor',
      roomRef: 'North Offices & Hall',
      singleAreaM2: 3.6,
      totalAreaM2: 28.8,
      glazingAreaM2: 25.2,
      primarySource: {
        drawingNumber: 'A-101',
        drawingTitle: 'Ground Floor Architectural GA Plan',
        drawingType: 'Plan',
        revision: '02',
        pageNumber: 1,
        gridOrZone: 'Grid A/1-4',
      },
      scheduleSource: {
        drawingNumber: 'A-601',
        drawingTitle: 'Door & Window Master Schedule',
        drawingType: 'Schedule',
        revision: '02',
        pageNumber: 1,
        gridOrZone: 'Row 4',
      },
      status: 'VERIFIED',
      isBlocked: false,
      associatedConflictIds: [],
    },
    {
      id: 'WIN-W02',
      windowMark: 'W-02',
      description: 'Single Leaf Top Hung Projected Toilet Vent Window',
      windowType: 'Top Hung Projected',
      widthM: 0.6,
      heightM: 0.6,
      sillHeightM: 1.8,
      headHeightM: 2.4,
      frameMaterial: 'Powder Coated Aluminium',
      glazingSpec: '6mm Obscure Frosted Toughened Glass',
      quantity: 6,
      level: 'Ground Floor',
      roomRef: 'Toilets Wet Block',
      singleAreaM2: 0.36,
      totalAreaM2: 2.16,
      glazingAreaM2: 1.8,
      primarySource: {
        drawingNumber: 'A-101',
        drawingTitle: 'Ground Floor Architectural GA Plan',
        drawingType: 'Plan',
        revision: '02',
        pageNumber: 1,
        gridOrZone: 'Toilet Core',
      },
      scheduleSource: {
        drawingNumber: 'A-601',
        drawingTitle: 'Door & Window Master Schedule',
        drawingType: 'Schedule',
        revision: '02',
        pageNumber: 1,
        gridOrZone: 'Row 5',
      },
      status: 'VERIFIED',
      isBlocked: false,
      associatedConflictIds: [],
    },
  ];

  // 5. Plaster Master Records
  const plasters: PlasterTakeoffRecord[] = [
    {
      id: 'PL-EXT-01',
      plasterMark: 'PL-EXT-01',
      locationType: 'External Wall',
      associatedWallId: 'WALL-EXT-GF-01',
      associatedWallMark: 'W-EXT-01',
      roomZone: 'North External Elevation',
      level: 'Ground Floor',
      faceType: 'External Face Only',
      facesCount: 1,
      grossAreaM2: 124.2,
      deductionAreaM2: 18.72,
      netAreaM2: 105.48,
      thicknessMm: 20,
      specification: '20mm Two-Coat Cement-Sand Plaster (1:4) with Water-Repellent Admixture',
      volumeM3: 2.1096,
      measurementUnit: 'm²',
      calculationFormulaWithValues: 'Gross: (36.00m × 3.45m × 1 face) = 124.20 m² − Openings (D-01: 4.32m² + 4×W-01: 14.40m²) = 105.48 m²',
      primarySource: {
        drawingNumber: 'A-101',
        drawingTitle: 'Ground Floor Architectural GA Plan',
        drawingType: 'Plan',
        revision: '02',
        pageNumber: 1,
        gridOrZone: 'North Face',
      },
      status: 'VERIFIED',
      isBlocked: false,
      associatedOpenItemIds: [],
    },
    {
      id: 'PL-INT-02',
      plasterMark: 'PL-INT-02',
      locationType: 'Internal Wall',
      associatedWallId: 'WALL-INT-GF-02',
      associatedWallMark: 'W-INT-02',
      roomZone: 'Main Corridor Both Faces',
      level: 'Ground Floor',
      faceType: 'Both Faces',
      facesCount: 2,
      grossAreaM2: 168.0,
      deductionAreaM2: 15.12,
      netAreaM2: 152.88,
      thicknessMm: 12,
      specification: '12mm Cement-Sand Plaster (1:4) with Smooth Trowel Finish',
      volumeM3: 1.8346,
      measurementUnit: 'm²',
      calculationFormulaWithValues: 'Gross: (28.00m × 3.00m × 2 faces) = 168.00 m² − Openings (4×D-02 on 2 faces: 15.12m²) = 152.88 m²',
      primarySource: {
        drawingNumber: 'A-101',
        drawingTitle: 'Ground Floor Architectural GA Plan',
        drawingType: 'Plan',
        revision: '02',
        pageNumber: 1,
        gridOrZone: 'Corridor Both Faces',
      },
      status: 'VERIFIED',
      isBlocked: false,
      associatedOpenItemIds: [],
    },
  ];

  // 6. Floor Finishes Master Records
  const floorings: FloorFinishRecord[] = [
    {
      id: 'FF-01',
      finishMark: 'FF-01',
      roomName: 'Entrance Lobby & Reception',
      roomNumber: 'G-01',
      level: 'Ground Floor',
      zone: 'Central Public Zone',
      finishType: 'Granite',
      specification: '20mm Polished Black Galaxy Granite Slabs (600×1200mm) laid on 30mm cement mortar bedding',
      thicknessMm: 20,
      grossAreaM2: 144.0,
      deductionsVoidAreaM2: 4.8, // Structural column footprints
      netAreaM2: 139.2,
      skirtingIncluded: true,
      skirtingLengthM: 48.0,
      skirtingHeightMm: 100,
      skirtingAreaM2: 4.8,
      screedBeddingThicknessMm: 30,
      primarySource: {
        drawingNumber: 'A-101',
        drawingTitle: 'Ground Floor GA Plan',
        drawingType: 'Plan',
        revision: '02',
        pageNumber: 1,
        gridOrZone: 'Lobby',
      },
      scheduleSource: {
        drawingNumber: 'A-602',
        drawingTitle: 'Room Finish Schedule',
        drawingType: 'Schedule',
        revision: '02',
        pageNumber: 1,
        gridOrZone: 'Room G-01',
      },
      status: 'VERIFIED',
      isBlocked: false,
      associatedConflictIds: [],
    },
    {
      id: 'FF-02',
      finishMark: 'FF-02',
      roomName: 'Open Plan Workstation Office',
      roomNumber: '1-04',
      level: 'First Floor',
      zone: 'Office Wing East',
      finishType: 'Porcelain Tile',
      specification: '600×600mm Full Body Matt Porcelain Tiles (Anti-skid R10) on 25mm adhesive bedding',
      thicknessMm: 10,
      grossAreaM2: 320.0,
      deductionsVoidAreaM2: 12.0, // Core shaft void
      netAreaM2: 308.0,
      skirtingIncluded: true,
      skirtingLengthM: 82.0,
      skirtingHeightMm: 100,
      skirtingAreaM2: 8.2,
      screedBeddingThicknessMm: 25,
      primarySource: {
        drawingNumber: 'A-102',
        drawingTitle: 'First Floor Plan',
        drawingType: 'Plan',
        revision: '01',
        pageNumber: 1,
        gridOrZone: 'East Wing',
      },
      scheduleSource: {
        drawingNumber: 'A-602',
        drawingTitle: 'Room Finish Schedule',
        drawingType: 'Schedule',
        revision: '02',
        pageNumber: 1,
        gridOrZone: 'Room 1-04',
      },
      status: 'VERIFIED',
      isBlocked: false,
      associatedConflictIds: [],
    },
  ];

  // 7. Paint Records
  const paints: PaintingRecord[] = [
    {
      id: 'PNT-EXT-01',
      paintMark: 'PNT-EXT-01',
      surfaceType: 'External Wall Paint',
      associatedSurfaceRef: 'PL-EXT-01',
      level: 'Ground Floor',
      roomZone: 'North External Elevation',
      systemSpecification: '1 Coat Exterior Anti-fungal Primer + 2 Coats Weather-Proof 100% Acrylic Emulsion',
      coatsCount: 2,
      hasSeparatePrimerItem: true,
      hasSeparatePuttyItem: false,
      netAreaM2: 105.48,
      primarySource: {
        drawingNumber: 'A-101',
        drawingTitle: 'Ground Floor GA Plan',
        drawingType: 'Plan',
        revision: '02',
        pageNumber: 1,
        gridOrZone: 'North Face',
      },
      status: 'VERIFIED',
      isBlocked: false,
      calculationFormulaWithValues: 'Derived from validated external plaster: 105.48 m²',
    },
    {
      id: 'PNT-INT-02',
      paintMark: 'PNT-INT-02',
      surfaceType: 'Internal Wall Paint',
      associatedSurfaceRef: 'PL-INT-02',
      level: 'Ground Floor',
      roomZone: 'Main Corridor Both Faces',
      systemSpecification: '1 Coat Water-based Primer + 2 Coats White Cement Putty + 2 Coats Low-VOC Premium Silk Emulsion',
      coatsCount: 2,
      hasSeparatePrimerItem: true,
      hasSeparatePuttyItem: true,
      netAreaM2: 152.88,
      primarySource: {
        drawingNumber: 'A-101',
        drawingTitle: 'Ground Floor GA Plan',
        drawingType: 'Plan',
        revision: '02',
        pageNumber: 1,
        gridOrZone: 'Corridor Both Faces',
      },
      status: 'VERIFIED',
      isBlocked: false,
      calculationFormulaWithValues: 'Derived from validated internal plaster: 152.88 m²',
    },
  ];

  // 8. Waterproofing Records
  const waterproofings: WaterproofingRecord[] = [
    {
      id: 'WP-TOILET-01',
      wpMark: 'WP-01',
      locationCategory: 'Toilet / Wet Area',
      roomZone: 'Ground Floor Public Restrooms',
      level: 'Ground Floor',
      systemSpecification: '2-Component Elastomeric Polymer Cementitious Waterproofing Coating',
      layersCount: 2,
      horizontalAreaM2: 38.4,
      upstandHeightM: 0.30,
      upstandLengthM: 32.0,
      upstandAreaM2: 9.6,
      totalWaterproofingAreaM2: 48.0,
      protectiveScreedRequired: true,
      protectiveScreedThicknessMm: 25,
      primarySource: {
        drawingNumber: 'A-101',
        drawingTitle: 'Ground Floor GA Plan',
        drawingType: 'Plan',
        revision: '02',
        pageNumber: 1,
        gridOrZone: 'Toilet Core Wet Area',
      },
      status: 'VERIFIED',
      isBlocked: false,
      calculationFormulaWithValues: 'Horizontal: 38.40 m² + Upstand: (32.00m (L) × 0.30m (H) = 9.60 m²) = Total: 48.00 m²',
    },
    {
      id: 'WP-ROOF-01',
      wpMark: 'WP-02',
      locationCategory: 'Terrace / Roof',
      roomZone: 'Main Building Flat Roof',
      level: 'Roof Level',
      systemSpecification: '4mm SBS Polymer Modified Torch-On Bituminous Waterproofing Membrane with Mineral Slate Granules',
      layersCount: 1,
      horizontalAreaM2: 680.0,
      upstandHeightM: 0.30,
      upstandLengthM: 120.0,
      upstandAreaM2: 36.0,
      totalWaterproofingAreaM2: 716.0,
      protectiveScreedRequired: true,
      protectiveScreedThicknessMm: 50,
      primarySource: {
        drawingNumber: 'A-103',
        drawingTitle: 'Roof Waterproofing Layout & Details',
        drawingType: 'Plan',
        revision: '01',
        pageNumber: 1,
        gridOrZone: 'Roof Area',
      },
      status: 'VERIFIED',
      isBlocked: false,
      calculationFormulaWithValues: 'Horizontal: 680.00 m² + Upstand: (120.00m (L) × 0.30m (H) = 36.00 m²) = Total: 716.00 m²',
    },
  ];

  // 9. Ceilings
  const ceilings: CeilingRecord[] = [
    {
      id: 'CLG-01',
      ceilingMark: 'CLG-01',
      roomZone: 'Entrance Lobby & Reception',
      level: 'Ground Floor',
      ceilingType: 'Gypsum Board False Ceiling',
      clearHeightAfflM: 3.0,
      specification: '12.5mm Tapered Edge Moisture Resistant Gypsum Board suspended on GI Framing Grid',
      grossAreaM2: 144.0,
      openingsDeductionM2: 8.0, // Light coves, AC diffusers
      netAreaM2: 136.0,
      primarySource: {
        drawingNumber: 'A-104',
        drawingTitle: 'Ground Floor Reflected Ceiling Plan (RCP)',
        drawingType: 'Plan',
        revision: '01',
        pageNumber: 1,
        gridOrZone: 'Lobby RCP',
      },
      status: 'VERIFIED',
      isBlocked: false,
    },
    {
      id: 'CLG-02',
      ceilingMark: 'CLG-02',
      roomZone: 'Open Plan Workstations',
      level: 'First Floor',
      ceilingType: '600x600 Mineral Fiber Grid',
      clearHeightAfflM: 2.8,
      specification: '600×600×15mm Tegular Microlook Mineral Fiber Acoustic Ceiling Tiles on 15mm Exposed T-Grid',
      grossAreaM2: 320.0,
      openingsDeductionM2: 14.0,
      netAreaM2: 306.0,
      primarySource: {
        drawingNumber: 'A-105',
        drawingTitle: 'First Floor Reflected Ceiling Plan (RCP)',
        drawingType: 'Plan',
        revision: '01',
        pageNumber: 1,
        gridOrZone: 'East Office RCP',
      },
      status: 'VERIFIED',
      isBlocked: false,
    },
  ];

  // 10. Wall Cladding / Dado
  const claddings: WallFinishCladdingRecord[] = [
    {
      id: 'CLAD-01',
      claddingMark: 'WF-DADO-01',
      locationType: 'Bathroom Wall Dado',
      roomZone: 'Ground Floor Public Restrooms',
      level: 'Ground Floor',
      materialSpec: '300×600mm Glazed Ceramic Wall Tiles up to 2.40m Height on cement adhesive',
      claddingHeightM: 2.4,
      wallPerimeterLengthM: 32.0,
      grossAreaM2: 76.8,
      openingDeductionsM2: 4.8, // Door and vent opening deductions
      netAreaM2: 72.0,
      primarySource: {
        drawingNumber: 'A-101',
        drawingTitle: 'Ground Floor GA Plan & Restroom Details',
        drawingType: 'Plan',
        revision: '02',
        pageNumber: 1,
        gridOrZone: 'Toilet Core',
      },
      status: 'VERIFIED',
    },
  ];

  // 11. Room Finish Schedule
  const roomSchedules: RoomFinishScheduleRecord[] = [
    {
      id: 'RS-01',
      roomNumber: 'G-01',
      roomName: 'Entrance Lobby & Reception',
      level: 'Ground Floor',
      floorFinish: '20mm Polished Black Galaxy Granite (600×1200mm)',
      skirtingFinish: '100mm Granite Skirting Flush with Plaster',
      internalWallFinish: 'Emulsion Paint on Plaster with Feature Wooden Fluted Paneling',
      ceilingFinish: 'Gypsum Board False Ceiling at 3.00m AFFL',
      ceilingHeightM: 3.0,
      specialNotes: 'Expansion joint profile at entrance threshold',
      drawingRef: 'A-602 (Rev 02)',
    },
    {
      id: 'RS-02',
      roomNumber: 'G-02',
      roomName: 'Corridor & Circulation',
      level: 'Ground Floor',
      floorFinish: '600×600mm Porcelain Tiles',
      skirtingFinish: '100mm Tile Skirting',
      internalWallFinish: '12mm Plaster with 2 Coats Silk Emulsion Paint',
      ceilingFinish: 'Direct Soffit Plaster with Emulsion Paint',
      ceilingHeightM: 3.0,
      drawingRef: 'A-602 (Rev 02)',
    },
    {
      id: 'RS-03',
      roomNumber: '1-04',
      roomName: 'Open Plan Workstation Office',
      level: 'First Floor',
      floorFinish: '600×600mm Matt Porcelain Tiles',
      skirtingFinish: '100mm Tile Skirting',
      internalWallFinish: '12mm Plaster with Emulsion Paint',
      ceilingFinish: '600×600mm Mineral Fiber Acoustic False Ceiling',
      ceilingHeightM: 2.8,
      drawingRef: 'A-602 (Rev 02)',
    },
  ];

  // 12. Open Items (Zero Guesswork)
  const openItems: ArchitecturalOpenItem[] = [
    {
      id: 'OI-ARCH-01',
      elementId: 'WALL-MISSING-THK-01',
      elementMark: 'W-UNKNOWN-01',
      category: 'Missing Wall Thickness',
      severity: 'HIGH_BLOCKING',
      title: 'Missing Wall Thickness for Partition Wall at Server Room',
      description: 'Drawing A-102 shows partition wall W-UNKNOWN-01 at Server Room without thickness callout (100mm, 150mm or 200mm).',
      missingInformation: 'Explicit wall thickness dimension and block material grade.',
      suggestedRfiResolution: 'RFI 08 issued to Architect requesting clarification on server room fire rating and partition thickness.',
      drawingNumber: 'A-102',
      status: 'OPEN',
    },
    {
      id: 'OI-ARCH-02',
      elementId: 'DPC-MISSING-01',
      elementMark: 'DPC-UNKNOWN-01',
      category: 'Missing DPC Width',
      severity: 'HIGH_BLOCKING',
      title: 'DPC Width & Spec Unspecified on East Boundary Wall',
      description: 'Detail 4 on A-302 indicates DPC layer under boundary wall but omits thickness and width specification.',
      missingInformation: 'DPC system specification (bituminous vs polythene) and explicit width.',
      suggestedRfiResolution: 'Clarify if 230mm bituminous felt DPC is required.',
      drawingNumber: 'A-302',
      status: 'OPEN',
    },
    {
      id: 'OI-ARCH-03',
      category: 'Missing Plaster Thickness',
      severity: 'MEDIUM_REVIEW',
      title: 'Plaster Thickness for Staircase Soffit',
      description: 'Staircase detail shows plaster on waist slab soffit without specified thickness (10mm vs 12mm).',
      missingInformation: 'Soffit plaster thickness specification.',
      suggestedRfiResolution: 'Adopt 10mm ceiling/soffit plaster standard as per Project Specification Section 09200.',
      drawingNumber: 'A-401',
      status: 'OPEN',
    },
  ];

  // 13. Drawing & Schedule Conflicts
  const conflicts: ArchitecturalConflict[] = [
    {
      id: 'CONF-ARCH-01',
      title: 'Exterior Wall Thickness Discrepancy (Plan 230mm vs Section 200mm)',
      elementRef: 'W-DISP-01',
      category: 'Wall Thickness Conflict',
      description: 'Ground floor architectural plan A-101 shows East Wing wall as 230mm thick brick masonry, while Wall Section 3 on A-302 details it as 200mm hollow concrete block.',
      sourceA: {
        drawing: 'A-101 (GA Plan)',
        type: 'Plan Dimension',
        value: '230 mm Red Brick Wall',
        location: 'Grid E/1-3',
      },
      sourceB: {
        drawing: 'A-302 (Section 3)',
        type: 'Section Callout',
        value: '200 mm Hollow Block',
        location: 'Section 3 Detail Callout',
      },
      status: 'OPEN',
      resolutionAction: 'Architectural RFI 09 submitted. Blocked from final takeoff until formal Addendum.',
    },
    {
      id: 'CONF-ARCH-02',
      title: 'Fire Exit Door Dimension Conflict (Schedule 900mm vs Plan 1000mm)',
      elementRef: 'D-DISP-01',
      category: 'Door Dimension Conflict',
      description: 'Door Master Schedule A-601 lists fire exit door D-DISP-01 as 900×2100mm, whereas Architectural Plan A-101 dimensions opening width as 1000×2100mm for emergency egress compliance.',
      sourceA: {
        drawing: 'A-601 (Door Schedule)',
        type: 'Schedule Entry',
        value: '900 × 2100 mm (FD60)',
        location: 'Row 6',
      },
      sourceB: {
        drawing: 'A-101 (Floor Plan)',
        type: 'Plan Dimension',
        value: '1000 × 2100 mm Opening',
        location: 'Stair Core West Egress',
      },
      status: 'OPEN',
      resolutionAction: 'Fire Consultant review requested to confirm 1000mm minimum clear door width.',
    },
  ];

  // 14. Revisions
  const revisions: ArchitecturalRevisionRecord[] = [
    {
      revisionId: 'REV-ARCH-02',
      drawingNumber: 'A-101',
      issueDate: '2026-08-15',
      description: 'Architectural Addendum 02: Widened Main Entrance D-01 from 1.50m to 1.80m and added Corridor Doors D-02.',
      wallsAddedCount: 1,
      wallsRemovedCount: 0,
      wallsModifiedCount: 2,
      openingsDeltaCount: 3,
      finishesDeltaAreaM2: 24.5,
      masonryVolumeDeltaM3: -0.68,
      dpcDeltaM2: 0,
      plasterDeltaM2: -1.36,
      affectedBoqItemCodes: ['BOQ-MAS-01', 'BOQ-PL-01', 'BOQ-DOOR-01'],
    },
  ];

  return {
    walls: calculatedWalls,
    dpcs: calculatedDpcs,
    doors,
    windows,
    plasters,
    floorings,
    paints,
    waterproofings,
    ceilings,
    claddings,
    roomSchedules,
    openItems,
    conflicts,
    revisions,
  };
}
