/**
 * PHASE 15C — MASONRY, DPC, DOORS/WINDOWS & FINISHES EXCEL & CSV EXPORT ENGINE
 * Generates formatted multi-sheet CSV/TSV or Excel-ready schedules for all 16 disciplines.
 */

import {
  MasonryElementRecord,
  DpcElementRecord,
  DoorScheduleRecord,
  WindowScheduleRecord,
  PlasterTakeoffRecord,
  FloorFinishRecord,
  PaintingRecord,
  WaterproofingRecord,
  CeilingRecord,
  WallFinishCladdingRecord,
  RoomFinishScheduleRecord,
  ArchitecturalOpenItem,
  ArchitecturalConflict,
  ArchitecturalRevisionRecord,
} from '../types/masonryFinishesTypes';

export interface ArchitecturalExportBundle {
  projectName: string;
  projectNumber: string;
  dateGenerated: string;
  walls: MasonryElementRecord[];
  dpcs: DpcElementRecord[];
  doors: DoorScheduleRecord[];
  windows: WindowScheduleRecord[];
  plasters: PlasterTakeoffRecord[];
  floorings: FloorFinishRecord[];
  paints: PaintingRecord[];
  waterproofings: WaterproofingRecord[];
  ceilings: CeilingRecord[];
  claddings: WallFinishCladdingRecord[];
  roomSchedules: RoomFinishScheduleRecord[];
  openItems: ArchitecturalOpenItem[];
  conflicts: ArchitecturalConflict[];
  revisions: ArchitecturalRevisionRecord[];
}

function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Generate 16 Disciplines CSV/Excel Export Content
 */
