import {
  UnifiedBoqItem,
  UnifiedBoqDeduction,
  BoqQualityDashboardData,
  BoqRevisionRecord,
  DrawingCoverageItem,
  ProjectAssumptionRecord,
  ProjectExclusionRecord,
  TenderPackageData,
  UnifiedBoqDiscipline,
} from '../types';

export class UnifiedBoqEngine {
  /**
   * Evaluates deduction math and checks for duplicate deduction anomalies on the same item
   */
  public static calculateDeductions(
    grossQuantity: number,
    deductions: UnifiedBoqDeduction[]
  ): {
    deductionsTotal: number;
    netQuantity: number;
    hasDoubleDeductionWarning: boolean;
    warningMessage?: string;
  } {
    const deductionsTotal = deductions.reduce((sum, d) => sum + d.deductionQuantity, 0);
    const netQuantity = Math.max(0, Number((grossQuantity - deductionsTotal).toFixed(2)));

    // Check for duplicate deduction mark/id
    const seenMarks = new Set<string>();
    let hasDoubleDeductionWarning = false;
    let warningMessage: string | undefined;

    for (const d of deductions) {
      if (d.openingMark) {
        if (seenMarks.has(d.openingMark)) {
          hasDoubleDeductionWarning = true;
          warningMessage = `Warning: Opening ${d.openingMark} appears to be deducted more than once on this item.`;
          break;
        }
        seenMarks.add(d.openingMark);
      }
    }

    return {
      deductionsTotal: Number(deductionsTotal.toFixed(2)),
      netQuantity,
      hasDoubleDeductionWarning,
      warningMessage,
    };
  }

  /**
   * Scans a single BOQ item for suspicious quantity anomalies
   */
  public static detectSuspiciousQuantity(item: UnifiedBoqItem): {
    isSuspicious: boolean;
    reason?: string;
  } {
    if (item.finalQuantity < 0) {
      return { isSuspicious: true, reason: 'Negative quantity detected' };
    }
    if (item.finalQuantity === 0 && item.status !== 'OPEN_ITEM') {
      return { isSuspicious: true, reason: 'Zero quantity on non-blocked item' };
    }
    if (!item.formula || item.formula.trim() === '') {
      return { isSuspicious: true, reason: 'Missing formula or calculation derivation' };
    }
    if (!item.primaryDrawingNumber || item.primaryDrawingNumber.trim() === '') {
      return { isSuspicious: true, reason: 'Missing source drawing reference' };
    }
    if (item.specificationFlag === 'MISSING_SPEC') {
      return { isSuspicious: true, reason: 'Incomplete or unverified technical specification' };
    }
    return { isSuspicious: false };
  }

