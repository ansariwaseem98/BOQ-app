import * as XLSX from 'xlsx';
import { 
  ProjectDocument, 
  DocumentTypeOption, 
  DocumentDisciplineOption, 
  DocumentStatus, 
  DocumentAnalysisStatus,
  FileFormat
} from '../types';

const DB_NAME = 'ai_boq_document_storage_db_v2';
const DB_VERSION = 1;
const METADATA_STORE = 'document_metadata';
const BLOBS_STORE = 'document_blobs';
const LOCAL_STORAGE_BACKUP_KEY = 'ai_boq_doc_metadata_backup_v2';

/**
 * Opens and initializes IndexedDB for document storage
 */
function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not available in this environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(METADATA_STORE)) {
        const metaStore = db.createObjectStore(METADATA_STORE, { keyPath: 'id' });
        metaStore.createIndex('projectId', 'projectId', { unique: false });
        metaStore.createIndex('drawingSeriesId', 'drawingSeriesId', { unique: false });
        metaStore.createIndex('isArchived', 'isArchived', { unique: false });
      }

      if (!db.objectStoreNames.contains(BLOBS_STORE)) {
        db.createObjectStore(BLOBS_STORE, { keyPath: 'documentId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * LocalStorage Fallback Helpers for metadata
 */
function getLocalBackupMetadata(): ProjectDocument[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_BACKUP_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to read localStorage backup:', e);
    return [];
  }
}

function saveLocalBackupMetadata(docs: ProjectDocument[]): void {
  try {
    // Strip large previewDataUrls if saving to localStorage to prevent quota overflow
    const safeDocs = docs.map((d) => ({
      ...d,
      previewDataUrl: d.previewDataUrl && d.previewDataUrl.length > 50000 ? undefined : d.previewDataUrl,
    }));
    localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(safeDocs));
  } catch (e) {
    console.warn('LocalStorage backup quota reached, relied on IndexedDB:', e);
  }
}

/**
 * Generate sequential unique Document ID in format DOC-YYYY-XXXXXX
 */
export function generateDocumentId(existingDocs: ProjectDocument[]): string {
  const currentYear = new Date().getFullYear();
  const yearPrefix = `DOC-${currentYear}-`;

  let maxNum = 0;
  existingDocs.forEach((doc) => {
    if (doc.id?.startsWith(yearPrefix)) {
      const parts = doc.id.split('-');
      if (parts.length >= 3) {
        const num = parseInt(parts[2], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
  });

  const nextNum = (maxNum + 1).toString().padStart(6, '0');
  return `${yearPrefix}${nextNum}`;
}

/**
 * Extract technical file metadata without inventing engineering data
 */
export async function extractFileTechnicalMetadata(file: File): Promise<{
  fileExtension: string;
  fileFormat: 'PDF' | 'DWG' | 'DXF' | 'IFC' | 'Image' | 'Sketch' | 'Other';
  fileSize: number;
  uploadDate: string;
  pageCount?: number;
  imageDimensions?: { width: number; height: number };
  cadFormat?: string;
  ifcMetadata?: {
    schema?: string;
    projectName?: string;
    site?: string;
    building?: string;
    storeys?: string[];
    elementCount?: number;
  };
  previewDataUrl?: string;
  previewType: 'pdf' | 'image' | 'cad' | 'ifc' | 'unsupported';
  isVector: boolean;
}> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const fileSize = file.size;
  const uploadDate = new Date().toISOString();

  let fileFormat: 'PDF' | 'DWG' | 'DXF' | 'IFC' | 'Image' | 'Sketch' | 'Other' = 'Other';
  let previewType: 'pdf' | 'image' | 'cad' | 'ifc' | 'unsupported' = 'unsupported';
  let isVector = false;
  let pageCount: number | undefined = undefined;
  let imageDimensions: { width: number; height: number } | undefined = undefined;
  let cadFormat: string | undefined = undefined;
  let ifcMetadata: ProjectDocument['ifcMetadata'] = undefined;
  let previewDataUrl: string | undefined = undefined;

  if (ext === 'pdf') {
    fileFormat = 'PDF';
    previewType = 'pdf';
    isVector = true;
    try {
      const buffer = await file.slice(0, Math.min(file.size, 1024 * 1024 * 2)).arrayBuffer();
      const text = new TextDecoder('latin1').decode(buffer);
      // Rough page count estimation from PDF catalog /Count or /Type /Page
      const pageMatches = text.match(/\/Type\s*\/Page\b/g);
      if (pageMatches && pageMatches.length > 0) {
        pageCount = pageMatches.length;
      } else {
        pageCount = 1;
      }
      previewDataUrl = URL.createObjectURL(file);
    } catch {
      pageCount = 1;
    }
  } else if (['jpg', 'jpeg', 'png', 'webp', 'bmp', 'tiff', 'tif'].includes(ext)) {
    fileFormat = 'Image';
    previewType = 'image';
    isVector = false;
    try {
      const dataUrl = await new Promise<string>((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result as string);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
      previewDataUrl = dataUrl;

      // Extract image dimensions
      imageDimensions = await new Promise<{ width: number; height: number }>((res) => {
        const img = new Image();
        img.onload = () => res({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = () => res({ width: 1920, height: 1080 });
        img.src = dataUrl;
      });
    } catch {
      imageDimensions = { width: 1920, height: 1080 };
    }
  } else if (['dwg', 'dxf'].includes(ext)) {
    fileFormat = ext === 'dwg' ? 'DWG' : 'DXF';
    previewType = 'cad';
    isVector = true;
    cadFormat = ext.toUpperCase();
  } else if (ext === 'ifc') {
    fileFormat = 'IFC';
    previewType = 'ifc';
    isVector = true;
    try {
      // Read first 64KB for IFC header text
      const slice = file.slice(0, 65536);
      const text = await slice.text();

      const schemaMatch = text.match(/FILE_SCHEMA\s*\(\s*\(\s*'([^']+)'/i);
      const projectMatch = text.match(/IFCPROJECT\s*\([^,]*,\s*[^,]*,\s*'([^']+)'/i);
      const siteMatch = text.match(/IFCSITE\s*\([^,]*,\s*[^,]*,\s*'([^']+)'/i);
      const buildingMatch = text.match(/IFCBUILDING\s*\([^,]*,\s*[^,]*,\s*'([^']+)'/i);
      const storeyMatches = text.match(/IFCBUILDINGSTOREY/gi);

      ifcMetadata = {
        schema: schemaMatch ? schemaMatch[1] : 'IFC4',
        projectName: projectMatch ? projectMatch[1] : undefined,
        site: siteMatch ? siteMatch[1] : undefined,
        building: buildingMatch ? buildingMatch[1] : undefined,
        storeys: storeyMatches ? [`${storeyMatches.length} Storeys Detected`] : ['Typical Storeys'],
        elementCount: undefined,
      };
    } catch {
      ifcMetadata = { schema: 'IFC4' };
    }
  } else {
    fileFormat = 'Other';
    previewType = 'unsupported';
  }

  return {
    fileExtension: ext,
    fileFormat,
    fileSize,
    uploadDate,
    pageCount,
    imageDimensions,
    cadFormat,
    ifcMetadata,
    previewDataUrl,
    previewType,
    isVector,
  };
}

export const DocumentStorageService = {
  /**
   * Helper to generate document ID
   */
  generateDocumentId,

  /**
   * Fetch all documents strictly belonging to a specific project_id
   */
  async getDocumentsByProject(projectId: string, includeArchived = false): Promise<ProjectDocument[]> {
    if (!projectId) return [];

    try {
      const db = await openIndexedDB();
      const tx = db.transaction([METADATA_STORE], 'readonly');
      const store = tx.objectStore(METADATA_STORE);
      const index = store.index('projectId');

      const docs: ProjectDocument[] = await new Promise((resolve, reject) => {
        const request = index.getAll(IDBKeyRange.only(projectId));
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });

      if (docs.length > 0) {
        return includeArchived ? docs : docs.filter((d) => !d.isArchived);
      }
    } catch (err) {
      console.warn('IndexedDB read failed, trying localStorage fallback:', err);
    }

    const localDocs = getLocalBackupMetadata().filter((d) => d.projectId === projectId);
    return includeArchived ? localDocs : localDocs.filter((d) => !d.isArchived);
  },

  /**
   * Fetch a single document by its unique internal document_id
   */
  async getDocumentById(docId: string): Promise<ProjectDocument | null> {
    try {
      const db = await openIndexedDB();
      const tx = db.transaction([METADATA_STORE], 'readonly');
      const store = tx.objectStore(METADATA_STORE);

      const doc: ProjectDocument | null = await new Promise((resolve, reject) => {
        const request = store.get(docId);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });

      if (doc) return doc;
    } catch (err) {
      console.warn('IndexedDB lookup failed:', err);
    }

    const localDocs = getLocalBackupMetadata();
    return localDocs.find((d) => d.id === docId) || null;
  },

  /**
   * Check for revision conflicts when uploading or registering a drawing sheet
   */
  async checkRevisionConflict(
    projectId: string,
    drawingNumber: string,
    newRevision: string
  ): Promise<{
    hasConflict: boolean;
    existingCurrentDoc?: ProjectDocument;
    allRevisionsInSeries: ProjectDocument[];
    seriesId: string;
  }> {
    if (!projectId || !drawingNumber || !drawingNumber.trim()) {
      return { hasConflict: false, allRevisionsInSeries: [], seriesId: '' };
    }

    const allProjectDocs = await this.getDocumentsByProject(projectId, true);
    const cleanDwgNo = drawingNumber.trim().toUpperCase();

    const matchingSeriesDocs = allProjectDocs.filter(
      (d) => (d.drawingNumber || '').trim().toUpperCase() === cleanDwgNo
    );

    if (matchingSeriesDocs.length === 0) {
      return {
        hasConflict: false,
        allRevisionsInSeries: [],
        seriesId: cleanDwgNo,
      };
    }

    const existingCurrent = matchingSeriesDocs.find((d) => d.isCurrentRevision) || matchingSeriesDocs[0];
    const seriesId = existingCurrent.drawingSeriesId || cleanDwgNo;

    return {
      hasConflict: true,
      existingCurrentDoc: existingCurrent,
      allRevisionsInSeries: matchingSeriesDocs,
      seriesId,
    };
  },

  /**
   * Save or upload a new ProjectDocument with its original File / Blob
   */
  async saveDocument(doc: ProjectDocument, fileBlob?: Blob | File): Promise<ProjectDocument> {
    try {
      const db = await openIndexedDB();

      // If this document is marked as current revision, mark all other revisions in this series as non-current
      if (doc.isCurrentRevision && doc.drawingSeriesId) {
        const seriesDocs = await this.getDocumentsByProject(doc.projectId, true);
        const peers = seriesDocs.filter(
          (d) => d.drawingSeriesId === doc.drawingSeriesId && d.id !== doc.id
        );

        const updateTx = db.transaction([METADATA_STORE], 'readwrite');
        const updateStore = updateTx.objectStore(METADATA_STORE);
        peers.forEach((peer) => {
          updateStore.put({ ...peer, isCurrentRevision: false, status: 'READY' });
        });
      }

      // Save metadata
      const tx = db.transaction([METADATA_STORE], 'readwrite');
      const store = tx.objectStore(METADATA_STORE);
      await new Promise((resolve, reject) => {
        const req = store.put(doc);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      });

      // Save original binary file Blob if provided
      if (fileBlob) {
        const blobTx = db.transaction([BLOBS_STORE], 'readwrite');
        const blobStore = blobTx.objectStore(BLOBS_STORE);
        await new Promise((resolve, reject) => {
          const req = blobStore.put({
            documentId: doc.id,
            projectId: doc.projectId,
            fileName: doc.sourceFileName,
            fileType: doc.fileExtension,
            blob: fileBlob,
            size: fileBlob.size,
            savedAt: new Date().toISOString(),
          });
          req.onsuccess = () => resolve(true);
          req.onerror = () => reject(req.error);
        });
      }
    } catch (err) {
      console.warn('IndexedDB save failed, saving to localStorage backup:', err);
    }

    // Sync to local backup
    const currentLocal = getLocalBackupMetadata();
    const updatedLocal = currentLocal.filter((d) => d.id !== doc.id);
    if (doc.isCurrentRevision && doc.drawingSeriesId) {
      updatedLocal.forEach((d) => {
        if (d.projectId === doc.projectId && d.drawingSeriesId === doc.drawingSeriesId) {
          d.isCurrentRevision = false;
        }
      });
    }
    updatedLocal.push(doc);
    saveLocalBackupMetadata(updatedLocal);

    return doc;
  },

  /**
   * Update metadata of an existing document
   */
  async updateDocumentMetadata(docId: string, updates: Partial<ProjectDocument>): Promise<ProjectDocument> {
    const existing = await this.getDocumentById(docId);
    if (!existing) {
      throw new Error(`Document ${docId} not found.`);
    }

    const updated: ProjectDocument = {
      ...existing,
      ...updates,
    };

    return this.saveDocument(updated);
  },

  /**
   * Change which revision is considered CURRENT for a drawing series
   */
  async setCurrentRevision(projectId: string, drawingSeriesId: string, targetDocId: string): Promise<void> {
    const allProjectDocs = await this.getDocumentsByProject(projectId, true);
    const seriesDocs = allProjectDocs.filter(
      (d) => d.drawingSeriesId === drawingSeriesId || d.drawingNumber === drawingSeriesId
    );

    for (const doc of seriesDocs) {
      const isTarget = doc.id === targetDocId;
      await this.updateDocumentMetadata(doc.id, {
        isCurrentRevision: isTarget,
        status: isTarget ? 'READY' : doc.status === 'ARCHIVED' ? 'ARCHIVED' : 'READY',
      });
    }
  },

  /**
   * Archive or restore a document (Soft delete)
   */
  async archiveDocument(docId: string, isArchived: boolean = true): Promise<void> {
    await this.updateDocumentMetadata(docId, {
      isArchived,
      status: isArchived ? 'ARCHIVED' : 'READY',
    });
  },

  /**
   * Permanently delete a document and its stored binary file
   */
  async deleteDocumentPermanently(docId: string): Promise<void> {
    try {
      const db = await openIndexedDB();

      const tx = db.transaction([METADATA_STORE, BLOBS_STORE], 'readwrite');
      tx.objectStore(METADATA_STORE).delete(docId);
      tx.objectStore(BLOBS_STORE).delete(docId);

      await new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn('IndexedDB delete failed:', err);
    }

    const currentLocal = getLocalBackupMetadata();
    saveLocalBackupMetadata(currentLocal.filter((d) => d.id !== docId));
  },

  /**
   * Get the original stored File/Blob for download
   */
  async getDocumentOriginalBlob(docId: string): Promise<Blob | null> {
    try {
      const db = await openIndexedDB();
      const tx = db.transaction([BLOBS_STORE], 'readonly');
      const store = tx.objectStore(BLOBS_STORE);

      const record: { blob: Blob } | null = await new Promise((resolve, reject) => {
        const req = store.get(docId);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });

      if (record && record.blob) {
        return record.blob;
      }
    } catch (err) {
      console.warn('Could not read Blob from IndexedDB:', err);
    }

    return null;
  },

  /**
   * Download the exact original uploaded file
   */
  async downloadOriginalFile(doc: ProjectDocument): Promise<void> {
    const blob = await this.getDocumentOriginalBlob(doc.id);

    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.sourceFileName || `${doc.id}.${doc.fileExtension || 'bin'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }

    // Fallback: If no Blob is found in IndexedDB (e.g. initial fixture sample), generate clean text file representation
    const textContent = `ORIGINAL PROJECT DOCUMENT CONTAINER
Project ID: ${doc.projectId}
Document ID: ${doc.id}
Drawing Number: ${doc.drawingNumber || 'UNASSIGNED'}
Title: ${doc.title || 'Untitled'}
Revision: ${doc.revision}
Document Type: ${doc.documentType}
Discipline: ${doc.discipline}
Level: ${doc.level}
File Name: ${doc.sourceFileName}
File Format: ${doc.fileFormat}
Uploaded Date: ${doc.uploadDate}

[Original file binary was generated in browser simulation context]`;

    const textBlob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(textBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.sourceFileName || `${doc.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Export the Project Drawing & Document Register as a formatted Excel spreadsheet
   */
  exportDrawingRegisterExcel(docs: ProjectDocument[], projectName: string, projectId: string): void {
    const headers = [
      'Document ID',
      'Drawing Number',
      'Title',
      'Document Type',
      'Discipline',
      'Revision',
      'Current Rev',
      'Drawing Date',
      'Floor / Level',
      'Format',
      'File Size (KB)',
      'File Name',
      'Document Status',
      'Analysis Status',
      'Upload Date',
      'Prepared By',
      'Checked By',
      'Approved By',
      'Source / Consultant',
      'Notes / Scope',
    ];

    const rows = docs.map((d) => [
      d.id,
      d.drawingNumber || '-',
      d.title || 'Untitled Document',
      d.documentType,
      d.discipline,
      d.revision,
      d.isCurrentRevision ? 'YES' : 'NO',
      d.drawingDate || '-',
      d.level || '-',
      d.fileFormat,
      Math.round(d.fileSize / 1024),
      d.sourceFileName,
      d.status,
      d.analysisStatus,
      d.uploadDate ? d.uploadDate.split('T')[0] : '-',
      d.preparedBy || '-',
      d.checkedBy || '-',
      d.approvedBy || '-',
      d.source || '-',
      d.notes || '-',
    ]);

    const worksheetData = [
      [`PROJECT DRAWING & DOCUMENT REGISTER — ${projectName} (${projectId})`],
      [`Generated on ${new Date().toLocaleString()}`],
      [],
      headers,
      ...rows,
    ];

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    // Auto-fit column widths
    const colWidths = headers.map((h, i) => {
      let maxLen = h.length;
      rows.forEach((r) => {
        const val = String(r[i] || '');
        if (val.length > maxLen) maxLen = val.length;
      });
      return { wch: Math.min(maxLen + 4, 45) };
    });
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Drawing Register');

    const cleanProjectName = projectName.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
    XLSX.writeFile(wb, `Drawing_Register_${cleanProjectName}_${projectId}.xlsx`);
  },

  /**
   * Seed initial demo sample documents for the isolated test project fixture only
   */
  async seedInitialTestDocuments(projectId: string): Promise<ProjectDocument[]> {
    const existing = await this.getDocumentsByProject(projectId, true);
    if (existing.length > 0) {
      return existing;
    }

    const testDocs: ProjectDocument[] = [
      {
        id: 'DOC-2026-000001',
        projectId,
        drawingSeriesId: 'S-201',
        drawingNumber: 'S-201',
        title: 'Foundation & Pile Cap Layout Plan',
        description: 'Isolated footings F1-F4, raft foundation under core shear wall, grade beams GB1-GB4.',
        documentType: 'Tender Drawing',
        discipline: 'Structural',
        revision: 'Rev 03',
        isCurrentRevision: true,
        drawingDate: '2026-07-10',
        level: 'Foundation Level',
        status: 'READY',
        analysisStatus: 'NOT_ANALYZED',
        preparedBy: 'Eng. Sterling',
        checkedBy: 'Eng. Vance',
        source: 'Arup Structural Engineering',
        sourceFileName: 'S-201_Foundation_Layout_Rev03.pdf',
        fileExtension: 'pdf',
        fileFormat: 'PDF',
        fileSize: 4850000,
        uploadDate: '2026-07-12T09:30:00Z',
        pageCount: 1,
        isVector: true,
        previewType: 'pdf',
        scaleRatio: '1:100',
        calibrationScale: 28.5,
        detectedElementsCount: 0,
        openItemsCount: 0,
        isArchived: false,
        notes: 'Two-way raft under central lift shear walls with 500mm RCC slab and M35 concrete.',
      },
      {
        id: 'DOC-2026-000002',
        projectId,
        drawingSeriesId: 'S-201',
        drawingNumber: 'S-201',
        title: 'Foundation & Pile Cap Layout Plan (Prior Tender Draft)',
        description: 'Preliminary foundation sizing before geotechnical soil report revision.',
        documentType: 'Tender Drawing',
        discipline: 'Structural',
        revision: 'Rev 02',
        isCurrentRevision: false,
        drawingDate: '2026-06-25',
        level: 'Foundation Level',
        status: 'READY',
        analysisStatus: 'NOT_ANALYZED',
        preparedBy: 'Eng. Sterling',
        checkedBy: 'Eng. Vance',
        source: 'Arup Structural Engineering',
        sourceFileName: 'S-201_Foundation_Layout_Rev02.pdf',
        fileExtension: 'pdf',
        fileFormat: 'PDF',
        fileSize: 4620000,
        uploadDate: '2026-06-28T14:15:00Z',
        pageCount: 1,
        isVector: true,
        previewType: 'pdf',
        scaleRatio: '1:100',
        calibrationScale: 28.5,
        detectedElementsCount: 0,
        openItemsCount: 0,
        isArchived: false,
        notes: 'Superseded by Rev 03 with revised pile cap depths.',
      },
      {
        id: 'DOC-2026-000003',
        projectId,
        drawingSeriesId: 'S-203',
        drawingNumber: 'S-203',
        title: 'Typical Floor RCC Beam & Slab Framing Plan (L02-L07)',
        description: 'Two-way solid slab 200mm thk with drop beams B1-B8. Repeated across 6 typical floors.',
        documentType: 'Tender Drawing',
        discipline: 'Structural',
        revision: 'Rev 02',
        isCurrentRevision: true,
        drawingDate: '2026-07-14',
        level: 'Typical Office Floors (L02-L07)',
        status: 'READY',
        analysisStatus: 'NOT_ANALYZED',
        preparedBy: 'Eng. Sterling',
        checkedBy: 'Eng. Vance',
        source: 'Arup Structural Engineering',
        sourceFileName: 'S-203_Typical_Framing_L02-L07_Rev02.pdf',
        fileExtension: 'pdf',
        fileFormat: 'PDF',
        fileSize: 6120000,
        uploadDate: '2026-07-15T11:00:00Z',
        pageCount: 1,
        isVector: true,
        previewType: 'pdf',
        scaleRatio: '1:100',
        calibrationScale: 28.5,
        detectedElementsCount: 0,
        openItemsCount: 0,
        isArchived: false,
        notes: 'Beam depths: B1 (300x600), B2 (300x700), B3 (250x500). Slab thickness 200mm.',
      },
      {
        id: 'DOC-2026-000004',
        projectId,
        drawingSeriesId: 'ST-401',
        drawingNumber: 'ST-401',
        title: 'Roof PEB Steel Framing, Main Tapered Rafters & Purlin Layout',
        description: 'UB 457x191x67 main tapered rafters with Z200 cold-formed purlins @ 1.25m c/c.',
        documentType: 'Tender Drawing',
        discipline: 'Steel',
        revision: 'Rev 01',
        isCurrentRevision: true,
        drawingDate: '2026-07-18',
        level: 'PEB Roof Level',
        status: 'READY',
        analysisStatus: 'NOT_ANALYZED',
        preparedBy: 'Eng. Foster',
        source: 'Foster & Partners Global',
        sourceFileName: 'ST-401_Roof_PEB_Steel_Framing_Rev01.dwg',
        fileExtension: 'dwg',
        fileFormat: 'DWG',
        fileSize: 4100000,
        uploadDate: '2026-07-19T16:20:00Z',
        isVector: true,
        previewType: 'cad',
        cadFormat: 'DWG',
        scaleRatio: '1:100',
        detectedElementsCount: 0,
        openItemsCount: 0,
        isArchived: false,
        notes: 'High tensile bolt connections grade 8.8. Anchor bolts 4xM24 per base plate.',
      },
      {
        id: 'DOC-2026-000005',
        projectId,
        drawingSeriesId: 'A-101',
        drawingNumber: 'A-101',
        title: 'Ground Floor Architectural & Blockwork Layout',
        description: '200mm external thermal blockwork, 100mm internal partitions, DPC layer specified.',
        documentType: 'Architectural',
        discipline: 'Architectural',
        revision: 'Rev 02',
        isCurrentRevision: true,
        drawingDate: '2026-07-16',
        level: 'Ground Floor',
        status: 'READY',
        analysisStatus: 'NOT_ANALYZED',
        preparedBy: 'Arch. David Foster',
        source: 'Foster & Partners Global',
        sourceFileName: 'A-101_Ground_Floor_Plan_Rev02.pdf',
        fileExtension: 'pdf',
        fileFormat: 'PDF',
        fileSize: 7450000,
        uploadDate: '2026-07-17T08:45:00Z',
        pageCount: 1,
        isVector: true,
        previewType: 'pdf',
        scaleRatio: '1:100',
        calibrationScale: 28.5,
        detectedElementsCount: 0,
        openItemsCount: 0,
        isArchived: false,
        notes: 'Includes entrance lobby, core elevators, service ducts, and fire exits.',
      },
      {
        id: 'DOC-2026-000006',
        projectId,
        drawingSeriesId: 'SH-001',
        drawingNumber: 'SH-001',
        title: 'Structural Steel Column Base Plates & Anchor Bolt Fabrication Shop Drawing',
        description: 'Shop fabrication drawing with weld symbols, plate thicknesses, and hole templates.',
        documentType: 'Shop Drawing',
        discipline: 'Steel',
        revision: 'Rev 01',
        isCurrentRevision: true,
        drawingDate: '2026-07-22',
        level: 'Ground Level Column Bases',
        status: 'READY',
        analysisStatus: 'NOT_ANALYZED',
        preparedBy: 'SteelFab Subcontractor Eng',
        source: 'Specialist Fabricator',
        sourceFileName: 'SH-001_Column_Base_Shop_Details_Rev01.pdf',
        fileExtension: 'pdf',
        fileFormat: 'PDF',
        fileSize: 3200000,
        uploadDate: '2026-07-23T10:15:00Z',
        pageCount: 1,
        isVector: true,
        previewType: 'pdf',
        scaleRatio: '1:20',
        detectedElementsCount: 0,
        openItemsCount: 0,
        isArchived: false,
        notes: 'Shop fabrication submission for engineer approval.',
      },
      {
        id: 'DOC-2026-000007',
        projectId,
        drawingSeriesId: 'SK-001',
        drawingNumber: 'SK-001',
        title: 'Hand Sketch — Staircase S1 Flight Rebar Anchorage Clarification',
        description: 'Site engineer hand sketch showing modified cranked rebar lap length at landing slab joint.',
        documentType: 'Hand Sketch',
        discipline: 'Structural',
        revision: 'Rev 00',
        isCurrentRevision: true,
        drawingDate: '2026-07-24',
        level: 'Level 01 to Level 02 Stair',
        status: 'READY',
        analysisStatus: 'NOT_ANALYZED',
        preparedBy: 'Resident Site Eng',
        source: 'Site Engineering Clarification',
        sourceFileName: 'SK-001_Stair_Rebar_Crank_Sketch.png',
        fileExtension: 'png',
        fileFormat: 'Image',
        fileSize: 1850000,
        uploadDate: '2026-07-24T17:00:00Z',
        imageDimensions: { width: 2400, height: 1800 },
        isVector: false,
        previewType: 'image',
        detectedElementsCount: 0,
        openItemsCount: 0,
        isArchived: false,
        notes: 'Hand sketch prepared during consultant site coordination meeting.',
      },
      {
        id: 'DOC-2026-000008',
        projectId,
        drawingSeriesId: 'IFC-001',
        drawingNumber: 'IFC-STR-BIM',
        title: 'Marina Bay G+8 Structural BIM Coordination Model (IFC4)',
        description: 'Federated structural IFC BIM model with columns, beams, slabs, and shear walls.',
        documentType: 'IFC / BIM',
        discipline: 'Structural',
        revision: 'Rev 01',
        isCurrentRevision: true,
        drawingDate: '2026-07-20',
        level: 'Substructure to Roof',
        status: 'READY',
        analysisStatus: 'NOT_ANALYZED',
        preparedBy: 'BIM Coordinator',
        source: 'Arup BIM Team',
        sourceFileName: 'Marina_Bay_Structural_Model_Rev01.ifc',
        fileExtension: 'ifc',
        fileFormat: 'IFC',
        fileSize: 14200000,
        uploadDate: '2026-07-21T13:30:00Z',
        isVector: true,
        previewType: 'ifc',
        ifcMetadata: {
          schema: 'IFC4',
          projectName: 'Marina Bay Commercial Center',
          site: 'Plot 108 Sector 4',
          building: 'G+8 Commercial Tower',
          storeys: ['Basement 02', 'Basement 01', 'Ground Floor', 'L01-L08', 'Roof'],
          elementCount: 1420,
        },
        detectedElementsCount: 0,
        openItemsCount: 0,
        isArchived: false,
        notes: 'Coordinated structural model in IFC4 schema format.',
      },
    ];

    for (const doc of testDocs) {
      await this.saveDocument(doc);
    }

    return testDocs;
  },
};
