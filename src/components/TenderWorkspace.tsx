/**
 * AI BOQ & Tender Estimation Engineer - Phase 13 Professional Tender Management Workspace
 */

import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  FileSpreadsheet,
  FileText,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Printer,
  Plus,
  Trash2,
  Edit3,
  Lock,
  Unlock,
  Layers,
  HelpCircle,
  FilePlus,
  Scale,
  TrendingUp,
  Award,
  History,
  Copy,
  ChevronRight,
  FolderArchive,
  Save,
  Check,
  AlertCircle,
  ExternalLink,
  Users,
  Wrench,
  Search,
  Filter,
  DollarSign,
  PieChart,
  Calendar,
  Building,
} from 'lucide-react';

import { ProjectRecord, UnifiedBoqItem } from '../types/index';
import { RateAnalysisRecord, PricingScenario } from '../types/rateAnalysis';
import {
  TenderInfo,
  TenderStatus,
  TenderType,
  ContractType,
  TenderDocumentItem,
  TenderDrawingRegisterItem,
  TenderAddendum,
  TenderClarification,
  ScopeMatrixItem,
  InclusionItem,
  ExclusionItem,
  ProvisionalSumItem,
  PrimeCostItem,
  OptionalItem,
  AlternateOptionItem,
  TenderDiscountConfig,
  TenderRiskAllowanceConfig,
  TenderChecklistItem,
  TenderSignatures,
  WorkflowAuditStep,
  TenderReviewComment,
  CompetitorBid,
  CompetitorItemRateComparison,
  TenderRiskItem,
  TenderAssumptionItem,
  TenderProgramme,
  ManpowerPlanItem,
  EquipmentPlanItem,
  AwardTracking,
  HistoricalTenderRecord,
  TenderRevisionHistoryItem,
} from '../types/tender';

import {
  INITIAL_TENDER_INFO,
  INITIAL_TENDER_DOCUMENTS,
  INITIAL_TENDER_DRAWING_REGISTER,
  INITIAL_TENDER_ADDENDA,
  INITIAL_TENDER_CLARIFICATIONS,
  INITIAL_SCOPE_MATRIX,
  INITIAL_INCLUSIONS,
  INITIAL_EXCLUSIONS,
  INITIAL_PROVISIONAL_SUMS,
  INITIAL_PRIME_COST_ITEMS,
  INITIAL_OPTIONAL_ITEMS,
  INITIAL_ALTERNATE_OPTIONS,
  INITIAL_DISCOUNT_CONFIG,
  INITIAL_RISK_CONFIG,
  INITIAL_TENDER_CHECKLIST,
  INITIAL_TENDER_SIGNATURES,
  INITIAL_WORKFLOW_STEPS,
  INITIAL_REVIEW_COMMENTS,
  INITIAL_COMPETITOR_BIDS,
  INITIAL_COMPETITOR_ITEM_COMPARISON,
  INITIAL_TENDER_RISKS,
  INITIAL_TENDER_ASSUMPTIONS,
  INITIAL_TENDER_PROGRAMME,
  INITIAL_MANPOWER_PLAN,
  INITIAL_EQUIPMENT_PLAN,
  INITIAL_HISTORICAL_TENDERS,
} from '../data/tenderInitialData';

import { TenderEngine } from '../engine/tenderEngine';
import { TenderExcelExportEngine } from '../engine/tenderExcelExportEngine';
import { TenderPackageZipEngine } from '../engine/tenderPackageZipEngine';
import { TenderTestSuite } from '../engine/tenderTestSuite';
import { TenderQaModal } from './TenderQaModal';
import { TenderTestSuiteModal } from './TenderTestSuiteModal';
import { TenderPrintModal } from './TenderPrintModal';
import { TenderDuplicateModal } from './TenderDuplicateModal';

interface TenderWorkspaceProps {
  project?: ProjectRecord;
  unifiedBoqItems: UnifiedBoqItem[];
  rateAnalyses: RateAnalysisRecord[];
  activeScenario: PricingScenario;
  onNavigateToBoq?: () => void;
  onNavigateToRateAnalysis?: () => void;
}

type TenderSubTab =
  | 'overview'
  | 'documents'
  | 'drawings'
  | 'scope'
  | 'addenda'
  | 'clarifications'
  | 'bid_comparison'
  | 'risk_assumptions'
  | 'reviews_approvals'
  | 'submission_qa'
  | 'history_archive';

