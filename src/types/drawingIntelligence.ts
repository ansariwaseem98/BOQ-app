/**
 * AI BOQ & Tender Estimation Engineer - Phase 14A Drawing Intelligence Core Types
 * Accuracy, Source Traceability, Uncertainty Detection & Human-in-the-Loop
 */

export type SupportedDrawingFormat = 
  | 'PDF' 
  | 'DWG' 
  | 'DXF' 
  | 'IFC' 
  | 'PNG' 
  | 'JPG' 
  | 'JPEG' 
  | 'TIFF' 
  | 'HAND_SKETCH'
  | 'UNSUPPORTED';

export type DrawingDiscipline =
  | 'ARCHITECTURAL'
  | 'STRUCTURAL'
  | 'CIVIL'
  | 'STEEL'
  | 'ROOFING'
  | 'ELECTRICAL'
  | 'HVAC'
  | 'PLUMBING'
  | 'FIRE_FIGHTING'
  | 'FIRE_ALARM'
  | 'ELV'
  | 'MEP_COORDINATION'
  | 'SHOP_DRAWING'
  | 'IFC'
  | 'AS_BUILT'
  | 'GENERAL_ARRANGEMENT'
  | 'DETAIL'
  | 'SECTION'
  | 'ELEVATION'
  | 'FOUNDATION'
  | 'OTHER';

export type DrawingClassificationConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'REVIEW_REQUIRED';

export type ExtractionConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNREADABLE';

export type VerificationStatus = 
  | 'AI_EXTRACTED' 
  | 'AWAITING_VERIFICATION' 
  | 'VERIFIED' 
  | 'USER_CORRECTED' 
  | 'OPEN_ITEM' 
  | 'CONFLICT' 
  | 'REJECTED' 
  | 'SUPERSEDED';

export type DimensionType = 
  | 'LINEAR' 
  | 'ALIGNED' 
  | 'ANGULAR' 
  | 'RADIAL' 
  | 'DIAMETER' 
  | 'LEVEL' 
  | 'ELEVATION' 
  | 'SPACING' 
  | 'THICKNESS' 
  | 'DEPTH' 
  | 'HEIGHT' 
  | 'WIDTH' 
  | 'LENGTH' 
  | 'OTHER';

export type DimensionSourceType = 
  | 'CAD_DIMENSION' 
  | 'CAD_TEXT' 
  | 'PDF_VECTOR_TEXT' 
  | 'OCR_TEXT' 
  | 'GEOMETRY_MEASUREMENT' 
  | 'IFC_PROPERTY' 
  | 'USER_INPUT' 
  | 'HAND_SKETCH';

export interface BoundingBox {
  x: number; // percentage (0-100) or pixels on canvas
  y: number;
  width: number;
  height: number;
  page?: number;
}

export interface DrawingSourceRegion {
  drawingId: string;
  drawingNumber: string;
  revision: string;
  page: number;
  boundingBox: BoundingBox;
  viewportCenter?: { x: number; y: number };
  zoomLevel?: number;
  snippetDescription: string;
}

export interface FileInspectionReport {
  fileId: string;
  fileName: string;
  fileType: SupportedDrawingFormat;
  fileSizeBytes: number;
  pageCount: number;
  isVector: boolean;
  isRaster: boolean;
  isCad: boolean;
  isIfc: boolean;
  nativeUnits?: string;
  normalizedUnits: 'mm' | 'm' | 'cm' | 'inch' | 'ft' | 'UNKNOWN';
  unitConversionFactor: number;
  detectedScale?: string; // e.g. "1:100"
  scaleConfidence: ExtractionConfidence;
  isScaleCalibrated: boolean;
  isHandSketch: boolean;
  drawingNumberDetected?: string;
  titleDetected?: string;
  revisionDetected?: string;
  disciplineDetected?: DrawingDiscipline;
  classificationStatus: 'CLASSIFIED' | 'CLASSIFICATION_REVIEW_REQUIRED' | 'UNSUPPORTED';
  warnings: string[];
  inspectedAt: string;
}

