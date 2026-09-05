/**
 * AI BOQ & Tender Estimation Engineer - Master Type Definitions
 */

export type Discipline = 
  | 'Architectural' 
  | 'Structural' 
  | 'Civil' 
  | 'Steel' 
  | 'MEP' 
  | 'HVAC' 
  | 'Electrical' 
  | 'Plumbing' 
  | 'Fire Fighting' 
  | 'Shop Drawings' 
  | 'Fabrication Drawings' 
  | 'IFC/BIM' 
  | 'Hand Sketches' 
  | 'Schedules'
  | 'Specifications' 
  | 'Tender Documents' 
  | 'Other';

export type DrawingDiscipline = Discipline;
export type BoundingBox = DrawingBoundingBox;

export type FileFormat = 'PDF' | 'DWG' | 'DXF' | 'IFC' | 'Image' | 'Sketch' | 'DGN' | 'DOCX' | 'XLSX';

export type VerificationStatus = 
  | 'verified'          // Green: Human verified & locked
  | 'review_required'   // Yellow: Needs engineering review
  | 'open'              // Red: Missing / Unclear / Conflict
  | 'user_input'        // Blue: Manually entered by user
  | 'not_analyzed';     // Gray: Pending analysis

export type FieldVerificationStatus = 
  | 'EMPTY'
  | 'USER ENTERED'
  | 'AI EXTRACTED - NOT VERIFIED'
  | 'USER VERIFIED'
  | 'USER CORRECTED';

export interface FieldProvenance {
  status: FieldVerificationStatus;
  confidence?: number;
  sourceDocument?: string;
  extractedAt?: string;
  verifiedAt?: string;
  notes?: string;
}

export interface ProjectDataProvenance {
  [fieldKey: string]: FieldProvenance;
}

export type MeasurementStandard = 'POMI' | 'CESMM4' | 'IS1200' | 'NRM2' | 'SMM7' | 'Custom';
export type ConcreteGrade = 'M15' | 'M20' | 'M25' | 'M30' | 'M35' | 'M40' | 'C25/30' | 'C30/37' | 'C35/45' | 'C40/50';
export type SteelRebarGrade = 'Fe415' | 'Fe500' | 'Fe500D' | 'Fe550' | 'Grade 60' | 'Grade 500B';
export type StructuralSteelGrade = 'S275' | 'S355' | 'A36' | 'A992' | 'A572 Gr50';

export interface ConsultantEntry {
  id: string;
  name: string;
  role: string; // e.g. 'Lead Consultant', 'Architect', 'Structural Consultant', 'MEP Consultant', 'Quantity Surveyor', 'Geotechnical', 'Other'
  address?: string;
  city?: string;
  country?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
}

export interface CompanyInfo {
  name: string; // Required *
  logoUrl?: string;
  licenseNumber?: string;
  address?: string;
  city?: string;
  country?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface ClientInfo {
  name: string; // Required *
  companyName?: string;
  address?: string;
  city?: string;
  country?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
}

export interface ConsultantInfo {
  leadConsultant?: string;
  architect?: string;
  structuralConsultant?: string;
  mepConsultant?: string;
  otherConsultant?: string;
  address?: string;
  city?: string;
  country?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
}

export type ProjectTypeOption = 
  | 'RCC Building'
  | 'Steel Structure'
  | 'Industrial'
  | 'Commercial'
  | 'Residential'
  | 'School'
  | 'Hospital'
  | 'Warehouse'
  | 'Mixed RCC + Steel'
  | 'Turnkey / Lock & Key'
  | 'Other';

export type ContractTypeOption = 
  | 'Lump Sum'
  | 'BOQ'
  | 'Unit Rate'
  | 'Design & Build'
  | 'Turnkey'
  | 'Other';

export type ScopeOption = 
  | 'Civil'
  | 'Structural'
  | 'Architectural'
  | 'MEP'
  | 'Steel'
  | 'Roofing'
  | 'Cladding'
  | 'Complete Turnkey'
  | 'Other';

export interface ProjectMeta {
  id: string;
  name: string; // Required *
  projectNumber: string;
  location: string; // Required *
  city?: string;
  country?: string;
  projectType: ProjectTypeOption | string;
  buildingType?: string;
  numberOfFloors?: number;
  basementFloors?: number;
  groundFloor?: boolean | string;
  upperFloors?: number;
  roofLevel?: string;
  builtUpAreaM2?: number; // Approximate Built-up Area
  siteAreaM2?: number; // Site Area
  description?: string;
  floorLevels?: string[];
  typicalFloors?: { name: string; floors: string[]; multiplier: number }[];
  tenderReference?: string;
  tenderIssueDate?: string;
  tenderSubmissionDeadline?: string;
}

export interface TenderInfo {
  tenderName?: string;
  tenderNumber?: string;
  tenderReference?: string;
  tenderIssueDate?: string;
  tenderSubmissionDeadline?: string;
  tenderValidity?: string; // e.g. "90 Days"
  contractType?: ContractTypeOption;
  scope: ScopeOption[];
  currency: string; // e.g. AED, USD, EUR, GBP, INR, SAR, QAR, OMR, KWD (User selected, no auto-default)
  currencySymbol: string;
}

export interface EngineeringSettings {
  unitSystem: 'Metric' | 'Imperial';
  lengthUnit: 'mm' | 'cm' | 'm' | 'ft' | 'inch';
  areaUnit: 'm²' | 'ft²';
  volumeUnit: 'm³' | 'ft³';
  weightUnit: 'kg' | 'ton' | 'lb';
  applicableCodes: string[]; // e.g. ['ACI', 'BS', 'Eurocode', 'ASTM', 'IS', 'IBC', 'Project Specific'] - Multi-selectable
  customCodes?: string;
  measurementMethodology?: MeasurementStandard;
}

export interface ContractTerms {
  contractType: 'Lump Sum Fixed Price' | 'Item Rate (BOQ)' | 'Design & Build' | 'Cost Plus' | 'GMP' | ContractTypeOption;
  scopeOfWork: string;
  currency: 'USD' | 'AED' | 'SAR' | 'QAR' | 'INR' | 'EUR' | 'GBP' | string;
  currencySymbol: string;
  measurementUnits: 'Metric' | 'Imperial';
  applicableCodes: string;
  applicableSpecifications: string;
  measurementMethodology: MeasurementStandard;
  tenderValidityDays: number;
  completionPeriodMonths: number;
  retentionPercentage: number;
  advancePaymentPercentage: number;
  defaultWastagePercentage: number;
  defaultOverheadPercentage: number;
  defaultProfitPercentage: number;
}

export interface ProjectRecord {
  id: string; // System-generated e.g. "PRJ-2026-0001"
  projectNumber?: string;
  company: CompanyInfo;
  client: ClientInfo;
  consultant: ConsultantInfo;
  consultants: ConsultantEntry[];
  project: ProjectMeta;
  tender: TenderInfo;
  engineeringSettings: EngineeringSettings;
  projectNotes: string;
  contract?: ContractTerms;
  provenance?: ProjectDataProvenance;
  status: 'Active' | 'Archived';
  isTestProject?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ProjectData = ProjectRecord;

export interface DrawingBoundingBox {
  x: number; // 0 to 100 percentage
  y: number; // 0 to 100 percentage
  width: number;
  height: number;
  label?: string;
  color?: string;
}

export interface DrawingAnnotation {
  id: string;
  type: 'box' | 'arrow' | 'cloud' | 'text' | 'measure';
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  color: string;
  createdAt: string;
}

export type DocumentTypeOption = 
  | 'Architectural'
  | 'Structural'
  | 'RCC'
  | 'Rebar'
  | 'Structural Steel'
  | 'Shop Drawing'
  | 'IFC'
  | 'IFC / BIM'
  | 'MEP'
  | 'Electrical'
  | 'Mechanical'
  | 'Plumbing'
  | 'Fire Fighting'
  | 'Roofing'
  | 'Cladding'
  | 'Landscape'
  | 'Civil'
  | 'Survey'
  | 'Tender Drawing'
  | 'Construction Drawing'
  | 'Fabrication Drawing'
  | 'As-Built Drawing'
  | 'Consultant Drawing'
  | 'Specification'
  | 'Schedule'
  | 'Hand Sketch'
  | 'Markup'
  | 'Other';

export type DocumentDisciplineOption = 
  | 'Architectural'
  | 'Structural'
  | 'Civil'
  | 'Steel'
  | 'HVAC'
  | 'Electrical'
  | 'Plumbing'
  | 'Fire Fighting'
  | 'MEP'
  | 'Roofing'
  | 'Cladding'
  | 'General'
  | 'Other';

export type DocumentStatus = 
  | 'SELECTED'
  | 'UPLOADING'
  | 'UPLOADED'
  | 'PROCESSING'
  | 'READY'
  | 'PROCESSED'
  | 'PARSER_REQUIRED'
  | 'FAILED'
  | 'REVIEW REQUIRED'
  | 'REVIEW_REQUIRED'
  | 'PROCESSING_ERROR'
  | 'SUPERSEDED'
  | 'ARCHIVED';

export type DocumentAnalysisStatus = 
  | 'NOT_ANALYZED'
  | 'ANALYZED'
  | 'REQUIRES_REVIEW'
  | 'PARTIALLY_ANALYZED'
  | 'ANALYZING'
  | 'FAILED';

export interface ProjectDocument {
  id: string; // e.g. "DOC-2026-000001"
  projectId: string; // Strictly linked to parent project
  drawingSeriesId: string; // Groups revisions e.g. "S-203", "A-101", "SK-01"
  drawingNumber: string; // Drawing sheet number (blank if not assigned, never auto-invented)
  title: string; // Sheet title (blank if not assigned, never auto-invented)
  description?: string;
  documentType: DocumentTypeOption;
  discipline: DocumentDisciplineOption;
  revision: string; // e.g. "00", "01", "Rev 02"
  isCurrentRevision: boolean; // Indicates if this is the active current revision
  drawingDate: string; // YYYY-MM-DD
  level: string; // e.g. "Foundation", "Ground Floor", "Level 02", "Roof", "All Floors"
  status: DocumentStatus;
  analysisStatus: DocumentAnalysisStatus;
  preparedBy?: string;
  checkedBy?: string;
  approvedBy?: string;
  source?: string;
  notes?: string;
  
  // File storage metadata
  sourceFileName: string;
  fileExtension: string; // "pdf", "dwg", "dxf", "ifc", "jpg", "png", "tiff", etc.
  fileFormat: 'PDF' | 'DWG' | 'DXF' | 'IFC' | 'Image' | 'Sketch' | 'Other';
  fileSize: number;
  uploadDate: string;
  fileHash?: string; // SHA-256 checksum for duplicate detection
  storageReference?: string; // Reference to persistent IndexedDB record
  selectedTime?: string;
  pageCount?: number;
  imageDimensions?: { width: number; height: number };
  cadFormat?: string;
  ifcMetadata?: {
    schema?: string;
    projectName?: string;
    site?: string;
    building?: string;
    storeys?: string[];
    elementCount?: number;
  };
  previewDataUrl?: string;
  previewType?: 'pdf' | 'image' | 'cad' | 'ifc' | 'unsupported';
  isVector?: boolean;
  scaleRatio?: string;
  uploadedBy?: string;
  version?: number;
  sheetNumber?: string;
  revisionDate?: string;
  revisionDescription?: string;
  notesList?: Array<{ id: string; user: string; timestamp: string; note: string }>;
  annotations?: DrawingAnnotation[];
  cadLayers?: Array<{ name: string; visible: boolean; entityCount: number; color?: string }>;
  scaleInfo?: {
    value: string;
    confidence?: string;
    calibrated?: boolean;
    calibrationData?: {
      p1: { x: number; y: number };
      p2: { x: number; y: number };
      distance: number;
      unit: string;
    };
  };
  linkedElementIds?: string[];
  linkedBoqIds?: string[];
  linkedCalculationIds?: string[];
  linkedBimIds?: string[];
  calibrationScale?: number;
  detectedElementsCount: number;
  openItemsCount: number;
  isArchived: boolean;
  linkedEntityId?: string; // e.g. future link to OpenItem, Element, Calculation
}

export interface DrawingRecord {
  id: string;
  projectId?: string;
  drawingSeriesId?: string;
  isCurrentRevision?: boolean;
  drawingNumber: string;
  title: string;
  discipline: Discipline;
  type: 'Plan' | 'Section' | 'Elevation' | 'Detail' | 'Schedule' | 'General Notes' | 'BIM/IFC';
  format: FileFormat;
  revision: string;
  date: string;
  level: string; // e.g. "Foundation", "Typical Floor (L02-L08)"
  status: 'Current' | 'Superseded' | 'Under Review';
  sourceFileName: string;
  fileSize: number;
  isVector: boolean;
  scaleRatio?: string; // e.g. "1:100"
  calibrationScale?: number; // pixels per meter
  thumbnailSvg?: string;
  previewDataUrl?: string;
  detectedElementsCount: number;
  openItemsCount: number;
  analysisStatus: 'completed' | 'processing' | 'pending' | 'error';
  cadLayers?: string[];
  notes?: string;
  isArchived?: boolean;
}

export interface DeductionItem {
  id: string;
  type: 'door' | 'window' | 'opening' | 'beam_intersection' | 'column_intersection' | 'cutout';
  referenceId?: string;
  name: string;
  length: number;
  width: number;
  depth?: number;
  count: number;
  areaM2?: number;
  volumeM3?: number;
  reason: string;
  isDeductible: boolean; // Based on IS1200 / POMI threshold rule (e.g. openings < 0.1 m2 or 0.5 m2 not deducted)
}

export interface CalculationAuditStep {
  stepNumber: number;
  label: string;
  expression: string;
  subtotal: number;
  unit: string;
}

export interface CalculationRecord {
  formula: string;
  expressionWithValues: string;
  grossQuantity: number;
  deductionsTotal: number;
  netQuantity: number;
  unit: string;
  auditSteps: CalculationAuditStep[];
  formworkAreaM2?: number;
  formworkFormula?: string;
  lastCalculatedAt: string;
}

export interface DetectedElement {
  id: string;
  name: string;
  category: 
    | 'earthwork'
    | 'pcc'
    | 'footing'
    | 'column'
    | 'beam'
    | 'slab'
    | 'staircase'
    | 'shear_wall'
    | 'masonry_wall'
    | 'dpc'
    | 'plaster'
    | 'flooring'
    | 'painting'
    | 'door'
    | 'window'
    | 'steel_column'
    | 'steel_rafter'
    | 'purlin'
    | 'roof_cladding'
    | 'hvac_duct'
    | 'pipe'
    | 'cable_tray'
    | 'fire_sprinkler';
  discipline: Discipline;
  level: string;
  gridLocation: string; // e.g. "Grid B-3", "Axis 2-4"
  drawingId: string;
  drawingNumber: string;
  drawingRevision: string;
  
  // Dimensional inputs (editable by engineer)
  dimensions: {
    length: number;
    width: number;
    depthOrThickness: number;
    height?: number;
    diameterMm?: number;
    spacingMm?: number;
    pitchDegrees?: number;
    count: number;
    unit: string;
  };
  
  // Deductions
  deductions: DeductionItem[];
  
  // Specifications
  specification: {
    concreteGrade?: ConcreteGrade;
    rebarGrade?: SteelRebarGrade;
    steelSection?: string; // e.g. "UB 457x191x67"
    wallType?: string;     // e.g. "200mm AAC Blockwork"
    finishSpec?: string;   // e.g. "15mm Cement Plaster 1:4"
    coatingSpec?: string;
    insulationThicknessMm?: number;
  };
  
  // Calculation result
  calculation: CalculationRecord;
  
