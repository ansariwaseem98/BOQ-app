/**
 * PHASE 15D — STRUCTURAL STEEL, PURLINS, ROOF CLADDING & SKYLIGHT TYPES
 * Deterministic, source-traceable, zero-guesswork structural steel and roofing data structures.
 */

import { DrawingBoundingBox } from './index';

export type SteelCategory =
  | 'Primary Steel'
  | 'Secondary Steel'
  | 'Roof Framing'
  | 'Purlins'
  | 'Girts'
  | 'Bracing'
  | 'Base Plates'
  | 'Connection Plates'
  | 'Gusset Plates'
  | 'Stiffener Plates'
  | 'Splice Plates'
  | 'Cleats'
  | 'Bolts'
  | 'Anchor Bolts'
  | 'Welds'
  | 'Roof Cladding'
  | 'Skylights'
  | 'Flashings'
  | 'Gutters'
  | 'Downpipes'
  | 'Insulation'
  | 'Roof Accessories'
  | 'Miscellaneous Steel';

export type SteelMemberType =
  | 'Column'
  | 'Beam'
  | 'Primary Beam'
  | 'Secondary Beam'
  | 'Rafter'
  | 'Portal Frame'
  | 'Truss Top Chord'
  | 'Truss Bottom Chord'
  | 'Truss Web'
  | 'Truss End Post'
  | 'Bracing Cross'
  | 'Bracing Diagonal'
  | 'Tie Member'
  | 'Strut'
  | 'Eave Strut'
  | 'Purlin'
  | 'Girt'
  | 'Haunch'
  | 'Knee Plate'
  | 'Crane Girder'
  | 'Sag Rod'
  | 'Bridging'
  | 'Handrail'
  | 'Ladder'
  | 'Platform'
  | 'Stairs'
  | 'Base Plate'
  | 'End Plate'
  | 'Gusset Plate'
  | 'Stiffener'
  | 'Cleat'
  | 'Splice Plate'
  | 'Cover Plate'
  | 'Anchor Bolt'
  | 'Structural Bolt'
  | 'Weld'
  | 'Miscellaneous';

export type StructuralSteelGrade =
  | 'S275'
  | 'S355'
  | 'S355JR'
  | 'S355J2'
  | 'E250'
  | 'E350'
  | 'ASTM A36'
  | 'ASTM A992'
  | 'ASTM A572 Gr 50'
  | 'Grade 300'
  | 'Grade 350'
  | 'Custom';

export type SteelVerificationStatus =
  | 'AI EXTRACTED — NOT VERIFIED'
  | 'REQUIRES REVIEW'
  | 'BLOCKED'
  | 'USER VERIFIED'
  | 'USER CORRECTED'
  | 'FINAL';

export interface SourceReference {
  drawingNumber: string;
  drawingTitle: string;
  drawingType: 'GA' | 'Framing Plan' | 'Elevation' | 'Section' | 'Detail' | 'Shop Drawing' | 'Fabrication' | 'Erection' | 'Schedule' | 'IFC' | 'CAD';
  revision: string;
  pageNumber: number;
  locationDescription: string;
  boundingBox?: DrawingBoundingBox;
  ifcGlobalId?: string;
  cadLayer?: string;
  cadHandle?: string;
}

export interface CalculationAuditRecord {
  id: string;
  timestamp: string;
  action: 'CREATED' | 'UPDATED' | 'VERIFIED' | 'RESOLVED_CONFLICT' | 'RECALCULATED' | 'OVERRIDDEN';
  fieldChanged?: string;
  oldValue?: string | number | null;
  newValue?: string | number | null;
  formula: string;
  formulaWithValues: string;
  performedBy: string;
  reason: string;
}

export interface MemberSegment {
  segmentId: string;
  label: string;
  lengthM: number;
  source: string;
}

export interface MemberSplice {
  spliceId: string;
  locationFromStartM: number;
  segment1LengthM: number;
  segment2LengthM: number;
  splicePlateType: string;
  splicePlateThicknessMm: number;
  boltType: string;
  boltDiameterMm: number;
  boltQuantity: number;
  source: string;
}

