/**
 * AI BOQ & Tender Estimation Engineer - Phase 15A Professional Measurement & Calculation Engine
 * Master Type Definitions
 */

export type CalculationStatus =
  | 'DRAFT'
  | 'CALCULATED'
  | 'REVIEW_REQUIRED'
  | 'VERIFIED'
  | 'USER_CORRECTED'
  | 'CONFLICT'
  | 'SUPERSEDED'
  | 'REJECTED'
  | 'MISSING_INPUT';

export type RoundingRule =
  | 'NONE'
  | 'DECIMAL_2'
  | 'DECIMAL_3'
  | 'DECIMAL_4'
  | 'INTEGER'
  | 'CEIL_INTEGER';

export type UnitCategory =
  | 'LENGTH'
  | 'AREA'
  | 'VOLUME'
  | 'WEIGHT'
  | 'REINFORCEMENT'
  | 'ANGLE'
  | 'COUNT'
  | 'PERCENTAGE'
  | 'CUSTOM';

export type LengthUnit = 'mm' | 'cm' | 'm' | 'ft' | 'in';
export type AreaUnit = 'mm²' | 'cm²' | 'm²' | 'ft²';
export type VolumeUnit = 'mm³' | 'cm³' | 'm³' | 'ft³';
export type WeightUnit = 'g' | 'kg' | 'tonne';
export type AngleUnit = 'degree' | 'radian';

export type MeasurementCategory =
  | 'EXCAVATION'
  | 'PCC'
  | 'RCC'
  | 'MASONRY'
  | 'PLASTER'
  | 'PAINT'
  | 'FLOOR_FINISH'
  | 'WATERPROOFING'
  | 'ROOF'
  | 'CLADDING'
  | 'PURLIN'
  | 'SKYLIGHT'
  | 'STEEL'
  | 'PIPE'
  | 'DUCT'
  | 'CABLE'
  | 'FIXTURE'
  | 'LINEAR'
  | 'AREA'
  | 'VOLUME'
  | 'WEIGHT'
  | 'COUNT'
  | 'COMPOSITE'
  | 'PERCENTAGE';

export type MeasurementType =
  | 'LINEAR'
  | 'AREA'
  | 'VOLUME'
  | 'WEIGHT'
  | 'COUNT'
  | 'PERCENTAGE'
  | 'COMPOSITE';

export type DimensionSourceType =
  | 'EXPLICIT_CAD'
  | 'OCR_TEXT'
  | 'MEASURED_GEOMETRY'
  | 'DERIVED_CALCULATION'
  | 'SCHEDULE'
  | 'USER_CORRECTED'
  | 'IFC_PROPERTY'
  | 'SPECIFICATION'
  | 'UNKNOWN';

export interface SourceRegionRef {
  drawingNumber: string;
  drawingTitle?: string;
  page: number;
  revision: string;
  discipline: string;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  callout?: string;
}

export interface InputConflictDetail {
  sourceA: {
    drawing: string;
    revision: string;
    value: number;
    unit: string;
    description: string;
  };
  sourceB: {
    drawing: string;
    revision: string;
    value: number;
    unit: string;
    description: string;
  };
  discrepancyMm: number;
}

export interface CalculationInput {
  inputId: string;
  name: string;
  description?: string;
  value: number; // Normalized numeric value used in calculations
  unit: string; // Normalized unit
  originalValue: number | string; // What was read from drawing
  originalUnit: string; // Original unit text
  normalizedValue: number;
  normalizedUnit: string;
  source: DimensionSourceType;
  sourceRegion?: SourceRegionRef;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
  status: 'VALID' | 'MISSING' | 'UNCLEAR' | 'CONFLICT' | 'USER_CORRECTED';
  userEditable: boolean;
  lastModified: string;
  conflictDetails?: InputConflictDetail;
  derivedFormula?: string;
}

export interface CalculationDeduction {
  deductionId: string;
  name: string;
  type: 'DOOR' | 'WINDOW' | 'OPENING' | 'BEAM_CUTOUT' | 'SLAB_OPENING' | 'VOID' | 'CUSTOM';
  formula: string;
  inputs: Record<string, number>;
  substitution: string;
  grossDeduction: number;
  unit: string;
  sourceDrawing: string;
  sourceRegion?: SourceRegionRef;
  isDuplicate?: boolean;
}

export interface CalculationAuditEntry {
  id: string;
  timestamp: string;
  user: string;
  fieldChanged: string;
  beforeValue: any;
  afterValue: any;
  difference?: number;
  differencePercent?: number;
  reason: string;
  source: string;
}