export interface SheetIntelligence {
  sheetId: string;
  fileId: string;
  drawingNumber: string;
  title: string;
  discipline: DrawingDiscipline;
  drawingType: 'PLAN' | 'SECTION' | 'ELEVATION' | 'DETAIL' | 'SCHEDULE' | 'SHOP_DRAWING' | 'IFC_VIEW' | 'FOUNDATION' | 'OTHER';
  revision: string;
  scale: string; // "1:100", "1:50", "1:20", "SCALE UNKNOWN"
  scaleFactor: number; // e.g. 0.01 for 1:100
  units: 'mm' | 'm' | 'cm' | 'inch' | 'ft' | 'UNKNOWN';
  pageNumber: number;
  sourceFileName: string;
  confidence: DrawingClassificationConfidence;
  status: 'READY' | 'REVIEW_REQUIRED' | 'UNREADABLE' | 'CALIBRATION_NEEDED';
  elementsCount: number;
  dimensionsCount: number;
  openItemsCount: number;
  conflictsCount: number;
  imageUrl?: string;
  svgData?: string;
}

export interface DimensionObject {
  dimensionId: string;
  sheetId: string;
  drawingNumber: string;
  page: number;
  value: number;
  unit: string;
  nominalText: string; // original text from OCR or CAD e.g. "230 THK" or "3000"
  type: DimensionType;
  source: DimensionSourceType;
  boundingBox: BoundingBox;
  confidence: ExtractionConfidence;
  associatedElementId?: string;
  isOcrAmbiguous: boolean;
  ocrAmbiguityCandidates?: string[]; // e.g. ["230", "280"]
  isUnreadable: boolean;
  status: VerificationStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  userCorrectedValue?: number;
  userCorrectionReason?: string;
  notes?: string;
}

export interface ExtractionObject {
  extractionId: string;
  sheetId: string;
  drawingNumber: string;
  page: number;
  elementId: string;
  elementType: string;
  extractedText: string;
  extractedValue?: number;
  unit?: string;
  geometryType: 'LINE' | 'RECTANGLE' | 'POLYGON' | 'CIRCLE' | 'ARC' | 'TEXT_BOX' | 'COMPLEX';
  coordinates?: { x: number; y: number }[];
  boundingBox: BoundingBox;
  sourceRegion: DrawingSourceRegion;
  confidence: ExtractionConfidence;
  status: VerificationStatus;
  createdAt: string;
}

export interface SpatialRelationship {
  id: string;
  primaryElementId: string;
  relatedElementId: string;
  relationshipType: 
    | 'WALL_CONTAINS_DOOR' 
    | 'WALL_CONTAINS_WINDOW' 
    | 'WALL_CONTAINS_OPENING' 
    | 'BEAM_SUPPORTS_SLAB' 
    | 'COLUMN_INTERSECTS_BEAM' 
    | 'FOOTING_SUPPORTS_COLUMN' 
    | 'PURLIN_SUPPORTS_CLADDING' 
    | 'ROOM_BOUNDED_BY_WALLS'
    | 'MEP_CONDUIT_IN_SLAB'
    | 'PIPE_PENETRATES_WALL';
  confidence: ExtractionConfidence;
  verified: boolean;
  notes?: string;
}

export interface DetectedElement {
  elementMasterId: string; // Master ID ensuring duplicate multi-view representations link to 1 element
  elementTag: string; // e.g. "W-04", "COL-C1", "BEAM-B12", "D-01", "F-01"
  category: 
    | 'WALL' 
    | 'COLUMN' 
    | 'BEAM' 
    | 'SLAB' 
    | 'FOOTING' 
    | 'DOOR' 
    | 'WINDOW' 
    | 'STAIR' 
    | 'ROOM' 
    | 'STEEL_MEMBER' 
    | 'PURLIN' 
    | 'ROOF_CLADDING' 
    | 'SKYLIGHT' 
    | 'MEP_EQUIPMENT' 
    | 'MEP_FIXTURE' 
    | 'MEP_PIPE' 
    | 'MEP_DUCT' 
    | 'REBAR_BBS';
  level: string; // e.g. "Foundation", "Ground Floor", "Level 01", "Roof"
  zone?: string; // e.g. "Grid A-D / 1-4"
  dimensions: {
    length?: number;
    width?: number;
    height?: number;
    thickness?: number;
    depth?: number;
    diameter?: number;
    area?: number;
    volume?: number;
    unit: string;
  };
  specification?: string; // e.g. "Grade M25 Concrete", "200mm AAC Block", "Fe500D Rebar"
  sourceReferences: DrawingSourceRegion[]; // Multiple views: Plan, Section, Detail, IFC
  dimensionsLinked: DimensionObject[];
  spatialRelationships: SpatialRelationship[];
  openings?: {
    openingId: string;
    type: 'DOOR' | 'WINDOW' | 'SERVICE_PENETRATION';
    width: number;
    height: number;
    area: number;
    isDeducted: boolean;
    sourceRegion: DrawingSourceRegion;
  }[];
  grossQuantity: number;
  deductionQuantity: number;
  netQuantity: number;
  quantityUnit: string;
  confidence: ExtractionConfidence;
  status: VerificationStatus;
  repetitionCount: number; // e.g. 20 instances of C1
  isScheduleCrossChecked: boolean;
  scheduleMatchStatus?: 'MATCH' | 'MISMATCH' | 'NOT_IN_SCHEDULE';
  auditTrail: {
    timestamp: string;
    action: string;
    user: string;
    comment: string;
  }[];
}

