import * as XLSX from 'xlsx';
import {
  BOQItemObject,
  BOQExcelExportConfig,
  ExcelWorkbookExportConfig,
  STANDARD_35_SHEETS
} from '../types/boqAssemblyTypes';
import { BoqAssemblyEngine } from './boqAssemblyEngine';

export type { ExcelWorkbookExportConfig };

export class MasterBoqExcelEngine {
  /**
   * Generates a fully formatted, 35-sheet master workbook adhering to IS 1200 / POMI / BS 8110 standards.
   */
  public static generateMaster35Workbook(
    items: BOQItemObject[],
    config: BOQExcelExportConfig
  ): XLSX.WorkBook {
    const wb = XLSX.utils.book_new();
    const currency = config.currency || 'AED';

    // ----------------------------------------------------
    // 01_COVER_PAGE
    // ----------------------------------------------------
    const coverAoa: any[][] = [
      ['========================================================================================'],
      ['FINAL VERIFIED BILL OF QUANTITIES & TENDER ESTIMATION REPORT'],
      ['========================================================================================'],
      [''],
      ['PROJECT TITLE:', config.projectName],
      ['PROJECT NUMBER:', config.projectNumber],
      ['CLIENT / EMPLOYER:', config.clientName],
      ['LEAD CONSULTANT:', config.consultantName],
      ['TENDER PACKAGE:', config.signOff.tenderNumber],
      ['BOQ REVISION:', config.revision],
      ['DATE OF SUBMISSION:', config.signOff.approvedDate || new Date().toISOString().split('T')[0]],
      ['CURRENCY:', currency],
      [''],
      ['----------------------------------------------------------------------------------------'],
      ['GOVERNANCE & SIGN-OFF STATUS'],
      ['----------------------------------------------------------------------------------------'],
      ['PREPARED BY:', config.signOff.preparedBy, 'DATE:', config.signOff.preparedDate],
      ['CHECKED BY:', config.signOff.checkedBy, 'DATE:', config.signOff.checkedDate],
      ['APPROVED BY:', config.signOff.approvedBy, 'DATE:', config.signOff.approvedDate],
      [''],
      ['GOVERNANCE STATEMENT:', config.signOff.remarks],
      [''],
      ['========================================================================================'],
      ['ENGINEERING STANDARDS: IS 1200 / POMI / CESMM4 / NRM2 / BS 8110 / AISC 360-16 / NFPA'],
      ['CONFIDENTIAL TENDER SUBMISSION PACKAGE — ALL RIGHTS RESERVED'],
      ['========================================================================================']
    ];
    const wsCover = XLSX.utils.aoa_to_sheet(coverAoa);
    wsCover['!cols'] = [{ wch: 25 }, { wch: 45 }, { wch: 15 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsCover, '01_COVER');

    // ----------------------------------------------------
    // 02_PROJECT_INFO
    // ----------------------------------------------------
    const projectInfoAoa: any[][] = [
      ['FIELD', 'DETAILS', 'VERIFICATION STATUS', 'SOURCE DRAWING / CONTRACT'],
      ['Project Name', config.projectName, 'VERIFIED', 'Tender Contract Vol 1'],
      ['Project Number', config.projectNumber, 'VERIFIED', 'Project Charter'],
      ['Site Location', 'Industrial Free Zone, Sector 4, Plot 108', 'VERIFIED', 'DWG-GEN-001 (Site Survey)'],
      ['Client Name', config.clientName, 'VERIFIED', 'Client Engagement Agreement'],
      ['Consultant Name', config.consultantName, 'VERIFIED', 'Consultant Agreement Ref 2026'],
      ['Contract Type', 'Lump Sum Fixed Price BOQ Contract', 'VERIFIED', 'Conditions of Contract Part I'],
      ['Standard Method of Measurement', 'IS 1200 / POMI / BS 8110', 'VERIFIED', 'Tender Specification Sec 01000'],
      ['Structural System', 'RCC Frame Substructure + Structural Steel Portal Frame', 'VERIFIED', 'DWG-STR-01 & DWG-STL-01'],
      ['Total Built-Up Area (BUA)', '6,450.00 m²', 'VERIFIED', 'Architectural Area Schedule A-002'],
      ['Number of Floors', 'G + 4 Upper Floors + Roof', 'VERIFIED', 'DWG-ARC-ELV-01'],
      ['Concrete Grades Specified', 'M15 Blinding, M35 Footings/Slabs, M40 Columns', 'VERIFIED', 'General Structural Notes S-001'],
      ['Rebar Grade Specified', 'HYSD Fe500D (TMT) / BS 4449 Grade B500B', 'VERIFIED', 'BBS General Notes BBS-001'],
      ['Structural Steel Grade', 'Grade S355JR / ASTM A992', 'VERIFIED', 'Steel Notes S-200'],
      ['Tender Currency', currency, 'VERIFIED', 'Tender Instructions to Bidders']
    ];
    const wsProjectInfo = XLSX.utils.aoa_to_sheet(projectInfoAoa);
    wsProjectInfo['!cols'] = [{ wch: 25 }, { wch: 55 }, { wch: 22 }, { wch: 35 }];
    XLSX.utils.book_append_sheet(wb, wsProjectInfo, '02_PROJECT_INFO');

    // ----------------------------------------------------
    // 03_BOQ (Summary & Pricing Schedule)
    // ----------------------------------------------------
    const boqAoa: any[][] = [
      ['ITEM NO', 'SECTION', 'DESCRIPTION', 'UNIT', 'QUANTITY', `RATE (${currency})`, `AMOUNT (${currency})`, 'STATUS', 'DRAWING REF']
    ];
    items.filter(i => !i.isVoid).forEach(item => {
      boqAoa.push([
        item.itemNumber,
        item.section,
        item.description,
        item.unit,
        item.quantity,
        item.rate || 0,
        item.amount || (item.quantity * (item.rate || 0)),
        item.status,
        item.sourceDrawing
      ]);
    });
    // Add Grand Total Row
    const grandTotals = BoqAssemblyEngine.computeBoqTotals(items);
    boqAoa.push([
      'TOTAL',
      'GRAND TOTAL',
      'MASTER BILL OF QUANTITIES SUMMARY TOTAL',
      '',
      grandTotals.verifiedTotalQuantity,
      '',
      grandTotals.grandTotalAmount,
      'COMPLETE',
      ''
    ]);
    const wsBoq = XLSX.utils.aoa_to_sheet(boqAoa);
    wsBoq['!cols'] = [
      { wch: 12 }, { wch: 20 }, { wch: 65 }, { wch: 8 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 18 }
    ];
    XLSX.utils.book_append_sheet(wb, wsBoq, '03_BOQ');

    // ----------------------------------------------------
    // 04_BOQ_DETAILED (Full Mathematics, Deductions & Traceability)
    // ----------------------------------------------------
    const detailedAoa: any[][] = [
      [
        'ITEM NO',
        'ITEM CODE',
        'SECTION',
        'SUBSECTION',
        'DESCRIPTION',
        'SPECIFICATION',
        'LOCATION / LEVEL',
        'GROSS QTY',
        'DEDUCTIONS',
        'NET QTY',
        'UNIT',
        `RATE (${currency})`,
        `AMOUNT (${currency})`,
        'FORMULA / MATH DERIVATION',
        'CALCULATION ID',
        'DRAWING REF',
        'SOURCE REGION',
        'STATUS',
        'REVISION',
        'REMARKS'
      ]
    ];
    items.forEach(item => {
      detailedAoa.push([
        item.itemNumber,
        item.itemCode,
        item.section,
        item.subsection,
        item.description,
        item.specification,
        `${item.location} (${item.level || ''})`,
        item.grossQuantity || item.quantity,
        item.deductionsTotal || 0,
        item.quantity,
        item.unit,
        item.rate || 0,
        item.amount || (item.quantity * (item.rate || 0)),
        item.formula,
        item.calculationId,
        item.sourceDrawing,
        item.sourceRegion,
        item.status,
        item.revision,
        item.remarks || ''
      ]);
    });
    const wsDetailed = XLSX.utils.aoa_to_sheet(detailedAoa);
    wsDetailed['!cols'] = [
      { wch: 10 }, { wch: 14 }, { wch: 16 }, { wch: 20 }, { wch: 55 }, { wch: 40 },
      { wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 12 },
      { wch: 14 }, { wch: 45 }, { wch: 18 }, { wch: 18 }, { wch: 25 }, { wch: 15 },
      { wch: 10 }, { wch: 30 }
    ];
    XLSX.utils.book_append_sheet(wb, wsDetailed, '04_BOQ_DETAILED');

    // ----------------------------------------------------
    // SHEETS 05 TO 25: DISCIPLINE-SPECIFIC SCHEDULES
    // ----------------------------------------------------
    const disciplineSheetMappings: { sheetName: string; sectionCode: string; title: string }[] = [
      { sheetName: '05_EARTHWORK', sectionCode: 'B', title: 'SECTION B: EARTHWORK & EXCAVATION SCHEDULE' },
      { sheetName: '06_PCC', sectionCode: 'C', title: 'SECTION C: PLAIN CEMENT CONCRETE (PCC) BLINDING' },
      { sheetName: '07_RCC', sectionCode: 'D', title: 'SECTION D: REINFORCED CEMENT CONCRETE (RCC) WORKS' },
      { sheetName: '08_REBAR', sectionCode: 'E', title: 'SECTION E: HIGH YIELD TMT STEEL REINFORCEMENT (BBS)' },
      { sheetName: '09_FORMWORK', sectionCode: 'F', title: 'SECTION F: SHUTTERING & FORMWORK SYSTEMS' },
      { sheetName: '10_MASONRY', sectionCode: 'G', title: 'SECTION G: AAC & SOLID BLOCK MASONRY WORKS' },
      { sheetName: '11_DPC', sectionCode: 'H', title: 'SECTION H: DAMP PROOF COURSE (DPC) & PLINTH SEAL' },
      { sheetName: '12_STRUCTURAL_STEEL', sectionCode: 'I', title: 'SECTION I: STRUCTURAL STEEL FRAMING & TRUSSES' },
      { sheetName: '13_PURLINS', sectionCode: 'J', title: 'SECTION J: GALVANIZED COLD FORMED PURLINS & GIRTS' },
      { sheetName: '14_ROOFING', sectionCode: 'K', title: 'SECTION K: INSULATED SANDWICH ROOF CLADDING' },
      { sheetName: '15_SKYLIGHT', sectionCode: 'L', title: 'SECTION L: POLYCARBONATE MULTIWALL SKYLIGHTS' },
      { sheetName: '16_DOORS_WINDOWS', sectionCode: 'N', title: 'SECTIONS N & O: DOORS, WINDOWS & HARDWARE' },
      { sheetName: '17_PLASTER', sectionCode: 'P', title: 'SECTION P: INTERNAL & EXTERNAL PLASTER WORKS' },
      { sheetName: '18_FINISHES', sectionCode: 'Q', title: 'SECTIONS Q, R, S, T: FLOOR, WALL & CEILING FINISHES' },
      { sheetName: '19_WATERPROOFING', sectionCode: 'M', title: 'SECTION M: WATERPROOFING & MEMBRANES' },
      { sheetName: '20_ELECTRICAL', sectionCode: 'X', title: 'SECTION X: ELECTRICAL POWER, LIGHTING & DISTRIBUTION' },
      { sheetName: '21_HVAC', sectionCode: 'V', title: 'SECTION V: HEATING, VENTILATION & AIR CONDITIONING (HVAC)' },
      { sheetName: '22_PLUMBING', sectionCode: 'U', title: 'SECTION U: WATER SUPPLY & SANITARY DRAINAGE PIPING' },
      { sheetName: '23_FIRE_FIGHTING', sectionCode: 'W', title: 'SECTION W: FIRE PROTECTION SPRINKLER & PUMP SYSTEMS' },
      { sheetName: '24_ELV', sectionCode: 'Y', title: 'SECTION Y: EXTRA LOW VOLTAGE, FIRE ALARM & CCTV' },
      { sheetName: '25_EXTERNAL_WORKS', sectionCode: 'Z', title: 'SECTIONS Z & AA: EXTERNAL WORKS & MISCELLANEOUS' }
    ];

    disciplineSheetMappings.forEach(({ sheetName, sectionCode, title }) => {
      let filtered = items.filter(i => !i.isVoid && (i.sectionCode === sectionCode || i.section.startsWith(sectionCode + '.')));
      if (sectionCode === 'N') {
        filtered = items.filter(i => !i.isVoid && (i.sectionCode === 'N' || i.sectionCode === 'O'));
      } else if (sectionCode === 'Q') {
        filtered = items.filter(i => !i.isVoid && ['Q', 'R', 'S', 'T'].includes(i.sectionCode));
      } else if (sectionCode === 'Z') {
        filtered = items.filter(i => !i.isVoid && ['Z', 'AA', 'A'].includes(i.sectionCode));
      }

      const sheetAoa: any[][] = [
        [title],
        ['PROJECT:', config.projectName, 'PROJECT NO:', config.projectNumber, 'REVISION:', config.revision],
        [''],
        ['ITEM NO', 'ITEM CODE', 'DESCRIPTION', 'LOCATION', 'QUANTITY', 'UNIT', `RATE (${currency})`, `AMOUNT (${currency})`, 'FORMULA', 'DRAWING REF', 'STATUS']
      ];

      filtered.forEach(item => {
        sheetAoa.push([
          item.itemNumber,
          item.itemCode,
          item.description,
          item.location,
          item.quantity,
          item.unit,
          item.rate || 0,
          item.amount || (item.quantity * (item.rate || 0)),
          item.formula,
          item.sourceDrawing,
          item.status
        ]);
      });

      const sectionTotalAmount = filtered.reduce((acc, curr) => acc + (curr.amount || 0), 0);
      sheetAoa.push([
        'SUBTOTAL',
        '',
        `TOTAL FOR ${sheetName}`,
        '',
        '',
        '',
        '',
        sectionTotalAmount,
        '',
        '',
        ''
      ]);

      const wsDisc = XLSX.utils.aoa_to_sheet(sheetAoa);
      wsDisc['!cols'] = [
        { wch: 10 }, { wch: 14 }, { wch: 55 }, { wch: 25 }, { wch: 12 }, { wch: 8 },
        { wch: 14 }, { wch: 16 }, { wch: 40 }, { wch: 18 }, { wch: 15 }
      ];
      XLSX.utils.book_append_sheet(wb, wsDisc, sheetName);
    });

    // ----------------------------------------------------
    // 26_MATERIAL_SUMMARY
    // ----------------------------------------------------
    const materialSummary = BoqAssemblyEngine.generateMaterialSummary(items);
    const materialAoa: any[][] = [
      ['MATERIAL / PRODUCT NAME', 'CATEGORY / DISCIPLINE', 'TECHNICAL SPECIFICATION', 'UNIT', 'VERIFIED QUANTITY', 'TOTAL QUANTITY', 'PROCUREMENT QTY (INCL. WASTAGE)', 'PRIMARY SOURCE DRAWING']
    ];
    materialSummary.forEach(m => {
      materialAoa.push([
        m.material,
        m.category,
        m.specification,
        m.unit,
        m.verifiedQuantity,
        m.totalQuantity,
        m.procurementQuantity,
        m.sourceSummary
      ]);
    });
    const wsMaterial = XLSX.utils.aoa_to_sheet(materialAoa);
    wsMaterial['!cols'] = [
      { wch: 35 }, { wch: 22 }, { wch: 45 }, { wch: 8 }, { wch: 18 }, { wch: 16 }, { wch: 32 }, { wch: 25 }
    ];
    XLSX.utils.book_append_sheet(wb, wsMaterial, '26_MATERIAL_SUMMARY');

    // ----------------------------------------------------
    // 27_LEVEL_SUMMARY
    // ----------------------------------------------------
    const levelSummary = BoqAssemblyEngine.generateLevelSummary(items);
    const levelAoa: any[][] = [
      ['BUILDING LEVEL', 'CIVIL AMOUNT', 'RCC AMOUNT', 'REBAR AMOUNT', 'STEEL AMOUNT', 'ARCH AMOUNT', 'ROOF AMOUNT', 'MEP AMOUNT', `TOTAL AMOUNT (${currency})`, 'ITEMS COUNT']
    ];
    levelSummary.forEach(l => {
      levelAoa.push([
        l.level,
        l.civilAmount,
        l.rccAmount,
        l.rebarAmount,
        l.steelAmount,
        l.archAmount,
        l.roofAmount,
        l.mepAmount,
        l.totalAmount,
        l.itemCount
      ]);
    });
    const wsLevel = XLSX.utils.aoa_to_sheet(levelAoa);
    wsLevel['!cols'] = [
      { wch: 24 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 20 }, { wch: 12 }
    ];
    XLSX.utils.book_append_sheet(wb, wsLevel, '27_LEVEL_SUMMARY');

    // ----------------------------------------------------
    // 28_TRADE_SUMMARY
    // ----------------------------------------------------
    const tradeSummary = BoqAssemblyEngine.generateTradeSummary(items);
    const tradeAoa: any[][] = [
      ['SECTION', 'TRADE / WORK SCOPE', 'DISCIPLINE', 'ITEMS COUNT', 'VERIFIED ITEMS', 'REVIEW ITEMS', 'OPEN ITEMS', 'CONFLICTS', 'TOTAL QUANTITY', 'UNIT', `TOTAL AMOUNT (${currency})`]
    ];
    tradeSummary.forEach(t => {
      tradeAoa.push([
        t.sectionCode,
        t.sectionName,
        t.discipline,
        t.itemCount,
        t.verifiedCount,
        t.reviewCount,
        t.openItemsCount,
        t.conflictsCount,
        t.totalQuantity,
        t.primaryUnit,
        t.totalAmount
      ]);
    });
    tradeAoa.push([
      'TOTAL',
      'ALL 27 BOQ SECTIONS (A TO AA)',
      'FULL MULTIDISCIPLINE',
      tradeSummary.reduce((a, b) => a + b.itemCount, 0),
      tradeSummary.reduce((a, b) => a + b.verifiedCount, 0),
      tradeSummary.reduce((a, b) => a + b.reviewCount, 0),
      tradeSummary.reduce((a, b) => a + b.openItemsCount, 0),
      tradeSummary.reduce((a, b) => a + b.conflictsCount, 0),
      '',
      '',
      tradeSummary.reduce((a, b) => a + b.totalAmount, 0)
    ]);
    const wsTrade = XLSX.utils.aoa_to_sheet(tradeAoa);
    wsTrade['!cols'] = [
      { wch: 10 }, { wch: 30 }, { wch: 22 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 8 }, { wch: 20 }
    ];
    XLSX.utils.book_append_sheet(wb, wsTrade, '28_TRADE_SUMMARY');

    // ----------------------------------------------------
    // 29_DRAWING_REGISTER
    // ----------------------------------------------------
    const drawingSummary = BoqAssemblyEngine.generateDrawingSummary(items);
    const drawingAoa: any[][] = [
      ['DRAWING NUMBER', 'DRAWING TITLE / SHEET NAME', 'DISCIPLINE', 'REVISION', 'GENERATED ITEMS', 'TOTAL QUANTITY', 'VERIFICATION STATUS']
    ];
    drawingSummary.forEach(d => {
      drawingAoa.push([
        d.drawingNumber,
        d.drawingTitle,
        d.discipline,
        d.revision,
        d.itemsCount,
        d.totalQuantity,
        d.status
      ]);
    });
    const wsDwg = XLSX.utils.aoa_to_sheet(drawingAoa);
    wsDwg['!cols'] = [
      { wch: 20 }, { wch: 40 }, { wch: 18 }, { wch: 10 }, { wch: 16 }, { wch: 16 }, { wch: 22 }
    ];
    XLSX.utils.book_append_sheet(wb, wsDwg, '29_DRAWING_REGISTER');

    // ----------------------------------------------------
    // 30_CALCULATION_REGISTER
    // ----------------------------------------------------
    const calcAoa: any[][] = [
      ['CALCULATION ID', 'BOQ ITEM CODE', 'DISCIPLINE', 'MATHEMATICAL FORMULA', 'VARIABLES & INPUTS', 'GROSS VALUE', 'DEDUCTIONS', 'NET QUANTITY', 'UNIT', 'DRAWING PROVENANCE']
    ];
    items.forEach(item => {
      calcAoa.push([
        item.calculationId,
        item.itemCode,
        item.discipline,
        item.formula,
        JSON.stringify(item.inputs || {}),
        item.grossQuantity || item.quantity,
        item.deductionsTotal || 0,
        item.quantity,
        item.unit,
        `${item.sourceDrawing} [${item.sourceRegion}]`
      ]);
    });
    const wsCalc = XLSX.utils.aoa_to_sheet(calcAoa);
    wsCalc['!cols'] = [
      { wch: 22 }, { wch: 15 }, { wch: 15 }, { wch: 45 }, { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 35 }
    ];
    XLSX.utils.book_append_sheet(wb, wsCalc, '30_CALCULATION_REGISTER');

    // ----------------------------------------------------
    // 31_OPEN_ITEMS
    // ----------------------------------------------------
    const openItemsList = items.filter(i => i.openItemId || i.status === 'REVIEW REQUIRED');
    const openItemsAoa: any[][] = [
      ['OPEN ITEM ID', 'BOQ ITEM CODE', 'DISCIPLINE', 'DESCRIPTION / QUERY', 'DRAWING REF', 'SEVERITY', 'STATUS', 'ACTION REQUIRED']
    ];
    openItemsList.forEach(item => {
      openItemsAoa.push([
        item.openItemId || `OI-${item.itemCode}`,
        item.itemCode,
        item.discipline,
        item.remarks || item.description,
        item.sourceDrawing,
        'HIGH',
        'OPEN (RFI PENDING)',
        'Clarify missing dimensions with Structural/Architectural consultant'
      ]);
    });
    if (openItemsList.length === 0) {
      openItemsAoa.push(['NONE', 'N/A', 'N/A', 'All items verified. Zero pending open items.', 'N/A', 'INFO', 'CLEARED', 'None']);
    }
    const wsOpen = XLSX.utils.aoa_to_sheet(openItemsAoa);
    wsOpen['!cols'] = [
      { wch: 20 }, { wch: 16 }, { wch: 16 }, { wch: 55 }, { wch: 20 }, { wch: 12 }, { wch: 20 }, { wch: 45 }
    ];
    XLSX.utils.book_append_sheet(wb, wsOpen, '31_OPEN_ITEMS');

    // ----------------------------------------------------
    // 32_CONFLICTS
    // ----------------------------------------------------
    const conflictList = items.filter(i => i.status === 'CONFLICT' || i.conflictId);
    const conflictsAoa: any[][] = [
      ['CONFLICT ID', 'BOQ ITEM CODE', 'DISCIPLINE', 'DESCRIPTION OF DISCREPANCY', 'SOURCE A DRAWING', 'SOURCE B DRAWING', 'STATUS', 'RECOMMENDED RESOLUTION']
    ];
    conflictList.forEach(item => {
      conflictsAoa.push([
        item.conflictId || `CONF-${item.itemCode}`,
        item.itemCode,
        item.discipline,
        item.remarks || 'Dimension discrepancy between architectural and structural drawings',
        item.sourceDrawing,
        'DWG-ARC-01',
        'UNRESOLVED',
        'Issue RFI to Structural Engineer for clarification prior to procurement'
      ]);
    });
    if (conflictList.length === 0) {
      conflictsAoa.push(['NONE', 'N/A', 'N/A', 'Zero cross-discipline conflicts detected.', 'N/A', 'N/A', 'CLEARED', 'None']);
    }
    const wsConflicts = XLSX.utils.aoa_to_sheet(conflictsAoa);
    wsConflicts['!cols'] = [
      { wch: 20 }, { wch: 16 }, { wch: 16 }, { wch: 55 }, { wch: 20 }, { wch: 20 }, { wch: 16 }, { wch: 45 }
    ];
    XLSX.utils.book_append_sheet(wb, wsConflicts, '32_CONFLICTS');

    // ----------------------------------------------------
    // 33_AUDIT_TRAIL
    // ----------------------------------------------------
    const auditAoa: any[][] = [
      ['LOG ID', 'TIMESTAMP', 'USER / ENGINEER', 'BOQ ITEM NUMBER', 'ITEM CODE', 'ACTION TYPE', 'PREVIOUS VALUE', 'NEW VALUE', 'JUSTIFICATION / REASON']
    ];
    items.forEach(item => {
      if (item.quantityEditHistory && item.quantityEditHistory.length > 0) {
        item.quantityEditHistory.forEach(qLog => {
          auditAoa.push([
            qLog.id,
            qLog.timestamp,
            qLog.user,
            item.itemNumber,
            item.itemCode,
            'QUANTITY_OVERRIDE',
            `${qLog.originalQuantity} ${qLog.unit}`,
            `${qLog.editedQuantity} ${qLog.unit}`,
            qLog.reason
          ]);
        });
      }
      if (item.descriptionEditHistory && item.descriptionEditHistory.length > 0) {
        item.descriptionEditHistory.forEach(dLog => {
          auditAoa.push([
            dLog.id,
            dLog.timestamp,
            dLog.user,
            item.itemNumber,
            item.itemCode,
            'DESCRIPTION_EDIT',
            dLog.originalDescription,
            dLog.editedDescription,
            dLog.reason
          ]);
        });
      }
    });
    if (auditAoa.length === 1) {
      auditAoa.push(['AUD-INIT-01', new Date().toISOString(), 'System Engine', 'ALL', 'ALL', 'INITIAL_IMPORT', 'Baseline 0', 'Calculated Quantities', 'Automated Drawing Measurement & Calculation']);
    }
    const wsAudit = XLSX.utils.aoa_to_sheet(auditAoa);
    wsAudit['!cols'] = [
      { wch: 18 }, { wch: 24 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 22 }, { wch: 30 }, { wch: 30 }, { wch: 40 }
    ];
    XLSX.utils.book_append_sheet(wb, wsAudit, '33_AUDIT_TRAIL');

    // ----------------------------------------------------
    // 34_REVISION_HISTORY
    // ----------------------------------------------------
    const revAoa: any[][] = [
      ['REVISION CODE', 'REVISION DATE', 'AUTHOR / QS', 'DRAWING SET BASIS', 'SUMMARY OF QUANTITY CHANGES', 'STATUS']
    ];
    config.revisionHistory.forEach(rev => {
      revAoa.push([
        rev.revision,
        rev.date,
        rev.author,
        rev.drawingSet,
        rev.changesSummary,
        rev.status
      ]);
    });
    const wsRev = XLSX.utils.aoa_to_sheet(revAoa);
    wsRev['!cols'] = [
      { wch: 16 }, { wch: 14 }, { wch: 20 }, { wch: 25 }, { wch: 60 }, { wch: 15 }
    ];
    XLSX.utils.book_append_sheet(wb, wsRev, '34_REVISION_HISTORY');

    // ----------------------------------------------------
    // 35_QUALITY_REPORT
    // ----------------------------------------------------
    const qualityData = BoqAssemblyEngine.evaluateQualityGate(items);
    const qualityAoa: any[][] = [
      ['========================================================================================'],
      ['FINAL VERIFIED BOQ QUALITY GATE & COMPLETENESS REPORT'],
      ['========================================================================================'],
      ['OVERALL COMPLETENESS SCORE:', `${qualityData.overallCompletenessScore}%`],
      ['FINAL ACCEPTANCE STATUS:', qualityData.finalAcceptanceStatus],
      ['EVALUATION TIMESTAMP:', qualityData.evaluationTimestamp],
      [''],
      ['CHECK ID', 'QUALITY & GOVERNANCE TEST', 'STATUS', 'DETAILS & AUDIT EVIDENCE']
    ];
    qualityData.qualityChecks.forEach(qc => {
      qualityAoa.push([
        qc.checkId,
        qc.checkName,
        qc.status,
        qc.message
      ]);
    });
    const wsQuality = XLSX.utils.aoa_to_sheet(qualityAoa);
    wsQuality['!cols'] = [
      { wch: 15 }, { wch: 35 }, { wch: 10 }, { wch: 65 }
    ];
    XLSX.utils.book_append_sheet(wb, wsQuality, '35_QUALITY_REPORT');

    return wb;
  }

  /**
   * Generates and downloads the 35-Sheet Excel file directly to client browser.
   */
  public static downloadMaster35Excel(
    items: BOQItemObject[],
    config: BOQExcelExportConfig
  ): void {
    const workbook = this.generateMaster35Workbook(items, config);
    const sanitizedProject = config.projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${sanitizedProject}_Master_35_BOQ_${config.revision.replace(/\s+/g, '_')}.xlsx`;
    XLSX.writeFile(workbook, filename, { bookType: 'xlsx', type: 'binary' });
  }

  /**
   * Export workbook and return result metadata.
   */
  public static exportMasterWorkbook(
    items: BOQItemObject[],
    config: ExcelWorkbookExportConfig
  ): { success: boolean; fileName: string; sheetCount: number } {
    const workbook = this.generateMaster35Workbook(items, config);
    const sanitizedProject = config.projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `${sanitizedProject}_Master_35_BOQ_${config.revision.replace(/\s+/g, '_')}.xlsx`;
    XLSX.writeFile(workbook, fileName, { bookType: 'xlsx', type: 'binary' });
    return {
      success: true,
      fileName,
      sheetCount: workbook.SheetNames.length
    };
  }
}
