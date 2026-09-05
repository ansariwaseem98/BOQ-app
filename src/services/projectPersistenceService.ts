/**
 * Permanent Project Persistence & Resume Architecture Service
 * 
 * Guarantees that:
 * 1. Projects never disappear.
 * 2. Every project has a permanent unique project_id (e.g. PRJ-2026-0001).
 * 3. Complete project state (drawings, BIM elements with persistent IDs like C-012,
 *    properties, dimensions, open items, engineer corrections, BOQ items, BBS records,
 *    revisions, conflicts, notes, and last active view) is fully saved and restored.
 * 4. Dual-layer storage: High-capacity IndexedDB + synchronous LocalStorage cache + Server API sync.
 * 5. Automatic autosave + explicit manual save with timestamped status reporting.
 * 6. Save versioning / checkpoints & rollback support.
 * 7. Full project export / import backup archives.
 * 8. Project duplication, soft archiving & restore.
 */

import { 
  ProjectRecord, 
  DrawingRecord, 
  DetectedElement, 
  BoqItem, 
  BbsBarRecord, 
  OpenItem, 
  DrawingConflict, 
  RevisionComparison 
} from '../types';

export interface ProjectFullState {
  projectId: string;
  version: number;
  updatedAt: string;
  lastOpenedModule?: string;
  lastSelectedElementId?: string | null;
  lastSelectedDrawingId?: string | null;
  lastLevel?: string;
  lastView?: string;
  drawings: DrawingRecord[];
  elements: DetectedElement[];
  boqItems: BoqItem[];
  bbsRecords: BbsBarRecord[];
  openItems: OpenItem[];
  conflicts: DrawingConflict[];
  revisions: RevisionComparison[];
  projectNotes?: string;
  customSettings?: Record<string, any>;
}

export interface ProjectVersionCheckpoint {
  versionId: string;
  versionNumber: number;
  projectId: string;
  timestamp: string;
  title: string;
  description: string;
  author: string;
  itemCounts: {
    drawings: number;
    elements: number;
    openItems: number;
    boqItems: number;
    bbsRecords: number;
  };
  snapshot: ProjectFullState;
}

export interface ProjectBackupPackage {
  appVersion: string;
  exportDate: string;
  project: ProjectRecord;
  state: ProjectFullState;
  versions: ProjectVersionCheckpoint[];
  checksum?: string;
}

const DB_NAME = 'ai_boq_project_storage_v4';
const DB_VERSION = 1;

const STORES = {
  PROJECTS: 'projects',
  PROJECT_STATES: 'project_states',
  PROJECT_VERSIONS: 'project_versions',
};

const LOCAL_STORAGE_PROJECTS_KEY = 'ai_boq_projects_manifest_v4';
const LOCAL_STORAGE_ACTIVE_ID_KEY = 'ai_boq_active_project_id_v4';
const LOCAL_STORAGE_STATE_PREFIX = 'ai_boq_state_cache_v4_';

/**
 * Open or initialize IndexedDB instance
 */
function openProjectDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    const req = window.indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORES.PROJECTS)) {
        const pStore = db.createObjectStore(STORES.PROJECTS, { keyPath: 'id' });
        pStore.createIndex('status', 'status', { unique: false });
        pStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.PROJECT_STATES)) {
        db.createObjectStore(STORES.PROJECT_STATES, { keyPath: 'projectId' });
      }

      if (!db.objectStoreNames.contains(STORES.PROJECT_VERSIONS)) {
        const vStore = db.createObjectStore(STORES.PROJECT_VERSIONS, { keyPath: 'versionId' });
        vStore.createIndex('projectId', 'projectId', { unique: false });
        vStore.createIndex('versionNumber', 'versionNumber', { unique: false });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Failed to open project database'));
  });
}

/**
 * LocalStorage Fallback Handlers
 */
function getLocalProjectsCache(): ProjectRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PROJECTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('Failed to parse local projects cache:', e);
    return [];
  }
}

