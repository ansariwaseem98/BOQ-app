/**
 * Deterministic Architectural, Masonry, DPC, Doors/Windows & Finishes Takeoff Engine
 * Strict geometric arithmetic, configurable measurement deduction standards (POMI, IS 1200, NRM2),
 * and transparent formula provenance.
 */

import {
  WallRegisterItem,
  DPCRegisterItem,
  DoorRegisterItem,
  WindowRegisterItem,
  LouverRegisterItem,
  CurtainWallRegisterItem,
  PlasterTakeoffItem,
  PaintingTakeoffItem,
  FlooringTakeoffItem,
  SkirtingTakeoffItem,
  CeilingTakeoffItem,
  WaterproofingTakeoffItem,
  ScreedTakeoffItem,
  WallTileTakeoffItem,
  StairFinishTakeoffItem,
  ParapetTakeoffItem,
  ArchitecturalMetalworkItem,
  RoomRegisterItem,
  OpeningRegisterItem,
  ArchitecturalSummaryData,
  CalculationAuditRecord,
  OpenItem,
  MeasurementStandard,
} from '../types';

export interface WallCalculationInput {
  id: string;
  physicalWallId: string;
  wallMark: string;
  wallType: WallRegisterItem['wallType'];
  material: string;
  lengthM: number;
  heightM: number;
  thicknessM: number;
  level: string;
  roomZone: string;
  openings?: OpeningRegisterItem[];
  drawingNumber: string;
  drawingType: string;
  revision: string;
  pageNumber: number;
  sourceLocation: string;
  confidenceScore?: number;
  includeDpc?: boolean;
  standard?: MeasurementStandard;
}

export interface WallCalculationResult {
  item: WallRegisterItem;
  openItem?: OpenItem;
  formulaWithValues: string;
}

/**
 * Deterministic Wall & Masonry Volume Calculation
 * Formula: (Length × Height - Deductible Openings) × Thickness
 */
