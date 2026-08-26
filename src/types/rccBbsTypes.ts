/**
 * PHASE 15B — RCC + REINFORCEMENT + PROFESSIONAL BBS ENGINE
 * Master Types, Interfaces and Data Models
 * Strict engineering arithmetic, source traceability, open item gating, and conflict isolation.
 */

export type RccElementType =
  | 'Foundation'
  | 'Footing'
  | 'Raft'
  | 'Pile'
  | 'Pile Cap'
  | 'Pedestal'
  | 'Column'
  | 'Beam'
  | 'Slab'
  | 'RCC Wall'
  | 'Staircase'
  | 'Lintel'
  | 'Sunshade'
  | 'Parapet'
  | 'Kerb'
  | 'Upstand'
  | 'RCC Tank'
  | 'Other';

export type FootingSubtype = 'Isolated' | 'Combined' | 'Strip' | 'Raft' | 'Stepped';
export type ColumnSubtype = 'Rectangular' | 'Square' | 'Circular' | 'Irregular';
export type BeamSubtype = 'Rectangular' | 'T-Beam' | 'L-Beam' | 'Irregular';
export type SlabSubtype = 'Solid' | 'Flat' | 'Beam-and-slab' | 'Ribbed' | 'Waffle' | 'Inclined' | 'Irregular Polygon';
export type OpeningType = 'Stair Opening' | 'Service Opening' | 'Lift Opening' | 'Shaft' | 'Large Penetration' | 'Custom Void';

export type RccVerificationStatus =
  | 'Draft'
  | 'Calculated'
  | 'Review Required'
  | 'Verified'
  | 'Approved'
  | 'Superseded'
  | 'Blocked';

export interface RccOpeningDeduction {
  id: string;
  name: string;
  type: OpeningType;
  lengthM: number;
  widthM: number;
  depthM: number; // or thickness
  quantity: number;
  deductionVolumeM3: number;
  sourceDrawing: string;
  sourceRegion?: string;
  formula: string;
}

export interface SteppedFootingStep {
  stepNumber: number;
  lengthM: number;
  widthM: number;
  thicknessM: number;
  volumeM3: number;
}

export interface StaircaseFlightComponent {
  componentType: 'Flight Waist Slab' | 'Landing Slab' | 'Steps Triangle' | 'Beams' | 'Other';
  lengthM: number;
  widthM: number;
  thicknessOrDepthM: number;
  riserHeightM?: number;
  treadWidthM?: number;
  numberOfSteps?: number;
  volumeM3: number;
  formula: string;
}

export interface RccElementObject {
  id: string; // e.g. "RCC-EL-001"
  memberMark: string; // e.g. "C1", "TB-101", "FTG-01", "Slab-L1"
  elementType: RccElementType;
  subtype?: string;
  level: string; // e.g. "Foundation", "Ground Floor", "Level 1"
  zone: string; // e.g. "Zone A", "Grid 1-4/A-C"
  
  // Primary Dimensions (in meters)
  lengthM: number;
  widthM: number;
  depthM: number;
  heightM?: number;
  thicknessM?: number;
  diameterMm?: number; // for circular columns/piles
  
  // Specialized Breakdown
  steppedSteps?: SteppedFootingStep[];
  stairComponents?: StaircaseFlightComponent[];
  slabThicknessOverlapDeductionM?: number; // for monolithic T/L beam web calculation
  openings: RccOpeningDeduction[];
  
  quantity: number;
  grossVolumeM3: number;
  deductionsVolumeM3: number;
  netVolumeM3: number;
  
  unit: string; // "m³"
  concreteGrade?: string; // "M20", "M25", "M30", "M35", "C30/37" - missing triggers Open Item!
  concreteGradeSource?: string;
  
  sourceDrawing: string;
  sourceDrawingPage?: number;
  sourceRegion: string;
  calculationId: string;
  calculationFormula: string;
  calculationFormulaWithValues: string;
  
  status: RccVerificationStatus;
  isBlocked: boolean;
  blockedReason?: string;
  associatedOpenItemIds: string[];
  associatedConflictIds: string[];
  
  auditTrail: {
    timestamp: string;
    user: string;
    action: string;
    details: string;
  }[];
}

export type RebarShapeType =
  | 'Straight'
  | 'L bar'
  | 'U bar'
  | 'Stirrup'
  | 'Tie'
  | 'Closed link'
  | 'Open link'
  | 'Cranked bar'
  | 'Bent bar'
  | 'Hooked bar'
  | 'Chair bar'
  | 'Custom shape';

export type RebarShapeCode =
  | '00' // Straight
  | '11' // L-Bar (90° bend)
  | '21' // U-Bar (2x 90° bends)
  | '31' // Cranked bar (45° or 30° bent-up)
  | '41' // Rectangular Stirrup / Closed Link
  | '51' // Column Tie / Seismic Link (135° hooks)
  | '61' // Circular Ring / Spiral
  | '71' // Chair Bar
  | '77' // Hairpin / Cap
  | '81' // Bent / Hooked
  | '99'; // Custom Shape

