/**
 * AI BOQ & Tender Estimation Engineer - Phase 13: Professional Tender Management Types
 */

import { UnifiedBoqDiscipline, UnifiedBoqItem } from './index';
import { RateAnalysisRecord, PricingScenario } from './rateAnalysis';

export type TenderStatus = 
  | 'DRAFT'
  | 'UNDER_REVIEW'
  | 'READY_FOR_SUBMISSION'
  | 'SUBMITTED'
  | 'AWARDED'
  | 'NOT_AWARDED'
  | 'CANCELLED'
  | 'ARCHIVED';

export type TenderType = 
  | 'OPEN_TENDER'
  | 'SELECTIVE_TENDER'
  | 'NEGOTIATED'
  | 'DESIGN_AND_BUILD'
  | 'FRAMEWORK'
  | 'TWO_STAGE_TENDER';

export type ContractType = 
  | 'LUMP_SUM'
  | 'ITEM_RATE_REMEASURABLE'
  | 'COST_PLUS'
  | 'EPC'
  | 'FIDIC_RED_BOOK'
  | 'FIDIC_YELLOW_BOOK'
  | 'NEC4_OPTION_A';

export interface TenderInfo {
  id: string;
  tenderNumber: string;
  tenderTitle: string;
  client: string;
  consultant: string;
  contractor: string;
  project: string;
  location: string;
  issueDate: string;
  closingDate: string;
  submissionTime: string; // e.g. "14:00 GMT"
  tenderType: TenderType;
  contractType: ContractType;
  currency: string;
  validityDays: number;
  validityStartDate: string;
  validityExpiryDate: string;
  preparedBy: string;
  checkedBy: string;
  approvedBy: string;
  tenderStatus: TenderStatus;
  currentTenderRevision: string; // e.g. "Tender Rev 00"
  currentBoqRevision: string;
  currentPricingRevision: string;
  isLocked: boolean;
  lockedAt?: string;
  lockedBy?: string;
  notes?: string;
}

export type TenderDocumentCategory = 
  | 'Invitation'
  | 'Tender Instructions'
  | 'BOQ'
  | 'Specifications'
  | 'Drawings'
  | 'Addenda'
  | 'Clarifications'
  | 'Schedules'
  | 'Forms'
  | 'Commercial Documents'
  | 'Technical Documents'
  | 'Other';

export interface TenderDocumentItem {
  id: string;
  documentName: string;
  documentType: TenderDocumentCategory;
  revision: string;
  date: string;
  source: string;
  status: 'CURRENT' | 'SUPERSEDED' | 'PENDING' | 'OPTIONAL';
  fileName: string;
  fileSize?: string;
  notes?: string;
  isMandatoryForSubmission: boolean;
  isProvided: boolean;
}

export interface TenderDrawingRegisterItem {
  id: string;
  drawingNo: string;
  title: string;
  discipline: string;
  revision: string;
  date: string;
  status: 'APPROVED_FOR_TENDER' | 'PRELIMINARY' | 'ADDENDUM_REVISED' | 'FOR_INFORMATION';
  usedInBoq: boolean;
  usedInTakeoff: boolean;
  verified: boolean;
  sheetCount?: number;
  notes?: string;
}

export interface AddendumImpactItem {
  drawingNo?: string;
  boqItemCode?: string;
  elementDescription: string;
  previousQuantity?: number;
  newQuantity?: number;
  quantityDelta?: number;
  unit?: string;
  rate?: number;
  pricingImpact: number;
  specChangeDescription?: string;
}

export interface TenderAddendum {
  id: string;
  addendumNo: string; // e.g. "Addendum No. 01"
  date: string;
  description: string;
  documentName: string;
  affectedDrawingNos: string[];
  affectedBoqItemCodes: string[];
  quantityChangeSummary: string;
  specificationChangeSummary: string;
  pricingChangeTotal: number;
  status: 'PENDING_REVIEW' | 'ACCEPTED' | 'REJECTED' | 'INCORPORATED';
  reviewedBy?: string;
  reviewDate?: string;
  impactItems: AddendumImpactItem[];
}

export interface ClarificationImpactItem {
  affectedItemType: 'DIMENSION' | 'SPECIFICATION' | 'SCOPE' | 'QUANTITY' | 'RATE';
  drawingNo?: string;
  boqItemCode?: string;
  details: string;
  impactValue?: number;
}

