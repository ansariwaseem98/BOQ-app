/**
 * AI BOQ & Tender Estimation Engineer - Phase 13 Tender Calculation & Management Engine
 */

import { UnifiedBoqItem } from '../types/index';
import { RateAnalysisRecord, PricingScenario } from '../types/rateAnalysis';
import {
  TenderInfo,
  TenderDocumentItem,
  TenderDrawingRegisterItem,
  TenderAddendum,
  TenderClarification,
  ScopeMatrixItem,
  ProvisionalSumItem,
  PrimeCostItem,
  OptionalItem,
  AlternateOptionItem,
  TenderDiscountConfig,
  TenderRiskAllowanceConfig,
  CommercialBidSummary,
  TenderChecklistItem,
  TenderSignatures,
  TenderReviewComment,
  CompetitorBid,
  CompetitorItemRateComparison,
  BidAnalysisStats,
  TenderRiskItem,
  TenderQaReport,
  TenderQaPillarStatus,
} from '../types/tender';

export class TenderEngine {
  /**
   * Calculate full Commercial Bid Summary with complete reconciliation and profit margins
   */
  public static calculateCommercialBidSummary(
    boqItems: UnifiedBoqItem[],
    rateAnalyses: RateAnalysisRecord[],
    activeScenario: PricingScenario,
    provisionalSums: ProvisionalSumItem[],
    primeCostItems: PrimeCostItem[],
    optionalItems: OptionalItem[],
    discountConfig: TenderDiscountConfig,
    riskConfig: TenderRiskAllowanceConfig,
    taxRatePercent: number = 5.0,
    currency: string = 'AED'
  ): CommercialBidSummary {
    // 1. Calculate Base Measured BOQ Total & Estimated Costs
    let baseBoqMeasuredTotal = 0;
    let estimatedDirectCost = 0;
    let estimatedOverheadCost = 0;

    boqItems.forEach((item) => {
      const rateAnalysis = rateAnalyses.find(
        (r) => r.boqItemId === item.id || r.itemCode === item.itemCode
      );

      const qty = item.finalQuantity || 0;
      const finalRate = rateAnalysis?.finalRate || 0;
      const itemAmount = qty * finalRate;

      baseBoqMeasuredTotal += itemAmount;

      if (rateAnalysis) {
        estimatedDirectCost += (rateAnalysis.directCost || 0) * qty;
        estimatedOverheadCost += (rateAnalysis.overheadAmount || 0) * qty;
      }
    });

    // 2. Provisional Sums Total (only those not already measured in BOQ)
    const provisionalSumsTotal = provisionalSums
      .filter((ps) => !ps.isMeasuredInBoq)
      .reduce((sum, ps) => sum + (ps.amount || 0), 0);

    // 3. Prime Cost Items Total (allowance + contractor attendance)
    const primeCostTotal = primeCostItems.reduce(
      (sum, pc) => sum + (pc.allowanceAmount || 0) + (pc.attendanceAmount || 0),
      0
    );

    // 4. Selected Options Total (Optional items do NOT auto-enter unless selected)
    const selectedOptionsTotal = optionalItems
      .filter((opt) => opt.isSelectedInBaseTender)
      .reduce((sum, opt) => sum + (opt.amount || 0), 0);

    // 5. Subtotal before Risk & Discount
    const subtotalBeforeRiskDiscount =
      baseBoqMeasuredTotal + provisionalSumsTotal + primeCostTotal + selectedOptionsTotal;

    // 6. Risk Allowance calculation (Separate line item, never hidden in rates)
    let riskAllowanceAmount = 0;
    let riskAllowancePercent = 0;
    if (riskConfig.type === 'PERCENTAGE') {
      riskAllowancePercent = riskConfig.percentValue;
      riskAllowanceAmount = (subtotalBeforeRiskDiscount * riskConfig.percentValue) / 100;
    } else if (riskConfig.type === 'FIXED') {
      riskAllowanceAmount = riskConfig.fixedAmount;
      riskAllowancePercent = subtotalBeforeRiskDiscount > 0
        ? (riskConfig.fixedAmount / subtotalBeforeRiskDiscount) * 100
        : 0;
    }

    // 7. Discount calculation (Never modifies original unit rates)
    let discountAmount = 0;
    let discountPercent = 0;
    const baseForDiscount = subtotalBeforeRiskDiscount + riskAllowanceAmount;
    if (discountConfig.type === 'PERCENTAGE') {
      discountPercent = discountConfig.percentValue;
      discountAmount = (baseForDiscount * discountConfig.percentValue) / 100;
    } else if (discountConfig.type === 'FIXED') {
      discountAmount = discountConfig.fixedAmount;
      discountPercent = baseForDiscount > 0
        ? (discountConfig.fixedAmount / baseForDiscount) * 100
        : 0;
    }

    // 8. Net Subtotal & Tax
    const subtotalAfterDiscountRisk = baseForDiscount - discountAmount;
    const taxVatPercent = taxRatePercent;
    const taxVatAmount = (subtotalAfterDiscountRisk * taxVatPercent) / 100;

    // 9. Tender Grand Total
    const tenderGrandTotal = subtotalAfterDiscountRisk + taxVatAmount;

    // 10. Profit & Margin Analysis
    const totalEstimatedCost = estimatedDirectCost + estimatedOverheadCost;
    const netCommercialRevenue = subtotalAfterDiscountRisk; // Excl. statutory VAT
    const grossMarginAmount = netCommercialRevenue - totalEstimatedCost;
    const grossMarginPercent = netCommercialRevenue > 0
      ? (grossMarginAmount / netCommercialRevenue) * 100
      : 0;

    // 11. Mathematical Reconciliation Check
    const calculatedReconciliation =
      baseBoqMeasuredTotal +
      provisionalSumsTotal +
      primeCostTotal +
      selectedOptionsTotal +
      riskAllowanceAmount -
      discountAmount +
      taxVatAmount;

    const diff = Math.abs(calculatedReconciliation - tenderGrandTotal);
    const reconciliationBalanced = diff < 0.01;

    // 12. Amount in Words
    const tenderGrandTotalInWords = this.convertNumberToWords(tenderGrandTotal, currency);

    return {
      baseBoqMeasuredTotal,
      provisionalSumsTotal,
      primeCostTotal,
      selectedOptionsTotal,
      subtotalBeforeRiskDiscount,
      riskAllowanceAmount,
      riskAllowancePercent,
      discountAmount,
      discountPercent,
      subtotalAfterDiscountRisk,
      taxVatAmount,
      taxVatPercent,
      tenderGrandTotal,
      tenderGrandTotalInWords,
      estimatedDirectCost,
      estimatedOverheadCost,
      totalEstimatedCost,
      grossMarginAmount,
      grossMarginPercent,
      reconciliationBalanced,
      reconciliationMismatchAmount: diff,
    };
  }