export function calculateWallItem(
  input: WallCalculationInput
): WallCalculationResult {
  let isBlocked = false;
  let blockedReason = '';
  let openItem: OpenItem | undefined;

  if (!input.thicknessM || input.thicknessM <= 0) {
    isBlocked = true;
    blockedReason = `Wall thickness missing or unspecified for ${input.wallMark}.`;
    openItem = {
      id: `OI-ARCH-THK-${input.id}`,
      category: 'missing_dimension',
      severity: 'high',
      title: `Missing Wall Thickness for ${input.wallMark}`,
      description: `Architectural drawing ${input.drawingNumber} does not show unambiguous thickness dimension for wall ${input.wallMark} at ${input.roomZone}.`,
      requiredInformation: 'Explicit wall thickness (e.g., 200mm block, 100mm drywall, 230mm brick).',
      suggestedAction: 'Verify architectural partition detail or wall schedule.',
      drawingId: input.drawingNumber,
      drawingNumber: input.drawingNumber,
      drawingRevision: input.revision || '00',
      drawingTitle: 'Architectural Floor Plan',
      locationDescription: input.sourceLocation,
      status: 'open',
      affectedElementIds: [input.id],
      affectedBoqItemIds: [],
    };
  } else if (!input.heightM || input.heightM <= 0) {
    isBlocked = true;
    blockedReason = `Wall height missing for ${input.wallMark}.`;
    openItem = {
      id: `OI-ARCH-HGT-${input.id}`,
      category: 'missing_dimension',
      severity: 'high',
      title: `Missing Wall Height for ${input.wallMark}`,
      description: `Drawing ${input.drawingNumber} does not define floor-to-soffit or ceiling clear height for wall ${input.wallMark}.`,
      requiredInformation: 'True structural clear height or level datum difference.',
      suggestedAction: 'Provide floor-to-floor and slab thickness levels from architectural section.',
      drawingId: input.drawingNumber,
      drawingNumber: input.drawingNumber,
      drawingRevision: input.revision || '00',
      drawingTitle: 'Architectural Building Section',
      locationDescription: input.sourceLocation,
      status: 'open',
      affectedElementIds: [input.id],
      affectedBoqItemIds: [],
    };
  }

  const length = Number(input.lengthM || 0);
  const height = Number(input.heightM || 0);
  const thickness = Number(input.thicknessM || 0);
  const standard = input.standard || 'POMI';

  const grossArea = length * height;
  const grossVolume = grossArea * thickness;

  let totalOpeningArea = 0;
  let totalOpeningVolume = 0;
  const processedOpenings: OpeningRegisterItem[] = [];

  if (input.openings && input.openings.length > 0) {
    input.openings.forEach((op) => {
      const singleArea = op.widthM * op.heightM;
      const totalOpArea = singleArea * op.quantity;
      const totalOpVolume = totalOpArea * thickness;

      let isDeductibleMasonry = true;
      let isDeductiblePlaster = true;
      let ruleDesc = 'POMI/NRM2: Deduct net opening';

      if (standard === 'IS1200') {
        if (singleArea < 0.1) {
          isDeductibleMasonry = false;
          isDeductiblePlaster = false;
          ruleDesc = 'IS 1200: Area < 0.1 m² - No deduction';
        } else if (singleArea <= 0.5) {
          isDeductibleMasonry = true;
          isDeductiblePlaster = false;
          ruleDesc = 'IS 1200: Area 0.1-0.5 m² - Deduct masonry, no plaster deduction';
        } else if (singleArea <= 3.0) {
          isDeductibleMasonry = true;
          isDeductiblePlaster = true;
          ruleDesc = 'IS 1200: Area 0.5-3.0 m² - Deduct masonry, deduct 1 face plaster';
        } else {
          isDeductibleMasonry = true;
          isDeductiblePlaster = true;
          ruleDesc = 'IS 1200: Area > 3.0 m² - Deduct masonry, deduct 2 faces plaster';
        }
      }

      if (isDeductibleMasonry) {
        totalOpeningArea += totalOpArea;
        totalOpeningVolume += totalOpVolume;
      }

      processedOpenings.push({
        ...op,
        singleAreaM2: Number(singleArea.toFixed(3)),
        totalAreaM2: Number(totalOpArea.toFixed(3)),
        isDeductibleMasonry,
        isDeductiblePlaster,
        deductionRule: ruleDesc,
      });
    });
  }

  const netArea = Math.max(0, grossArea - totalOpeningArea);
  const netVolume = Math.max(0, grossVolume - totalOpeningVolume);

  // Standard 400x200x200mm masonry block estimate (12.5 blocks/m² with 5% mortar/breakage)
  const blockCountEstimate =
    thickness > 0 ? Math.ceil((netArea / (0.4 * 0.2)) * 1.05) : 0;

  const formulaWithValues = `(${length.toFixed(2)}m × ${height.toFixed(2)}m - ${totalOpeningArea.toFixed(2)}m² openings) × ${thickness.toFixed(3)}m thk = ${netVolume.toFixed(3)} m³ (${netArea.toFixed(2)} m²)`;

  const auditSteps: CalculationAuditRecord[] = [
    {
      id: `AUD-WALL-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: 'Engine: calculateWallItem',
      action: 'CREATED',
      previousValue: null,
      newValue: netVolume,
      newFormula: formulaWithValues,
      reason: 'Deterministic wall volume & opening deduction calculation',
    },
  ];

  const item: WallRegisterItem = {
    id: input.id,
    physicalWallId: input.physicalWallId,
    wallMark: input.wallMark,
    wallType: input.wallType,
    material: input.material,
    lengthM: length,
    heightM: height,
    thicknessM: thickness,
    level: input.level,
    roomZone: input.roomZone,
    openings: processedOpenings,
    grossAreaM2: Number(grossArea.toFixed(3)),
    deductedOpeningAreaM2: Number(totalOpeningArea.toFixed(3)),
    netAreaM2: Number(netArea.toFixed(3)),
    grossVolumeM3: Number(grossVolume.toFixed(3)),
    deductedOpeningVolumeM3: Number(totalOpeningVolume.toFixed(3)),
    netVolumeM3: Number(netVolume.toFixed(3)),
    blockCountEstimate,
    includeDpc: input.includeDpc,
    drawingNumber: input.drawingNumber,
    drawingType: input.drawingType,
    revision: input.revision,
    pageNumber: input.pageNumber,
    sourceLocation: input.sourceLocation,
    confidenceScore: input.confidenceScore || 0.96,
    verificationStatus: isBlocked ? 'unverified' : 'verified',
    formulaWithValues,
    isBlocked,
    blockedReason,
    auditTrail: auditSteps,
  };

  return { item, openItem, formulaWithValues };
}

/**
 * Deterministic DPC (Damp Proof Course) Calculation
 * Formula: Wall Length × Width (m²)
 */
export function calculateDpcItem(input: {
  id: string;
  wallId: string;
  wallMark: string;
  level: string;
  lengthM: number;
  widthM: number;
  thicknessMm?: number;
  material: string;
  drawingNumber: string;
  revision: string;
  pageNumber: number;
  sourceLocation: string;
}): { item: DPCRegisterItem; openItem?: OpenItem } {
  let isBlocked = false;
  let blockedReason = '';
  let openItem: OpenItem | undefined;

  if (!input.widthM || input.widthM <= 0) {
    isBlocked = true;
    blockedReason = `DPC width missing for wall ${input.wallMark}.`;
    openItem = {
      id: `OI-DPC-WID-${input.id}`,
      category: 'missing_dimension',
      severity: 'high',
      title: `Missing DPC Width for ${input.wallMark}`,
      description: `DPC width is not specified for wall ${input.wallMark} at ${input.level}.`,
      requiredInformation: 'True DPC width or confirmation to match wall thickness.',
      suggestedAction: 'Confirm DPC width specification from architectural foundation details.',
      drawingId: input.drawingNumber,
      drawingNumber: input.drawingNumber,
      drawingRevision: input.revision || '00',
      drawingTitle: 'Architectural Details',
      locationDescription: input.sourceLocation,
      status: 'open',
      affectedElementIds: [input.id],
      affectedBoqItemIds: [],
    };
  }

  const length = Number(input.lengthM || 0);
  const width = Number(input.widthM || 0);
  const area = length * width;

  const formulaWithValues = `${length.toFixed(2)}m (length) × ${width.toFixed(3)}m (width) = ${area.toFixed(3)} m²`;

  const item: DPCRegisterItem = {
    id: input.id,
    wallId: input.wallId,
    wallMark: input.wallMark,
    level: input.level,
    lengthM: length,
    widthM: width,
    thicknessMm: input.thicknessMm || 4,
    material: input.material,
    areaM2: Number(area.toFixed(3)),
    drawingNumber: input.drawingNumber,
    revision: input.revision,
    pageNumber: input.pageNumber,
    sourceLocation: input.sourceLocation,
    confidenceScore: 0.98,
    verificationStatus: isBlocked ? 'unverified' : 'verified',
    formulaWithValues,
    isBlocked,
    blockedReason,
    auditTrail: [
      {
        id: `AUD-DPC-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: 'Engine: calculateDpcItem',
        action: 'CREATED',
        previousValue: null,
        newValue: area,
        newFormula: formulaWithValues,
        reason: 'Deterministic DPC area under masonry wall base',
      },
    ],
  };

  return { item, openItem };
}

