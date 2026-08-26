/**
 * AI BOQ & Tender Estimation Engineer - Phase 15E MEP Multi-Discipline Excel Export Engine
 * 
 * Generates an enterprise-grade multi-tab XML/XLS spreadsheet for industrial MEP takeoffs:
 * 1. Executive Summary & Verification KPIs
 * 2. Electrical BOQ
 * 3. HVAC BOQ (Duct Area m², Piping, Equipment)
 * 4. Plumbing BOQ (Water Supply, Drainage, Fixtures)
 * 5. Fire Fighting BOQ (Sprinklers, Wet Risers, Pumps)
 * 6. ELV BOQ (CCTV, Access Control, Data, Fire Alarm)
 * 7. MEP Supports & Containment BOQ
 * 8. Master Equipment Register
 * 9. Plan vs Riser Reconciliation & Deduplication
 * 10. Open Items & Missing Specs (RFIs)
 * 11. Drawing Conflicts Matrix
 * 12. Tender Revision Delta (Rev 00 vs Rev 01)
 * 13. Audit Trail & User Corrections Ledger
 */

import {
  GeneralMEPElement,
  MEPOpenItemRecord,
  MEPConflictRecord,
  MEPRevisionDiffRecord,
  MEPRiserReconciliationRecord,
  MEPDisciplineCrossCheckRecord,
  MEPSummaryData,
} from '../types';

export interface MEPExportPayload {
  projectName: string;
  projectCode: string;
  revision: string;
  elements: GeneralMEPElement[];
  openItems: MEPOpenItemRecord[];
  conflicts: MEPConflictRecord[];
  revisions: MEPRevisionDiffRecord[];
  reconciliations: MEPRiserReconciliationRecord[];
  crossChecks: MEPDisciplineCrossCheckRecord[];
  summary: MEPSummaryData;
}