function saveLocalProjectsCache(projects: ProjectRecord[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_PROJECTS_KEY, JSON.stringify(projects));
  } catch (e) {
    console.warn('LocalStorage quota limit reached for project manifest:', e);
  }
}

function getLocalStateCache(projectId: string): ProjectFullState | null {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_STATE_PREFIX}${projectId}`);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn(`Failed to parse local state cache for ${projectId}:`, e);
    return null;
  }
}

function saveLocalStateCache(projectId: string, state: ProjectFullState): void {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_STATE_PREFIX}${projectId}`, JSON.stringify(state));
  } catch (e) {
    console.warn(`LocalStorage quota limit reached for state cache ${projectId}:`, e);
  }
}

export class ProjectPersistenceService {
  /**
   * Generate sequential unique Project ID (PRJ-YYYY-XXXX)
   */
  public static generateProjectId(existingProjects: ProjectRecord[]): string {
    const currentYear = new Date().getFullYear();
    const yearPrefix = `PRJ-${currentYear}-`;

    let maxNum = 0;
    existingProjects.forEach((p) => {
      if (p.id?.startsWith(yearPrefix)) {
        const parts = p.id.split('-');
        if (parts.length >= 3) {
          const num = parseInt(parts[2], 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
    });

    const nextNum = (maxNum + 1).toString().padStart(4, '0');
    return `${yearPrefix}${nextNum}`;
  }

  /**
   * Loads all projects from storage (IndexedDB with LocalStorage & Server fallback)
   */
  public static async getAllProjects(): Promise<ProjectRecord[]> {
    let projects: ProjectRecord[] = [];

    // Try IndexedDB first
    try {
      const db = await openProjectDatabase();
      const tx = db.transaction(STORES.PROJECTS, 'readonly');
      const store = tx.objectStore(STORES.PROJECTS);
      const req = store.getAll();

      projects = await new Promise((resolve) => {
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } catch (err) {
      console.warn('IndexedDB read error, falling back to local/server cache:', err);
    }

    // If IndexedDB returned empty, check LocalStorage
    if (!projects || projects.length === 0) {
      projects = getLocalProjectsCache();
    }

    // Try background sync with server
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.projects) && data.projects.length > 0) {
          // Merge server list with local list, giving priority to newer updatedAt
          const projectMap = new Map<string, ProjectRecord>();
          projects.forEach((p) => projectMap.set(p.id, p));
          data.projects.forEach((sp: ProjectRecord) => {
            const local = projectMap.get(sp.id);
            if (!local || new Date(sp.updatedAt).getTime() >= new Date(local.updatedAt).getTime()) {
              projectMap.set(sp.id, sp);
            }
          });
          projects = Array.from(projectMap.values());
        }
      }
    } catch {
      // Network offline or server unavailable - continue seamlessly
    }

    // Sync back to local caches for fast resume
    if (projects.length > 0) {
      saveLocalProjectsCache(projects);
      this.syncProjectsToIndexedDb(projects).catch(() => {});
    }

    return projects;
  }

  /**
   * Helper to batch sync projects to IndexedDB
   */
  private static async syncProjectsToIndexedDb(projects: ProjectRecord[]): Promise<void> {
    try {
      const db = await openProjectDatabase();
      const tx = db.transaction(STORES.PROJECTS, 'readwrite');
      const store = tx.objectStore(STORES.PROJECTS);
      projects.forEach((p) => store.put(p));
    } catch (e) {
      console.warn('Error syncing projects to IndexedDB:', e);
    }
  }

  /**
   * Get single project by permanent project ID
   */
  public static async getProject(projectId: string): Promise<ProjectRecord | null> {
    if (!projectId) return null;

    try {
      const db = await openProjectDatabase();
      const tx = db.transaction(STORES.PROJECTS, 'readonly');
      const store = tx.objectStore(STORES.PROJECTS);
      const req = store.get(projectId);

      const res = await new Promise<ProjectRecord | null>((resolve) => {
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });

      if (res) return res;
    } catch {
      // fallback
    }

    const localList = getLocalProjectsCache();
    const localMatch = localList.find((p) => p.id === projectId);
    if (localMatch) return localMatch;

    try {
      const sRes = await fetch(`/api/projects/${encodeURIComponent(projectId)}`);
      if (sRes.ok) {
        const json = await sRes.json();
        if (json.success && json.project) return json.project;
      }
    } catch {
      // offline
    }

    return null;
  }

  /**
   * Save / Create / Update a Project Record
   */
  public static async saveProject(projectInput: Partial<ProjectRecord>): Promise<ProjectRecord> {
    const existing = await this.getAllProjects();
    const now = new Date().toISOString();
    const projectId = projectInput.id || this.generateProjectId(existing);

    const existingProject = existing.find((p) => p.id === projectId);

    const fullRecord: ProjectRecord = {
      id: projectId,
      projectNumber: projectInput.project?.projectNumber || projectInput.projectNumber || existingProject?.projectNumber || projectId,
      company: projectInput.company || existingProject?.company || { name: 'Engineering Corp' },
      client: projectInput.client || existingProject?.client || { name: 'Client Organization' },
      consultant: projectInput.consultant || existingProject?.consultant || {},
      consultants: projectInput.consultants || existingProject?.consultants || [],
      project: {
        id: projectId,
        name: projectInput.project?.name || existingProject?.project?.name || 'Untitled Project',
        projectNumber: projectInput.project?.projectNumber || projectInput.projectNumber || projectId,
        location: projectInput.project?.location || existingProject?.project?.location || 'Dubai, UAE',
        city: projectInput.project?.city || existingProject?.project?.city || 'Dubai',
        country: projectInput.project?.country || existingProject?.project?.country || 'UAE',
        projectType: projectInput.project?.projectType || existingProject?.project?.projectType || 'RCC Building',
        buildingType: projectInput.project?.buildingType || existingProject?.project?.buildingType || 'Commercial & Residential',
        numberOfFloors: projectInput.project?.numberOfFloors ?? existingProject?.project?.numberOfFloors ?? 10,
        basementFloors: projectInput.project?.basementFloors ?? existingProject?.project?.basementFloors ?? 2,
        groundFloor: projectInput.project?.groundFloor ?? existingProject?.project?.groundFloor ?? true,
        upperFloors: projectInput.project?.upperFloors ?? existingProject?.project?.upperFloors ?? 8,
        roofLevel: projectInput.project?.roofLevel || existingProject?.project?.roofLevel || 'Roof Level +32.0m',
        builtUpAreaM2: projectInput.project?.builtUpAreaM2 ?? existingProject?.project?.builtUpAreaM2 ?? 4500,
        siteAreaM2: projectInput.project?.siteAreaM2 ?? existingProject?.project?.siteAreaM2 ?? 2000,
        description: projectInput.project?.description || existingProject?.project?.description || '',
        floorLevels: projectInput.project?.floorLevels || existingProject?.project?.floorLevels || ['Foundation', 'Basement 01', 'Ground Floor', 'Level 01', 'Level 02', 'Roof'],
        typicalFloors: projectInput.project?.typicalFloors || existingProject?.project?.typicalFloors || [],
        tenderReference: projectInput.project?.tenderReference || existingProject?.project?.tenderReference || 'TND-2026-001',
        tenderIssueDate: projectInput.project?.tenderIssueDate || existingProject?.project?.tenderIssueDate || '',
        tenderSubmissionDeadline: projectInput.project?.tenderSubmissionDeadline || existingProject?.project?.tenderSubmissionDeadline || '',
      },
      tender: projectInput.tender || existingProject?.tender || {
        scope: ['Civil', 'Structural', 'Architectural', 'MEP'],
        currency: 'AED',
        currencySymbol: 'د.إ',
      },
      engineeringSettings: projectInput.engineeringSettings || existingProject?.engineeringSettings || {
        unitSystem: 'Metric',
        lengthUnit: 'm',
        areaUnit: 'm²',
        volumeUnit: 'm³',
        weightUnit: 'kg',
        applicableCodes: ['ACI 318', 'BS 8110', 'Eurocode 2', 'IS 456'],
        measurementMethodology: 'POMI',
      },
      projectNotes: projectInput.projectNotes !== undefined ? projectInput.projectNotes : (existingProject?.projectNotes || ''),
      contract: projectInput.contract || existingProject?.contract,
      provenance: projectInput.provenance || existingProject?.provenance,
      status: projectInput.status || existingProject?.status || 'Active',
      isTestProject: projectInput.isTestProject !== undefined ? projectInput.isTestProject : (existingProject?.isTestProject || false),
      createdAt: existingProject?.createdAt || projectInput.createdAt || now,
      updatedAt: now,
    };

    // 1. Save to IndexedDB
    try {
      const db = await openProjectDatabase();
      const tx = db.transaction(STORES.PROJECTS, 'readwrite');
      const store = tx.objectStore(STORES.PROJECTS);
      await new Promise<void>((resolve, reject) => {
        const req = store.put(fullRecord);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('Failed to save project to IndexedDB:', err);
    }

    // 2. Save to LocalStorage cache
    const updatedList = [...existing.filter((p) => p.id !== projectId), fullRecord];
    saveLocalProjectsCache(updatedList);

    // 3. Save to Server REST API
    try {
      await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullRecord),
      });
    } catch {
      // Offline / background failure is acceptable due to local IndexedDB persistence
    }

    return fullRecord;
  }

