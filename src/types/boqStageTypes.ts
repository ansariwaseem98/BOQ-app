/**
 * BOQ Engine — Core Stage Types & Data Models (Stages 0 to 8)
 * 
 * Supports the multi-stage incremental BOQ Engine architecture:
 * Stage 0: Project Setup & State Initialization (AED Native)
 * Stage 1: Drawing Input, Vector CAD Extraction, and 2-Point Scale Calibration
 * Stage 2: Element Detection & Classification (Walls, Columns, Doors, Windows, Slabs)
 * Stage 3: Measurement Rules & Deduction Engine
 * Stage 4: Rate Library Integration & Rate Breakdown (AED)
 * Stage 5: BOQ Structure Assembly & Master Matrix
 * Stage 6: Commercial Layer (Markup, Profit, VAT, Currency)
 * Stage 7: Reconciliation & Traceability (Audit Logs, Drawing Highlighting)
 * Stage 8: Reporting, Verification & Excel/PDF Exports
 */

export type DrawingSourceFormat = 'DXF' | 'DWG' | 'PDF' | 'PNG' | 'JPG' | 'IFC';

export interface CalibrationPoint {
  x: number;
  y: number;
}

export interface DrawingCalibrationData {
  calibrated: boolean;
  point1: CalibrationPoint | null;
  point2: CalibrationPoint | null;
  pixelDistance: number;
  realWorldDistance: number;
  unit: 'm' | 'mm' | 'cm' | 'ft' | 'in' | string;
  pixelsPerUnit: number;
  scaleRatio: string;
  calibratedAt?: string;
  calibratedBy?: string;
  referenceDescription?: string;
}

export interface DrawingLayerInfo {
  name: string;
  entityCount: number;
  color?: string;
  visible: boolean;
}

export type CadElementType =
  | 'line'
  | 'polyline'
  | 'arc'
  | 'circle'
  | 'text'
  | 'block'
  | 'hatch'
  | 'dimension'
  | 'LINE'
  | 'POLYLINE'
  | 'ARC'
  | 'CIRCLE'
  | 'TEXT'
  | 'BLOCK'
  | 'HATCH'
  | 'DIMENSION';

export interface NormalizedCadElement {
  id: string;
  type: CadElementType;
  layer: string;
  points: CalibrationPoint[];
  color?: string;
  lineWeight?: number;
  classifiedCategory?: string;
  confidenceScore?: number;
  text?: string;
  blockName?: string;
  properties?: Record<string, any>;
}

export interface StageDrawingDocument {
  id: string;
  name: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  isVector: boolean;
  layers: DrawingLayerInfo[];
  elements: NormalizedCadElement[];
  scale: DrawingCalibrationData;
  dimensionsFound?: number;
  blocksFound?: number;
  thumbnailUrl?: string;
}

export interface StageRateLibraryItem {
  itemCode: string;
  description: string;
  specification: string;
  unit: string;
  materialRate: number;
  laborRate: number;
  equipmentRate: number;
  subcontractRate: number;
  unitRate: number;
  currency: string;
  supplier?: string;
  source: string;
  date: string;
  location?: string;
  remarks?: string;
  isRateRequired?: boolean;
}

export interface CalculationTraceInfo {
  formulaText: string;
  measuredQuantity: number;
  unit: string;
  appliedUnitRate: number;
  currency: string;
  sourceRateCode?: string;
  sourceRateName?: string;
  rateSourceType?: string;
  calculatedAmount: number;
}

export interface StageBoqRow {
  itemNo: string;
  itemCode?: string;
  sectionCode?: string;
  sectionTitle?: string;
  description: string;
  specification: string;
  unit: string;
  quantity: number;
  materialRate?: number;
  laborRate?: number;
  equipmentRate?: number;
  subcontractRate?: number;
  unitRate: number;
  amount: number;
  totalAmount?: number;
  currency: string;
  rateSource: string;
  calculationTrace: string;
  status: 'PRICED' | 'RATE REQUIRED' | 'RATE_REQUIRED';
  isRateRequired: boolean;
  rateRemarks?: string;
  rateDate?: string;
  tradeSection?: string;
  isPriced?: boolean;
  sourceDrawingId?: string;
  associatedElementIds?: string[];
}

export interface StageAuditLogEntry {
  id: string;
  timestamp: string;
  stage: number;
  action: string;
  user: string;
  details: string;
}

export interface StageCentralProject {
  id: string;
  name?: string;
  projectName?: string;
  client?: string;
  clientName?: string;
  projectNumber?: string;
  location?: string;
  currency: string;
  currencyName?: string;
  currencySymbol?: string;
  vatPercentage: number;
  markupPercentage: number;
  currentStage: number; // 0 = Project Setup, 1 = Drawing & Calibration, 2 = Detection...
  isStageConfirmed?: { [stage: number]: boolean };
  activeDrawing: StageDrawingDocument | null;
  drawings: StageDrawingDocument[];
  rateLibrary: StageRateLibraryItem[];
  quantityTable?: any[];
  boqOutput?: any[];
  auditLog?: StageAuditLogEntry[];
  auditLogs?: StageAuditLogEntry[];
  createdAt?: string;
  updatedAt?: string;
}