  // Confidence & Verification Status
  confidence: number; // 0.0 to 1.0
  status: VerificationStatus;
  userOverrideNote?: string;
  approvedBy?: string;
  approvedAt?: string;
  
  // Canvas coordinate anchor
  boundingBox?: DrawingBoundingBox;
  
  // Linked BOQ / BBS References
  linkedBoqItemIds: string[];
  linkedBbsMarks: string[];
}

export type BarShapeCode = 
  | '00' // Straight bar
  | '11' // L-Bar / Single 90 bend
  | '21' // U-Bar / Double bend
  | '31' // Cranked bar (slab/beam)
  | '41' // Stirrup / Link (Rectangle)
  | '51' // Column Link / Tie with 135 hooks
  | '61' // Circular / Spiral
  | '71' // Chair bar
  | '99'; // Custom / Variable

export interface BbsBarRecord {
  id: string;
  barMark: string; // e.g. "C1-T1", "B1-B1"
  memberId: string; // e.g. "COL-C1"
  memberName: string; // e.g. "Column C1 Ground Floor"
  level: string;
  diameterMm: 8 | 10 | 12 | 16 | 20 | 25 | 32 | 40;
  rebarGrade: SteelRebarGrade;
  shapeCode: BarShapeCode;
  shapeDescription: string;
  
  // Parameter dimensions in mm
  aMm: number;
  bMm?: number;
  cMm?: number;
  dMm?: number;
  eMm?: number;
  hookLengthMm?: number;
  lapLengthMm?: number;
  bendDeductionMm?: number; // e.g. 2d for 90 deg, 4d for 135 deg
  
  spacingMm?: number;
  memberCount: number;
  barsPerMember: number;
  totalBars: number;
  
  cuttingLengthM: number;
  cuttingFormula: string;
  totalLengthM: number;
  unitWeightKgM: number; // d^2 / 162.2
  totalWeightKg: number;
  
  drawingReference: string;
  drawingId: string;
  status: VerificationStatus;
}

export interface RateBreakdown {
  materialCost: number;
  laborCost: number;
  plantCost: number;
  subcontractCost: number;
  wastagePercent: number;
  wastageAmount: number;
  primeCost: number;
  overheadPercent: number;
  overheadAmount: number;
  profitPercent: number;
  profitAmount: number;
  unitRate: number;
}

export interface BoqItem {
  id: string;
  itemNumber: string; // e.g. "04.02.01"
  sectionCode: string; // e.g. "04 Concrete Works"
  description: string;
  unit: 'm³' | 'm²' | 'm' | 'kg' | 'Ton' | 'Nr' | 'Item' | 'Sum' | 'Lm';
  quantity: number;
  rateBreakdown: RateBreakdown;
  unitRate: number;
  totalAmount: number;
  
  // Traceability links
  drawingReferences: string[];
  specificationReference: string;
  contributingElementIds: string[];
  remarks: string;
  status: VerificationStatus;
  isCustomItem: boolean;
}

export interface OpenItem {
  id: string; // e.g. "OI-001"
  category: 
    | 'missing_dimension'
    | 'unclear_handwriting'
    | 'drawing_conflict'
    | 'revision_mismatch'
    | 'unspecified_grade'
    | 'missing_reinforcement'
    | 'low_confidence'
    | 'geometric_anomaly';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  requiredInformation: string;
  suggestedAction: string;
  
  // Drawing anchor
  drawingId: string;
  drawingNumber: string;
  drawingRevision: string;
  drawingTitle: string;
  locationDescription: string;
  boundingBox?: DrawingBoundingBox;
  
  // Status & Resolution
  status: 'open' | 'under_review' | 'resolved' | 'rejected';
  currentInterpretation?: string;
  userResponseValue?: string;
  userResponseNote?: string;
  attachedSketchUrl?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  affectedElementIds: string[];
  affectedBoqItemIds: string[];
}

export interface DrawingConflict {
  id: string;
  title: string;
  elementName: string;
  category: 'dimension' | 'specification' | 'geometry' | 'level';
  
  sourceA: {
    drawingNumber: string;
    revision: string;
    date: string;
    value: string;
    description: string;
    drawingId: string;
  };
  
  sourceB: {
    drawingNumber: string;
    revision: string;
    date: string;
    value: string;
    description: string;
    drawingId: string;
  };
  