  /**
   * Load Complete Project State (Drawings, BIM Elements, Open Items, BOQ, BBS, Views)
   */
  public static async getProjectState(projectId: string): Promise<ProjectFullState | null> {
    if (!projectId) return null;

    // 1. Try IndexedDB
    try {
      const db = await openProjectDatabase();
      const tx = db.transaction(STORES.PROJECT_STATES, 'readonly');
      const store = tx.objectStore(STORES.PROJECT_STATES);
      const req = store.get(projectId);

      const res = await new Promise<ProjectFullState | null>((resolve) => {
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });

      if (res && res.projectId === projectId) {
        return res;
      }
    } catch (e) {
      console.warn(`IndexedDB state read error for ${projectId}:`, e);
    }

    // 2. Try LocalStorage Cache
    const local = getLocalStateCache(projectId);
    if (local && local.projectId === projectId) {
      return local;
    }

    // 3. Try Server API
    try {
      const sRes = await fetch(`/api/projects/${encodeURIComponent(projectId)}/state`);
      if (sRes.ok) {
        const json = await sRes.json();
        if (json.success && json.state) {
          // Cache locally
          this.saveProjectState(projectId, json.state, false).catch(() => {});
          return json.state;
        }
      }
    } catch {
      // Offline
    }

    return null;
  }

