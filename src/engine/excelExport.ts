/**
 * Professional Multi-Tab Excel Workbook Generator
 * Generates 14 structured sheets matching tender submission standards
 */

import * as XLSX from 'xlsx';
import { ProjectData, DrawingRecord, BoqItem, DetectedElement, BbsBarRecord, OpenItem, AssumptionRecord, RevisionComparison } from '../types';

export interface ExportDataPayload {
  projectData: ProjectData | null;
  drawings: DrawingRecord[];
  boqItems: BoqItem[];
  elements: DetectedElement[];
  bbsRecords: BbsBarRecord[];
  openItems: OpenItem[];
  assumptions?: AssumptionRecord[];
  revisions: RevisionComparison[];
}

export function exportProjectToExcel(payload: ExportDataPayload): void {
  const { projectData, drawings, boqItems, elements, bbsRecords, openItems, assumptions = [], revisions } = payload;
  const wb = XLSX.utils.book_new();

  // Helper to append sheet
  const addSheet = (sheetName: string, data: any[][]) => {
    const ws = XLSX.utils.aoa_to_sheet(data);
    // Auto column widths
    const maxCols = Math.max(...data.map((r) => r.length), 0);
    const colWidths = Array.from({ length: maxCols }, (_, colIdx) => {
      const maxLen = Math.max(
        ...data.map((r) => (r[colIdx] !== undefined && r[colIdx] !== null ? String(r[colIdx]).length : 0)),
        10
      );
      return { wch: Math.min(maxLen + 4, 60) };
    });
    ws['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  };

  // 1. Project Information Sheet
  const projectInfoRows: any[][] = [
    ['AI BOQ & TENDER ESTIMATION REPORT', ''],
    ['Generated On', new Date().toLocaleString()],
    ['', ''],
    ['1. CONTRACTOR / COMPANY INFORMATION', ''],
    ['Company Name', projectData?.company?.name || 'Not Entered'],
    ['License / Registration', projectData?.company?.licenseNumber || 'Not Entered'],
    ['Contact Person', projectData?.company?.contactPerson || 'Not Entered'],
    ['Phone / Email', `${projectData?.company?.phone || ''} | ${projectData?.company?.email || ''}`],
    ['Address', projectData?.company?.address || 'Not Entered'],
    ['', ''],
    ['2. CLIENT / EMPLOYER', ''],
    ['Client Name', projectData?.client?.name || 'Not Entered'],
    ['Client Company', projectData?.client?.companyName || (projectData?.client as any)?.company || 'Not Entered'],
    ['Contact Details', `${projectData?.client?.contactPerson || ''} (${projectData?.client?.email || ''})`],
    ['', ''],
    ['3. CONSULTANTS', ''],
    ['Lead / PM Consultant', projectData?.consultant?.leadConsultant || 'Not Entered'],
    ['Architectural Consultant', projectData?.consultant?.architect || 'Not Entered'],
    ['Structural Consultant', projectData?.consultant?.structuralConsultant || 'Not Entered'],
    ['MEP Consultant', projectData?.consultant?.mepConsultant || 'Not Entered'],
    ['', ''],
    ['4. PROJECT & TENDER PARAMETERS', ''],
    ['Project Name', projectData?.project?.name || 'Untitled Project'],
    ['Project Code', projectData?.project?.projectNumber || 'N/A'],
    ['Location', projectData?.project?.location || 'N/A'],
    ['Building Type / Levels', `${projectData?.project?.projectType || 'RCC'} (${projectData?.project?.numberOfFloors || 1} Floors)`],
    ['Built-Up Area (BUA)', `${(projectData?.project?.builtUpAreaM2 || 0).toLocaleString()} m²`],
    ['Tender Reference', projectData?.project?.tenderReference || 'N/A'],
    ['Tender Submission Deadline', projectData?.project?.tenderSubmissionDeadline || 'N/A'],
    ['Currency', projectData?.contract?.currency || 'USD'],
    ['Measurement Standard', projectData?.contract?.measurementMethodology || 'POMI'],
    ['Applicable Design Codes', projectData?.contract?.applicableCodes || 'N/A'],
    ['Contract Type', projectData?.contract?.contractType || 'Item Rate (BOQ)'],
  ];
  addSheet('Project Information', projectInfoRows);

  // 2. Drawing Register Sheet
  const drawingRegisterRows: any[][] = [
    ['DRAWING & DOCUMENT REGISTER', '', '', '', '', '', '', '', ''],
    ['Drawing No.', 'Title', 'Discipline', 'Type', 'Format', 'Revision', 'Date', 'Level / Zone', 'Status', 'Detected Elements'],
    ...drawings.map((d) => [
      d.drawingNumber,
      d.title,
      d.discipline,
      d.type,
      d.format,
      d.revision,
      d.date,
      d.level,
      d.status,
      d.detectedElementsCount,
    ]),
  ];
  addSheet('Drawing Register', drawingRegisterRows);

  // 3. BOQ Summary Sheet
  const categoriesMap = new Map<string, { count: number; total: number }>();
  let grandBoqTotal = 0;
  boqItems.forEach((item) => {
    const existing = categoriesMap.get(item.sectionCode) || { count: 0, total: 0 };
    existing.count += 1;
    existing.total += item.totalAmount;
    categoriesMap.set(item.sectionCode, existing);
    grandBoqTotal += item.totalAmount;
  });

  const boqSummaryRows: any[][] = [
    ['BILL OF QUANTITIES - GRAND SUMMARY', '', '', '', ''],
    ['Project', projectData.project.name, '', 'Currency', projectData.contract.currency],
    ['', '', '', '', ''],
    ['Bill No.', 'Trade / Section Description', 'Items Count', `Total Amount (${projectData.contract.currency})`, '% of Bid Total'],
    ...Array.from(categoriesMap.entries()).map(([section, data], idx) => [
      `Bill ${idx + 1 < 10 ? '0' + (idx + 1) : idx + 1}`,
      section,
      data.count,
      Number(data.total.toFixed(2)),
      grandBoqTotal > 0 ? `${((data.total / grandBoqTotal) * 100).toFixed(2)}%` : '0%',
    ]),
    ['', '', '', '', ''],
    ['TOTAL ESTIMATED BID AMOUNT', '', boqItems.length, Number(grandBoqTotal.toFixed(2)), '100.00%'],
  ];
  addSheet('BOQ Summary', boqSummaryRows);

  // 4. Detailed BOQ Sheet
  const detailedBoqRows: any[][] = [
    ['DETAILED BILL OF QUANTITIES (PRICED BOQ)', '', '', '', '', '', '', '', '', ''],
    ['Item No.', 'Section', 'Description', 'Unit', 'Quantity', `Unit Rate (${projectData.contract.currency})`, `Total Amount (${projectData.contract.currency})`, 'Drawing References', 'Spec Reference', 'Status'],
    ...boqItems.map((b) => [
      b.itemNumber,
      b.sectionCode,
      b.description,
      b.unit,
      b.quantity,
      b.unitRate,
      b.totalAmount,
      b.drawingReferences.join(', '),
      b.specificationReference,
      b.status.toUpperCase(),
    ]),
  ];
  addSheet('Detailed BOQ', detailedBoqRows);

  // 5. RCC Takeoff Sheet
  const rccElements = elements.filter((e) =>
    ['pcc', 'footing', 'column', 'beam', 'slab', 'staircase', 'shear_wall', 'retaining_wall', 'ground_beam', 'pedestal', 'parapet'].includes(e.category)
  );
  const rccRows: any[][] = [
    ['REINFORCED CEMENT CONCRETE (RCC) TAKEOFF SHEET', '', '', '', '', '', '', '', '', '', '', ''],
    ['Element ID', 'Member Type', 'Level', 'Grid Location', 'Length (m)', 'Width (m)', 'Depth/Thk (m)', 'Count', 'Concrete Grade', 'Gross (m³)', 'Deductions (m³)', 'Net Concrete (m³)', 'Formwork (m²)', 'Drawing Ref'],
    ...rccElements.map((el) => [
      el.id,
      el.name,
      el.level,
      el.gridLocation,
      el.dimensions.length,
      el.dimensions.width,
      el.dimensions.depthOrThickness,
      el.dimensions.count,
      el.specification.concreteGrade || 'C35/45',
      el.calculation.grossQuantity,
      el.calculation.deductionsTotal,
      el.calculation.netQuantity,
      el.calculation.formworkAreaM2 || 0,
      `${el.drawingNumber} (${el.drawingRevision})`,
    ]),
  ];
  addSheet('RCC Takeoff', rccRows);

  // 6. Reinforcement Takeoff / BBS Sheet
  const bbsRows: any[][] = [
    ['BAR BENDING SCHEDULE (BBS) - BS 8666 / IS 2502', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['Bar Mark', 'Member / Location', 'Level', 'Dia (mm)', 'Grade', 'Shape Code', 'Shape Description', 'Cutting Length (m)', 'No. of Members', 'Bars / Member', 'Total Bars', 'Total Length (m)', 'Unit Wt (kg/m)', 'Total Weight (kg)', 'Drawing Ref'],
    ...bbsRecords.map((b) => [
      b.barMark,
      b.memberName,
      b.level,
      b.diameterMm,
      b.rebarGrade,
      b.shapeCode,
      b.shapeDescription,
      b.cuttingLengthM,
      b.memberCount,
      b.barsPerMember,
      b.totalBars,
      b.totalLengthM,
      b.unitWeightKgM,
      b.totalWeightKg,
      b.drawingReference,
    ]),
  ];
  addSheet('BBS Schedule', bbsRows);

  // 7. Steel Takeoff Sheet
  const steelElements = elements.filter((e) => ['steel_column', 'steel_rafter', 'purlin', 'roof_cladding'].includes(e.category));
  const steelRows: any[][] = [
    ['STRUCTURAL STEEL & CLADDING TAKEOFF', '', '', '', '', '', '', '', ''],
    ['Element ID', 'Name / Category', 'Section / Profile', 'Length (m)', 'Count', 'Unit Wt (kg/m)', 'Total Weight (Ton)', 'Drawing Ref', 'Status'],
    ...steelElements.map((s) => [
      s.id,
      s.name,
      s.specification.steelSection || 'Standard',
      s.dimensions.length,
      s.dimensions.count,
      s.dimensions.diameterMm || 0,
      s.calculation.netQuantity,
      `${s.drawingNumber} (${s.drawingRevision})`,
      s.status,
    ]),
  ];
  addSheet('Steel & Cladding', steelRows);

  // 8. Open Items Sheet
  const openItemRows: any[][] = [
    ['OPEN ITEMS & CLARIFICATION REGISTER', '', '', '', '', '', '', ''],
    ['Item ID', 'Severity', 'Category', 'Title', 'Description / Missing Dimension', 'Source Drawing', 'Location on Sheet', 'Resolution Status'],
    ...openItems.map((oi) => [
      oi.id,
      oi.severity.toUpperCase(),
      oi.category,
      oi.title,
      oi.description,
      `${oi.drawingNumber} (${oi.drawingRevision})`,
      oi.locationDescription,
      oi.status.toUpperCase(),
    ]),
  ];
  addSheet('Open Items', openItemRows);

  // 9. Assumptions Register Sheet
  const assumptionRows: any[][] = [
    ['EXPLICIT USER-APPROVED ASSUMPTIONS REGISTER', '', '', '', '', ''],
    ['ID', 'Title', 'Category', 'Assumption Description', 'Approved By User', 'Approved Date'],
    ...assumptions.map((a) => [
      a.id,
      a.title,
      a.category,
      a.assumptionText,
      a.approvedByUser,
      a.approvedDate,
    ]),
  ];
  addSheet('Assumptions', assumptionRows);

  // 10. Calculation Audit Sheet
  const calcAuditRows: any[][] = [
    ['CALCULATION AUDIT TRAIL ("SHOW ME WHY")', '', '', '', '', '', '', ''],
    ['Element ID', 'Member Name', 'Drawing Location', 'Mathematical Formula', 'Step-by-Step Expression', 'Net Quantity', 'Unit', 'Calculation Timestamp'],
    ...elements.map((el) => [
      el.id,
      el.name,
      `${el.drawingNumber} - ${el.gridLocation}`,
      el.calculation.formula,
      el.calculation.expressionWithValues,
      el.calculation.netQuantity,
      el.calculation.unit,
      el.calculation.lastCalculatedAt,
    ]),
  ];
  addSheet('Calculation Audit', calcAuditRows);

  // Trigger download in browser
  const fileName = `${projectData.project.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_BOQ_Tender_Package.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export const exportComprehensiveTenderWorkbook = exportProjectToExcel;