  resolution: 'use_source_a' | 'use_source_b' | 'custom_value' | 'pending';
  customValue?: string;
  decisionNote?: string;
  decidedBy?: string;
  decidedAt?: string;
}

export interface AssumptionRecord {
  id: string;
  title: string;
  assumptionText: string;
  category: 'Structural' | 'Architectural' | 'MEP' | 'Commercial' | 'Methodology';
  approvedByUser: string;
  approvedDate: string;
  justification: string;
  affectedScope: string;
  status: 'Approved' | 'Superseded';
}

export interface RevisionComparison {
  id: string;
  drawingNumber: string;
  oldRevision: string;
  newRevision: string;
  comparedAt: string;
  changesSummary: string;
  elementsModified: {
    elementId: string;
    name: string;
    oldDimension: string;
    newDimension: string;
    quantityDelta: number;
    unit: string;
    costImpact: number;
  }[];
  elementsAdded: string[];
  elementsRemoved: string[];
  totalCostImpact: number;
  status: 'pending_review' | 'approved' | 'rejected';
}

export interface ValidationIssue {
  id: string;
  ruleCode: string;
  severity: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  elementId?: string;
  drawingNumber?: string;
  suggestedCorrection: string;
}

// ==========================================
// PHASE 3 — DRAWING INTELLIGENCE ENGINE TYPES
// ==========================================

export type DrawingClassificationType =
  | 'Architectural Plan'
  | 'Architectural Elevation'
  | 'Architectural Section'
  | 'Architectural Detail'
  | 'Structural General Arrangement'
  | 'Structural Foundation Plan'
  | 'Structural Column Layout'
  | 'Structural Beam Layout'
  | 'Structural Slab Layout'
  | 'Structural Section'
  | 'Structural Detail'
  | 'Reinforcement Detail'
  | 'Steel General Arrangement'
  | 'Steel Fabrication Drawing'
  | 'Steel Erection Drawing'
  | 'Steel Connection Detail'
  | 'Roof Plan'
  | 'Roof Framing'
  | 'Purlin Layout'
  | 'Cladding Drawing'
  | 'MEP HVAC'
  | 'MEP Electrical'
  | 'MEP Plumbing'
  | 'MEP Fire Fighting'
  | 'MEP Coordination'
  | 'Site Plan'
  | 'Schedule'
  | 'Specification'
  | 'Other';

export type ClassificationStatus = 'AI SUGGESTED' | 'USER CONFIRMED';

export type ConfidenceTier = 'HIGH' | 'MEDIUM' | 'LOW';

export type IntelligenceVerificationStatus =
  | 'AI EXTRACTED — NOT VERIFIED'
  | 'HIGH CONFIDENCE — REVIEW'
  | 'REQUIRES REVIEW'
  | 'USER VERIFIED'
  | 'USER CORRECTED'
  | 'REJECTED';

export type ExtractionMethod = 
  | 'Native CAD Vector'
  | 'IFC Structured BIM'
  | 'PDF Vector Text Stream'
  | 'Computer Vision & OCR'
  | 'Manual User Markup';

export interface TitleBlockData {
  drawingNumber?: string;
  title?: string;
  revision?: string;
  date?: string;
  scale?: string;
  preparedBy?: string;
  checkedBy?: string;
  approvedBy?: string;
  projectName?: string;
  consultant?: string;
  client?: string;
  sheetNumber?: string;
  rawTitleBlockText?: string;
  confidence: number;
  conflictsDetected: string[];
}

export interface ExtractedDimension {
  id: string;
  projectId: string;
  documentId: string;
  revisionId: string;
  pageNumber: number;
  rawText: string;
  numericValue: number;
  normalizedValue: number; // in standard engineering units (e.g. mm or m)
  unit: string; // "mm", "m", "cm", "in", "ft", "deg"
  dimensionType: 
    | 'Length'
    | 'Width'
    | 'Height'
    | 'Thickness'
    | 'Depth'
    | 'Spacing'
    | 'Diameter'
    | 'Radius'
    | 'Level'
    | 'Slope'
    | 'Opening'
    | 'Offset';
  sourceLocation: string; // e.g. "Grid B/4 - Column C12"
  boundingBox: DrawingBoundingBox;
  confidence: number; // 0-100
  confidenceTier: ConfidenceTier;
  extractionMethod: ExtractionMethod;
  status: IntelligenceVerificationStatus;
  originalAiValue?: {
    numericValue: number;
    unit: string;
    dimensionType: string;
  };
  userCorrectedValue?: {
    numericValue: number;
    unit: string;
    dimensionType: string;
  };
  correctionTimestamp?: string;
  correctionUser?: string;
  correctionReason?: string;
}

export interface ExtractedLevel {
  id: string;
  projectId: string;
  documentId: string;
  revisionId: string;
  pageNumber: number;
  name: string; // e.g. "FFL +3.600", "SSL +3.450", "TOS +3.600", "Foundation Level", "Ground Level", "Roof Level", "Parapet Level", "DPC Level"
  rawText: string;
  elevationMeters: number; // e.g. 3.600
  levelType: 'FFL' | 'SSL' | 'TOS' | 'TOB' | 'TOW' | 'GL' | 'FL' | 'Roof' | 'Parapet' | 'DPC' | 'Other';
  sourceLocation: string;
  boundingBox?: DrawingBoundingBox;
  confidence: number;
  status: IntelligenceVerificationStatus;
}

export interface ExtractedGrid {
  id: string;
  projectId: string;
  documentId: string;
  revisionId: string;
  pageNumber: number;
  label: string; // "A", "B", "1", "4", "A/1", "B/4"
  axis: 'X' | 'Y' | 'Intersection';
  coordPercent?: { x: number; y: number };
  boundingBox?: DrawingBoundingBox;
  confidence: number;
}

export interface ExtractedElementItem {
  id: string;
  projectId: string;
  elementId: string; // e.g. "COL-C12", "BM-B101", "SL-S1", "FTG-F1", "W-01", "DR-D01"
  type: 
    | 'Column'
    | 'Beam'
    | 'Slab'
    | 'Wall'
    | 'Shear Wall'
    | 'Footing'
    | 'Raft'
    | 'Pile Cap'
    | 'Ground Beam'
    | 'Pedestal'
    | 'Retaining Wall'
    | 'Stair'
    | 'Door'
    | 'Window'
    | 'Room'
    | 'Opening'
    | 'Shaft'
    | 'Ceiling'
    | 'Parapet'
    | 'Steel Column'
    | 'Steel Rafter'
    | 'Bracing'
    | 'Purlin'
    | 'Girt'
    | 'Base Plate'
    | 'Connection Plate'
    | 'Duct'
    | 'Pipe'
    | 'Cable Tray'
    | 'Equipment'
    | 'Lighting'
    | 'DB'
    | 'Pump'
    | 'DPC';
  discipline: Discipline;
  mark: string; // e.g. "C12", "B101", "F1", "D-01"
  level: string; // e.g. "Ground Floor", "Level 02", "Foundation"
  gridLocation: string; // e.g. "Grid B/4"
  geometry: {
    length?: number;
    width?: number;
    thicknessOrDepth?: number;
    height?: number;
    diameterMm?: number;
    unit: string;
  };
  rawDimensionsText: string; // e.g. "500 x 500", "200 THK", "2100 x 900"
  material?: string; // e.g. "C30/37 Concrete", "200mm AAC Blockwork", "UB 457x191x67"
  reinforcementNotation?: string; // e.g. "8Y20, T10@150"
  dpcInfo?: {
    elevation?: string;
    thicknessMm?: number;
    widthMm?: number;
  };
  sourceLocation: string;
  documentId: string;
  drawingNumber: string;
  revision: string;
  pageNumber: number;
  boundingBox: DrawingBoundingBox;
  confidence: number;
  confidenceTier: ConfidenceTier;
  extractionMethod: ExtractionMethod;
  status: IntelligenceVerificationStatus;
  rawText: string;
  candidateRules?: string[];
  originalAiValue?: any;
  userCorrectedValue?: any;
  correctionReason?: string;
  correctionTimestamp?: string;
}

export interface ExtractedReinforcementItem {
  id: string;
  projectId: string;
  documentId: string;
  revisionId: string;
  pageNumber: number;
  member: string; // e.g. "Column C12", "Beam B101", "Footing F1"
  barMark?: string; // e.g. "T1", "B1", "MK-01"
  barDiameterMm: number; // e.g. 16, 20, 12, 8
  spacingMm?: number; // e.g. 150
  quantity?: number; // e.g. 4, 8
  steelType: 'T' | 'Y' | 'R' | 'Fe500' | 'Fe415' | 'Other';
  direction?: 'X' | 'Y' | 'Both' | 'Main' | 'Distribution';
  position?: 'Top' | 'Bottom' | 'Both' | 'Stirrup' | 'Link' | 'Side' | 'Main';
  layer?: string;
  concreteGrade?: string; // e.g. "C30/37", "M25"
  coverMm?: number; // e.g. 40, 50
  lapLengthMm?: number;
  anchorageLengthMm?: number;
  rawNotation: string; // e.g. "T16 @ 150 c/c", "4T20", "8Y16", "R8 @ 200"
  sourceLocation: string;
  boundingBox?: DrawingBoundingBox;
  confidence: number;
  status: IntelligenceVerificationStatus;
}

export interface ExtractedSteelItem {
  id: string;
  projectId: string;
  documentId: string;
  revisionId: string;
  pageNumber: number;
  element: string; // "Column", "Rafter", "Beam", "Bracing", "Purlin", "Girt", "Base Plate", "Handrail"
  mark?: string;
  rawSectionText: string; // e.g. "UB 457x191x67", "UC 203x203x46", "IPE 300", "HEA 200", "RHS 150x100x6", "SHS 100x100x5", "L 100x100x10"
  sectionType: 'UB' | 'UC' | 'IPE' | 'HEA' | 'HEB' | 'RHS' | 'SHS' | 'CHS' | 'Angle' | 'Channel' | 'Plate' | 'Other';
  lengthMm?: number;
  steelGrade?: string; // e.g. "S275", "S355", "A36"
  sourceLocation: string;
  boundingBox?: DrawingBoundingBox;
  confidence: number;
  status: IntelligenceVerificationStatus;
}

export interface ExtractedRoofItem {
  id: string;
  projectId: string;
  documentId: string;
  revisionId: string;
  pageNumber: number;
  itemType: 'Roof Slope' | 'Rafter' | 'Purlin' | 'Skylight Purlin' | 'Roof Sheet' | 'Cladding' | 'Ridge' | 'Valley' | 'Gutter' | 'Flashing' | 'Insulation' | 'Skylight';
  slopeDegrees?: number;
  slopeRatio?: string; // e.g. "1:10", "1:5", "10 deg"
  insulationThicknessMm?: number;
  sheetSpec?: string;
  rawText: string;
  sourceLocation: string;
  boundingBox?: DrawingBoundingBox;
  confidence: number;
  status: IntelligenceVerificationStatus;
}

export interface ExtractedMepItem {
  id: string;
  projectId: string;
  documentId: string;
  revisionId: string;
  pageNumber: number;
  system: 'HVAC' | 'Plumbing' | 'Electrical' | 'Fire Fighting' | 'Drainage' | 'Other';
  elementType: 'Duct' | 'Pipe' | 'Cable Tray' | 'Conduit' | 'Equipment' | 'Valve' | 'Sprinkler' | 'Diffuser' | 'Lighting' | 'DB' | 'Pump' | 'Sanitary';
  sizeSpecification?: string; // e.g. "600x300 Duct", "DN100 CHW Pipe", "300mm Tray"
  mark?: string;
  dimensionLengthMm?: number;
  location: string;
  sourceLocation: string;
  boundingBox?: DrawingBoundingBox;
  confidence: number;
  status: IntelligenceVerificationStatus;
}

export interface ExtractedCandidateRule {
  id: string;
  projectId: string;
  documentId: string;
  pageNumber: number;
  rawNote: string; // e.g. "All walls 200mm thick unless noted otherwise."
  extractedRule: string; // "Default Wall Thickness = 200mm"
  targetCategory: string; // "Masonry Walls"
  scope: 'Drawing' | 'Floor Level' | 'Global Project';
  confidence: number;
  status: 'CANDIDATE_RULE' | 'CONFIRMED_BY_USER' | 'REJECTED';
  confirmedByUser?: string;
  confirmedAt?: string;
  boundingBox?: DrawingBoundingBox;
}

export interface IntelligenceOpenItem {
  id: string; // e.g. "OI-0001"
  projectId: string;
  documentId: string;
  revisionId: string;
  pageNumber: number;
  category: 
    | 'unreadable_dimension'
    | 'missing_dimension'
    | 'missing_level'
    | 'unclear_handwriting'
    | 'ambiguous_notation'
    | 'low_confidence'
    | 'conflicting_information'
    | 'unknown_units'
    | 'unknown_scale'
    | 'missing_wall_thickness'
    | 'missing_slab_thickness'
    | 'missing_reinforcement'
    | 'unclear_element_identification';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  currentInterpretation?: string;
  detectedText?: string; // e.g. "1?50"
  requiredInformation: string;
  questionToUser: string;
  sourceLocation: string; // e.g. "Grid B/4"
  drawingNumber: string;
  drawingTitle: string;
  boundingBox?: DrawingBoundingBox;
  status: 'open' | 'under_review' | 'resolved' | 'rejected';
  userResponse?: {
    enteredValue?: string;
    unit?: string;
    elementOverride?: string;
    notes?: string;
    attachedSketchDataUrl?: string;
    attachedSupportingDocId?: string;
    resolvedBy?: string;
    resolvedAt?: string;
  };
  createdAt: string;
  resolvedAt?: string;
}

export interface IntelligenceConflict {
  id: string; // e.g. "CNF-001"
  projectId: string;
  title: string;
  elementName: string;
  category: 'dimension' | 'specification' | 'geometry' | 'level' | 'title_block_mismatch';
  sourceA: {
    drawingNumber: string;
    revision: string;
    date: string;
    value: string;
    description: string;
    drawingId: string;
    pageNumber?: number;
    location?: string;
  };
  sourceB: {
    drawingNumber: string;
    revision: string;
    date: string;
    value: string;
    description: string;
    drawingId: string;
    pageNumber?: number;
    location?: string;
  };
  status: 'open' | 'resolved';
  resolution?: 'use_source_a' | 'use_source_b' | 'custom_value';
  customValue?: string;
  decisionNote?: string;
  decidedBy?: string;
  decidedAt?: string;
  createdAt: string;
}

export interface AnalysisRunLog {
  analysisId: string; // e.g. "ANL-2026-0001"
  projectId: string;
  documentId: string;
  revisionId: string;
  startedAt: string;
  completedAt: string;
  mode: 'PAGE' | 'DOCUMENT' | 'SELECTION';
  pagesAnalyzed: number[];
  selectedArea?: DrawingBoundingBox;
  classification: DrawingClassificationType;
  classificationConfidence: number;
  classificationStatus: ClassificationStatus;
  scaleDetected?: string;
  elementsDetectedCount: number;
  dimensionsCount: number;
  levelsCount: number;
  reinforcementCount: number;
  steelCount: number;
  mepCount: number;
  openItemsCount: number;
  conflictsCount: number;
  requiresReviewCount: number;
  verifiedCount: number;
  status: 'COMPLETED' | 'FAILED' | 'REQUIRES_REVIEW';
  engineVersion: string;
  warnings: string[];
  errors: string[];
}

export interface AnalysisDrawingQueueItem {
  documentId: string;
  drawingNumber: string;
  title: string;
  discipline: Discipline;
  disciplineOrder: number; // 1 to 9 (01 Site, 02 Arch, 03 Struct, etc.)
  revision: string;
  pageCount: number;
  status: 'WAITING' | 'ANALYZING' | 'COMPLETE' | 'REQUIRES_REVIEW' | 'FAILED';
  openItemsCount: number;
  progressPercent: number;
  lastAnalysisDate?: string;
}

// ==========================================
// PHASE 4: ENGINEERING TAKEOFF & CALCULATION ENGINE TYPES
// ==========================================

export type TakeoffCategoryKey =
  | 'A_PRELIMINARY_SITE'
  | 'B_EARTHWORK'
  | 'C_SUBSTRUCTURE'
  | 'D_RCC'
  | 'E_REINFORCEMENT'
  | 'F_FORMWORK'
  | 'G_MASONRY'
  | 'H_DPC_WATERPROOFING'
  | 'I_ARCHITECTURAL'
  | 'J_DOORS_WINDOWS'
  | 'K_FINISHES'
  | 'L_STEEL_STRUCTURE'
  | 'M_ROOFING'
  | 'N_CLADDING'
  | 'O_SKYLIGHTS'
  | 'P_MEP'
  | 'Q_EXTERNAL_WORKS'
  | 'R_OTHER';

export interface TakeoffCategoryDef {
  key: TakeoffCategoryKey;
  code: string;
  label: string;
  iconName: string;
  description: string;
  subcategories: string[];
}

export type ConstructionSequenceStage =
  | '01_EXISTING_GROUND'
  | '02_EXCAVATION'
  | '03_FOUNDATION'
  | '04_PCC_BLINDING'
  | '05_WATERPROOFING_SUB'
  | '06_FOOTING_RAFT_PILECAP'
  | '07_PEDESTAL'
  | '08_GROUND_BEAM'
  | '09_BACKFILL'
  | '10_DPC'
  | '11_WALLS_SUB'
  | '12_COLUMNS'
  | '13_BEAMS'
  | '14_SLABS'
  | '15_STAIRS'
  | '16_UPPER_FLOORS'
  | '17_ROOF_STRUCTURE'
  | '18_PURLINS'
  | '19_SKYLIGHT_PURLINS'
  | '20_ROOF_CLADDING'
  | '21_SKYLIGHTS'
  | '22_INSULATION_WATERPROOFING_ROOF'
  | '23_FLASHINGS_GUTTERS'
  | '24_PARAPETS'
  | '25_FINAL_ROOF_LEVEL';

export interface ConstructionSequenceStep {
  stage: ConstructionSequenceStage;
  order: number;
  name: string;
  elevationDescription: string;
  disciplines: Discipline[];
}

export type TakeoffCalculationStatus =
  | 'DRAFT'
  | 'BLOCKED'
  | 'REQUIRES_REVIEW'
  | 'CALCULATED'
  | 'USER_VERIFIED'
  | 'USER_CORRECTED'
  | 'REJECTED';

export type CalculationTemplateType =
  | 'EARTHWORK_SITE'
  | 'EARTHWORK_FOUNDATION'
  | 'EARTHWORK_TRENCH'
  | 'EARTHWORK_PIT'
  | 'EARTHWORK_BULK'
  | 'EARTHWORK_DISPOSAL'
  | 'EARTHWORK_BACKFILL'
  | 'EARTHWORK_COMPACTION'
  | 'PCC_BLINDING'
  | 'RCC_FOOTING'
  | 'RCC_PILE_CAP'
  | 'RCC_RAFT'
  | 'RCC_COLUMN'
  | 'RCC_BEAM'
  | 'RCC_SLAB'
  | 'RCC_WALL'
  | 'RCC_STAIR'
  | 'RCC_PEDESTAL'
  | 'RCC_GROUND_BEAM'
  | 'FORMWORK_FOOTING'
  | 'FORMWORK_COLUMN'
  | 'FORMWORK_BEAM'
  | 'FORMWORK_SLAB'
  | 'FORMWORK_WALL'
  | 'FORMWORK_STAIR'
  | 'MASONRY_WALL_VOL'
  | 'MASONRY_WALL_AREA'
  | 'DPC'
  | 'REINFORCEMENT_MEMBER'
  | 'REINFORCEMENT_SPACING'
  | 'STEEL_MEMBER_WEIGHT'
  | 'STEEL_BASE_PLATE'
  | 'PURLIN_SYSTEM'
  | 'SKYLIGHT_PURLIN'
  | 'ROOF_CLADDING_SLOPED'
  | 'SKYLIGHT_ASSEMBLY'
  | 'WATERPROOFING_SURFACE'
  | 'PLASTER_INTERNAL'
  | 'PLASTER_EXTERNAL'
  | 'PLASTER_CEILING'
  | 'FLOOR_FINISH'
  | 'PAINTING_SURFACE'
  | 'DOORS_WINDOWS_SCHEDULE'
  | 'MEP_PIPE_RUN'
  | 'MEP_DUCT_RUN'
  | 'MEP_CABLE_TRAY'
  | 'MEP_EQUIPMENT_COUNT'
  | 'CUSTOM_GEOMETRIC';

export interface CalculationInputParameter {
  id: string;
  name: string; // e.g. "length", "width", "depth", "thickness", "count", "unitWeight"
  label: string; // e.g. "Length", "Width", "Depth / Height", "Number of Units"
  value: number | null; // null if missing
  unit: string; // e.g. "m", "mm", "m²", "kg/m", "Nr", "deg", "%"
  rawText?: string; // Text as extracted from drawing OCR e.g. "2000 mm"
  isMissing: boolean; // Triggers Open Item if mandatory
  isMandatory: boolean;
  isUserOverridden?: boolean;
  originalExtractedValue?: number | null;
  sourceDescription?: string; // e.g. "Grid Axis B/3, Sheet S-201 Rev 02"
}

export interface TakeoffDeductionRecord {
  id: string;
  parentElementId: string;
  parentElementName: string;
  openingElementId: string;
  openingElementName: string;
  openingType: 'door' | 'window' | 'void' | 'shaft' | 'cutout' | 'beam_penetration' | 'other';
  widthM: number;
  heightOrLengthM: number;
  thicknessM?: number;
  count: number;
  deductionAreaM2: number;
  deductionVolumeM3?: number;
  ruleUsed: string; // e.g. "IS 1200: Openings > 0.10 m² deducted" / "POMI Standard"
  isDeductible: boolean;
  sourceDrawing: string;
  sourceLocation: string;
}

export interface CalculationIntermediateStep {
  stepNumber: number;
  label: string;
  expression: string;
  value: number;
  unit: string;
}

export interface CalculationAuditRecord {
  id: string;
  timestamp: string;
  user: string;
  action: 'CREATED' | 'INPUT_MODIFIED' | 'FORMULA_MODIFIED' | 'OPEN_ITEM_RESOLVED' | 'VERIFIED' | 'MASS_EDITED' | 'RESET';
  previousValue: number | null;
  newValue: number;
  previousFormula?: string;
  newFormula?: string;
  changedInputs?: { name: string; oldVal: number | null; newVal: number | null; unit: string }[];
  reason: string;
}

export interface DetailedCalculationRecord {
  id: string; // e.g. "CALC-0001"
  takeoffItemId: string; // e.g. "TO-0001"
  projectId: string;
  templateType: CalculationTemplateType;
  formula: string; // e.g. "Length × Width × Depth × Number"
  formulaNotation: string; // e.g. "L × W × D × N"
  evaluatedExpression: string; // e.g. "2.00 × 2.00 × 0.50 × 4"
  inputs: CalculationInputParameter[];
  intermediateSteps: CalculationIntermediateStep[];
  deductions: TakeoffDeductionRecord[];
  
  grossQuantity: number;
  totalDeductions: number;
  netMeasuredQuantity: number;
  
  unit: string; // "m³", "m²", "m", "kg", "Ton", "Nr"
  roundingDecimals: number; // e.g. 3 for concrete, 2 for area, 3 for steel tonnes
  
  wastagePercentage: number; // e.g. 0% for concrete, 5% for tiles
  wastageQuantity: number;
  tenderQuantity: number; // Net + Wastage
  
  sourceInfo: {
    documentId: string;
    drawingNumber: string;
    revision: string;
    page: number;
    locationDescription: string;
    boundingBox?: DrawingBoundingBox;
  };
  
  isBlockedByOpenItem: boolean;
  blockedReason?: string;
  associatedOpenItemIds: string[];
  
  status: TakeoffCalculationStatus;
  auditTrail: CalculationAuditRecord[];
  createdAt: string;
  modifiedAt: string;
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface TakeoffItemRecord {
  id: string; // e.g. "TO-0001"
  boqItemId?: string; // Link to BOQ item if mapped e.g. "BOQ-04.01.01"
  projectId: string;
  category: TakeoffCategoryKey;
  categoryCode: string; // "A" - "R"
  subcategory: string;
  sequenceStage: ConstructionSequenceStage;
  sequenceOrder: number; // 1 to 25
  
  description: string; // e.g. "RCC Isolated Footing F1 (2.0m x 2.0m x 0.5m) - Grade M30"
  elementType: string; // "Footing", "Column", "Beam", "Slab", "Wall", "DPC", "Steel Section", etc.
  elementId?: string; // Reference to ExtractedElementItem or DetectedElement
  
  drawingId: string;
  drawingNumber: string;
  revisionId: string;
  page: number;
  sourceLocation: string; // e.g. "Grid Axis B/3, Ground Floor"
  boundingBox?: DrawingBoundingBox;
  
  calculationId: string;
  calculation: DetailedCalculationRecord;
  
  formulaSummary: string; // e.g. "2.00 × 2.00 × 0.50 × 4 = 8.000 m³"
  unit: string;
  
  measuredQuantity: number;
  wastagePercent: number;
  wastageQuantity: number;
  tenderQuantity: number;
  
  confidence: number; // 0.0 - 1.0
  confidenceTier: ConfidenceTier;
  verificationStatus: 'UNVERIFIED' | 'USER_VERIFIED' | 'USER_CORRECTED';
  status: TakeoffCalculationStatus;
  
  openItemCount: number;
  openItemIds: string[];
  blockedReason?: string;
  
  notes?: string;
  lastModifiedAt: string;
}

export interface ProjectEngineeringRules {
  projectId: string;
  unitSystem: 'Metric' | 'Imperial';
  
  // Rounding decimals
  rounding: {
    concreteVolumeDecimals: number; // default 3
    areaDecimals: number; // default 2
    linearLengthDecimals: number; // default 2
    steelWeightDecimals: number; // default 3 (or 2 for kg)
    pieceCountDecimals: number; // default 0
  };
  
  // Deduction rules
  deductions: {
    concreteOpeningThresholdM2: number; // default 0.10 m² (IS1200 / POMI)
    masonryOpeningThresholdM2: number; // default 0.10 m²
    plasterOpeningThresholdM2: number; // default 0.50 m²
    paintOpeningThresholdM2: number; // default 0.50 m²
    deductBeamColumnIntersections: boolean; // default true
    deductSlabBeamIntersections: boolean; // default true
  };
  
  // Default Wastage percentages
  wastageRates: {
    concretePct: number; // default 0% (or tender allowance)
    rebarPct: number; // default 0% (measured net) or 2.5%
    structuralSteelPct: number; // default 0% or 2.0%
    masonryBlocksPct: number; // default 3.0%
    tilesFinishesPct: number; // default 5.0%
    roofSheetsPct: number; // default 4.0%
    dpcWaterproofingPct: number; // default 5.0%
  };
  
