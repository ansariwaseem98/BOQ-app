/**
 * Phase 17A: Real Drawing Intake & Processing Pipeline Types
 * Strict source traceability, format parsing, cross-drawing linking, and human verification
 */

import { BoundingBox, DrawingDiscipline } from './drawingIntelligence';

export type IntakeSupportedFormat = 
  | 'PDF'
  | 'DWG'
  | 'DXF'
  | 'IFC'
  | 'PNG'
  | 'JPG'
  | 'JPEG'
  | 'WEBP'
  | 'UNKNOWN';

export type IntakeDiscipline =
  | 'Architectural'
  | 'Structural'
  | 'RCC'
  | 'Rebar'
  | 'Steel'
  | 'Roofing'
  | 'Cladding'
  | 'MEP'
  | 'Electrical'
  | 'HVAC'
  | 'Plumbing'
  | 'Fire Fighting'
  | 'ELV'
  | 'Shop Drawing'
  | 'Fabrication'
  | 'IFC'
  | 'General'
  | 'Unknown';

export type DrawingProcessingStage =
  | 'UPLOADED'
  | 'READING'
  | 'CLASSIFYING'
  | 'OCR'
  | 'GEOMETRY_EXTRACTION'
  | 'ELEMENT_DETECTION'
  | 'SOURCE_MAPPING'
  | 'READY';

export type DrawingProcessingStatus =
  | 'UPLOADED'
  | 'PROCESSING'
  | 'PROCESSED'
  | 'PARTIALLY_PROCESSED'
  | 'REVIEW_REQUIRED'
  | 'FAILED'
  | 'SUPERSEDED';

export type PdfPageClassification =
  | 'PLAN'
  | 'ELEVATION'
  | 'SECTION'
  | 'DETAIL'
  | 'SCHEDULE'
  | 'SPECIFICATION'
  | 'GENERAL NOTE'
  | 'COVER'
  | 'UNKNOWN';

export interface ProcessedPdfPage {
  pageId: string; // e.g. "DWG-001-P01"
  pageNumber: number;
  classification: PdfPageClassification;
  confidence: number; // 0.0 - 1.0
  isMeasurableGeometry: boolean;
  hasSchedules: boolean;
  hasGeneralNotes: boolean;
  titleSnippet?: string;
  previewUrl?: string;
  detectedGridsCount: number;
  detectedDimensionsCount: number;
  detectedElementsCount: number;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matchingFileId?: string;
  matchingFileName?: string;
  matchingDrawingNumber?: string;
  reason: 'EXACT_HASH' | 'MATCHING_FILENAME_AND_REVISION' | 'SAME_DRAWING_NUMBER' | 'NONE';
  confidence: number;
  userDecision?: 'OVERWRITE' | 'KEEP_BOTH' | 'SKIP';
}

export interface CadLayerRecord {
  id: string;
  layerName: string;
  entityCount: number;
  disciplineGuess: IntakeDiscipline;
  visibility: boolean;
  isUsedForTakeoff: boolean;
  source: string; // File name or Drawing ID
  color?: string;
  lineType?: string;
}

export interface CadBlockRecord {
  id: string;
  blockName: string;
  count: number;
  layer: string;
  possibleMeaning: string; // e.g. "Column Marker", "Door Swing 900mm", "HVAC Diffuser 600x600"
  confidence: number;
  source: string;
  attributes?: Record<string, string>;
  isConstructionItem: boolean;
}

export interface CadDimensionRecord {
  id: string;
  dimensionText: string;
  normalizedValueMm: number;
  normalizedValueM: number;
  units: 'mm' | 'm' | 'cm' | 'inch' | 'ft';
  measuredGeometryLengthMm?: number;
  layer: string;
  location: string;
  source: string;
  pageNumber: number;
  confidence: number;
  boundingBox: BoundingBox;
}

export interface CadTextRecord {
  id: string;
  textType: 'ROOM_NAME' | 'GRID_NAME' | 'MEMBER_MARK' | 'DIMENSION' | 'SPECIFICATION' | 'EQUIPMENT_TAG' | 'DRAWING_NOTE';
  rawText: string;
  layer: string;
  location: string;
  pageNumber: number;
  source: string;
  boundingBox: BoundingBox;
  confidence: number;
}

export interface IfcElementRecord {
  id: string;
  ifcEntityId: string; // e.g. "#142857"
  ifcType: 'IfcWall' | 'IfcColumn' | 'IfcBeam' | 'IfcSlab' | 'IfcDoor' | 'IfcWindow' | 'IfcPipeSegment' | 'IfcDuctSegment' | 'IfcFooting' | 'IfcCovering' | 'IfcBuildingElementProxy' | string;
  name: string;
  levelName: string;
  material: string;
  dimensionsSummary: string;
  grossVolumeM3?: number;
  grossAreaM2?: number;
  lengthM?: number;
  widthM?: number;
  heightM?: number;
  source: string;
  confidence: number;
}

export interface OcrTextRegion {
  id: string;
  rawText: string;
  location: string;
  pageNumber: number;
  confidence: number;
  source: string;
  boundingBox: BoundingBox;
}

