import {
  AnalysisRunLog,
  ExtractedElementItem,
  ExtractedDimension,
  ExtractedLevel,
  ExtractedGrid,
  ExtractedReinforcementItem,
  ExtractedSteelItem,
  ExtractedRoofItem,
  ExtractedMepItem,
  ExtractedCandidateRule,
  IntelligenceOpenItem,
  IntelligenceConflict,
  AnalysisDrawingQueueItem,
  DrawingClassificationType,
  ClassificationStatus,
  IntelligenceVerificationStatus,
  DrawingBoundingBox,
  ProjectDocument
} from '../types';

const INTELLIGENCE_DB_NAME = 'ai_boq_drawing_intelligence_db_v1';
const DB_VERSION = 1;

const STORES = {
  RUNS: 'analysis_runs',
  ELEMENTS: 'extracted_elements',
  DIMENSIONS: 'extracted_dimensions',
  LEVELS: 'extracted_levels',
  GRIDS: 'extracted_grids',
  REINFORCEMENT: 'extracted_reinforcement',
  STEEL: 'extracted_steel',
  ROOF: 'extracted_roof',
  MEP: 'extracted_mep',
  RULES: 'extracted_candidate_rules',
  OPEN_ITEMS: 'intelligence_open_items',
  CONFLICTS: 'intelligence_conflicts',
  QUEUE: 'drawing_analysis_queue'
};

const LOCAL_BACKUP_KEY_PREFIX = 'ai_boq_intel_backup_';

function openIntelligenceDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not available in current environment.'));
      return;
    }

    const req = window.indexedDB.open(INTELLIGENCE_DB_NAME, DB_VERSION);

    req.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Analysis Runs Store
      if (!db.objectStoreNames.contains(STORES.RUNS)) {
        const store = db.createObjectStore(STORES.RUNS, { keyPath: 'analysisId' });
        store.createIndex('projectId', 'projectId', { unique: false });
        store.createIndex('documentId', 'documentId', { unique: false });
      }

      // Extracted Elements Store
      if (!db.objectStoreNames.contains(STORES.ELEMENTS)) {
        const store = db.createObjectStore(STORES.ELEMENTS, { keyPath: 'id' });
        store.createIndex('projectId', 'projectId', { unique: false });
        store.createIndex('documentId', 'documentId', { unique: false });
        store.createIndex('revision', 'revision', { unique: false });
      }

      // Extracted Dimensions Store
      if (!db.objectStoreNames.contains(STORES.DIMENSIONS)) {
        const store = db.createObjectStore(STORES.DIMENSIONS, { keyPath: 'id' });
        store.createIndex('projectId', 'projectId', { unique: false });
        store.createIndex('documentId', 'documentId', { unique: false });
      }

      // Extracted Levels Store
      if (!db.objectStoreNames.contains(STORES.LEVELS)) {
        const store = db.createObjectStore(STORES.LEVELS, { keyPath: 'id' });
        store.createIndex('projectId', 'projectId', { unique: false });
        store.createIndex('documentId', 'documentId', { unique: false });
      }

      // Extracted Grids Store
      if (!db.objectStoreNames.contains(STORES.GRIDS)) {
        const store = db.createObjectStore(STORES.GRIDS, { keyPath: 'id' });
        store.createIndex('projectId', 'projectId', { unique: false });
        store.createIndex('documentId', 'documentId', { unique: false });
      }

      // Extracted Reinforcement Store
      if (!db.objectStoreNames.contains(STORES.REINFORCEMENT)) {
        const store = db.createObjectStore(STORES.REINFORCEMENT, { keyPath: 'id' });
        store.createIndex('projectId', 'projectId', { unique: false });
        store.createIndex('documentId', 'documentId', { unique: false });
      }

      // Extracted Steel Store
      if (!db.objectStoreNames.contains(STORES.STEEL)) {
        const store = db.createObjectStore(STORES.STEEL, { keyPath: 'id' });
        store.createIndex('projectId', 'projectId', { unique: false });
        store.createIndex('documentId', 'documentId', { unique: false });
      }

      // Extracted Roof Store
      if (!db.objectStoreNames.contains(STORES.ROOF)) {
        const store = db.createObjectStore(STORES.ROOF, { keyPath: 'id' });
        store.createIndex('projectId', 'projectId', { unique: false });
        store.createIndex('documentId', 'documentId', { unique: false });
      }

      // Extracted MEP Store
      if (!db.objectStoreNames.contains(STORES.MEP)) {
        const store = db.createObjectStore(STORES.MEP, { keyPath: 'id' });
        store.createIndex('projectId', 'projectId', { unique: false });
        store.createIndex('documentId', 'documentId', { unique: false });
      }

      // Extracted Rules Store
      if (!db.objectStoreNames.contains(STORES.RULES)) {
        const store = db.createObjectStore(STORES.RULES, { keyPath: 'id' });
        store.createIndex('projectId', 'projectId', { unique: false });
        store.createIndex('documentId', 'documentId', { unique: false });
      }

      // Intelligence Open Items Store
      if (!db.objectStoreNames.contains(STORES.OPEN_ITEMS)) {
        const store = db.createObjectStore(STORES.OPEN_ITEMS, { keyPath: 'id' });
        store.createIndex('projectId', 'projectId', { unique: false });
        store.createIndex('documentId', 'documentId', { unique: false });
        store.createIndex('status', 'status', { unique: false });
      }

      // Intelligence Conflicts Store
      if (!db.objectStoreNames.contains(STORES.CONFLICTS)) {
        const store = db.createObjectStore(STORES.CONFLICTS, { keyPath: 'id' });
        store.createIndex('projectId', 'projectId', { unique: false });
        store.createIndex('status', 'status', { unique: false });
      }

      // Queue Store
      if (!db.objectStoreNames.contains(STORES.QUEUE)) {
        const store = db.createObjectStore(STORES.QUEUE, { keyPath: 'documentId' });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function getLocalFallback<T>(storeName: string, projectId: string): T[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_BACKUP_KEY_PREFIX}${storeName}_${projectId}`);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalFallback<T>(storeName: string, projectId: string, data: T[]): void {
  try {
    localStorage.setItem(`${LOCAL_BACKUP_KEY_PREFIX}${storeName}_${projectId}`, JSON.stringify(data));
  } catch (e) {
    console.warn(`LocalStorage quota exceeded for ${storeName}:`, e);
  }
}

export interface DocumentAnalysisDataset {
  runs: AnalysisRunLog[];
  elements: ExtractedElementItem[];
  dimensions: ExtractedDimension[];
  levels: ExtractedLevel[];
  grids: ExtractedGrid[];
  reinforcement: ExtractedReinforcementItem[];
  steel: ExtractedSteelItem[];
  roof: ExtractedRoofItem[];
  mep: ExtractedMepItem[];
  candidateRules: ExtractedCandidateRule[];
  openItems: IntelligenceOpenItem[];
  conflicts: IntelligenceConflict[];
}

export const IntelligenceStorageService = {
  /**
   * Save a complete analysis run record along with its extracted items
   */
  async saveAnalysisResult(
    projectId: string,
    documentId: string,
    revisionId: string,
    log: AnalysisRunLog,
    dataset: Partial<DocumentAnalysisDataset>
  ): Promise<void> {
    try {
      const db = await openIntelligenceDB();

      // 1. Save Run Log
      const runTx = db.transaction([STORES.RUNS], 'readwrite');
      const runStore = runTx.objectStore(STORES.RUNS);
      await new Promise((res, rej) => {
        const req = runStore.put(log);
        req.onsuccess = () => res(true);
        req.onerror = () => rej(req.error);
      });

      // 2. Helper to batch save items into a store
      const saveBatch = async <T extends { id: string; projectId: string; documentId?: string }>(
        storeName: string,
        items?: T[]
      ) => {
        if (!items || items.length === 0) return;
        const tx = db.transaction([storeName], 'readwrite');
        const store = tx.objectStore(storeName);
        for (const it of items) {
          store.put(it);
        }
        await new Promise((res, rej) => {
          tx.oncomplete = () => res(true);
          tx.onerror = () => rej(tx.error);
        });
      };

      await Promise.all([
        saveBatch(STORES.ELEMENTS, dataset.elements),
        saveBatch(STORES.DIMENSIONS, dataset.dimensions),
        saveBatch(STORES.LEVELS, dataset.levels),
        saveBatch(STORES.GRIDS, dataset.grids),
        saveBatch(STORES.REINFORCEMENT, dataset.reinforcement),
        saveBatch(STORES.STEEL, dataset.steel),
        saveBatch(STORES.ROOF, dataset.roof),
        saveBatch(STORES.MEP, dataset.mep),
        saveBatch(STORES.RULES, dataset.candidateRules),
        saveBatch(STORES.OPEN_ITEMS, dataset.openItems),
        saveBatch(STORES.CONFLICTS, dataset.conflicts)
      ]);
    } catch (err) {
      console.warn('IndexedDB saveAnalysisResult error, saving to localStorage:', err);
      // Fallback
      if (dataset.elements) saveLocalFallback(STORES.ELEMENTS, projectId, dataset.elements);
      if (dataset.dimensions) saveLocalFallback(STORES.DIMENSIONS, projectId, dataset.dimensions);
      if (dataset.openItems) saveLocalFallback(STORES.OPEN_ITEMS, projectId, dataset.openItems);
    }
  },

  /**
   * Get all extracted dataset for a specific document or entire project
   */
  async getAnalysisDataForDocument(
    projectId: string,
    documentId: string
  ): Promise<DocumentAnalysisDataset> {
    const result: DocumentAnalysisDataset = {
      runs: [],
      elements: [],
      dimensions: [],
      levels: [],
      grids: [],
      reinforcement: [],
      steel: [],
      roof: [],
      mep: [],
      candidateRules: [],
      openItems: [],
      conflicts: []
    };

    if (!projectId || !documentId) return result;

    try {
      const db = await openIntelligenceDB();

      const fetchByDocIndex = async <T>(storeName: string): Promise<T[]> => {
        return new Promise((resolve) => {
          try {
            const tx = db.transaction([storeName], 'readonly');
            const store = tx.objectStore(storeName);
            const index = store.index('documentId');
            const req = index.getAll(IDBKeyRange.only(documentId));
            req.onsuccess = () => {
              const items = (req.result || []) as T[];
              resolve(items);
            };
            req.onerror = () => resolve([]);
          } catch (e) {
            resolve([]);
          }
        });
      };

      const [
        runs,
        elements,
        dimensions,
        levels,
        grids,
        reinforcement,
        steel,
        roof,
        mep,
        candidateRules,
        openItems
      ] = await Promise.all([
        fetchByDocIndex<AnalysisRunLog>(STORES.RUNS),
        fetchByDocIndex<ExtractedElementItem>(STORES.ELEMENTS),
        fetchByDocIndex<ExtractedDimension>(STORES.DIMENSIONS),
        fetchByDocIndex<ExtractedLevel>(STORES.LEVELS),
        fetchByDocIndex<ExtractedGrid>(STORES.GRIDS),
        fetchByDocIndex<ExtractedReinforcementItem>(STORES.REINFORCEMENT),
        fetchByDocIndex<ExtractedSteelItem>(STORES.STEEL),
        fetchByDocIndex<ExtractedRoofItem>(STORES.ROOF),
        fetchByDocIndex<ExtractedMepItem>(STORES.MEP),
        fetchByDocIndex<ExtractedCandidateRule>(STORES.RULES),
        fetchByDocIndex<IntelligenceOpenItem>(STORES.OPEN_ITEMS)
      ]);

      // Conflicts for project
      const conflicts = await this.getConflictsByProject(projectId);

      result.runs = runs.filter((r) => r.projectId === projectId);
      result.elements = elements.filter((e) => e.projectId === projectId);
      result.dimensions = dimensions.filter((d) => d.projectId === projectId);
      result.levels = levels.filter((l) => l.projectId === projectId);
      result.grids = grids.filter((g) => g.projectId === projectId);
      result.reinforcement = reinforcement.filter((r) => r.projectId === projectId);
      result.steel = steel.filter((s) => s.projectId === projectId);
      result.roof = roof.filter((ro) => ro.projectId === projectId);
      result.mep = mep.filter((m) => m.projectId === projectId);
      result.candidateRules = candidateRules.filter((cr) => cr.projectId === projectId);
      result.openItems = openItems.filter((oi) => oi.projectId === projectId);
      result.conflicts = conflicts.filter(
        (c) => c.sourceA.drawingId === documentId || c.sourceB.drawingId === documentId
      );

      return result;
    } catch (err) {
      console.warn('IndexedDB read failed in getAnalysisDataForDocument:', err);
      // Fallback
      result.elements = getLocalFallback<ExtractedElementItem>(STORES.ELEMENTS, projectId).filter(
        (e) => e.documentId === documentId
      );
      result.dimensions = getLocalFallback<ExtractedDimension>(STORES.DIMENSIONS, projectId).filter(
        (d) => d.documentId === documentId
      );
      result.openItems = getLocalFallback<IntelligenceOpenItem>(STORES.OPEN_ITEMS, projectId).filter(
        (oi) => oi.documentId === documentId
      );
      return result;
    }
  },

  /**
   * Get all extracted dataset for an entire project
   */
  async getProjectAnalysisSummary(projectId: string): Promise<{
    analyzedDocumentsCount: number;
    totalElements: number;
    totalDimensions: number;
    totalLevels: number;
    totalReinforcement: number;
    totalSteel: number;
    totalMep: number;
    totalOpenItems: number;
    totalConflicts: number;
    openItems: IntelligenceOpenItem[];
    conflicts: IntelligenceConflict[];
    allLevels: ExtractedLevel[];
    candidateRules: ExtractedCandidateRule[];
  }> {
    if (!projectId) {
      return {
        analyzedDocumentsCount: 0,
        totalElements: 0,
        totalDimensions: 0,
        totalLevels: 0,
        totalReinforcement: 0,
        totalSteel: 0,
        totalMep: 0,
        totalOpenItems: 0,
        totalConflicts: 0,
        openItems: [],
        conflicts: [],
        allLevels: [],
        candidateRules: []
      };
    }

    try {
      const db = await openIntelligenceDB();

      const fetchAllByProject = async <T>(storeName: string): Promise<T[]> => {
        return new Promise((resolve) => {
          try {
            const tx = db.transaction([storeName], 'readonly');
            const store = tx.objectStore(storeName);
            const index = store.index('projectId');
            const req = index.getAll(IDBKeyRange.only(projectId));
            req.onsuccess = () => resolve((req.result || []) as T[]);
            req.onerror = () => resolve([]);
          } catch (e) {
            resolve([]);
          }
        });
      };

      const [
        runs,
        elements,
        dimensions,
        levels,
        reinforcement,
        steel,
        mep,
        rules,
        openItems,
        conflicts
      ] = await Promise.all([
        fetchAllByProject<AnalysisRunLog>(STORES.RUNS),
        fetchAllByProject<ExtractedElementItem>(STORES.ELEMENTS),
        fetchAllByProject<ExtractedDimension>(STORES.DIMENSIONS),
        fetchAllByProject<ExtractedLevel>(STORES.LEVELS),
        fetchAllByProject<ExtractedReinforcementItem>(STORES.REINFORCEMENT),
        fetchAllByProject<ExtractedSteelItem>(STORES.STEEL),
        fetchAllByProject<ExtractedMepItem>(STORES.MEP),
        fetchAllByProject<ExtractedCandidateRule>(STORES.RULES),
        fetchAllByProject<IntelligenceOpenItem>(STORES.OPEN_ITEMS),
        fetchAllByProject<IntelligenceConflict>(STORES.CONFLICTS)
      ]);

      const uniqueAnalyzedDocs = new Set(runs.map((r) => r.documentId));

      return {
        analyzedDocumentsCount: uniqueAnalyzedDocs.size,
        totalElements: elements.length,
        totalDimensions: dimensions.length,
        totalLevels: levels.length,
        totalReinforcement: reinforcement.length,
        totalSteel: steel.length,
        totalMep: mep.length,
        totalOpenItems: openItems.filter((oi) => oi.status === 'open' || oi.status === 'under_review').length,
        totalConflicts: conflicts.filter((c) => c.status === 'open').length,
        openItems,
        conflicts,
        allLevels: levels,
        candidateRules: rules
      };
    } catch (err) {
      console.warn('Failed to load project analysis summary:', err);
      return {
        analyzedDocumentsCount: 0,
        totalElements: 0,
        totalDimensions: 0,
        totalLevels: 0,
        totalReinforcement: 0,
        totalSteel: 0,
        totalMep: 0,
        totalOpenItems: 0,
        totalConflicts: 0,
        openItems: [],
        conflicts: [],
        allLevels: [],
        candidateRules: []
      };
    }
  },

  /**
   * Update an extracted element with user correction while preserving original AI value
   */
  async updateUserCorrectionForElement(
    elementId: string,
    updatedValues: {
      type?: ExtractedElementItem['type'];
      mark?: string;
      level?: string;
      gridLocation?: string;
      geometry?: ExtractedElementItem['geometry'];
      material?: string;
      reinforcementNotation?: string;
      status: IntelligenceVerificationStatus;
      reason: string;
      user: string;
    }
  ): Promise<ExtractedElementItem | null> {
    try {
      const db = await openIntelligenceDB();
      const tx = db.transaction([STORES.ELEMENTS], 'readwrite');
      const store = tx.objectStore(STORES.ELEMENTS);

      const existing: ExtractedElementItem | null = await new Promise((res, rej) => {
        const req = store.get(elementId);
        req.onsuccess = () => res(req.result || null);
        req.onerror = () => rej(req.error);
      });

      if (!existing) return null;

      // Preserve original AI extraction on first edit
      if (!existing.originalAiValue) {
        existing.originalAiValue = {
          type: existing.type,
          mark: existing.mark,
          level: existing.level,
          gridLocation: existing.gridLocation,
          geometry: { ...existing.geometry },
          material: existing.material,
          rawDimensionsText: existing.rawDimensionsText,
          confidence: existing.confidence
        };
      }

      existing.userCorrectedValue = {
        type: updatedValues.type ?? existing.type,
        mark: updatedValues.mark ?? existing.mark,
        level: updatedValues.level ?? existing.level,
        gridLocation: updatedValues.gridLocation ?? existing.gridLocation,
        geometry: updatedValues.geometry ?? existing.geometry,
        material: updatedValues.material ?? existing.material
      };

      if (updatedValues.type) existing.type = updatedValues.type;
      if (updatedValues.mark) existing.mark = updatedValues.mark;
      if (updatedValues.level) existing.level = updatedValues.level;
      if (updatedValues.gridLocation) existing.gridLocation = updatedValues.gridLocation;
      if (updatedValues.geometry) existing.geometry = { ...existing.geometry, ...updatedValues.geometry };
      if (updatedValues.material) existing.material = updatedValues.material;
      if (updatedValues.reinforcementNotation) existing.reinforcementNotation = updatedValues.reinforcementNotation;
      
      existing.status = updatedValues.status;
      existing.correctionReason = updatedValues.reason;
      existing.correctionTimestamp = new Date().toISOString();

      await new Promise((res, rej) => {
        const putReq = store.put(existing);
        putReq.onsuccess = () => res(true);
        putReq.onerror = () => rej(putReq.error);
      });

      return existing;
    } catch (err) {
      console.error('Failed to update user correction:', err);
      return null;
    }
  },

  /**
   * Update or resolve an Open Item with user responses & attached sketch
   */
  async resolveOpenItem(
    openItemId: string,
    response: {
      enteredValue?: string;
      unit?: string;
      notes?: string;
      attachedSketchDataUrl?: string;
      attachedSupportingDocId?: string;
      resolvedBy: string;
      status: 'resolved' | 'rejected' | 'under_review';
    }
  ): Promise<IntelligenceOpenItem | null> {
    try {
      const db = await openIntelligenceDB();
      const tx = db.transaction([STORES.OPEN_ITEMS], 'readwrite');
      const store = tx.objectStore(STORES.OPEN_ITEMS);

      const item: IntelligenceOpenItem | null = await new Promise((res, rej) => {
        const req = store.get(openItemId);
        req.onsuccess = () => res(req.result || null);
        req.onerror = () => rej(req.error);
      });

      if (!item) return null;

      item.status = response.status;
      item.resolvedAt = new Date().toISOString();
      item.userResponse = {
        enteredValue: response.enteredValue,
        unit: response.unit,
        notes: response.notes,
        attachedSketchDataUrl: response.attachedSketchDataUrl,
        attachedSupportingDocId: response.attachedSupportingDocId,
        resolvedBy: response.resolvedBy,
        resolvedAt: item.resolvedAt
      };

      await new Promise((res, rej) => {
        const putReq = store.put(item);
        putReq.onsuccess = () => res(true);
        putReq.onerror = () => rej(putReq.error);
      });

      return item;
    } catch (err) {
      console.error('Failed to resolve open item:', err);
      return null;
    }
  },

  /**
   * Get all conflicts for project
   */
  async getConflictsByProject(projectId: string): Promise<IntelligenceConflict[]> {
    if (!projectId) return [];
    try {
      const db = await openIntelligenceDB();
      const tx = db.transaction([STORES.CONFLICTS], 'readonly');
      const store = tx.objectStore(STORES.CONFLICTS);
      const index = store.index('projectId');

      return new Promise((res) => {
        const req = index.getAll(IDBKeyRange.only(projectId));
        req.onsuccess = () => res((req.result || []) as IntelligenceConflict[]);
        req.onerror = () => res([]);
      });
    } catch (err) {
      console.warn('Failed to get conflicts:', err);
      return [];
    }
  },

  /**
   * Resolve a drawing conflict
   */
  async resolveConflict(
    conflictId: string,
    resolution: 'use_source_a' | 'use_source_b' | 'custom_value',
    customValue?: string,
    decisionNote?: string,
    decidedBy?: string
  ): Promise<IntelligenceConflict | null> {
    try {
      const db = await openIntelligenceDB();
      const tx = db.transaction([STORES.CONFLICTS], 'readwrite');
      const store = tx.objectStore(STORES.CONFLICTS);

      const conflict: IntelligenceConflict | null = await new Promise((res, rej) => {
        const req = store.get(conflictId);
        req.onsuccess = () => res(req.result || null);
        req.onerror = () => rej(req.error);
      });

      if (!conflict) return null;

      conflict.status = 'resolved';
      conflict.resolution = resolution;
      conflict.customValue = customValue;
      conflict.decisionNote = decisionNote;
      conflict.decidedBy = decidedBy || 'Lead Engineer';
      conflict.decidedAt = new Date().toISOString();

      await new Promise((res, rej) => {
        const putReq = store.put(conflict);
        putReq.onsuccess = () => res(true);
        putReq.onerror = () => rej(putReq.error);
      });

      return conflict;
    } catch (err) {
      console.error('Failed to resolve conflict:', err);
      return null;
    }
  },

  /**
   * Confirm or reject a Candidate Rule extracted from general notes
   */
  async updateCandidateRuleStatus(
    ruleId: string,
    status: 'CONFIRMED_BY_USER' | 'REJECTED',
    user: string
  ): Promise<ExtractedCandidateRule | null> {
    try {
      const db = await openIntelligenceDB();
      const tx = db.transaction([STORES.RULES], 'readwrite');
      const store = tx.objectStore(STORES.RULES);

      const rule: ExtractedCandidateRule | null = await new Promise((res, rej) => {
        const req = store.get(ruleId);
        req.onsuccess = () => res(req.result || null);
        req.onerror = () => rej(req.error);
      });

      if (!rule) return null;

      rule.status = status;
      rule.confirmedByUser = user;
      rule.confirmedAt = new Date().toISOString();

      await new Promise((res, rej) => {
        const putReq = store.put(rule);
        putReq.onsuccess = () => res(true);
        putReq.onerror = () => rej(putReq.error);
      });

      return rule;
    } catch (err) {
      console.error('Failed to update candidate rule status:', err);
      return null;
    }
  },

  /**
   * Reset / Clear analysis data for a single document
   */
  async clearDocumentAnalysis(projectId: string, documentId: string): Promise<void> {
    try {
      const db = await openIntelligenceDB();
      const clearDocStore = async (storeName: string) => {
        const tx = db.transaction([storeName], 'readwrite');
        const store = tx.objectStore(storeName);
        const index = store.index('documentId');
        const keysReq = index.getAllKeys(IDBKeyRange.only(documentId));
        keysReq.onsuccess = () => {
          const keys = keysReq.result || [];
          for (const key of keys) {
            store.delete(key);
          }
        };
      };

      await Promise.all([
        clearDocStore(STORES.RUNS),
        clearDocStore(STORES.ELEMENTS),
        clearDocStore(STORES.DIMENSIONS),
        clearDocStore(STORES.LEVELS),
        clearDocStore(STORES.GRIDS),
        clearDocStore(STORES.REINFORCEMENT),
        clearDocStore(STORES.STEEL),
        clearDocStore(STORES.ROOF),
        clearDocStore(STORES.MEP),
        clearDocStore(STORES.RULES),
        clearDocStore(STORES.OPEN_ITEMS)
      ]);
    } catch (err) {
      console.warn('Failed to clear document analysis:', err);
    }
  }
};