  // Reinforcement calculation standards
  reinforcement: {
    unitWeightFormula: 'STANDARD_D2_162' | 'BS4449_TABLE' | 'ASTM_A615_TABLE';
    spacingRule: 'CEIL_PLUS_ONE' | 'EXACT_RATIO' | 'FLOOR_PLUS_ONE'; // ceil(L/s) + 1 vs L/s
    defaultLapMultiplier: number; // e.g. 50 * d or 48 * d
    coverDefaultsMm: {
      footing: number; // 50 mm
      raft: number; // 50 mm
      pedestal: number; // 50 mm
      groundBeam: number; // 40 mm
      column: number; // 40 mm
      beam: number; // 30 mm
      slab: number; // 20 mm
      retainingWall: number; // 40 mm
    };
  };
  
  // Formwork measurement rules
  formwork: {
    beamMeasurementMode: 'SOFFIT_AND_TWO_SIDES' | 'SOFFIT_AND_CLEAR_SIDES' | 'FULL_PERIMETER';
    columnMeasurementMode: 'FOUR_SIDES_FULL_HEIGHT' | 'FOUR_SIDES_LESS_BEAM_DEPTH';
    slabMeasurementMode: 'NET_SOFFIT_LESS_BEAM_PROJECTION' | 'FULL_BAY_AREA';
  };
}

export interface VerifiedSteelSectionCatalogItem {
  designation: string; // e.g. "UB 406x178x74", "UC 203x203x46", "PFC 200x75x23", "SHS 100x100x5"
  type: 'UB' | 'UC' | 'PFC' | 'RHS' | 'SHS' | 'CHS' | 'Angle' | 'Purlin_Z' | 'Purlin_C' | 'Plate';
  depthMm: number;
  widthMm: number;
  flangeThicknessMm?: number;
  webThicknessMm?: number;
  unitWeightKgM: number;
  standard: 'BS EN 10365' | 'AISC' | 'IS 808' | 'Eurocode';
}

// ==========================================
// PHASE 5: RCC REINFORCEMENT & BBS ENGINE TYPES
// ==========================================

export type RccElementCategory = 
  | 'Footings'
  | 'Pile Caps'
  | 'Raft'
  | 'Columns'
  | 'Beams'
  | 'Slabs'
  | 'Walls'
  | 'Stairs'
  | 'Ground Beams'
  | 'Pedestals'
  | 'Retaining Walls'
  | 'Other RCC';

export type RebarType =
  | 'Main bar'
  | 'Distribution bar'
  | 'Top bar'
  | 'Bottom bar'
  | 'Side face bar'
  | 'Extra top bar'
  | 'Extra bottom bar'
  | 'Temperature bar'
  | 'Shrinkage bar'
  | 'Stirrup'
  | 'Link'
  | 'Tie'
  | 'U-bar'
  | 'L-bar'
  | 'Dowel'
  | 'Starter bar'
  | 'Hairpin'
  | 'Chair'
  | 'Trimmer bar'
  | 'Opening reinforcement'
  | 'Edge reinforcement'
  | 'Additional reinforcement';

export type BarCountRule = 'CEILING_PLUS_1' | 'CEILING' | 'ROUND_PLUS_1' | 'MANUAL';

export interface RebarHookInfo {
  angleDeg: 0 | 90 | 135 | 180;
  hookCount: number;
  hookLengthMm: number;
  formula: string;
  extensionRule: string; // e.g. "9d for 90°, 12d for 135°, 16d for 180°"
}

export interface RebarBendInfo {
  bendCount: number;
  bendAngleDeg: number;
  bendDeductionMm: number;
  formula: string;
  deductionRule: string; // e.g. "2d per 90° bend, 4d per 135° bend"
}

export interface RebarLapInfo {
  lapRequired: boolean;
  lapLengthMm: number;
  numberOfLaps: number;
  totalLapLengthMm: number;
  lapRule: string; // e.g. "48d (BS 8110)", "50d (IS 456)"
  isMissing: boolean;
}

export interface RebarAnchorageInfo {
  anchorageLengthMm?: number;
  developmentLengthMm?: number;
  anchorageType?: 'Straight' | 'Standard 90° Hook' | '180° Bend' | 'Mechanical';
  isMissing?: boolean;
}

export type BbsVerificationStatus =
  | 'DRAFT'
  | 'AI EXTRACTED — NOT VERIFIED'
  | 'REQUIRES REVIEW'
  | 'BLOCKED'
  | 'USER VERIFIED'
  | 'USER CORRECTED'
  | 'FINAL';

export interface RccElementRegisterItem {
  id: string; // e.g. "RCC-EL-001"
  elementId: string; // e.g. "B-101"
  elementType: RccElementCategory;
  mark: string; // e.g. "B-101"
  level: string; // e.g. "Level 01"
  grid: string; // e.g. "Grid B-C/4"
  lengthMm: number;
  widthMm: number;
  depthMm: number;
  thicknessMm: number;
  concreteGrade: string; // e.g. "C30/37"
  coverMm: number | null; // null triggers Open Item
  drawingNumber: string;
  revision: string;
  pageNumber: number;
  sourceLocation: string;
  status: BbsVerificationStatus;
  rebarCount: number;
  totalRebarWeightKg: number;
  isBlocked: boolean;
  blockedReason?: string;
}

export interface RccRebarRegisterItem {
  id: string; // e.g. "REBAR-0001"
  elementId: string; // Ref to RccElementRegisterItem.id
  elementMark: string; // e.g. "B-101"
  elementType: RccElementCategory;
  memberDescription: string; // e.g. "Floor Beam B-101 (300x600) Bottom Main Bars"
  level: string;
  grid: string;
  
  barMark: string; // e.g. "B001", "1B1"
  barDiameterMm: number; // e.g. 16, 20
  rebarType: RebarType;
  rebarGrade: SteelRebarGrade;
  
  quantity: number | null;
  spacingMm: number | null;
  distributionLengthMm: number | null;
  barCountRule: BarCountRule;
  
  direction: 'X' | 'Y' | 'Both' | 'Longitudinal' | 'Transverse' | 'Diagonal' | 'Unknown';
  layer: string; // e.g. "Layer 1", "Outer", "Inner", "T1", "B1"
  position: 'Top' | 'Bottom' | 'Side' | 'Stirrup' | 'Link' | 'Face 1' | 'Face 2' | 'Both Faces' | 'Ties' | 'Starter' | 'Dowel' | 'Main';
  face: 'Face 1' | 'Face 2' | 'Both' | 'Top' | 'Bottom' | 'Internal' | 'Unspecified';
  
  startLocation: string;
  endLocation: string;
  
  shapeCode: string; // '00' | '11' | '21' | '31' | '41' | '51' | '61' | '71' | '77' | '81' | '99'
  shapeDescription: string;
  
  // Dimensional inputs (mm)
  dimensions: {
    aMm: number;
    bMm?: number;
    cMm?: number;
    dMm?: number;
    eMm?: number;
    fMm?: number;
    radiusMm?: number;
  };
  
  hook: RebarHookInfo;
  bend: RebarBendInfo;
  lap: RebarLapInfo;
  anchorage: RebarAnchorageInfo;
  coverMm: number | null;
  
  // Deterministic BBS Results
  cuttingLengthM: number;
  cuttingFormula: string;
  cuttingFormulaWithValues: string;
  
  memberCount: number;
  barsPerMember: number;
  totalBars: number;
  totalLengthM: number;
  
  unitWeightKgM: number;
  unitWeightSource: 'DEFAULT_FORMULA' | 'PROJECT_OVERRIDE';
  totalWeightKg: number;
  
  stockLengthLimitM: number; // default 12.0m
  stockLengthExceeded: boolean;
  
  // Strict Traceability & Raw Notation (Never Overwritten)
  rawNotation: string; // e.g. "RAW: T16 @ 150 c/c TOP"
  interpretedData: {
    diameterMm: number;
    spacingMm?: number;
    position?: string;
    quantity?: number;
  };
  
  sourceDrawing: {
    documentId: string;
    drawingNumber: string;
    revision: string;
    page: number;
    locationDescription: string;
    boundingBox?: DrawingBoundingBox;
  };
  
  confidence: number;
  verificationStatus: BbsVerificationStatus;
  
  userCorrection?: {
    originalAiNotation: string;
    correctedNotation: string;
    changedBy: string;
    changedAt: string;
    reason: string;
  };
  
  isBlocked: boolean;
  blockedReason: string | null;
  associatedOpenItemIds: string[];
  
  notes: string;
  auditTrail: CalculationAuditRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface BbsRevisionDelta {
  id: string;
  barMark: string;
  element: string;
  oldRevision: string;
  newRevision: string;
  oldNotation: string;
  newNotation: string;
  oldWeightKg: number;
  newWeightKg: number;
  deltaKg: number;
  changeSummary: string;
  reviewed: boolean;
}

export interface RebarConflictRecord {
  id: string;
  barMark: string;
  element: string;
  drawingA: {
    drawingNumber: string;
    revision: string;
    notation: string;
    location: string;
  };
  drawingB: {
    drawingNumber: string;
    revision: string;
    notation: string;
    location: string;
  };
  status: 'OPEN' | 'RESOLVED';
  resolutionNote?: string;
  resolvedValue?: string;
}

export interface BbsSummaryData {
  totalBarsCount: number;
  totalLengthMeters: number;
  totalWeightKg: number;
  totalWeightTonnes: number;
  byDiameter: {
    diameterMm: number;
    totalBars: number;
    totalLengthM: number;
    unitWeightKgM: number;
    totalWeightKg: number;
    totalWeightTonnes: number;
  }[];
  byElementType: {
    elementType: RccElementCategory;
    totalBars: number;
    totalLengthM: number;
    totalWeightKg: number;
    totalWeightTonnes: number;
  }[];
  wastage: {
    calculatedWeightKg: number;
    wastagePercentage: number;
    wastageWeightKg: number;
    tenderWeightKg: number;
    tenderWeightTonnes: number;
  };
  blockedCount: number;
  requiresReviewCount: number;
  verifiedCount: number;
}

// =========================================================================
// PHASE 6: STEEL STRUCTURE, ROOFING & CLADDING TYPES
// =========================================================================

export type SteelCategory =
  | 'Primary Steel'
  | 'Secondary Steel'
  | 'Bracing'
  | 'Connections'
  | 'Base Plates'
  | 'Stiffeners'
  | 'Gusset Plates'
  | 'Cleats'
  | 'Bolts'
  | 'Welds'
  | 'Purlins'
  | 'Girts'
  | 'Eave Struts'
  | 'Sag Rods'
  | 'Roof Framing'
  | 'Roof Cladding'
  | 'Skylights'
  | 'Flashings'
  | 'Gutters'
  | 'Downpipes'
  | 'Insulation'
  | 'Roof Accessories'
  | 'Handrails'
  | 'Ladders'
  | 'Platforms'
  | 'Stairs'
  | 'Miscellaneous Steel';

export type SteelMemberType =
  | 'Column'
  | 'Beam'
  | 'Rafter'
  | 'Crane Beam'
  | 'Transfer Beam'
  | 'Portal Frame'
  | 'Truss'
  | 'Tie Beam'
  | 'Bracing Frame'
  | 'Roof Beam'
  | 'Purlin'
  | 'Skylight Purlin'
  | 'Wall Girt'
  | 'Eave Strut'
  | 'Sag Rod'
  | 'Base Plate'
  | 'Gusset Plate'
  | 'Stiffener Plate'
  | 'Cleat Plate'
  | 'End Plate'
  | 'Splice Plate'
  | 'Cap Plate'
  | 'Custom Plate'
  | 'Bracing Member'
  | 'Flashing'
  | 'Gutter'
  | 'Downpipe'
  | 'Roof Cladding Sheet'
  | 'Roof Skylight'
  | 'Roof Insulation'
  | 'Roof Accessory'
  | 'Handrail'
  | 'Platform'
  | 'Stair Stringer';

export type SteelSectionType =
  | 'UB'
  | 'UC'
  | 'IPE'
  | 'HEA'
  | 'HEB'
  | 'HEM'
  | 'RHS'
  | 'SHS'
  | 'CHS'
  | 'Angle'
  | 'Channel'
  | 'Tee'
  | 'Plate'
  | 'Flat Bar'
  | 'Purlin'
  | 'Girt'
  | 'Custom';

export interface SteelSectionItem {
  sectionId: string;
  designation: string; // e.g. "UB 610x229x101", "UC 254x254x73", "Z200x65x2.0"
  type: SteelSectionType;
  standard: string; // e.g. "BS 4-1 / EN 10365", "EN 10210", "AISC"
  massKgM: number; // kg per meter
  depthMm: number;
  widthMm: number;
  webThicknessMm: number;
  flangeThicknessMm: number;
  areaCm2?: number;
  ixCm4?: number;
  iyCm4?: number;
  source: string;
  isCustom?: boolean;
  notes?: string;
}

export type PlateShape = 'Rectangle' | 'Triangle' | 'Trapezoid' | 'Circle' | 'Custom Polygon';

export interface PlateCalculationData {
  shape: PlateShape;
  lengthMm: number;
  widthMm: number;
  thicknessMm: number;
  topWidthMm?: number; // for trapezoid
  radiusMm?: number; // for circle
  quantity: number;
  densityKgM3: number; // default 7850 kg/m³
  areaM2: number;
  volumeM3: number;
  totalWeightKg: number;
  formula: string;
  formulaWithValues: string;
}

export interface BoltCalculationData {
  diameter: string; // 'M16', 'M20', 'M24', 'M30'
  grade: string; // '8.8', '10.9', 'A325'
  lengthMm: number;
  quantity: number | null;
  connectionType: string;
  weightPer100NrKg?: number;
  totalWeightKg?: number;
  isBlocked: boolean;
  blockedReason?: string;
}

export interface WeldCalculationData {
  weldSizeMm: number; // e.g. 6mm, 8mm
  weldType: 'Fillet' | 'Butt' | 'Full Penetration' | 'Intermittent';
  lengthM: number;
  quantity: number;
  totalWeldLengthM: number;
  source: string;
}

export interface SteelConnectionRecord {
  id: string;
  connectionId: string; // e.g. "CONN-M01", "BASE-C1"
  type: 'Bolted' | 'Welded' | 'Moment' | 'Shear' | 'Bracing' | 'Splice' | 'Base';
  members: string[]; // associated members e.g. ["COL-01", "RAFTER-01"]
  plates: PlateCalculationData[];
  bolts?: BoltCalculationData[];
  welds?: WeldCalculationData[];
  quantity: number;
  drawing: string;
  detailRef: string;
  totalConnectionWeightKg: number;
}

export interface PurlinTakeoffData {
  section: string;
  purlinType: 'Z-Purlin' | 'C-Purlin' | 'Cold-Formed' | 'Hot-Rolled' | 'Custom';
  roofZone: string;
  slopeSpanM: number;
  roofLengthM: number;
  spacingMm: number | null;
  spacingRule: 'CEILING' | 'CEILING_PLUS_1' | 'EXACT';
  runType: 'Continuous' | 'Spliced' | 'Single-Span' | 'Multi-Span';
  lapLengthMm: number;
  numberOfLaps: number;
  extraLapLengthM: number;
  calculatedSpaces: number;
  calculatedPurlinLines: number;
  totalPurlinLengthM: number;
  unitWeightKgM: number;
  totalWeightKg: number;
  isSkylightPurlin: boolean;
  formula: string;
  formulaWithValues: string;
  isBlocked: boolean;
  blockedReason?: string;
}

export interface GirtTakeoffData {
  section: string;
  wallType: 'Side Wall Girt' | 'End Wall Girt' | 'Internal Girt';
  wallHeightM: number;
  runLengthM: number;
  spacingMm: number | null;
  calculatedTiers: number;
  quantity: number;
  totalLengthM: number;
  unitWeightKgM: number;
  totalWeightKg: number;
  formula: string;
  formulaWithValues: string;
  isBlocked: boolean;
  blockedReason?: string;
}

export interface RoofGeometryData {
  id: string;
  roofName: string;
  roofType: 'Single Slope' | 'Double Slope' | 'Saw-tooth' | 'Monopitch' | 'Multi-slope' | 'Curved';
  buildingLengthM: number;
  spanM: number;
  halfSpanM: number;
  pitchDeg: number | null;
  riseM: number | null;
  runM: number;
  slopingLengthM: number;
  eaveOverhangM: number;
  planAreaM2: number;
  slopingRoofAreaM2: number;
  grossRoofAreaM2: number;
  formula: string;
  formulaWithValues: string;
  isBlocked: boolean;
  blockedReason?: string;
}

export interface RoofCladdingTakeoffData {
  id: string;
  mark: string;
  material: string; // e.g. "0.5mm Pre-painted Zincalume", "50mm PIR Insulated Panel", "Standing Seam"
  profile: string;
  thicknessMm: number | null;
  sheetWidthMm: number;
  effectiveCoverWidthMm: number | null;
  sheetLengthM: number;
  quantity: number;
  grossRoofAreaM2: number;
  skylightDeductionM2: number;
  openingsDeductionM2: number;
  netCladdingAreaM2: number;
  sideLapMm: number;
  endLapMm: number;
  wastagePercent: number;
  tenderAreaM2: number;
  formula: string;
  formulaWithValues: string;
  isBlocked: boolean;
  blockedReason?: string;
}

export interface SkylightTakeoffData {
  id: string;
  mark: string;
  roofZone: string;
  type: 'Polycarbonate' | 'FRP' | 'Transparent Corrugated' | 'Rooflight Panel' | 'Custom Skylight';
  lengthM: number;
  widthM: number;
  unitAreaM2: number;
  quantity: number;
  totalAreaM2: number;
  thicknessMm: number | null;
  frameDetails?: string;
  formula: string;
  formulaWithValues: string;
  isBlocked: boolean;
  blockedReason?: string;
}

export interface FlashingGutterTakeoffItem {
  id: string;
  mark: string;
  category: 'Flashings' | 'Gutters' | 'Downpipes' | 'Insulation' | 'Roof Accessories';
  subType:
    | 'Ridge Flashing'
    | 'Barge Flashing'
    | 'Eave Flashing'
    | 'Valley Flashing'
    | 'Apron Flashing'
    | 'Head Flashing'
    | 'Side Flashing'
    | 'Eaves Gutter'
    | 'Box Gutter'
    | 'Valley Gutter'
    | 'Downpipe (Vertical)'
    | 'Downpipe (Horizontal)'
    | 'Mineral Wool Insulation'
    | 'Glass Wool Insulation'
    | 'PIR Board Insulation'
    | 'Ridge Cap'
    | 'Foam Closure'
    | 'Roof Vent'
    | 'Walkway'
    | 'Safety Line'
    | 'Roof Ladder'
    | 'Access Hatch';
  girthMm?: number;
  diameterMm?: number;
  thicknessMm?: number;
  lengthM: number;
  quantity: number;
  totalLengthM?: number;
  totalAreaM2?: number;
  unit: 'm' | 'm²' | 'Nr';
  formula: string;
  formulaWithValues: string;
  source: string;
  drawingNumber: string;
  revision: string;
  status: string;
}

export interface SteelFabricationTakeoffItem {
  assemblyMark: string; // e.g. "RF-01", "COL-01"
  pieceMark: string; // e.g. "P-01"
  partMark: string; // e.g. "PT-01"
  section: string;
  cutLengthM: number;
  quantity: number;
  unitWeightKgM: number;
  totalWeightKg: number;
  connectionNotes?: string;
  shopDrawingNumber: string;
}

export interface SteelMemberRegisterItem {
  id: string; // e.g. "ST-001"
  physicalMemberId: string; // Links GA, Shop, Erection, IFC into 1 unique physical element to PREVENT double-counting
  ifcGlobalId?: string;
  mark: string; // e.g. "ST-B001", "COL-C1", "RAF-R1"
  category: SteelCategory;
  memberType: SteelMemberType;
  section: string; // e.g. "UB 610x229x101", "UC 254x254x73"
  materialGrade: StructuralSteelGrade;
  
