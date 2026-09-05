/**
 * AI BOQ & Tender Estimation Engineer - Phase 13 Tender Excel Export Engine
 */

import * as XLSX from 'xlsx';
import { UnifiedBoqItem, ProjectRecord } from '../types/index';
import { RateAnalysisRecord, PricingScenario } from '../types/rateAnalysis';
import {
  TenderInfo,
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
  CommercialBidSummary,
  TenderChecklistItem,
  TenderSignatures,
  TenderReviewComment,
  CompetitorBid,
  TenderRiskItem,
  TenderAssumptionItem,
  TenderProgramme,
  ManpowerPlanItem,
  EquipmentPlanItem,
} from '../types/tender';

export class TenderExcelExportEngine {
  /**
   * Export comprehensive multi-sheet professional Tender Master Workbook
   */
  public static exportFullTenderWorkbook(
    tenderInfo: TenderInfo,
    commercialSummary: CommercialBidSummary,
    boqItems: UnifiedBoqItem[],
    rateAnalyses: RateAnalysisRecord[],
    activeScenario: PricingScenario,
    scopeMatrix: ScopeMatrixItem[],
    inclusions: InclusionItem[],
    exclusions: ExclusionItem[],
    provisionalSums: ProvisionalSumItem[],
    primeCostItems: PrimeCostItem[],
    optionalItems: OptionalItem[],
    alternates: AlternateOptionItem[],
    documents: TenderDocumentItem[],
    drawings: TenderDrawingRegisterItem[],
    addenda: TenderAddendum[],
    clarifications: TenderClarification[],
    competitorBids: CompetitorBid[],
    risks: TenderRiskItem[],
    assumptions: TenderAssumptionItem[],
    checklist: TenderChecklistItem[],
    signatures: TenderSignatures,
    programme?: TenderProgramme,
    manpower?: ManpowerPlanItem[],
    equipment?: EquipmentPlanItem[]
  ): void {
    const wb = XLSX.utils.book_new();

    const cur = tenderInfo.currency || 'AED';

    // 1. Cover & Executive Summary Sheet
    const coverData = [
      ['CONFIDENTIAL TENDER SUBMISSION PACKAGE', '', '', '', ''],
      ['FORM OF TENDER & COMMERCIAL SUMMARY', '', '', '', ''],
      ['', '', '', '', ''],
      ['PROJECT & TENDER METADATA', '', '', '', ''],
      ['Project Name:', tenderInfo.project, '', 'Tender Ref No:', tenderInfo.tenderNumber],
      ['Client Organization:', tenderInfo.client, '', 'Contractor / Tenderer:', tenderInfo.contractor],
      ['Lead Consultant:', tenderInfo.consultant, '', 'Project Location:', tenderInfo.location],
      ['Tender Issue Date:', tenderInfo.issueDate, '', 'Tender Closing Date:', `${tenderInfo.closingDate} (${tenderInfo.submissionTime})`],
      ['Contract Type:', tenderInfo.contractType, '', 'Tender Type:', tenderInfo.tenderType],
      ['Bid Validity:', `${tenderInfo.validityDays} Days`, '', 'Validity Expiry:', tenderInfo.validityExpiryDate],
      ['Tender Revision:', tenderInfo.currentTenderRevision, '', 'BOQ Revision:', tenderInfo.currentBoqRevision],
      ['Pricing Scenario Used:', activeScenario.name, '', 'Pricing Revision:', tenderInfo.currentPricingRevision],
      ['Currency:', cur, '', '', ''],
      ['', '', '', '', ''],
      ['COMMERCIAL PRICE RECONCILIATION SUMMARY', '', '', '', ''],
      ['Line Item', 'Description / Reference', `Subtotal Amount (${cur})`, 'Calculation Basis', 'Status'],
      ['1.0', 'Base Measured BOQ Direct & Indirect Total', commercialSummary.baseBoqMeasuredTotal, 'Verified Drawing BOQ Takeoff', 'Measured'],
      ['2.0', 'Provisional Sums (Defined & Nominated)', commercialSummary.provisionalSumsTotal, `${provisionalSums.length} Defined Contingencies`, 'Fixed'],
      ['3.0', 'Prime Cost Items (PC Allowances + Attendance)', commercialSummary.primeCostTotal, `${primeCostItems.length} Nominated Packages`, 'Fixed'],
      ['4.0', 'Selected Optional Tender Items', commercialSummary.selectedOptionsTotal, 'Client-Selected Options', 'Option'],
      ['5.0', 'SUBTOTAL BEFORE RISK & DISCOUNT', commercialSummary.subtotalBeforeRiskDiscount, 'Sum of Items 1.0 to 4.0', 'Subtotal'],
      ['6.0', `Risk Allowance Contingency (${commercialSummary.riskAllowancePercent.toFixed(2)}%)`, commercialSummary.riskAllowanceAmount, 'Isolated Risk Line Item', 'Contingency'],
      ['7.0', `Commercial Volume Discount (${commercialSummary.discountPercent.toFixed(2)}%)`, -commercialSummary.discountAmount, 'Commercial Deduction', 'Discount'],
      ['8.0', 'SUBTOTAL AFTER RISK & DISCOUNT (NET)', commercialSummary.subtotalAfterDiscountRisk, 'Sum of Items 5.0 + 6.0 - 7.0', 'Net Bid'],
      ['9.0', `Statutory VAT / Sales Tax (${commercialSummary.taxVatPercent.toFixed(2)}%)`, commercialSummary.taxVatAmount, 'Applicable Tax Rate', 'Tax'],
      ['10.0', 'FINAL TENDER GRAND TOTAL', commercialSummary.tenderGrandTotal, 'Total Payable Submission Price', 'FINAL'],
      ['', '', '', '', ''],
      ['AMOUNT IN WORDS:', commercialSummary.tenderGrandTotalInWords, '', '', ''],
      ['', '', '', '', ''],
      ['PROFITABILITY & COMMERCIAL MARGIN AUDIT', '', '', '', ''],
      ['Total Estimated Direct Construction Cost:', commercialSummary.estimatedDirectCost, '', '', ''],
      ['Total Estimated General & Site Overhead Cost:', commercialSummary.estimatedOverheadCost, '', '', ''],
      ['Total Combined Estimated Cost (Direct + Overhead):', commercialSummary.totalEstimatedCost, '', '', ''],
      [`Estimated Gross Profit Margin (${cur}):`, commercialSummary.grossMarginAmount, '', '', ''],
      ['Estimated Gross Profit Margin (%):', `${commercialSummary.grossMarginPercent.toFixed(2)}%`, '', '', ''],
      ['Reconciliation Balanced:', commercialSummary.reconciliationBalanced ? 'YES (100% Exact)' : 'NO (Mismatch)', '', '', ''],
      ['', '', '', '', ''],
      ['FORMAL TENDER SIGNATURES & AUTHORIZATION', '', '', '', ''],
      ['Role', 'Authorized Personnel', 'Title / Designation', 'Date Signed', 'Status'],
      ['Prepared By:', signatures.preparedBy.name, signatures.preparedBy.title, signatures.preparedBy.date, signatures.preparedBy.status],
      ['Checked By:', signatures.checkedBy.name, signatures.checkedBy.title, signatures.checkedBy.date, signatures.checkedBy.status],
      ['Approved By:', signatures.approvedBy.name, signatures.approvedBy.title, signatures.approvedBy.date, signatures.approvedBy.status],
    ];

    const wsCover = XLSX.utils.aoa_to_sheet(coverData);
    wsCover['!cols'] = [{ wch: 30 }, { wch: 50 }, { wch: 25 }, { wch: 30 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsCover, '01_Tender_Cover');

    // 2. Master Priced BOQ Schedule
    const boqHeaders = [
      'Item Code',
      'Discipline',
      'Trade Element',
      'Description of Work',
      'Drawing No Ref',
      'Verified Quantity',
      'Unit',
      `Direct Cost/Unit (${cur})`,
      `Overhead/Unit (${cur})`,
      `Profit/Unit (${cur})`,
      `Final Rate (${cur})`,
      `Total Amount (${cur})`,
      'Rate Source / Audit',
    ];

    const boqRows = boqItems.map((b) => {
      const rate = rateAnalyses.find((r) => r.boqItemId === b.id || r.itemCode === b.itemCode);
      const qty = b.finalQuantity || 0;
      const finalRate = rate?.finalRate || 0;
      return [
        b.itemCode,
        b.discipline,
        b.elementType || '',
        b.description,
        b.primaryDrawingNumber || '',
        qty,
        b.unit,
        rate?.directCost || 0,
        rate?.overheadAmount || 0,
        rate?.profitAmount || 0,
        finalRate,
        qty * finalRate,
        rate?.status || 'CALCULATED',
      ];
    });

    const wsBoq = XLSX.utils.aoa_to_sheet([boqHeaders, ...boqRows]);
    wsBoq['!cols'] = [
      { wch: 14 },
      { wch: 18 },
      { wch: 18 },
      { wch: 45 },
      { wch: 16 },
      { wch: 16 },
      { wch: 10 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 20 },
      { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, wsBoq, '02_Priced_BOQ');

    // 3. Scope & Responsibility Matrix
    const scopeHeaders = [
      'Package ID',
      'Discipline',
      'Work Package Scope',
      'Included (Y/N)',
      'Excluded (Y/N)',
      'Responsible Party',
      'Specialist Contractor Name',
      'Specification Reference',
      'Notes & Demarcation',
    ];

    const scopeRows = scopeMatrix.map((s) => [
      s.id,
      s.discipline,
      s.workPackage,
      s.included ? 'YES' : 'NO',
      s.excluded ? 'YES' : 'NO',
      s.responsibleParty,
      s.specialistName || '-',
      s.specReference || '-',
      s.notes || '',
    ]);

    const wsScope = XLSX.utils.aoa_to_sheet([scopeHeaders, ...scopeRows]);
    wsScope['!cols'] = [
      { wch: 12 },
      { wch: 18 },
      { wch: 40 },
      { wch: 14 },
      { wch: 14 },
      { wch: 25 },
      { wch: 30 },
      { wch: 22 },
      { wch: 45 },
    ];
    XLSX.utils.book_append_sheet(wb, wsScope, '03_Scope_Matrix');

    // 4. Inclusions & Exclusions
    const incExcData = [
      ['PROJECT FORMAL INCLUSIONS REGISTER', '', '', ''],
      ['ID', 'Discipline', 'Included Scope Item', 'Specification Reference', 'Notes'],
      ...inclusions.map((i) => [i.id, i.discipline, i.scopeItem, i.specificationRef, i.notes]),
      ['', '', '', '', ''],
      ['PROJECT FORMAL EXCLUSIONS REGISTER', '', '', ''],
      ['ID', 'Discipline', 'Excluded Item / Service', 'Reason for Exclusion', 'Party Responsible'],
      ...exclusions.map((e) => [e.id, e.discipline, e.excludedItem, e.reason, e.partyResponsible]),
    ];
    const wsIncExc = XLSX.utils.aoa_to_sheet(incExcData);
    wsIncExc['!cols'] = [{ wch: 12 }, { wch: 20 }, { wch: 45 }, { wch: 35 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsIncExc, '04_Inclusions_Exclusions');

    // 5. Provisional Sums & Prime Cost Items
    const psPcData = [
      ['PROVISIONAL SUMS REGISTER', '', '', '', '', ''],
      ['Item No', 'Description', 'Unit', `Amount (${cur})`, 'Reason / Contingency Purpose', 'Status'],
      ...provisionalSums.map((ps) => [ps.itemNo, ps.description, ps.unit, ps.amount, ps.reason, ps.status]),
      ['', '', '', '', '', ''],
      ['PRIME COST (PC) ITEMS REGISTER', '', '', '', '', ''],
      ['Item No', 'Description', `Allowance (${cur})`, 'Attendance %', `Attendance (${cur})`, `Total PC with Attendance (${cur})`, 'Notes'],
      ...primeCostItems.map((pc) => [
        pc.itemNo,
        pc.description,
        pc.allowanceAmount,
        `${pc.attendancePercent}%`,
        pc.attendanceAmount,
        pc.totalWithAttendance,
        pc.notes || '',
      ]),
    ];
    const wsPsPc = XLSX.utils.aoa_to_sheet(psPcData);
    wsPsPc['!cols'] = [{ wch: 12 }, { wch: 45 }, { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsPsPc, '05_Provisional_PC_Items');

    // 6. Options & Alternate Proposals
    const optAltData = [
      ['OPTIONAL TENDER ITEMS REGISTER', '', '', '', '', ''],
      ['Option Code', 'Title', 'Discipline', `Amount (${cur})`, 'Selected in Base?', 'Decision Deadline', 'Description'],
      ...optionalItems.map((opt) => [
        opt.optionCode,
        opt.title,
        opt.discipline,
        opt.amount,
        opt.isSelectedInBaseTender ? 'YES' : 'NO',
        opt.decisionDeadline || '-',
        opt.description,
      ]),
      ['', '', '', '', '', ''],
      ['VALUE ENGINEERING & ALTERNATE PROPOSALS', '', '', '', '', ''],
      ['Alternate Code', 'Base Scope Proposal', `Base Cost (${cur})`, 'Alternate VE Proposal', `Alternate Cost (${cur})`, `Cost Delta (${cur})`, 'Delta %', 'Time Delta', 'Merit'],
      ...alternates.map((alt) => [
        alt.alternateCode,
        alt.baseScopeTitle,
        alt.baseAmount,
        alt.alternateScopeTitle,
        alt.alternateAmount,
        alt.costDifference,
        `${alt.differencePercent.toFixed(2)}%`,
        `${alt.timeImpactWeeks} Weeks`,
        alt.engineeringMerit,
      ]),
    ];
    const wsOptAlt = XLSX.utils.aoa_to_sheet(optAltData);
    wsOptAlt['!cols'] = [{ wch: 16 }, { wch: 35 }, { wch: 18 }, { wch: 35 }, { wch: 18 }, { wch: 16 }, { wch: 12 }, { wch: 14 }, { wch: 45 }];
    XLSX.utils.book_append_sheet(wb, wsOptAlt, '06_Options_Alternates');

    // 7. Addenda & Clarifications
    const addClrData = [
      ['TENDER ADDENDA REGISTER', '', '', '', '', ''],
      ['Addendum No', 'Date', 'Description', 'Affected Drawings', 'Affected BOQ Codes', `Pricing Impact (${cur})`, 'Status'],
      ...addenda.map((ad) => [
        ad.addendumNo,
        ad.date,
        ad.description,
        ad.affectedDrawingNos.join(', '),
        ad.affectedBoqItemCodes.join(', '),
        ad.pricingChangeTotal,
        ad.status,
      ]),
      ['', '', '', '', '', ''],
      ['TENDER CLARIFICATIONS REGISTER (RFI)', '', '', '', '', ''],
      ['Clarification ID', 'Question Raised', 'Date Raised', 'Consultant Response', 'Response Date', 'Status'],
      ...clarifications.map((cl) => [
        cl.id,
        cl.question,
        cl.dateRaised,
        cl.response,
        cl.responseDate,
        cl.status,
      ]),
    ];
    const wsAddClr = XLSX.utils.aoa_to_sheet(addClrData);
    wsAddClr['!cols'] = [{ wch: 16 }, { wch: 14 }, { wch: 45 }, { wch: 25 }, { wch: 25 }, { wch: 18 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, wsAddClr, '07_Addenda_Clarifications');

    // 8. Drawing Register
    const drwHeaders = [
      'Drawing No',
      'Drawing Title',
      'Discipline',
      'Revision',
      'Issue Date',
      'Tender Status',
      'Used in BOQ',
      'Used in Takeoff',
      'Takeoff Verified',
      'Notes',
    ];
    const drwRows = drawings.map((d) => [
      d.drawingNo,
      d.title,
      d.discipline,
      d.revision,
      d.date,
      d.status,
      d.usedInBoq ? 'YES' : 'NO',
      d.usedInTakeoff ? 'YES' : 'NO',
      d.verified ? 'YES' : 'NO',
      d.notes || '',
    ]);
    const wsDrw = XLSX.utils.aoa_to_sheet([drwHeaders, ...drwRows]);
    wsDrw['!cols'] = [{ wch: 14 }, { wch: 40 }, { wch: 18 }, { wch: 10 }, { wch: 14 }, { wch: 22 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 35 }];
    XLSX.utils.book_append_sheet(wb, wsDrw, '08_Drawing_Register');

    // 9. Bid Comparison & Competitor Analysis
    const bidHeaders = [
      'Bidder Name',
      'Type',
      `Base Price (${cur})`,
      `Provisional Sums (${cur})`,
      `Options (${cur})`,
      `Discount (${cur})`,
      `Tax / VAT (${cur})`,
      `Final Tender Price (${cur})`,
      `Difference vs Internal (${cur})`,
      'Difference %',
      'Bid Validity',
      'Source / Notes',
    ];
    const internalBid = competitorBids.find((b) => b.isInternalEstimate);
    const internalPrice = internalBid ? internalBid.finalTenderPrice : commercialSummary.tenderGrandTotal;

    const bidRows = competitorBids.map((b) => {
      const diff = b.finalTenderPrice - internalPrice;
      const diffPct = internalPrice > 0 ? (diff / internalPrice) * 100 : 0;
      return [
        b.bidderName,
        b.isInternalEstimate ? 'INTERNAL ESTIMATE' : 'COMPETITOR',
        b.basePrice,
        b.provisionalSum,
        b.options,
        b.discount,
        b.tax,
        b.finalTenderPrice,
        diff,
        `${diffPct.toFixed(2)}%`,
        `${b.validityDays} Days`,
        b.notes,
      ];
    });
    const wsBids = XLSX.utils.aoa_to_sheet([bidHeaders, ...bidRows]);
    wsBids['!cols'] = [{ wch: 30 }, { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 22 }, { wch: 22 }, { wch: 14 }, { wch: 14 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, wsBids, '09_Bid_Comparison');

    // 10. Risk Register & Assumptions
    const riskData = [
      ['PROJECT TENDER RISK REGISTER', '', '', '', '', '', '', ''],
      ['Risk ID', 'Category', 'Description', 'Probability (1-5)', 'Impact (1-5)', 'Risk Score', 'Risk Level', `Cost Impact (${cur})`, 'Mitigation Action', 'Owner', 'Status'],
      ...risks.map((r) => [
        r.id,
        r.category,
        r.description,
        r.probability,
        r.impact,
        r.riskScore,
        r.riskLevel,
        r.costImpact,
        r.mitigation,
        r.owner,
        r.status,
      ]),
      ['', '', '', '', '', '', '', ''],
      ['TENDER ASSUMPTIONS & QUALIFICATIONS', '', '', '', '', '', '', ''],
      ['Assumption ID', 'Category', 'Linked Item/Ref', 'Assumption Statement', 'Commercial Impact', 'Raised By', 'Date'],
      ...assumptions.map((a) => [
        a.id,
        a.category,
        a.linkedCode || '-',
        a.assumptionText,
        a.commercialImpact,
        a.raisedBy,
        a.date,
      ]),
    ];
    const wsRisk = XLSX.utils.aoa_to_sheet(riskData);
    wsRisk['!cols'] = [{ wch: 12 }, { wch: 16 }, { wch: 45 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 45 }, { wch: 20 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, wsRisk, '10_Risk_Assumptions');

    // 11. Submission Checklist
    const chkHeaders = [
      'Item ID',
      'Category',
      'Checklist Requirement',
      'Description / Specification',
      'Mandatory?',
      'Completion Status',
      'Verified By',
      'Verified Date',
    ];
    const chkRows = checklist.map((c) => [
      c.id,
      c.category,
      c.itemTitle,
      c.description,
      c.isMandatory ? 'YES' : 'NO',
      c.status,
      c.verifiedBy || '-',
      c.verifiedDate || '-',
    ]);
    const wsChk = XLSX.utils.aoa_to_sheet([chkHeaders, ...chkRows]);
    wsChk['!cols'] = [{ wch: 12 }, { wch: 20 }, { wch: 40 }, { wch: 45 }, { wch: 12 }, { wch: 16 }, { wch: 20 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, wsChk, '11_Submission_Checklist');

    // Generate Excel File Name
    const sanitizedTender = tenderInfo.tenderNumber.replace(/[\/\\:*?"<>|]/g, '_');
    const fileName = `${sanitizedTender}_Tender_Master_Workbook_${tenderInfo.currentTenderRevision.replace(/\s+/g, '_')}.xlsx`;

    XLSX.writeFile(wb, fileName);
  }
}
