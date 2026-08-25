/**
 * AI BOQ & Tender Estimation Engineer - Phase 12: Rate Analysis & Tender Pricing Types
 */

import { UnifiedBoqDiscipline } from './index';

export type RateComponentCategory = 
  | 'MATERIAL' 
  | 'LABOUR' 
  | 'EQUIPMENT' 
  | 'SUBCONTRACT' 
  | 'TRANSPORT' 
  | 'OTHER';

export type RateSourceType =
  | 'User Entered'
  | 'Supplier Quote'
  | 'Historical Project'
  | 'Rate Database'
  | 'Imported Rate'
  | 'Subcontractor Quote'
  | 'Market Reference';

export type RateAnalysisStatus = 
  | 'DRAFT' 
  | 'PRICED' 
  | 'REQUIRES_REVIEW' 
  | 'FROZEN' 
  | 'EXPIRED';

export interface RateComponent {
  id: string; // e.g. "RC-M25-01"
  category: RateComponentCategory;
  description: string; // e.g. "Portland Pozzolana Cement (PPC 53)"
  unit: string; // e.g. "bag", "m³", "man-day", "hour", "tonne", "trip", "LS"
  consumption: number; // e.g. 7.00 bags per m³
  unitRate: number; // e.g. 8.50 per bag
  wastagePercent?: number; // e.g. 3.0% (materials only)
  wastageAmount?: number; // e.g. consumption * wastage% * unitRate
  amount: number; // (consumption * (1 + wastage%/100)) * unitRate
  supplier?: string;
  source: RateSourceType | string;
  date: string;
  currency: string;
  notes?: string;
  code?: string;
}

export interface RateAuditEntry {
  id: string;
  timestamp: string;
  user: string;
  action: 'CREATED' | 'UPDATED' | 'MODIFIED' | 'OVERRIDDEN' | 'TEMPLATE_APPLIED' | 'FROZEN' | 'REVISED';
  oldRate?: number;
  newRate?: number;
  difference?: number;
  reason: string;
  componentChanges?: string;
}

export interface RateAnalysisRecord {
  id: string; // e.g. "RA-03.01.01"
  boqItemId: string; // link to Unified BOQ item e.g. "BOQ-03.01.01"
  itemCode: string;
  description: string;
  unit: string; // BOQ unit
  rateUnit: string; // Rate analysis unit
  unitMismatch: boolean; // true if unit != rateUnit
  currency: string;
  effectiveDate: string;
  location: string;
  
  components: RateComponent[];
  
  // Direct Cost Breakdown
  materialCost: number;
  labourCost: number;
  equipmentCost: number;
  subcontractCost: number;
  transportCost: number;
  otherCost: number;
  wastageTotalCost: number;
  directCost: number; // Material + Labour + Equipment + Subcontract + Transport + Other
  
  // Indirects & Markups
  overheadType: 'PERCENTAGE' | 'FIXED';
  overheadPercent: number; // e.g. 10.0%
  overheadAmount: number; // DirectCost * overheadPercent/100
  
  profitType: 'PERCENTAGE' | 'FIXED';
  profitPercent: number; // e.g. 10.0%
  profitAmount: number; // (DirectCost + Overhead) * profitPercent/100
  
  taxEnabled: boolean; // Optional project/item setting
  taxRatePercent: number; // e.g. 5.0% or 18.0%
  taxAmount: number; // (Direct + Overhead + Profit) * taxRatePercent/100
  
  finalRate: number; // DirectCost + Overhead + Profit + Tax
  
  // Source & Governance
  rateSource: RateSourceType;
  supplierQuoteId?: string;
  status: RateAnalysisStatus;
  validityFrom?: string;
  validityTo?: string;
  isExpired: boolean;
  
  // Database comparison & override tracking
  isUserOverridden: boolean;
  databaseReferenceRate?: number;
  overrideDelta?: number;
  overrideReason?: string;
  
  templateId?: string;
  auditTrail: RateAuditEntry[];
  lastModifiedAt: string;
  lastModifiedBy: string;
}

export interface RateDatabaseItem {
  id: string;
  category: RateComponentCategory;
  code: string;
  name: string;
  specification: string;
  unit: string;
  rate: number;
  currency: string;
  supplier?: string;
  location: string;
  date: string;
  validityFrom: string;
  validityTo: string;
  source: RateSourceType;
  notes?: string;
  isExpired?: boolean;
}

export interface LabourTradeProductivity {
  trade: string; // e.g. "Brick Mason", "Steel Fixer", "Plasterer"
  dailyRate: number;
  hourlyRate: number;
  defaultUnit: string; // e.g. "man-day"
  standardProductivity: {
    activity: string;
    outputUnit: string; // e.g. "m²/day", "m³/day", "kg/day"
    outputPerDay: number;
    manDaysPerUnit: number;
  }[];
  location: string;
  source: string;
  lastUpdated: string;
}