  lengthM: number | null;
  quantity: number;
  unitWeightKgM: number | null;
  totalWeightKg: number;
  totalWeightTonnes: number;
  
  level: string; // e.g. "Roof Level +12.50m", "Mezzanine"
  grid: string; // e.g. "Grid 1-4 / A-E"
  
  drawingNumber: string;
  drawingType: 'GA' | 'Shop Drawing' | 'Fabrication' | 'Erection' | 'IFC' | 'Detail';
  revision: string;
  pageNumber: number;
  sourceLocation: string;
  boundingBox?: DrawingBoundingBox;
  
  confidence: number;
  verificationStatus:
    | 'AI EXTRACTED — NOT VERIFIED'
    | 'REQUIRES REVIEW'
    | 'BLOCKED'
    | 'USER VERIFIED'
    | 'USER CORRECTED'
    | 'FINAL';
  
  isBlocked: boolean;
  blockedReason?: string | null;
  associatedOpenItemIds: string[];
  
  formula: string;
  formulaWithValues: string;
  
  // Plate specific if category is Plate
  plateData?: PlateCalculationData;
  // Connection specific
  connectionData?: SteelConnectionRecord;
  // Purlin specific
  purlinData?: PurlinTakeoffData;
  // Girt specific
  girtData?: GirtTakeoffData;
  // Roof geometry if roof framing
  roofGeometry?: RoofGeometryData;
  // Cladding specific
  claddingData?: RoofCladdingTakeoffData;
  // Skylight specific
  skylightData?: SkylightTakeoffData;
  // Flashing / Gutter / Accessory
  accessoryData?: FlashingGutterTakeoffItem;
  
  // Fabrication level shop drawing mapping
  fabrication?: SteelFabricationTakeoffItem;
  
  // Associated multiple sources for double counting protection
  associatedSources: Array<{
    drawingNumber: string;
    type: 'GA' | 'Shop' | 'Erection' | 'IFC' | 'Detail';
    revision: string;
    page: number;
  }>;
  
  userCorrection?: {
    originalAiNotation: string;
    correctedNotation: string;
    changedBy: string;
    changedAt: string;
    reason: string;
  };
  
  notes?: string;
  auditTrail: CalculationAuditRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface SteelRevisionDiffRecord {
  id: string;
  memberMark: string;
  element: string;
  oldRevision: string;
  newRevision: string;
  oldSection: string;
  newSection: string;
  oldWeightKg: number;
  newWeightKg: number;
  deltaKg: number;
  changeSummary: string;
  reviewed: boolean;
}

export interface SteelConflictRecord {
  id: string;
  memberMark: string;
  conflictType: 'SECTION_MISMATCH' | 'LENGTH_MISMATCH' | 'QUANTITY_MISMATCH' | 'SPACING_MISMATCH';
  drawingA: {
    drawingNumber: string;
    type: string;
    revision: string;
    spec: string;
    location: string;
  };
  drawingB: {
    drawingNumber: string;
    type: string;
    revision: string;
    spec: string;
    location: string;
  };
  status: 'OPEN' | 'RESOLVED';
  resolutionNote?: string;
  resolvedDrawing?: 'A' | 'B';
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface SteelRoofSummaryData {
  primarySteelTonnes: number;
  secondarySteelTonnes: number;
  purlinsTonnes: number;
  girtsTonnes: number;
  bracingTonnes: number;
  platesTonnes: number;
  connectionsTonnes: number;
  miscellaneousSteelTonnes: number;
  totalSteelTonnes: number;
  totalSteelKg: number;
  
  // Roof metrics
  totalRoofAreaM2: number;
  totalCladdingAreaM2: number;
  totalSkylightAreaM2: number;
  totalPurlinLengthM: number;
  totalGirtLengthM: number;
  totalGutterLengthM: number;
  totalDownpipeLengthM: number;
  totalFlashingLengthM: number;
  totalInsulationAreaM2: number;
  
  // Verification health
  totalMembersCount: number;
  verifiedCount: number;
  blockedCount: number;
  requiresReviewCount: number;
}

// =========================================================================
// PHASE 7: ARCHITECTURAL, MASONRY, DPC, DOORS/WINDOWS & FINISHES TYPES
// =========================================================================

export type ArchitecturalCategory =
  | 'Walls'
  | 'Masonry'
  | 'DPC'
  | 'Waterproofing'
  | 'Doors'
  | 'Windows'
  | 'Louvers'
  | 'Openings'
  | 'Plaster'
  | 'Putty'
  | 'Painting'
  | 'Flooring'
  | 'Tiles'
  | 'Screed'
  | 'Skirting'
  | 'Ceilings'
  | 'Wall Finishes'
  | 'Roof Finishes'
  | 'Stair Finishes'
  | 'Parapets'
  | 'Sealants'
  | 'Expansion Joints'
  | 'Architectural Metalwork'
  | 'Other';

export type WallMaterialType =
  | 'Brick masonry'
  | 'Block masonry'
  | 'AAC block'
  | 'Concrete block'
  | 'Stone masonry'
  | 'Drywall'
  | 'Partition wall'
  | 'Curtain wall'
  | 'RCC wall'
  | 'Other';

export interface OpeningRegisterItem {
  id: string;
  mark: string; // e.g. "D01", "W02", "OP-1"
  type: 'door' | 'window' | 'louver' | 'opening' | 'niche';
  widthM: number;
  heightM: number;
  quantity: number;
  singleAreaM2: number;
  totalAreaM2: number;
  parentWallId: string;
  parentWallMark?: string;
  sillHeightM?: number;
  lintelHeightM?: number;
  deductionRule: string;
  isDeductibleMasonry: boolean;
  isDeductiblePlaster: boolean;
  source: string;
}

export interface WallRegisterItem {
  id: string;
  physicalWallId: string;
  wallMark: string;
  wallType: WallMaterialType;
  material: string;
  lengthM: number;
  heightM: number;
  thicknessM: number;
  level: string;
  roomZone: string;
  openings: OpeningRegisterItem[];
  grossAreaM2: number;
  deductedOpeningAreaM2: number;
  netAreaM2: number;
  grossVolumeM3: number;
  deductedOpeningVolumeM3: number;
  netVolumeM3: number;
  blockCountEstimate?: number;
  includeDpc?: boolean;
  drawingNumber: string;
  drawingType: string;
  revision: string;
  pageNumber: number;
  sourceLocation: string;
  confidenceScore: number;
  verificationStatus: 'verified' | 'unverified' | 'flagged';
  formulaWithValues: string;
  isBlocked?: boolean;
  blockedReason?: string;
  auditTrail: CalculationAuditRecord[];
}

export interface DPCRegisterItem {
  id: string;
  wallId: string;
  wallMark: string;
  level: string;
  lengthM: number;
  widthM: number;
  thicknessMm: number;
  material: string; // e.g. "2-ply Bituminous Felt DPC", "Polythene 500 gauge"
  areaM2: number;
  drawingNumber: string;
  revision: string;
  pageNumber: number;
  sourceLocation: string;
  confidenceScore: number;
  verificationStatus: 'verified' | 'unverified' | 'flagged';
  formulaWithValues: string;
  isBlocked?: boolean;
  blockedReason?: string;
  auditTrail: CalculationAuditRecord[];
}

export interface DoorRegisterItem {
  id: string;
  doorMark: string; // e.g. "D01"
  doorType: string; // e.g. "Single Leaf Flush Door", "Double Glazed Acoustic"
  widthM: number;
  heightM: number;
  frameType: string; // e.g. "Pressed Steel Frame", "Hardwood Frame"
  material: string;
  fireRating: string; // e.g. "FD30", "FD60", "Non-FR"
  quantity: number;
  singleAreaM2: number;
  totalAreaM2: number;
  level: string;
  room: string;
  drawingNumber: string;
  revision: string;
  pageNumber: number;
  sourceLocation: string;
  confidenceScore: number;
  verificationStatus: 'verified' | 'unverified' | 'flagged';
  auditTrail: CalculationAuditRecord[];
}

export interface WindowRegisterItem {
  id: string;
  windowMark: string; // e.g. "W01"
  windowType: string; // e.g. "Side Hung Casement", "Top Hung Projected"
  widthM: number;
  heightM: number;
  frameType: string; // e.g. "Powder Coated Aluminium", "UPVC"
  glazing: string; // e.g. "6mm Clear Toughened", "24mm DGU Low-E"
  sillHeightM: number;
  quantity: number;
  singleAreaM2: number;
  totalAreaM2: number;
  level: string;
  room: string;
  drawingNumber: string;
  revision: string;
  pageNumber: number;
  sourceLocation: string;
  confidenceScore: number;
  verificationStatus: 'verified' | 'unverified' | 'flagged';
  auditTrail: CalculationAuditRecord[];
}

export interface LouverRegisterItem {
  id: string;
  mark: string; // e.g. "L01"
  type: string; // "Acoustic Louver", "Weather Louver", "Sand Trap"
  widthM: number;
  heightM: number;
  quantity: number;
  singleAreaM2: number;
  totalAreaM2: number;
  material: string;
  level: string;
  room: string;
  drawingNumber: string;
  revision: string;
  pageNumber: number;
  sourceLocation: string;
  verificationStatus: 'verified' | 'unverified' | 'flagged';
  auditTrail: CalculationAuditRecord[];
}

export interface CurtainWallRegisterItem {
  id: string;
  mark: string; // e.g. "CW-01"
  systemType: string; // "Stick System", "Unitized Structural Glazing"
  lengthM: number;
  heightM: number;
  areaM2: number;
  panelCount: number;
  glassSpec: string;
  mullionSpec?: string;
  transomSpec?: string;
  level: string;
  drawingNumber: string;
  revision: string;
  pageNumber: number;
  sourceLocation: string;
  verificationStatus: 'verified' | 'unverified' | 'flagged';
  auditTrail: CalculationAuditRecord[];
}

export interface PlasterTakeoffItem {
  id: string;
  locationType: 'Internal Wall' | 'External Wall' | 'Ceiling' | 'Column' | 'Beam Soffit';
  description: string;
  wallMark?: string;
  room?: string;
  level: string;
  grossAreaM2: number;
  deductionAreaM2: number;
  netAreaM2: number;
  thicknessMm: number;
  volumeM3?: number;
  specification: string; // e.g. "12mm Cement-Sand Plaster (1:4)"
  formulaWithValues: string;
  drawingNumber: string;
  revision: string;
  pageNumber: number;
  sourceLocation: string;
  verificationStatus: 'verified' | 'unverified' | 'flagged';
  auditTrail: CalculationAuditRecord[];
}

export interface PaintingTakeoffItem {
  id: string;
  surfaceType: 'Internal Wall' | 'External Wall' | 'Ceiling' | 'Metal/Steel' | 'Woodwork';
  description: string;
  system: string; // e.g. "1 Primer + 2 Putty + 2 Coats Premium Acrylic Emulsion"
  coats: number;
  netAreaM2: number;
  room?: string;
  level: string;
  formulaWithValues: string;
  drawingNumber: string;
  revision: string;
  pageNumber: number;
  sourceLocation: string;
  verificationStatus: 'verified' | 'unverified' | 'flagged';
  auditTrail: CalculationAuditRecord[];
}

export interface FlooringTakeoffItem {
  id: string;
  room: string;
  roomNumber: string;
  level: string;
  finishType: string; // "Porcelain Tile", "Ceramic Tile", "Granite", "Marble", "Carpet", "Vinyl", "Epoxy", "Screed", "Raised Floor"
  material: string;
  thicknessMm: number;
  tileLengthMm?: number;
  tileWidthMm?: number;
  tileCount?: number;
  measuredAreaM2: number;
  wastagePercent: number; // e.g. 5%
  wastageAreaM2: number;
  tenderAreaM2: number;
  formulaWithValues: string;
  drawingNumber: string;
  revision: string;
  pageNumber: number;
  sourceLocation: string;
  verificationStatus: 'verified' | 'unverified' | 'flagged';
  auditTrail: CalculationAuditRecord[];
}

export interface SkirtingTakeoffItem {
  id: string;
  room: string;
  level: string;
  material: string; // e.g. "100mm Porcelain Tile Skirting", "Hardwood Skirting"
  heightMm: number;
  grossPerimeterM: number;
  openingsDeductionM: number;
  netLengthM: number;
  areaM2?: number;
  formulaWithValues: string;
  drawingNumber: string;
  revision: string;
  pageNumber: number;
  sourceLocation: string;
  verificationStatus: 'verified' | 'unverified' | 'flagged';
  auditTrail: CalculationAuditRecord[];
}

export interface CeilingTakeoffItem {
  id: string;
  room: string;
  level: string;
  ceilingType: string; // "Gypsum Board False Ceiling", "600x600 Mineral Fiber Grid", "Metal Tile", "Soffit Plaster"
  heightM: number; // e.g. 2.80m AFFL
  material: string;
  gridSpecification?: string;
  areaM2: number;
  formulaWithValues: string;
  drawingNumber: string;
  revision: string;
  pageNumber: number;
  sourceLocation: string;
  verificationStatus: 'verified' | 'unverified' | 'flagged';
  auditTrail: CalculationAuditRecord[];
}

export interface WaterproofingTakeoffItem {
  id: string;
  zoneType: 'Toilet/Bath Wet Area' | 'Terrace' | 'Balcony' | 'Basement Wall' | 'Roof' | 'Water Tank';
  description: string;
  room?: string;
  level: string;
  systemType: string; // "Liquid Applied Polyurethane Membrane", "Torch-on Bituminous Membrane", "Cementitious Elastomeric"
  layers: number;
  upstandHeightM: number; // e.g. 0.30m upturn
  floorAreaM2: number;
  upstandAreaM2: number;
  totalAreaM2: number;
  protectionScreed: boolean;
  formulaWithValues: string;
  drawingNumber: string;
  revision: string;
  pageNumber: number;
  sourceLocation: string;
  verificationStatus: 'verified' | 'unverified' | 'flagged';
  auditTrail: CalculationAuditRecord[];
}

export interface ScreedTakeoffItem {
  id: string;
  room: string;
  level: string;
  type: string; // "Floor Bedding Screed", "Slope Screed on Roof"
  thicknessMm: number;
  areaM2: number;
  volumeM3: number;
  formulaWithValues: string;
  drawingNumber: string;
  revision: string;
  pageNumber: number;
  sourceLocation: string;
  verificationStatus: 'verified' | 'unverified' | 'flagged';
  auditTrail: CalculationAuditRecord[];
}

export interface WallTileTakeoffItem {
  id: string;
  room: string;
  level: string;
  tileType: string; // "Ceramic Glazed Wall Tiles", "Porcelain Wall Tiles"
  tileHeightM: number; // e.g. 2.40m or full height (3.00m)
  wallLengthM: number;
  grossAreaM2: number;
  deductionAreaM2: number;
  netAreaM2: number;
  formulaWithValues: string;
  drawingNumber: string;
  revision: string;
  pageNumber: number;
  sourceLocation: string;
  verificationStatus: 'verified' | 'unverified' | 'flagged';
  auditTrail: CalculationAuditRecord[];
}

export interface StairFinishTakeoffItem {
  id: string;
  stairMark: string; // e.g. "STAIR-01"
  level: string;
  treadCount: number;
  treadWidthM: number;
  treadLengthM: number;
  riserCount: number;
  riserHeightM: number;
  riserLengthM: number;
  landingCount: number;
  landingAreaM2: number;
  treadAreaM2: number;
  riserAreaM2: number;
  totalFinishAreaM2: number;
  finishMaterial: string; // e.g. "Flamed Granite Treads with Chamfered Edge & Anti-slip Grooves"
  nosingSpec?: string;
  formulaWithValues: string;
  drawingNumber: string;
  revision: string;
  pageNumber: number;
  sourceLocation: string;
  verificationStatus: 'verified' | 'unverified' | 'flagged';
  auditTrail: CalculationAuditRecord[];
}

export interface ParapetTakeoffItem {
  id: string;
  mark: string; // e.g. "PARA-01"
  level: string;
  lengthM: number;
  heightM: number;
  thicknessM: number;
  material: string;
  volumeM3: number;
  plasterAreaM2: number; // Both faces + top coping
  copingSpec?: string;
  formulaWithValues: string;
  drawingNumber: string;
  revision: string;
  pageNumber: number;
  sourceLocation: string;
  verificationStatus: 'verified' | 'unverified' | 'flagged';
  auditTrail: CalculationAuditRecord[];
}

export interface ArchitecturalMetalworkItem {
  id: string;
  physicalMetalId: string; // To link with steel module
  mark: string; // e.g. "HR-01", "BAL-02", "LAD-01"
  type: 'Handrail' | 'Balustrade' | 'Guardrail' | 'Cat Ladder' | 'Grille' | 'Architectural Louver';
  lengthM: number;
  heightM: number;
  quantity: number;
  material: string; // e.g. "SS316 Stainless Steel with Glass Infills", "Galvanized Mild Steel"
  isLinkedToSteelTakeoff: boolean;
  steelMemberId?: string;
  unitWeightKgM?: number;
  totalWeightKg?: number;
  drawingNumber: string;
  revision: string;
  pageNumber: number;
  sourceLocation: string;
  verificationStatus: 'verified' | 'unverified' | 'flagged';
  auditTrail: CalculationAuditRecord[];
}

export interface RoomRegisterItem {
  id: string;
  roomNumber: string; // e.g. "R-101"
  roomName: string; // e.g. "Executive Director Office"
  level: string; // e.g. "Level 01"
  building?: string;
  block?: string;
  lengthM: number;
  widthM: number;
  heightM: number;
  perimeterM: number;
  areaM2: number;
  floorFinish: string;
  wallFinish: string;
  wallTileHeightM?: number;
  ceilingFinish: string;
  ceilingHeightM: number;
  skirtingFinish: string;
  waterproofingType?: string;
  doors: string[]; // Marks e.g. ["D01"]
  windows: string[]; // Marks e.g. ["W01"]
  drawingNumber: string;
  revision: string;
  pageNumber: number;
  sourceLocation: string;
  verificationStatus: 'verified' | 'unverified' | 'flagged';
}

export interface ArchitecturalConflictRecord {
  id: string;
  elementMark: string;
  conflictType: 'WALL_THICKNESS_MISMATCH' | 'DOOR_DIMENSION_MISMATCH' | 'FINISH_SPEC_MISMATCH' | 'CEILING_LEVEL_MISMATCH';
  sourceA: {
    documentName: string;
    drawingNumber: string;
    revision: string;
    value: string;
    location: string;
  };
  sourceB: {
    documentName: string;
    drawingNumber: string;
    revision: string;
    value: string;
    location: string;
  };
  status: 'OPEN' | 'RESOLVED';
  resolutionNote?: string;
  resolvedSource?: 'A' | 'B';
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface ArchitecturalRevisionDiffRecord {
  id: string;
  elementMark: string;
  category: ArchitecturalCategory;
  oldRevision: string;
  newRevision: string;
  oldSpecification: string;
  newSpecification: string;
  oldQuantity: number;
  newQuantity: number;
  unit: string;
  deltaQuantity: number;
  changeSummary: string;
  reviewed: boolean;
}

export interface ArchitecturalSummaryData {
  masonryVolumeM3: number;
  wallNetAreaM2: number;
  dpcAreaM2: number;
  plasterAreaM2: number;
  paintingAreaM2: number;
  flooringAreaM2: number;
  wallTilesAreaM2: number;
  ceilingAreaM2: number;
  waterproofingAreaM2: number;
  skirtingLengthM: number;
  doorsCount: number;
  windowsCount: number;
  doorsAreaM2: number;
  windowsAreaM2: number;
  screedVolumeM3: number;
  parapetVolumeM3: number;
  stairFinishAreaM2: number;
  