export interface NormalizedDimensionItem {
  id: string;
  rawText: string;
  normalizedMm: number;
  normalizedM: number;
  unit: 'mm' | 'm' | 'cm' | 'inch' | 'ft';
  confidence: number;
  source: string;
  pageNumber: number;
  boundingBox: BoundingBox;
  isUnreadable: boolean;
  unreadableReason?: string;
  openItemId?: string;
}

export interface HandSketchInterpretation {
  sketchId: string;
  originalFileName: string;
  originalDataUrl: string;
  aiInterpretationSummary: string;
  detectedDimensions: NormalizedDimensionItem[];
  detectedNotes: string[];
  confidence: number; // 0.0 - 1.0
  reviewStatus: 'REVIEW_REQUIRED' | 'USER_CORRECTED' | 'USER_VERIFIED';
  engineerNotes?: string;
}

export interface ProjectLevelRecord {
  levelId: string; // e.g. "LVL-FFL-01"
  levelName: string; // e.g. "Ground Floor FFL"
  rawNotation: string; // e.g. "FFL +0.000", "SSL -0.050", "TOS +4.200"
  elevationM: number;
  source: string;
  confidence: number;
  pageId?: string;
}

export interface ProjectGridRecord {
  gridId: string;
  gridName: string; // "A", "B", "1", "2"
  direction: 'X' | 'Y' | 'RADIAL' | 'ANGLED';
  rawNotation: string;
  source: string;
  confidence: number;
}

export interface MasterElementLink {
  masterElementId: string; // e.g. "COL-001"
  mark: string; // e.g. "C1"
  category: string; // "column", "beam", "footing", "wall", "slab"
  discipline: IntakeDiscipline;
  level: string;
  grid: string;
  dimensionsSummary: string;
  sources: {
    drawingId: string;
    drawingNumber: string;
    drawingTitle: string;
    drawingType: string;
    pageNumber: number;
    extractedDimension: string;
    boundingBox?: BoundingBox;
  }[];
  conflictDetected: boolean;
  conflictDescription?: string;
  status: 'VERIFIED' | 'REVIEW_REQUIRED' | 'CONFLICT';
}

export interface DrawingQualityIssue {
  id: string;
  drawingId: string;
  drawingNumber: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  issueType: 
    | 'LOW_RESOLUTION' 
    | 'MISSING_PAGES' 
    | 'CORRUPTED_FILE' 
    | 'UNREADABLE_TEXT' 
    | 'MISSING_SCALE' 
    | 'MISSING_DIMENSIONS' 
    | 'UNSUPPORTED_CAD_ENTITIES'
    | 'SCALE_MISMATCH';
  description: string;
  affectedPages: number[];
  recommendedAction: string;
}

export interface DrawingQualityReport {
  drawingId: string;
  drawingNumber: string;
  qualityScore: number; // 0 - 100
  overallQuality: 'EXCELLENT' | 'GOOD' | 'NEEDS_ATTENTION' | 'POOR';
  issues: DrawingQualityIssue[];
  resolutionSummary: string;
  hasScale: boolean;
  scaleRatio?: string;
  isVector: boolean;
}

export interface IntakeDrawingRecord {
  id: string;
  projectId: string;
  drawingNumber: string;
  title: string;
  discipline: IntakeDiscipline;
  fileName: string;
  fileType: IntakeSupportedFormat;
  fileSize: number;
  fileHash: string;
  revision: string;
  date: string;
  scale: string; // e.g. "1:100", "1:50", "UNSPECIFIED"
  scaleRatio?: number;
  consultant?: string;
  contractor?: string;
  sheetNumber?: string;
  status: DrawingProcessingStatus;
  processingStage: DrawingProcessingStage;
  processingProgress: number; // 0 - 100
  errorMessage?: string;
  possibleErrorCause?: string;
  isPartial: boolean;
  pages: ProcessedPdfPage[];
  pageCount: number;
  previewUrl?: string;
  isHandSketch: boolean;
  handSketchData?: HandSketchInterpretation;
  qualityReport?: DrawingQualityReport;
  
  // Registers
  cadLayers: CadLayerRecord[];
  cadBlocks: CadBlockRecord[];
  cadDimensions: CadDimensionRecord[];
  cadTexts: CadTextRecord[];
  ifcElements: IfcElementRecord[];
  ocrTexts: OcrTextRegion[];
  dimensions: NormalizedDimensionItem[];
  levels: ProjectLevelRecord[];
  grids: ProjectGridRecord[];
  
  // Storage & Audit
  uploadTimestamp: string;
  processingVersion: string;
  aiEngineVersion: string;
  extractionDate: string;
  userDisciplineOverride?: string;
  openItemsCount: number;
  conflictsCount: number;
  detectedElementsCount: number;
}

export interface DrawingProcessingReportSummary {
  projectId: string;
  timestamp: string;
  totalFiles: number;
  totalPdfPages: number;
  disciplinesBreakdown: Record<string, number>;
  totalDetectedElements: number;
  totalDetectedDimensions: number;
  totalOpenItems: number;
  totalConflicts: number;
  processingErrorsCount: number;
  isTakeoffReady: boolean;
  blockingReasons: string[];
}