export interface BuiltUpComponent {
  componentId: string;
  partName: 'Web' | 'Top Flange' | 'Bottom Flange' | 'Internal Stiffener' | 'Bearing Stiffener' | 'Cover Plate' | 'End Plate';
  lengthM: number;
  widthM: number;
  thicknessMm: number;
  quantity: number;
  unitWeightKgM?: number;
  weightKg: number;
  grade: StructuralSteelGrade;
  source: string;
}

export interface SteelMemberRecord {
  id: string;
  masterMemberId: string; // Used to group plan, elevation, fabrication instances into 1 master element
  physicalMemberId: string;
  mark: string; // e.g., "C1", "B101", "R1", "P-01", "BR-1"
  category: SteelCategory;
  memberType: SteelMemberType;
  section: string; // e.g. "UB 457x191x67", "ISMB 450", "SHS 200x200x8"
  sectionStandard?: string;
  materialGrade: StructuralSteelGrade;
  
  // Dimensions & Quantities
  lengthM: number | null;
  segments?: MemberSegment[];
  splice?: MemberSplice;
  isBuiltUp?: boolean;
  builtUpComponents?: BuiltUpComponent[];
  quantity: number;
  unitWeightKgM: number | null;
  totalWeightKg: number;
  totalWeightTonnes: number;
  
  // Location
  level: string;
  grid: string;
  zone: string;
  
  // Source & Traceability
  primarySource: SourceReference;
  associatedSources: SourceReference[];
  
  // Calculation details
  formula: string;
  formulaWithValues: string;
  calculationId: string;
  
  // Verification & Status
  verificationStatus: SteelVerificationStatus;
  isBlocked: boolean;
  blockedReason?: string | null;
  associatedOpenItemIds: string[];
  associatedConflictIds: string[];
  
  // Schedule cross-check
  scheduleWeightKg?: number;
  weightVariancePercent?: number;
  
  userCorrection?: {
    originalValue: string;
    correctedValue: string;
    reason: string;
    user: string;
    timestamp: string;
  };
  
  notes?: string;
  auditTrail: CalculationAuditRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface SteelPlateRecord {
  plateId: string;
  plateMark: string;
  plateType: 'Base Plate' | 'End Plate' | 'Gusset Plate' | 'Stiffener Plate' | 'Cleat' | 'Connection Plate' | 'Cover Plate' | 'Splice Plate';
  associatedMemberMark?: string;
  lengthM: number;
  widthM: number;
  thicknessM: number; // in metres (e.g. 0.02 for 20mm)
  thicknessMm: number; // in mm (e.g. 20)
  quantity: number;
  grade: StructuralSteelGrade;
  densityKgM3: number; // Configured steel density, default 7850
  
  areaM2: number; // Length * Width * Quantity
  volumeM3: number; // Length * Width * Thickness * Quantity
  weightKg: number; // Volume * Density
  weightTonnes: number;
  
  source: SourceReference;
  formula: string;
  formulaWithValues: string;
  status: SteelVerificationStatus;
  isBlocked: boolean;
  blockedReason?: string | null;
  notes?: string;
  auditTrail: CalculationAuditRecord[];
}

export interface BoltGroupRecord {
  boltId: string;
  boltMark: string;
  boltType: 'Anchor Bolt' | 'Structural Bolt' | 'High Strength Friction Grip (HSFG)' | 'Ordinary Bolt' | 'Special Bolt';
  diameterMm: number;
  lengthMm: number;
  grade: '8.8' | '10.9' | '4.6' | 'A325' | 'A490' | 'Grade B7' | 'Custom';
  
  // Geometric grouping
  connectionId: string;
  associatedMemberMark: string;
  location: string;
  rows?: number;
  columns?: number;
  spacingMm?: number;
  edgeDistanceMm?: number;
  
  quantityPerConnection: number;
  numberOfConnections: number;
  totalQuantity: number;
  
  // For Anchor Bolts
  projectionMm?: number;
  embedmentLengthMm?: number;
  basePlateAssociation?: string;
  