  /**
   * Runs the complete Quality Gate and Completeness Assessment across all BOQ items
   */
  public static evaluateQualityGate(
    items: UnifiedBoqItem[],
    drawingsCoverage: DrawingCoverageItem[] = []
  ): BoqQualityDashboardData {
    const totalItems = items.length;
    let finalItems = 0;
    let requiresReviewItems = 0;
    let openItemsCount = 0;
    let conflictsCount = 0;
    let unverifiedItems = 0;
    let duplicateCandidatesCount = 0;
    let missingSourcesCount = 0;
    let missingFormulasCount = 0;
    let missingSpecsCount = 0;
    let zeroOrNegativeCount = 0;
    let suspiciousCount = 0;
    let overriddenCount = 0;

    const blockingReasons: string[] = [];

    // Check drawing coverage
    const unprocessedDrawingsCount = drawingsCoverage.filter(d => !d.isProcessed).length;
    if (unprocessedDrawingsCount > 0) {
      blockingReasons.push(`${unprocessedDrawingsCount} drawing(s) remain unprocessed in the Drawing Coverage Matrix.`);
    }

    // Scan individual items
    items.forEach(item => {
      if (item.status === 'FINAL') finalItems++;
      if (item.status === 'REQUIRES_REVIEW') requiresReviewItems++;
      if (item.status === 'OPEN_ITEM' || item.hasOpenItem) openItemsCount++;
      if (item.status === 'CONFLICT' || item.hasConflict) conflictsCount++;
      if (item.status === 'AI_EXTRACTED' || item.status === 'CALCULATED') unverifiedItems++;
      if (item.isDuplicateCandidate) duplicateCandidatesCount++;
      if (item.isManuallyOverridden) overriddenCount++;

      if (!item.primaryDrawingNumber || item.primaryDrawingNumber === '—') {
        missingSourcesCount++;
      }
      if (!item.formula || item.formula === '—') {
        missingFormulasCount++;
      }
      if (item.specificationFlag === 'MISSING_SPEC') {
        missingSpecsCount++;
      }
      if (item.finalQuantity <= 0 && item.status !== 'OPEN_ITEM') {
        zeroOrNegativeCount++;
      }

      const susp = this.detectSuspiciousQuantity(item);
      if (susp.isSuspicious) {
        suspiciousCount++;
      }
    });

    // Check critical blocking conditions
    if (openItemsCount > 0) {
      blockingReasons.push(`${openItemsCount} item(s) have unresolved Open Items / RFIs.`);
    }
    if (conflictsCount > 0) {
      blockingReasons.push(`${conflictsCount} item(s) have active multi-source drawing conflicts.`);
    }
    if (missingSourcesCount > 0) {
      blockingReasons.push(`${missingSourcesCount} item(s) are missing source drawing traceability.`);
    }
    if (missingFormulasCount > 0) {
      blockingReasons.push(`${missingFormulasCount} item(s) lack mathematical formula derivations.`);
    }
    if (unverifiedItems > 0) {
      blockingReasons.push(`${unverifiedItems} item(s) are unverified AI extractions awaiting engineer sign-off.`);
    }
    if (zeroOrNegativeCount > 0) {
      blockingReasons.push(`${zeroOrNegativeCount} item(s) have zero or negative quantity anomalies.`);
    }

    // Completeness Score computation
    // Formula weight:
    // (Verified Items / Total) * 40% + (Resolved Open Items / Total) * 20% + (Formulas / Total) * 20% + (Sources / Total) * 20%
    let completenessScorePercent = 0;
    if (totalItems > 0) {
      const verifiedScore = ((finalItems + (totalItems - unverifiedItems - requiresReviewItems - openItemsCount - conflictsCount)) / totalItems) * 40;
      const formulaScore = ((totalItems - missingFormulasCount) / totalItems) * 20;
      const sourceScore = ((totalItems - missingSourcesCount) / totalItems) * 20;
      const rfiScore = ((totalItems - openItemsCount - conflictsCount) / totalItems) * 20;

      completenessScorePercent = Math.max(0, Math.min(100, Number((verifiedScore + formulaScore + sourceScore + rfiScore).toFixed(1))));
    }

    const qualityGatePassed = blockingReasons.length === 0;

    return {
      totalItems,
      finalItems,
      requiresReviewItems,
      openItemsCount,
      conflictsCount,
      unverifiedItems,
      duplicateCandidatesCount,
      missingSourcesCount,
      missingFormulasCount,
      missingSpecsCount,
      zeroOrNegativeCount,
      suspiciousCount,
      overriddenCount,
      unprocessedDrawingsCount,
      completenessScorePercent,
      qualityGatePassed,
      blockingReasons,
    };
  }

