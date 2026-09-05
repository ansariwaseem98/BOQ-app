/**
 * Phase 18A: Analysis Storage & Persistence Service
 * IndexedDB + localStorage fallback persistence for Drawing Analysis Master Records,
 * element verifications, user corrections, open items, and audit trails.
 */

import {
  DrawingAnalysisMasterRecord,
  ExtractedElementRecord,
  AnalysisOpenItem,
  AnalysisConflictRecord,
  AnalysisAuditRecord,
  ElementGeometryRecord
} from '../types/phase18AnalysisTypes';
import * as XLSX from 'xlsx';

const ANALYSIS_DB_NAME = 'ai_boq_phase18_analysis_db_v1';
const DB_VERSION = 1;
const STORE_NAME = 'drawing_analysis_records';
const LOCAL_STORAGE_PREFIX = 'ai_boq_phase18_analysis_';

function openAnalysisDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB unavailable.'));
      return;
    }

    const req = window.indexedDB.open(ANALYSIS_DB_NAME, DB_VERSION);

    req.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'documentId' });
        store.createIndex('projectId', 'projectId', { unique: false });
        store.createIndex('status', 'status', { unique: false });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const Phase18AnalysisStorage = {
  /**
   * Save or update an entire Drawing Analysis Master Record
   */
  async saveAnalysisRecord(record: DrawingAnalysisMasterRecord): Promise<void> {
    record.lastUpdatedAt = new Date().toISOString();

    // Recalculate summary totals
    record.summary = {
      pagesAnalyzed: record.pages.filter((p) => p.analysisStatus === 'ANALYZED').length,
      dimensionsDetected: record.dimensions.length,
      elementsDetected: record.elements.length,
      openItemsCount: record.openItems.filter((oi) => oi.status === 'OPEN' || oi.status === 'IN_REVIEW').length,
      conflictsCount: record.conflicts.filter((c) => c.status === 'UNRESOLVED').length,
      verifiedCount: record.elements.filter((e) => e.status === 'VERIFIED').length,
      reviewRequiredCount: record.elements.filter((e) => e.status === 'REVIEW REQUIRED').length
    };

    try {
      const db = await openAnalysisDB();
      const tx = db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      await new Promise((resolve, reject) => {
        const req = store.put(record);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('IndexedDB save failed, using localStorage fallback:', err);
      try {
        localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${record.documentId}`, JSON.stringify(record));
      } catch (localErr) {
        console.warn('LocalStorage save failed:', localErr);
      }
    }
  },

  /**
   * Retrieve Drawing Analysis Master Record for a document
   */
  async getAnalysisRecord(documentId: string): Promise<DrawingAnalysisMasterRecord | null> {
    if (!documentId) return null;

    try {
      const db = await openAnalysisDB();
      const tx = db.transaction([STORE_NAME], 'readonly');
      const store = tx.objectStore(STORE_NAME);

      const record: DrawingAnalysisMasterRecord | null = await new Promise((resolve, reject) => {
        const req = store.get(documentId);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });

      if (record) return record;
    } catch (err) {
      console.warn('IndexedDB read failed, checking localStorage fallback:', err);
    }

    try {
      const raw = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${documentId}`);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('LocalStorage read error:', e);
    }

    return null;
  },

  /**
   * Human Correction: Apply user-provided value to an element and log audit trail
   */
  async recordUserCorrection(
    documentId: string,
    elementId: string,
    correctedGeometry: Partial<ElementGeometryRecord>,
    userNote: string,
    userName: string = 'Estimator Engineer'
  ): Promise<DrawingAnalysisMasterRecord | null> {
    const record = await this.getAnalysisRecord(documentId);
    if (!record) return null;

    const el = record.elements.find((e) => e.id === elementId);
    if (!el) return null;

    const now = new Date().toISOString();
    const previousGeometryStr = JSON.stringify(el.userCorrectedGeometry || el.aiExtractedGeometry);

    // Merge correction
    const baseGeom = el.userCorrectedGeometry || el.aiExtractedGeometry;
    el.userCorrectedGeometry = {
      ...baseGeom,
      ...correctedGeometry,
      count: correctedGeometry.count ?? baseGeom.count ?? 1,
      unit: correctedGeometry.unit || baseGeom.unit || 'm',
      source: {
        ...baseGeom.source,
        snippetDescription: `User Corrected: ${userNote || 'Manual Engineer Input'}`
      }
    };

    el.status = 'USER CORRECTED';
    el.userNote = userNote;
    el.userCorrectionTime = now;

    // Log Audit Trail (Never delete previous value)
    const auditEntry: AnalysisAuditRecord = {
      id: `AUD-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      projectId: record.projectId,
      drawingId: documentId,
      timestamp: now,
      actor: 'HUMAN_ENGINEER',
      actionType: 'VALUE_CORRECTED',
      targetEntity: 'ELEMENT',
      targetId: elementId,
      previousValue: previousGeometryStr,
      newValue: JSON.stringify(el.userCorrectedGeometry),
      note: `Correction applied by ${userName}: ${userNote}`
    };

    record.auditTrail.unshift(auditEntry);
    await this.saveAnalysisRecord(record);
    return record;
  },

  /**
   * Human Verification: Verify element measurement once supported and conflict-free
   */
  async verifyElement(
    documentId: string,
    elementId: string,
    verifiedBy: string = 'Lead Estimator'
  ): Promise<{ success: boolean; message?: string; record?: DrawingAnalysisMasterRecord }> {
    const record = await this.getAnalysisRecord(documentId);
    if (!record) return { success: false, message: 'Drawing record not found.' };

    const el = record.elements.find((e) => e.id === elementId);
    if (!el) return { success: false, message: 'Element not found in drawing.' };

    // Check conflict constraint: Cannot verify if unresolved conflicts exist
    const unresolvedConflicts = record.conflicts.filter(
      (c) => c.elementId === elementId && c.status === 'UNRESOLVED'
    );
    if (unresolvedConflicts.length > 0) {
      return {
        success: false,
        message: `Cannot verify: ${unresolvedConflicts.length} unresolved conflict(s) pending for this element.`
      };
    }

    const now = new Date().toISOString();
    el.finalVerifiedGeometry = el.userCorrectedGeometry || el.aiExtractedGeometry;
    el.status = 'VERIFIED';
    el.verifiedBy = verifiedBy;
    el.verificationTime = now;

    // Audit Trail
    record.auditTrail.unshift({
      id: `AUD-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      projectId: record.projectId,
      drawingId: documentId,
      timestamp: now,
      actor: 'HUMAN_ENGINEER',
      actionType: 'ELEMENT_VERIFIED',
      targetEntity: 'ELEMENT',
      targetId: elementId,
      newValue: JSON.stringify(el.finalVerifiedGeometry),
      note: `Element verified by ${verifiedBy}`
    });

    await this.saveAnalysisRecord(record);
    return { success: true, record };
  },

  /**
   * Resolve an Open Item (Clarification / Missing value provided)
   */
  async resolveOpenItem(
    documentId: string,
    openItemId: string,
    resolvedValue: string,
    resolutionNote: string,
    userName: string = 'Estimator Engineer'
  ): Promise<DrawingAnalysisMasterRecord | null> {
    const record = await this.getAnalysisRecord(documentId);
    if (!record) return null;

    const item = record.openItems.find((oi) => oi.id === openItemId);
    if (!item) return null;

    const now = new Date().toISOString();
    item.status = 'RESOLVED';
    item.resolvedValue = resolvedValue;
    item.resolutionNote = resolutionNote;
    item.resolvedBy = userName;
    item.resolvedAt = now;

    // If linked to an element, update element's openItem list
    if (item.elementId) {
      const el = record.elements.find((e) => e.id === item.elementId);
      if (el) {
        if (el.status === 'REVIEW REQUIRED') {
          // Check if any other open items remain
          const remaining = record.openItems.filter(
            (oi) => oi.elementId === item.elementId && oi.status !== 'RESOLVED' && oi.id !== openItemId
          );
          if (remaining.length === 0) {
            el.status = 'DETECTED';
          }
        }
      }
    }

    record.auditTrail.unshift({
      id: `AUD-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      projectId: record.projectId,
      drawingId: documentId,
      timestamp: now,
      actor: 'HUMAN_ENGINEER',
      actionType: 'OPEN_ITEM_RESOLVED',
      targetEntity: 'OPEN_ITEM',
      targetId: openItemId,
      newValue: resolvedValue,
      note: `Open Item resolved by ${userName}: ${resolutionNote}`
    });

    await this.saveAnalysisRecord(record);
    return record;
  },

  /**
   * Resolve a Conflict Record (Source A vs Source B)
   */
  async resolveConflict(
    documentId: string,
    conflictId: string,
    resolutionType: 'USE_SOURCE_A' | 'USE_SOURCE_B' | 'CUSTOM_VALUE',
    customValue?: string,
    note?: string,
    userName: string = 'Estimator Engineer'
  ): Promise<DrawingAnalysisMasterRecord | null> {
    const record = await this.getAnalysisRecord(documentId);
    if (!record) return null;

    const conflict = record.conflicts.find((c) => c.id === conflictId);
    if (!conflict) return null;

    const now = new Date().toISOString();
    let finalChosen = '';
    if (resolutionType === 'USE_SOURCE_A') {
      conflict.status = 'RESOLVED_USE_SOURCE_A';
      finalChosen = conflict.valueA;
    } else if (resolutionType === 'USE_SOURCE_B') {
      conflict.status = 'RESOLVED_USE_SOURCE_B';
      finalChosen = conflict.valueB;
    } else {
      conflict.status = 'RESOLVED_CUSTOM_VALUE';
      finalChosen = customValue || '';
    }

    conflict.resolvedValue = finalChosen;
    conflict.resolutionDecision = resolutionType;
    conflict.resolutionNote = note || '';
    conflict.resolvedBy = userName;
    conflict.resolvedAt = now;

    record.auditTrail.unshift({
      id: `AUD-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      projectId: record.projectId,
      drawingId: documentId,
      timestamp: now,
      actor: 'HUMAN_ENGINEER',
      actionType: 'CONFLICT_RESOLVED',
      targetEntity: 'CONFLICT',
      targetId: conflictId,
      newValue: `${resolutionType} -> ${finalChosen}`,
      note: `Conflict resolved by ${userName}: ${note || ''}`
    });

    await this.saveAnalysisRecord(record);
    return record;
  },

  /**
   * Export Drawing Analysis data as JSON
   */
  exportAnalysisJson(record: DrawingAnalysisMasterRecord): void {
    const jsonStr = JSON.stringify(record, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Analysis_${record.drawingNumber || record.documentId}_${record.revision}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Export Analysis Data as formatted Excel spreadsheet
   */
  exportAnalysisExcel(record: DrawingAnalysisMasterRecord): void {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Summary & Metadata
    const summaryData = [
      ['DRAWING ANALYSIS & MEASUREMENT EXTRACTION REPORT (Phase 18A)'],
      [`Generated on ${new Date().toLocaleString()}`],
      [],
      ['Drawing Number', record.drawingNumber || '-'],
      ['Drawing Title', record.drawingTitle || '-'],
      ['Revision', record.revision],
      ['Current Revision', record.isCurrentRevision ? 'YES' : 'NO (SUPERSEDED)'],
      ['Discipline', record.metadata.discipline],
      ['Scale', record.metadata.scale],
      ['Analysis Status', record.status],
      ['Source File', record.sourceFileName],
      [],
      ['ANALYSIS SUMMARY TOTALS'],
      ['Pages Analyzed', record.summary.pagesAnalyzed],
      ['Dimensions Detected', record.summary.dimensionsDetected],
      ['Elements Detected', record.summary.elementsDetected],
      ['Verified Elements', record.summary.verifiedCount],
      ['Review Required Elements', record.summary.reviewRequiredCount],
      ['Open Items Pending', record.summary.openItemsCount],
      ['Conflicts Pending', record.summary.conflictsCount]
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    // Sheet 2: Elements Register
    const elementHeaders = [
      'Element ID',
      'Type',
      'Mark',
      'Level',
      'Grid Location',
      'AI Length (m)',
      'AI Width (m)',
      'AI Depth/Height (m)',
      'AI Count',
      'User Corrected Geometry',
      'Verified Geometry',
      'Material',
      'Status',
      'Confidence',
      'Source Drawing & Region',
      'User Note'
    ];
    const elementRows = record.elements.map((el) => [
      el.id,
      el.elementType,
      el.mark,
      el.level,
      el.gridLocation,
      el.aiExtractedGeometry.length ?? '-',
      el.aiExtractedGeometry.width ?? '-',
      el.aiExtractedGeometry.depth ?? el.aiExtractedGeometry.height ?? '-',
      el.aiExtractedGeometry.count,
      el.userCorrectedGeometry ? JSON.stringify(el.userCorrectedGeometry) : '-',
      el.finalVerifiedGeometry ? JSON.stringify(el.finalVerifiedGeometry) : '-',
      el.material,
      el.status,
      el.confidence,
      el.sourceReferences.map((s) => `${s.drawingNumber} p.${s.pageNumber} [${s.region.x.toFixed(1)}%,${s.region.y.toFixed(1)}%]`).join('; '),
      el.userNote || '-'
    ]);
    const wsElements = XLSX.utils.aoa_to_sheet([elementHeaders, ...elementRows]);
    XLSX.utils.book_append_sheet(wb, wsElements, 'Elements Register');

    // Sheet 3: Dimensions
    const dimHeaders = [
      'Dimension ID',
      'Original Text',
      'Numeric Value',
      'Source Unit',
      'Normalized (m)',
      'Normalized (mm)',
      'Unit Ambiguous',
      'Page',
      'Status',
      'Confidence',
      'Region'
    ];
    const dimRows = record.dimensions.map((d) => [
      d.id,
      d.originalText,
      d.numericValue,
      d.sourceUnit,
      d.normalizedValueMeters,
      d.normalizedValueMm,
      d.isUnitAmbiguous ? 'YES' : 'NO',
      d.pageNumber,
      d.status,
      d.confidence,
      `x:${d.region.x.toFixed(1)}%, y:${d.region.y.toFixed(1)}%, w:${d.region.width.toFixed(1)}%, h:${d.region.height.toFixed(1)}%`
    ]);
    const wsDimensions = XLSX.utils.aoa_to_sheet([dimHeaders, ...dimRows]);
    XLSX.utils.book_append_sheet(wb, wsDimensions, 'Dimensions');

    // Sheet 4: Open Items
    const oiHeaders = [
      'Open Item ID',
      'Category',
      'Problem Description',
      'Required Information',
      'Status',
      'Resolved Value',
      'Resolved By',
      'Resolution Note',
      'Page',
      'Drawing'
    ];
    const oiRows = record.openItems.map((oi) => [
      oi.id,
      oi.category,
      oi.problem,
      oi.requiredInformation,
      oi.status,
      oi.resolvedValue || '-',
      oi.resolvedBy || '-',
      oi.resolutionNote || '-',
      oi.pageNumber,
      oi.drawingNumber
    ]);
    const wsOpenItems = XLSX.utils.aoa_to_sheet([oiHeaders, ...oiRows]);
    XLSX.utils.book_append_sheet(wb, wsOpenItems, 'Open Items');

    // Sheet 5: Conflicts
    const conflictHeaders = [
      'Conflict ID',
      'Element / Mark',
      'Conflict Type',
      'Description',
      'Source A Value',
      'Source B Value',
      'Status',
      'Resolution Decision',
      'Resolved Value',
      'Resolved By',
      'Resolution Note'
    ];
    const conflictRows = record.conflicts.map((c) => [
      c.id,
      c.elementMark || c.elementId || '-',
      c.conflictType,
      c.description,
      `${c.sourceA.drawingNumber} (${c.valueA})`,
      `${c.sourceB.drawingNumber} (${c.valueB})`,
      c.status,
      c.resolutionDecision || '-',
      c.resolvedValue || '-',
      c.resolvedBy || '-',
      c.resolutionNote || '-'
    ]);
    const wsConflicts = XLSX.utils.aoa_to_sheet([conflictHeaders, ...conflictRows]);
    XLSX.utils.book_append_sheet(wb, wsConflicts, 'Conflicts');

    // Sheet 6: Audit Trail
    const auditHeaders = ['Timestamp', 'Actor', 'Action', 'Target Entity', 'Target ID', 'Previous Value', 'New Value', 'Note'];
    const auditRows = record.auditTrail.map((a) => [
      a.timestamp,
      a.actor,
      a.actionType,
      a.targetEntity,
      a.targetId,
      a.previousValue || '-',
      a.newValue || '-',
      a.note || '-'
    ]);
    const wsAudit = XLSX.utils.aoa_to_sheet([auditHeaders, ...auditRows]);
    XLSX.utils.book_append_sheet(wb, wsAudit, 'Audit Trail');

    XLSX.writeFile(wb, `Drawing_Analysis_${record.drawingNumber || record.documentId}_${record.revision}.xlsx`);
  }
};
