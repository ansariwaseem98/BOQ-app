/**
 * PHASE 15C — MASONRY + DPC + DOORS/WINDOWS + FINISHES ENGINE TYPES
 * Complying strictly with deterministic measurement rules (POMI / IS 1200 / NRM2)
 * Zero guesswork architecture with complete source traceability, audit trails, and conflict engine.
 */

export type WallMaterialCategory =
  | 'Brick Masonry'
  | 'Block Masonry'
  | 'AAC Block'
  | 'Concrete Block'
  | 'Stone Masonry'
  | 'Partition Wall'
  | 'External Wall'
  | 'Internal Wall'
  | 'Parapet'
  | 'Boundary Wall'
  | 'Retaining Wall'
  | 'Other';

export type LintelType = 'RCC Lintel' | 'Steel Lintel' | 'Precast Lintel' | 'Timber Lintel' | 'None' | 'Unspecified';

export type QualityStatus =
  | 'CALCULATED'
  | 'AI EXTRACTED'
  | 'REVIEW REQUIRED'
  | 'VERIFIED'
  | 'USER CORRECTED'
  | 'CONFLICT'
  | 'SUPERSEDED';

export type MeasurementRuleStandard = 'POMI' | 'IS1200' | 'NRM2' | 'CESMM4';

export interface SourceProvenance {
  drawingNumber: string;
  drawingTitle: string;
  drawingType: 'Plan' | 'Elevation' | 'Section' | 'Schedule' | 'Detail' | 'IFC' | 'Specification';
  revision: string;
  pageNumber: number;
  gridOrZone: string;
  sourceRegionCoordinates?: { x: number; y: number; width: number; height: number };
  extractedTextSnippet?: string;
}

export interface MasonryOpeningObject {
  id: string;
  openingMark: string; // e.g. "D-01", "W-02", "V-01"
  type: 'Door' | 'Window' | 'Vent' | 'Louver' | 'Service Opening' | 'Large Penetration' | 'Niche' | 'Void';
  widthM: number;
  heightM: number;
  sillHeightM?: number;
  headHeightM?: number;
  wallThicknessM: number;
  quantity: number;
  singleAreaM2: number;
  totalAreaM2: number;
  singleVolumeM3: number;
  totalVolumeM3: number;
  isFullHeight: boolean;
  deductionRule: string;
  isDeductibleMasonry: boolean;
  isDeductiblePlasterOneFace: boolean;
  isDeductiblePlasterTwoFaces: boolean;
  primarySource: SourceProvenance;
  crossReferences: SourceProvenance[];
  status: QualityStatus;
}

export interface MortarSpecification {
  cementRatio: number; // e.g. 1
  sandRatio: number; // e.g. 4 or 6 for 1:4 / 1:6
  mixNotation: string; // "1:4 Cement Sand"
  admixture?: string;
  jointThicknessMm: number; // e.g. 10mm
  volumeMethod: 'Standard Brick Table' | 'Dry Mortar Constant (0.25 to 0.30 m³/m³)' | 'Block Geometry Net';
}

export interface UserCorrectionAudit {
  id: string;
  timestamp: string;
  user: string;
  fieldChanged: string;
  originalValue: string;
  correctedValue: string;
  reason: string;
  sourceReference: string;
}

export interface MasonryElementRecord {
  id: string;
  wallMark: string; // e.g. "W-EXT-01", "W-INT-04"
  wallType: WallMaterialCategory;
  level: string; // e.g. "Ground Floor", "First Floor", "Roof"
  zone: string; // e.g. "Grid A/1-4", "Wing B", "Corridor"
  lengthM: number;
  heightM: number;
  heightDerivationMethod: 'Explicit Drawing Dimension' | 'Floor-to-Floor Minus Slab Depth' | 'Level-to-Level Section' | 'User Input';
  heightDerivationFormula?: string; // e.g. "3.600m (F2F) - 0.150m (Slab) = 3.450m"
  thicknessM: number; // e.g. 0.23, 0.20, 0.15, 0.10
  quantity: number;
  material: string; // e.g. "230mm First Class Wire Cut Red Clay Brick"
  blockBrickType?: string; // "Hollow Concrete Block 400x200x200", "AAC Block 600x200x200"
  mortarSpec?: MortarSpecification;
  lintelType: LintelType;
  linkedRccLintelId?: string;
  linkedDpcId?: string;
  openings: MasonryOpeningObject[];
  