  /**
   * Calculates revision diffs between two BOQ states
   */
  public static compareBoqRevisions(
    oldItems: UnifiedBoqItem[],
    newItems: UnifiedBoqItem[],
    revisionCode: string,
    reason: string,
    user: string
  ): BoqRevisionRecord {
    const oldMap = new Map(oldItems.map(i => [i.itemCode, i]));
    const newMap = new Map(newItems.map(i => [i.itemCode, i]));

    const changeLog: BoqRevisionRecord['changeLog'] = [];
    let addedCount = 0;
    let removedCount = 0;
    let modifiedCount = 0;

    // Check for added & modified
    newItems.forEach(newItem => {
      const oldItem = oldMap.get(newItem.itemCode);
      if (!oldItem) {
        addedCount++;
        changeLog.push({
          itemCode: newItem.itemCode,
          description: newItem.description,
          changeType: 'ADDED',
          newValue: `${newItem.finalQuantity} ${newItem.unit}`,
        });
      } else {
        const qtyDiff = newItem.finalQuantity - oldItem.finalQuantity;
        const specDiff = newItem.specification !== oldItem.specification;

        if (Math.abs(qtyDiff) > 0.001) {
          modifiedCount++;
          const percent = oldItem.finalQuantity !== 0 ? (qtyDiff / oldItem.finalQuantity) * 100 : 100;
          changeLog.push({
            itemCode: newItem.itemCode,
            description: newItem.description,
            changeType: 'QUANTITY_CHANGE',
            oldValue: `${oldItem.finalQuantity} ${oldItem.unit}`,
            newValue: `${newItem.finalQuantity} ${newItem.unit}`,
            delta: Number(qtyDiff.toFixed(2)),
            percentChange: Number(percent.toFixed(2)),
          });
        } else if (specDiff) {
          modifiedCount++;
          changeLog.push({
            itemCode: newItem.itemCode,
            description: newItem.description,
            changeType: 'SPEC_CHANGE',
            oldValue: oldItem.specification,
            newValue: newItem.specification,
          });
        }
      }
    });

    // Check for removed
    oldItems.forEach(oldItem => {
      if (!newMap.has(oldItem.itemCode)) {
        removedCount++;
        changeLog.push({
          itemCode: oldItem.itemCode,
          description: oldItem.description,
          changeType: 'REMOVED',
          oldValue: `${oldItem.finalQuantity} ${oldItem.unit}`,
        });
      }
    });

    // Quantities by discipline
    const totalQuantitiesByDiscipline: { [disc: string]: number } = {};
    newItems.forEach(item => {
      totalQuantitiesByDiscipline[item.discipline] = (totalQuantitiesByDiscipline[item.discipline] || 0) + item.finalQuantity;
    });

    return {
      revisionCode,
      createdDate: new Date().toISOString().slice(0, 10),
      createdBy: user,
      reason,
      drawingRevisionBasis: 'Latest Verified Project Drawings',
      totalItems: newItems.length,
      totalQuantitiesByDiscipline,
      addedItemsCount: addedCount,
      removedItemsCount: removedCount,
      modifiedItemsCount: modifiedCount,
      isFrozen: false,
      changeLog,
    };
  }

  /**
   * Generates a formal Tender Package summary
   */
  public static generateTenderPackage(params: {
    projectName: string;
    projectNumber: string;
    clientName: string;
    consultantName: string;
    currency: string;
    boqRevision: string;
    items: UnifiedBoqItem[];
    assumptions: ProjectAssumptionRecord[];
    exclusions: ProjectExclusionRecord[];
    drawingsCount: number;
  }): TenderPackageData {
    const disciplineMap = new Map<UnifiedBoqDiscipline, { count: number; amount: number }>();

    params.items.forEach(item => {
      const current = disciplineMap.get(item.discipline) || { count: 0, amount: 0 };
      disciplineMap.set(item.discipline, {
        count: current.count + 1,
        amount: current.amount + (item.totalAmount || 0),
      });
    });

    const disciplinesSummary = Array.from(disciplineMap.entries()).map(([disc, data]) => ({
      discipline: disc,
      itemCount: data.count,
      totalAmount: Number(data.amount.toFixed(2)),
    }));

    const openItems = params.items.filter(i => i.hasOpenItem || i.status === 'OPEN_ITEM').length;
    const conflicts = params.items.filter(i => i.hasConflict || i.status === 'CONFLICT').length;

    return {
      projectName: params.projectName,
      projectNumber: params.projectNumber,
      clientName: params.clientName,
      consultantName: params.consultantName,
      generatedDate: new Date().toISOString().slice(0, 10),
      currency: params.currency || 'AED',
      boqRevision: params.boqRevision,
      totalItemsCount: params.items.length,
      disciplinesSummary,
      assumptions: params.assumptions,
      exclusions: params.exclusions,
      openItemsSummary: { openCount: openItems, resolvedCount: params.items.length - openItems },
      conflictsSummary: { openCount: conflicts, resolvedCount: params.items.length - conflicts },
      drawingsIncludedCount: params.drawingsCount,
    };
  }
}
