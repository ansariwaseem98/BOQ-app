import React from 'react';
import { AlertTriangle, Archive, Trash2, X } from 'lucide-react';
import { ProjectDocument } from '../types';

interface ConfirmDeleteModalProps {
  document: ProjectDocument | null;
  isOpen: boolean;
  isPermanent: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  document: doc,
  isOpen,
  isPermanent,
  onConfirm,
  onClose,
}) => {
  if (!isOpen || !doc) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-800">
        <div className={`px-6 py-4 flex items-center justify-between border-b ${
          isPermanent ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isPermanent ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {isPermanent ? <Trash2 className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {isPermanent ? 'Delete Document Permanently?' : 'Archive Document?'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {doc.drawingNumber ? `Sheet ${doc.drawingNumber}` : doc.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-3 text-xs">
          <p className="text-slate-600 leading-relaxed">
            {isPermanent ? (
              <>
                Are you sure you want to permanently delete <strong className="text-slate-900">{doc.title}</strong> (
                <span className="font-mono">{doc.sourceFileName}</span>)? This will erase the file from database storage.
              </>
            ) : (
              <>
                Archiving will move <strong className="text-slate-900">{doc.title}</strong> to the Archived documents tab.
                The original file is preserved and can be restored at any time.
              </>
            )}
          </p>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px] space-y-1 text-slate-700">
            <p>ID: {doc.id}</p>
            <p>Drawing: {doc.drawingNumber || '-'}</p>
            <p>Revision: {doc.revision}</p>
            <p>Size: {Math.round(doc.fileSize / 1024)} KB</p>
          </div>
        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-bold text-white rounded-lg transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer ${
              isPermanent
                ? 'bg-rose-600 hover:bg-rose-500'
                : 'bg-amber-600 hover:bg-amber-500'
            }`}
          >
            {isPermanent ? (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Permanent Deletion</span>
              </>
            ) : (
              <>
                <Archive className="w-3.5 h-3.5" />
                <span>Confirm Archive</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
