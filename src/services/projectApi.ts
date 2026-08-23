import { ProjectRecord, ProjectData } from '../types';

const LOCAL_STORAGE_KEY = 'ai_boq_projects_store_v1';
const ACTIVE_PROJECT_KEY = 'ai_boq_active_project_id_v1';

/**
 * Generate sequential unique project ID in format PRJ-YYYY-XXXX
 */
export function generateProjectId(existingProjects: ProjectRecord[]): string {
  const currentYear = new Date().getFullYear();
  const yearPrefix = `PRJ-${currentYear}-`;
  
  const currentYearProjects = existingProjects.filter((p) =>
    p.id?.startsWith(yearPrefix)
  );

  let maxNum = 0;
  currentYearProjects.forEach((p) => {
    const parts = p.id.split('-');
    if (parts.length >= 3) {
      const num = parseInt(parts[2], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  });

  const nextNum = (maxNum + 1).toString().padStart(4, '0');
  return `${yearPrefix}${nextNum}`;
}

/**
 * Get fallback projects from LocalStorage
 */
function getLocalProjects(): ProjectRecord[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to read from localStorage:', e);
    return [];
  }
}

/**
 * Save projects to LocalStorage
 */
function saveLocalProjects(projects: ProjectRecord[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

export const ProjectApiService = {
  /**
   * Fetch all projects from database
   */
  async getAllProjects(): Promise<ProjectRecord[]> {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.projects)) {
          saveLocalProjects(json.projects);
          return json.projects;
        }
      }
    } catch (err) {
      console.warn('Network request failed, falling back to local cache:', err);
    }
    return getLocalProjects();
  },

  /**
   * Fetch single project by ID
   */
  async getProjectById(id: string): Promise<ProjectRecord | null> {
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(id)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.project) {
          return json.project;
        }
      }
    } catch (err) {
      console.warn('Network request failed, searching local cache:', err);
    }
    const local = getLocalProjects();
    return local.find((p) => p.id === id) || null;
  },

  /**
   * Create a new project record
   */
  async createProject(projectInput: Partial<ProjectRecord>): Promise<ProjectRecord> {
    const existing = await this.getAllProjects();
    const generatedId = projectInput.id || generateProjectId(existing);

    const now = new Date().toISOString();
    const newRecord: ProjectRecord = {
      id: generatedId,
      projectNumber: projectInput.project?.projectNumber || projectInput.projectNumber || generatedId,
      company: projectInput.company || { name: '' },
      client: projectInput.client || { name: '' },
      consultant: projectInput.consultant || {},
      consultants: projectInput.consultants || [],
      project: {
        id: generatedId,
        name: projectInput.project?.name || '',
        projectNumber: projectInput.project?.projectNumber || projectInput.projectNumber || generatedId,
        location: projectInput.project?.location || '',
        city: projectInput.project?.city || '',
        country: projectInput.project?.country || '',
        projectType: projectInput.project?.projectType || 'RCC Building',
        buildingType: projectInput.project?.buildingType || '',
        numberOfFloors: projectInput.project?.numberOfFloors,
        basementFloors: projectInput.project?.basementFloors,
        groundFloor: projectInput.project?.groundFloor !== false,
        upperFloors: projectInput.project?.upperFloors,
        roofLevel: projectInput.project?.roofLevel || '',
        builtUpAreaM2: projectInput.project?.builtUpAreaM2,
        siteAreaM2: projectInput.project?.siteAreaM2,
        description: projectInput.project?.description || '',
        floorLevels: projectInput.project?.floorLevels || [],
        typicalFloors: projectInput.project?.typicalFloors || [],
        tenderReference: projectInput.project?.tenderReference || '',
        tenderIssueDate: projectInput.project?.tenderIssueDate || '',
        tenderSubmissionDeadline: projectInput.project?.tenderSubmissionDeadline || '',
      },
      tender: projectInput.tender || {
        scope: [],
        currency: '',
        currencySymbol: '',
      },
      engineeringSettings: projectInput.engineeringSettings || {
        unitSystem: 'Metric',
        lengthUnit: 'm',
        areaUnit: 'm²',
        volumeUnit: 'm³',
        weightUnit: 'kg',
        applicableCodes: [],
      },
      projectNotes: projectInput.projectNotes || '',
      contract: projectInput.contract,
      provenance: projectInput.provenance,
      status: 'Active',
      isTestProject: projectInput.isTestProject || false,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.project) {
          const updatedList = [...existing.filter((p) => p.id !== json.project.id), json.project];
          saveLocalProjects(updatedList);
          return json.project;
        }
      }
    } catch (err) {
      console.warn('Backend save failed, saving to local store:', err);
    }

    const updatedList = [...existing.filter((p) => p.id !== newRecord.id), newRecord];
    saveLocalProjects(updatedList);
    return newRecord;
  },

  /**
   * Update existing project record
   */
  async updateProject(id: string, projectInput: Partial<ProjectRecord>): Promise<ProjectRecord> {
    const existing = await this.getAllProjects();
    const current = existing.find((p) => p.id === id);
    const now = new Date().toISOString();

    const updatedRecord: ProjectRecord = {
      ...(current || {}),
      ...projectInput,
      id,
      projectNumber: projectInput.project?.projectNumber || projectInput.projectNumber || current?.projectNumber || id,
      company: { ...(current?.company || { name: '' }), ...(projectInput.company || {}) },
      client: { ...(current?.client || { name: '' }), ...(projectInput.client || {}) },
      consultant: { ...(current?.consultant || {}), ...(projectInput.consultant || {}) },
      consultants: projectInput.consultants || current?.consultants || [],
      project: { ...(current?.project || { id, name: '', projectNumber: id, location: '', projectType: 'RCC Building' }), ...(projectInput.project || {}) },
      tender: { ...(current?.tender || { scope: [], currency: '', currencySymbol: '' }), ...(projectInput.tender || {}) },
      engineeringSettings: { ...(current?.engineeringSettings || { unitSystem: 'Metric', lengthUnit: 'm', areaUnit: 'm²', volumeUnit: 'm³', weightUnit: 'kg', applicableCodes: [] }), ...(projectInput.engineeringSettings || {}) },
      projectNotes: projectInput.projectNotes !== undefined ? projectInput.projectNotes : (current?.projectNotes || ''),
      contract: projectInput.contract || current?.contract,
      provenance: projectInput.provenance || current?.provenance,
      status: projectInput.status || current?.status || 'Active',
      isTestProject: projectInput.isTestProject !== undefined ? projectInput.isTestProject : (current?.isTestProject || false),
      createdAt: current?.createdAt || now,
      updatedAt: now,
    };

    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRecord),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.project) {
          const updatedList = existing.map((p) => (p.id === id ? json.project : p));
          saveLocalProjects(updatedList);
          return json.project;
        }
      }
    } catch (err) {
      console.warn('Backend update failed, updating local store:', err);
    }

    const updatedList = existing.map((p) => (p.id === id ? updatedRecord : p));
    saveLocalProjects(updatedList);
    return updatedRecord;
  },

  /**
   * Toggle archive status of project
   */
  async toggleArchiveProject(id: string): Promise<ProjectRecord | null> {
    const existing = await this.getAllProjects();
    const target = existing.find((p) => p.id === id);
    if (!target) return null;

    const newStatus: 'Active' | 'Archived' = target.status === 'Archived' ? 'Active' : 'Archived';
    return this.updateProject(id, { status: newStatus });
  },

  /**
   * Delete project permanently
   */
  async deleteProject(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          const existing = getLocalProjects();
          saveLocalProjects(existing.filter((p) => p.id !== id));
          return true;
        }
      }
    } catch (err) {
      console.warn('Backend delete failed, removing locally:', err);
    }

    const existing = getLocalProjects();
    saveLocalProjects(existing.filter((p) => p.id !== id));
    return true;
  },

  /**
   * Get active project ID from local session
   */
  getActiveProjectId(): string | null {
    try {
      return localStorage.getItem(ACTIVE_PROJECT_KEY);
    } catch {
      return null;
    }
  },

  /**
   * Set active project ID in local session
   */
  setActiveProjectId(id: string | null): void {
    try {
      if (id) {
        localStorage.setItem(ACTIVE_PROJECT_KEY, id);
      } else {
        localStorage.removeItem(ACTIVE_PROJECT_KEY);
      }
    } catch (e) {
      console.error(e);
    }
  },
};
