/**
 * AI BOQ & Tender Estimation Engineer - Phase 12 Rate Analysis Excel Export Engine
 * Generates structured, formula-linked OpenXML (.xlsx) workbooks for Rate Analysis & Tender Pricing.
 */

import * as XLSX from 'xlsx';
import { UnifiedBoqItem, ProjectData } from '../types';
import {
  RateAnalysisRecord,
  RateDatabaseItem,
  SupplierQuoteItem,
  PricingScenario,
  ValueEngineeringProposal,
  TenderSummaryReport,
} from '../types/rateAnalysis';
import { RateAnalysisEngine } from './rateAnalysisEngine';

export class RateAnalysisExcelExportEngine {
  public static generateRateAnalysisWorkbook(
    project: ProjectData | null,
    boqItems: UnifiedBoqItem[],
    rateAnalyses: RateAnalysisRecord[],
    rateDatabase: RateDatabaseItem[],
    supplierQuotes: SupplierQuoteItem[],
    scenarios: PricingScenario[],
    veProposals: ValueEngineeringProposal[],
    activeScenario: PricingScenario
  ): Uint8Array {
    const wb = XLSX.utils.book_new();

    const summaryReport = RateAnalysisEngine.generateTenderSummaryReport(
      project?.id || 'PROJ-001',
      project?.project?.name || 'Commercial & Industrial Development',
      boqItems,
      rateAnalyses,
      activeScenario
    );

    // 1. Cover & Executive Summary Sheet
    this.appendCoverSheet(wb, project, summaryReport, activeScenario);

    // 2. Master Rate Analysis Sheet
    this.appendMasterRateAnalysisSheet(wb, boqItems, rateAnalyses, activeScenario);

    // 3. Detailed Component Breakdown Sheet
    this.appendComponentBreakdownSheet(wb, boqItems, rateAnalyses);

    // 4. Tender Summary by Discipline & Building
    this.appendTenderSummarySheet(wb, summaryReport);

    // 5. Material Database Schedule
    this.appendMaterialScheduleSheet(wb, rateDatabase);

    // 6. Labour & Crew Productivity Schedule
    this.appendLabourScheduleSheet(wb, rateDatabase);

    // 7. Equipment & Machinery Schedule
    this.appendEquipmentScheduleSheet(wb, rateDatabase);

    // 8. Supplier Quotes & Comparison Matrix
    this.appendSupplierQuotesSheet(wb, supplierQuotes);

    // 9. Pricing Scenarios Comparison
    this.appendScenariosSheet(wb, scenarios, boqItems, rateAnalyses);

    // 10. Value Engineering Proposals
    this.appendValueEngineeringSheet(wb, veProposals);

    return XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as Uint8Array;
  }

  // 1. Cover & Executive Summary Sheet
  private static appendCoverSheet(
    wb: XLSX.WorkBook,
    project: ProjectData | null,
    report: TenderSummaryReport,
    scenario: PricingScenario
  ) {
    const rows = [
      ['RATE ANALYSIS & TENDER PRICING PACKAGE', '', '', ''],
      ['CONFIDENTIAL COMMERCIAL BID DOCUMENT', '', '', ''],
      ['', '', '', ''],
      ['PROJECT INFORMATION', '', '', ''],
      ['Project Name:', project?.project?.name || 'Tender Project', '', ''],
      ['Project Number:', project?.project?.projectNumber || project?.id || 'PRJ-2026-001', '', ''],
      ['Location:', project?.project?.location || 'Central Site Terminal', '', ''],
      ['Client:', project?.client?.name || 'Apex Real Estate Partners', '', ''],
      ['Lead Consultant:', project?.consultant?.leadConsultant || 'Astra Engineering Consultants', '', ''],
      ['Currency:', 'AED', '', ''],
      ['Pricing Revision:', report.pricingRevision, '', ''],
      ['Date of Build-up:', new Date().toISOString().split('T')[0], '', ''],
      ['Active Scenario:', scenario.name, '', ''],
      ['', '', '', ''],
      ['COMMERCIAL EXECUTIVE TOTALS', '', '', ''],
      ['Total Direct Cost (AED):', report.costElements.directCostTotal, '', ''],
      ['Total Overhead (AED):', report.costElements.overheadTotal, `(${report.costElements.overheadPercent.toFixed(1)}%)`, ''],
      ['Total Profit Margin (AED):', report.costElements.profitTotal, `(${report.costElements.profitPercent.toFixed(1)}%)`, ''],
      ['Total Configured Tax / Duty (AED):', report.costElements.taxTotal, `(${scenario.taxRatePercent}%)`, ''],
      ['FINAL TENDER GRAND TOTAL (AED):', report.tenderGrandTotal, '', ''],
      ['Amount in Words:', report.tenderTotalWords, '', ''],
      ['Pricing QA Status:', report.qaPassed ? 'PASSED — PRE-FLIGHT VERIFIED' : 'REVIEW REQUIRED', '', ''],
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 32 }, { wch: 40 }, { wch: 20 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws, 'TENDER COVER');
  }