export type BarSpacingDistributionRule =
  | 'CEILING_PLUS_1' // Number = CEILING(Length / Spacing) + 1
  | 'CEILING'        // Number = CEILING(Length / Spacing)
  | 'ROUND_PLUS_1'   // Number = ROUND(Length / Spacing) + 1
  | 'EXPLICIT_SOURCE'; // Drawing explicitly provides bar count (e.g. 12Y16)

export interface RebarSourceLocation {
  drawingNumber: string;
  drawingTitle?: string;
  pageNumber: number;
  detailNumber?: string;
  region: string; // e.g. "Section A-A", "Detail 3", "Plan View Grid B"
  sourceType: 'Structural Drawing' | 'Reinforcement Detail' | 'Bar Schedule' | 'Section' | 'General Notes' | 'CAD' | 'IFC' | 'User Input' | 'Hand Sketch';
}

export interface RebarSegmentDimensions {
  aMm: number;
  bMm?: number;
  cMm?: number;
  dMm?: number;
  eMm?: number;
  fMm?: number;
  radiusMm?: number;
}

export interface RebarBendDetail {
  angleDeg: 45 | 90 | 135 | 180;
  bendCount: number;
  bendRadiusMm?: number;
  bendDeductionMm: number; // e.g. 2d for 90°, 3d/4d for 135°
  deductionRule: string;
  source: string;
}

export interface RebarHookDetail {
  hookAngleDeg: 90 | 135 | 180;
  hookCount: number;
  hookLengthMm: number; // e.g. 9d for 90°, 12d for 135°, 16d for 180°
  extensionRule: string;
  source: string;
}

export interface RebarLapDetail {
  lapRequired: boolean;
  lapPosition?: 'Splice Zone' | 'Mid-span' | 'Support' | 'Staggered' | 'Custom';
  lapLengthMm: number;
  numberOfLaps: number;
  totalLapLengthMm: number;
  lapReason?: string;
  lapRule: string; // e.g. "50d as per General Notes", "600mm explicit in Detail 4"
  source: string;
  isMissing: boolean; // if required by span length > stock bar and no rule exists
}

export interface RebarAnchorageDetail {
  anchorageLengthMm: number;
  developmentLengthLdMm: number;
  anchorageType: 'Straight Ld' | '90° Standard Bend' | '135° Hook' | '180° Hook' | 'Mechanical Coupler';
  ruleDescription: string;
  source: string;
  isMissing: boolean;
}

export interface RebarCorrectionRecord {
  id: string;
  timestamp: string;
  user: string;
  fieldChanged: string;
  originalValue: string;
  correctedValue: string;
  reason: string;
  source: string;
}

export interface ReinforcementBarRecord {
  id: string; // e.g. "REBAR-001"
  masterBarId: string; // For deduplication across Plan, Section, Detail, Schedule
  barMark: string; // e.g. "T1", "B1", "Y16-01", "1B1" (Raw notation stored, not assumed)
  
  member: string; // e.g. "Beam B-101", "Column C-01", "Footing F-1"
  elementId: string; // Link to RccElementObject.id
  elementType: RccElementType;
  level: string; // e.g. "Foundation", "Level 01"
  zone: string; // e.g. "Zone A"
  
  barType: 'Main Bar' | 'Top Extra' | 'Bottom Extra' | 'Distribution Bar' | 'Stirrup' | 'Tie' | 'Starter Bar' | 'Chair' | 'Side Face' | 'Trimmer' | 'Other';
  grade: string; // "Fe500", "Fe500D", "Fe415", "Grade 60" - Missing triggers Open Item!
  gradeSource?: string;
  
  diameterMm: number; // Normalized to mm (8, 10, 12, 16, 20, 25, 32, 40)
  rawDiameterNotation: string; // e.g. "Ø16", "T16", "Y16", "#5"
  
  spacingMm: number | null; // e.g. 150 mm
  distributionLengthMm: number | null; // e.g. 5000 mm
  spacingDistributionRule: BarSpacingDistributionRule;
  
  explicitNumberFromDrawing: number | null; // e.g. 12 from "12Y16"
  numberOfBarsPerMember: number;
  numberOfMembers: number;
  totalNumberOfBars: number;
  
  shape: RebarShapeType;
  shapeCode: RebarShapeCode;
  shapeDescription: string;
  
  dimensions: RebarSegmentDimensions;
  
  clearCoverMm: number | null; // null triggers Open Item!
  coverSource?: string;
  
  geometricLengthM: number; // Pure sum of A + B + C...
  cuttingLengthM: number;   // With hooks, laps, Ld, and bend deductions
  cuttingLengthMm: number;
  cuttingFormula: string;
  cuttingFormulaWithValues: string;
  
  hooks: RebarHookDetail[];
  bends: RebarBendDetail[];
  lap: RebarLapDetail;
  anchorage: RebarAnchorageDetail;
  
  totalLengthM: number; // Cutting Length × Total Number of Bars
  