  // Verification metrics
  totalElementsCount: number;
  verifiedCount: number;
  blockedCount: number;
  requiresReviewCount: number;
}

// ==========================================
// PHASE 8: MEP QUANTITY TAKEOFF ENGINE TYPES
// ==========================================

export type MEPDiscipline =
  | 'Electrical'
  | 'HVAC'
  | 'Plumbing'
  | 'Fire Fighting'
  | 'Fire Alarm'
  | 'ELV'
  | 'Ventilation'
  | 'Equipment'
  | 'MEP Supports'
  | 'Testing & Commissioning';

export type MEPDrawingType =
  | 'Electrical Lighting Plan'
  | 'Electrical Power Plan'
  | 'Single Line Diagram (SLD)'
  | 'Panel Schedule'
  | 'Cable Schedule'
  | 'Containment Layout'
  | 'Earthing & Lightning Layout'
  | 'HVAC Duct Layout'
  | 'HVAC Chilled Water Piping Layout'
  | 'HVAC Equipment Schedule'
  | 'Ventilation & Exhaust Plan'
  | 'Plumbing Water Supply Plan'
  | 'Plumbing Drainage & Vent Plan'
  | 'Plumbing Riser Diagram'
  | 'Fire Fighting Sprinkler & Hydrant Plan'
  | 'Fire Fighting Pump Room & Schematic'
  | 'Fire Alarm Loop & Device Plan'
  | 'ELV CCTV & Security Plan'
  | 'ELV Structured Cabling & Data Plan'
  | 'Access Control & Door Interface Plan'
  | 'MEP Composite Coordination Plan'
  | 'MEP Riser Diagram'
  | 'MEP Schematic Diagram'
  | 'MEP Shop Drawing'
  | 'MEP IFC/BIM Model';

export interface MEPAuditRecord {
  id: string;
  timestamp: string;
  user: string;
  action: 'CREATED' | 'EXTRACTED' | 'VERIFIED' | 'MODIFIED' | 'OVERRIDDEN' | 'RECONCILED';
  previousValue?: string | number;
  newValue?: string | number;
  newFormula?: string;
  reason: string;
}

export interface MEPDrawingProvenance {
  drawingNumber: string;
  drawingTitle: string;
  revision: string;
  page?: number;
  sheetId?: string;
  location: string;
  gridReference?: string;
  cadCoordinates?: { x: number; y: number; z?: number };
  boundingBox?: DrawingBoundingBox;
}

export interface GeneralMEPElement {
  id: string;
  physicalElementId: string; // Unified physical ID across plan, riser, schedule
  discipline: MEPDiscipline;
  system: string;
  subSystem: string;
  tag: string;
  description: string;
  size?: string; // e.g. "DN50", "600x400mm", "4C x 16mm²", "1500 CFM"
  material?: string;
  ratingOrCapacity?: string; // e.g. "3.5 kW", "50 kVA", "150 GPM @ 8 bar", "2hr Fire Rated"
  lengthM?: number;
  quantity: number;
  unit: string; // "m", "m²", "No.", "Set", "kg", "Lot"
  level: string;
  roomNumber?: string;
  roomName?: string;
  zone?: string;
  grid?: string;
  
  // Provenance & Source
  sourceDrawings: MEPDrawingProvenance[];
  primaryDrawingNumber: string;
  revision: string;
  sourceType: 'CAD_GEOMETRY' | 'BIM_IFC' | 'SCHEDULE' | 'DIMENSIONED_PLAN' | 'USER_INPUT';
  confidence: number;
  
  // Math & Takeoff
  formulaWithValues: string;
  formulaVariables?: Record<string, number | string>;
  allowanceBreakdown?: {
    label: string;
    value: number;
    unit: string;
    percentage?: number;
  }[];
  
  // Connectivity & Hierarchy
  connectedFromId?: string; // e.g. Panel ID or AHU ID
  connectedToId?: string; // e.g. Motor ID or Diffuser ID
  architecturalDoorRef?: string; // e.g. D-01 for Access Control
  
  // Status & Validation
  verificationStatus: 'verified' | 'unverified' | 'flagged' | 'user_input';
  isBlocked: boolean;
  blockedReason?: string;
  hasOpenItem: boolean;
  openItemId?: string;
  hasConflict: boolean;
  conflictId?: string;
  