export interface TenderClarification {
  id: string;
  question: string;
  dateRaised: string;
  raisedBy: string;
  response: string;
  responseDate: string;
  affectedDrawings: string[];
  affectedBoqCodes: string[];
  status: 'OPEN' | 'ANSWERED' | 'ACCEPTED' | 'REJECTED' | 'PENDING';
  impacts: ClarificationImpactItem[];
}

export type ScopeResponsibilityParty = 
  | 'CONTRACTOR'
  | 'CLIENT'
  | 'SPECIALIST_SUBCONTRACTOR'
  | 'JOINT_VENTURE'
  | 'PROVISIONAL'
  | 'EXCLUDED';

export interface ScopeMatrixItem {
  id: string;
  workPackage: string; // e.g. "Site Excavation & Shoring"
  discipline: string;
  included: boolean;
  excluded: boolean;
  byContractor: boolean;
  byClient: boolean;
  bySpecialist: boolean;
  isProvisional: boolean;
  isOptional: boolean;
  responsibleParty: ScopeResponsibilityParty;
  specialistName?: string;
  specReference?: string;
  notes?: string;
}

export interface InclusionItem {
  id: string;
  discipline: string;
  scopeItem: string;
  specificationRef: string;
  notes: string;
}

export interface ExclusionItem {
  id: string;
  discipline: string;
  excludedItem: string;
  reason: string;
  partyResponsible: string; // e.g. "By Client Direct", "Authority"
}

export interface ProvisionalSumItem {
  id: string;
  itemNo: string;
  description: string;
  unit: string;
  amount: number;
  reason: string;
  status: 'DEFINED' | 'UNDEFINED' | 'SPECIALIST_NOMINATED';
  isMeasuredInBoq: boolean;
}

export interface PrimeCostItem {
  id: string;
  itemNo: string;
  description: string;
  allowanceAmount: number;
  unit: string;
  attendancePercent: number; // Contractor profit & attendance %
  attendanceAmount: number;
  totalWithAttendance: number;
  adjustmentReason?: string;
  notes?: string;
}

export interface OptionalItem {
  id: string;
  optionCode: string;
  title: string;
  description: string;
  discipline: string;
  amount: number;
  isSelectedInBaseTender: boolean; // Optional items do not auto-enter main tender total
  decisionDeadline?: string;
  notes?: string;
}

export interface AlternateOptionItem {
  id: string;
  alternateCode: string; // e.g. "ALT-01"
  baseScopeTitle: string;
  baseAmount: number;
  alternateScopeTitle: string;
  alternateAmount: number;
  costDifference: number; // alternateAmount - baseAmount
  differencePercent: number;
  timeImpactWeeks: number;
  engineeringMerit: string;
  status: 'PROPOSED' | 'CLIENT_REVIEW' | 'ACCEPTED' | 'REJECTED';
}

export interface TenderDiscountConfig {
  type: 'PERCENTAGE' | 'FIXED' | 'NONE';
  percentValue: number; // e.g. 2.5%
  fixedAmount: number;
  discountAmount: number;
  reason: string;
}

export interface TenderRiskAllowanceConfig {
  type: 'PERCENTAGE' | 'FIXED' | 'NONE';
  percentValue: number; // e.g. 3.0%
  fixedAmount: number;
  riskAmount: number;
  reason: string;
  isShownSeparately: boolean; // Never hidden inside rates
}

export interface CommercialBidSummary {
  baseBoqMeasuredTotal: number;
  provisionalSumsTotal: number;
  primeCostTotal: number;
  selectedOptionsTotal: number;
  subtotalBeforeRiskDiscount: number;
  
  riskAllowanceAmount: number;
  riskAllowancePercent: number;
  
  discountAmount: number;
  discountPercent: number;
  
  subtotalAfterDiscountRisk: number;
  taxVatAmount: number;
  taxVatPercent: number;
  
  tenderGrandTotal: number;
  tenderGrandTotalInWords: string;
  
  // Cost breakdown & Margin
  estimatedDirectCost: number;
  estimatedOverheadCost: number;
  totalEstimatedCost: number;
  grossMarginAmount: number;
  grossMarginPercent: number;
  
  reconciliationBalanced: boolean;
  reconciliationMismatchAmount: number;
}