export interface CalculationObject {
  calculationId: string;
  projectId: string;
  drawingId: string;
  revision: string;
  elementId: string;
  boqItemId: string;
  itemCode?: string;
  description: string;
  category: MeasurementCategory;
  measurementType: MeasurementType;
  templateId?: string;
  inputs: CalculationInput[];
  formula: string;
  formulaVersion: string; // e.g. "V1.0", "V1.1"
  formulaExpression: string; // Internal algebraic form
  substitution: string; // e.g. "6.000 × 3.000 × 0.230"
  intermediateResults: Record<string, number | string>;
  grossResult: number;
  deductions: CalculationDeduction[];
  totalDeduction: number;
  rawResult: number; // Full precision
  displayedResult: number; // Rounded per rule
  instances: number;
  instanceSource: 'DRAWING_COUNT' | 'SCHEDULE' | 'CAD_BLOCKS' | 'IFC_INSTANCES' | 'USER_INPUT' | 'UNKNOWN';
  unit: string;
  roundingRule: RoundingRule;
  source: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  status: CalculationStatus;
  qualityGate: {
    passed: boolean;
    missingInputs: string[];
    warnings: string[];
    conflicts: string[];
    openItems: string[];
  };
  auditTrail: CalculationAuditEntry[];
  createdBy: string;
  createdDate: string;
  modifiedBy: string;
  modifiedDate: string;
  isSuperseded?: boolean;
  supersededByCalcId?: string;
  snapshotId?: string;
  dependentCalculationIds?: string[];
}

export interface DependencyNode {
  nodeId: string;
  type: 'INPUT' | 'INTERMEDIATE' | 'CALCULATION' | 'BOQ_ITEM' | 'COST';
  name: string;
  currentValue: number | string;
  unit: string;
  calculationId?: string;
  dependencies: string[]; // Node IDs that this depends on
  dependents: string[]; // Node IDs that depend on this
}

export interface DownstreamImpactResult {
  inputName: string;
  oldValue: number;
  newValue: number;
  unit: string;
  affectedCalculations: {
    calculationId: string;
    description: string;
    oldGross: number;
    newGross: number;
    oldNet: number;
    newNet: number;
    unit: string;
    diffQuantity: number;
    diffPercent: number;
  }[];
  affectedBoqItems: {
    boqItemId: string;
    itemCode: string;
    description: string;
    oldTotalQty: number;
    newTotalQty: number;
    unit: string;
    unitRate?: number;
    oldCost?: number;
    newCost?: number;
    costDiff?: number;
  }[];
  unaffectedCount: number;
}

export interface ProjectMeasurementSettings {
  lengthUnit: 'm' | 'mm' | 'ft';
  areaUnit: 'm²' | 'ft²';
  volumeUnit: 'm³' | 'ft³';
  weightUnit: 'kg' | 'tonne';
  quantityPrecision: 2 | 3 | 4;
  roundingRule: RoundingRule;
  wasteRule: number; // e.g. 0% or 5%
  deductionRule: 'STRICT_FULL_DEDUCTION' | 'STANDARD_IS1200' | 'CUSTOM';
  measurementStandard: 'Custom' | 'IS1200' | 'POMI' | 'NRM2' | 'CESMM4';
  currency: string;
  formulaLock: boolean;
}

export type EngineeringTemplate = CalculationTemplate;

export interface CalculationTemplate {
  templateId: string;
  itemCode: string;
  name: string;
  description: string;
  category: MeasurementCategory;
  unit: string;
  measurementType: MeasurementType;
  formula: string;
  formulaDisplay: string;
  requiredInputs: {
    key: string;
    name: string;
    unit: string;
    defaultVal?: number;
    description: string;
  }[];
  standardInputs?: {
    name: string;
    unit: string;
    defaultVal: number;
    description?: string;
  }[];
  optionalInputs: {
    key: string;
    name: string;
    unit: string;
    defaultVal?: number;
    description: string;
  }[];
  deductionSupported: boolean;
  defaultPrecision: number;
}

export interface CalculationTestResult {
  testNumber: number;
  name: string;
  category: string;
  description: string;
  inputs: Record<string, any>;
  expected: any;
  actual: any;
  passed: boolean;
  executionTimeMs: number;
  notes: string;
}

export interface BoqAggregatedQuantityRecord {
  boqItemId: string;
  itemCode: string;
  description: string;
  unit: string;
  totalQuantity: number;
  verifiedQuantity: number;
  pendingReviewQuantity: number;
  calculationsCount: number;
  calculations: {
    calculationId: string;
    description: string;
    quantity: number;
    status: CalculationStatus;
    formula: string;
    substitution: string;
    sourceDrawing: string;
  }[];
  unitRate?: number;
  totalAmount?: number;
  currency: string;
  status: 'ALL_VERIFIED' | 'NEEDS_REVIEW' | 'HAS_CONFLICTS' | 'INCOMPLETE';
}