  // Quantities
  grossAreaM2: number;
  grossVolumeM3: number;
  deductionsAreaM2: number;
  deductionsVolumeM3: number;
  netAreaM2: number;
  netVolumeM3: number;
  
  // Traceability & Calculation
  calculationId: string;
  calculationFormulaWithValues: string;
  primarySource: SourceProvenance;
  associatedSources: SourceProvenance[];
  status: QualityStatus;
  isBlocked: boolean;
  blockedReason?: string | null;
  associatedOpenItemIds: string[];
  associatedConflictIds: string[];
  corrections: UserCorrectionAudit[];
}

export interface DpcElementRecord {
  id: string;
  dpcMark: string; // e.g. "DPC-01"
  associatedWallId: string;
  associatedWallMark: string;
  level: string; // e.g. "Plinth Level", "Ground Floor +0.150"
  locationType: 'Plinth Level' | 'Wall Base' | 'Parapet Upstand' | 'Foundation Level' | 'Under Sill';
  systemType: 'DPC Strip' | 'DPC Membrane (Bituminous 2-ply)' | 'DPC Polythene Sheet (500 gauge)' | 'Liquid Polymer DPC' | 'Other';
  lengthM: number;
  widthM: number;
  thicknessMm?: number; // Optional, never assumed
  quantity: number;
  measurementUnit: 'm²' | 'm' | 'm³'; // Follows project measurement rule
  areaM2: number;
  linearLengthM: number;
  specification: string;
  primarySource: SourceProvenance;
  status: QualityStatus;
  isBlocked: boolean;
  blockedReason?: string | null;
  associatedOpenItemIds: string[];
  calculationFormulaWithValues: string;
  corrections: UserCorrectionAudit[];
}

export interface DoorScheduleRecord {
  id: string;
  doorMark: string; // e.g. "D-01"
  description: string;
  doorType: 'Single Leaf Flush' | 'Double Leaf Flush' | 'Sliding' | 'Acoustic' | 'Fire Rated' | 'Glazed Panel' | 'Revolving' | 'Other';
  widthM: number;
  heightM: number;
  wallThicknessM?: number;
  frameMaterial: string; // e.g. "Pressed Steel 1.6mm", "Hardwood Teak"
  shutterMaterial: string;
  fireRating?: string; // e.g. "FD30", "FD60", "FD120", "Non-FR" (never inferred)
  hardwareSchedule?: string[]; // e.g. ["Heavy Duty Mortise Lock", "Concealed Overhead Closer", "SS Ball Bearing Hinges"]
  glazingSpec?: string;
  quantity: number;
  level: string;
  roomRef?: string;
  singleAreaM2: number;
  totalAreaM2: number;
  primarySource: SourceProvenance;
  scheduleSource: SourceProvenance;
  status: QualityStatus;
  isBlocked: boolean;
  blockedReason?: string | null;
  associatedConflictIds: string[];
}

export interface WindowScheduleRecord {
  id: string;
  windowMark: string; // e.g. "W-01"
  description: string;
  windowType: 'Side Hung Casement' | 'Top Hung Projected' | 'Sliding 2-Track' | 'Fixed Glazing' | 'Louvered' | 'Clerestory' | 'Other';
  widthM: number;
  heightM: number;
  sillHeightM: number;
  headHeightM: number;
  frameMaterial: string; // "Powder Coated Aluminium (6063-T6)", "UPVC", "Thermally Broken Aluminium"
  glazingSpec: string; // "24mm Double Glazed Unit (6mm Toughened + 12mm Air + 6mm Low-E)"
  quantity: number;
  level: string;
  roomRef?: string;
  singleAreaM2: number;
  totalAreaM2: number;
  glazingAreaM2: number;
  primarySource: SourceProvenance;
  scheduleSource: SourceProvenance;
  status: QualityStatus;
  isBlocked: boolean;
  blockedReason?: string | null;
  associatedConflictIds: string[];
}

