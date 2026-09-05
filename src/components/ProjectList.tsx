import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Building2, 
  ArrowRight, 
  Edit3, 
  Archive, 
  RotateCcw, 
  Trash2, 
  Calendar, 
  MapPin, 
  Layers, 
  ExternalLink,
  Briefcase,
  Users,
  Copy,
  Download,
  Upload,
  History,
  FolderArchive,
  CheckCircle2
} from 'lucide-react';
import { ProjectRecord } from '../types';

interface ProjectListProps {
  projects: ProjectRecord[];
  activeProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  onCreateNewProject: () => void;
  onEditProject: (project: ProjectRecord) => void;
  onToggleArchive: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onDuplicateProject?: (projectId: string) => void;
  onExportProject?: (projectId: string) => void;
  onImportProject?: () => void;
  onOpenVersions?: (projectId: string) => void;
  onLoadSampleProject?: () => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  onCreateNewProject,
  onEditProject,
  onToggleArchive,
  onDeleteProject,
  onDuplicateProject,
  onExportProject,
  onImportProject,
  onOpenVersions,
  onLoadSampleProject,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Archived'>('ALL');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      (p.project?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.client?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.client?.companyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.company?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.project?.location || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || (statusFilter === 'Active' ? p.status !== 'Archived' : p.status === 'Archived');

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900">Project Workspace & Directory</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {projects.length} {projects.length === 1 ? 'Project' : 'Projects'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage your tender estimation projects, contractual records, and persistent engineering workspaces.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {onImportProject && (
            <button
              onClick={onImportProject}
              className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 transition-colors flex items-center gap-1.5"
              title="Import complete project backup JSON"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-600" />
              <span>Import Backup</span>
            </button>
          )}

          {onLoadSampleProject && (
            <button
              onClick={onLoadSampleProject}
              className="px-3.5 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200 transition-colors"
              title="Load isolated sample project for testing only"
            >
              Load Sample Template (Test)
            </button>
          )}

          <button
            onClick={onCreateNewProject}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>+ CREATE NEW PROJECT</span>
          </button>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by project name, ID, client, or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({projects.length})
          </button>
          <button
            onClick={() => setStatusFilter('Active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'Active'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Active ({projects.filter((p) => p.status !== 'Archived').length})
          </button>
          <button
            onClick={() => setStatusFilter('Archived')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'Archived'
                ? 'bg-slate-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Archived ({projects.filter((p) => p.status === 'Archived').length})
          </button>
        </div>
      </div>

      {/* Projects Table / Empty State */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-2xs">
          <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {projects.length === 0 ? 'No project information has been entered yet' : 'No matching projects found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1.5 mb-6">
            {projects.length === 0
              ? 'Create your first project to configure company records, client details, tender specs, and engineering parameters.'
              : 'Try changing your search query or status filter criteria.'}
          </p>
          {projects.length === 0 && (
            <button
              onClick={onCreateNewProject}
              className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-2xs inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>+ CREATE NEW PROJECT</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Project ID & Code</th>
                  <th className="py-3 px-4">Project Name & Type</th>
                  <th className="py-3 px-4">Client / Employer</th>
                  <th className="py-3 px-4">Contractor / Company</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Last Modified</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredProjects.map((proj) => {
                  const isActive = proj.id === activeProjectId;
                  const isArchived = proj.status === 'Archived';
                  return (
                    <tr
                      key={proj.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isActive ? 'bg-indigo-50/40 font-medium' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            {proj.id}
                          </span>
                          {proj.isTestProject && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold">
                              TEST
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div>
                          <p className="font-bold text-slate-900 line-clamp-1">{proj.project?.name || 'Unnamed Project'}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {proj.project?.projectType || 'RCC Building'}
                            {proj.project?.numberOfFloors ? ` • ${proj.project.numberOfFloors} Floors` : ''}
                            {proj.project?.builtUpAreaM2 ? ` • ${proj.project.builtUpAreaM2.toLocaleString()} m²` : ''}
                          </p>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-slate-800">{proj.client?.name || '-'}</p>
                          <p className="text-[11px] text-slate-400 line-clamp-1">
                            {proj.client?.companyName || proj.client?.city || ''}
                          </p>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-800 line-clamp-1">{proj.company?.name || '-'}</p>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="line-clamp-1">{proj.project?.location || proj.project?.city || '-'}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{proj.updatedAt ? new Date(proj.updatedAt).toLocaleDateString() : '-'}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isArchived
                              ? 'bg-slate-100 text-slate-600 border border-slate-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {proj.status || 'Active'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onSelectProject(proj.id)}
                            className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1 transition-colors shadow-2xs"
                            title="Open project workspace"
                          >
                            <span>Open</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>

                          {onDuplicateProject && (
                            <button
                              onClick={() => onDuplicateProject(proj.id)}
                              className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-indigo-600 transition-colors"
                              title="Duplicate full project & elements"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {onExportProject && (
                            <button
                              onClick={() => onExportProject(proj.id)}
                              className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-indigo-600 transition-colors"
                              title="Download complete project backup (.json)"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {onOpenVersions && (
                            <button
                              onClick={() => onOpenVersions(proj.id)}
                              className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-indigo-600 transition-colors"
                              title="View saved version checkpoints"
                            >
                              <History className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => onEditProject(proj)}
                            className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                            title="Edit project setup details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onToggleArchive(proj.id)}
                            className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                            title={isArchived ? 'Restore project to Active' : 'Archive project'}
                          >
                            {isArchived ? <RotateCcw className="w-3.5 h-3.5 text-emerald-600" /> : <Archive className="w-3.5 h-3.5" />}
                          </button>

                          {confirmDeleteId === proj.id ? (
                            <div className="inline-flex items-center gap-1 bg-rose-50 p-1 rounded border border-rose-200">
                              <span className="text-[10px] text-rose-700 font-bold">Delete?</span>
                              <button
                                onClick={() => {
                                  onDeleteProject(proj.id);
                                  setConfirmDeleteId(null);
                                }}
                                className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px]"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(proj.id)}
                              className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                              title="Delete project"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
