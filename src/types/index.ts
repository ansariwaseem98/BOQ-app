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
  | 'Tender Drawing'
  | 'Construction Drawing'
  | 'Shop Drawing'
  | 'Fabrication Drawing'
  | 'As-Built Drawing'
  | 'IFC / BIM'
  | 'Consultant Drawing'
  | 'Architectural'
  | 'Structural'
  | 'MEP'
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
  | 'UPLOADED'
  | 'PROCESSING'
  | 'READY'
  | 'PROCESSING_ERROR'
  | 'ARCHIVED';

export type DocumentAnalysisStatus = 
  | 'NOT_ANALYZED'
  | 'ANALYZED'
  | 'REQUIRES_REVIEW'
  | 'PARTIALLY_ANALYZED';

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