/**
 * Deterministic Door Item Takeoff
 * Formula: Number of Doors + Area (Width × Height × Qty)
 */
export function calculateDoorItem(input: {
  id: string;
  doorMark: string;
  doorType: string;
  widthM: number;
  heightM: number;
  frameType: string;
  material: string;
  fireRating: string;
  quantity: number;
  level: string;
  room: string;
  drawingNumber: string;
  revision: string;
  pageNumber: number;
  sourceLocation: string;
}): { item: DoorRegisterItem; openItem?: OpenItem } {
  let isBlocked = false;
  let openItem: OpenItem | undefined;

  if (!input.widthM || !input.heightM || input.widthM <= 0 || input.heightM <= 0) {
    isBlocked = true;
    openItem = {
      id: `OI-DOOR-DIM-${input.id}`,
      category: 'missing_dimension',
      severity: 'high',
      title: `Missing Dimensions for Door ${input.doorMark}`,
      description: `Door ${input.doorMark} on drawing ${input.drawingNumber} has undefined structural opening width/height.`,
      requiredInformation: 'Door opening width and height in mm (e.g. 1000x2100mm).',
      suggestedAction: 'Refer to door schedule or architectural plan callout.',
      drawingId: input.drawingNumber,
      drawingNumber: input.drawingNumber,
      drawingRevision: input.revision || '00',
      drawingTitle: 'Door Schedule',
      locationDescription: input.sourceLocation,
      status: 'open',
      affectedElementIds: [input.id],
      affectedBoqItemIds: [],
    };
  }

  const width = Number(input.widthM || 0);
  const height = Number(input.heightM || 0);
  const qty = Number(input.quantity || 1);
  const singleArea = width * height;
  const totalArea = singleArea * qty;

  const item: DoorRegisterItem = {
    id: input.id,
    doorMark: input.doorMark,
    doorType: input.doorType,
    widthM: width,
    heightM: height,
    frameType: input.frameType,
    material: input.material,
    fireRating: input.fireRating,
    quantity: qty,
    singleAreaM2: Number(singleArea.toFixed(3)),
    totalAreaM2: Number(totalArea.toFixed(3)),
    level: input.level,
    room: input.room,
    drawingNumber: input.drawingNumber,
    revision: input.revision,
    pageNumber: input.pageNumber,
    sourceLocation: input.sourceLocation,
    confidenceScore: 0.98,
    verificationStatus: isBlocked ? 'unverified' : 'verified',
    auditTrail: [
      {
        id: `AUD-DR-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: 'Engine: calculateDoorItem',
        action: 'CREATED',
        previousValue: null,
        newValue: totalArea,
        newFormula: `${qty} No. × (${width}m × ${height}m) = ${totalArea.toFixed(2)} m²`,
        reason: 'Door schedule takeoff extraction',
      },
    ],
  };

  return { item, openItem };
}

/**
 * Deterministic Window Item Takeoff
 * Formula: Number of Windows + Area (Width × Height × Qty)
 */
export function calculateWindowItem(input: {
  id: string;
  windowMark: string;
  windowType: string;
  widthM: number;
  heightM: number;
  frameType: string;
  glazing: string;
  sillHeightM: number;
  quantity: number;
  level: string;
  room: string;
  drawingNumber: string;
  revision: string;
  pageNumber: number;
  sourceLocation: string;
}): { item: WindowRegisterItem; openItem?: OpenItem } {
  let isBlocked = false;
  let openItem: OpenItem | undefined;

  if (!input.widthM || !input.heightM || input.widthM <= 0 || input.heightM <= 0) {
    isBlocked = true;
    openItem = {
      id: `OI-WIN-DIM-${input.id}`,
      category: 'missing_dimension',
      severity: 'high',
      title: `Missing Dimensions for Window ${input.windowMark}`,
      description: `Window ${input.windowMark} on drawing ${input.drawingNumber} has undefined structural opening width/height.`,
      requiredInformation: 'Window opening width and height in mm (e.g. 1500x1200mm).',
      suggestedAction: 'Refer to window schedule or elevation drawing.',
      drawingId: input.drawingNumber,
      drawingNumber: input.drawingNumber,
      drawingRevision: input.revision || '00',
      drawingTitle: 'Window Schedule',
      locationDescription: input.sourceLocation,
      status: 'open',
      affectedElementIds: [input.id],
      affectedBoqItemIds: [],
    };
  }

  const width = Number(input.widthM || 0);
  const height = Number(input.heightM || 0);
  const qty = Number(input.quantity || 1);
  const singleArea = width * height;
  const totalArea = singleArea * qty;

  const item: WindowRegisterItem = {
    id: input.id,
    windowMark: input.windowMark,
    windowType: input.windowType,
    widthM: width,
    heightM: height,
    frameType: input.frameType,
    glazing: input.glazing,
    sillHeightM: input.sillHeightM || 0.9,
    quantity: qty,
    singleAreaM2: Number(singleArea.toFixed(3)),
    totalAreaM2: Number(totalArea.toFixed(3)),
    level: input.level,
    room: input.room,
    drawingNumber: input.drawingNumber,
    revision: input.revision,
    pageNumber: input.pageNumber,
    sourceLocation: input.sourceLocation,
    confidenceScore: 0.98,
    verificationStatus: isBlocked ? 'unverified' : 'verified',
    auditTrail: [
      {
        id: `AUD-WN-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: 'Engine: calculateWindowItem',
        action: 'CREATED',
        previousValue: null,
        newValue: totalArea,
        newFormula: `${qty} No. × (${width}m × ${height}m) = ${totalArea.toFixed(2)} m²`,
        reason: 'Window schedule takeoff extraction',
      },
    ],
  };

  return { item, openItem };
}