  // Audit Trail
  auditTrail: MEPAuditRecord[];
}

// 1. Electrical Detailed Types
export interface MEPLightingItem extends GeneralMEPElement {
  fixtureType: string;
  wattageW?: number;
  mountingType: 'Recessed' | 'Surface' | 'Suspended' | 'Wall' | 'Pole' | 'Track';
  isEmergency: boolean;
  emergencyBackupHours?: number;
  ipRating?: string;
  circuitTag?: string;
  switchGroup?: string;
}

export interface MEPSocketSwitchItem extends GeneralMEPElement {
  deviceType: 'Socket' | 'Switch' | 'Fused Spur' | 'Isolator' | 'Data Outlet' | 'Floor Box';
  ratingAmps?: number;
  gangCount: number;
  ipRating: string;
  mountingType: 'Concealed' | 'Surface' | 'Weatherproof' | 'Floor Flush';
}

export interface MEPDistributionBoardItem extends GeneralMEPElement {
  boardType: 'MDB' | 'SMDB' | 'DB' | 'MCC' | 'VFD Panel' | 'ATS' | 'Capacitor Bank';
  incomerRatingAmps: number;
  incomerPoles: string; // e.g. "4P MCCB"
  outgoingWaysTotal: number;
  outgoingWaysUsed: number;
  mountingType: 'Floor Mounted' | 'Wall Surface' | 'Wall Recessed';
  panelScheduleRef?: string;
}

export interface MEPCableTakeoffItem extends GeneralMEPElement {
  cableType: string; // e.g. "Cu/XLPE/SWA/PVC", "Cu/PVC/PVC", "Fire Resistant (FP200)"
  coreCount: number;
  conductorSizeMm2: number;
  voltageGrade: string; // "600/1000V", "450/750V", "Low Voltage"
  baseRouteLengthM: number;
  panelTerminationAllowanceM: number;
  equipmentTerminationAllowanceM: number;
  verticalRiseDropAllowanceM: number;
  slackAllowanceM: number;
  totalLengthM: number;
  fromLocation: string;
  toLocation: string;
  containmentType?: string;
}

export interface MEPCableTrayItem extends GeneralMEPElement {
  trayType: 'Perforated Cable Tray' | 'Cable Ladder' | 'Cable Trunking' | 'Wire Mesh / Basket';
  widthMm: number;
  depthMm: number;
  thicknessMm: number;
  finishMaterial: 'Hot Dip Galvanized (HDG)' | 'Pre-Galvanized (GI)' | 'Stainless Steel (SS316)' | 'Powder Coated';
  fittingsCount?: {
    bends: number;
    tees: number;
    reducers: number;
    risers: number;
  };
  supportSpacingM: number;
  calculatedSupportCount: number;
}

export interface MEPConduitItem extends GeneralMEPElement {
  conduitType: 'GI Rigid Conduit' | 'PVC Rigid Conduit' | 'HDPE Corrugated' | 'Flexible Metallic Conduit';
  diameterMm: number;
  runningLengthM: number;
  junctionBoxesCount: number;
  couplingsCount: number;
}

export interface MEPEarthingLightningItem extends GeneralMEPElement {
  itemCategory: 'Earth Pit' | 'Earth Electrode' | 'Earth Strip' | 'Earth Cable' | 'Earth Bar (MEB)' | 'Air Terminal' | 'Down Conductor' | 'Test Link';
  conductorMaterial: 'Copper' | 'Galvanized Iron' | 'Copper Bonded';
  conductorDimension: string; // e.g. "25x3mm Cu Tape", "70mm² Bare Cu", "14.2mm dia x 3m Rod"
}

// 2. HVAC Detailed Types
export interface MEPHVACEquipmentItem extends GeneralMEPElement {
  equipmentCategory: 'AHU' | 'FAHU' | 'FCU' | 'VRF Outdoor' | 'VRF Indoor' | 'Chiller' | 'Cooling Tower' | 'Chilled Water Pump' | 'Exhaust Fan' | 'Fresh Air Fan' | 'Heat Recovery' | 'VAV Box';
  coolingCapacityKw?: number;
  coolingCapacityTR?: number;
  airFlowCfm?: number;
  externalStaticPressurePa?: number;
  electricalPowerKw?: number;
  operatingWeightKg?: number;
  noiseLevelDba?: number;
  pipeConnectionSizeInches?: string;
}

export interface MEPDuctworkTakeoffItem extends GeneralMEPElement {
  ductShape: 'Rectangular' | 'Round / Spiral' | 'Flat Oval';
  widthMm?: number;
  heightMm?: number;
  diameterMm?: number;
  gaugeThicknessMm: number;
  sheetMetalMaterial: 'Galvanized Iron (GI)' | 'Stainless Steel (SS304)' | 'Aluminum' | 'PIR Pre-insulated';
  runningLengthM: number;
  surfaceAreaM2: number; // Perimeter * Length or Pi * D * L
  insulationType?: 'Fiberglass Foil-Faced' | 'Elastomeric Rubber (NBR)' | 'Acoustic Lining' | 'None';
  insulationThicknessMm?: number;
  fittingsCount?: {
    elbows90: number;
    elbows45: number;
    reducers: number;
    tees: number;
    offsets: number;
    endCaps: number;
  };
  supportSpacingM: number;
  supportCount: number;
}

export interface MEPDamperTakeoffItem extends GeneralMEPElement {
  damperType: 'Volume Control Damper (VCD)' | 'Motorized Smoke Fire Damper (MSFD)' | 'Fire Damper (FD)' | 'Non-Return Damper (NRD)' | 'Pressure Relief Damper';
  widthMm: number;
  heightMm: number;
  actuatorType?: 'Manual' | '24V Motorized' | '230V Spring Return' | 'Fusible Link (72°C)';
}

export interface MEPDiffuserGrilleItem extends GeneralMEPElement {
  deviceType: 'Supply Air Diffuser (SAD)' | 'Return Air Diffuser (RAD)' | 'Linear Slot Diffuser (LSD)' | 'Perforated Diffuser' | 'Exhaust Air Grille (EAG)' | 'Fresh Air Louver (FAL)' | 'Jet Nozzle';
  neckWidthMm: number;
  neckHeightMm?: number;
  neckDiameterMm?: number;
  faceDimension?: string;
  hasPlenumBox: boolean;
  hasVCD: boolean;
}

export interface MEPHVACPipingItem extends GeneralMEPElement {
  pipingService: 'Chilled Water Supply (CHWS)' | 'Chilled Water Return (CHWR)' | 'Condenser Water' | 'Refrigerant Suction/Liquid' | 'Condensate Drain';
  nominalDiameterMm: number;
  pipeMaterial: 'Seamless Carbon Steel (ASTM A53/A106)' | 'ERW Steel' | 'Copper Type L' | 'uPVC Pressure' | 'PPR';
  scheduleRating: string; // "Sch 40", "Class 16", "PN16"
  routeLengthM: number;
  insulationMaterial?: 'Nitrile Rubber (Armaflex)' | 'Phenolic Foam' | 'Polyurethane' | 'None';
  insulationThicknessMm?: number;
  valvesIncluded?: {
    butterflyValves: number;
    gateValves: number;
    balancingValves: number;
    picvValves: number;
    checkValves: number;
    yStrainers: number;
  };
  fittingsCount?: {
    elbows: number;
    tees: number;
    reducers: number;
    flanges: number;
  };
}

// 3. Plumbing Detailed Types
export interface MEPPlumbingFixtureItem extends GeneralMEPElement {
  fixtureType: 'Water Closet (WC)' | 'Wash Basin' | 'Urinal' | 'Shower Set' | 'Bathtub' | 'Kitchen Sink' | 'Floor Drain' | 'Cleanout (CO)' | 'Water Heater';
  mountingStyle: 'Wall Hung' | 'Floor Mounted' | 'Countertop' | 'Under Counter';
  materialSpecification: 'Vitreous China' | 'Stainless Steel 304' | 'Composite';
  accessoriesIncluded: string[]; // e.g. ["Sensor Flush Valve", "P-Trap", "Angle Valves", "Flexible Connectors"]
}

export interface MEPPlumbingPipeItem extends GeneralMEPElement {
  pipeService: 'Cold Water Supply' | 'Hot Water Supply' | 'Hot Water Return' | 'Soil Drainage' | 'Waste Drainage' | 'Vent Stack' | 'Rainwater Downpipe';
  nominalDiameterMm: number;
  pipeMaterial: 'PPR PN20' | 'PEX-a' | 'CPVC' | 'uPVC Drainage' | 'HDPE Drainage' | 'Cast Iron';
  jointingMethod: 'Socket Fusion' | 'Electrofusion' | 'Solvent Cement' | 'Rubber Ring' | 'Push-fit';
  runningLengthM: number;
  slopePercent?: number; // e.g. 1.5% or 2.0%
  insulationRequired: boolean;
  fittingsCount?: {
    bends: number;
    tees: number;
    yBranches: number;
    cleanouts: number;
    floorTraps: number;
    gullyTraps: number;
  };
}

export interface MEPPlumbingPumpTankItem extends GeneralMEPElement {
  equipmentType: 'Booster Pump Set' | 'Transfer Pump Set' | 'Submersible Sump Pump' | 'GRP Potable Water Tank' | 'Solar Hot Water Collector' | 'Central Calorifier';
  flowRateM3Hr?: number;
  headMeters?: number;
  motorPowerKw?: number;
  capacityLiters?: number;
  dutyStandbyConfiguration?: '1 Duty + 1 Standby' | '2 Duty + 1 Standby' | 'Single';
}

// 4. Fire Fighting Detailed Types
export interface MEPFireFightingItem extends GeneralMEPElement {
  fireServiceType: 'Fire Sprinkler' | 'Fire Hose Reel' | 'Landing Valve / Fire Hydrant' | 'Fire Pump Set' | 'Breeching Inlet' | 'Fire Extinguisher' | 'Clean Agent Gas Cylinder';
  sprinklerSpecs?: {
    headType: 'Pendant' | 'Upright' | 'Sidewall' | 'Concealed';
    temperatureRatingC: number; // 68°C, 79°C, 93°C
    kFactor: number; // 80, 115, 160
    finish: 'Chrome' | 'Brass' | 'White';
  };
  pumpSpecs?: {
    pumpType: 'Main Electric Pump' | 'Diesel Engine Pump' | 'Jockey Pump';
    capacityGpm: number;
    pressureBar: number;
    motorPowerKw: number;
  };
  hoseReelSpecs?: {
    drumDiameterMm: number;
    hoseLengthM: number;
    cabinetType: 'Surface' | 'Recessed' | 'Stainless Steel Door';
  };
}

export interface MEPFirePipingItem extends GeneralMEPElement {
  pipeCategory: 'Sprinkler Main Header' | 'Sprinkler Cross Main' | 'Sprinkler Branch Line' | 'Hydrant Wet Riser' | 'Dry Riser';
  nominalDiameterMm: number;
  pipeMaterial: 'Black Steel Seamless Sch 40' | 'Galvanized Steel Sch 40' | 'Grooved Ductile Iron';
  jointingType: 'Grooved Mechanical Couplings' | 'Welded' | 'Threaded';
  runningLengthM: number;
  valvesIncluded?: {
    zoneControlValves: number;
    osAndYGateValves: number;
    alarmCheckValves: number;
    flowSwitches: number;
  };
}

// 5. Fire Alarm Detailed Types
export interface MEPFireAlarmDeviceItem extends GeneralMEPElement {
  deviceType: 'Optical Smoke Detector' | 'Heat Detector' | 'Multi-Sensor Detector' | 'Manual Call Point (MCP)' | 'Sounder Beacon Strobe' | 'FACP Master Panel' | 'Repeater Panel' | 'Monitor Module' | 'Control Module' | 'Loop Isolator';
  protocol: 'Addressable' | 'Conventional';
  loopNumber?: number;
  addressNumber?: number;
  mountingType: 'Ceiling' | 'Wall' | 'Duct Mounted (Duct Smoke)';
  cableRequirement?: string; // "2C x 1.5mm² Fire Rated FP200"
}

// 6. ELV Detailed Types
export interface MEPELVDeviceItem extends GeneralMEPElement {
  elvSystem: 'CCTV' | 'Access Control' | 'Structured Cabling / Data' | 'Public Address (PA)' | 'Intercom' | 'Wi-Fi' | 'BMS / Automation' | 'SMATV';
  deviceSubtype: 'IP Dome Camera' | 'IP Bullet Camera' | 'PTZ Camera' | 'Card Reader' | 'Electromagnetic Lock' | 'Emergency Break Glass' | 'Door Contact' | 'RJ45 Dual Data Outlet' | '42U Server Rack' | '24-Port Patch Panel' | 'Ceiling Speaker' | 'Wi-Fi Access Point' | 'DDC Controller';
  portCount?: number;
  associatedDoorMark?: string; // Ties to Architectural Door Mark
  powerRequirement?: 'PoE' | 'PoE+' | '12V DC' | '24V AC' | '230V AC';
}

// 7. MEP Supports Detailed Types
export interface MEPSupportItem extends GeneralMEPElement {
  tradeCategory: 'Piping Support' | 'Ductwork Support' | 'Cable Containment Support' | 'Equipment Base / Vibration Isolator';
  supportType: 'Clevis Hanger' | 'Trapeze Hanger' | 'Cantilever Wall Bracket' | 'Riser Clamp' | 'Spring Vibration Isolator' | 'Inertia Concrete Base';
  rodDiameterMm?: number;
  channelProfile?: string; // "Unistrut 41x41mm", "Channel 100x50mm"
  supportedElementTag: string;
  standardSpacingRuleM: number;
  calculatedQuantity: number;
  formulaCalculation: string;
}

// 8. Open Items, Conflicts & Revisions
export interface MEPOpenItemRecord {
  id: string;
  discipline: MEPDiscipline;
  physicalElementId: string;
  elementTag: string;
  issueType: 'MISSING_PIPE_DIAMETER' | 'MISSING_CABLE_SIZE' | 'MISSING_DUCT_SIZE' | 'MISSING_EQUIPMENT_CAPACITY' | 'MISSING_FIXTURE_TYPE' | 'UNCLEAR_ROUTE' | 'UNCLEAR_SYMBOL' | 'MISSING_MATERIAL' | 'MISSING_INSULATION' | 'MISSING_VALVE_TYPE' | 'MISSING_FIRE_RATING' | 'CONFLICTING_SCHEDULE';
  description: string;
  drawingReference: string;
  revision: string;
  sourceLocation: string;
  suggestedAction: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  createdDate: string;
  resolvedDate?: string;
  resolutionNote?: string;
}

export interface MEPConflictRecord {
  id: string;
  discipline: MEPDiscipline;
  elementTag: string;
  conflictType: 'PLAN_VS_RISER_SIZE' | 'PLAN_VS_SCHEDULE_CAPACITY' | 'PLAN_VS_SPEC_MATERIAL' | 'DRAWING_VS_IFC_GEOMETRY' | 'DUPLICATE_TAKEOFF_RISK';
  sourceA: {
    documentName: string;
    drawingNumber: string;
    revision: string;
    location: string;
    value: string;
  };
  sourceB: {
    documentName: string;
    drawingNumber: string;
    revision: string;
    location: string;
    value: string;
  };
  status: 'OPEN' | 'RESOLVED';
  resolvedSource?: 'A' | 'B' | 'CUSTOM';
  resolutionNote?: string;
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface MEPRevisionDiffRecord {
  id: string;
  discipline: MEPDiscipline;
  elementTag: string;
  oldRevision: string;
  newRevision: string;
  changeType: 'ADDED_ELEMENT' | 'DELETED_ELEMENT' | 'SIZE_CHANGED' | 'ROUTE_MODIFIED' | 'CAPACITY_UPGRADED' | 'MATERIAL_SPEC_CHANGED';
  oldSpecification: string;
  newSpecification: string;
  oldQuantity: number;
  newQuantity: number;
  unit: string;
  deltaQuantity: number;
  changeSummary: string;
  reviewed: boolean;
}

export interface MEPRiserReconciliationRecord {
  physicalElementId: string;
  elementTag: string;
  discipline: MEPDiscipline;
  system: string;
  planDrawingRef: string;
  riserDrawingRef: string;
  scheduleRef?: string;
  ifcGuid?: string;
  reconciledStatus: 'SINGLE_VERIFIED_ENTITY' | 'SIZE_MISMATCH' | 'UNMATCHED_RISER_ORPHAN';
  planSize: string;
  riserSize: string;
  takeoffCount: 1; // Explicitly 1 to prevent double counting
  notes: string;
}

export interface MEPDisciplineCrossCheckRecord {
  id: string;
  severity: 'WARNING' | 'INFORMATION';
  category: 'PIPE_CROSSING_STRUCTURE' | 'DUCT_CLASH_BEAM' | 'EQUIPMENT_OUTSIDE_ROOM' | 'FIXTURE_WITHOUT_PIPE' | 'PANEL_WITHOUT_CABLE' | 'EQUIPMENT_WITHOUT_POWER' | 'FIRE_DEVICE_ORPHAN';
  description: string;
  primaryElement: string;
  relatedElement: string;
  location: string;
}

export interface MEPSummaryData {
  // Electrical
  lightingTotalCount: number;
  socketSwitchTotalCount: number;
  panelTotalCount: number;
  cableTotalLengthM: number;
  cableTrayTotalLengthM: number;
  conduitTotalLengthM: number;
  earthingConductorLengthM: number;
  
  // HVAC
  hvacEquipmentCount: number;
  ductTotalLengthM: number;
  ductTotalAreaM2: number;
  hvacPipingTotalLengthM: number;
  diffusersGrillesCount: number;
  dampersCount: number;
  hvacValvesCount: number;
  
  // Plumbing
  plumbingFixturesCount: number;
  waterSupplyPipeLengthM: number;
  drainagePipeLengthM: number;
  plumbingPumpsTanksCount: number;
  plumbingValvesCount: number;
  
  // Fire Fighting
  firePipingTotalLengthM: number;
  sprinklersTotalCount: number;
  hydrantsHoseReelsCount: number;
  firePumpsCount: number;
  
  // Fire Alarm & ELV
  fireAlarmDevicesCount: number;
  cctvCamerasCount: number;
  accessControlPointsCount: number;
  dataPointsCount: number;
  elvCablesLengthM: number;
  
  // Supports
  mepSupportsTotalCount: number;
  
