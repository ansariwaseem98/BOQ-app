/**
 * Phase 15F — Master BOQ Assembly & Professional Excel Engine Types
 */

export type BOQSectionCode =
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'F'
  | 'G'
  | 'H'
  | 'I'
  | 'J'
  | 'K'
  | 'L'
  | 'M'
  | 'N'
  | 'O'
  | 'P'
  | 'Q'
  | 'R'
  | 'S'
  | 'T'
  | 'U'
  | 'V'
  | 'W'
  | 'X'
  | 'Y'
  | 'Z'
  | 'AA'
  | string;

export interface BOQSectionDefinition {
  code: BOQSectionCode;
  letter: string;
  name: string;
  discipline: string;
  defaultUnit: string;
  standardWorkScope: string;
  isCustom?: boolean;
}

export type BOQItemStatus =
  | 'AI EXTRACTED'
  | 'CALCULATED'
  | 'REVIEW REQUIRED'
  | 'USER CORRECTED'
  | 'VERIFIED'
  | 'CONFLICT'
  | 'SUPERSEDED';

export type BOQNumberingStyle = 'NUMERIC' | 'DECIMAL' | 'ALPHANUMERIC' | 'CUSTOM';

export type BOQViewMode =
  | 'TENDER'
  | 'INTERNAL_ESTIMATION'
  | 'CLIENT'
  | 'CONTRACTOR'
  | 'PROCUREMENT'
  | 'AUDIT'
  | 'SUMMARIES'
  | 'RECONCILIATION'
  | 'QUALITY_GATE'
  | 'REVISIONS'
  | 'PROJECT_FOLDERS';

export type RateStatus = 'NOT PRICED' | 'USER ENTERED' | 'IMPORTED' | 'VERIFIED';

export type BOQWorkflowState =
  | 'DRAFT'
  | 'CALCULATED'
  | 'REVIEW'
  | 'VERIFIED'
  | 'APPROVED'
  | 'FROZEN'
  | 'SUPERSEDED';

export interface BOQDeductionItem {
  id: string;
  name: string;
  deductionQuantity: number;
  unit: string;
  formula: string;
  sourceOpeningMark?: string;
  lengthM?: number;
  widthM?: number;
  heightM?: number;
  count?: number;
}

export interface BOQDescriptionEditRecord {
  id: string;
  timestamp: string;
  user: string;
  originalDescription: string;
  editedDescription: string;
  reason: string;
}

export interface BOQQuantityEditRecord {
  id: string;
  timestamp: string;
  user: string;
  originalQuantity: number;
  editedQuantity: number;
  unit: string;
  reason: string;
  affectedCalculations?: string[];
}

export interface BOQItemObject {
  boqId: string;
  section: string; // e.g. "D. RCC"
  sectionCode: string; // e.g. "D"
  subsection: string; // e.g. "D.01 Beams"
  itemNumber: string; // e.g. "D-01", "4.1", "1"
  itemCode: string; // e.g. "RCC-BM-01"
  description: string;
  specification: string;
  location: string;
  level: string; // e.g. "Ground Floor", "Level 01", "Roof"
  zone: string; // e.g. "Block A", "Warehouse Area", "Plant Room"
  quantity: number;
  unit: string; // "m³", "m²", "m", "kg", "tonne", "No.", "Nos", "set", "lot", "item", "point", "room"
  rate: number;
  amount: number;
  formula: string;
  calculationId: string;
  sourceDrawing: string;
  sourceRegion: string;
  discipline: string; // "Civil", "RCC", "Rebar", "Steel", "Architectural", "Roofing", "Electrical", "HVAC", "Plumbing", "Fire", "ELV"
  status: BOQItemStatus;
  revision: string; // e.g. "Rev 01"
  remarks: string;

  // Deductions & Math Breakdown
  grossQuantity: number;
  deductionsTotal: number;
  netQuantity: number;
  deductionsBreakdown: BOQDeductionItem[];

  // Calculation Inputs
  inputs?: Record<string, number | string>;
  dimensions?: {
    lengthM?: number;
    widthM?: number;
    heightM?: number;
    depthM?: number;
    thicknessMm?: number;
    diameterMm?: number;
    count?: number;
    areaM2?: number;
    [key: string]: any;
  };

  // Audit & Edit Histories
  originalDescription?: string;
  originalQuantity?: number;
  originalRate?: number;
  descriptionEditHistory: BOQDescriptionEditRecord[];
  quantityEditHistory: BOQQuantityEditRecord[];

