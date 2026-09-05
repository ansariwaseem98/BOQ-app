/**
 * Phase 18A: Real Drawing Analysis & Measurement Extraction Engine Types
 * 
 * Strict architectural rules:
 * - Deterministic, evidence-based extraction (never invent dimensions, elements, or quantities)
 * - Source traceability: Every extracted value has Drawing ID, Page, Bounding Box Region, Confidence
 * - Status lifecycle: DETECTED -> REVIEW REQUIRED -> USER CORRECTED -> CONFLICT -> VERIFIED
 * - Measurement lifecycle: EXTRACTED -> NORMALIZED -> VALIDATED -> OPEN ITEM -> CONFLICT -> USER CORRECTED -> VERIFIED
 * - Prefer MISSING VALUE over INVENTED VALUE
 * - Prefer REVIEW REQUIRED over WRONG CONFIDENT VALUE
 */

export type AnalysisProcessingStatus = 
  | 'NOT ANALYZED'
  | 'ANALYZING'
  | 'PARTIALLY ANALYZED'
  | 'ANALYZED'
  | 'REVIEW REQUIRED'
  | 'FAILED';

export type AnalysisProcessingStage = 
  | 'IDLE'
  | 'Reading File'
  | 'Reading Pages'
  | 'Extracting Text'
  | 'Detecting Dimensions'
  | 'Detecting Grids'
  | 'Detecting Levels'
  | 'Detecting Elements'
  | 'Mapping Sources'
  | 'Validating'
  | 'Creating Review Items'
  | 'COMPLETED'
  | 'FAILED';

export type PageClassificationType = 
  | 'PLAN'
  | 'ELEVATION'
  | 'SECTION'
  | 'DETAIL'
  | 'SCHEDULE'
  | 'GENERAL'
  | 'SPECIFICATION'
  | 'COVER'
  | 'UNKNOWN';

export type DrawingDisciplineType = 
  | 'ARCHITECTURAL'
  | 'STRUCTURAL'
  | 'RCC'
  | 'REBAR'
  | 'STEEL'
  | 'ROOFING'
  | 'MECHANICAL'
  | 'ELECTRICAL'
  | 'PLUMBING'
  | 'FIRE FIGHTING'
  | 'ELV'
  | 'OTHER';

export type AnalysisConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export type ElementStatusType = 
  | 'DETECTED'
  | 'REVIEW REQUIRED'
  | 'USER CORRECTED'
  | 'CONFLICT'
  | 'VERIFIED';

export type MeasurementStatusType = 
  | 'EXTRACTED'
  | 'NORMALIZED'
  | 'VALIDATED'
  | 'OPEN ITEM'
  | 'CONFLICT'
  | 'USER CORRECTED'
  | 'VERIFIED';

export type SupportedAnalysisFormat = 
  | 'PDF'
  | 'PNG'
  | 'JPG'
  | 'JPEG'
  | 'WEBP'
  | 'DWG'
  | 'DXF'
  | 'IFC';

export interface BoundingRegion {
  x: number; // 0-100 percentage from left
  y: number; // 0-100 percentage from top
  width: number; // 0-100 percentage width
  height: number; // 0-100 percentage height
  page?: number;
}

export interface SourceLocationRef {
  sourceId: string;
  projectId: string;
  drawingId: string;
  drawingNumber: string;
  revision: string;
  pageNumber: number;
  region: BoundingRegion;
  snippetDescription?: string;
}

export interface ExtractedDrawingMetadata {
  drawingNumber: string;
  drawingTitle: string;
  revision: string;
  date: string;
  scale: string; // e.g. "1:100", "1:50", "SCALE NOT AVAILABLE"
  projectName: string;
  consultant: string;
  contractor: string;
  sheetNumber: string;
  discipline: DrawingDisciplineType;
  sourceConfidence: {
    drawingNumber: AnalysisConfidenceLevel;
    drawingTitle: AnalysisConfidenceLevel;
    revision: AnalysisConfidenceLevel;
    scale: AnalysisConfidenceLevel;
    discipline: AnalysisConfidenceLevel;
  };
}

export interface ExtractedTextItem {
  id: string;
  drawingId: string;
  pageNumber: number;
  originalText: string;
  normalizedText: string;
  region: BoundingRegion;
  confidence: AnalysisConfidenceLevel;
  category?: 'TITLE' | 'DIMENSION' | 'GRID' | 'LEVEL' | 'NOTE' | 'SCHEDULE' | 'MARK' | 'GENERAL';
}