  // 2. Master Rate Analysis Sheet
  private static appendMasterRateAnalysisSheet(
    wb: XLSX.WorkBook,
    boqItems: UnifiedBoqItem[],
    rateAnalyses: RateAnalysisRecord[],
    scenario: PricingScenario
  ) {
    const rows: any[][] = [
      ['MASTER RATE ANALYSIS SCHEDULE (QUANTITY × FINAL RATE = AMOUNT)', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['Strict Separation: Verified Drawing Quantity is Read-Only and independent of Rate Analysis', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      [
        'Item Code',
        'Discipline',
        'Item Description',
        'Unit',
        'Verified Qty',
        'Material (AED)',
        'Labour (AED)',
        'Equipment (AED)',
        'Subcontract (AED)',
        'Transport (AED)',
        'Other (AED)',
        'Direct Cost (AED)',
        'Overhead (AED)',
        'Profit (AED)',
        'Tax (AED)',
        'Final Unit Rate (AED)',
        'Total BOQ Amount (AED)',
      ],
    ];

    let rowNum = 4;
    boqItems.forEach((boq) => {
      const rateRec = rateAnalyses.find((r) => r.boqItemId === boq.id || r.itemCode === boq.itemCode);
      const evalRate = rateRec ? RateAnalysisEngine.evaluateScenarioRate(rateRec, scenario) : null;

      const qty = boq.finalQuantity || 0;
      const mat = evalRate ? evalRate.materialCost : 0;
      const lab = evalRate ? evalRate.labourCost : 0;
      const eqp = evalRate ? evalRate.equipmentCost : 0;
      const sub = evalRate ? evalRate.subcontractCost : 0;
      const trn = evalRate ? evalRate.transportCost : 0;
      const oth = evalRate ? evalRate.otherCost : 0;

      // Excel formulas:
      // Direct Cost = SUM(F:K)
      // Final Rate = L + M + N + O
      // Total Amount = E * P (Qty * Final Rate)
      const directFormula = { t: 'n', f: `SUM(F${rowNum}:K${rowNum})`, v: evalRate ? evalRate.directCost : 0 };
      const rateFormula = { t: 'n', f: `SUM(L${rowNum}:O${rowNum})`, v: evalRate ? evalRate.finalRate : boq.unitRate };
      const amountFormula = { t: 'n', f: `E${rowNum}*P${rowNum}`, v: evalRate ? evalRate.finalRate * qty : boq.unitRate * qty };

      rows.push([
        boq.itemCode,
        boq.discipline,
        boq.description,
        boq.unit,
        qty,
        mat,
        lab,
        eqp,
        sub,
        trn,
        oth,
        directFormula,
        evalRate ? evalRate.overheadAmount : 0,
        evalRate ? evalRate.profitAmount : 0,
        evalRate ? evalRate.taxAmount : 0,
        rateFormula,
        amountFormula,
      ]);
      rowNum++;
    });

    // Summary Total Row
    rows.push([
      'TOTAL',
      '',
      'TENDER GRAND TOTAL (SUM OF PRICED BOQ ITEMS)',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      { t: 'n', f: `SUM(L4:L${rowNum - 1})` },
      { t: 'n', f: `SUM(M4:M${rowNum - 1})` },
      { t: 'n', f: `SUM(N4:N${rowNum - 1})` },
      { t: 'n', f: `SUM(O4:O${rowNum - 1})` },
      '',
      { t: 'n', f: `SUM(Q4:Q${rowNum - 1})` },
    ]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      { wch: 14 },
      { wch: 16 },
      { wch: 38 },
      { wch: 8 },
      { wch: 14 },
      { wch: 13 },
      { wch: 13 },
      { wch: 13 },
      { wch: 14 },
      { wch: 13 },
      { wch: 12 },
      { wch: 15 },
      { wch: 13 },
      { wch: 13 },
      { wch: 12 },
      { wch: 18 },
      { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'RATE ANALYSIS MASTER');
  }

  // 3. Detailed Component Breakdown Sheet
  private static appendComponentBreakdownSheet(
    wb: XLSX.WorkBook,
    boqItems: UnifiedBoqItem[],
    rateAnalyses: RateAnalysisRecord[]
  ) {
    const rows: any[][] = [
      ['DETAILED COMPONENT RATE BUILD-UP BREAKDOWN', '', '', '', '', '', '', '', '', ''],
      ['Item Code', 'BOQ Description', 'Category', 'Component Description', 'Unit', 'Consumption', 'Unit Rate (AED)', 'Wastage %', 'Component Amount (AED)', 'Source'],
    ];

    let rowNum = 3;
    rateAnalyses.forEach((ra) => {
      ra.components.forEach((c) => {
        // Amount formula: (Consumption * (1 + Wastage/100)) * UnitRate
        const amountFormula = {
          t: 'n',
          f: `F${rowNum}*(1+H${rowNum}/100)*G${rowNum}`,
          v: c.amount,
        };

        rows.push([
          ra.itemCode,
          ra.description,
          c.category,
          c.description,
          c.unit,
          c.consumption,
          c.unitRate,
          c.wastagePercent || 0,
          amountFormula,
          c.source || 'Rate Database',
        ]);
        rowNum++;
      });
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      { wch: 14 },
      { wch: 32 },
      { wch: 14 },
      { wch: 36 },
      { wch: 8 },
      { wch: 14 },
      { wch: 14 },
      { wch: 12 },
      { wch: 20 },
      { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'COMPONENT BUILD-UP');
  }

  // 4. Tender Summary Sheet
  private static appendTenderSummarySheet(wb: XLSX.WorkBook, report: TenderSummaryReport) {
    const rows: any[][] = [
      ['TENDER SUMMARY & COST ALLOCATION DASHBOARD', '', '', '', '', ''],
      ['', '', '', '', '', ''],
      ['COST ELEMENTS BREAKDOWN', '', '', '', '', ''],
      ['Element', 'Total Cost (AED)', '% of Tender Total', '', '', ''],
      ['Material Cost', report.costElements.materialTotal, `${report.costElements.materialPercent}%`, '', '', ''],
      ['Labour Cost', report.costElements.labourTotal, `${report.costElements.labourPercent}%`, '', '', ''],
      ['Equipment & Machinery Cost', report.costElements.equipmentTotal, `${report.costElements.equipmentPercent}%`, '', '', ''],
      ['Subcontract Packages', report.costElements.subcontractTotal, `${report.costElements.subcontractPercent}%`, '', '', ''],
      ['Transport & Logistics', report.costElements.transportTotal, `${report.costElements.transportPercent}%`, '', '', ''],
      ['Other Directs & Testing', report.costElements.otherTotal, `${report.costElements.otherPercent}%`, '', '', ''],
      ['TOTAL DIRECT COST', report.costElements.directCostTotal, '100.0%', '', '', ''],
      ['Overhead Allowance', report.costElements.overheadTotal, `${report.costElements.overheadPercent}%`, '', '', ''],
      ['Profit Margin', report.costElements.profitTotal, `${report.costElements.profitPercent}%`, '', '', ''],
      ['Tax / Duty Allowance', report.costElements.taxTotal, `${report.costElements.taxPercent}%`, '', '', ''],
      ['TENDER GRAND TOTAL', report.tenderGrandTotal, '100.0%', '', '', ''],
      ['', '', '', '', '', ''],
      ['COST BREAKDOWN BY DISCIPLINE', '', '', '', '', ''],
      ['Discipline', 'Items Count', 'Direct Cost (AED)', 'Overhead (AED)', 'Profit (AED)', 'Tender Total (AED)'],
    ];

    report.disciplineBreakdown.forEach((d) => {
      rows.push([d.discipline, d.itemCount, d.directCost, d.overheadAmount, d.profitAmount, d.tenderAmount]);
    });

    rows.push(['', '', '', '', '', '']);
    rows.push(['COST BREAKDOWN BY BUILDING / STRUCTURE', '', '', '', '', '']);
    rows.push(['Building', 'Items Count', 'Gross Floor Area (m²)', 'Tender Amount (AED)', 'Cost / m² (AED)', '% of Total']);

    report.buildingBreakdown.forEach((b) => {
      rows.push([b.buildingName, b.itemCount, b.grossFloorAreaM2 || 'N/A', b.tenderAmount, b.costPerM2 || 'N/A', `${b.percentageOfTotal}%`]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 32 }, { wch: 18 }, { wch: 22 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, ws, 'TENDER SUMMARY');
  }

  // 5. Material Database Schedule
  private static appendMaterialScheduleSheet(wb: XLSX.WorkBook, rateDatabase: RateDatabaseItem[]) {
    const materials = rateDatabase.filter((i) => i.category === 'MATERIAL');
    const rows: any[][] = [
      ['PROJECT MATERIAL RATE DATABASE & SPECIFICATIONS', '', '', '', '', '', '', ''],
      ['Code', 'Material Name', 'Specification', 'Unit', 'Base Rate (AED)', 'Supplier', 'Validity To', 'Source'],
    ];

    materials.forEach((m) => {
      rows.push([m.code, m.name, m.specification, m.unit, m.rate, m.supplier || 'Standard', m.validityTo, m.source]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 16 }, { wch: 32 }, { wch: 36 }, { wch: 8 }, { wch: 14 }, { wch: 26 }, { wch: 14 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, ws, 'MATERIAL RATES');
  }

  // 6. Labour Schedule
  private static appendLabourScheduleSheet(wb: XLSX.WorkBook, rateDatabase: RateDatabaseItem[]) {
    const labour = rateDatabase.filter((i) => i.category === 'LABOUR');
    const rows: any[][] = [
      ['LABOUR TRADES, WAGE RATES & PRODUCTIVITY BASELINE', '', '', '', '', '', ''],
      ['Code', 'Trade Description', 'Grade / Skill', 'Unit', 'Daily Rate (AED)', 'Location', 'Source'],
    ];

    labour.forEach((l) => {
      rows.push([l.code, l.name, l.specification, l.unit, l.rate, l.location, l.source]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 16 }, { wch: 30 }, { wch: 36 }, { wch: 10 }, { wch: 14 }, { wch: 20 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, ws, 'LABOUR RATES');
  }

  // 7. Equipment Schedule
  private static appendEquipmentScheduleSheet(wb: XLSX.WorkBook, rateDatabase: RateDatabaseItem[]) {
    const equip = rateDatabase.filter((i) => i.category === 'EQUIPMENT');
    const rows: any[][] = [
      ['CONSTRUCTION PLANT & EQUIPMENT RATE SCHEDULE', '', '', '', '', '', ''],
      ['Code', 'Equipment Name', 'Capacity / Spec', 'Unit', 'Operating Rate (AED)', 'Location', 'Source'],
    ];

    equip.forEach((e) => {
      rows.push([e.code, e.name, e.specification, e.unit, e.rate, e.location, e.source]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 16 }, { wch: 32 }, { wch: 36 }, { wch: 10 }, { wch: 16 }, { wch: 20 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, ws, 'EQUIPMENT RATES');
  }

  // 8. Supplier Quotes Matrix
  private static appendSupplierQuotesSheet(wb: XLSX.WorkBook, quotes: SupplierQuoteItem[]) {
    const rows: any[][] = [
      ['SUPPLIER QUOTATIONS & COMMERCIAL COMPARISON REGISTER', '', '', '', '', '', '', '', ''],
      ['Quote Ref', 'Supplier Name', 'Material / Scope', 'Unit', 'Quoted Rate (AED)', 'Transport (AED)', 'Tax (AED)', 'Delivered Rate (AED)', 'Validity To', 'Status'],
    ];

    quotes.forEach((q) => {
      rows.push([
        q.id,
        q.supplierName,
        q.materialOrService,
        q.unit,
        q.quotedRate,
        q.transportCostPerUnit,
        (q.quotedRate * (q.taxPercent / 100)).toFixed(2),
        q.deliveredUnitCost,
        q.validityEndDate,
        q.isSelectedForRateAnalysis ? 'SELECTED' : 'ALTERNATE',
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 14 }, { wch: 28 }, { wch: 32 }, { wch: 8 }, { wch: 15 }, { wch: 14 }, { wch: 12 }, { wch: 18 }, { wch: 14 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws, 'SUPPLIER QUOTES');
  }

  // 9. Scenarios Sheet
  private static appendScenariosSheet(
    wb: XLSX.WorkBook,
    scenarios: PricingScenario[],
    boqItems: UnifiedBoqItem[],
    rateAnalyses: RateAnalysisRecord[]
  ) {
    const rows: any[][] = [
      ['ALTERNATIVE PRICING SCENARIOS COMPARISON', '', '', '', '', ''],
      ['Note: All scenarios use identical verified quantities from engineering drawings', '', '', '', '', ''],
      ['Scenario Code', 'Scenario Name', 'Direct Cost (AED)', 'Overhead (AED)', 'Profit (AED)', 'Tender Total (AED)'],
    ];

    scenarios.forEach((sc) => {
      let direct = 0;
      let overhead = 0;
      let profit = 0;
      let total = 0;

      boqItems.forEach((b) => {
        const r = rateAnalyses.find((x) => x.boqItemId === b.id || x.itemCode === b.itemCode);
        if (r) {
          const evalR = RateAnalysisEngine.evaluateScenarioRate(r, sc);
          const q = b.finalQuantity || 0;
          direct += evalR.directCost * q;
          overhead += evalR.overheadAmount * q;
          profit += evalR.profitAmount * q;
          total += evalR.finalRate * q;
        }
      });

      rows.push([sc.code, sc.name, direct.toFixed(2), overhead.toFixed(2), profit.toFixed(2), total.toFixed(2)]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 16 }, { wch: 32 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws, 'SCENARIOS COMPARISON');
  }

  // 10. Value Engineering Sheet
  private static appendValueEngineeringSheet(wb: XLSX.WorkBook, proposals: ValueEngineeringProposal[]) {
    const rows: any[][] = [
      ['VALUE ENGINEERING PROPOSALS & SPECIFICATION SAVINGS', '', '', '', '', '', '', '', ''],
      ['VE Ref', 'BOQ Item', 'Original Specification', 'Original Total (AED)', 'Alternative Specification', 'Alternative Total (AED)', 'Savings (AED)', 'Savings %', 'Approval Status'],
    ];

    proposals.forEach((p) => {
      rows.push([
        p.id,
        p.itemCode,
        p.originalSpecification,
        p.originalTotalAmount,
        p.alternativeSpecification,
        p.alternativeTotalAmount,
        p.savingsAmount,
        `${p.savingsPercent}%`,
        p.consultantApprovalStatus,
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 12 }, { wch: 14 }, { wch: 32 }, { wch: 18 }, { wch: 34 }, { wch: 18 }, { wch: 15 }, { wch: 12 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, ws, 'VALUE ENGINEERING');
  }
}