  // Multi-link Provenance
  multipleCalculations: string[];
  multipleDrawings: string[];
  multipleSourceRegions: string[];
  multipleElementIds: string[];

  // Procurement & Wastage
  wastagePercent: number; // e.g. 3 for 3%
  procurementQuantity: number; // quantity * (1 + wastagePercent/100)

  // Pricing Fields
  currency: string;
  rateSource: string;
  rateDate: string;
  supplier: string;
  rateStatus: RateStatus;

  // Quality & Void Controls
  isVoid?: boolean;
  voidReason?: string;
  openItemId?: string;
  conflictId?: string;
  isDuplicateCandidate?: boolean;
}

export interface InputImpactAnalysis {
  inputKey: string;
  oldValue: number | string;
  newValue: number | string;
  unit?: string;
  affectedBoqItems: {
    boqId: string;
    itemCode: string;
    description: string;
    discipline: string;
    oldQuantity: number;
    newQuantity: number;
    difference: number;
    percentChange: number;
    unit: string;
  }[];
  unaffectedDisciplines: string[];
  requiresConfirmation: boolean;
}

export interface BOQTradeSummary {
  sectionCode: string;
  sectionName: string;
  discipline: string;
  itemCount: number;
  verifiedCount: number;
  reviewCount: number;
  openItemsCount: number;
  conflictsCount: number;
  totalQuantity: number;
  primaryUnit: string;
  totalAmount: number;
}

export interface BOQLevelSummary {
  level: string;
  civilAmount: number;
  rccAmount: number;
  rebarAmount: number;
  steelAmount: number;
  archAmount: number;
  roofAmount: number;
  mepAmount: number;
  totalAmount: number;
  itemCount: number;
  quantitiesSummary: { [unit: string]: number };
}

export interface BOQZoneSummary {
  zone: string;
  itemCount: number;
  totalAmount: number;
  disciplines: string[];
  verifiedPercent: number;
}

export interface BOQDrawingSummary {
  drawingNumber: string;
  drawingTitle: string;
  revision: string;
  discipline: string;
  itemsCount: number;
  totalQuantity: number;
  status: string;
  verifiedCount: number;
  pendingCount: number;
}

export interface BOQDisciplineSummary {
  discipline: string;
  itemCount: number;
  verifiedCount: number;
  reviewCount: number;
  conflictCount: number;
  totalAmount: number;
  completionPercent: number;
}

export interface BOQMaterialSummary {
  material: string;
  category: string;
  specification: string;
  unit: string;
  verifiedQuantity: number;
  totalQuantity: number;
  procurementQuantity: number;
  sourceSummary: string;
  disciplines: string[];
}

export interface BOQBbsSummaryItem {
  diameterMm: number;
  totalLengthM: number;
  totalWeightKg: number;
  totalWeightTonne: number;
  grade: string;
  memberTypes: string[];
  levels: string[];
}

export interface BOQSteelSummaryItem {
  sectionName: string;
  sectionType: string;
  totalLengthM: number;
  quantityCount: number;
  totalWeightKg: number;
  totalWeightTonne: number;
  grade: string;
}

export interface BOQRoofSummary {
  grossRoofAreaM2: number;
  skylightAreaM2: number;
  openingsDeductionM2: number;
  netCladdingAreaM2: number;
  purlinsTotalLengthM: number;
  purlinsWeightKg: number;
  flashingLengthM: number;
  guttersLengthM: number;
  insulationAreaM2: number;
  waterproofingAreaM2: number;
  reconciled: boolean;
}

export interface BOQMepSummary {
  electricalCount: number;
  electricalAmount: number;
  hvacCount: number;
  hvacAmount: number;
  plumbingCount: number;
  plumbingAmount: number;
  fireCount: number;
  fireAmount: number;
  elvCount: number;
  elvAmount: number;
  supportsCount: number;
  supportsAmount: number;
  totalMepAmount: number;
  reconciled: boolean;
}

export interface BOQReconciliationItem {
  discipline: string;
  sourceModule: string;
  sourceTotal: number;
  boqTotal: number;
  unit: string;
  difference: number;
  status: 'RECONCILED' | 'RECONCILIATION ERROR';
  toleranceApplied: string;
  details: string;
}

export interface BOQReconciliationMasterReport {
  rccDetailedM3: number;
  rccBoqM3: number;
  rccDiffM3: number;
  rccReconciled: boolean;