  source: SourceReference;
  status: SteelVerificationStatus;
  isBlocked: boolean;
  blockedReason?: string | null;
  notes?: string;
}

export interface WeldRecord {
  weldId: string;
  weldMark: string;
  weldType: 'Fillet Weld' | 'Full Penetration Butt Weld' | 'Partial Penetration Butt Weld' | 'Slot/Plug Weld';
  sizeMm: number; // Throat or leg size
  lengthM: number;
  quantity: number;
  totalLengthM: number;
  location: string; // e.g. "Rafter to Column Flange Knee Joint"
  associatedMemberMark: string;
  source: SourceReference;
  status: SteelVerificationStatus;
  isBlocked: boolean;
  blockedReason?: string | null;
  notes?: string;
}

export interface PurlinRecord {
  purlinId: string;
  purlinMark: string; // e.g., "P1", "P-01"
  profileType: 'Z-Purlin' | 'C-Purlin' | 'RHS' | 'Custom';
  section: string; // e.g. "Z200x65x2.0"
  unitWeightKgM: number;
  
  // Geometry & Spacing
  roofSlopeLengthM: number;
  baySpanM: number;
  spacingMm: number;
  spacingRule: 'Exact Division' | 'Floor Division + 1' | 'Ceiling Division + 1' | 'Direct Input';
  rowsPerSlope: number;
  slopesCount: number;
  totalRows: number;
  
  // Laps
  hasLap: boolean;
  lapLengthM: number;
  numberOfLaps: number;
  totalLapLengthM: number;
  
  singleMemberLengthM: number;
  totalLengthM: number;
  totalWeightKg: number;
  totalWeightTonnes: number;
  
  source: SourceReference;
  formula: string;
  formulaWithValues: string;
  status: SteelVerificationStatus;
  isBlocked: boolean;
  blockedReason?: string | null;
  notes?: string;
}

export interface GirtRecord {
  girtId: string;
  girtMark: string;
  profileType: 'C-Girt' | 'Z-Girt' | 'RHS' | 'Angle';
  section: string; // e.g. "C150x50x1.8"
  unitWeightKgM: number;
  wallHeightM: number;
  wallLengthM: number;
  spacingMm: number;
  rowsCount: number;
  quantity: number;
  totalLengthM: number;
  totalWeightKg: number;
  totalWeightTonnes: number;
  source: SourceReference;
  status: SteelVerificationStatus;
  isBlocked: boolean;
  blockedReason?: string | null;
  notes?: string;
}

export interface BracingRecord {
  bracingId: string;
  bracingMark: string;
  bracingType: 'Rod' | 'Angle' | 'Pipe / CHS' | 'Flat Bar' | 'Cable' | 'Tension Member' | 'Cross Bracing';
  section: string; // e.g. "L 75x75x6", "Dia 20mm Rod", "CHS 114.3x5.0"
  bayWidthM: number;
  bayHeightM: number;
  trueDiagonalLengthM: number;
  quantity: number;
  unitWeightKgM: number;
  totalLengthM: number;
  totalWeightKg: number;
  totalWeightTonnes: number;
  grade: StructuralSteelGrade;
  source: SourceReference;
  status: SteelVerificationStatus;
  isBlocked: boolean;
  blockedReason?: string | null;
  notes?: string;
}

export interface TrussRecord {
  trussId: string;
  trussMark: string; // e.g., "TR-01"
  spanM: number;
  heightM: number;
  numberOfTrusses: number;
  topChordSection: string;
  topChordLengthM: number;
  topChordWeightKg: number;
  bottomChordSection: string;
  bottomChordLengthM: number;
  bottomChordWeightKg: number;
  webMembersCount: number;
  webMembersTotalLengthM: number;
  webMembersWeightKg: number;
  totalTrussWeightKg: number;
  source: SourceReference;
  status: SteelVerificationStatus;
}

export interface PortalFrameRecord {
  frameId: string;
  frameMark: string; // e.g., "PF-01"
  gridLine: string;
  spanM: number;
  eaveHeightM: number;
  apexHeightM: number;
  columnSection: string;
  rafterSection: string;
  haunchLengthM: number;
  haunchDepthMm: number;
  haunchThicknessMm: number;
  haunchWeightKg: number;
  totalFrameWeightKg: number;
  source: SourceReference;
  status: SteelVerificationStatus;
}

export interface RoofGeometryRecord {
  id: string;
  roofName: string;
  roofType: 'Flat' | 'Single Slope' | 'Double Slope' | 'Saw-tooth' | 'Curved' | 'Multi-slope';
  buildingLengthM: number;
  buildingWidthSpanM: number;
  riseM: number;
  pitchAngleDeg: number;
  eaveOverhangM: number;
  gableOverhangM: number;
  