/**
 * Deterministic Plaster Takeoff Item
 */
export function calculatePlasterItem(input: {
  id: string;
  locationType: PlasterTakeoffItem['locationType'];
  description: string;
  wallMark?: string;
  room?: string;
  level: string;
  grossAreaM2: number;
  deductionAreaM2: number;
  thicknessMm: number;
  specification: string;
  drawingNumber: string;
  revision: string;
  pageNumber: number;
  sourceLocation: string;
}): PlasterTakeoffItem {
  const gross = Number(input.grossAreaM2 || 0);
  const deduction = Number(input.deductionAreaM2 || 0);
  const netArea = Math.max(0, gross - deduction);
  const thicknessM = (input.thicknessMm || 12) / 1000;
  const volume = netArea * thicknessM;

  const formulaWithValues = `${gross.toFixed(2)}m² (gross) - ${deduction.toFixed(2)}m² (deductions) = ${netArea.toFixed(2)} m² (Vol: ${volume.toFixed(3)} m³ @ ${input.thicknessMm}mm thk)`;

  return {
    id: input.id,
    locationType: input.locationType,
    description: input.description,
    wallMark: input.wallMark,
    room: input.room,
    level: input.level,
    grossAreaM2: Number(gross.toFixed(2)),
    deductionAreaM2: Number(deduction.toFixed(2)),
    netAreaM2: Number(netArea.toFixed(2)),
    thicknessMm: input.thicknessMm,
    volumeM3: Number(volume.toFixed(3)),
    specification: input.specification,
    formulaWithValues,
    drawingNumber: input.drawingNumber,
    revision: input.revision,
    pageNumber: input.pageNumber,
    sourceLocation: input.sourceLocation,
    verificationStatus: 'verified',
    auditTrail: [
      {
        id: `AUD-PLS-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: 'Engine: calculatePlasterItem',
        action: 'CREATED',
        previousValue: null,
        newValue: netArea,
        newFormula: formulaWithValues,
        reason: 'Plaster area calculation',
      },
    ],
  };
}

/**
 * Deterministic Painting Takeoff Item
 */
export function calculatePaintingItem(input: {
  id: string;
  surfaceType: PaintingTakeoffItem['surfaceType'];
  description: string;
  system: string;
  coats: number;
  netAreaM2: number;
  room?: string;
  level: string;
  drawingNumber: string;
  revision: string;
  pageNumber: number;
  sourceLocation: string;
}): PaintingTakeoffItem {
  const area = Number(input.netAreaM2 || 0);
  const coats = Number(input.coats || 2);
  const formulaWithValues = `${area.toFixed(2)} m² × ${coats} coats (${input.system})`;

  return {
    id: input.id,
    surfaceType: input.surfaceType,
    description: input.description,
    system: input.system,
    coats,
    netAreaM2: Number(area.toFixed(2)),
    room: input.room,
    level: input.level,
    formulaWithValues,
    drawingNumber: input.drawingNumber,
    revision: input.revision,
    pageNumber: input.pageNumber,
    sourceLocation: input.sourceLocation,
    verificationStatus: 'verified',
    auditTrail: [
      {
        id: `AUD-PNT-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: 'Engine: calculatePaintingItem',
        action: 'CREATED',
        previousValue: null,
        newValue: area,
        newFormula: formulaWithValues,
        reason: 'Paint finish system takeoff',
      },
    ],
  };
}

/**
 * Deterministic Flooring Takeoff Item
 */