  bbsTotalWeightKg: number;
  rebarBoqWeightKg: number;
  rebarDiffKg: number;
  rebarReconciled: boolean;

  steelDetailedTonne: number;
  steelBoqTonne: number;
  steelDiffTonne: number;
  steelReconciled: boolean;

  grossRoofAreaM2: number;
  skylightAreaM2: number;
  netCladdingAreaM2: number;
  roofBoqAreaM2: number;
  roofReconciled: boolean;

  mepDetailedEquipmentCount: number;
  mepBoqEquipmentCount: number;
  mepReconciled: boolean;

  allDisciplinesReconciled: boolean;
  disciplineTable: BOQReconciliationItem[];
}

export interface BOQQualityCheckItem {
  checkId: string;
  checkName: string;
  category: 'DUPLICATE' | 'MISSING_UNIT' | 'MISSING_QUANTITY' | 'SOURCE' | 'OPEN_ITEM' | 'CONFLICT' | 'CALCULATION' | 'REVISION' | 'FORMULA' | 'RECONCILIATION';
  status: 'PASS' | 'WARNING' | 'FAIL';
  message: string;
  affectedItemsCount: number;
  affectedItemCodes?: string[];
}

export interface BOQCompletenessMasterReport {
  totalItems: number;
  verifiedItems: number;
  reviewItems: number;
  openItemsCount: number;
  conflictsCount: number;
  userCorrectedCount: number;
  supersededCount: number;
  voidCount: number;

  verifiedPercent: number;
  reviewPercent: number;
  openPercent: number;
  conflictPercent: number;
  overallCompletenessScore: number;

  drawingsCoverage: {
    uploaded: number;
    processed: number;
    withErrors: number;
    withOpenItems: number;
    withConflicts: number;
    fullyReviewed: number;
  };

  disciplineCompleteness: { [discipline: string]: number };
  qualityChecks: BOQQualityCheckItem[];

  finalAcceptanceStatus: 'PROFESSIONAL BOQ VERIFIED & APPROVED' | 'BOQ READY FOR HUMAN REVIEW' | 'BLOCKED BY CRITICAL ERRORS';
  canExportApproved: boolean;
  evaluationTimestamp?: string;

  // Human Override
  isOverridden: boolean;
  overrideReason?: string;
  overrideUser?: string;
  overrideDate?: string;
}

export interface BOQProjectFolderStructure {
  name: string;
  path: string;
  description: string;
  filesCount: number;
  subfolders?: BOQProjectFolderStructure[];
}

export interface BOQSignOffRecord {
  preparedBy: string;
  preparedDate: string;
  checkedBy: string;
  checkedDate: string;
  approvedBy: string;
  approvedDate: string;
  tenderNumber: string;
  revision: string;
  remarks: string;
}

export interface ExcelWorkbookExportConfig {
  projectName: string;
  projectNumber: string;
  clientName: string;
  consultantName: string;
  currency: string;
  revision: string;
  signOff: BOQSignOffRecord;
  exportPreset?: 'FULL_35_SHEET_MASTER' | 'SUMMARY_ONLY' | 'MEP_ONLY' | 'STRUCTURAL_CIVIL_ONLY';
  includeFormulas?: boolean;
  preparedBy?: string;
  date?: string;
  revisionHistory?: any[];
}

export type BOQExcelExportConfig = ExcelWorkbookExportConfig;

export interface BOQSheetMeta {
  sheetIndex: string;
  sheetName: string;
  description: string;
  category: 'Admin' | 'BOQ' | 'Discipline' | 'MEP' | 'Summary' | 'Audit';
}

