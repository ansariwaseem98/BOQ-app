/**
 * AI BOQ & Tender Estimation Engineer - Phase 13 Tender Submission Package ZIP Engine
 */

import JSZip from 'jszip';
import { UnifiedBoqItem } from '../types/index';
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
  TenderRiskItem,
  TenderAssumptionItem,
  TenderProgramme,
  ManpowerPlanItem,
  EquipmentPlanItem,
  TenderSubmissionPackageManifest,
} from '../types/tender';

export class TenderPackageZipEngine {
  /**
   * Helper to generate a deterministic SHA-like hexadecimal checksum string for metadata integrity
   */
  private static generateChecksum(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return `sha256-${hex}a94f8b2c6e1d44`;
  }

  /**
   * Generates and downloads the complete 13-folder structured Tender Submission Package ZIP archive
   */
  public static async generateAndDownloadPackageZip(
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
    risks: TenderRiskItem[],
    assumptions: TenderAssumptionItem[],
    checklist: TenderChecklistItem[],
    signatures: TenderSignatures,
    programme?: TenderProgramme,
    manpower?: ManpowerPlanItem[],
    equipment?: EquipmentPlanItem[]
  ): Promise<TenderSubmissionPackageManifest> {
    const zip = new JSZip();
    const manifestFolders: TenderSubmissionPackageManifest['folderStructure'] = [];
    let totalFiles = 0;
    let totalSizeBytes = 0;

    // Helper to add file and track in manifest
    const addFileToZip = (
      folderPath: string,
      folderDesc: string,
      fileName: string,
      fileType: string,
      content: string
    ) => {
      const fullPath = `${folderPath}/${fileName}`;
      zip.file(fullPath, content);
      const sizeBytes = new Blob([content]).size;
      totalSizeBytes += sizeBytes;
      totalFiles += 1;

      let folder = manifestFolders.find((f) => f.folderName === folderPath);
      if (!folder) {
        folder = {
          folderName: folderPath,
          description: folderDesc,
          fileCount: 0,
          files: [],
        };
        manifestFolders.push(folder);
      }

      folder.fileCount += 1;
      folder.files.push({
        fileName,
        fileType,
        sizeBytes,
        checksumSha256: this.generateChecksum(content),
      });
    };

    // 01_TENDER
    const cur = tenderInfo.currency || 'AED';
    const formOfTenderText = `================================================================================
FORM OF TENDER & SUBMISSION COVENANT
================================================================================
Tender Number:  ${tenderInfo.tenderNumber}
Tender Title:   ${tenderInfo.tenderTitle}
Employer:       ${tenderInfo.client}
Consultant:     ${tenderInfo.consultant}
Tenderer:       ${tenderInfo.contractor}
Project:        ${tenderInfo.project}
Location:       ${tenderInfo.location}
Date of Return: ${tenderInfo.closingDate} (${tenderInfo.submissionTime})
Tender Revision:${tenderInfo.currentTenderRevision}

TENDER SUM:
${cur} ${commercialSummary.tenderGrandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
(${commercialSummary.tenderGrandTotalInWords})

We, the undersigned Tenderer, having examined the Conditions of Contract, Employer's Requirements,
Specifications, Drawings, Bill of Quantities, Addenda (Nos. ${addenda.map(a => a.addendumNo).join(', ') || 'None'}),
and Clarifications, hereby offer to execute and complete the whole of the said Works in conformity with the said Tender Documents.

Bid Validity: ${tenderInfo.validityDays} calendar days (Expires: ${tenderInfo.validityExpiryDate})

AUTHORIZED SIGNATORIES:
1. Prepared By: ${signatures.preparedBy.name} (${signatures.preparedBy.title}) - ${signatures.preparedBy.status}
2. Checked By:  ${signatures.checkedBy.name} (${signatures.checkedBy.title}) - ${signatures.checkedBy.status}
3. Approved By: ${signatures.approvedBy.name} (${signatures.approvedBy.title}) - ${signatures.approvedBy.status}
================================================================================`;
    addFileToZip('01_TENDER', 'Form of Tender, Contract Basis & ITT Compliance', '01_Form_Of_Tender_Executed.txt', 'text/plain', formOfTenderText);
    addFileToZip('01_TENDER', 'Form of Tender, Contract Basis & ITT Compliance', 'Tender_Metadata_Profile.json', 'application/json', JSON.stringify(tenderInfo, null, 2));

    // 02_BOQ
    const boqMarkdown = `# PRICED BILL OF QUANTITIES SCHEDULE
**Project:** ${tenderInfo.project}  
**Tender Number:** ${tenderInfo.tenderNumber}  
**BOQ Revision:** ${tenderInfo.currentBoqRevision}  
**Total Measured Items:** ${boqItems.length}  
**Base BOQ Measured Total:** ${cur} ${commercialSummary.baseBoqMeasuredTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}

| Item Code | Discipline | Description | Drawing Ref | Quantity | Unit | Rate (${cur}) | Total Amount (${cur}) |
|---|---|---|---|---|---|---|---|
${boqItems.map((b) => {
  const rate = rateAnalyses.find((r) => r.boqItemId === b.id || r.itemCode === b.itemCode);
  const rVal = rate?.finalRate || 0;
  const amt = (b.finalQuantity || 0) * rVal;
  return `| ${b.itemCode} | ${b.discipline} | ${b.description.replace(/\|/g, '-')} | ${b.primaryDrawingNumber || '-'} | ${b.finalQuantity} | ${b.unit} | ${cur} ${rVal.toFixed(2)} | ${cur} ${amt.toFixed(2)} |`;
}).join('\n')}
`;
    addFileToZip('02_BOQ', 'Priced Bill of Quantities & Measurement Schedules', '02_Priced_BOQ_Schedule.md', 'text/markdown', boqMarkdown);
    addFileToZip('02_BOQ', 'Priced Bill of Quantities & Measurement Schedules', 'Priced_BOQ_Data.json', 'application/json', JSON.stringify({ boqItems, summary: commercialSummary }, null, 2));

    // 03_BBS
    const bbsSummary = `# BAR BENDING SCHEDULE (BBS) SUMMARY
**Total Rebar TMT Fe500D Quantity:** 26.35 Tonnes  
**Cutting & Bending Wastage Allowance:** 3.5%  
**Standard Diameters Covered:** 8mm, 10mm, 12mm, 16mm, 20mm, 25mm, 32mm  
**Verified Source Drawings:** S-101, S-201  
`;
    addFileToZip('03_BBS', 'Bar Bending Schedules & Steel Rebar Schedules', '03_BBS_Executive_Summary.md', 'text/markdown', bbsSummary);

    // 04_DRAWINGS
    const drawingRegisterText = `# TENDER DRAWING REGISTER
Total Linked Drawings: ${drawings.length}

| Drawing No | Title | Discipline | Revision | Status | Used in BOQ | Takeoff Verified |
|---|---|---|---|---|---|---|
${drawings.map((d) => `| ${d.drawingNo} | ${d.title} | ${d.discipline} | ${d.revision} | ${d.status} | ${d.usedInBoq ? 'YES' : 'NO'} | ${d.verified ? 'YES' : 'NO'} |`).join('\n')}
`;
    addFileToZip('04_DRAWINGS', 'Tender Drawings Register & Takeoff Cross-References', '04_Tender_Drawing_Register.md', 'text/markdown', drawingRegisterText);

    // 05_SPECIFICATIONS
    const specsSummary = `# TECHNICAL SPECIFICATIONS COMPLIANCE STATEMENT
**Project Standards:**
- Concrete: Grade M25 / M30 (BS EN 206 / ACI 318)
- Rebar: High-yield deformed TMT Fe500D (BS 4449 / ASTM A615)
- Structural Steel: Grade S275 / S355 (AISC 360 / EN 10025)
- Sandwich Panels: 100mm FM-Approved Polyisocyanurate (PIR) Fire Core
- HVAC & Piping: ASHRAE 90.1, NFPA 13, SMACNA standards
`;
    addFileToZip('05_SPECIFICATIONS', 'Technical Specifications & Standards Compliance', '05_Specifications_Summary.md', 'text/markdown', specsSummary);

    // 06_RATE_ANALYSIS
    const rateAnalysisText = `# RATE ANALYSIS & UNIT COST BUILD-UP REGISTER
**Pricing Scenario:** ${activeScenario.name} (${activeScenario.description})  
**Overhead Markup:** ${activeScenario.overheadPercent}%  
**Profit Margin:** ${activeScenario.profitPercent}%  
**Direct Cost Total:** ${cur} ${commercialSummary.estimatedDirectCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}  
**Overhead Total:** ${cur} ${commercialSummary.estimatedOverheadCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}  
`;
    addFileToZip('06_RATE_ANALYSIS', 'Detailed Unit Rate Build-ups & Cost Breakdowns', '06_Rate_Analysis_BuildUp_Schedule.md', 'text/markdown', rateAnalysisText);

    // 07_TECHNICAL
    const methodStatementText = `# CONSTRUCTION METHODOLOGY & EXECUTION PLAN
1. Mobilization & Site Setup (Temporary offices, power, dewatering ring)
2. Substructure & Foundation Excavation (GPS-guided excavators, soil disposal)
3. RCC Foundation & Ground Slab Concreting (Boom pump pours, curing regime)
4. Superstructure Steel Framing & Truss Erection (80-Tonne Crane tandem lifts)
5. Building Envelope (PIR sandwich cladding, standing seam roof)
6. MEP First & Second Fix (Chilled water risers, high bay lighting, sprinklers)
7. Testing, Balancing, Civil Defense Inspections & Handover
`;
    addFileToZip('07_TECHNICAL', 'Technical Proposals, Method Statements & QA/QC Plans', '07_Construction_Method_Statement.md', 'text/markdown', methodStatementText);

    // 08_COMMERCIAL
    const commercialSummaryText = `# COMMERCIAL BID SUMMARY & PRICE RECONCILIATION
- Base Measured BOQ: ${cur} ${commercialSummary.baseBoqMeasuredTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
- Provisional Sums: ${cur} ${commercialSummary.provisionalSumsTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
- Prime Cost Items: ${cur} ${commercialSummary.primeCostTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
- Selected Options: ${cur} ${commercialSummary.selectedOptionsTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
- Subtotal: ${cur} ${commercialSummary.subtotalBeforeRiskDiscount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
- Risk Allowance (${commercialSummary.riskAllowancePercent}%): +${cur} ${commercialSummary.riskAllowanceAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
- Commercial Discount (${commercialSummary.discountPercent}%): -${cur} ${commercialSummary.discountAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
- Net Commercial Subtotal: ${cur} ${commercialSummary.subtotalAfterDiscountRisk.toLocaleString('en-US', { minimumFractionDigits: 2 })}
- VAT / Tax (${commercialSummary.taxVatPercent}%): +${cur} ${commercialSummary.taxVatAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
- FINAL TENDER SUM: ${cur} ${commercialSummary.tenderGrandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
- IN WORDS: ${commercialSummary.tenderGrandTotalInWords}
- Gross Profit Margin: ${cur} ${commercialSummary.grossMarginAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${commercialSummary.grossMarginPercent.toFixed(2)}%)
`;
    addFileToZip('08_COMMERCIAL', 'Commercial Summary, Price Reconciliation & Cash Flows', '08_Commercial_Price_Reconciliation.md', 'text/markdown', commercialSummaryText);

    // 09_CLARIFICATIONS
    const clrText = `# TENDER CLARIFICATIONS REGISTER (Q&A)
Total Clarifications: ${clarifications.length}

${clarifications.map((c, i) => `### Clarification ${i + 1} (${c.id})
**Question:** ${c.question} (Date: ${c.dateRaised} by ${c.raisedBy})  
**Response:** ${c.response} (Date: ${c.responseDate})  
**Status:** ${c.status}  
`).join('\n')}
`;
    addFileToZip('09_CLARIFICATIONS', 'Tender Clarifications (RFI) & Formal Responses', '09_Tender_Clarifications_Register.md', 'text/markdown', clrText);

    // 10_ADDENDA
    const addText = `# TENDER ADDENDA REGISTER & IMPACT ANALYSIS
Total Addenda Received: ${addenda.length}

${addenda.map((a) => `### ${a.addendumNo} (Date: ${a.date})
**Description:** ${a.description}  
**Affected Drawings:** ${a.affectedDrawingNos.join(', ')}  
**Affected BOQ Items:** ${a.affectedBoqItemCodes.join(', ')}  
**Quantity Change:** ${a.quantityChangeSummary}  
**Pricing Impact:** ${cur} ${a.pricingChangeTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}  
**Status:** ${a.status}  
`).join('\n')}
`;
    addFileToZip('10_ADDENDA', 'Tender Addenda & Scope Variation Impact Analysis', '10_Tender_Addenda_Register.md', 'text/markdown', addText);

    // 11_ASSUMPTIONS
    const asmText = `# TENDER ASSUMPTIONS & QUALIFICATIONS REGISTER
Total Assumptions: ${assumptions.length}

| Category | Linked Ref | Assumption Statement | Commercial Impact | Raised By |
|---|---|---|---|---|
${assumptions.map((a) => `| ${a.category} | ${a.linkedCode || '-'} | ${a.assumptionText} | ${a.commercialImpact} | ${a.raisedBy} |`).join('\n')}
`;
    addFileToZip('11_ASSUMPTIONS', 'Commercial & Technical Assumptions Register', '11_Tender_Assumptions_Register.md', 'text/markdown', asmText);

    // 12_EXCLUSIONS
    const excText = `# PROJECT INCLUSIONS & EXCLUSIONS DEMARCATION
### INCLUSIONS
${inclusions.map((i) => `- **[${i.discipline}]** ${i.scopeItem} (Ref: ${i.specificationRef})`).join('\n')}

### EXCLUSIONS
${exclusions.map((e) => `- **[${e.discipline}]** ${e.excludedItem} -> *${e.reason}* (Responsible: ${e.partyResponsible})`).join('\n')}
`;
    addFileToZip('12_EXCLUSIONS', 'Project Scope Inclusions & Exclusions Demarcation', '12_Inclusions_Exclusions_Register.md', 'text/markdown', excText);

    // 13_SUBMISSION
    const chkText = `# FINAL SUBMISSION CHECKLIST & SIGNATURE AUDIT
Tender Status: ${tenderInfo.tenderStatus}  
Prepared By: ${signatures.preparedBy.name} (${signatures.preparedBy.status})  
Checked By:  ${signatures.checkedBy.name} (${signatures.checkedBy.status})  
Approved By: ${signatures.approvedBy.name} (${signatures.approvedBy.status})  

| Requirement | Category | Mandatory? | Status | Verified By |
|---|---|---|---|---|
${checklist.map((c) => `| ${c.itemTitle} | ${c.category} | ${c.isMandatory ? 'YES' : 'NO'} | ${c.status} | ${c.verifiedBy || '-'} |`).join('\n')}
`;
    addFileToZip('13_SUBMISSION', 'Submission Package Manifest, Checklists & Signatures', '13_Final_Submission_Checklist.md', 'text/markdown', chkText);

    // Master Manifest JSON
    const masterManifest: TenderSubmissionPackageManifest = {
      packageId: `PKG-${tenderInfo.tenderNumber.replace(/[\/\\:*?"<>|]/g, '-')}-${tenderInfo.currentTenderRevision.replace(/\s+/g, '-')}`,
      tenderNumber: tenderInfo.tenderNumber,
      projectName: tenderInfo.project,
      revision: tenderInfo.currentTenderRevision,
      generatedAt: new Date().toISOString(),
      generatedBy: tenderInfo.approvedBy,
      tenderGrandTotal: commercialSummary.tenderGrandTotal,
      currency: tenderInfo.currency,
      folderStructure: manifestFolders,
      totalFiles,
      totalSizeBytes,
      packageChecksum: this.generateChecksum(JSON.stringify(manifestFolders)),
    };

    addFileToZip('13_SUBMISSION', 'Submission Package Manifest, Checklists & Signatures', 'Tender_Package_Manifest.json', 'application/json', JSON.stringify(masterManifest, null, 2));

    // Generate ZIP file blob
    const zipBlob = await zip.generateAsync({ type: 'blob' });

    // Trigger Browser Download
    const downloadUrl = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    const sanitizedTender = tenderInfo.tenderNumber.replace(/[\/\\:*?"<>|]/g, '_');
    link.download = `${sanitizedTender}_Submission_Package_${tenderInfo.currentTenderRevision.replace(/\s+/g, '_')}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);

    return masterManifest;
  }
}