export interface PlasterTakeoffRecord {
  id: string;
  plasterMark: string; // e.g. "PL-INT-01"
  locationType: 'Internal Wall' | 'External Wall' | 'Ceiling' | 'Column' | 'Beam Soffit' | 'Window Reveal / Return' | 'Parapet' | 'Other';
  associatedWallId?: string;
  associatedWallMark?: string;
  roomZone: string;
  level: string;
  faceType: 'Internal Face Only' | 'External Face Only' | 'Both Faces' | 'Ceiling Soffit' | 'Isolated Surface';
  facesCount: number; // 1 or 2
  grossAreaM2: number;
  deductionAreaM2: number;
  netAreaM2: number;
  thicknessMm: number; // e.g. 12, 15, 20 (Open item if missing)
  specification: string; // "12mm Cement Plaster (1:4) with Smooth Trowel Finish"
  volumeM3?: number;
  measurementUnit: 'm²' | 'm³';
  revealReturnsAreaM2?: number;
  calculationFormulaWithValues: string;
  primarySource: SourceProvenance;
  status: QualityStatus;
  isBlocked: boolean;
  blockedReason?: string | null;
  associatedOpenItemIds: string[];
}

export interface FloorFinishRecord {
  id: string;
  finishMark: string; // e.g. "FF-01"
  roomName: string; // e.g. "Master Bedroom", "Corridor", "Lobby"
  roomNumber: string;
  level: string;
  zone: string;
  finishType: 'Ceramic Tile' | 'Porcelain Tile' | 'Granite' | 'Marble' | 'Vinyl' | 'Epoxy' | 'Concrete Polished Finish' | 'Carpet' | 'Raised Floor' | 'Other';
  specification: string; // "600x600mm Full Body Vitrified Porcelain Tile (Anti-skid R10)"
  thicknessMm?: number;
  grossAreaM2: number;
  deductionsVoidAreaM2: number; // Shafts, columns, stair voids
  netAreaM2: number;
  skirtingIncluded: boolean;
  skirtingLengthM: number;
  skirtingHeightMm: number;
  skirtingAreaM2?: number;
  screedBeddingThicknessMm?: number; // Screed link
  primarySource: SourceProvenance;
  scheduleSource?: SourceProvenance;
  status: QualityStatus;
  isBlocked: boolean;
  blockedReason?: string | null;
  associatedConflictIds: string[];
}

export interface PaintingRecord {
  id: string;
  paintMark: string; // e.g. "PNT-INT-01"
  surfaceType: 'Internal Wall Paint' | 'External Wall Paint' | 'Ceiling Paint' | 'Metal Protective Paint' | 'Woodwork Polish' | 'Other';
  associatedSurfaceRef: string; // e.g. "PL-INT-01" or "Room 101 All Internal Walls"
  level: string;
  roomZone: string;
  systemSpecification: string; // "1 Coat Acrylic Primer + 2 Coats Putty + 2 Coats Premium Emulsion"
  coatsCount: number; // Attribute (e.g. 2 coats). Not multiplied into area unless BOQ rule requires
  hasSeparatePrimerItem: boolean;
  hasSeparatePuttyItem: boolean;
  netAreaM2: number;
  primarySource: SourceProvenance;
  status: QualityStatus;
  isBlocked: boolean;
  blockedReason?: string | null;
  calculationFormulaWithValues: string;
}

export interface WaterproofingRecord {
  id: string;
  wpMark: string; // e.g. "WP-TOILET-01"
  locationCategory: 'Toilet / Wet Area' | 'Terrace / Roof' | 'Balcony' | 'Basement Retaining Wall' | 'Water Tank' | 'Planter Box' | 'Podium' | 'Other';
  roomZone: string;
  level: string;
  systemSpecification: string; // "2-component Elastomeric Polymer Cementitious Waterproofing Coating"
  layersCount: number;
  horizontalAreaM2: number;
  upstandHeightM: number; // e.g. 0.30m upturn
  upstandLengthM: number;
  upstandAreaM2: number;
  totalWaterproofingAreaM2: number; // horizontal + upstand
  protectiveScreedRequired: boolean;
  protectiveScreedThicknessMm?: number;
  primarySource: SourceProvenance;
  status: QualityStatus;
  isBlocked: boolean;
  blockedReason?: string | null;
  calculationFormulaWithValues: string;
}

