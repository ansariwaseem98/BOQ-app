/**
 * Professional Multi-Tab Excel Workbook Generator
 * Powered by Phase 11 ProfessionalExcelExportEngine
 */

import {
  ProjectData,
  DrawingRecord,
  BoqItem,
  DetectedElement,
  BbsBarRecord,
  OpenItem,
  AssumptionRecord,
  RevisionComparison,
  UnifiedBoqItem,
  ExcelExportType,
  ExcelExportMode,
} from '../types';
import { ProfessionalExcelExportEngine, MasterExportPayload } from './professionalExcelExportEngine';

export interface ExportDataPayload {
  projectData: ProjectData | null;
  drawings: DrawingRecord[];
  boqItems: BoqItem[] | UnifiedBoqItem[];
  elements: DetectedElement[];
  bbsRecords: BbsBarRecord[];
  openItems: OpenItem[];
  conflicts?: any[];
  assumptions?: AssumptionRecord[];
  exclusions?: any[];
  revisions: RevisionComparison[];
  exportType?: ExcelExportType;
  exportMode?: ExcelExportMode;
}

export function exportProjectToExcel(payload: ExportDataPayload): void {
  const masterPayload: MasterExportPayload = {
    projectData: payload.projectData,
    drawings: payload.drawings,
    boqItems: payload.boqItems,
    elements: payload.elements,
    bbsRecords: payload.bbsRecords,
    openItems: payload.openItems,
    conflicts: payload.conflicts || [],
    assumptions: payload.assumptions || [],
    exclusions: payload.exclusions || [],
    revisions: payload.revisions,
    exportType: payload.exportType || 'TENDER_PACKAGE',
    exportMode: payload.exportMode || 'FINAL',
  };

  ProfessionalExcelExportEngine.executeDownload(masterPayload);
}

export const exportComprehensiveTenderWorkbook = exportProjectToExcel;
export { ProfessionalExcelExportEngine };