  unitWeightKgM: number; // Calculated strictly via d² / 162 (or 162.28)
  unitWeightFormula: string; // "d² / 162 = 16² / 162 = 1.580 kg/m"
  scheduleUnitWeightKgM?: number; // From drawing schedule if provided
  unitWeightCrossCheckStatus?: 'MATCH' | 'DISCREPANCY_FLAGGED';
  
  totalWeightKg: number; // Total Length × Unit Weight
  totalWeightTonnes: number;
  
  // Multi-source Traceability (Plan, Section, Detail, Schedule)
  sources: RebarSourceLocation[];
  primarySource: RebarSourceLocation;
  
  rawNotation: string; // e.g. "12Y16 @ 150 c/c (TOP MAT)"
  
  status: RccVerificationStatus;
  isBlocked: boolean;
  blockedReason?: string;
  
  associatedOpenItemIds: string[];
  associatedConflictIds: string[];
  
  corrections: RebarCorrectionRecord[];
  
  // Couplers / Accessories (Optional)
  hasCouplers?: boolean;
  couplerCount?: number;
  couplerType?: string;
  couplerSource?: string;
}

export interface RccBbsOpenItem {
  id: string; // e.g. "OI-BBS-001"
  itemType: 'MISSING_CONCRETE_GRADE' | 'MISSING_REBAR_GRADE' | 'MISSING_DIAMETER' | 'MISSING_SPACING' | 'MISSING_BAR_COUNT' | 'MISSING_COVER' | 'MISSING_LAP_LENGTH' | 'MISSING_DEVELOPMENT_LENGTH' | 'INCOMPLETE_SHAPE_GEOMETRY' | 'UNRESOLVED_DISCREPANCY';
  title: string;
  description: string;
  elementId?: string;
  rebarId?: string;
  drawingNumber: string;
  drawingPage?: number;
  region?: string;
  severity: 'CRITICAL_BLOCKING' | 'WARNING' | 'INFORMATION';
  status: 'OPEN' | 'RESOLVED';
  suggestedResolution?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNote?: string;
}

export interface RccBbsConflict {
  id: string; // e.g. "CONF-BBS-001"
  conflictType: 'SPACING_VS_COUNT_MISMATCH' | 'DIAMETER_MISMATCH_PLAN_VS_SCHEDULE' | 'LENGTH_MISMATCH_SECTION_VS_SCHEDULE' | 'CONCRETE_GRADE_MISMATCH' | 'REBAR_GRADE_MISMATCH' | 'DUPLICATE_BAR_OVERCOUNT';
  title: string;
  description: string;
  rebarId?: string;
  elementId?: string;
  sourceA: {
    drawing: string;
    page: number;
    location: string;
    value: string;
  };
  sourceB: {
    drawing: string;
    page: number;
    location: string;
    value: string;
  };
  status: 'OPEN' | 'RESOLVED';
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNote?: string;
  acceptedValue?: string;
}

export interface RebarWeightSummaryByDiameter {
  diameterMm: number;
  nominalName: string; // "Ø8", "Ø10", "Ø12", "Ø16", "Ø20", "Ø25", "Ø32", "Ø40"
  unitWeightKgM: number;
  totalBarsCount: number;
  totalLengthM: number;
  totalWeightKg: number;
  totalWeightTonnes: number;
  percentageOfTotal: number;
}

export interface RebarSummaryByMember {
  memberCategory: RccElementType;
  memberCount: number;
  totalBarsCount: number;
  totalLengthM: number;
  totalWeightKg: number;
  totalWeightTonnes: number;
  concreteVolumeM3: number;
  rebarDensityKgM3: number; // Analysis metric: Total Weight / Concrete Volume
}

export interface RccQuantitySummary {
  foundationVolumeM3: number;
  columnVolumeM3: number;
  beamVolumeM3: number;
  slabVolumeM3: number;
  wallVolumeM3: number;
  stairVolumeM3: number;
  otherVolumeM3: number;
  totalConcreteVolumeM3: number;
  elementCount: number;
}

export interface BbsRevisionRecord {
  revisionId: string; // "BBS Rev 00", "BBS Rev 01"
  date: string;
  description: string;
  drawingRevisionRef: string;
  totalRebarWeightKg: number;
  addedBarsCount: number;
  removedBarsCount: number;
  modifiedBarsCount: number;
  unchangedBarsCount: number;
  weightDeltaKg: number;
  costDeltaEstimated?: number;
  status: 'CURRENT' | 'SUPERSEDED' | 'DRAFT';
}

export interface RccBbsProjectSettings {
  defaultUnitWeightFormula: 'd2_div_162' | 'd2_div_162_28';
  defaultBarCountRule: BarSpacingDistributionRule;
  defaultLapRuleDescription: string; // e.g. "50d (IS 456)" or "48d (BS 8110)"
  defaultDevelopmentLengthRule: string; // e.g. "45d in tension"
  standardStockBarLengthM: number; // default 12.0m
  wastagePercentage: number; // e.g. 3.0%
  enableWastageInBoq: boolean;
  couplerThresholdDiameterMm: number; // e.g. 32mm (optional tracking)
  weightTolerancePercentage: number; // e.g. 1.0% for cross-check warnings
}
