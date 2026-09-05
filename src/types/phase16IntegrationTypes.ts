export type WorkflowStageId =
  | 'PROJECT'
  | 'DRAWINGS'
  | 'DRAWING_CLASSIFICATION'
  | 'DRAWING_EXTRACTION'
  | 'ELEMENT_DETECTION'
  | 'SOURCE_TRACEABILITY'
  | 'CALCULATION'
  | 'OPEN_ITEMS_CONFLICTS'
  | 'HUMAN_CORRECTION'
  | 'VERIFICATION'
  | 'BOQ_ASSEMBLY'
  | 'RECONCILIATION'
  | 'EXCEL'
  | 'FINAL_REPORT';

export type StageExecutionStatus = 'COMPLETE' | 'IN_PROGRESS' | 'PENDING' | 'BLOCKED' | 'WARNING';

export interface WorkflowStageMeta {
  id: WorkflowStageId;
  order: number;
  label: string;
  shortCode: string;
  description: string;
  targetTab: string;
  status: StageExecutionStatus;
  metrics: string;
  traceEvidence: string;
}

export interface TraceableChainRecord {
  boqItemId: string;
  boqItemCode: string;
  description: string;
  finalQuantity: number;
  unit: string;
  status: 'VERIFIED' | 'REVIEW REQUIRED' | 'CONFLICT' | 'USER CORRECTED';
  calculationId: string;
  formula: string;
  inputs: Record<string, number | string>;
  grossQuantity: number;
  deductions: { id: string; label: string; value: number; unit: string }[];
  netQuantity: number;
  elementId: string;
  elementName: string;
  discipline: string;
  level: string;
  drawingId: string;
  drawingNumber: string;
  drawingName: string;
  drawingRevision: string;
  pageNumber: number;
  sourceRegion: string;
  boundingBox?: { x: number; y: number; width: number; height: number };
  sourceGeometrySnippet?: string;
  lastAuditedBy?: string;
  auditTimestamp?: string;
}

export type TestExecutionStatus = 'PASS' | 'FAIL' | 'WARNING' | 'BLOCKED' | 'MOCKED' | 'NOT_IMPLEMENTED';
export type TestSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface Phase16TestAssertion {
  testId: number;
  sectionNumber: number;
  module: string;
  testName: string;
  category:
    | 'DATA_FLOW'
    | 'ISOLATION'
    | 'TRACEABILITY'
    | 'CAD_IFC'
    | 'OPEN_ITEMS'
    | 'CONFLICTS'
    | 'DEPENDENCY'
    | 'RCC'
    | 'REBAR'
    | 'STEEL'
    | 'ROOF'
    | 'MEP'
    | 'ARCHITECTURAL'
    | 'REVISION'
    | 'USER_CORRECTION'
    | 'BOQ_ASSEMBLY'
    | 'RECONCILIATION'
    | 'EXCEL_PDF'
    | 'QUALITY_GATE'
    | 'ACCURACY_SAFETY'
    | 'PERFORMANCE';
  inputDescription: string;
  expectedResult: string;
  actualResult: string;
  status: TestExecutionStatus;
  severity: TestSeverity;
  errorDetail?: string;
  suggestedAction?: string;
  executionTimeMs: number;
}

export interface Phase16QualityScorecard {
  sourceCoveragePercent: number;
  calculationCoveragePercent: number;
  verificationCoveragePercent: number;
  reconciliationPassPercent: number;
  openItemResolutionPercent: number;
  conflictResolutionPercent: number;
  systemHealth: 'PASS' | 'WARNING' | 'FAIL';
  healthReason: string;

  totalTests: number;
  passedTests: number;
  failedTests: number;
  warningTests: number;
  mockedTests: number;
  notImplementedCount: number;

  criticalErrors: number;
  highErrors: number;
  mediumErrors: number;
  lowErrors: number;
  corePassRatePercent: number;
}

export interface Phase16ProjectFolderItem {
  id: string;
  folderName: string;
  path: string;
  description: string;
  itemCount: number;
  lastUpdated: string;
  verified: boolean;
}

export interface Phase16ExecutiveReport {
  integrationStatus: string;
  modulesConnected: string[];
  dataFlowStatus: string;
  sourceTraceabilityStatus: string;
  openItemStatus: string;
  conflictStatus: string;
  revisionStatus: string;
  dependencyStatus: string;
  boqIntegrationStatus: string;
  excelStatus: string;
  pdfStatus: string;
  persistenceStatus: string;
  projectIsolationStatus: string;
  performanceSummary: string;
  criticalErrorsCount: number;
  highErrorsCount: number;
  warningsCount: number;
  testsPassedCount: number;
  testsFailedCount: number;
  featuresMocked: string[];
  featuresNotYetImplemented: string[];
  knownLimitations: string[];
  recommendedNextPhase: string;
  engineeringDisclaimer: string;
}