export function calculateFlooringItem(input: {
  id: string;
  room: string;
  roomNumber: string;
  level: string;
  finishType: string;
  material: string;
  thicknessMm: number;
  measuredAreaM2: number;
  wastagePercent?: number;
  tileLengthMm?: number;
  tileWidthMm?: number;
  drawingNumber: string;
  revision: string;
  pageNumber: number;
  sourceLocation: string;
}): FlooringTakeoffItem {
  const measuredArea = Number(input.measuredAreaM2 || 0);
  const wastage = input.wastagePercent !== undefined ? input.wastagePercent : 5;
  const wastageArea = (measuredArea * wastage) / 100;
  const tenderArea = measuredArea + wastageArea;

  let tileCount: number | undefined;
  if (input.tileLengthMm && input.tileWidthMm && input.tileLengthMm > 0 && input.tileWidthMm > 0) {
    const tileArea = (input.tileLengthMm / 1000) * (input.tileWidthMm / 1000);
    tileCount = Math.ceil(tenderArea / tileArea);
  }

  const formulaWithValues = `${measuredArea.toFixed(2)}m² measured + ${wastage}% wastage (${wastageArea.toFixed(2)}m²) = ${tenderArea.toFixed(2)}m² tender${tileCount ? ` (${tileCount} tiles)` : ''}`;

  return {
    id: input.id,
    room: input.room,
    roomNumber: input.roomNumber,
    level: input.level,
    finishType: input.finishType,
    material: input.material,
    thicknessMm: input.thicknessMm,
    tileLengthMm: input.tileLengthMm,
    tileWidthMm: input.tileWidthMm,
    tileCount,
    measuredAreaM2: Number(measuredArea.toFixed(2)),
    wastagePercent: wastage,
    wastageAreaM2: Number(wastageArea.toFixed(2)),
    tenderAreaM2: Number(tenderArea.toFixed(2)),
    formulaWithValues,
    drawingNumber: input.drawingNumber,
    revision: input.revision,
    pageNumber: input.pageNumber,
    sourceLocation: input.sourceLocation,
    verificationStatus: 'verified',
    auditTrail: [
      {
        id: `AUD-FLR-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: 'Engine: calculateFlooringItem',
        action: 'CREATED',
        previousValue: null,
        newValue: tenderArea,
        newFormula: formulaWithValues,
        reason: 'Room floor finish calculation',
      },
    ],
  };
}

/**
 * Deterministic Skirting Takeoff Item
 * Formula: Room Perimeter - Opening/Door Deductions = Net Skirting Length (m)
 */
export function calculateSkirtingItem(input: {
  id: string;
  room: string;
  level: string;
  material: string;
  heightMm: number;
  grossPerimeterM: number;
  openingsDeductionM: number;
  drawingNumber: string;
  revision: string;
  pageNumber: number;
  sourceLocation: string;
}): SkirtingTakeoffItem {
  const gross = Number(input.grossPerimeterM || 0);
  const deduction = Number(input.openingsDeductionM || 0);
  const netLength = Math.max(0, gross - deduction);
  const heightM = (input.heightMm || 100) / 1000;
  const area = netLength * heightM;

  const formulaWithValues = `${gross.toFixed(2)}m (perimeter) - ${deduction.toFixed(2)}m (door widths) = ${netLength.toFixed(2)} m (${area.toFixed(2)} m² @ ${input.heightMm}mm height)`;

  return {
    id: input.id,
    room: input.room,
    level: input.level,
    material: input.material,
    heightMm: input.heightMm,
    grossPerimeterM: Number(gross.toFixed(2)),
    openingsDeductionM: Number(deduction.toFixed(2)),
    netLengthM: Number(netLength.toFixed(2)),
    areaM2: Number(area.toFixed(2)),
    formulaWithValues,
    drawingNumber: input.drawingNumber,
    revision: input.revision,
    pageNumber: input.pageNumber,
    sourceLocation: input.sourceLocation,
    verificationStatus: 'verified',
    auditTrail: [
      {
        id: `AUD-SKT-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: 'Engine: calculateSkirtingItem',
        action: 'CREATED',
        previousValue: null,
        newValue: netLength,
        newFormula: formulaWithValues,
        reason: 'Room skirting length takeoff',
      },
    ],
  };
}

/**
 * Deterministic Waterproofing Takeoff
 * Formula: Floor Area + (Perimeter × Upstand Height) (m²)
 */