export interface LabourCrewDefinition {
  id: string;
  crewName: string; // e.g. "Concrete Pouring Crew (1 Mason + 4 Helpers + 1 Pump Operator)"
  discipline: string;
  members: {
    trade: string;
    count: number;
    dailyRate: number;
  }[];
  dailyProductivityOutput: number; // e.g. 15 m³/day
  outputUnit: string; // "m³", "m²", "tonne"
  totalDailyCrewCost: number;
  calculatedRatePerUnit: number; // totalDailyCrewCost / dailyProductivityOutput
  notes?: string;
}

export interface EquipmentDatabaseItem {
  id: string;
  equipmentName: string; // e.g. "Hydraulic Excavator 0.9m³", "Concrete Boom Pump 36m"
  ownership: 'OWNED' | 'RENTAL';
  hourlyRentalRate: number;
  dailyRentalRate: number;
  fuelCostPerHour: number;
  operatorCostPerHour: number;
  maintenanceCostPerHour: number;
  totalHourlyOperatingCost: number;
  defaultProductivityOutputPerHour: number; // e.g. 45 m³/hr
  outputUnit: string; // "m³", "tonne", "m²"
  calculatedRatePerUnit: number; // totalHourlyOperatingCost / defaultProductivityOutputPerHour
  location: string;
  date: string;
  source: string;
}

export interface SupplierQuoteItem {
  id: string; // e.g. "SQ-2026-001"
  supplierName: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  materialOrService: string;
  specification: string;
  quantityAvailable?: number;
  unit: string;
  quotedRate: number;
  currency: string;
  transportIncluded: boolean;
  transportCostPerUnit: number;
  taxIncluded: boolean;
  taxPercent: number;
  deliveredUnitCost: number; // quotedRate + transportCostPerUnit + taxIfApplicable
  validityStartDate: string;
  validityEndDate: string;
  isExpired: boolean;
  deliveryLeadDays: number;
  paymentTerms: string;
  notes?: string;
  attachmentFileName?: string;
  isSelectedForRateAnalysis: boolean;
}

export interface CurrencyExchangeRate {
  baseCurrency: string; // e.g. "USD"
  targetCurrency: string; // e.g. "INR", "EUR", "AED", "GBP", "SAR"
  exchangeRate: number; // 1 Base = X Target
  effectiveDate: string;
  source: string;
  isUserOverridden: boolean;
}

export interface PricingScenario {
  id: string;
  code: 'SCENARIO_A' | 'SCENARIO_B' | 'SCENARIO_C' | string;
  name: string; // e.g. "Baseline / Normal", "Aggressive / Competitive", "Conservative / High Contingency"
  description: string;
  materialCostMultiplier: number; // e.g. 1.0, 0.95, 1.05
  labourCostMultiplier: number; // e.g. 1.0, 0.92, 1.08
  equipmentCostMultiplier: number;
  subcontractCostMultiplier: number;
  overheadPercent: number; // e.g. 8.0%, 10.0%, 12.0%
  profitPercent: number; // e.g. 6.0%, 10.0%, 15.0%
  taxRatePercent: number;
  isTaxEnabled: boolean;
  isCurrentActive: boolean;
  notes?: string;
}

export interface ValueEngineeringProposal {
  id: string;
  boqItemId: string;
  itemCode: string;
  itemDescription: string;
  unit: string;
  verifiedQuantity: number;
  originalSpecification: string;
  originalRate: number;
  originalTotalAmount: number;
  alternativeSpecification: string;
  alternativeRate: number;
  alternativeTotalAmount: number;
  savingsAmount: number; // originalTotal - alternativeTotal
  savingsPercent: number;
  technicalFeasibility: 'HIGH' | 'MEDIUM' | 'LOW' | 'REQUIRES_CLIENT_APPROVAL';
  consultantApprovalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  justificationNotes: string;
}

export interface RateAnalysisTemplate {
  id: string; // e.g. "RAT-CONCRETE-M25"
  name: string; // e.g. "RCC Grade M25 Concrete (1:1:2)"
  discipline: UnifiedBoqDiscipline;
  unit: string;
  outputUnit?: string;
  description: string;
  defaultComponents: {
    category: RateComponentCategory;
    description: string;
    unit: string;
    defaultConsumption: number;
    suggestedRate: number;
    wastagePercent: number;
  }[];
  assumptions: string[];
  applicableElementType: string;
}

