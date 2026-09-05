import { ProjectRecord } from '../types';
import { 
  ProjectPersistenceService, 
  ProjectFullState, 
  ProjectVersionCheckpoint, 
  ProjectBackupPackage 
} from './projectPersistenceService';

export { 
  ProjectPersistenceService, 
  type ProjectFullState, 
  type ProjectVersionCheckpoint, 
  type ProjectBackupPackage 
};

export const generateProjectId = (existing: ProjectRecord[]): string => {
  return ProjectPersistenceService.generateProjectId(existing);
};

export const ProjectApiService = {
  async getAllProjects(): Promise<ProjectRecord[]> {
    return ProjectPersistenceService.getAllProjects();
  },

  async getProjectById(id: string): Promise<ProjectRecord | null> {
    return ProjectPersistenceService.getProject(id);
  },

  async createProject(projectInput: Partial<ProjectRecord>): Promise<ProjectRecord> {
    return ProjectPersistenceService.saveProject(projectInput);
  },

  async updateProject(id: string, projectInput: Partial<ProjectRecord>): Promise<ProjectRecord> {
    return ProjectPersistenceService.saveProject({ ...projectInput, id });
  },

  async toggleArchiveProject(id: string): Promise<ProjectRecord | null> {
    return ProjectPersistenceService.toggleArchive(id);
  },

  async deleteProject(id: string): Promise<boolean> {
    return ProjectPersistenceService.deleteProject(id);
  },

  async duplicateProject(id: string, newName?: string): Promise<ProjectRecord | null> {
    return ProjectPersistenceService.duplicateProject(id, newName);
  },

  async getProjectState(id: string): Promise<ProjectFullState | null> {
    return ProjectPersistenceService.getProjectState(id);
  },

  async saveProjectState(
    id: string,
    state: Partial<ProjectFullState>,
    createCheckpoint = false,
    checkpointTitle?: string
  ): Promise<{ success: boolean; state: ProjectFullState; error?: string }> {
    return ProjectPersistenceService.saveProjectState(id, state, createCheckpoint, checkpointTitle);
  },

  async getProjectVersions(id: string): Promise<ProjectVersionCheckpoint[]> {
    return ProjectPersistenceService.getProjectVersions(id);
  },

  async createVersionCheckpoint(id: string, title: string, description: string): Promise<ProjectVersionCheckpoint | null> {
    return ProjectPersistenceService.createVersionCheckpoint(id, title, description);
  },

  async restoreProjectVersion(id: string, versionId: string): Promise<{ success: boolean; state?: ProjectFullState; error?: string }> {
    return ProjectPersistenceService.restoreProjectFromVersion(id, versionId);
  },

  async exportBackup(id: string): Promise<ProjectBackupPackage | null> {
    return ProjectPersistenceService.exportProjectBackup(id);
  },

  async importBackup(jsonString: string): Promise<{ success: boolean; project?: ProjectRecord; error?: string }> {
    return ProjectPersistenceService.importProjectBackup(jsonString);
  },

  getActiveProjectId(): string | null {
    return ProjectPersistenceService.getActiveProjectId();
  },

  setActiveProjectId(id: string | null): void {
    ProjectPersistenceService.setActiveProjectId(id);
  },
};