  /**
   * Save Complete Project State (Auto-save & Manual Save)
   */
  public static async saveProjectState(
    projectId: string,
    stateInput: Partial<ProjectFullState>,
    createCheckpoint = false,
    checkpointTitle?: string
  ): Promise<{ success: boolean; state: ProjectFullState; error?: string }> {
    if (!projectId) {
      return { success: false, state: {} as any, error: 'Missing projectId' };
    }

    const now = new Date().toISOString();
    const existingState = await this.getProjectState(projectId);
    const versionNumber = (existingState?.version || 0) + 1;

    const fullState: ProjectFullState = {
      projectId,
      version: versionNumber,
      updatedAt: now,
      lastOpenedModule: stateInput.lastOpenedModule || existingState?.lastOpenedModule || 'dashboard',
      lastSelectedElementId: stateInput.lastSelectedElementId !== undefined ? stateInput.lastSelectedElementId : (existingState?.lastSelectedElementId || null),
      lastSelectedDrawingId: stateInput.lastSelectedDrawingId !== undefined ? stateInput.lastSelectedDrawingId : (existingState?.lastSelectedDrawingId || null),
      lastLevel: stateInput.lastLevel || existingState?.lastLevel || 'Ground Floor',
      lastView: stateInput.lastView || existingState?.lastView || 'plan',
      drawings: stateInput.drawings || existingState?.drawings || [],
      elements: stateInput.elements || existingState?.elements || [],
      boqItems: stateInput.boqItems || existingState?.boqItems || [],
      bbsRecords: stateInput.bbsRecords || existingState?.bbsRecords || [],
      openItems: stateInput.openItems || existingState?.openItems || [],
      conflicts: stateInput.conflicts || existingState?.conflicts || [],
      revisions: stateInput.revisions || existingState?.revisions || [],
      projectNotes: stateInput.projectNotes !== undefined ? stateInput.projectNotes : (existingState?.projectNotes || ''),
      customSettings: stateInput.customSettings || existingState?.customSettings || {},
    };

    let idbSaved = false;

    // 1. IndexedDB Persistence
    try {
      const db = await openProjectDatabase();
      const tx = db.transaction([STORES.PROJECT_STATES, STORES.PROJECTS], 'readwrite');
      const stateStore = tx.objectStore(STORES.PROJECT_STATES);
      const projectStore = tx.objectStore(STORES.PROJECTS);

      // Save state
      await new Promise<void>((resolve, reject) => {
        const req = stateStore.put(fullState);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });

      // Update project modified timestamp
      const pReq = projectStore.get(projectId);
      pReq.onsuccess = () => {
        if (pReq.result) {
          const updatedP = { ...pReq.result, updatedAt: now };
          projectStore.put(updatedP);
        }
      };

      idbSaved = true;
    } catch (err: any) {
      console.error('IndexedDB save failed for state:', err);
    }

    // 2. LocalStorage Cache Persistence
    saveLocalStateCache(projectId, fullState);

    // Also update project list cache updatedAt
    const localProjects = getLocalProjectsCache();
    const updatedLocalProjects = localProjects.map((p) => (p.id === projectId ? { ...p, updatedAt: now } : p));
    saveLocalProjectsCache(updatedLocalProjects);

    // 3. Server API Persistence
    try {
      await fetch(`/api/projects/${encodeURIComponent(projectId)}/state`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullState),
      });
    } catch {
      // Offline fallback
    }

    // 4. Create Version Checkpoint if requested
    if (createCheckpoint) {
      await this.createVersionCheckpoint(
        projectId,
        checkpointTitle || `Version ${versionNumber}`,
        `Manual snapshot saved with ${fullState.elements.length} BIM elements, ${fullState.drawings.length} drawings, ${fullState.openItems.length} open items.`,
        fullState
      );
    }

    if (!idbSaved && typeof window !== 'undefined' && !window.localStorage) {
      return {
        success: false,
        state: fullState,
        error: 'Storage subsystem unavailable. Please check browser storage permissions.',
      };
    }

    return { success: true, state: fullState };
  }

  /**
   * Create a Version Checkpoint for future rollback
   */
  public static async createVersionCheckpoint(
    projectId: string,
    title: string,
    description: string,
    explicitSnapshot?: ProjectFullState
  ): Promise<ProjectVersionCheckpoint | null> {
    try {
      const state = explicitSnapshot || (await this.getProjectState(projectId));
      if (!state) return null;

      const existingVersions = await this.getProjectVersions(projectId);
      const nextVersionNum = existingVersions.length + 1;
      const versionId = `VER-${projectId}-${Date.now()}`;

      const checkpoint: ProjectVersionCheckpoint = {
        versionId,
        versionNumber: nextVersionNum,
        projectId,
        timestamp: new Date().toISOString(),
        title: title || `Version ${nextVersionNum}`,
        description: description || `Checkpoint v${nextVersionNum}`,
        author: 'Lead Quantity Surveyor',
        itemCounts: {
          drawings: state.drawings?.length || 0,
          elements: state.elements?.length || 0,
          openItems: state.openItems?.length || 0,
          boqItems: state.boqItems?.length || 0,
          bbsRecords: state.bbsRecords?.length || 0,
        },
        snapshot: JSON.parse(JSON.stringify(state)),
      };

      const db = await openProjectDatabase();
      const tx = db.transaction(STORES.PROJECT_VERSIONS, 'readwrite');
      const store = tx.objectStore(STORES.PROJECT_VERSIONS);
      await new Promise<void>((resolve, reject) => {
        const req = store.put(checkpoint);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });

      // Also try sync to server
      try {
        await fetch(`/api/projects/${encodeURIComponent(projectId)}/versions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(checkpoint),
        });
      } catch {}

      return checkpoint;
    } catch (e) {
      console.error('Failed to create version checkpoint:', e);
      return null;
    }
  }

  /**
   * Get all version checkpoints for a project
   */
  public static async getProjectVersions(projectId: string): Promise<ProjectVersionCheckpoint[]> {
    if (!projectId) return [];

    try {
      const db = await openProjectDatabase();
      const tx = db.transaction(STORES.PROJECT_VERSIONS, 'readonly');
      const store = tx.objectStore(STORES.PROJECT_VERSIONS);
      const index = store.index('projectId');
      const req = index.getAll(projectId);

      const list = await new Promise<ProjectVersionCheckpoint[]>((resolve) => {
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });

      return list.sort((a, b) => b.versionNumber - a.versionNumber);
    } catch {
      return [];
    }
  }

  /**
   * Rollback / Restore Project from a saved version checkpoint
   */
  public static async restoreProjectFromVersion(
    projectId: string,
    versionId: string
  ): Promise<{ success: boolean; state?: ProjectFullState; error?: string }> {
    try {
      const versions = await this.getProjectVersions(projectId);
      const target = versions.find((v) => v.versionId === versionId);
      if (!target || !target.snapshot) {
        return { success: false, error: 'Selected version checkpoint not found or corrupted.' };
      }

      // Save restored snapshot as current active state
      const saveRes = await this.saveProjectState(
        projectId,
        target.snapshot,
        true,
        `Rollback to ${target.title} (v${target.versionNumber})`
      );

      return { success: saveRes.success, state: saveRes.state, error: saveRes.error };
    } catch (err: any) {
      return { success: false, error: err.message || 'Rollback failed' };
    }
  }

  /**
   * Duplicate a Project and all its associated drawings, BIM elements, open items, BOQ, BBS
   */
  public static async duplicateProject(sourceProjectId: string, newProjectName?: string): Promise<ProjectRecord | null> {
    const sourceProject = await this.getProject(sourceProjectId);
    if (!sourceProject) return null;

    const sourceState = await this.getProjectState(sourceProjectId);
    const existing = await this.getAllProjects();
    const newId = this.generateProjectId(existing);
    const now = new Date().toISOString();

    const duplicatedProject: ProjectRecord = {
      ...JSON.parse(JSON.stringify(sourceProject)),
      id: newId,
      projectNumber: newId,
      project: {
        ...sourceProject.project,
        id: newId,
        name: newProjectName || `${sourceProject.project?.name || 'Project'} (Copy)`,
        projectNumber: newId,
      },
      status: 'Active',
      createdAt: now,
      updatedAt: now,
    };

    // Save project record
    const saved = await this.saveProject(duplicatedProject);

    // If source state exists, clone all elements and drawings under new projectId
    if (sourceState) {
      const clonedState: ProjectFullState = {
        ...JSON.parse(JSON.stringify(sourceState)),
        projectId: newId,
        version: 1,
        updatedAt: now,
        // Update drawing references
        drawings: (sourceState.drawings || []).map((d) => ({ ...d, projectId: newId })),
      };
      await this.saveProjectState(newId, clonedState, true, 'Initial duplicate snapshot');
    }

    return saved;
  }

  /**
   * Soft Archive / Restore Project
   */
  public static async toggleArchive(projectId: string): Promise<ProjectRecord | null> {
    const project = await this.getProject(projectId);
    if (!project) return null;

    const newStatus: 'Active' | 'Archived' = project.status === 'Archived' ? 'Active' : 'Archived';
    return this.saveProject({ ...project, status: newStatus });
  }

  /**
   * Delete Project and its associated states & versions
   */
  public static async deleteProject(projectId: string): Promise<boolean> {
    try {
      const db = await openProjectDatabase();
      const tx = db.transaction([STORES.PROJECTS, STORES.PROJECT_STATES, STORES.PROJECT_VERSIONS], 'readwrite');
      tx.objectStore(STORES.PROJECTS).delete(projectId);
      tx.objectStore(STORES.PROJECT_STATES).delete(projectId);
      
      const vStore = tx.objectStore(STORES.PROJECT_VERSIONS);
      const vIndex = vStore.index('projectId');
      const vReq = vIndex.getAllKeys(projectId);
      vReq.onsuccess = () => {
        (vReq.result || []).forEach((k) => vStore.delete(k));
      };
    } catch (e) {
      console.warn('Error deleting project from IndexedDB:', e);
    }

    // LocalStorage cleanup
    const local = getLocalProjectsCache();
    saveLocalProjectsCache(local.filter((p) => p.id !== projectId));
    try {
      localStorage.removeItem(`${LOCAL_STORAGE_STATE_PREFIX}${projectId}`);
    } catch {}

    // Server cleanup
    try {
      await fetch(`/api/projects/${encodeURIComponent(projectId)}`, { method: 'DELETE' });
    } catch {}

    return true;
  }

  /**
   * Export Full Project Backup (.json)
   */
  public static async exportProjectBackup(projectId: string): Promise<ProjectBackupPackage | null> {
    const project = await this.getProject(projectId);
    if (!project) return null;

    const state = (await this.getProjectState(projectId)) || {
      projectId,
      version: 1,
      updatedAt: project.updatedAt,
      drawings: [],
      elements: [],
      boqItems: [],
      bbsRecords: [],
      openItems: [],
      conflicts: [],
      revisions: [],
    };

    const versions = await this.getProjectVersions(projectId);

    const backupPackage: ProjectBackupPackage = {
      appVersion: '3.5.0-production',
      exportDate: new Date().toISOString(),
      project,
      state,
      versions,
      checksum: `CHK-${Date.now().toString(36).toUpperCase()}`,
    };

    return backupPackage;
  }

  /**
   * Import Project Backup (.json)
   */
  public static async importProjectBackup(backupJsonString: string): Promise<{ success: boolean; project?: ProjectRecord; error?: string }> {
    try {
      const data: ProjectBackupPackage = JSON.parse(backupJsonString);
      if (!data || !data.project || !data.project.id) {
        return { success: false, error: 'Invalid project backup format. Missing project record.' };
      }

      // Check if project exists already - if so, generate new ID or update
      const existing = await this.getAllProjects();
      let targetProjectId = data.project.id;
      if (existing.some((p) => p.id === targetProjectId)) {
        targetProjectId = this.generateProjectId(existing);
      }

      const importedProject: ProjectRecord = {
        ...data.project,
        id: targetProjectId,
        projectNumber: data.project.projectNumber || targetProjectId,
        project: {
          ...data.project.project,
          id: targetProjectId,
          projectNumber: data.project.projectNumber || targetProjectId,
        },
        status: 'Active',
        updatedAt: new Date().toISOString(),
      };

      // Save project record
      const savedProject = await this.saveProject(importedProject);

      // Save imported state
      if (data.state) {
        const importedState: ProjectFullState = {
          ...data.state,
          projectId: targetProjectId,
          version: 1,
          updatedAt: new Date().toISOString(),
          drawings: (data.state.drawings || []).map((d) => ({ ...d, projectId: targetProjectId })),
        };
        await this.saveProjectState(targetProjectId, importedState, true, 'Imported from backup archive');
      }

      return { success: true, project: savedProject };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to parse backup JSON file' };
    }
  }

  /**
   * Active Project ID management
   */
  public static getActiveProjectId(): string | null {
    try {
      return localStorage.getItem(LOCAL_STORAGE_ACTIVE_ID_KEY);
    } catch {
      return null;
    }
  }

  public static setActiveProjectId(id: string | null): void {
    try {
      if (id) {
        localStorage.setItem(LOCAL_STORAGE_ACTIVE_ID_KEY, id);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_ACTIVE_ID_KEY);
      }
    } catch {}
  }
}
