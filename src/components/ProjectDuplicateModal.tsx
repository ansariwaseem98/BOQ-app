import React, { useState } from 'react';
import { Copy, X, ArrowRight, Building2 } from 'lucide-react';
import { ProjectRecord } from '../types';

interface ProjectDuplicateModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceProject: ProjectRecord | null;
  onConfirmDuplicate: (sourceId: string, newName: string) => Promise<void>;
}

export const ProjectDuplicateModal: React.FC<ProjectDuplicateModalProps> = ({
  isOpen,
  onClose,
  sourceProject,
  onConfirmDuplicate,
}) => {
  const [newName, setNewName] = useState(
    sourceProject ? `${sourceProject.project?.name || 'Project'} (Copy)` : ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (sourceProject) {
      setNewName(`${sourceProject.project?.name || 'Project'} (Copy)`);
    }
  }, [sourceProject]);

  if (!isOpen || !sourceProject) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      setIsSubmitting(true);
      await onConfirmDuplicate(sourceProject.id, newName.trim());
      onClose();
    } catch (e) {
      console.error('Duplication failed:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Copy className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Duplicate Project</h2>
              <p className="text-[11px] text-slate-300 font-mono">{sourceProject.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              New Project Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-xs text-indigo-900 space-y-1">
            <p className="font-bold flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              Full Workspace Clone:
            </p>
            <p className="text-[11px] text-indigo-700">
              A new sequential Project ID will be generated. All drawings, calibrated scales, BIM elements, open items, BOQ items, and BBS schedules will be cloned into the new project.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !newName.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              {isSubmitting ? 'Duplicating...' : 'Create Duplicate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