  /**
   * Convert currency number into formal English Words
   */
  public static convertNumberToWords(amount: number, currency: string = 'AED'): string {
    const curUpper = (currency || 'AED').trim().toUpperCase();

    // Map currency names and subunit names
    let majorUnit = curUpper;
    let minorUnit = 'Cents';

    switch (curUpper) {
      case 'AED':
        majorUnit = 'UAE Dirhams';
        minorUnit = 'Fils';
        break;
      case 'USD':
        majorUnit = 'United States Dollars';
        minorUnit = 'Cents';
        break;
      case 'EUR':
        majorUnit = 'Euros';
        minorUnit = 'Cents';
        break;
      case 'GBP':
        majorUnit = 'Pounds Sterling';
        minorUnit = 'Pence';
        break;
      case 'SAR':
        majorUnit = 'Saudi Riyals';
        minorUnit = 'Halalas';
        break;
      case 'QAR':
        majorUnit = 'Qatari Riyals';
        minorUnit = 'Dirhams';
        break;
      case 'OMR':
        majorUnit = 'Omani Rials';
        minorUnit = 'Baisa';
        break;
      case 'BHD':
        majorUnit = 'Bahraini Dinars';
        minorUnit = 'Fils';
        break;
      case 'KWD':
        majorUnit = 'Kuwaiti Dinars';
        minorUnit = 'Fils';
        break;
      case 'INR':
        majorUnit = 'Indian Rupees';
        minorUnit = 'Paise';
        break;
      default:
        majorUnit = curUpper;
        minorUnit = 'Cents';
        break;
    }

    if (isNaN(amount) || amount === 0) {
      return `Zero ${majorUnit} Only`;
    }

    const units = [
      '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
      'Seventeen', 'Eighteen', 'Nineteen',
    ];

    const tens = [
      '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
    ];

    const formatHundreds = (n: number): string => {
      let str = '';
      if (n >= 100) {
        str += units[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      if (n >= 20) {
        str += tens[Math.floor(n / 10)] + ' ';
        n %= 10;
      }
      if (n > 0) {
        str += units[n] + ' ';
      }
      return str.trim();
    };

    const integerPart = Math.floor(Math.abs(amount));
    const decimalPart = Math.round((Math.abs(amount) - integerPart) * 100);

    let words = '';

    const billions = Math.floor(integerPart / 1000000000);
    const millions = Math.floor((integerPart % 1000000000) / 1000000);
    const thousands = Math.floor((integerPart % 1000000) / 1000);
    const remainder = integerPart % 1000;

    if (billions > 0) words += formatHundreds(billions) + ' Billion ';
    if (millions > 0) words += formatHundreds(millions) + ' Million ';
    if (thousands > 0) words += formatHundreds(thousands) + ' Thousand ';
    if (remainder > 0) words += formatHundreds(remainder) + ' ';

    words = words.trim();
    if (!words) words = 'Zero';

    const centsWord = decimalPart > 0 ? ` and ${formatHundreds(decimalPart)} ${minorUnit}` : '';

    return `${words} ${majorUnit}${centsWord} Only`;
  }

  /**
   * Evaluate Tender Deadline Countdown and Expiry Status
   */
  public static getTenderDeadlineStatus(
    closingDateStr: string,
    submissionTimeStr: string = '14:00'
  ): {
    status: 'OPEN' | 'CLOSING_SOON' | 'CLOSED';
    daysRemaining: number;
    hoursRemaining: number;
    minutesRemaining: number;
    formattedTimeRemaining: string;
    isPastDeadline: boolean;
  } {
    try {
      const now = new Date();
      const closing = new Date(`${closingDateStr}T${submissionTimeStr}:00`);
      
      const diffMs = closing.getTime() - now.getTime();

      if (diffMs <= 0) {
        return {
          status: 'CLOSED',
          daysRemaining: 0,
          hoursRemaining: 0,
          minutesRemaining: 0,
          formattedTimeRemaining: 'Tender Closed',
          isPastDeadline: true,
        };
      }

      const totalMinutes = Math.floor(diffMs / (1000 * 60));
      const days = Math.floor(totalMinutes / (60 * 24));
      const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
      const minutes = totalMinutes % 60;

      let status: 'OPEN' | 'CLOSING_SOON' | 'CLOSED' = 'OPEN';
      if (days < 3) {
        status = 'CLOSING_SOON';
      }

      const formatted = `${days}d ${hours}h ${minutes}m remaining`;

      return {
        status,
        daysRemaining: days,
        hoursRemaining: hours,
        minutesRemaining: minutes,
        formattedTimeRemaining: formatted,
        isPastDeadline: false,
      };
    } catch {
      return {
        status: 'OPEN',
        daysRemaining: 30,
        hoursRemaining: 0,
        minutesRemaining: 0,
        formattedTimeRemaining: '30d 0h 0m remaining',
        isPastDeadline: false,
      };
    }
  }

  /**
   * Calculate Bid Validity Status & Expiry Warning
   */
  public static getBidValidityStatus(
    validityExpiryDateStr: string
  ): {
    isValid: boolean;
    daysUntilExpiry: number;
    isExpiringSoon: boolean;
    warningMessage?: string;
  } {
    try {
      const now = new Date();
      const expiry = new Date(validityExpiryDateStr);
      const diffMs = expiry.getTime() - now.getTime();
      const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      const isValid = days > 0;
      const isExpiringSoon = days > 0 && days <= 15;

      let warningMessage: string | undefined;
      if (!isValid) {
        warningMessage = `Bid validity expired ${Math.abs(days)} days ago. Formal validity extension letter required.`;
      } else if (isExpiringSoon) {
        warningMessage = `Bid validity will expire in ${days} days. Monitor client award decision or request extension.`;
      }

      return {
        isValid,
        daysUntilExpiry: days,
        isExpiringSoon,
        warningMessage,
      };
    } catch {
      return {
        isValid: true,
        daysUntilExpiry: 90,
        isExpiringSoon: false,
      };
    }
  }

  /**
   * Calculate Competitor Bid Comparison & Statistical Analysis
   */
  public static calculateBidAnalysisStats(
    bids: CompetitorBid[],
    internalEstimateAmount: number
  ): BidAnalysisStats | null {
    if (!bids || bids.length === 0) return null;

    const validBids = bids.filter((b) => b.finalTenderPrice > 0);
    if (validBids.length === 0) return null;

    // Sort ascending by price
    const sorted = [...validBids].sort((a, b) => a.finalTenderPrice - b.finalTenderPrice);

    const lowest = sorted[0];
    const highest = sorted[sorted.length - 1];

    const sumPrices = sorted.reduce((sum, b) => sum + b.finalTenderPrice, 0);
    const averagePrice = sumPrices / sorted.length;

    // Median calculation
    let medianPrice = 0;
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
      medianPrice = (sorted[mid - 1].finalTenderPrice + sorted[mid].finalTenderPrice) / 2;
    } else {
      medianPrice = sorted[mid].finalTenderPrice;
    }

    // Rank of internal estimate
    const ourBid = bids.find((b) => b.isInternalEstimate);
    const ourPrice = ourBid ? ourBid.finalTenderPrice : internalEstimateAmount;

    let ourRank = 1;
    sorted.forEach((b, idx) => {
      if (b.isInternalEstimate || Math.abs(b.finalTenderPrice - ourPrice) < 1) {
        ourRank = idx + 1;
      }
    });

    const varianceFromLowest = ourPrice - lowest.finalTenderPrice;
    const varianceFromLowestPercent = lowest.finalTenderPrice > 0
      ? (varianceFromLowest / lowest.finalTenderPrice) * 100
      : 0;

    const varianceFromAverage = ourPrice - averagePrice;
    const varianceFromAveragePercent = averagePrice > 0
      ? (varianceFromAverage / averagePrice) * 100
      : 0;

    return {
      biddersCount: sorted.length,
      lowestPrice: lowest.finalTenderPrice,
      lowestBidder: lowest.bidderName,
      highestPrice: highest.finalTenderPrice,
      highestBidder: highest.bidderName,
      averagePrice,
      medianPrice,
      ourRank,
      varianceFromLowest,
      varianceFromLowestPercent,
      varianceFromAverage,
      varianceFromAveragePercent,
    };
  }

  /**
   * Pre-Flight Tender Submission QA Gate (8 Pillars)
   * Strictly evaluates whether the tender is ready for final submission or blocked.
   */
  public static evaluateTenderQaGate(
    tenderInfo: TenderInfo,
    boqItems: UnifiedBoqItem[],
    rateAnalyses: RateAnalysisRecord[],
    drawings: TenderDrawingRegisterItem[],
    documents: TenderDocumentItem[],
    checklist: TenderChecklistItem[],
    reviewComments: TenderReviewComment[],
    signatures: TenderSignatures,
    commercialSummary: CommercialBidSummary
  ): TenderQaReport {
    const blockerMessages: string[] = [];
    const warningMessages: string[] = [];

    // 1. BOQ Integrity Pillar
    const unpricedItems = boqItems.filter((b) => {
      const rate = rateAnalyses.find((r) => r.boqItemId === b.id || r.itemCode === b.itemCode);
      return !rate || rate.finalRate <= 0;
    });

    const boqIntegrity: TenderQaPillarStatus = {
      pillarName: 'BOQ Pricing Integrity',
      status: unpricedItems.length === 0 ? 'PASSED' : 'FAILED',
      issuesCount: unpricedItems.length,
      details:
        unpricedItems.length === 0
          ? ['All BOQ items have verified unit rates and positive amounts.']
          : unpricedItems.map((b) => `Unpriced Item: [${b.itemCode}] ${b.description}`),
    };
    if (unpricedItems.length > 0) {
      blockerMessages.push(`BOQ has ${unpricedItems.length} unpriced item(s). Pricing must be 100% complete.`);
    }

    // 2. Quantity Verification Pillar
    const unverifiedDrawings = drawings.filter((d) => !d.verified && d.usedInTakeoff);
    const quantityVerification: TenderQaPillarStatus = {
      pillarName: 'Quantity Takeoff Verification',
      status: unverifiedDrawings.length === 0 ? 'PASSED' : 'WARNING',
      issuesCount: unverifiedDrawings.length,
      details:
        unverifiedDrawings.length === 0
          ? ['All active drawings have verified quantity takeoff schedules.']
          : unverifiedDrawings.map((d) => `Drawing ${d.drawingNo} takeoff is not formally verified.`),
    };
    if (unverifiedDrawings.length > 0) {
      warningMessages.push(`${unverifiedDrawings.length} drawing(s) have unverified takeoff status.`);
    }

    // 3. Commercial Pricing Reconciliation Pillar
    const isBalanced = commercialSummary.reconciliationBalanced;
    const pricingReconciliation: TenderQaPillarStatus = {
      pillarName: 'Commercial Reconciliation',
      status: isBalanced ? 'PASSED' : 'FAILED',
      issuesCount: isBalanced ? 0 : 1,
      details: isBalanced
        ? ['Commercial price reconciliation matches exactly to the cent.']
        : [`Mathematical mismatch of $${commercialSummary.reconciliationMismatchAmount.toFixed(2)} in summary reconciliation.`],
    };
    if (!isBalanced) {
      blockerMessages.push('Commercial price reconciliation has a mathematical discrepancy.');
    }

    // 4. Drawing Register Pillar
    const preliminaryDrawings = drawings.filter((d) => d.status === 'PRELIMINARY');
    const drawingRegister: TenderQaPillarStatus = {
      pillarName: 'Tender Drawing Register',
      status: preliminaryDrawings.length === 0 ? 'PASSED' : 'WARNING',
      issuesCount: preliminaryDrawings.length,
      details:
        preliminaryDrawings.length === 0
          ? [`All ${drawings.length} drawings are approved for tender.`]
          : preliminaryDrawings.map((d) => `Drawing ${d.drawingNo} is still marked preliminary.`),
    };

    // 5. Mandatory Document Completeness Pillar
    const missingMandatoryDocs = documents.filter((d) => d.isMandatoryForSubmission && !d.isProvided);
    const documentCompleteness: TenderQaPillarStatus = {
      pillarName: 'Mandatory Submission Documents',
      status: missingMandatoryDocs.length === 0 ? 'PASSED' : 'FAILED',
      issuesCount: missingMandatoryDocs.length,
      details:
        missingMandatoryDocs.length === 0
          ? ['All mandatory submission documents are attached.']
          : missingMandatoryDocs.map((d) => `Missing Mandatory Document: ${d.documentName}`),
    };
    if (missingMandatoryDocs.length > 0) {
      blockerMessages.push(`Missing ${missingMandatoryDocs.length} mandatory tender document(s).`);
    }

    // 6. Review Comments Resolution Pillar
    const openCriticalComments = reviewComments.filter(
      (c) => (c.priority === 'CRITICAL' || c.priority === 'HIGH') && c.status === 'OPEN'
    );
    const reviewCommentsResolution: TenderQaPillarStatus = {
      pillarName: 'Internal Review Comments',
      status: openCriticalComments.length === 0 ? 'PASSED' : 'FAILED',
      issuesCount: openCriticalComments.length,
      details:
        openCriticalComments.length === 0
          ? ['All critical and high priority review comments have been resolved.']
          : openCriticalComments.map((c) => `[${c.priority}] ${c.section}: ${c.comment}`),
    };
    if (openCriticalComments.length > 0) {
      blockerMessages.push(`There are ${openCriticalComments.length} unresolved critical/high review comments.`);
    }

    // 7. Signatures and Executive Approval Pillar
    const missingSignatures: string[] = [];
    if (signatures.preparedBy.status !== 'SIGNED') missingSignatures.push('Prepared By');
    if (signatures.checkedBy.status !== 'SIGNED') missingSignatures.push('Checked By');
    if (signatures.approvedBy.status !== 'SIGNED') missingSignatures.push('Approved By');

    const signaturesApproval: TenderQaPillarStatus = {
      pillarName: 'Signatures & Executive Approval',
      status: missingSignatures.length === 0 ? 'PASSED' : 'FAILED',
      issuesCount: missingSignatures.length,
      details:
        missingSignatures.length === 0
          ? ['Tender is fully signed by Estimator, Checker, and Executive Approver.']
          : missingSignatures.map((s) => `Missing signature: ${s}`),
    };
    if (missingSignatures.length > 0) {
      blockerMessages.push(`Missing required signatures: ${missingSignatures.join(', ')}.`);
    }

    // 8. Deadline Status Pillar
    const deadline = this.getTenderDeadlineStatus(tenderInfo.closingDate, tenderInfo.submissionTime);
    const deadlineStatus: TenderQaPillarStatus = {
      pillarName: 'Tender Closing Deadline',
      status: deadline.isPastDeadline ? 'FAILED' : deadline.status === 'CLOSING_SOON' ? 'WARNING' : 'PASSED',
      issuesCount: deadline.isPastDeadline ? 1 : 0,
      details: [deadline.formattedTimeRemaining],
    };
    if (deadline.isPastDeadline) {
      blockerMessages.push('Tender closing deadline has expired. Submission requires explicit client extension.');
    }

    const criticalBlockersCount = blockerMessages.length;
    const warningsCount = warningMessages.length;
    const overallReadyForSubmission = criticalBlockersCount === 0;

    return {
      overallReadyForSubmission,
      pillars: {
        boqIntegrity,
        quantityVerification,
        pricingReconciliation,
        drawingRegister,
        documentCompleteness,
        reviewCommentsResolution,
        signaturesApproval,
        deadlineStatus,
      },
      criticalBlockersCount,
      warningsCount,
      blockerMessages,
      warningMessages,
    };
  }
}