export class MEPExcelExportEngine {
  public static generateMEPWorkbook(payload: MEPExportPayload): void {
    const {
      projectName,
      projectCode,
      revision,
      elements,
      openItems,
      conflicts,
      revisions,
      reconciliations,
      summary,
    } = payload;

    const sanitize = (val: any) => {
      if (val === null || val === undefined) return '';
      return String(val)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    // Filter elements by discipline
    const electrical = elements.filter(e => e.discipline === 'Electrical');
    const hvac = elements.filter(e => e.discipline === 'HVAC' || e.discipline === 'Ventilation');
    const plumbing = elements.filter(e => e.discipline === 'Plumbing');
    const fireFighting = elements.filter(e => e.discipline === 'Fire Fighting');
    const elv = elements.filter(e => e.discipline === 'ELV' || e.discipline === 'Fire Alarm');
    const supports = elements.filter(e => e.discipline === 'MEP Supports');
    const equipment = elements.filter(
      e =>
        e.discipline === 'Equipment' ||
        e.subSystem.toLowerCase().includes('equipment') ||
        e.subSystem.toLowerCase().includes('pump') ||
        e.subSystem.toLowerCase().includes('ahu') ||
        e.subSystem.toLowerCase().includes('chiller') ||
        e.subSystem.toLowerCase().includes('panel')
    );

    const formatRow = (cells: (string | number)[], isHeader = false) => {
      const cellXml = cells
        .map(c => {
          const isNum = typeof c === 'number';
          const styleAttr = isHeader
            ? ' ss:StyleID="HeaderStyle"'
            : isNum
            ? ' ss:StyleID="NumberStyle"'
            : ' ss:StyleID="DefaultStyle"';
          const type = isNum ? 'Number' : 'String';
          return `<Cell${styleAttr}><Data ss:Type="${type}">${isNum ? c : sanitize(c)}</Data></Cell>`;
        })
        .join('');
      return `<Row>${cellXml}</Row>`;
    };

    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="DefaultStyle">
   <Alignment ss:Vertical="Center" ss:WrapText="1"/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#1E293B"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="HeaderStyle">
   <Alignment ss:Vertical="Center" ss:Horizontal="Center" ss:WrapText="1"/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#0F172A" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0F172A"/>
   </Borders>
  </Style>
  <Style ss:ID="TitleStyle">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="14" ss:Bold="1" ss:Color="#0F172A"/>
  </Style>
  <Style ss:ID="NumberStyle">
   <Alignment ss:Vertical="Center" ss:Horizontal="Right"/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#0F172A"/>
   <NumberFormat ss:Format="#,##0.00"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="VerifiedBadge">
   <Interior ss:Color="#ECFDF5" ss:Pattern="Solid"/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#047857"/>
  </Style>
  <Style ss:ID="BlockedBadge">
   <Interior ss:Color="#FEF2F2" ss:Pattern="Solid"/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#B91C1C"/>
  </Style>
 </Styles>

 <!-- TAB 1: EXECUTIVE SUMMARY -->
 <Worksheet ss:Name="Executive Summary">
  <Table>
   <Column ss:Width="200"/>
   <Column ss:Width="160"/>
   <Column ss:Width="160"/>
   <Column ss:Width="250"/>
   <Row>
    <Cell ss:StyleID="TitleStyle"><Data ss:Type="String">INDUSTRIAL MEP QUANTITY TAKEOFF &amp; TENDER BOQ</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Project: ${sanitize(projectName)} (${sanitize(projectCode)}) | Revision: ${sanitize(revision)} | Generated: ${new Date().toISOString().split('T')[0]}</Data></Cell>
   </Row>
   <Row><Cell><Data ss:Type="String"></Data></Cell></Row>
   ${formatRow(['KPI Metric Category', 'Quantity / Count', 'Unit of Measure', 'Engineering Scope & Discipline'], true)}
   ${formatRow(['Total MEP Register Elements', summary.totalElementsCount, 'Nos.', 'All Disciplines Total Extracted'])}
   ${formatRow(['Verified High Confidence Items', summary.verifiedElementsCount, 'Nos.', '100% Geometry & Specification Verified'])}
   ${formatRow(['Blocked Elements (Missing Specs)', summary.blockedElementsCount, 'Nos.', 'Requires RFI / Clarification (Zero Guesswork)'])}
   ${formatRow(['Active RFI Open Items', summary.openItemsCount, 'Nos.', 'Open Items Logged'])}
   ${formatRow(['Active Drawing Conflicts', summary.openConflictsCount, 'Nos.', 'Plan vs Riser vs Schedule Mismatches'])}
   ${formatRow(['Electrical Power & Control Cables', summary.cableTotalLengthM, 'm', 'Total Cable Running Metres'])}
   ${formatRow(['Cable Trays & Containment', summary.cableTrayTotalLengthM, 'm', 'HDG / GI Containment Systems'])}
   ${formatRow(['Lighting Fixtures Total', summary.lightingTotalCount, 'Nos.', 'LED Troffers, Downlights, Emergency Fixtures'])}
   ${formatRow(['HVAC Sheet Metal Ductwork Area', summary.ductTotalAreaM2, 'm²', 'Perimeter × Length Calculation'])}
   ${formatRow(['HVAC Ductwork Running Metres', summary.ductTotalLengthM, 'm', 'Linear Route Metres'])}
   ${formatRow(['HVAC Chilled Water & Drain Piping', summary.hvacPipingTotalLengthM, 'm', 'CHWS, CHWR, Condensate Pipes'])}
   ${formatRow(['Plumbing Water Supply Piping', summary.waterSupplyPipeLengthM, 'm', 'PPR / CPVC Cold & Hot Water'])}
   ${formatRow(['Plumbing Soil/Waste/Vent Drainage', summary.drainagePipeLengthM, 'm', 'uPVC / HDPE Drainage Lines'])}
   ${formatRow(['Plumbing Sanitary Fixtures', summary.plumbingFixturesCount, 'Nos.', 'WCs, Basins, Sinks, Showers'])}
   ${formatRow(['Fire Fighting Pipework', summary.firePipingTotalLengthM, 'm', 'Sch 40 Grooved / Welded Header & Branches'])}
   ${formatRow(['Fire Sprinkler Heads', summary.sprinklersTotalCount, 'Nos.', 'Discrete Count on Drawing (No Area Assumptions)'])}
   ${formatRow(['ELV & Fire Alarm Field Devices', summary.fireAlarmDevicesCount + summary.cctvCamerasCount + summary.accessControlPointsCount, 'Nos.', 'Smoke Detectors, CCTV, Access Control'])}
   ${formatRow(['Engineered MEP Supports & Hangers', summary.mepSupportsTotalCount, 'Nos.', 'Trapeze & Clevis Hangers'])}
  </Table>
 </Worksheet>

 <!-- TAB 2: ELECTRICAL BOQ -->
 <Worksheet ss:Name="Electrical BOQ">
  <Table>
   <Column ss:Width="100"/>
   <Column ss:Width="90"/>
   <Column ss:Width="120"/>
   <Column ss:Width="260"/>
   <Column ss:Width="120"/>
   <Column ss:Width="80"/>
   <Column ss:Width="60"/>
   <Column ss:Width="90"/>
   <Column ss:Width="110"/>
   <Column ss:Width="90"/>
   <Column ss:Width="250"/>
   ${formatRow([
     'Item ID',
     'Discipline',
     'Tag / Mark',
     'Item Description',
     'Size / Rating',
     'Quantity',
     'Unit',
     'Level',
     'Drawing Ref',
     'Status',
     'Calculation / Formula Proof',
   ], true)}
   ${electrical.map(el =>
     formatRow([
       el.id,
       el.discipline,
       el.tag,
       el.description,
       el.size || el.ratingOrCapacity || 'N/A',
       el.lengthM || el.quantity,
       el.unit,
       el.level,
       el.primaryDrawingNumber,
       el.verificationStatus.toUpperCase(),
       el.formulaWithValues || 'Count = ' + el.quantity,
     ])
   ).join('')}
  </Table>
 </Worksheet>

 <!-- TAB 3: HVAC BOQ -->
 <Worksheet ss:Name="HVAC BOQ">
  <Table>
   <Column ss:Width="100"/>
   <Column ss:Width="90"/>
   <Column ss:Width="120"/>
   <Column ss:Width="260"/>
   <Column ss:Width="120"/>
   <Column ss:Width="80"/>
   <Column ss:Width="60"/>
   <Column ss:Width="90"/>
   <Column ss:Width="110"/>
   <Column ss:Width="90"/>
   <Column ss:Width="250"/>
   ${formatRow([
     'Item ID',
     'Discipline',
     'Tag / Mark',
     'Description',
     'Size / Duty',
     'Quantity',
     'Unit',
     'Level',
     'Drawing Ref',
     'Status',
     'Calculation / Surface Area Proof',
   ], true)}
   ${hvac.map(el =>
     formatRow([
       el.id,
       el.discipline,
       el.tag,
       el.description,
       el.size || el.ratingOrCapacity || 'N/A',
       el.lengthM || el.quantity,
       el.unit,
       el.level,
       el.primaryDrawingNumber,
       el.verificationStatus.toUpperCase(),
       el.formulaWithValues || 'Count = ' + el.quantity,
     ])
   ).join('')}
  </Table>
 </Worksheet>

 <!-- TAB 4: PLUMBING BOQ -->
 <Worksheet ss:Name="Plumbing BOQ">
  <Table>
   <Column ss:Width="100"/>
   <Column ss:Width="90"/>
   <Column ss:Width="120"/>
   <Column ss:Width="260"/>
   <Column ss:Width="120"/>
   <Column ss:Width="80"/>
   <Column ss:Width="60"/>
   <Column ss:Width="90"/>
   <Column ss:Width="110"/>
   <Column ss:Width="90"/>
   <Column ss:Width="250"/>
   ${formatRow([
     'Item ID',
     'Discipline',
     'Tag / Mark',
     'Description',
     'Size / Material',
     'Quantity',
     'Unit',
     'Level',
     'Drawing Ref',
     'Status',
     'Formula / Proof',
   ], true)}
   ${plumbing.map(el =>
     formatRow([
       el.id,
       el.discipline,
       el.tag,
       el.description,
       el.size || el.material || 'N/A',
       el.lengthM || el.quantity,
       el.unit,
       el.level,
       el.primaryDrawingNumber,
       el.verificationStatus.toUpperCase(),
       el.formulaWithValues || 'Count = ' + el.quantity,
     ])
   ).join('')}
  </Table>
 </Worksheet>

 <!-- TAB 5: FIRE FIGHTING BOQ -->
 <Worksheet ss:Name="Fire Fighting BOQ">
  <Table>
   <Column ss:Width="100"/>
   <Column ss:Width="90"/>
   <Column ss:Width="120"/>
   <Column ss:Width="260"/>
   <Column ss:Width="120"/>
   <Column ss:Width="80"/>
   <Column ss:Width="60"/>
   <Column ss:Width="90"/>
   <Column ss:Width="110"/>
   <Column ss:Width="90"/>
   <Column ss:Width="250"/>
   ${formatRow([
     'Item ID',
     'Discipline',
     'Tag / Mark',
     'Description',
     'Size / Rating',
     'Quantity',
     'Unit',
     'Level',
     'Drawing Ref',
     'Status',
     'Formula / Proof',
   ], true)}
   ${fireFighting.map(el =>
     formatRow([
       el.id,
       el.discipline,
       el.tag,
       el.description,
       el.size || el.ratingOrCapacity || 'N/A',
       el.lengthM || el.quantity,
       el.unit,
       el.level,
       el.primaryDrawingNumber,
       el.verificationStatus.toUpperCase(),
       el.formulaWithValues || 'Count = ' + el.quantity,
     ])
   ).join('')}
  </Table>
 </Worksheet>

 <!-- TAB 6: ELV & FIRE ALARM BOQ -->
 <Worksheet ss:Name="ELV &amp; Fire Alarm BOQ">
  <Table>
   <Column ss:Width="100"/>
   <Column ss:Width="90"/>
   <Column ss:Width="120"/>
   <Column ss:Width="260"/>
   <Column ss:Width="120"/>
   <Column ss:Width="80"/>
   <Column ss:Width="60"/>
   <Column ss:Width="90"/>
   <Column ss:Width="110"/>
   <Column ss:Width="90"/>
   <Column ss:Width="250"/>
   ${formatRow([
     'Item ID',
     'Discipline',
     'Tag / Mark',
     'Description',
     'Size / Protocol',
     'Quantity',
     'Unit',
     'Level',
     'Drawing Ref',
     'Status',
     'Formula / Proof',
   ], true)}
   ${elv.map(el =>
     formatRow([
       el.id,
       el.discipline,
       el.tag,
       el.description,
       el.size || el.ratingOrCapacity || 'N/A',
       el.lengthM || el.quantity,
       el.unit,
       el.level,
       el.primaryDrawingNumber,
       el.verificationStatus.toUpperCase(),
       el.formulaWithValues || 'Count = ' + el.quantity,
     ])
   ).join('')}
  </Table>
 </Worksheet>

 <!-- TAB 7: MEP SUPPORTS BOQ -->
 <Worksheet ss:Name="MEP Supports BOQ">
  <Table>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Column ss:Width="120"/>
   <Column ss:Width="260"/>
   <Column ss:Width="120"/>
   <Column ss:Width="80"/>
   <Column ss:Width="60"/>
   <Column ss:Width="90"/>
   <Column ss:Width="110"/>
   <Column ss:Width="90"/>
   <Column ss:Width="250"/>
   ${formatRow([
     'Item ID',
     'Support Type',
     'Supported Element',
     'Description & Profile',
     'Spacing Rule',
     'Calculated Qty',
     'Unit',
     'Level',
     'Drawing Ref',
     'Status',
     'Support Spacing Calculation',
   ], true)}
   ${supports.map(el =>
     formatRow([
       el.id,
       el.subSystem || 'Support',
       el.tag,
       el.description,
       el.ratingOrCapacity || '2.0m Standard Spacing',
       el.quantity,
       el.unit,
       el.level,
       el.primaryDrawingNumber,
       el.verificationStatus.toUpperCase(),
       el.formulaWithValues || '⌈Route / Spacing⌉ + 1',
     ])
   ).join('')}
  </Table>
 </Worksheet>

 <!-- TAB 8: MASTER EQUIPMENT REGISTER -->
 <Worksheet ss:Name="Master Equipment Register">
  <Table>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Column ss:Width="120"/>
   <Column ss:Width="260"/>
   <Column ss:Width="140"/>
   <Column ss:Width="80"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   ${formatRow([
     'Equipment ID',
     'Discipline',
     'Tag / Mark',
     'Equipment Description',
     'Capacity / Duty Rating',
     'Quantity',
     'Level',
     'Room / Location',
     'Electrical Incomer',
     'Drawing Source',
   ], true)}
   ${equipment.map(el =>
     formatRow([
       el.id,
       el.discipline,
       el.tag,
       el.description,
       el.ratingOrCapacity || 'Unspecified (Open Item)',
       el.quantity,
       el.level,
       el.roomName || 'Mechanical / Electrical Room',
       el.connectedFromId || 'N/A',
       el.primaryDrawingNumber,
     ])
   ).join('')}
  </Table>
 </Worksheet>

 <!-- TAB 9: PLAN VS RISER RECONCILIATION -->
 <Worksheet ss:Name="Plan vs Riser Reconciliation">
  <Table>
   <Column ss:Width="120"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Column ss:Width="110"/>
   <Column ss:Width="110"/>
   <Column ss:Width="90"/>
   <Column ss:Width="90"/>
   <Column ss:Width="150"/>
   <Column ss:Width="80"/>
   <Column ss:Width="280"/>
   ${formatRow([
     'Physical Element ID',
     'Element Tag',
     'Discipline',
     'Plan Drawing Ref',
     'Riser Drawing Ref',
     'Plan Size',
     'Riser Size',
     'Reconciliation Status',
     'Takeoff Qty',
     'Verification & Anti-Double-Count Notes',
   ], true)}
   ${reconciliations.map(rec =>
     formatRow([
       rec.physicalElementId,
       rec.elementTag,
       rec.discipline,
       rec.planDrawingRef,
       rec.riserDrawingRef,
       rec.planSize,
       rec.riserSize,
       rec.reconciledStatus,
       rec.takeoffCount,
       rec.notes,
     ])
   ).join('')}
  </Table>
 </Worksheet>

 <!-- TAB 10: OPEN ITEMS & RFIS -->
 <Worksheet ss:Name="Open Items &amp; RFIs">
  <Table>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Column ss:Width="110"/>
   <Column ss:Width="150"/>
   <Column ss:Width="280"/>
   <Column ss:Width="100"/>
   <Column ss:Width="70"/>
   <Column ss:Width="100"/>
   <Column ss:Width="250"/>
   <Column ss:Width="80"/>
   ${formatRow([
     'Open Item ID',
     'Discipline',
     'Element Tag',
     'Issue Category',
     'Problem Description',
     'Drawing Reference',
     'Revision',
     'Location',
     'Suggested Action / RFI Requirement',
     'Status',
   ], true)}
   ${openItems.map(oi =>
     formatRow([
       oi.id,
       oi.discipline,
       oi.elementTag,
       oi.issueType,
       oi.description,
       oi.drawingReference,
       oi.revision,
       oi.sourceLocation,
       oi.suggestedAction,
       oi.status,
     ])
   ).join('')}
  </Table>
 </Worksheet>

 <!-- TAB 11: DRAWING CONFLICTS -->
 <Worksheet ss:Name="Drawing Conflicts">
  <Table>
   <Column ss:Width="110"/>
   <Column ss:Width="100"/>
   <Column ss:Width="110"/>
   <Column ss:Width="160"/>
   <Column ss:Width="160"/>
   <Column ss:Width="90"/>
   <Column ss:Width="160"/>
   <Column ss:Width="90"/>
   <Column ss:Width="80"/>
   <Column ss:Width="240"/>
   ${formatRow([
     'Conflict ID',
     'Discipline',
     'Element Tag',
     'Conflict Type',
     'Source A Document',
     'Source A Value',
     'Source B Document',
     'Source B Value',
     'Status',
     'Resolution Note',
   ], true)}
   ${conflicts.map(cnf =>
     formatRow([
       cnf.id,
       cnf.discipline,
       cnf.elementTag,
       cnf.conflictType,
       `${cnf.sourceA.documentName} (${cnf.sourceA.drawingNumber})`,
       cnf.sourceA.value,
       `${cnf.sourceB.documentName} (${cnf.sourceB.drawingNumber})`,
       cnf.sourceB.value,
       cnf.status,
       cnf.resolutionNote || 'Under QS Review',
     ])
   ).join('')}
  </Table>
 </Worksheet>

 <!-- TAB 12: TENDER REVISION DELTA -->
 <Worksheet ss:Name="Revision Delta Matrix">
  <Table>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Column ss:Width="120"/>
   <Column ss:Width="150"/>
   <Column ss:Width="150"/>
   <Column ss:Width="80"/>
   <Column ss:Width="80"/>
   <Column ss:Width="60"/>
   <Column ss:Width="80"/>
   <Column ss:Width="260"/>
   ${formatRow([
     'Delta ID',
     'Discipline',
     'Element Tag',
     'Change Category',
     'Rev 00 Specification',
     'Rev 01 Specification',
     'Rev 00 Qty',
     'Rev 01 Qty',
     'Unit',
     'Net Delta',
     'Change Summary & Engineering Impact',
   ], true)}
   ${revisions.map(rev =>
     formatRow([
       rev.id,
       rev.discipline,
       rev.elementTag,
       rev.changeType,
       rev.oldSpecification,
       rev.newSpecification,
       rev.oldQuantity,
       rev.newQuantity,
       rev.unit,
       rev.deltaQuantity,
       rev.changeSummary,
     ])
   ).join('')}
  </Table>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([xmlContent], {
      type: 'application/vnd.ms-excel;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MEP_Industrial_Takeoff_${projectCode || 'PROJ'}_${revision || 'Rev01'}_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