export type ChecklistItemStatus = 'COMPLETE' | 'INCOMPLETE' | 'NOT_REQUIRED';

export interface TenderChecklistItem {
  id: string;
  category: 'LEGAL_COMPANY' | 'COMMERCIAL' | 'TECHNICAL' | 'PROGRAMME_RESOURCES' | 'FORMS_SIGNATURES';
  itemTitle: string;
  description: string;
  isMandatory: boolean;
  status: ChecklistItemStatus;
  attachedDocumentId?: string;
  verifiedBy?: string;
  verifiedDate?: string;
  notes?: string;
}

export type SignatureStatus = 'PENDING' | 'SIGNED' | 'NOT_REQUIRED';

export interface TenderSignatures {
  preparedBy: {
    name: string;
    title: string;
    date: string;
    status: SignatureStatus;
    comments?: string;
  };
  checkedBy: {
    name: string;
    title: string;
    date: string;
    status: SignatureStatus;
    comments?: string;
  };
  approvedBy: {
    name: string;
    title: string;
    date: string;
    status: SignatureStatus;
    comments?: string;
  };
}

export type WorkflowStage = 
  | 'PREPARED'
  | 'INTERNAL_REVIEW'
  | 'COMMERCIAL_REVIEW'
  | 'TECHNICAL_REVIEW'
  | 'MANAGEMENT_APPROVAL'
  | 'READY_FOR_SUBMISSION'
  | 'SUBMITTED';

export interface WorkflowAuditStep {
  id: string;
  stage: WorkflowStage;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  comments: string;
}

