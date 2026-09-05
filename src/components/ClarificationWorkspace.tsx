import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Send, 
  FileText, 
  ShieldAlert, 
  HelpCircle, 
  ArrowRight,
  Eye,
  Plus,
  Check
} from 'lucide-react';
import { OpenItem, DrawingRecord, DetectedElement, BoqItem, DrawingConflict } from '../types';

interface ClarificationWorkspaceProps {
  openItems?: OpenItem[];
  conflicts?: DrawingConflict[];
  drawings?: DrawingRecord[];
  onResolveOpenItem: (id: string, resolutionNote: string, userValue?: number) => void;
  onResolveConflict: (conflictId: string, choice: 'A' | 'B' | 'custom', customValue?: string, note?: string) => void;
  onOpenDrawingViewer?: (drawingNumber: string) => void;
  onNavigateToDrawing?: (drawingId: string) => void;
}

export const ClarificationWorkspace: React.FC<ClarificationWorkspaceProps> = ({
  openItems = [],
  conflicts = [],
  drawings = [],
  onResolveOpenItem,
  onResolveConflict,
  onOpenDrawingViewer,
  onNavigateToDrawing,
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string>(openItems?.[0]?.id || '');
  const [selectedConflictId, setSelectedConflictId] = useState<string>(conflicts?.[0]?.id || '');
  const [activeSubTab, setActiveSubTab] = useState<'open-items' | 'conflicts'>('open-items');

  // Keep selection synchronized when items change
  useEffect(() => {
    if (openItems && openItems.length > 0 && (!selectedItemId || !openItems.some((i) => i.id === selectedItemId))) {
      setSelectedItemId(openItems[0]?.id || '');
    }
  }, [openItems, selectedItemId]);

  useEffect(() => {
    if (conflicts && conflicts.length > 0 && (!selectedConflictId || !conflicts.some((c) => c.id === selectedConflictId))) {
      setSelectedConflictId(conflicts[0]?.id || '');
    }
  }, [conflicts, selectedConflictId]);

  // Resolution form state
  const [resolutionInput, setResolutionInput] = useState('');
  const [userNumberValue, setUserNumberValue] = useState<number | undefined>(undefined);

  const selectedItem = openItems.find((oi) => oi.id === selectedItemId);
  const selectedConflict = conflicts.find((c) => c.id === selectedConflictId);

  const handleResolveCurrent = () => {
    if (!selectedItem) return;
    onResolveOpenItem(selectedItem.id, resolutionInput || 'Resolved per Engineer Review', userNumberValue);
    setResolutionInput('');
    setUserNumberValue(undefined);
  };

  const handleOpenDrawing = (dwgNumberOrId: string) => {
    if (onOpenDrawingViewer) {
      onOpenDrawingViewer(dwgNumberOrId);
    } else if (onNavigateToDrawing) {
      const match = drawings.find((d) => d.drawingNumber === dwgNumberOrId || d.id === dwgNumberOrId);
      onNavigateToDrawing(match ? match.id : dwgNumberOrId);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8FAFC] text-slate-800 select-none overflow-hidden">
      {/* Sub-Header Bar */}
      <div className="h-12 px-6 bg-white border-b border-slate-200 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setActiveSubTab('open-items')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeSubTab === 'open-items'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Missing & Unclear Items ({openItems.filter((o) => o.status === 'open').length})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('conflicts')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeSubTab === 'conflicts'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Drawing Conflicts ({conflicts.filter((c) => c.resolution === 'pending').length})</span>
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Deterministic Takeoff Audit Log
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left List Pane (w-80 or w-96) */}
        <div className="w-80 lg:w-96 h-full bg-white border-r border-slate-200 overflow-y-auto flex flex-col shrink-0">
          {activeSubTab === 'open-items' ? (
            openItems.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2 my-auto">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1" />
                <h4 className="text-xs font-bold text-slate-700">No Open Clarifications</h4>
                <p className="text-[11px] text-slate-400">
                  All drawings, dimensions and schedules have sufficient details for estimation.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {openItems.map((item) => {
                  const isSelected = item.id === selectedItemId;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItemId(item.id)}
                      className={`p-4 cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-indigo-50/70 border-l-4 border-indigo-600'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-indigo-600 uppercase">
                          {item.id} • {item.category.replace('_', ' ')}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            item.severity === 'high'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.severity}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 mt-1 leading-snug">
                        {item.title}
                      </h4>

                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="font-mono text-slate-600">{item.drawingNumber}</span>
                        <span
                          className={`font-semibold ${
                            item.status === 'resolved' ? 'text-emerald-600' : 'text-amber-600'
                          }`}
                        >
                          {item.status === 'resolved' ? '✓ Resolved' : '● Action Required'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            conflicts.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2 my-auto">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1" />
                <h4 className="text-xs font-bold text-slate-700">No Drawing Discrepancies</h4>
                <p className="text-[11px] text-slate-400">
                  Cross-schedule architectural and structural drawings are 100% synchronized.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {conflicts.map((conf) => {
                  const isSelected = conf.id === selectedConflictId;
                  return (
                    <div
                      key={conf.id}
                      onClick={() => setSelectedConflictId(conf.id)}
                      className={`p-4 cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-rose-50/70 border-l-4 border-rose-600'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-rose-600 uppercase">
                          {conf.id} • {conf.category}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200">
                          {conf.resolution}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 mt-1 leading-snug">
                        {conf.title}
                      </h4>

                      <div className="mt-2 text-[11px] text-slate-500">
                        <span>{conf.elementName}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>

        {/* Right Pane: Detailed Resolution & Drawing Reference */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-[#F8FAFC] flex flex-col space-y-6">
          {activeSubTab === 'open-items' && selectedItem ? (
            <>
              {/* Problem Description Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-2xs">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-600">
                        {selectedItem.id}
                      </span>
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {selectedItem.category.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-slate-900 mt-1">{selectedItem.title}</h2>
                  </div>

                  <button
                    onClick={() => handleOpenDrawing(selectedItem.drawingNumber)}
                    className="px-3 py-1.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View on Sheet {selectedItem.drawingNumber}</span>
                  </button>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2 text-xs text-slate-700">
                  <p><strong>Description:</strong> {selectedItem.description}</p>
                  <p className="text-indigo-900 font-semibold"><strong>Required Engineer Input:</strong> {selectedItem.requiredInformation}</p>
                  <p className="text-slate-500"><strong>Suggested Action:</strong> {selectedItem.suggestedAction}</p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <span><strong>Drawing:</strong> {selectedItem.drawingNumber} ({selectedItem.drawingRevision})</span>
                  <span>•</span>
                  <span><strong>Location on Sheet:</strong> {selectedItem.locationDescription}</span>
                </div>
              </div>

              {/* Resolution Form */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-2xs">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Engineer Assumption / Clarification Resolution</span>
                </h3>

                {selectedItem.status === 'resolved' ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold">
                      <Check className="w-4 h-4" />
                      <span>Item has been formally resolved in the Tender Model</span>
                    </div>
                    <p className="text-slate-700">
                      <strong>Resolution Note:</strong> {selectedItem.resolutionNote}
                    </p>
                    <div className="text-[11px] text-slate-500 pt-1">
                      Resolved by <strong>{selectedItem.resolvedBy}</strong> on {selectedItem.resolvedAt}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedItem.category === 'missing_dimension' && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">
                          Enter Verified Dimension Value (mm):
                        </label>
                        <input
                          type="number"
                          placeholder="e.g. 500"
                          value={userNumberValue || ''}
                          onChange={(e) => setUserNumberValue(Number(e.target.value))}
                          className="w-48 bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-900 font-mono focus:bg-white focus:outline-hidden focus:border-indigo-500"
                        />
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Resolution Explanation & Basis of Estimate:
                      </label>
                      <textarea
                        rows={3}
                        value={resolutionInput}
                        onChange={(e) => setResolutionInput(e.target.value)}
                        placeholder="State code clause, architectural agreement, or conservative assumption adopted for tender submission..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-md p-3 text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:border-indigo-500"
                      />
                    </div>

                    <button
                      onClick={handleResolveCurrent}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Apply Resolution & Recalculate BOQ Quantities</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : activeSubTab === 'conflicts' && selectedConflict ? (
            <>
              {/* Conflict Analysis Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-rose-600">
                      {selectedConflict.id}
                    </span>
                    <h2 className="text-base font-bold text-slate-900 mt-1">
                      {selectedConflict.title}
                    </h2>
                  </div>
                  <span className="px-2.5 py-1 rounded text-xs font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200">
                    {selectedConflict.resolution}
                  </span>
                </div>

                <p className="text-xs text-slate-600">{selectedConflict.description}</p>

                {/* Sources Comparison Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* Source A */}
                  <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-900">SOURCE A: {selectedConflict.sourceA.discipline}</span>
                      <span className="font-mono text-[11px] text-indigo-700">{selectedConflict.sourceA.drawingNumber}</span>
                    </div>
                    <p className="text-xs text-slate-600">{selectedConflict.sourceA.drawingTitle} ({selectedConflict.sourceA.revision})</p>
                    <div className="p-2.5 bg-white rounded-lg border border-indigo-100 font-mono text-xs font-bold text-indigo-950">
                      Value: {selectedConflict.sourceA.value}
                    </div>
                    {selectedConflict.resolution === 'pending' && (
                      <button
                        onClick={() => onResolveConflict(selectedConflict.id, 'A', undefined, `Adopted ${selectedConflict.sourceA.discipline} drawing spec`)}
                        className="w-full mt-2 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold transition-colors"
                      >
                        Adopt Source A
                      </button>
                    )}
                  </div>

                  {/* Source B */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">SOURCE B: {selectedConflict.sourceB.discipline}</span>
                      <span className="font-mono text-[11px] text-slate-600">{selectedConflict.sourceB.drawingNumber}</span>
                    </div>
                    <p className="text-xs text-slate-600">{selectedConflict.sourceB.drawingTitle} ({selectedConflict.sourceB.revision})</p>
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-xs font-bold text-slate-900">
                      Value: {selectedConflict.sourceB.value}
                    </div>
                    {selectedConflict.resolution === 'pending' && (
                      <button
                        onClick={() => onResolveConflict(selectedConflict.id, 'B', undefined, `Adopted ${selectedConflict.sourceB.discipline} drawing spec`)}
                        className="w-full mt-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-bold transition-colors"
                      >
                        Adopt Source B
                      </button>
                    )}
                  </div>
                </div>

                {selectedConflict.resolution === 'resolved' && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-semibold">
                    ✓ Resolved: {selectedConflict.resolutionNote}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400 my-auto">
              <HelpCircle className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="text-sm font-bold text-slate-700">No Query Selected</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Select an item from the left clarification register to review architectural and structural discrepancies.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