  // Geometrical Results
  halfSpanM: number;
  slopingRafterLengthM: number;
  planAreaM2: number;
  trueSlopingSurfaceAreaM2: number;
  
  source: SourceReference;
  notes?: string;
}

export interface RoofZoneRecord {
  zoneId: string;
  zoneName: string;
  slopeDesignation: 'North Slope' | 'South Slope' | 'East Slope' | 'West Slope' | 'Flat Zone' | 'High Bay' | 'Canopy';
  planAreaM2: number;
  trueSlopingAreaM2: number;
  slopePitchDeg: number;
  claddingSpecification: string;
  hasSkylights: boolean;
  skylightAreaM2: number;
  netCladdingAreaM2: number;
  source: SourceReference;
}

export interface RoofCladdingRecord {
  claddingId: string;
  mark: string; // e.g., "RC-01"
  zoneId: string;
  claddingType: 'Profiled Metal Sheet' | 'Standing Seam' | 'Sandwich Insulated Panel' | 'Composite Decking' | 'Other';
  profile: string; // e.g., "Trapezoidal 1000", "Kingspan KS1000RW"
  sheetThicknessMm: number; // e.g., 0.55
  coating: string; // e.g., "PVDF", "Colorbond", "Zincalume", "SMP"
  color: string;
  coreInsulation?: string; // e.g., "100mm PIR", "80mm Mineral Wool"
  
  // Dimensions & Coverage
  grossRoofAreaM2: number;
  deductedSkylightAreaM2: number;
  deductedOpeningAreaM2: number;
  netCladdingAreaM2: number;
  
  nominalWidthMm: number;
  effectiveCoverWidthMm: number; // e.g., 1000mm
  slopingSheetLengthM: number;
  totalSheetsCount: number;
  
  sideLapMm: number;
  endLapMm: number;
  
  source: SourceReference;
  formula: string;
  formulaWithValues: string;
  status: SteelVerificationStatus;
  isBlocked: boolean;
  blockedReason?: string | null;
  notes?: string;
}

export interface SkylightRecord {
  skylightId: string;
  mark: string; // e.g., "SL-01"
  zoneId: string;
  material: 'Polycarbonate Profiled Sheet' | 'Fiberglass Reinforced Plastic (FRP)' | 'Double Glazed Glass Skylight' | 'Continuous Barrel Vault';
  thicknessMm: number;
  profile: string;
  
  lengthM: number;
  widthM: number;
  quantity: number;
  singleAreaM2: number;
  totalAreaM2: number;
  
  isContinuousStrip: boolean;
  stripLengthM?: number;
  stripWidthM?: number;
  numberOfStrips?: number;
  
  source: SourceReference;
  formula: string;
  formulaWithValues: string;
  status: SteelVerificationStatus;
  isBlocked: boolean;
  blockedReason?: string | null;
  notes?: string;
}

export interface FlashingAccessoryRecord {
  accessoryId: string;
  mark: string;
  category: 'Ridge Flashing' | 'Barge Flashing' | 'Eave Flashing' | 'Valley Flashing' | 'Box Gutter' | 'Eaves Gutter' | 'Downpipe' | 'Foam Closure' | 'Fasteners' | 'Sealant';
  material: string;
  thicknessMm?: number;
  girthMm?: number;
  profile?: string;
  