export interface ExtractedDimensionItem {
  id: string;
  drawingId: string;
  pageNumber: number;
  originalText: string;
  numericValue: number;
  sourceUnit: 'mm' | 'm' | 'cm' | 'inch' | 'ft' | 'UNKNOWN';
  normalizedValueMeters: number;
  normalizedValueMm: number;
  targetUnit: string;
  isUnitAmbiguous: boolean;
  ambiguityReason?: string;
  region: BoundingRegion;
  confidence: AnalysisConfidenceLevel;
  status: MeasurementStatusType;
  associatedElementId?: string;
}

export interface ExtractedGridItem {
  id: string;
  drawingId: string;
  pageNumber: number;
  label: string; // e.g. "A", "B", "1", "2", "A1"
  axis: 'X' | 'Y' | 'ALIGNED' | 'CIRCULAR';
  position: string; // coordinate or relative location description
  region: BoundingRegion;
  confidence: AnalysisConfidenceLevel;
}

export interface ExtractedLevelItem {
  id: string;
  drawingId: string;
  pageNumber: number;
  name: string; // e.g. "Ground Floor", "First Floor", "Roof", "Foundation"
  elevationText: string; // e.g. "+0.000", "+3.600", "-1.500"
  elevationMeters: number;
  datumType?: 'FFL' | 'SSL' | 'TOS' | 'TOC' | 'GL' | 'NGL' | 'FGL' | 'Roof Level' | 'OTHER';
  exactNotation: string;
  region: BoundingRegion;
  confidence: AnalysisConfidenceLevel;
}

export interface ElementGeometryRecord {
  length?: number;
  width?: number;
  depth?: number;
  height?: number;
  thickness?: number;
  areaM2?: number;
  volumeM3?: number;
  diameterMm?: number;
  spacingMm?: number;
  count: number;
  unit: 'm' | 'mm' | 'm²' | 'm³' | 'Nos';
  source: SourceLocationRef;
}

export interface ExtractedElementRecord {
  id: string;
  projectId: string;
  drawingId: string;
  drawingNumber: string;
  pageNumber: number;
  elementType: 
    | 'Wall'
    | 'Door'
    | 'Window'
    | 'Column'
    | 'Beam'
    | 'Slab'
    | 'Footing'
    | 'Foundation'
    | 'Stair'
    | 'RCC Wall'
    | 'Steel Column'
    | 'Steel Beam'
    | 'Brace'
    | 'Rafter'
    | 'Purlin'
    | 'Cladding'
    | 'Skylight'
    | 'Pipe'
    | 'Duct'
    | 'Cable Tray'
    | 'Equipment'
    | 'Other';
  mark: string; // e.g. "C1", "B2", "S1", "F1", "W1", "D1", "P1"
  level: string; // e.g. "Ground Floor", "Level 02"
  gridLocation: string; // e.g. "Grid A-1", "Intersections B2, B3, C2, C3"
  instanceCount: number;
  instanceLocations: string[];
  
  // AI Extracted Geometry (Immutable baseline)
  aiExtractedGeometry: ElementGeometryRecord;
  
  // User Corrected Geometry (Human in the loop)
  userCorrectedGeometry?: ElementGeometryRecord;
  
  // Final Verified Geometry (Used for downstream takeoff)
  finalVerifiedGeometry?: ElementGeometryRecord;
  
  material: string; // e.g. "M30 Concrete", "Fe500 Rebar", "UB 457x191x67"
  specification?: string;
  
  // Cross-drawing Multi-Source references
  sourceReferences: SourceLocationRef[];
  linkedScheduleId?: string;
  
  confidence: AnalysisConfidenceLevel;
  status: ElementStatusType;
  
  // Traceability & Human Notes
  userNote?: string;
  userCorrectionTime?: string;
  verifiedBy?: string;
  verificationTime?: string;
  
  openItemIds: string[];
  conflictIds: string[];
}

export interface ExtractedScheduleRecord {
  id: string;
  drawingId: string;
  pageNumber: number;
  scheduleType: 
    | 'Column Schedule'
    | 'Beam Schedule'
    | 'Door Schedule'
    | 'Window Schedule'
    | 'Finish Schedule'
    | 'Steel Schedule'
    | 'Equipment Schedule'
    | 'Other Schedule';
  scheduleTitle: string;
  headers: string[];
  rows: Array<Record<string, string>>;
  region: BoundingRegion;
  confidence: AnalysisConfidenceLevel;
}