export const TenderWorkspace: React.FC<TenderWorkspaceProps> = ({
  project,
  unifiedBoqItems,
  rateAnalyses,
  activeScenario,
  onNavigateToBoq,
  onNavigateToRateAnalysis,
}) => {
  // State Initialization
  const [activeTab, setActiveTab] = useState<TenderSubTab>('overview');

  const [tenderInfo, setTenderInfo] = useState<TenderInfo>(INITIAL_TENDER_INFO);
  const [documents, setDocuments] = useState<TenderDocumentItem[]>(INITIAL_TENDER_DOCUMENTS);
  const [drawings, setDrawings] = useState<TenderDrawingRegisterItem[]>(INITIAL_TENDER_DRAWING_REGISTER);
  const [addenda, setAddenda] = useState<TenderAddendum[]>(INITIAL_TENDER_ADDENDA);
  const [clarifications, setClarifications] = useState<TenderClarification[]>(INITIAL_TENDER_CLARIFICATIONS);
  const [scopeMatrix, setScopeMatrix] = useState<ScopeMatrixItem[]>(INITIAL_SCOPE_MATRIX);
  const [inclusions, setInclusions] = useState<InclusionItem[]>(INITIAL_INCLUSIONS);
  const [exclusions, setExclusions] = useState<ExclusionItem[]>(INITIAL_EXCLUSIONS);
  const [provisionalSums, setProvisionalSums] = useState<ProvisionalSumItem[]>(INITIAL_PROVISIONAL_SUMS);
  const [primeCostItems, setPrimeCostItems] = useState<PrimeCostItem[]>(INITIAL_PRIME_COST_ITEMS);
  const [optionalItems, setOptionalItems] = useState<OptionalItem[]>(INITIAL_OPTIONAL_ITEMS);
  const [alternates, setAlternates] = useState<AlternateOptionItem[]>(INITIAL_ALTERNATE_OPTIONS);
  const [discountConfig, setDiscountConfig] = useState<TenderDiscountConfig>(INITIAL_DISCOUNT_CONFIG);
  const [riskConfig, setRiskConfig] = useState<TenderRiskAllowanceConfig>(INITIAL_RISK_CONFIG);
  const [checklist, setChecklist] = useState<TenderChecklistItem[]>(INITIAL_TENDER_CHECKLIST);
  const [signatures, setSignatures] = useState<TenderSignatures>(INITIAL_TENDER_SIGNATURES);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowAuditStep[]>(INITIAL_WORKFLOW_STEPS);
  const [reviewComments, setReviewComments] = useState<TenderReviewComment[]>(INITIAL_REVIEW_COMMENTS);
  const [competitorBids, setCompetitorBids] = useState<CompetitorBid[]>(INITIAL_COMPETITOR_BIDS);
  const [competitorItemComparison, setCompetitorItemComparison] = useState<CompetitorItemRateComparison[]>(INITIAL_COMPETITOR_ITEM_COMPARISON);
  const [risks, setRisks] = useState<TenderRiskItem[]>(INITIAL_TENDER_RISKS);
  const [assumptions, setAssumptions] = useState<TenderAssumptionItem[]>(INITIAL_TENDER_ASSUMPTIONS);
  const [programme] = useState<TenderProgramme>(INITIAL_TENDER_PROGRAMME);
  const [manpower] = useState<ManpowerPlanItem[]>(INITIAL_MANPOWER_PLAN);
  const [equipment] = useState<EquipmentPlanItem[]>(INITIAL_EQUIPMENT_PLAN);
  const [historicalTenders, setHistoricalTenders] = useState<HistoricalTenderRecord[]>(INITIAL_HISTORICAL_TENDERS);
  const [revisionHistory, setRevisionHistory] = useState<TenderRevisionHistoryItem[]>([]);

  // Modals state
  const [isQaModalOpen, setIsQaModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [isPackaging, setIsPackaging] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Comment Form
  const [newCommentText, setNewCommentText] = useState('');
  const [newCommentSection, setNewCommentSection] = useState<TenderReviewComment['section']>('RATES');
  const [newCommentPriority, setNewCommentPriority] = useState<TenderReviewComment['priority']>('HIGH');

  // New Competitor Bid Form
  const [newBidderName, setNewBidderName] = useState('');
  const [newBidderPrice, setNewBidderPrice] = useState<number>(0);
  const [newBidderValidity, setNewBidderValidity] = useState<number>(90);
  const [newBidderNotes, setNewBidderNotes] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Calculated Commercial Bid Summary
  const commercialSummary = useMemo(() => {
    return TenderEngine.calculateCommercialBidSummary(
      unifiedBoqItems,
      rateAnalyses,
      activeScenario,
      provisionalSums,
      primeCostItems,
      optionalItems,
      discountConfig,
      riskConfig,
      5.0
    );
  }, [
    unifiedBoqItems,
    rateAnalyses,
    activeScenario,
    provisionalSums,
    primeCostItems,
    optionalItems,
    discountConfig,
    riskConfig,
  ]);

  // Deadline and Validity calculations
  const deadlineInfo = useMemo(() => {
    return TenderEngine.getTenderDeadlineStatus(
      tenderInfo.closingDate,
      tenderInfo.submissionTime
    );
  }, [tenderInfo.closingDate, tenderInfo.submissionTime]);

  const validityInfo = useMemo(() => {
    return TenderEngine.getBidValidityStatus(tenderInfo.validityExpiryDate);
  }, [tenderInfo.validityExpiryDate]);

  // Pre-Flight QA Gate Report
  const qaReport = useMemo(() => {
    return TenderEngine.evaluateTenderQaGate(
      tenderInfo,
      unifiedBoqItems,
      rateAnalyses,
      drawings,
      documents,
      checklist,
      reviewComments,
      signatures,
      commercialSummary
    );
  }, [
    tenderInfo,
    unifiedBoqItems,
    rateAnalyses,
    drawings,
    documents,
    checklist,
    reviewComments,
    signatures,
    commercialSummary,
  ]);

  // Bid Analysis Statistics
  const bidAnalysisStats = useMemo(() => {
    return TenderEngine.calculateBidAnalysisStats(
      competitorBids,
      commercialSummary.tenderGrandTotal
    );
  }, [competitorBids, commercialSummary.tenderGrandTotal]);

  // Handler: Lock / Freeze Tender Baseline
  const handleToggleLock = () => {
    if (!tenderInfo.isLocked) {
      if (!qaReport.overallReadyForSubmission) {
        showToast('Cannot lock tender: QA Pre-flight checks have blocking issues.');
        setIsQaModalOpen(true);
        return;
      }
      setTenderInfo((prev) => ({
        ...prev,
        isLocked: true,
        lockedAt: new Date().toISOString(),
        lockedBy: 'Chief Commercial Estimator',
        tenderStatus: 'READY_FOR_SUBMISSION',
      }));

      // Add to revision history
      const newRevRecord: TenderRevisionHistoryItem = {
        revisionCode: tenderInfo.currentTenderRevision,
        date: new Date().toISOString().slice(0, 10),
        user: 'Chief Commercial Estimator',
        reason: 'Formal Baseline Lock for Submission Authorization',
        tenderGrandTotal: commercialSummary.tenderGrandTotal,
        directCost: commercialSummary.estimatedDirectCost,
        overheadAmount: commercialSummary.estimatedOverheadCost,
        profitAmount: commercialSummary.grossMarginAmount,
        affectedDocumentsCount: documents.length,
        quantityChangesCount: 0,
        rateChangesCount: rateAnalyses.filter((r) => r.isUserOverridden).length,
        notes: 'Commercial tender freeze snapshot.',
      };
      setRevisionHistory((prev) => [newRevRecord, ...prev]);
      showToast(`${tenderInfo.currentTenderRevision} Locked & Frozen for Submission.`);
    } else {
      // Unlocking requires incrementing revision
      const currentRevNum = parseInt(tenderInfo.currentTenderRevision.replace(/\D/g, '') || '0', 10);
      const nextRevStr = `Tender Rev ${(currentRevNum + 1).toString().padStart(2, '0')}`;

      setTenderInfo((prev) => ({
        ...prev,
        isLocked: false,
        currentTenderRevision: nextRevStr,
        tenderStatus: 'UNDER_REVIEW',
        lockedAt: undefined,
        lockedBy: undefined,
      }));
      showToast(`Tender Unlocked. Incremented to ${nextRevStr}.`);
    }
  };

  // Handler: Add Review Comment
  const handleAddReviewComment = () => {
    if (!newCommentText.trim()) return;
    const newComment: TenderReviewComment = {
      id: `TRC-${Date.now().toString().slice(-4)}`,
      user: 'Waseem Ansari',
      userRole: 'Lead Commercial Estimator',
      date: new Date().toISOString().slice(0, 10),
      section: newCommentSection,
      comment: newCommentText.trim(),
      priority: newCommentPriority,
      status: 'OPEN',
    };
    setReviewComments((prev) => [newComment, ...prev]);
    setNewCommentText('');
    showToast('Review comment logged.');
  };

  // Handler: Resolve Review Comment
  const handleResolveComment = (id: string) => {
    setReviewComments((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: 'RESOLVED',
              resolvedBy: 'Waseem Ansari',
              resolvedAt: new Date().toISOString(),
              resolutionNote: 'Reviewed and confirmed compliant with specification.',
            }
          : c
      )
    );
    showToast('Comment marked as resolved.');
  };

  // Handler: Add Competitor Bid
  const handleAddCompetitorBid = () => {
    if (!newBidderName.trim() || newBidderPrice <= 0) return;
    const newBid: CompetitorBid = {
      id: `CBID-${Date.now().toString().slice(-4)}`,
      bidderName: newBidderName.trim(),
      isInternalEstimate: false,
      basePrice: newBidderPrice * 0.9,
      provisionalSum: 110000,
      options: 0,
      tax: newBidderPrice * 0.05,
      discount: 0,
      finalTenderPrice: newBidderPrice,
      bidDate: new Date().toISOString().slice(0, 10),
      currency: 'USD',
      validityDays: newBidderValidity,
      source: 'TENDER_OPENING',
      isUserEntered: true,
      notes: newBidderNotes || 'User entered competitor quote.',
    };
    setCompetitorBids((prev) => [...prev, newBid]);
    setNewBidderName('');
    setNewBidderPrice(0);
    setNewBidderNotes('');
    showToast(`Competitor Bid added for ${newBid.bidderName}.`);
  };

  // Handler: Toggle Checklist Item
  const handleToggleChecklist = (id: string) => {
    setChecklist((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const nextStatus =
          c.status === 'COMPLETE'
            ? 'INCOMPLETE'
            : c.status === 'INCOMPLETE'
            ? 'NOT_REQUIRED'
            : 'COMPLETE';
        return {
          ...c,
          status: nextStatus,
          verifiedBy: nextStatus === 'COMPLETE' ? 'Commercial Lead' : undefined,
          verifiedDate: nextStatus === 'COMPLETE' ? new Date().toISOString().slice(0, 10) : undefined,
        };
      })
    );
  };

  // Handler: Generate Submission ZIP Package
  const handleGenerateSubmissionPackage = async () => {
    setIsPackaging(true);
    try {
      await TenderPackageZipEngine.generateAndDownloadPackageZip(
        tenderInfo,
        commercialSummary,
        unifiedBoqItems,
        rateAnalyses,
        activeScenario,
        scopeMatrix,
        inclusions,
        exclusions,
        provisionalSums,
        primeCostItems,
        optionalItems,
        alternates,
        documents,
        drawings,
        addenda,
        clarifications,
        risks,
        assumptions,
        checklist,
        signatures,
        programme,
        manpower,
        equipment
      );
      showToast('13-Folder Tender Submission Package ZIP generated successfully!');
    } catch (err) {
      console.error(err);
      showToast('Failed to generate submission package zip.');
    } finally {
      setIsPackaging(false);
    }
  };

  // Handler: Export Full Tender Excel
  const handleExportFullExcel = () => {
    try {
      TenderExcelExportEngine.exportFullTenderWorkbook(
        tenderInfo,
        commercialSummary,
        unifiedBoqItems,
        rateAnalyses,
        activeScenario,
        scopeMatrix,
        inclusions,
        exclusions,
        provisionalSums,
        primeCostItems,
        optionalItems,
        alternates,
        documents,
        drawings,
        addenda,
        clarifications,
        competitorBids,
        risks,
        assumptions,
        checklist,
        signatures,
        programme,
        manpower,
        equipment
      );
      showToast('Master Tender Excel Workbook exported successfully.');
    } catch (err) {
      console.error(err);
      showToast('Error exporting tender Excel.');
    }
  };

  // Handler: Duplicate Tender
  const handleDuplicateTender = (
    newTenderNum: string,
    newProjName: string,
    newClient: string,
    copiedModules: {
      copyScopeMatrix: boolean;
      copyInclusionsExclusions: boolean;
      copyProvisionalSums: boolean;
      copyPrimeCostItems: boolean;
      copyRateAnalysisTemplates: boolean;
      copyRiskRegister: boolean;
      copyChecklist: boolean;
    }
  ) => {
    const clonedTenderInfo: TenderInfo = {
      ...tenderInfo,
      id: `TND-${Date.now()}`,
      tenderNumber: newTenderNum,
      project: newProjName,
      client: newClient,
      tenderStatus: 'DRAFT',
      currentTenderRevision: 'Tender Rev 00',
      isLocked: false,
      lockedAt: undefined,
      lockedBy: undefined,
    };

    setTenderInfo(clonedTenderInfo);
    if (!copiedModules.copyScopeMatrix) setScopeMatrix([]);
    if (!copiedModules.copyInclusionsExclusions) {
      setInclusions([]);
      setExclusions([]);
    }
    if (!copiedModules.copyProvisionalSums) setProvisionalSums([]);
    if (!copiedModules.copyPrimeCostItems) setPrimeCostItems([]);
    if (!copiedModules.copyRiskRegister) setRisks([]);

    showToast(`New cloned tender "${newTenderNum}" created successfully with data isolation.`);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-100 overflow-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* Top Tender Header Card */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left Title & Project Info */}
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold font-mono">
                {tenderInfo.tenderNumber}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  tenderInfo.tenderStatus === 'READY_FOR_SUBMISSION'
                    ? 'bg-emerald-100 text-emerald-800'
                    : tenderInfo.tenderStatus === 'SUBMITTED'
                    ? 'bg-blue-100 text-blue-800'
                    : tenderInfo.tenderStatus === 'AWARDED'
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {tenderInfo.tenderStatus.replace(/_/g, ' ')}
              </span>
              <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                {tenderInfo.currentTenderRevision}
              </span>
              {tenderInfo.isLocked && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              )}
            </div>

            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              {tenderInfo.tenderTitle}
            </h1>
            <p className="text-xs text-slate-500 flex items-center gap-3 flex-wrap">
              <span>Client: <strong>{tenderInfo.client}</strong></span>
              <span>•</span>
              <span>Consultant: <strong>{tenderInfo.consultant}</strong></span>
              <span>•</span>
              <span>Contract: <strong>{tenderInfo.contractType}</strong></span>
              <span>•</span>
              <span>Pricing Scenario: <strong className="text-indigo-600">{activeScenario.name}</strong></span>
            </p>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsTestModalOpen(true)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-300 shadow-2xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              32-Rule Test Suite
            </button>

            <button
              onClick={() => setIsQaModalOpen(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border shadow-2xs ${
                qaReport.overallReadyForSubmission
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              QA Gate ({qaReport.overallReadyForSubmission ? 'PASS' : `${qaReport.criticalBlockersCount} Blockers`})
            </button>

            <button
              onClick={handleExportFullExcel}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Export Excel
            </button>

            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Form of Tender
            </button>

            <button
              onClick={handleToggleLock}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer ${
                tenderInfo.isLocked
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {tenderInfo.isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              {tenderInfo.isLocked ? 'Unlock (New Rev)' : 'Lock Baseline'}
            </button>
          </div>
        </div>

        {/* Commercial & Countdown Metric Ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-100">
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Tender Grand Total
            </span>
            <div className="text-base font-extrabold text-slate-900 font-mono mt-0.5">
              ${commercialSummary.tenderGrandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
              <Check className="w-3 h-3" /> Reconciled (incl. Tax)
            </div>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Estimated Cost & Margin
            </span>
            <div className="text-base font-extrabold text-slate-900 font-mono mt-0.5">
              ${commercialSummary.grossMarginAmount.toLocaleString('en-US', { minimumFractionDigits: 0 })}
              <span className="text-xs font-semibold text-indigo-600 ml-1">
                ({commercialSummary.grossMarginPercent.toFixed(1)}%)
              </span>
            </div>
            <div className="text-[10px] text-slate-500">
              Total Cost: ${commercialSummary.totalEstimatedCost.toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </div>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Tender Return Deadline
            </span>
            <div className="text-base font-extrabold text-slate-900 mt-0.5">
              {deadlineInfo.formattedTimeRemaining}
            </div>
            <div className="text-[10px] text-slate-500">
              Closing: {tenderInfo.closingDate} ({tenderInfo.submissionTime})
            </div>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Bid Validity Period
            </span>
            <div className="text-base font-extrabold text-slate-900 mt-0.5">
              {tenderInfo.validityDays} Days
              <span className="text-xs font-semibold text-slate-500 ml-1">
                ({validityInfo.daysUntilExpiry}d left)
              </span>
            </div>
            <div className="text-[10px] text-slate-500">
              Expires: {tenderInfo.validityExpiryDate}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tabs Navigation Bar */}
      <div className="bg-white border-b border-slate-200 px-6 flex items-center gap-1 overflow-x-auto text-xs font-semibold shrink-0">
        {[
          { id: 'overview', label: 'Tender Overview & Commercials', icon: DollarSign },
          { id: 'documents', label: `Documents (${documents.length})`, icon: FileText },
          { id: 'drawings', label: `Drawing Register (${drawings.length})`, icon: Layers },
          { id: 'scope', label: 'Scope, Inclusions & PS', icon: Scale },
          { id: 'addenda', label: `Addenda (${addenda.length})`, icon: FilePlus },
          { id: 'clarifications', label: `Clarifications (${clarifications.length})`, icon: HelpCircle },
          { id: 'bid_comparison', label: `Bid Comparison (${competitorBids.length})`, icon: TrendingUp },
          { id: 'risk_assumptions', label: `Risks & Assumptions (${risks.length})`, icon: AlertTriangle },
          { id: 'reviews_approvals', label: 'Review & Approvals', icon: Users },
          { id: 'submission_qa', label: 'Submission Package & QA', icon: FolderArchive },
          { id: 'history_archive', label: 'History & Archive', icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TenderSubTab)}
              className={`py-3 px-3.5 border-b-2 font-medium flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* TAB 1: OVERVIEW & COMMERCIALS */}
        {activeTab === 'overview' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            {/* Top Grid: Tender Master Information & Commercial Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Editable Tender Information */}
              <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-slate-800 text-sm">Tender Master Details</h3>
                  </div>
                  <span className="text-xs text-slate-400">All fields editable</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Tender Number</label>
                    <input
                      type="text"
                      value={tenderInfo.tenderNumber}
                      disabled={tenderInfo.isLocked}
                      onChange={(e) => setTenderInfo({ ...tenderInfo, tenderNumber: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Tender Status</label>
                    <select
                      value={tenderInfo.tenderStatus}
                      disabled={tenderInfo.isLocked}
                      onChange={(e) =>
                        setTenderInfo({ ...tenderInfo, tenderStatus: e.target.value as TenderStatus })
                      }
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-indigo-500"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="UNDER_REVIEW">Under Review</option>
                      <option value="READY_FOR_SUBMISSION">Ready for Submission</option>
                      <option value="SUBMITTED">Submitted</option>
                      <option value="AWARDED">Awarded</option>
                      <option value="NOT_AWARDED">Not Awarded</option>
                      <option value="CANCELLED">Cancelled</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-slate-500 font-medium mb-1">Tender Title</label>
                    <input
                      type="text"
                      value={tenderInfo.tenderTitle}
                      disabled={tenderInfo.isLocked}
                      onChange={(e) => setTenderInfo({ ...tenderInfo, tenderTitle: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Employer / Client</label>
                    <input
                      type="text"
                      value={tenderInfo.client}
                      disabled={tenderInfo.isLocked}
                      onChange={(e) => setTenderInfo({ ...tenderInfo, client: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Lead Consultant</label>
                    <input
                      type="text"
                      value={tenderInfo.consultant}
                      disabled={tenderInfo.isLocked}
                      onChange={(e) => setTenderInfo({ ...tenderInfo, consultant: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Tender Issue Date</label>
                    <input
                      type="date"
                      value={tenderInfo.issueDate}
                      disabled={tenderInfo.isLocked}
                      onChange={(e) => setTenderInfo({ ...tenderInfo, issueDate: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Closing Date & Time</label>
                    <div className="flex gap-1.5">
                      <input
                        type="date"
                        value={tenderInfo.closingDate}
                        disabled={tenderInfo.isLocked}
                        onChange={(e) => setTenderInfo({ ...tenderInfo, closingDate: e.target.value })}
                        className="w-2/3 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-indigo-500"
                      />
                      <input
                        type="text"
                        value={tenderInfo.submissionTime}
                        disabled={tenderInfo.isLocked}
                        onChange={(e) => setTenderInfo({ ...tenderInfo, submissionTime: e.target.value })}
                        className="w-1/3 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-center focus:bg-white focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Contract Type</label>
                    <select
                      value={tenderInfo.contractType}
                      disabled={tenderInfo.isLocked}
                      onChange={(e) =>
                        setTenderInfo({ ...tenderInfo, contractType: e.target.value as ContractType })
                      }
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-indigo-500"
                    >
                      <option value="ITEM_RATE_REMEASURABLE">Item Rate Remeasurable</option>
                      <option value="LUMP_SUM">Lump Sum Fixed Price</option>
                      <option value="COST_PLUS">Cost Plus Fee</option>
                      <option value="FIDIC_RED_BOOK">FIDIC Red Book (Measurement)</option>
                      <option value="FIDIC_YELLOW_BOOK">FIDIC Yellow Book (D&B)</option>
                      <option value="EPC">EPC Turnkey</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Validity (Days / Expiry)</label>
                    <div className="flex gap-1.5">
                      <input
                        type="number"
                        value={tenderInfo.validityDays}
                        disabled={tenderInfo.isLocked}
                        onChange={(e) =>
                          setTenderInfo({ ...tenderInfo, validityDays: parseInt(e.target.value, 10) || 0 })
                        }
                        className="w-1/3 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-center focus:bg-white focus:border-indigo-500"
                      />
                      <input
                        type="date"
                        value={tenderInfo.validityExpiryDate}
                        disabled={tenderInfo.isLocked}
                        onChange={(e) => setTenderInfo({ ...tenderInfo, validityExpiryDate: e.target.value })}
                        className="w-2/3 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                  <span>Prepared By: <strong>{tenderInfo.preparedBy}</strong></span>
                  <span>Approved By: <strong>{tenderInfo.approvedBy}</strong></span>
                </div>
              </div>

              {/* Right Column: Commercial Price Reconciliation & Margin Breakdown */}
              <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-bold text-slate-800 text-sm">Commercial Price Reconciliation</h3>
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      commercialSummary.reconciliationBalanced
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {commercialSummary.reconciliationBalanced ? 'Balanced 100%' : 'Mismatch'}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-600">1.0 Base Measured BOQ Direct & Indirect Works:</span>
                    <span className="font-mono font-semibold text-slate-800">
                      ${commercialSummary.baseBoqMeasuredTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-600">2.0 Provisional Sums Total:</span>
                    <span className="font-mono font-semibold text-slate-800">
                      +${commercialSummary.provisionalSumsTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-600">3.0 Prime Cost (PC) Items Total:</span>
                    <span className="font-mono font-semibold text-slate-800">
                      +${commercialSummary.primeCostTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-600">4.0 Selected Optional Items:</span>
                    <span className="font-mono font-semibold text-slate-800">
                      +${commercialSummary.selectedOptionsTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 bg-slate-50 px-2 rounded font-semibold text-slate-800">
                    <span>Subtotal before Risk & Discount:</span>
                    <span className="font-mono">
                      ${commercialSummary.subtotalBeforeRiskDiscount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Configurable Risk Allowance */}
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600">5.0 Risk Allowance Contingency:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.5"
                          value={riskConfig.percentValue}
                          onChange={(e) =>
                            setRiskConfig({ ...riskConfig, percentValue: parseFloat(e.target.value) || 0 })
                          }
                          className="w-14 px-1.5 py-0.5 text-xs bg-slate-50 border border-slate-200 rounded text-center"
                        />
                        <span className="text-[11px] text-slate-500">%</span>
                      </div>
                    </div>
                    <span className="font-mono font-semibold text-amber-700">
                      +${commercialSummary.riskAllowanceAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Configurable Commercial Discount */}
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600">6.0 Commercial Volume Discount:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.5"
                          value={discountConfig.percentValue}
                          onChange={(e) =>
                            setDiscountConfig({ ...discountConfig, percentValue: parseFloat(e.target.value) || 0 })
                          }
                          className="w-14 px-1.5 py-0.5 text-xs bg-slate-50 border border-slate-200 rounded text-center"
                        />
                        <span className="text-[11px] text-slate-500">%</span>
                      </div>
                    </div>
                    <span className="font-mono font-semibold text-emerald-700">
                      -${commercialSummary.discountAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-600">7.0 Statutory VAT / Tax (5.0%):</span>
                    <span className="font-mono font-semibold text-slate-800">
                      +${commercialSummary.taxVatAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between py-2.5 bg-indigo-50/80 px-3 rounded-lg font-bold text-indigo-950 text-sm">
                    <span>FINAL TENDER GRAND TOTAL:</span>
                    <span className="font-mono">
                      ${commercialSummary.tenderGrandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* In-Words Banner */}
                <div className="p-3 bg-slate-900 text-white rounded-lg text-xs space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Amount in Words (Calculated)
                  </span>
                  <p className="font-serif italic text-amber-200">
                    "{commercialSummary.tenderGrandTotalInWords}"
                  </p>
                </div>
              </div>
            </div>

            {/* Form of Tender Covenant Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  Form of Tender Executive Covenant
                </h3>
                <button
                  onClick={() => setIsPrintModalOpen(true)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Letter
                </button>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-200">
                We, the undersigned Tenderer, having examined the Conditions of Contract, Specifications, Drawings,
                Priced Bill of Quantities, Addenda (Nos. {addenda.map((a) => a.addendumNo).join(', ') || 'None'}),
                and Clarifications, hereby offer to execute and complete the whole of the works for the total Tender Sum of{' '}
                <strong className="text-slate-900">
                  USD ${commercialSummary.tenderGrandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </strong>{' '}
                ({commercialSummary.tenderGrandTotalInWords}) in accordance with the Tender Documents.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: DOCUMENTS & DRAWINGS */}
        {activeTab === 'documents' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Tender Document Register</h3>
                  <p className="text-xs text-slate-500">
                    Categorized register of tender invitations, ITT, specs, priced BOQ, and legal forms
                  </p>
                </div>
                <button
                  onClick={() => {
                    const newDoc: TenderDocumentItem = {
                      id: `TDOC-${Date.now().toString().slice(-4)}`,
                      documentName: 'New Tender Supplemental Document',
                      documentType: 'Other',
                      revision: 'Rev 00',
                      date: new Date().toISOString().slice(0, 10),
                      source: 'Tender Office',
                      status: 'CURRENT',
                      fileName: 'Supplemental_Doc.pdf',
                      fileSize: '1.2 MB',
                      isMandatoryForSubmission: false,
                      isProvided: true,
                    };
                    setDocuments([...documents, newDoc]);
                    showToast('Document added to register.');
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Document
                </button>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Document Name</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Revision</th>
                      <th className="py-2.5 px-3">Issue Date</th>
                      <th className="py-2.5 px-3">File / Size</th>
                      <th className="py-2.5 px-3 text-center">Mandatory</th>
                      <th className="py-2.5 px-3 text-center">Provided</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {documents.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                            <span>{d.documentName}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                            {d.documentType}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono">{d.revision}</td>
                        <td className="py-2.5 px-3">{d.date}</td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                          {d.fileName} {d.fileSize && `(${d.fileSize})`}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => {
                              setDocuments(
                                documents.map((item) =>
                                  item.id === d.id
                                    ? { ...item, isMandatoryForSubmission: !item.isMandatoryForSubmission }
                                    : item
                                )
                              );
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                              d.isMandatoryForSubmission
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {d.isMandatoryForSubmission ? 'MANDATORY' : 'OPTIONAL'}
                          </button>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => {
                              setDocuments(
                                documents.map((item) =>
                                  item.id === d.id ? { ...item, isProvided: !item.isProvided } : item
                                )
                              );
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                              d.isProvided ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {d.isProvided ? 'ATTACHED' : 'MISSING'}
                          </button>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => {
                              setDocuments(documents.filter((item) => item.id !== d.id));
                              showToast('Document removed.');
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DRAWINGS */}
        {activeTab === 'drawings' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Tender Drawing Register</h3>
                  <p className="text-xs text-slate-500">
                    Linked takeoff drawings with revision control and BOQ cross-references
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded">
                  Total Drawings: {drawings.length}
                </span>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Drawing No</th>
                      <th className="py-2.5 px-4">Title</th>
                      <th className="py-2.5 px-3">Discipline</th>
                      <th className="py-2.5 px-3">Revision</th>
                      <th className="py-2.5 px-3">Issue Date</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-center">In BOQ</th>
                      <th className="py-2.5 px-3 text-center">Verified Takeoff</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {drawings.map((drw) => (
                      <tr key={drw.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">
                          {drw.drawingNo}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-slate-800">
                          {drw.title}
                          {drw.notes && (
                            <span className="block text-[11px] text-slate-400 font-normal">
                              {drw.notes}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                            {drw.discipline}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono">{drw.revision}</td>
                        <td className="py-2.5 px-3">{drw.date}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              drw.status === 'APPROVED_FOR_TENDER'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {drw.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              drw.usedInBoq ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            {drw.usedInBoq ? 'YES' : 'NO'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                              drw.verified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {drw.verified ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                            {drw.verified ? 'VERIFIED' : 'PENDING'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SCOPE, INCLUSIONS & PROVISIONAL SUMS */}
        {activeTab === 'scope' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            {/* Scope & Responsibility Matrix */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Scope & Responsibility Matrix</h3>
                  <p className="text-xs text-slate-500">
                    Defines work package responsibility between Contractor, Client direct, and Specialist trades
                  </p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Work Package Scope</th>
                      <th className="py-2.5 px-3">Discipline</th>
                      <th className="py-2.5 px-3 text-center">Included</th>
                      <th className="py-2.5 px-3 text-center">Excluded</th>
                      <th className="py-2.5 px-3">Responsible Party</th>
                      <th className="py-2.5 px-3">Spec Ref / Specialist</th>
                      <th className="py-2.5 px-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {scopeMatrix.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{item.workPackage}</td>
                        <td className="py-2.5 px-3 text-slate-600">{item.discipline}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.included ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            {item.included ? 'YES' : 'NO'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.excluded ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            {item.excluded ? 'YES' : 'NO'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold text-[10px]">
                            {item.responsibleParty.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                          {item.specialistName || item.specReference || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 text-[11px]">{item.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Inclusions and Exclusions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Inclusions */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Formal Project Inclusions
                </h3>
                <div className="space-y-2">
                  {inclusions.map((inc) => (
                    <div key={inc.id} className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-lg text-xs space-y-1">
                      <div className="flex justify-between font-semibold text-emerald-950">
                        <span>{inc.discipline}</span>
                        <span className="text-[10px] text-emerald-700 font-mono">{inc.specificationRef}</span>
                      </div>
                      <p className="text-slate-700">{inc.scopeItem}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Exclusions */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Formal Project Exclusions
                </h3>
                <div className="space-y-2">
                  {exclusions.map((exc) => (
                    <div key={exc.id} className="p-3 bg-rose-50/50 border border-rose-100 rounded-lg text-xs space-y-1">
                      <div className="flex justify-between font-semibold text-rose-950">
                        <span>{exc.excludedItem}</span>
                        <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold">
                          {exc.partyResponsible}
                        </span>
                      </div>
                      <p className="text-slate-700 text-[11px]">{exc.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Provisional Sums & Prime Cost Items */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Provisional Sums */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 text-sm">Provisional Sums Register</h3>
                  <span className="text-xs font-mono font-bold text-indigo-600">
                    Total: ${commercialSummary.provisionalSumsTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="space-y-2">
                  {provisionalSums.map((ps) => (
                    <div key={ps.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                      <div className="flex justify-between font-semibold text-slate-800">
                        <span>[{ps.itemNo}] {ps.description}</span>
                        <span className="font-mono text-indigo-700">${ps.amount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Purpose: {ps.reason}</span>
                        <span className="font-bold text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">
                          {ps.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prime Cost Items */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 text-sm">Prime Cost (PC) Items with Attendance</h3>
                  <span className="text-xs font-mono font-bold text-indigo-600">
                    Total: ${commercialSummary.primeCostTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="space-y-2">
                  {primeCostItems.map((pc) => (
                    <div key={pc.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                      <div className="flex justify-between font-semibold text-slate-800">
                        <span>[{pc.itemNo}] {pc.description}</span>
                        <span className="font-mono text-slate-900">${pc.totalWithAttendance.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Allowance: ${pc.allowanceAmount.toLocaleString()} + Attendance ({pc.attendancePercent}% = ${pc.attendanceAmount.toLocaleString()})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Alternate Value Engineering Proposals */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h3 className="font-bold text-slate-800 text-sm">Alternate Proposals (Value Engineering)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {alternates.map((alt) => (
                  <div key={alt.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-indigo-700 font-mono">{alt.alternateCode}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          alt.costDifference < 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        Cost Delta: {alt.costDifference < 0 ? '-' : '+'}${Math.abs(alt.costDifference).toLocaleString()} ({alt.differencePercent}%)
                      </span>
                    </div>
                    <div className="text-slate-700">
                      <p><strong>Base Scope:</strong> {alt.baseScopeTitle}</p>
                      <p className="mt-1"><strong>Alternate:</strong> {alt.alternateScopeTitle}</p>
                    </div>
                    <p className="text-[11px] text-slate-500 italic bg-white p-2 rounded border border-slate-100">
                      {alt.engineeringMerit}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: ADDENDA & IMPACT */}
        {activeTab === 'addenda' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Tender Addenda & Impact Analysis</h3>
                  <p className="text-xs text-slate-500">
                    Tracks formal addenda issued during bidding, affected drawings, quantity changes, and pricing deltas
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {addenda.map((ad) => (
                  <div key={ad.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-3">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-indigo-700">{ad.addendumNo}</span>
                          <span className="text-slate-500">Issued: {ad.date}</span>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                            {ad.status}
                          </span>
                        </div>
                        <p className="font-semibold text-slate-800 text-sm mt-1">{ad.description}</p>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-xs text-slate-500 block">Total Pricing Delta</span>
                        <span className="text-sm font-bold text-amber-700">
                          +${ad.pricingChangeTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded border border-slate-100 text-slate-600">
                      <div>
                        <span className="font-semibold text-slate-700">Affected Drawings:</span>{' '}
                        {ad.affectedDrawingNos.join(', ')}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700">Affected BOQ Codes:</span>{' '}
                        {ad.affectedBoqItemCodes.join(', ')}
                      </div>
                      <div className="col-span-2">
                        <span className="font-semibold text-slate-700">Quantity Delta Summary:</span>{' '}
                        {ad.quantityChangeSummary}
                      </div>
                      <div className="col-span-2">
                        <span className="font-semibold text-slate-700">Specification Change:</span>{' '}
                        {ad.specificationChangeSummary}
                      </div>
                    </div>

                    {/* Detailed Impact Breakdown */}
                    {ad.impactItems && ad.impactItems.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                          Element-Wise Addendum Impact
                        </span>
                        <div className="border border-slate-200 rounded overflow-hidden bg-white">
                          <table className="w-full text-left text-[11px]">
                            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                              <tr>
                                <th className="py-1.5 px-2.5">Item / Drawing</th>
                                <th className="py-1.5 px-2.5">Element Description</th>
                                <th className="py-1.5 px-2.5 text-right">Previous Qty</th>
                                <th className="py-1.5 px-2.5 text-right">New Qty</th>
                                <th className="py-1.5 px-2.5 text-right">Delta Qty</th>
                                <th className="py-1.5 px-2.5 text-right">Rate ($)</th>
                                <th className="py-1.5 px-2.5 text-right">Pricing Impact ($)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {ad.impactItems.map((imp, idx) => (
                                <tr key={idx}>
                                  <td className="py-1.5 px-2.5 font-mono text-indigo-700">
                                    {imp.boqItemCode || imp.drawingNo}
                                  </td>
                                  <td className="py-1.5 px-2.5">{imp.elementDescription}</td>
                                  <td className="py-1.5 px-2.5 text-right font-mono">{imp.previousQuantity ?? '-'}</td>
                                  <td className="py-1.5 px-2.5 text-right font-mono">{imp.newQuantity ?? '-'}</td>
                                  <td className="py-1.5 px-2.5 text-right font-mono font-bold text-indigo-600">
                                    {imp.quantityDelta ? `+${imp.quantityDelta} ${imp.unit || ''}` : '-'}
                                  </td>
                                  <td className="py-1.5 px-2.5 text-right font-mono">${imp.rate?.toFixed(2) ?? '-'}</td>
                                  <td className="py-1.5 px-2.5 text-right font-mono font-bold text-amber-700">
                                    +${imp.pricingImpact.toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: CLARIFICATIONS */}
        {activeTab === 'clarifications' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Tender Clarifications (RFI) Register</h3>
                  <p className="text-xs text-slate-500">
                    Formal tender queries submitted to Employer & Consultant with binding responses
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {clarifications.map((clr) => (
                  <div key={clr.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-indigo-700 font-mono">{clr.id}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Raised: {clr.dateRaised}</span>
                        <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-100 text-emerald-800">
                          {clr.status}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded border border-slate-100 space-y-1.5">
                      <p className="text-slate-800 font-semibold">
                        <span className="text-indigo-600 font-bold mr-1">Q:</span> {clr.question}
                      </p>
                      <p className="text-slate-600">
                        <span className="text-emerald-600 font-bold mr-1">A:</span> {clr.response}{' '}
                        <span className="text-[10px] text-slate-400">({clr.responseDate})</span>
                      </p>
                    </div>

                    {clr.impacts && clr.impacts.length > 0 && (
                      <div className="text-[11px] text-slate-500 flex items-center gap-2">
                        <span className="font-semibold text-slate-700">Impact Assessment:</span>
                        {clr.impacts.map((imp, i) => (
                          <span key={i} className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-medium">
                            [{imp.affectedItemType}] {imp.details} {imp.impactValue ? `(+$${imp.impactValue.toLocaleString()})` : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: BID COMPARISON & COMPETITOR ANALYSIS */}
        {activeTab === 'bid_comparison' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            {/* Bid Analysis Summary KPIs */}
            {bidAnalysisStats && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Our Internal Rank</span>
                  <div className="text-xl font-extrabold text-indigo-700 mt-1">
                    #{bidAnalysisStats.ourRank} of {bidAnalysisStats.biddersCount}
                  </div>
                  <span className="text-[10px] text-slate-400">Competitive standing</span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Lowest Bidder Price</span>
                  <div className="text-base font-extrabold text-emerald-700 mt-1 font-mono">
                    ${bidAnalysisStats.lowestPrice.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                  </div>
                  <span className="text-[10px] text-slate-400 truncate block">{bidAnalysisStats.lowestBidder}</span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Average Market Bid</span>
                  <div className="text-base font-extrabold text-slate-800 mt-1 font-mono">
                    ${bidAnalysisStats.averagePrice.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                  </div>
                  <span className="text-[10px] text-slate-400">Mean tender value</span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Variance from Lowest</span>
                  <div className="text-base font-extrabold text-amber-700 mt-1 font-mono">
                    {bidAnalysisStats.varianceFromLowest >= 0 ? '+' : ''}${bidAnalysisStats.varianceFromLowest.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                    <span className="text-xs ml-1">({bidAnalysisStats.varianceFromLowestPercent.toFixed(1)}%)</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Delta to minimum</span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Highest Bidder Price</span>
                  <div className="text-base font-extrabold text-rose-700 mt-1 font-mono">
                    ${bidAnalysisStats.highestPrice.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                  </div>
                  <span className="text-[10px] text-slate-400 truncate block">{bidAnalysisStats.highestBidder}</span>
                </div>
              </div>
            )}

            {/* Bidders Comparison Table */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Competitor Bids & Internal Estimate Matrix</h3>
                  <p className="text-xs text-slate-500">
                    Side-by-side comparison of base pricing, provisional sums, discounts, and final tender prices
                  </p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Bidder Name</th>
                      <th className="py-2.5 px-3 text-right">Base Price ($)</th>
                      <th className="py-2.5 px-3 text-right">PS ($)</th>
                      <th className="py-2.5 px-3 text-right">Discount ($)</th>
                      <th className="py-2.5 px-3 text-right">Final Price (USD)</th>
                      <th className="py-2.5 px-3 text-right">Variance ($ / %)</th>
                      <th className="py-2.5 px-3 text-center">Validity</th>
                      <th className="py-2.5 px-3">Source & Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {competitorBids.map((b) => {
                      const diff = b.finalTenderPrice - commercialSummary.tenderGrandTotal;
                      const diffPct = commercialSummary.tenderGrandTotal > 0
                        ? (diff / commercialSummary.tenderGrandTotal) * 100
                        : 0;
                      return (
                        <tr
                          key={b.id}
                          className={b.isInternalEstimate ? 'bg-indigo-50/50 font-semibold' : 'hover:bg-slate-50'}
                        >
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              {b.isInternalEstimate && (
                                <span className="px-1.5 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-bold">
                                  OURS
                                </span>
                              )}
                              <span className="text-slate-800">{b.bidderName}</span>
                              {b.isUserEntered && (
                                <span className="text-[10px] text-slate-400 bg-slate-100 px-1 py-0.5 rounded">
                                  USER ENTERED
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">${b.basePrice.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-right font-mono">${b.provisionalSum.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-emerald-700">
                            {b.discount > 0 ? `-$${b.discount.toLocaleString()}` : '$0'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            ${b.finalTenderPrice.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold">
                            {b.isInternalEstimate ? (
                              <span className="text-slate-400">Baseline</span>
                            ) : (
                              <span className={diff < 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                {diff >= 0 ? '+' : ''}${diff.toLocaleString()} ({diffPct.toFixed(1)}%)
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-500 font-mono">
                            {b.validityDays}d
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 text-[11px]">{b.notes}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Add Competitor Bid Inline Form */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <span className="font-bold text-slate-700 text-xs block">
                  Add Competitor Tender Return (Manual Entry):
                </span>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
                  <input
                    type="text"
                    placeholder="Competitor Company Name"
                    value={newBidderName}
                    onChange={(e) => setNewBidderName(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:border-indigo-500"
                  />
                  <input
                    type="number"
                    placeholder="Final Tender Price (USD)"
                    value={newBidderPrice || ''}
                    onChange={(e) => setNewBidderPrice(parseFloat(e.target.value) || 0)}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="Notes / Tender Opening Intel"
                    value={newBidderNotes}
                    onChange={(e) => setNewBidderNotes(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:border-indigo-500"
                  />
                  <button
                    onClick={handleAddCompetitorBid}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Competitor Bid
                  </button>
                </div>
              </div>
            </div>

            {/* Item-Wise Comparison Table */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h3 className="font-bold text-slate-800 text-sm">Item-Wise Rate & Quantity Deviation Analysis</h3>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Item Code</th>
                      <th className="py-2.5 px-4">Description</th>
                      <th className="py-2.5 px-3 text-right">Our Qty</th>
                      <th className="py-2.5 px-3 text-right">Competitor Qty</th>
                      <th className="py-2.5 px-3 text-right">Our Rate ($)</th>
                      <th className="py-2.5 px-3 text-right">Competitor Rate ($)</th>
                      <th className="py-2.5 px-3 text-right">Rate Delta (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {competitorItemComparison.map((item) => (
                      <tr key={item.itemCode} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">{item.itemCode}</td>
                        <td className="py-2.5 px-4 text-slate-800 font-semibold">{item.description}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{item.ourQuantity} {item.unit}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-500">{item.competitorQuantity} {item.unit}</td>
                        <td className="py-2.5 px-3 text-right font-mono">${item.ourRate.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right font-mono">${item.competitorRate.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">
                          <span className={item.rateDifference < 0 ? 'text-emerald-600' : 'text-rose-600'}>
                            {item.rateDifference >= 0 ? '+' : ''}{item.rateDifferencePercent.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: RISKS & ASSUMPTIONS */}
        {activeTab === 'risk_assumptions' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            {/* Risk Register Table */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Tender Risk Register & 5×5 Matrix Scoring</h3>
                  <p className="text-xs text-slate-500">
                    Structured risk scoring (Probability 1-5 × Impact 1-5), cost allowances, and mitigation plans
                  </p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Risk ID</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-4">Risk Description</th>
                      <th className="py-2.5 px-3 text-center">P × I = Score</th>
                      <th className="py-2.5 px-3">Level</th>
                      <th className="py-2.5 px-3 text-right">Cost Impact ($)</th>
                      <th className="py-2.5 px-4">Mitigation Action</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {risks.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{r.id}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">
                            {r.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-slate-800">{r.description}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold">
                          {r.probability} × {r.impact} = {r.riskScore}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              r.riskLevel === 'HIGH' || r.riskLevel === 'CRITICAL'
                                ? 'bg-rose-100 text-rose-800'
                                : r.riskLevel === 'MEDIUM'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {r.riskLevel}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-amber-700">
                          ${r.costImpact.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600 text-[11px]">{r.mitigation}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tender Assumptions */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h3 className="font-bold text-slate-800 text-sm">Commercial & Technical Assumptions Register</h3>
              <div className="space-y-2">
                {assumptions.map((asm) => (
                  <div key={asm.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                    <div className="flex justify-between font-semibold text-slate-800">
                      <span>[{asm.id}] {asm.assumptionText}</span>
                      <span className="text-[10px] text-slate-500 font-mono">Ref: {asm.linkedCode || 'General'}</span>
                    </div>
                    <p className="text-amber-800 text-[11px]">
                      <strong>Commercial Impact:</strong> {asm.commercialImpact}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 9: REVIEWS & APPROVALS */}
        {activeTab === 'reviews_approvals' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            {/* Linear Workflow Audit Ribbon */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-800 text-sm">Tender Review & Governance Workflow</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {workflowSteps.map((wf, idx) => (
                  <div key={wf.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between text-indigo-700 font-bold text-[11px]">
                      <span>Stage {idx + 1}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <p className="font-bold text-slate-800">{wf.action}</p>
                    <p className="text-[10px] text-slate-500">{wf.user} ({wf.role})</p>
                    <p className="text-[11px] text-slate-600 italic">"{wf.comments}"</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Internal Review Comments Thread */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Internal Review Comments & Actions</h3>
                  <p className="text-xs text-slate-500">
                    Peer audit comments on BOQ rates, specifications, risk, and commercial margins
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {reviewComments.map((rc) => (
                  <div
                    key={rc.id}
                    className={`p-3 rounded-lg border text-xs space-y-2 ${
                      rc.status === 'RESOLVED'
                        ? 'bg-slate-50/70 border-slate-200'
                        : rc.priority === 'CRITICAL'
                        ? 'bg-rose-50 border-rose-200'
                        : 'bg-amber-50 border-amber-200'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{rc.user}</span>
                        <span className="text-[10px] text-slate-500">({rc.userRole})</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white border border-slate-200">
                          {rc.section}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            rc.priority === 'CRITICAL'
                              ? 'bg-rose-600 text-white'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {rc.priority}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500">{rc.date}</span>
                        {rc.status === 'OPEN' ? (
                          <button
                            onClick={() => handleResolveComment(rc.id)}
                            className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold cursor-pointer transition-colors"
                          >
                            Mark Resolved
                          </button>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                            RESOLVED
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-slate-800">{rc.comment}</p>
                    {rc.resolutionNote && (
                      <p className="text-[11px] text-emerald-800 bg-white p-2 rounded border border-emerald-100">
                        <strong>Resolution:</strong> {rc.resolutionNote}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Add New Review Comment Box */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <span className="font-bold text-slate-700 text-xs block">Log Internal Review Comment:</span>
                <div className="flex gap-2">
                  <select
                    value={newCommentSection}
                    onChange={(e) =>
                      setNewCommentSection(e.target.value as TenderReviewComment['section'])
                    }
                    className="px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                  >
                    <option value="BOQ">BOQ</option>
                    <option value="RATES">Rates</option>
                    <option value="QUANTITIES">Quantities</option>
                    <option value="SPECIFICATIONS">Specifications</option>
                    <option value="SCOPE">Scope</option>
                    <option value="RISK">Risk</option>
                    <option value="PROFIT">Profit</option>
                  </select>

                  <select
                    value={newCommentPriority}
                    onChange={(e) =>
                      setNewCommentPriority(e.target.value as TenderReviewComment['priority'])
                    }
                    className="px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Enter audit review observation or requirement..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    className="flex-1 px-3 py-1 bg-white border border-slate-300 rounded text-xs focus:border-indigo-500"
                  />

                  <button
                    onClick={handleAddReviewComment}
                    className="px-4 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Add Comment
                  </button>
                </div>
              </div>
            </div>

            {/* Authorised Corporate Signatures */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h3 className="font-bold text-slate-800 text-sm">Authorized Corporate Tender Signatories</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Prepared By</span>
                  <p className="font-bold text-slate-900">{signatures.preparedBy.name}</p>
                  <p className="text-slate-500 text-[11px]">{signatures.preparedBy.title}</p>
                  <div className="flex items-center gap-1 text-emerald-600 font-semibold pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Signed ({signatures.preparedBy.date})
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Checked By</span>
                  <p className="font-bold text-slate-900">{signatures.checkedBy.name}</p>
                  <p className="text-slate-500 text-[11px]">{signatures.checkedBy.title}</p>
                  <div className="flex items-center gap-1 text-emerald-600 font-semibold pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Signed ({signatures.checkedBy.date})
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Approved By (Executive)</span>
                  <p className="font-bold text-slate-900">{signatures.approvedBy.name}</p>
                  <p className="text-slate-500 text-[11px]">{signatures.approvedBy.title}</p>
                  <div className="flex items-center gap-1 text-emerald-600 font-semibold pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Signed ({signatures.approvedBy.date})
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 10: SUBMISSION PACKAGE & QA */}
        {activeTab === 'submission_qa' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            {/* Submission Package Generation Hero Card */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-xl p-6 shadow-md flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-indigo-500 text-white font-mono rounded text-[10px] font-bold">
                    13-FOLDER STRUCTURE
                  </span>
                  <span className="text-xs text-indigo-200">OpenXML XLSX & MD Compliant</span>
                </div>
                <h2 className="text-lg font-bold">Tender Submission Package Generator</h2>
                <p className="text-xs text-slate-300 max-w-xl">
                  Compiles Form of Tender, Priced BOQ, Rate Build-ups, BBS Schedules, Drawing Registers, Addenda, Clarifications, and Checklists into a structured, audit-sealed ZIP archive with SHA-256 integrity checksums.
                </p>
              </div>

              <div className="flex flex-col items-center gap-2 shrink-0">
                <button
                  onClick={handleGenerateSubmissionPackage}
                  disabled={isPackaging || !qaReport.overallReadyForSubmission}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  {isPackaging ? 'Compiling Archive...' : 'Download Submission ZIP Package'}
                </button>
                {!qaReport.overallReadyForSubmission && (
                  <span className="text-[11px] text-rose-300 font-medium">
                    Blocked by {qaReport.criticalBlockersCount} QA Gate issues
                  </span>
                )}
              </div>
            </div>

            {/* Submission Checklist */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Tender Return Submission Checklist</h3>
                  <p className="text-xs text-slate-500">
                    Mandatory verification checklist before formal bid submission
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-600">
                  {checklist.filter((c) => c.status === 'COMPLETE').length} of {checklist.length} Complete
                </span>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Requirement</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-center">Mandatory</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3">Verified By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {checklist.map((chk) => (
                      <tr key={chk.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-800">{chk.itemTitle}</span>
                          <span className="block text-[11px] text-slate-400">{chk.description}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
                            {chk.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              chk.isMandatory ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {chk.isMandatory ? 'YES' : 'NO'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => handleToggleChecklist(chk.id)}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                              chk.status === 'COMPLETE'
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : chk.status === 'INCOMPLETE'
                                ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {chk.status}
                          </button>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                          {chk.verifiedBy ? `${chk.verifiedBy} (${chk.verifiedDate})` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 11: HISTORY & ARCHIVE */}
        {activeTab === 'history_archive' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            {/* Historical Tenders Database */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Historical Tender Records & Win/Loss Database</h3>
                  <p className="text-xs text-slate-500">
                    Past bidding analytics, winning prices, achieved margins, and post-bid lessons learned
                  </p>
                </div>
                <button
                  onClick={() => setIsDuplicateModalOpen(true)}
                  className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Copy className="w-3.5 h-3.5" /> Duplicate Tender as New Project
                </button>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Tender Ref</th>
                      <th className="py-2.5 px-4">Project Name</th>
                      <th className="py-2.5 px-3">Client</th>
                      <th className="py-2.5 px-3 text-right">Our Bid ($)</th>
                      <th className="py-2.5 px-3">Outcome</th>
                      <th className="py-2.5 px-3 text-right">Winning Price ($)</th>
                      <th className="py-2.5 px-3 text-right">Achieved Margin</th>
                      <th className="py-2.5 px-4">Key Lessons Learned</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historicalTenders.map((ht) => (
                      <tr key={ht.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{ht.tenderNumber}</td>
                        <td className="py-2.5 px-4 font-semibold text-slate-800">{ht.projectName}</td>
                        <td className="py-2.5 px-3 text-slate-600">{ht.client}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold">${ht.tenderAmount.toLocaleString()}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ht.outcome === 'AWARDED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {ht.outcome}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                          ${ht.winningAmount?.toLocaleString() ?? '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-indigo-600 font-bold">
                          {ht.profitMarginAchieved ? `${ht.profitMarginAchieved}%` : '-'}
                        </td>
                        <td className="py-2.5 px-4 text-slate-500 text-[11px]">{ht.keyLessonsLearned}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tender Revision History */}
            {revisionHistory.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
                <h3 className="font-bold text-slate-800 text-sm">Tender Revision History Log</h3>
                <div className="space-y-2">
                  {revisionHistory.map((rev, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex justify-between items-center">
                      <div>
                        <span className="font-bold text-indigo-700">{rev.revisionCode}</span>
                        <span className="text-slate-500 ml-2">({rev.date} by {rev.user})</span>
                        <p className="text-slate-700 mt-0.5">{rev.reason}</p>
                      </div>
                      <div className="text-right font-mono font-bold text-slate-900">
                        ${rev.tenderGrandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <TenderQaModal
        isOpen={isQaModalOpen}
        onClose={() => setIsQaModalOpen(false)}
        qaReport={qaReport}
        onProceedToSubmission={handleGenerateSubmissionPackage}
      />

      <TenderTestSuiteModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        onRunTests={() =>
          TenderTestSuite.runAllTests(
            tenderInfo,
            unifiedBoqItems,
            rateAnalyses,
            activeScenario,
            scopeMatrix,
            inclusions,
            exclusions,
            provisionalSums,
            primeCostItems,
            optionalItems,
            alternates,
            documents,
            drawings,
            addenda,
            clarifications,
            checklist,
            signatures,
            workflowSteps,
            reviewComments,
            competitorBids,
            risks,
            assumptions,
            historicalTenders
          )
        }
      />

      <TenderPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        tenderInfo={tenderInfo}
        commercialSummary={commercialSummary}
        signatures={signatures}
        addenda={addenda}
        provisionalSums={provisionalSums}
        primeCostItems={primeCostItems}
      />

      <TenderDuplicateModal
        isOpen={isDuplicateModalOpen}
        onClose={() => setIsDuplicateModalOpen(false)}
        currentTender={tenderInfo}
        onConfirmDuplicate={handleDuplicateTender}
      />
    </div>
  );
};