export type OpenItemType = 
  | 'MISSING_DIMENSION'
  | 'UNREADABLE_DIMENSION'
  | 'MISSING_SPECIFICATION'
  | 'MISSING_QUANTITY'
  | 'CONFLICTING_DIMENSION'
  | 'UNKNOWN_SCALE'
  | 'UNKNOWN_UNIT'
  | 'UNCLEAR_ELEMENT'
  | 'DUPLICATE_CANDIDATE'
  | 'DRAWING_CONFLICT'
  | 'REVISION_CONFLICT'
  | 'SCHEDULE_MISMATCH'
  | 'OTHER';

export type OpenItemSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface DrawingOpenItem {
  id: string;
  type: OpenItemType;
  title: string;
  description: string;
  drawingNumber: string;
  sheetId: string;
  page: number;
  region: BoundingBox;
  affectedElementId?: string;
  affectedElementType?: string;
  extractedValueCandidate?: string | number;
  extractedConfidence: ExtractionConfidence;
  requiredInput: string; // e.g. "Enter explicit wall height (mm) from Section A-A"
  severity: OpenItemSeverity;
  status: 'OPEN' | 'IN_REVIEW' | 'USER_RESOLVED' | 'NOT_APPLICABLE' | 'CANCELLED';
  userResponse?: {
    resolvedValue: string | number;
    unit: string;
    reason: string;
    resolvedBy: string;
    resolvedAt: string;
    handSketchAttachmentUrl?: string;
  };
  createdAt: string;
}

export interface DrawingConflict {
  conflictId: string;
  title: string;
  description: string;
  severity: OpenItemSeverity;
  sourceA: {
    drawingNumber: string;
    drawingTitle: string;
    discipline: DrawingDiscipline;
    drawingType: string;
    revision: string;
    page: number;
    region: BoundingBox;
    value: string | number;
    unit: string;
    label: string; // e.g. "Architectural Plan A-101: 200mm wall"
  };
  sourceB: {
    drawingNumber: string;
    drawingTitle: string;
    discipline: DrawingDiscipline;
    drawingType: string;
    revision: string;
    page: number;
    region: BoundingBox;
    value: string | number;
    unit: string;
    label: string; // e.g. "Structural Section S-201: 230mm wall"
  };
  differenceDescription: string;
  status: 'OPEN' | 'RESOLVED_USE_A' | 'RESOLVED_USE_B' | 'RESOLVED_CUSTOM' | 'KEPT_OPEN';
  resolution?: {
    chosenValue: string | number;
    unit: string;
    decidedBy: string;
    decidedAt: string;
    justification: string;
  };
}

export interface DrawingCalibration {
  calibrationId: string;
  sheetId: string;
  drawingNumber: string;
  page: number;
  point1: { x: number; y: number };
  point2: { x: number; y: number };
  pixelDistance: number;
  knownRealWorldDimension: number; // in mm
  unit: string;
  derivedScale: string; // e.g. "1:100"
  derivedScaleRatio: number;
  toleranceDiscrepancyPercent?: number;
  isValidated: boolean;
  status: 'VALID' | 'CALIBRATION_REVIEW_REQUIRED' | 'REJECTED';
  calibratedBy: string;
  calibratedAt: string;
}

export interface RecalculationImpactNode {
  nodeId: string;
  nodeType: 'DRAWING_INPUT' | 'ELEMENT' | 'DIMENSION' | 'CALCULATION' | 'BOQ_ITEM' | 'PRICING_AMOUNT';
  title: string;
  code?: string;
  oldValue: number | string;
  newValue: number | string;
  unit: string;
  deltaPercent?: number;
  deltaAmount?: number;
  currency?: string;
}

export interface RecalculationImpactPreview {
  triggerDescription: string;
  affectedElements: RecalculationImpactNode[];
  affectedCalculations: RecalculationImpactNode[];
  affectedBoqItems: RecalculationImpactNode[];
  affectedTenderCostDelta: number;
  totalItemsChanged: number;
  impactSeverity: 'MAJOR' | 'MODERATE' | 'MINOR';
}