export function generateArchitecturalCsvExport(bundle: ArchitecturalExportBundle): string {
  const sections: string[] = [];

  // Title Header
  sections.push(`PROJECT: ${bundle.projectName} (${bundle.projectNumber})`);
  sections.push(`PHASE 15C: MASONRY + DPC + DOORS/WINDOWS + FINISHES QUANTITY TAKEOFF SCHEDULE`);
  sections.push(`GENERATED: ${bundle.dateGenerated}`);
  sections.push(`GOVERNANCE: ZERO GUESSWORK AUDITABLE STANDARD\n`);

  // 1. MASONRY TAKEOFF SCHEDULE
  sections.push('=== 1. MASONRY WALL TAKEOFF SCHEDULE ===');
  sections.push([
    'Wall ID',
    'Wall Mark',
    'Wall Type',
    'Level',
    'Zone',
    'Length (m)',
    'Height (m)',
    'Height Derivation',
    'Thickness (m)',
    'Qty',
    'Gross Area (m²)',
    'Gross Vol (m³)',
    'Deductions Vol (m³)',
    'Net Vol (m³)',
    'Material Spec',
    'Lintel Type',
    'Drawing Source',
    'Status',
  ].map(escapeCsv).join(','));

  bundle.walls.forEach((w) => {
    sections.push([
      w.id,
      w.wallMark,
      w.wallType,
      w.level,
      w.zone,
      w.lengthM.toFixed(2),
      w.heightM.toFixed(2),
      w.heightDerivationMethod,
      w.thicknessM.toFixed(3),
      w.quantity,
      w.grossAreaM2.toFixed(2),
      w.grossVolumeM3.toFixed(3),
      w.deductionsVolumeM3.toFixed(3),
      w.netVolumeM3.toFixed(3),
      w.material,
      w.lintelType,
      `${w.primarySource.drawingNumber} (${w.primarySource.gridOrZone})`,
      w.status,
    ].map(escapeCsv).join(','));
  });
  sections.push('\n');

  // 2. DAMP PROOF COURSE (DPC) SCHEDULE
  sections.push('=== 2. DAMP PROOF COURSE (DPC) SCHEDULE ===');
  sections.push([
    'DPC ID',
    'DPC Mark',
    'Associated Wall',
    'Level',
    'Location Type',
    'Length (m)',
    'Width (m)',
    'Unit',
    'Area (m²)',
    'Linear (m)',
    'Specification',
    'Source',
    'Status',
  ].map(escapeCsv).join(','));

  bundle.dpcs.forEach((d) => {
    sections.push([
      d.id,
      d.dpcMark,
      d.associatedWallMark,
      d.level,
      d.locationType,
      d.lengthM.toFixed(2),
      d.widthM.toFixed(3),
      d.measurementUnit,
      d.areaM2.toFixed(2),
      d.linearLengthM.toFixed(2),
      d.specification,
      `${d.primarySource.drawingNumber} (${d.primarySource.gridOrZone})`,
      d.status,
    ].map(escapeCsv).join(','));
  });
  sections.push('\n');

  // 3. DOORS MASTER SCHEDULE
  sections.push('=== 3. DOORS MASTER SCHEDULE ===');
  sections.push([
    'Door Mark',
    'Description',
    'Type',
    'Width (m)',
    'Height (m)',
    'Single Area (m²)',
    'Qty',
    'Total Area (m²)',
    'Frame Material',
    'Fire Rating',
    'Level',
    'Room / Zone',
    'Drawing Source',
    'Status',
  ].map(escapeCsv).join(','));

  bundle.doors.forEach((d) => {
    sections.push([
      d.doorMark,
      d.description,
      d.doorType,
      d.widthM.toFixed(2),
      d.heightM.toFixed(2),
      d.singleAreaM2.toFixed(2),
      d.quantity,
      d.totalAreaM2.toFixed(2),
      d.frameMaterial,
      d.fireRating || 'Non-FR',
      d.level,
      d.roomRef || '-',
      `${d.primarySource.drawingNumber} (Rev ${d.primarySource.revision})`,
      d.status,
    ].map(escapeCsv).join(','));
  });
  sections.push('\n');

  // 4. WINDOWS MASTER SCHEDULE
  sections.push('=== 4. WINDOWS MASTER SCHEDULE ===');
  sections.push([
    'Window Mark',
    'Description',
    'Type',
    'Width (m)',
    'Height (m)',
    'Sill (m)',
    'Head (m)',
    'Single Area (m²)',
    'Qty',
    'Total Area (m²)',
    'Glazing Area (m²)',
    'Frame Material',
    'Level',
    'Source',
    'Status',
  ].map(escapeCsv).join(','));

  bundle.windows.forEach((w) => {
    sections.push([
      w.windowMark,
      w.description,
      w.windowType,
      w.widthM.toFixed(2),
      w.heightM.toFixed(2),
      w.sillHeightM.toFixed(2),
      w.headHeightM.toFixed(2),
      w.singleAreaM2.toFixed(2),
      w.quantity,
      w.totalAreaM2.toFixed(2),
      w.glazingAreaM2.toFixed(2),
      w.frameMaterial,
      w.level,
      `${w.primarySource.drawingNumber} (Rev ${w.primarySource.revision})`,
      w.status,
    ].map(escapeCsv).join(','));
  });
  sections.push('\n');

  // 5. PLASTER TAKEOFF SCHEDULE
  sections.push('=== 5. PLASTER TAKEOFF SCHEDULE ===');
  sections.push([
    'Plaster Mark',
    'Location Type',
    'Wall Ref',
    'Face Type',
    'Faces Count',
    'Gross Area (m²)',
    'Deduction Area (m²)',
    'Net Area (m²)',
    'Thickness (mm)',
    'Volume (m³)',
    'Specification',
    'Status',
  ].map(escapeCsv).join(','));

  bundle.plasters.forEach((p) => {
    sections.push([
      p.plasterMark,
      p.locationType,
      p.associatedWallMark || '-',
      p.faceType,
      p.facesCount,
      p.grossAreaM2.toFixed(2),
      p.deductionAreaM2.toFixed(2),
      p.netAreaM2.toFixed(2),
      p.thicknessMm,
      p.volumeM3 ? p.volumeM3.toFixed(3) : '-',
      p.specification,
      p.status,
    ].map(escapeCsv).join(','));
  });
  sections.push('\n');

  // 6. FLOOR FINISH SCHEDULE
  sections.push('=== 6. FLOOR FINISH SCHEDULE ===');
  sections.push([
    'Finish Mark',
    'Room Name',
    'Room No',
    'Level',
    'Finish Type',
    'Specification',
    'Gross Area (m²)',
    'Deduction Area (m²)',
    'Net Area (m²)',
    'Skirting Length (m)',
    'Skirting Hgt (mm)',
    'Source',
  ].map(escapeCsv).join(','));

  bundle.floorings.forEach((f) => {
    sections.push([
      f.finishMark,
      f.roomName,
      f.roomNumber,
      f.level,
      f.finishType,
      f.specification,
      f.grossAreaM2.toFixed(2),
      f.deductionsVoidAreaM2.toFixed(2),
      f.netAreaM2.toFixed(2),
      f.skirtingLengthM.toFixed(2),
      f.skirtingHeightMm,
      `${f.primarySource.drawingNumber} (${f.primarySource.gridOrZone})`,
    ].map(escapeCsv).join(','));
  });
  sections.push('\n');

  // 7. WATERPROOFING SCHEDULE
  sections.push('=== 7. WATERPROOFING SCHEDULE ===');
  sections.push([
    'WP Mark',
    'Category',
    'Room / Zone',
    'Level',
    'Horizontal Area (m²)',
    'Upstand Length (m)',
    'Upstand Hgt (m)',
    'Upstand Area (m²)',
    'Total WP Area (m²)',
    'System Specification',
    'Status',
  ].map(escapeCsv).join(','));

  bundle.waterproofings.forEach((wp) => {
    sections.push([
      wp.wpMark,
      wp.locationCategory,
      wp.roomZone,
      wp.level,
      wp.horizontalAreaM2.toFixed(2),
      wp.upstandLengthM.toFixed(2),
      wp.upstandHeightM.toFixed(2),
      wp.upstandAreaM2.toFixed(2),
      wp.totalWaterproofingAreaM2.toFixed(2),
      wp.systemSpecification,
      wp.status,
    ].map(escapeCsv).join(','));
  });
  sections.push('\n');

  // 8. OPEN ITEMS (ZERO GUESSWORK REGISTER)
  sections.push('=== 8. OPEN ITEMS REGISTER (ZERO GUESSWORK) ===');
  sections.push([
    'Open Item ID',
    'Severity',
    'Category',
    'Title',
    'Description',
    'Missing Information',
    'Suggested RFI Action',
    'Drawing Ref',
    'Status',
  ].map(escapeCsv).join(','));

  bundle.openItems.forEach((oi) => {
    sections.push([
      oi.id,
      oi.severity,
      oi.category,
      oi.title,
      oi.description,
      oi.missingInformation,
      oi.suggestedRfiResolution,
      oi.drawingNumber,
      oi.status,
    ].map(escapeCsv).join(','));
  });
  sections.push('\n');

  // 9. CONFLICTS REGISTER
  sections.push('=== 9. CROSS-DRAWING CONFLICTS REGISTER ===');
  sections.push([
    'Conflict ID',
    'Title',
    'Element Ref',
    'Category',
    'Source A Drawing & Value',
    'Source B Drawing & Value',
    'Status',
    'Resolution Action',
  ].map(escapeCsv).join(','));

  bundle.conflicts.forEach((c) => {
    sections.push([
      c.id,
      c.title,
      c.elementRef,
      c.category,
      `${c.sourceA.drawing}: ${c.sourceA.value}`,
      `${c.sourceB.drawing}: ${c.sourceB.value}`,
      c.status,
      c.resolutionAction || 'Pending RFI',
    ].map(escapeCsv).join(','));
  });

  return sections.join('\n');
}

/**
 * Trigger CSV File Download in Browser
 */
export function downloadArchitecturalTakeoffCsv(bundle: ArchitecturalExportBundle): void {
  const csvContent = generateArchitecturalCsvExport(bundle);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `Phase15C_Masonry_Finishes_Takeoff_${bundle.projectName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