export function calculateWaterproofingItem(input: {
  id: string;
  zoneType: WaterproofingTakeoffItem['zoneType'];
  description: string;
  room?: string;
  level: string;
  systemType: string;
  layers?: number;
  upstandHeightM?: number;
  floorAreaM2: number;
  perimeterM?: number;
  protectionScreed?: boolean;
  drawingNumber: string;
  revision: string;
  pageNumber: number;
  sourceLocation: string;
}): WaterproofingTakeoffItem {
  const floorArea = Number(input.floorAreaM2 || 0);
  const upstandHeight = Number(input.upstandHeightM !== undefined ? input.upstandHeightM : 0.3);
  const perimeter = Number(input.perimeterM || 0);
  const upstandArea = perimeter * upstandHeight;
  const totalArea = floorArea + upstandArea;

  const formulaWithValues = `${floorArea.toFixed(2)}m² (floor) + (${perimeter.toFixed(2)}m × ${upstandHeight.toFixed(2)}m upstand = ${upstandArea.toFixed(2)}m²) = ${totalArea.toFixed(2)} m²`;

  return {
    id: input.id,
    zoneType: input.zoneType,
    description: input.description,
    room: input.room,
    level: input.level,
    systemType: input.systemType,
    layers: input.layers || 2,
    upstandHeightM: upstandHeight,
    floorAreaM2: Number(floorArea.toFixed(2)),
    upstandAreaM2: Number(upstandArea.toFixed(2)),
    totalAreaM2: Number(totalArea.toFixed(2)),
    protectionScreed: !!input.protectionScreed,
    formulaWithValues,
    drawingNumber: input.drawingNumber,
    revision: input.revision,
    pageNumber: input.pageNumber,
    sourceLocation: input.sourceLocation,
    verificationStatus: 'verified',
    auditTrail: [
      {
        id: `AUD-WP-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: 'Engine: calculateWaterproofingItem',
        action: 'CREATED',
        previousValue: null,
        newValue: totalArea,
        newFormula: formulaWithValues,
        reason: 'Waterproofing membrane area with vertical upstand coves',
      },
    ],
  };
}

/**
 * Deterministic Screed Takeoff
 * Formula: Area × Thickness = Volume (m³)
 */
export function calculateScreedItem(input: {
  id: string;
  room: string;
  level: string;
  type: string;
  thicknessMm: number;
  areaM2: number;
  drawingNumber: string;
  revision: string;
  pageNumber: number;
  sourceLocation: string;
}): ScreedTakeoffItem {
  const area = Number(input.areaM2 || 0);
  const thicknessM = (input.thicknessMm || 50) / 1000;
  const volume = area * thicknessM;

  const formulaWithValues = `${area.toFixed(2)}m² × ${input.thicknessMm}mm (${thicknessM.toFixed(3)}m) = ${volume.toFixed(3)} m³`;

  return {
    id: input.id,
    room: input.room,
    level: input.level,
    type: input.type,
    thicknessMm: input.thicknessMm,
    areaM2: Number(area.toFixed(2)),
    volumeM3: Number(volume.toFixed(3)),
    formulaWithValues,
    drawingNumber: input.drawingNumber,
    revision: input.revision,
    pageNumber: input.pageNumber,
    sourceLocation: input.sourceLocation,
    verificationStatus: 'verified',
    auditTrail: [
      {
        id: `AUD-SCR-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: 'Engine: calculateScreedItem',
        action: 'CREATED',
        previousValue: null,
        newValue: volume,
        newFormula: formulaWithValues,
        reason: 'Floor screed bedding takeoff',
      },
    ],
  };
}

/**
 * Deterministic Wall Tile Takeoff
 * Formula: Wall Length × Tile Height - Openings = Net Area (m²)
 */
export function calculateWallTileItem(input: {
  id: string;
  room: string;
  level: string;
  tileType: string;
  tileHeightM: number;
  wallLengthM: number;
  deductionAreaM2?: number;
  drawingNumber: string;
  revision: string;
  pageNumber: number;
  sourceLocation: string;
}): WallTileTakeoffItem {
  const length = Number(input.wallLengthM || 0);
  const tileHeight = Number(input.tileHeightM || 2.4);
  const grossArea = length * tileHeight;
  const deduction = Number(input.deductionAreaM2 || 0);
  const netArea = Math.max(0, grossArea - deduction);

  const formulaWithValues = `${length.toFixed(2)}m × ${tileHeight.toFixed(2)}m - ${deduction.toFixed(2)}m² openings = ${netArea.toFixed(2)} m²`;

  return {
    id: input.id,
    room: input.room,
    level: input.level,
    tileType: input.tileType,
    tileHeightM: tileHeight,
    wallLengthM: length,
    grossAreaM2: Number(grossArea.toFixed(2)),
    deductionAreaM2: Number(deduction.toFixed(2)),
    netAreaM2: Number(netArea.toFixed(2)),
    formulaWithValues,
    drawingNumber: input.drawingNumber,
    revision: input.revision,
    pageNumber: input.pageNumber,
    sourceLocation: input.sourceLocation,
    verificationStatus: 'verified',
    auditTrail: [
      {
        id: `AUD-WT-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: 'Engine: calculateWallTileItem',
        action: 'CREATED',
        previousValue: null,
        newValue: netArea,
        newFormula: formulaWithValues,
        reason: 'Wet area wall tile takeoff',
      },
    ],
  };
}

/**
 * Deterministic Stair Finish Takeoff
 * Formula: (Treads Area) + (Risers Area) + (Landings Area)
 */
export function calculateStairFinishItem(input: {
  id: string;
  stairMark: string;
  level: string;
  treadCount: number;
  treadWidthM: number;
  treadLengthM: number;
  riserCount: number;
  riserHeightM: number;
  riserLengthM: number;
  landingCount: number;
  landingAreaM2: number;
  finishMaterial: string;
  nosingSpec?: string;
  drawingNumber: string;
  revision: string;
  pageNumber: number;
  sourceLocation: string;
}): StairFinishTakeoffItem {
  const treadArea = input.treadCount * input.treadWidthM * input.treadLengthM;
  const riserArea = input.riserCount * input.riserHeightM * input.riserLengthM;
  const landingArea = input.landingCount * input.landingAreaM2;
  const total = treadArea + riserArea + landingArea;

  const formulaWithValues = `Treads (${input.treadCount}×${input.treadWidthM}×${input.treadLengthM} = ${treadArea.toFixed(2)}m²) + Risers (${input.riserCount}×${input.riserHeightM}×${input.riserLengthM} = ${riserArea.toFixed(2)}m²) + Landings (${landingArea.toFixed(2)}m²) = ${total.toFixed(2)} m²`;

  return {
    id: input.id,
    stairMark: input.stairMark,
    level: input.level,
    treadCount: input.treadCount,
    treadWidthM: input.treadWidthM,
    treadLengthM: input.treadLengthM,
    riserCount: input.riserCount,
    riserHeightM: input.riserHeightM,
    riserLengthM: input.riserLengthM,
    landingCount: input.landingCount,
    landingAreaM2: input.landingAreaM2,
    treadAreaM2: Number(treadArea.toFixed(2)),
    riserAreaM2: Number(riserArea.toFixed(2)),
    totalFinishAreaM2: Number(total.toFixed(2)),
    finishMaterial: input.finishMaterial,
    nosingSpec: input.nosingSpec,
    formulaWithValues,
    drawingNumber: input.drawingNumber,
    revision: input.revision,
    pageNumber: input.pageNumber,
    sourceLocation: input.sourceLocation,
    verificationStatus: 'verified',
    auditTrail: [
      {
        id: `AUD-STR-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: 'Engine: calculateStairFinishItem',
        action: 'CREATED',
        previousValue: null,
        newValue: total,
        newFormula: formulaWithValues,
        reason: 'Stair tread, riser and landing finish calculation',
      },
    ],
  };
}