export interface AnalysisOpenItem {
  id: string;
  projectId: string;
  drawingId: string;
  drawingNumber: string;
  pageNumber: number;
  elementId?: string;
  category: 
    | 'MISSING_DIMENSION'
    | 'UNREADABLE_TEXT'
    | 'UNIT_AMBIGUITY'
    | 'MISSING_THICKNESS'
    | 'MISSING_HEIGHT'
    | 'MISSING_SPECIFICATION'
    | 'MISSING_REINFORCEMENT'
    | 'SCALE_UNAVAILABLE'
    | 'PARSER_REQUIRED'
    | 'OTHER';
  problem: string; // Concise statement of issue
  requiredInformation: string; // Exact clarification required
  suggestedAction?: string;
  region: BoundingRegion;
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'WAIVED';
  
  // Resolution details
  resolvedValue?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNote?: string;
  attachedHandSketchId?: string;
}

export interface AnalysisConflictRecord {
  id: string;
  projectId: string;
  elementId?: string;
  elementMark?: string;
  conflictType: 
    | 'PLAN_VS_SCHEDULE_DIMENSION'
    | 'SECTION_VS_PLAN_HEIGHT'
    | 'SCALE_VS_DIMENSION_MISMATCH'
    | 'CROSS_DRAWING_MATERIAL_MISMATCH'
    | 'REVISION_SUPERSEDED_MISMATCH';
  description: string;
  
  // Source A
  sourceA: SourceLocationRef;
  valueA: string;
  
  // Source B
  sourceB: SourceLocationRef;
  valueB: string;
  
  status: 'UNRESOLVED' | 'RESOLVED_USE_SOURCE_A' | 'RESOLVED_USE_SOURCE_B' | 'RESOLVED_CUSTOM_VALUE';
  resolutionDecision?: string;
  resolvedValue?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNote?: string;
}

export interface AnalysisAuditRecord {
  id: string;
  projectId: string;
  drawingId: string;
  timestamp: string;
  actor: 'AI_ENGINE' | 'HUMAN_ENGINEER' | 'SYSTEM';
  actionType: 
    | 'ANALYSIS_STARTED'
    | 'ANALYSIS_COMPLETED'
    | 'STAGE_TRANSITION'
    | 'VALUE_CORRECTED'
    | 'ELEMENT_VERIFIED'
    | 'OPEN_ITEM_CREATED'
    | 'OPEN_ITEM_RESOLVED'
    | 'CONFLICT_DETECTED'
    | 'CONFLICT_RESOLVED'
    | 'REVISION_CHECKED';
  targetEntity: 'ELEMENT' | 'DIMENSION' | 'OPEN_ITEM' | 'CONFLICT' | 'DRAWING';
  targetId: string;
  previousValue?: string;
  newValue?: string;
  note?: string;
}

export interface PageAnalysisRecord {
  pageId: string;
  drawingId: string;
  pageNumber: number;
  pageType: PageClassificationType;
  pageClassificationConfidence: AnalysisConfidenceLevel;
  discipline: DrawingDisciplineType;
  scaleDetected: string;
  isScaleCalibrated: boolean;
  textsCount: number;
  dimensionsCount: number;
  gridsCount: number;
  levelsCount: number;
  elementsCount: number;
  schedulesCount: number;
  analysisStatus: AnalysisProcessingStatus;
  statusMessage?: string;
  previewImageUrl?: string;
}

export interface DrawingAnalysisMasterRecord {
  id: string; // e.g. "ANL-DOC-2026-000001"
  projectId: string;
  documentId: string;
  drawingNumber: string;
  drawingTitle: string;
  revision: string;
  isCurrentRevision: boolean;
  fileFormat: SupportedAnalysisFormat;
  sourceFileName: string;
  analyzedAt?: string;
  lastUpdatedAt: string;
  
  // Processing Pipeline State
  status: AnalysisProcessingStatus;
  currentStage: AnalysisProcessingStage;
  stageLogs: Array<{ stage: AnalysisProcessingStage; timestamp: string; note?: string }>;
  failureReason?: string;
  failedStage?: AnalysisProcessingStage;
  isParserRequired: boolean;
  parserRequiredNote?: string;
  
  // Extracted Collections
  metadata: ExtractedDrawingMetadata;
  pages: PageAnalysisRecord[];
  texts: ExtractedTextItem[];
  dimensions: ExtractedDimensionItem[];
  grids: ExtractedGridItem[];
  levels: ExtractedLevelItem[];
  elements: ExtractedElementRecord[];
  schedules: ExtractedScheduleRecord[];
  openItems: AnalysisOpenItem[];
  conflicts: AnalysisConflictRecord[];
  auditTrail: AnalysisAuditRecord[];
  
  // Summary Aggregates
  summary: {
    pagesAnalyzed: number;
    dimensionsDetected: number;
    elementsDetected: number;
    openItemsCount: number;
    conflictsCount: number;
    verifiedCount: number;
    reviewRequiredCount: number;
  };
}