export interface PricingQaIssue {
  id: string;
  itemCode: string;
  description: string;
  issueType: 
    | 'UNPRICED_ITEM'
    | 'UNIT_MISMATCH'
    | 'EXPIRED_RATE'
    | 'MISSING_SOURCE'
    | 'NEGATIVE_RATE'
    | 'ZERO_RATE'
    | 'OVERRIDDEN_UNJUSTIFIED'
    | 'HIGH_DEVIATION'
    | 'MISSING_TAX_CONFIG';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  message: string;
  suggestedAction: string;
}

export interface PricingQaReport {
  timestamp: string;
  totalBoqItems: number;
  pricedItemsCount: number;
  unpricedItemsCount: number;
  pricedPercent: number;
  rateReviewCount: number;
  expiredRatesCount: number;
  unitMismatchesCount: number;
  overriddenRatesCount: number;
  missingSourcesCount: number;
  criticalIssuesCount: number;
  warningsCount: number;
  issues: PricingQaIssue[];
  qualityGatePassed: boolean;
}

export interface TenderCostByDiscipline {
  discipline: string;
  itemCount: number;
  directCost: number;
  overheadAmount: number;
  profitAmount: number;
  taxAmount: number;
  tenderAmount: number;
  percentageOfTender: number;
}

export interface TenderCostByBuilding {
  buildingName: string;
  grossFloorAreaM2?: number;
  isGfaVerified: boolean;
  itemCount: number;
  directCost: number;
  tenderAmount: number;
  costPerM2?: number;
  percentageOfTotal: number;
}

export interface TenderCostByLevel {
  levelName: string;
  directCost: number;
  tenderAmount: number;
  percentageOfTotal: number;
}

export interface CostElementBreakdown {
  materialTotal: number;
  materialPercent: number;
  labourTotal: number;
  labourPercent: number;
  equipmentTotal: number;
  equipmentPercent: number;
  subcontractTotal: number;
  subcontractPercent: number;
  transportTotal: number;
  transportPercent: number;
  otherTotal: number;
  otherPercent: number;
  directCostTotal: number;
  overheadTotal: number;
  overheadPercent: number;
  profitTotal: number;
  profitPercent: number;
  taxTotal: number;
  taxPercent: number;
  tenderGrandTotal: number;
}

export interface PricingRevisionSnapshot {
  revisionCode: string; // e.g. "PRICING REV 00", "PRICING REV 01"
  createdAt: string;
  createdBy: string;
  reason: string;
  scenarioUsed: string;
  isFrozen: boolean;
  frozenAt?: string;
  frozenBy?: string;
  totalDirectCost: number;
  totalOverhead: number;
  totalProfit: number;
  totalTax: number;
  tenderGrandTotal: number;
  itemRatesSummary: {
    boqItemId: string;
    itemCode: string;
    verifiedQuantity: number;
    unit: string;
    finalRate: number;
    totalAmount: number;
  }[];
  rateChangesCount: number;
}

export interface TenderSummaryReport {
  projectId: string;
  projectName: string;
  currency: string;
  pricingRevision: string;
  isFrozen: boolean;
  totalBoqItems: number;
  totalVerifiedQuantityUnits: { [unit: string]: number };
  costElements: CostElementBreakdown;
  disciplineBreakdown: TenderCostByDiscipline[];
  buildingBreakdown: TenderCostByBuilding[];
  levelBreakdown: TenderCostByLevel[];
  scenariosComparison: {
    scenarioName: string;
    directCost: number;
    overhead: number;
    profit: number;
    tax: number;
    tenderTotal: number;
    deltaFromActive: number;
  }[];
  tenderGrandTotal: number;
  tenderTotalWords: string;
  qaPassed: boolean;
  generatedAt: string;
}

export interface RateAnalysisTestResult {
  testId: number;
  testName: string;
  category: 
    | 'MATERIAL'
    | 'LABOUR'
    | 'EQUIPMENT'
    | 'SUBCONTRACT'
    | 'TRANSPORT'
    | 'WASTAGE'
    | 'DIRECT_COST'
    | 'OVERHEAD_PROFIT_TAX'
    | 'BOQ_LINK'
    | 'UNIT_COMPATIBILITY'
    | 'OVERRIDE_AUDIT'
    | 'DATABASE_QUOTES'
    | 'CURRENCY_EXCHANGE'
    | 'SCENARIOS'
    | 'DISCIPLINE_BREAKDOWN'
    | 'FREEZE_REVISION'
    | 'QA_VALIDATION';
  input: string;
  expected: string;
  actual: string;
  status: 'PASS' | 'FAILED' | 'MOCKED';
  executionTimeMs: number;
  notes: string;
}