  lengthM: number;
  quantity: number;
  totalLengthM: number;
  totalAreaM2?: number;
  unit: 'm' | 'm²' | 'Nos' | 'Rolls';
  
  source: SourceReference;
  formula: string;
  formulaWithValues: string;
  status: SteelVerificationStatus;
  isBlocked: boolean;
  blockedReason?: string | null;
  notes?: string;
}

export interface RoofInsulationRecord {
  insulationId: string;
  mark: string;
  insulationType: 'Glasswool Blanket' | 'Rockwool Board' | 'PIR Board' | 'Reflective Radiant Foil' | 'Vapour Barrier Membrane';
  thicknessMm: number;
  densityKgM3?: number;
  areaM2: number;
  source: SourceReference;
  status: SteelVerificationStatus;
  notes?: string;
}

export interface RoofSafetyRecord {
  safetyId: string;
  mark: string;
  itemType: 'Horizontal Lifeline' | 'Roof Walkway' | 'Parapet Guardrail' | 'Caged Access Ladder' | 'Safety Fall-Arrest Mesh';
  lengthM?: number;
  areaM2?: number;
  quantity: number;
  unit: 'm' | 'm²' | 'Nos';
  source: SourceReference;
  status: SteelVerificationStatus;
  notes?: string;
}

export interface SteelOpenItem {
  id: string;
  elementId: string;
  elementMark: string;
  category: 'MISSING_SECTION' | 'MISSING_WEIGHT' | 'MISSING_LENGTH' | 'MISSING_GRADE' | 'MISSING_BOLT_INFO' | 'MISSING_PURLIN_SPACING' | 'MISSING_CLADDING_PROFILE' | 'MISSING_COVERAGE_WIDTH' | 'UNCLEAR_GEOMETRY' | 'SPEC_AMBIGUITY';
  severity: 'CRITICAL_BLOCKING' | 'WARNING_REVIEW';
  title: string;
  description: string;
  requiredInformation: string;
  suggestedAction: string;
  drawingNumber: string;
  location: string;
  status: 'OPEN' | 'RESOLVED';
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface SteelConflict {
  id: string;
  conflictType: 'SECTION_MISMATCH' | 'LENGTH_MISMATCH' | 'QUANTITY_MISMATCH' | 'SPACING_MISMATCH' | 'SPECIFICATION_MISMATCH';
  elementMark: string;
  description: string;
  sourceA: {
    drawingNumber: string;
    drawingType: string;
    revision: string;
    value: string;
    location: string;
  };
  sourceB: {
    drawingNumber: string;
    drawingType: string;
    revision: string;
    value: string;
    location: string;
  };
  status: 'OPEN' | 'RESOLVED';
  resolutionNote?: string;
  resolvedSource?: 'A' | 'B' | 'CUSTOM';
  resolvedValue?: string;
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface SteelRevisionDiff {
  diffId: string;
  elementMark: string;
  category: SteelCategory;
  changeType: 'ADDED' | 'REMOVED' | 'MODIFIED_SECTION' | 'MODIFIED_LENGTH' | 'MODIFIED_SPACING' | 'MODIFIED_QUANTITY';
  oldRevision: string;
  newRevision: string;
  oldSection: string;
  newSection: string;
  oldWeightKg: number;
  newWeightKg: number;
  deltaWeightKg: number;
  deltaWeightTonnes: number;
  oldBoqItem?: string;
  newBoqItem?: string;
  affectedBoqIds: string[];
  summary: string;
  reviewed: boolean;
  reviewedBy?: string;
}

export interface ProjectSteelSettings {
  steelDensityKgM3: number; // default 7850
  measurementStandard: 'POMI' | 'IS 1200' | 'NRM2' | 'AISC Code of Standard Practice' | 'CESMM4';
  defaultGrade: StructuralSteelGrade;
  purlinDefaultSpacingRule: 'Exact Division' | 'Floor Division + 1' | 'Ceiling Division + 1';
  roofAreaMeasurementMode: 'True Sloping Surface Area' | 'Plan Area';
  weightCrossCheckTolerancePercent: number; // e.g. 2.0%
}