export interface DrawingRevisionDiff {
  drawingNumber: string;
  oldRevision: string;
  newRevision: string;
  addedElements: DetectedElement[];
  removedElements: DetectedElement[];
  modifiedElements: {
    element: DetectedElement;
    changeDescription: string;
    oldValue: string | number;
    newValue: string | number;
    affectedBoqItemCodes: string[];
  }[];
  unchangedElementsCount: number;
  impactedBoqItemsTotalDelta: number;
  diffHighlightedRegions: BoundingBox[];
}

export interface DrawingAccuracyDashboardData {
  drawingsProcessed: number;
  elementsDetected: number;
  dimensionsExtracted: number;
  highConfidenceCount: number;
  mediumConfidenceCount: number;
  lowConfidenceCount: number;
  unreadableCount: number;
  openItemsCount: number;
  criticalOpenItemsCount: number;
  conflictsCount: number;
  criticalConflictsCount: number;
  userCorrectionsCount: number;
  unverifiedQuantitiesCount: number;
  verifiedQuantitiesCount: number;
  accuracyQualityScore: number; // 0-100%
  isReadyForBoqLink: boolean;
  qualityGateMessages: string[];
}

export interface DrawingExtractionLog {
  id: string;
  timestamp: string;
  engine: string;
  inputDescription: string;
  outputSummary: string;
  confidence: ExtractionConfidence;
  processingTimeMs: number;
  hasAmbiguity: boolean;
  userCorrectionApplied: boolean;
}

export interface DrawingTestSuiteResult {
  testId: number;
  title: string;
  category: string;
  description: string;
  passed: boolean;
  inputCondition: string;
  expectedBehavior: string;
  actualOutcome: string;
  confidence: ExtractionConfidence;
  openItemGenerated: boolean;
  conflictGenerated: boolean;
  sourceTraceable: boolean;
  status: 'PASSED' | 'FAILED' | 'WARNING';
  executionTimeMs: number;
  notes: string;
}

// ==========================================
// PHASE 14B: REAL DRAWING PROCESSING TYPES
// ==========================================

export type RealDrawingAnalysisStageId =
  | 'STAGE_1_FILE_INSPECTION'
  | 'STAGE_2_SHEET_DETECTION'
  | 'STAGE_3_DRAWING_CLASSIFICATION'
  | 'STAGE_4_TEXT_EXTRACTION'
  | 'STAGE_5_DIMENSION_EXTRACTION'
  | 'STAGE_6_GEOMETRY_EXTRACTION'
  | 'STAGE_7_ELEMENT_DETECTION'
  | 'STAGE_8_SOURCE_MAPPING'
  | 'STAGE_9_CONFIDENCE_ANALYSIS'
  | 'STAGE_10_QUANTITY_CANDIDATES'
  | 'STAGE_11_VALIDATION';

export interface RealDrawingStageProgress {
  stageId: RealDrawingAnalysisStageId;
  stageNumber: number;
  stageName: string;
  description: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'WARNING' | 'FAILED';
  durationMs: number;
  details: string;
  elementsProcessed?: number;
  flagCount?: number;
}

export type ErrorClassificationType =
  | 'DIMENSION_EXTRACTION'
  | 'SCALE'
  | 'GEOMETRY'
  | 'OPENING_DEDUCTION'
  | 'ELEMENT_COUNT'
  | 'UNIT_CONVERSION'
  | 'DUPLICATE'
  | 'WRONG_SOURCE'
  | 'CALCULATION'
  | 'USER_CORRECTION'
  | 'UNKNOWN';

export type ControlledValidationStatus = 'PASS' | 'REVIEW' | 'FAIL';

export type ControlledVerificationTag =
  | 'AI_EXTRACTED'
  | 'NEEDS_REVIEW'
  | 'VERIFIED_BY_USER'
  | 'VALIDATED_AGAINST_REFERENCE';

export interface ControlledTestBoqItem {
  id: string;
  itemCode: string;
  discipline: DrawingDiscipline;
  description: string;
  unit: string;
  quantity: number;
  formula: string;
  sourceDrawing: string;
  sourcePage: number;
  sourceRegion: BoundingBox;
  sourceMethod: DimensionSourceType;
  confidence: ExtractionConfidence;
  verificationTag: ControlledVerificationTag;
  validationStatus: ControlledValidationStatus;
  referenceQuantity?: number;
  differenceQuantity?: number;
  differencePercent?: number;
  errorClassification?: ErrorClassificationType;
  engineerNotes?: string;
  isPromotedToFinalBoq?: boolean;
  selectedForTakeoff: boolean;
  associatedElementId?: string;
  elementCategory?: string;
  auditTrail: {
    timestamp: string;
    action: string;
    user: string;
    details: string;
  }[];
}