export interface CeilingRecord {
  id: string;
  ceilingMark: string; // e.g. "CLG-01"
  roomZone: string;
  level: string;
  ceilingType: 'Gypsum Board False Ceiling' | '600x600 Mineral Fiber Grid' | 'Metal Pan Tile' | 'Acoustic Baffle' | 'Direct Plaster Soffit' | 'Other';
  clearHeightAfflM: number; // e.g. 2.80m AFFL
  specification: string; // "12.5mm Moisture Resistant Gypsum Board on GI Suspension Grid"
  grossAreaM2: number;
  openingsDeductionM2: number; // Light coves, AC diffusers, trap doors
  netAreaM2: number;
  primarySource: SourceProvenance;
  status: QualityStatus;
  isBlocked: boolean;
  blockedReason?: string | null;
}

export interface WallFinishCladdingRecord {
  id: string;
  claddingMark: string; // e.g. "WF-TILE-01"
  locationType: 'Bathroom Wall Dado' | 'Kitchen Dado' | 'Feature Wall Cladding' | 'Drywall Paneling' | 'Acoustic Fabric Panel';
  roomZone: string;
  level: string;
  materialSpec: string; // "300x600mm Glazed Ceramic Wall Tiles up to 2.40m Height"
  claddingHeightM: number; // e.g. 2.40m
  wallPerimeterLengthM: number;
  grossAreaM2: number;
  openingDeductionsM2: number;
  netAreaM2: number;
  primarySource: SourceProvenance;
  status: QualityStatus;
}

export interface RoomFinishScheduleRecord {
  id: string;
  roomNumber: string;
  roomName: string;
  level: string;
  floorFinish: string;
  skirtingFinish: string;
  internalWallFinish: string;
  ceilingFinish: string;
  ceilingHeightM: number;
  specialNotes?: string;
  drawingRef: string;
}

export interface ArchitecturalOpenItem {
  id: string;
  elementId?: string;
  elementMark?: string;
  category: 'Missing Wall Thickness' | 'Unreadable Wall Height' | 'Unknown Wall Material' | 'Missing DPC Width' | 'Missing DPC Specification' | 'Unclear Door Dimension' | 'Unclear Window Dimension' | 'Missing Plaster Thickness' | 'Unknown Finish Spec' | 'Missing Waterproofing Area' | 'Unknown Paint Coats' | 'Other';
  severity: 'HIGH_BLOCKING' | 'MEDIUM_REVIEW' | 'LOW_ADVISORY';
  title: string;
  description: string;
  missingInformation: string;
  suggestedRfiResolution: string;
  drawingNumber: string;
  status: 'OPEN' | 'RFI_SENT' | 'RESOLVED';
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNote?: string;
}

export interface ArchitecturalConflict {
  id: string;
  title: string;
  elementRef: string;
  category: 'Wall Thickness Conflict' | 'Door Dimension Conflict' | 'Window Dimension Conflict' | 'Finish Schedule vs Plan Conflict' | 'Level/Height Conflict' | 'Material Conflict';
  description: string;
  sourceA: {
    drawing: string;
    type: string;
    value: string;
    location: string;
  };
  sourceB: {
    drawing: string;
    type: string;
    value: string;
    location: string;
  };
  status: 'OPEN' | 'RESOLVED';
  resolutionAction?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNote?: string;
}

export interface ArchitecturalRevisionRecord {
  revisionId: string;
  drawingNumber: string;
  issueDate: string;
  description: string;
  wallsAddedCount: number;
  wallsRemovedCount: number;
  wallsModifiedCount: number;
  openingsDeltaCount: number;
  finishesDeltaAreaM2: number;
  masonryVolumeDeltaM3: number;
  dpcDeltaM2: number;
  plasterDeltaM2: number;
  affectedBoqItemCodes: string[];
}

export interface ProjectArchitecturalSettings {
  measurementStandard: MeasurementRuleStandard;
  dpcMeasurementUnit: 'm²' | 'm' | 'm³';
  openingPlasterDeductionThresholdM2: number; // e.g. 0.1 for POMI, 0.5 for IS 1200
  deductFullOpeningForPlasterTwoFaces: boolean;
  defaultMortarMix: string; // "1:4 Cement Sand"
  includeMortarTakeoff: boolean;
  defaultPlasterInternalThicknessMm: number; // 12mm
  defaultPlasterExternalThicknessMm: number; // 20mm
  paintCoatWiseMeasurementRequired: boolean; // false by default (paint is m2)
}