  // Totals & Governance
  totalElementsCount: number;
  verifiedElementsCount: number;
  unverifiedElementsCount: number;
  blockedElementsCount: number;
  openItemsCount: number;
  openConflictsCount: number;
}

// ============================================================================
// PHASE 9: UNIFIED BOQ ASSEMBLY & COMPLETE BUILDING INTEGRATION TYPES
// ============================================================================

export type UnifiedBoqDiscipline =
  | 'A. PRELIMINARIES'
  | 'B. EARTHWORK'
  | 'C. FOUNDATIONS'
  | 'D. RCC'
  | 'E. REINFORCEMENT'
  | 'F. MASONRY'
  | 'G. STRUCTURAL STEEL'
  | 'H. ROOFING'
  | 'I. DPC & WATERPROOFING'
  | 'J. DOORS & WINDOWS'
  | 'K. ARCHITECTURAL FINISHES'
  | 'L. PLUMBING'
  | 'M. HVAC'
  | 'N. FIRE FIGHTING'
  | 'O. ELECTRICAL'
  | 'P. FIRE ALARM'
  | 'Q. ELV'
  | 'R. OTHER MEP'
  | 'S. EXTERNAL WORKS'
  | 'T. TESTING & COMMISSIONING'
  | 'U. OTHER';

export type UnifiedBoqStatus =
  | 'AI_EXTRACTED'
  | 'CALCULATED'
  | 'REQUIRES_REVIEW'
  | 'OPEN_ITEM'
  | 'CONFLICT'
  | 'USER_VERIFIED'
  | 'USER_CORRECTED'
  | 'FINAL';

export interface UnifiedBoqDeduction {
  id: string;
  parentItemId: string;
  openingType: 'DOOR' | 'WINDOW' | 'SHAFT' | 'MEP_OPENING' | 'LIFT_OPENING' | 'STAIR_OPENING' | 'STRUCTURAL_OPENING' | 'SKYLIGHT' | 'OTHER';
  openingMark?: string;
  dimensions: {
    lengthM?: number;
    widthM?: number;
    heightM?: number;
    thicknessM?: number;
    areaM2?: number;
    volumeM3?: number;
    count: number;
  };
  deductionQuantity: number;
  unit: string;
  formula: string;
  sourceDrawing: string;
  sourceElementId?: string;
}

export interface UnifiedBoqItem {
  id: string;
  itemCode: string; // e.g. "03.01.001", "A-001", "1.01"
  section: string; // e.g. "03 CONCRETE WORK"
  subsection: string; // e.g. "03.01 Plain Concrete"
  discipline: UnifiedBoqDiscipline;
  
  // Project Spatial Breakdown
  building?: string; // e.g. "Main Commercial Tower"
  block?: string;    // e.g. "Block A"
  level?: string;    // e.g. "Ground Floor", "Level 03", "Roof"
  zone?: string;     // e.g. "Zone 1 - Core", "East Wing"
  room?: string;     // e.g. "Electrical Room 102"
  
  // Element Classification
  elementType: string; // e.g. "Footing Concrete", "AAC Block Wall", "AHU", "Cable Tray"
  physicalElementId?: string; // e.g. "PW-EXT-01", "LT-6060-TYP", "COL-C1"
  
  // Descriptions (Strict Separation of Description vs Specification)
  description: string; // e.g. "Providing and constructing AAC block masonry in cement mortar 1:4..."
  specification: string; // e.g. "200mm thick Grade 7.5 AAC, compressive strength >4.0 N/mm²"
  specificationFlag?: 'CONFIRMED' | 'MISSING_SPEC' | 'PARTIAL';
  
  // Units & Quantities
  unit: 'm' | 'm²' | 'm³' | 'kg' | 'Ton' | 'tonne' | 'No.' | 'Set' | 'Lump Sum' | 'Point' | 'Pair' | 'Each' | 'Item' | 'kg/m';
  calculatedQuantity: number;
  overrideQuantity?: number;
  finalQuantity: number;
  overrideReason?: string;
  isManuallyOverridden: boolean;
  
  // Deductions breakdown
  grossQuantity: number;
  deductionsTotal: number;
  deductionsList?: UnifiedBoqDeduction[];
  
  // Mathematical Formulation
  formula: string;
  expressionWithValues: string;
  formulaInputs?: { [key: string]: number | string };
  
  // Rate and Pricing Model (Prepared for next phase, defaults 0)
  unitRate?: number;
  totalAmount?: number;
  currency?: string;
  
  // Source Traceability
  primaryDrawingNumber: string;
  drawingTitle?: string;
  revision: string;
  page?: string | number;
  sourceLocation?: string;
  takeoffSourceId: string; // Module Source ID e.g. "RCC-00023", "MEP-E-001", "W-EXT-GF-01"
  calculationId?: string;
  sourceModule: 'EARTHWORK' | 'RCC' | 'REBAR_BBS' | 'STEEL_ROOF' | 'ARCHITECTURAL' | 'MEP_ELECTRICAL' | 'MEP_HVAC' | 'MEP_PLUMBING' | 'MEP_FIRE' | 'MEP_ELV' | 'MANUAL';
  
  // Verification, Open Item & Conflict Status
  status: UnifiedBoqStatus;
  openItemId?: string;
  hasOpenItem?: boolean;
  openItemDescription?: string;
  conflictId?: string;
  hasConflict?: boolean;
  conflictDescription?: string;
  
  // Warnings / Quality Flags
  suspiciousWarning?: string;
  isDoubleDeductionWarning?: boolean;
  isDuplicateCandidate?: boolean;
  
  // Notes & Audit
  notes?: string;
  lastCalculatedAt: string;
  lastModifiedBy?: string;
  auditTrail?: {
    timestamp: string;
    action: string;
    modifiedBy: string;
    previousValue?: number | string;
    newValue?: number | string;
    reason?: string;
  }[];
}

export interface BoqQualityDashboardData {
  totalItems: number;
  finalItems: number;
  requiresReviewItems: number;
  openItemsCount: number;
  conflictsCount: number;
  unverifiedItems: number;
  duplicateCandidatesCount: number;
  missingSourcesCount: number;
  missingFormulasCount: number;
  missingSpecsCount: number;
  zeroOrNegativeCount: number;
  suspiciousCount: number;
  overriddenCount: number;
  unprocessedDrawingsCount: number;
  completenessScorePercent: number;
  qualityGatePassed: boolean;
  blockingReasons: string[];
}

export interface DrawingCoverageItem {
  drawingNumber: string;
  drawingTitle: string;
  revision: string;
  disciplinesDetected: string[];
  isProcessed: boolean;
  isVerified: boolean;
  boqItemsGeneratedCount: number;
  pendingOpenItemsCount: number;
}

export interface BoqRevisionRecord {
  revisionCode: string; // e.g. "BOQ Rev 00", "BOQ Rev 01"
  createdDate: string;
  createdBy: string;
  reason: string;
  drawingRevisionBasis: string;
  totalItems: number;
  totalQuantitiesByDiscipline: { [discipline: string]: number };
  addedItemsCount: number;
  removedItemsCount: number;
  modifiedItemsCount: number;
  isFrozen: boolean;
  frozenAt?: string;
  frozenBy?: string;
  changeLog: {
    itemCode: string;
    description: string;
    changeType: 'ADDED' | 'REMOVED' | 'QUANTITY_CHANGE' | 'SPEC_CHANGE';
    oldValue?: string | number;
    newValue?: string | number;
    delta?: number;
    percentChange?: number;
  }[];
}

export interface ProjectAssumptionRecord {
  id: string;
  description: string;
  reason: string;
  enteredBy: string;
  date: string;
  relatedBoqItemCode?: string;
  status: 'ACTIVE' | 'SUPERSEDED' | 'REMOVED';
}

export interface ProjectExclusionRecord {
  id: string;
  description: string;
  reason: string;
  enteredBy: string;
  date: string;
  category: 'SITE_WORKS' | 'UTILITIES' | 'FURNITURE' | 'SPECIAL_EQUIPMENT' | 'OTHER';
}

export interface TenderPackageData {
  projectName: string;
  projectNumber: string;
  clientName: string;
  consultantName: string;
  generatedDate: string;
  currency: string;
  boqRevision: string;
  totalItemsCount: number;
  disciplinesSummary: {
    discipline: UnifiedBoqDiscipline;
    itemCount: number;
    totalAmount?: number;
  }[];
  assumptions: ProjectAssumptionRecord[];
  exclusions: ProjectExclusionRecord[];
  openItemsSummary: { openCount: number; resolvedCount: number };
  conflictsSummary: { openCount: number; resolvedCount: number };
  drawingsIncludedCount: number;
}

export interface BoqIntegrationTestResult {
  testId: number;
  name: string;
  category: 'STRUCTURAL' | 'ARCHITECTURAL' | 'MEP' | 'GOVERNANCE' | 'RECONCILIATION';
  status: 'PASSED' | 'FAILED';
  inputSummary: string;
  expectedOutput: string;
  actualOutput: string;
  formulaChecked: string;
  sourceChecked: string;
  details: string;
}

// ==========================================
// PHASE 10 — END-TO-END VALIDATION & HARDENING TYPES
// ==========================================

export interface ValidationToleranceSettings {
  rccTolerancePercent: number; // e.g. 0.5%
  rebarTolerancePercent: number; // e.g. 0.5%
  steelTolerancePercent: number; // e.g. 1.0%
  architecturalTolerancePercent: number; // e.g. 1.0%
  mepTolerancePercent: number; // e.g. 2.0%
  allowAbsoluteTolerance: number; // e.g. 0.05 units
}

export interface QuantityComparisonItem {
  id: string;
  itemCode: string;
  category: 'RCC' | 'REBAR' | 'STEEL' | 'MASONRY' | 'DOORS_WINDOWS' | 'FLOORING' | 'ROOF' | 'ELECTRICAL' | 'HVAC' | 'PLUMBING' | 'FIRE';
  elementName: string;
  unit: string;
  calculatedQuantity: number;
  referenceQuantity: number; // Known ground-truth validation reference
  difference: number; // Calculated - Reference
  differencePercent: number;
  status: 'PASS' | 'REVIEW' | 'FAIL';
  toleranceApplied: string;
  investigationReason?: string;
  formulaUsed: string;
  sourceDrawing: string;
  revision: string;
}

export type SmartReviewPriorityType =
  | 'MISSING_DIMENSION'
  | 'CONFLICTING_DIMENSION'
  | 'LOW_CONFIDENCE'
  | 'LARGE_QUANTITY_CHANGE'
  | 'DUPLICATE_CANDIDATE'
  | 'MISSING_SOURCE'
  | 'UNVERIFIED_BOQ';

export interface ReviewQueueItem {
  id: string;
  boqItemId?: string;
  elementId?: string;
  drawingNumber: string;
  priorityRank: number; // 1 (highest) to 7
  smartPriority: SmartReviewPriorityType;
  title: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  currentValue: string;
  suggestedAction: string;
  status: 'PENDING' | 'VERIFIED' | 'CORRECTED' | 'REJECTED' | 'OPEN_ITEM' | 'CONFLICT';
  handSketchAttached?: boolean;
  handSketchData?: {
    sketchName: string;
    uploadedAt: string;
    uploadedBy: string;
    dimensionProvided: string;
    notes: string;
  };
  auditHistory: {
    timestamp: string;
    user: string;
    action: string;
    note?: string;
  }[];
}

export interface TakeoffErrorReportItem {
  id: string;
  discipline: string;
  itemCode: string;
  issue: string;
  drawingNumber: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'WAIVED';
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface EndToEndTestResult {
  testId: number;
  phase: number;
  testName: string;
  category:
    | 'PIPELINE'
    | 'RCC'
    | 'REBAR'
    | 'STEEL'
    | 'MASONRY'
    | 'DOORS_WINDOWS'
    | 'FLOORING'
    | 'ROOF'
    | 'MEP'
    | 'OPEN_ITEMS'
    | 'CONFLICTS'
    | 'VERIFICATION'
    | 'REVISION'
    | 'PERFORMANCE'
    | 'ISOLATION';
  input: string;
  expectedResult: string;
  actualResult: string;
  status: 'PASS' | 'FAILED' | 'MOCKED' | 'NOT_IMPLEMENTED';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  executionTimeMs: number;
  details: string;
}

// =========================================================================
// PHASE 11: PROFESSIONAL EXCEL BOQ + BBS + TENDER EXPORT TYPES
// =========================================================================

export type ExcelExportType =
  | 'BOQ_SUMMARY'
  | 'BOQ_DETAILED'
  | 'BBS_SCHEDULE'
  | 'QUANTITY_ABSTRACT'
  | 'MATERIAL_SUMMARY'
  | 'DRAWING_REGISTER'
  | 'OPEN_ITEMS'
  | 'CONFLICTS'
  | 'REVISION_COMPARISON'
  | 'TENDER_PACKAGE'
  | 'COMPLETE_PROJECT';

export type ExcelExportMode = 'DRAFT' | 'REVIEW' | 'FINAL';

export interface ExportValidationRuleResult {
  ruleId: string;
  category: 'STRUCTURE' | 'QUANTITIES' | 'FORMULAS' | 'SOURCES' | 'CONFLICTS' | 'GOVERNANCE' | 'RECONCILIATION';
  ruleName: string;
  passed: boolean;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  message: string;
  affectedCount: number;
  details?: string[];
}

export interface ExportTotalReconciliation {
  boqGrandTotal: number;
  detailedBoqGrandTotal: number;
  boqDifference: number;
  boqMatched: boolean;
  
  bbsTotalWeightKg: number;
  rebarBoqWeightKg: number;
  rebarDifferenceKg: number;
  rebarMatched: boolean;
  
  steelSummaryTonne: number;
  steelBoqTonne: number;
  steelDifferenceTonne: number;
  steelMatched: boolean;
  
  mepItemsCount: number;
  mepBoqCount: number;
  mepMatched: boolean;

  abstractTotalItems: number;
  isAllReconciled: boolean;
}

export interface ExportValidationReport {
  timestamp: string;
  exportType: ExcelExportType;
  exportMode: ExcelExportMode;
  canExportFinal: boolean;
  canExportDraft: boolean;
  totalChecks: number;
  passedChecks: number;
  criticalErrorsCount: number;
  warningsCount: number;
  rules: ExportValidationRuleResult[];
  reconciliation: ExportTotalReconciliation;
}

export type ExportColorTheme = 'CORPORATE_BLUE' | 'PROFESSIONAL_TEAL' | 'DARK_GREY' | 'CORPORATE_GREEN';

export interface ExportSettingsConfig {
  currency: string;
  currencySymbol: string;
  decimalPlaces: {
    m3: number;
    m2: number;
    m: number;
    no: number;
    kg: number;
    tonne: number;
    rate: number;
    amount: number;
  };
  colorTheme: ExportColorTheme;
  companyName?: string;
  clientName?: string;
  consultantName?: string;
  contractorName?: string;
  preparedBy?: string;
  checkedBy?: string;
  approvedBy?: string;
  reportTitle?: string;
  revision?: string;
  enableVat?: boolean;
  vatRatePercent?: number; // e.g. 5%
  logoBase64?: string;
  fontFamily?: string;
  pageSize: 'A4' | 'A3';
  orientation: 'PORTRAIT' | 'LANDSCAPE';
  includeCover: boolean;
  includeFormulas: boolean;
  freezeHeaders: boolean;
  enableAutoFilter: boolean;
  protectFormulas: boolean;
  showComments: boolean;
  fileNamePrefix?: string;
}

export interface ExportHistoryRecord {
  id: string;
  fileName: string;
  exportType: ExcelExportType;
  exportMode: ExcelExportMode;
  boqRevision: string;
  drawingBasis: string;
  exportedBy: string;
  timestamp: string;
  totalItems: number;
  sheetsCount: number;
  fileSizeBytes: number;
  reconciliationStatus: 'PERFECT' | 'VARIANCE_ACCEPTABLE' | 'UNCHECKED';
  notes?: string;
}

export interface Phase11ExportTestResult {
  testId: number;
  testName: string;
  targetSheet: string;
  category: 'STRUCTURE' | 'FORMULAS' | 'BBS' | 'RECONCILIATION' | 'FORMATTING' | 'VALIDATION' | 'INTEGRITY';
  input: string;
  expected: string;
  actual: string;
  status: 'PASS' | 'FAILED' | 'MOCKED';
  executionTimeMs: number;
  notes: string;
}