export const STANDARD_35_SHEETS: BOQSheetMeta[] = [
  { sheetIndex: '01', sheetName: '01_COVER', description: 'Cover Page & Governance Sign-Off', category: 'Admin' },
  { sheetIndex: '02', sheetName: '02_PROJECT_INFO', description: 'Project & Contract Information', category: 'Admin' },
  { sheetIndex: '03', sheetName: '03_BOQ', description: 'Master Summary BOQ & Pricing Schedule', category: 'BOQ' },
  { sheetIndex: '04', sheetName: '04_BOQ_DETAILED', description: 'Detailed BOQ with Full Math & Provenance', category: 'BOQ' },
  { sheetIndex: '05', sheetName: '05_EARTHWORK', description: 'Earthwork & Excavation Schedule', category: 'Discipline' },
  { sheetIndex: '06', sheetName: '06_PCC', description: 'Plain Cement Concrete (PCC) Blinding', category: 'Discipline' },
  { sheetIndex: '07', sheetName: '07_RCC', description: 'Reinforced Cement Concrete (RCC) Works', category: 'Discipline' },
  { sheetIndex: '08', sheetName: '08_REBAR', description: 'High Yield TMT Steel Reinforcement (BBS)', category: 'Discipline' },
  { sheetIndex: '09', sheetName: '09_FORMWORK', description: 'Formwork & Shuttering Systems', category: 'Discipline' },
  { sheetIndex: '10', sheetName: '10_MASONRY', description: 'AAC & Solid Block Masonry Works', category: 'Discipline' },
  { sheetIndex: '11', sheetName: '11_DPC', description: 'Damp Proof Course (DPC) & Plinth Seal', category: 'Discipline' },
  { sheetIndex: '12', sheetName: '12_STRUCTURAL_STEEL', description: 'Structural Steel Framing & Trusses', category: 'Discipline' },
  { sheetIndex: '13', sheetName: '13_PURLINS', description: 'Cold-Formed Z & C Purlins / Girts', category: 'Discipline' },
  { sheetIndex: '14', sheetName: '14_ROOFING', description: 'Insulated Sandwich Roof Cladding', category: 'Discipline' },
  { sheetIndex: '15', sheetName: '15_SKYLIGHT', description: 'Polycarbonate Multiwall Skylights', category: 'Discipline' },
  { sheetIndex: '16', sheetName: '16_DOORS_WINDOWS', description: 'Doors, Windows & Ironmongery', category: 'Discipline' },
  { sheetIndex: '17', sheetName: '17_PLASTER', description: 'Internal & External Plaster Works', category: 'Discipline' },
  { sheetIndex: '18', sheetName: '18_FINISHES', description: 'Floor, Wall & Ceiling Finishes', category: 'Discipline' },
  { sheetIndex: '19', sheetName: '19_WATERPROOFING', description: 'Substructure & Roof Waterproofing', category: 'Discipline' },
  { sheetIndex: '20', sheetName: '20_ELECTRICAL', description: 'Electrical Power, Lighting & DBs', category: 'MEP' },
  { sheetIndex: '21', sheetName: '21_HVAC', description: 'HVAC Air Handling, VRF & Ducting', category: 'MEP' },
  { sheetIndex: '22', sheetName: '22_PLUMBING', description: 'Water Supply & Sanitary Drainage', category: 'MEP' },
  { sheetIndex: '23', sheetName: '23_FIRE_FIGHTING', description: 'Fire Protection Sprinklers & Pumps', category: 'MEP' },
  { sheetIndex: '24', sheetName: '24_ELV', description: 'Extra Low Voltage, Fire Alarm & CCTV', category: 'MEP' },
  { sheetIndex: '25', sheetName: '25_EXTERNAL_WORKS', description: 'External Infrastructure & Paving', category: 'Discipline' },
  { sheetIndex: '26', sheetName: '26_MATERIAL_SUMMARY', description: 'Comprehensive Material Schedule', category: 'Summary' },
  { sheetIndex: '27', sheetName: '27_LEVEL_SUMMARY', description: 'Building Level-Wise Cost & Qty Breakdown', category: 'Summary' },
  { sheetIndex: '28', sheetName: '28_TRADE_SUMMARY', description: 'Trade-Wise BOQ Summary (A to AA)', category: 'Summary' },
  { sheetIndex: '29', sheetName: '29_DRAWING_REGISTER', description: 'Drawing Traceability Register', category: 'Audit' },
  { sheetIndex: '30', sheetName: '30_CALCULATION_REGISTER', description: 'Calculation Math Derivation Register', category: 'Audit' },
  { sheetIndex: '31', sheetName: '31_OPEN_ITEMS', description: 'Open Clarifications & RFI Register', category: 'Audit' },
  { sheetIndex: '32', sheetName: '32_CONFLICTS', description: 'Inter-Disciplinary Conflict Register', category: 'Audit' },
  { sheetIndex: '33', sheetName: '33_USER_CORRECTIONS', description: 'Manual Override & Audit Trail Register', category: 'Audit' },
  { sheetIndex: '34', sheetName: '34_REVISION_HISTORY', description: 'BOQ Revision & Snapshot History', category: 'Audit' },
  { sheetIndex: '35', sheetName: '35_ASSUMPTIONS', description: 'Project Assumptions & Exclusions Log', category: 'Audit' }
];