/**
 * Deterministic Parapet Takeoff
 * Formula: Length × Height × Thickness (m³) & Plaster (2 × L × H + L × T)
 */
export function calculateParapetItem(input: {
  id: string;
  mark: string;
  level: string;
  lengthM: number;
  heightM: number;
  thicknessM: number;
  material: string;
  copingSpec?: string;
  drawingNumber: string;
  revision: string;
  pageNumber: number;
  sourceLocation: string;
}): ParapetTakeoffItem {
  const length = Number(input.lengthM || 0);
  const height = Number(input.heightM || 0);
  const thickness = Number(input.thicknessM || 0.2);

  const volume = length * height * thickness;
  const plasterArea = 2 * length * height + length * thickness; // Both vertical faces + top face

  const formulaWithValues = `${length.toFixed(2)}m × ${height.toFixed(2)}m × ${thickness.toFixed(3)}m = ${volume.toFixed(3)} m³ (Plaster: 2 faces + top = ${plasterArea.toFixed(2)} m²)`;

  return {
    id: input.id,
    mark: input.mark,
    level: input.level,
    lengthM: length,
    heightM: height,
    thicknessM: thickness,
    material: input.material,
    volumeM3: Number(volume.toFixed(3)),
    plasterAreaM2: Number(plasterArea.toFixed(2)),
    copingSpec: input.copingSpec,
    formulaWithValues,
    drawingNumber: input.drawingNumber,
    revision: input.revision,
    pageNumber: input.pageNumber,
    sourceLocation: input.sourceLocation,
    verificationStatus: 'verified',
    auditTrail: [
      {
        id: `AUD-PARA-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: 'Engine: calculateParapetItem',
        action: 'CREATED',
        previousValue: null,
        newValue: volume,
        newFormula: formulaWithValues,
        reason: 'Roof parapet masonry and plaster takeoff',
      },
    ],
  };
}

/**
 * Deterministic Master Summary Aggregation
 */
export function calculateArchitecturalSummary(params: {
  walls: WallRegisterItem[];
  dpcs: DPCRegisterItem[];
  doors: DoorRegisterItem[];
  windows: WindowRegisterItem[];
  plasters: PlasterTakeoffItem[];
  paintings: PaintingTakeoffItem[];
  floorings: FlooringTakeoffItem[];
  skirtings: SkirtingTakeoffItem[];
  ceilings: CeilingTakeoffItem[];
  waterproofings: WaterproofingTakeoffItem[];
  screeds: ScreedTakeoffItem[];
  wallTiles: WallTileTakeoffItem[];
  parapets: ParapetTakeoffItem[];
  stairs: StairFinishTakeoffItem[];
}): ArchitecturalSummaryData {
  let masonryVolumeM3 = 0;
  let wallNetAreaM2 = 0;
  let dpcAreaM2 = 0;
  let plasterAreaM2 = 0;
  let paintingAreaM2 = 0;
  let flooringAreaM2 = 0;
  let wallTilesAreaM2 = 0;
  let ceilingAreaM2 = 0;
  let waterproofingAreaM2 = 0;
  let skirtingLengthM = 0;
  let doorsCount = 0;
  let windowsCount = 0;
  let doorsAreaM2 = 0;
  let windowsAreaM2 = 0;
  let screedVolumeM3 = 0;
  let parapetVolumeM3 = 0;
  let stairFinishAreaM2 = 0;

  let totalElementsCount = 0;
  let verifiedCount = 0;
  let blockedCount = 0;
  let requiresReviewCount = 0;

  // 1. Walls
  params.walls.forEach((w) => {
    totalElementsCount++;
    if (w.isBlocked) blockedCount++;
    else if (w.verificationStatus === 'verified') verifiedCount++;
    else requiresReviewCount++;

    if (!w.isBlocked) {
      masonryVolumeM3 += w.netVolumeM3;
      wallNetAreaM2 += w.netAreaM2;
    }
  });

  // 2. DPCs
  params.dpcs.forEach((d) => {
    totalElementsCount++;
    if (d.isBlocked) blockedCount++;
    else if (d.verificationStatus === 'verified') verifiedCount++;
    else requiresReviewCount++;

    if (!d.isBlocked) {
      dpcAreaM2 += d.areaM2;
    }
  });

  // 3. Doors
  params.doors.forEach((dr) => {
    totalElementsCount++;
    if (dr.verificationStatus === 'verified') verifiedCount++;
    else requiresReviewCount++;

    doorsCount += dr.quantity;
    doorsAreaM2 += dr.totalAreaM2;
  });

  // 4. Windows
  params.windows.forEach((wn) => {
    totalElementsCount++;
    if (wn.verificationStatus === 'verified') verifiedCount++;
    else requiresReviewCount++;

    windowsCount += wn.quantity;
    windowsAreaM2 += wn.totalAreaM2;
  });

  // 5. Plasters
  params.plasters.forEach((p) => {
    totalElementsCount++;
    if (p.verificationStatus === 'verified') verifiedCount++;
    else requiresReviewCount++;

    plasterAreaM2 += p.netAreaM2;
  });

  // 6. Paintings
  params.paintings.forEach((p) => {
    totalElementsCount++;
    if (p.verificationStatus === 'verified') verifiedCount++;
    else requiresReviewCount++;

    paintingAreaM2 += p.netAreaM2;
  });

  // 7. Floorings
  params.floorings.forEach((f) => {
    totalElementsCount++;
    if (f.verificationStatus === 'verified') verifiedCount++;
    else requiresReviewCount++;

    flooringAreaM2 += f.tenderAreaM2;
  });

  // 8. Skirtings
  params.skirtings.forEach((s) => {
    totalElementsCount++;
    if (s.verificationStatus === 'verified') verifiedCount++;
    else requiresReviewCount++;

    skirtingLengthM += s.netLengthM;
  });

  // 9. Ceilings
  params.ceilings.forEach((c) => {
    totalElementsCount++;
    if (c.verificationStatus === 'verified') verifiedCount++;
    else requiresReviewCount++;

    ceilingAreaM2 += c.areaM2;
  });

  // 10. Waterproofings
  params.waterproofings.forEach((wp) => {
    totalElementsCount++;
    if (wp.verificationStatus === 'verified') verifiedCount++;
    else requiresReviewCount++;

    waterproofingAreaM2 += wp.totalAreaM2;
  });

  // 11. Screeds
  params.screeds.forEach((sc) => {
    totalElementsCount++;
    if (sc.verificationStatus === 'verified') verifiedCount++;
    else requiresReviewCount++;

    screedVolumeM3 += sc.volumeM3;
  });

  // 12. Wall Tiles
  params.wallTiles.forEach((wt) => {
    totalElementsCount++;
    if (wt.verificationStatus === 'verified') verifiedCount++;
    else requiresReviewCount++;

    wallTilesAreaM2 += wt.netAreaM2;
  });

  // 13. Parapets
  params.parapets.forEach((pr) => {
    totalElementsCount++;
    if (pr.verificationStatus === 'verified') verifiedCount++;
    else requiresReviewCount++;

    parapetVolumeM3 += pr.volumeM3;
  });

  // 14. Stairs
  params.stairs.forEach((st) => {
    totalElementsCount++;
    if (st.verificationStatus === 'verified') verifiedCount++;
    else requiresReviewCount++;

    stairFinishAreaM2 += st.totalFinishAreaM2;
  });

  return {
    masonryVolumeM3: Number(masonryVolumeM3.toFixed(3)),
    wallNetAreaM2: Number(wallNetAreaM2.toFixed(2)),
    dpcAreaM2: Number(dpcAreaM2.toFixed(3)),
    plasterAreaM2: Number(plasterAreaM2.toFixed(2)),
    paintingAreaM2: Number(paintingAreaM2.toFixed(2)),
    flooringAreaM2: Number(flooringAreaM2.toFixed(2)),
    wallTilesAreaM2: Number(wallTilesAreaM2.toFixed(2)),
    ceilingAreaM2: Number(ceilingAreaM2.toFixed(2)),
    waterproofingAreaM2: Number(waterproofingAreaM2.toFixed(2)),
    skirtingLengthM: Number(skirtingLengthM.toFixed(2)),
    doorsCount,
    windowsCount,
    doorsAreaM2: Number(doorsAreaM2.toFixed(2)),
    windowsAreaM2: Number(windowsAreaM2.toFixed(2)),
    screedVolumeM3: Number(screedVolumeM3.toFixed(3)),
    parapetVolumeM3: Number(parapetVolumeM3.toFixed(3)),
    stairFinishAreaM2: Number(stairFinishAreaM2.toFixed(2)),
    totalElementsCount,
    verifiedCount,
    blockedCount,
    requiresReviewCount,
  };
}