export interface WallTakeoffItem {
  wallId: string;
  tag: string;
  length: number; // mm
  height: number; // mm
  thickness: number; // mm
  grossVolumeM3: number;
  openings: {
    openingId: string;
    tag: string;
    type: 'DOOR' | 'WINDOW' | 'VENTILATOR' | 'MEP_OPENING';
    width: number;
    height: number;
    quantity: number;
    deductionVolumeM3: number;
    sourceDrawing: string;
    sourceRegion: BoundingBox;
  }[];
  totalDeductionM3: number;
  netVolumeM3: number;
  unit: string;
  formula: string;
  sourceDrawing: string;
  confidence: ExtractionConfidence;
  verificationStatus: ControlledVerificationTag;
}

export interface RccTakeoffItem {
  elementId: string;
  tag: string;
  category: 'FOOTING' | 'COLUMN' | 'BEAM' | 'SLAB' | 'WALL';
  dimensionsSummary: string;
  lengthMm?: number;
  widthMm?: number;
  depthOrHeightMm?: number;
  thicknessMm?: number;
  repetitionCount: number;
  unitVolumeM3: number;
  totalVolumeM3: number;
  unit: string;
  formula: string;
  sourceDrawing: string;
  sourceRegion: BoundingBox;
  confidence: ExtractionConfidence;
  verificationStatus: ControlledVerificationTag;
  scheduleChecked: boolean;
  scheduleStatus: 'MATCH' | 'MISMATCH' | 'NO_SCHEDULE';
}

export interface RebarBbsItem {
  barMark: string;
  member: string;
  diameterMm: number;
  quantity: number;
  shapeCode: string;
  shapeDescription: string;
  cuttingLengthMm: number;
  lapLengthMm: number;
  totalLengthM: number;
  unitWeightKgPerM: number;
  totalWeightKg: number;
  sourceDrawing: string;
  sourceRegion: BoundingBox;
  status: 'VALIDATED' | 'OPEN_ITEM' | 'REVIEW_REQUIRED';
  openItemReason?: string;
}

export interface StructuralSteelItem {
  memberMark: string;
  sectionName: string; // e.g. "ISMB 350", "UB 406x178x67"
  lengthM: number;
  quantity: number;
  unitWeightKgPerM: number;
  totalWeightKg: number;
  grade: string; // e.g. "E250 (Fe410W)", "S355"
  sourceDrawing: string;
  sourceRegion: BoundingBox;
  status: 'ESTABLISHED' | 'OPEN_ITEM';
  openItemReason?: string;
}

export interface RoofTakeoffItem {
  roofZone: string;
  geometry: string; // e.g. "Gable Roof Pitch 1:3 (18.4°)"
  slopeDeg: number;
  planAreaM2: number;
  slopeFactor: number;
  trueAreaM2: number;
  claddingType: string;
  skylightDeductionM2: number;
  netCladdingAreaM2: number;
  purlinSpacingMm: number;
  purlinTotalLengthM: number;
  sourceDrawing: string;
  isGeometryVerified: boolean;
}

export interface MepTakeoffItem {
  trade: 'ELECTRICAL' | 'HVAC' | 'PLUMBING' | 'FIRE_FIGHTING' | 'ELV';
  itemTag: string;
  description: string;
  quantity: number;
  unit: string;
  formula: string;
  sourceDrawing: string;
  sourceRegion: BoundingBox;
  confidence: ExtractionConfidence;
  verificationStatus: ControlledVerificationTag;
}

export interface UploadedDrawingItem {
  id: string;
  file?: File;
  fileName: string;
  fileFormat: SupportedDrawingFormat;
  fileSizeBytes: number;
  pageCount: number;
  drawingNumber: string;
  revision: string;
  discipline: DrawingDiscipline;
  isHandSketch: boolean;
  status: 'WAIT_FOR_ANALYSIS' | 'ANALYZING' | 'ANALYSIS_COMPLETE' | 'FAILED';
  uploadTimestamp: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  inspectionReport?: FileInspectionReport;
}

export interface ControlledPerformanceLog {
  fileProcessingTimeMs: number;
  pageProcessingTimeMs: number;
  extractionTimeMs: number;
  calculationTimeMs: number;
  reviewTimeMs: number;
  totalTimeMs: number;
  timestamp: string;
}