export interface TenderReviewComment {
  id: string;
  user: string;
  userRole: string;
  date: string;
  section: 'BOQ' | 'RATES' | 'QUANTITIES' | 'SPECIFICATIONS' | 'SCOPE' | 'EXCLUSIONS' | 'RISK' | 'PROFIT' | 'LEGAL';
  boqItemCode?: string;
  drawingNo?: string;
  comment: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'RESOLVED' | 'REJECTED' | 'ACCEPTED';
  resolutionNote?: string;
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface TenderRevisionHistoryItem {
  revisionCode: string; // "Tender Rev 00", "Tender Rev 01"
  date: string;
  user: string;
  reason: string;
  tenderGrandTotal: number;
  directCost: number;
  overheadAmount: number;
  profitAmount: number;
  affectedDocumentsCount: number;
  quantityChangesCount: number;
  rateChangesCount: number;
  notes?: string;
}

export interface CompetitorBid {
  id: string;
  bidderName: string;
  isInternalEstimate: boolean;
  basePrice: number;
  provisionalSum: number;
  options: number;
  tax: number;
  discount: number;
  finalTenderPrice: number;
  bidDate: string;
  currency: string;
  validityDays: number;
  source: 'TENDER_OPENING' | 'MARKET_INTELLIGENCE' | 'CLIENT_FEEDBACK' | 'ESTIMATE';
  isUserEntered: boolean;
  notes: string;
}

export interface CompetitorItemRateComparison {
  itemCode: string;
  description: string;
  unit: string;
  ourQuantity: number;
  competitorQuantity: number;
  quantityDeviation: number;
  ourRate: number;
  competitorRate: number;
  rateDifference: number;
  rateDifferencePercent: number;
  ourAmount: number;
  competitorAmount: number;
  amountDifference: number;
}

export interface BidAnalysisStats {
  biddersCount: number;
  lowestPrice: number;
  lowestBidder: string;
  highestPrice: number;
  highestBidder: string;
  averagePrice: number;
  medianPrice: number;
  ourRank: number;
  varianceFromLowest: number;
  varianceFromLowestPercent: number;
  varianceFromAverage: number;
  varianceFromAveragePercent: number;
}

export type RiskCategory = 
  | 'DESIGN'
  | 'QUANTITY'
  | 'PRICE'
  | 'SUPPLY'
  | 'LABOUR'
  | 'PROGRAMME'
  | 'CLIENT'
  | 'CONSULTANT'
  | 'AUTHORITY'
  | 'MEP'
  | 'STEEL'
  | 'CIVIL'
  | 'OTHER';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface TenderRiskItem {
  id: string;
  category: RiskCategory;
  description: string;
  probability: 1 | 2 | 3 | 4 | 5; // 1 lowest, 5 highest
  impact: 1 | 2 | 3 | 4 | 5;      // 1 lowest, 5 highest
  riskScore: number;               // probability * impact (1-25)
  riskLevel: RiskLevel;
  costImpact: number;
  mitigation: string;
  owner: string;
  status: 'IDENTIFIED' | 'MITIGATED' | 'ACCEPTED' | 'TRANSFERRED' | 'CLOSED';
}

export interface TenderAssumptionItem {
  id: string;
  category: 'BOQ' | 'DRAWING' | 'SPECIFICATION' | 'PRICE' | 'SCOPE' | 'SITE_CONDITION';
  linkedCode?: string; // BOQ code or Drawing No
  assumptionText: string;
  commercialImpact: string;
  raisedBy: string;
  date: string;
}

export interface WorkPackageScheduleItem {
  id: string;
  packageCode: string;
  packageName: string;
  startDate: string;
  finishDate: string;
  durationDays: number;
  predecessor?: string;
  criticalPath: boolean;
}

export interface TenderProgramme {
  startDate: string;
  finishDate: string;
  totalDurationWeeks: number;
  workingDaysPerWeek: number;
  workPackages: WorkPackageScheduleItem[];
  programmeNotes?: string;
}

export interface ManpowerPlanItem {
  id: string;
  trade: string; // e.g. "Steel Fixers", "Electricians"
  peakCount: number;
  averageCount: number;
  durationMonths: number;
  estimatedCost: number;
  notes?: string;
}

export interface EquipmentPlanItem {
  id: string;
  equipmentName: string; // e.g. "Tower Crane 50m", "Concrete Boom Pump"
  quantity: number;
  durationMonths: number;
  ownershipType: 'OWNED' | 'HIRED' | 'SUBCONTRACTOR_PROVIDED';
  estimatedCost: number;
  notes?: string;
}

export interface AwardTracking {
  outcome: 'PENDING' | 'AWARDED' | 'NOT_AWARDED' | 'CANCELLED';
  awardDate?: string;
  awardAmount?: number;
  winningBidder?: string;
  winningPriceDifference?: number;
  winningPriceDifferencePercent?: number;
  reasonForOutcome?: string;
  postBidAnalysisNotes?: string;
}

export interface HistoricalTenderRecord {
  id: string;
  tenderNumber: string;
  projectName: string;
  client: string;
  location: string;
  discipline: string;
  tenderDate: string;
  tenderAmount: number;
  outcome: 'AWARDED' | 'NOT_AWARDED' | 'CANCELLED';
  winningBidder?: string;
  winningAmount?: number;
  profitMarginAchieved?: number;
  keyLessonsLearned?: string;
}

export interface TenderQaPillarStatus {
  pillarName: string;
  status: 'PASSED' | 'FAILED' | 'WARNING';
  issuesCount: number;
  details: string[];
}

export interface TenderQaReport {
  overallReadyForSubmission: boolean;
  pillars: {
    boqIntegrity: TenderQaPillarStatus;
    quantityVerification: TenderQaPillarStatus;
    pricingReconciliation: TenderQaPillarStatus;
    drawingRegister: TenderQaPillarStatus;
    documentCompleteness: TenderQaPillarStatus;
    reviewCommentsResolution: TenderQaPillarStatus;
    signaturesApproval: TenderQaPillarStatus;
    deadlineStatus: TenderQaPillarStatus;
  };
  criticalBlockersCount: number;
  warningsCount: number;
  blockerMessages: string[];
  warningMessages: string[];
}

export interface TenderSubmissionPackageManifest {
  packageId: string;
  tenderNumber: string;
  projectName: string;
  revision: string;
  generatedAt: string;
  generatedBy: string;
  tenderGrandTotal: number;
  currency: string;
  folderStructure: {
    folderName: string;
    description: string;
    fileCount: number;
    files: {
      fileName: string;
      fileType: string;
      sizeBytes: number;
      checksumSha256: string;
    }[];
  }[];
  totalFiles: number;
  totalSizeBytes: number;
  packageChecksum: string;
}

export interface TenderTestResult {
  testId: number;
  testName: string;
  category: string;
  status: 'PASS' | 'FAILED';
  input: string;
  expected: string;
  actual: string;
  executionTimeMs: number;
  notes?: string;
}
