import React, { useState } from 'react';
import { 
  Layers, 
  FolderOpen, 
  Search, 
  Filter, 
  Plus, 
  CheckCircle, 
  AlertTriangle, 
  ShieldCheck, 
  Sparkles,
  ChevronDown,
  Building,
  Ruler
} from 'lucide-react';
import { 
  DrawingRecord, 
  DetectedElement, 
  OpenItem, 
  BoqItem, 
  BoundingBox, 
  ProjectRecord 
} from '../types';
import { DrawingViewer } from './DrawingViewer';
import { ElementInspector } from './ElementInspector';

interface WorkspaceLayoutProps {
  drawings?: DrawingRecord[];
  activeDrawingId: string | null;
  onSelectDrawing: (id: string) => void;
  elements?: DetectedElement[];
  openItems?: OpenItem[];
  boqItems?: BoqItem[];
  projectData?: ProjectRecord | any | null;
  selectedElementId: string | null;
  onSelectElement: (elementId: string | null) => void;
  onUpdateElement: (updated: DetectedElement) => void;
  onSelectOpenItem?: (openItem: OpenItem) => void;
  onResolveOpenItem?: (id: string, note: string) => void;
  onShowMeWhy?: (element: DetectedElement) => void;
  onTriggerShowMeWhy?: (element: DetectedElement) => void;
  onTriggerAiScan: () => void;
  onAddNewElement: (box: BoundingBox) => void;
}

export const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({
  drawings = [],
  activeDrawingId,
  onSelectDrawing,
  elements = [],
  openItems = [],
  boqItems = [],
  projectData = null,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onSelectOpenItem,
  onResolveOpenItem,
  onShowMeWhy,
  onTriggerShowMeWhy,
  onTriggerAiScan,
  onAddNewElement,
}) => {
  const [searchElement, setSearchElement] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('All');

  const activeDrawing = drawings.find((d) => d.id === activeDrawingId) || (drawings.length > 0 ? drawings[0] : null);
  const selectedElement = elements.find((e) => e.id === selectedElementId) || null;

  const handleShowWhy = onShowMeWhy || onTriggerShowMeWhy || (() => {});

  // Filter elements for the left sidebar
  const filteredElements = elements.filter((el) => {
    const matchesSearch =
      el.name.toLowerCase().includes(searchElement.toLowerCase()) ||
      el.id.toLowerCase().includes(searchElement.toLowerCase()) ||
      (el.gridLocation || '').toLowerCase().includes(searchElement.toLowerCase());
    const matchesLevel = selectedLevel === 'All' || (el.level || '').includes(selectedLevel);
    const matchesDiscipline = selectedDiscipline === 'All' || el.discipline === selectedDiscipline;
    return matchesSearch && matchesLevel && matchesDiscipline;
  });

  return (
    <div className="flex-1 flex h-[calc(100vh-6.75rem)] overflow-hidden bg-[#F8FAFC] text-slate-900 select-none">
      {/* LEFT PANE: Drawing Selector & Element Hierarchy Tree (w-72) */}
      <div className="w-72 h-full bg-white border-r border-slate-200 flex flex-col z-10 shrink-0">
        {/* Drawing Selector Header */}
        <div className="p-3.5 border-b border-slate-100 bg-slate-50/70 space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Active Drawing Sheet
          </label>
          <select
            value={activeDrawing?.id || ''}
            onChange={(e) => onSelectDrawing(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-hidden focus:border-indigo-500 truncate shadow-2xs"
          >
            {drawings.length === 0 ? (
              <option value="">No drawings registered</option>
            ) : (
              drawings.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.drawingNumber} — {d.title} ({d.revision})
                </option>
              ))
            )}
          </select>

          {/* Quick Filter: Floor Level */}
          <div className="flex items-center gap-1.5">
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 text-[11px] text-slate-600 focus:outline-hidden"
            >
              <option value="All">All Floor Levels</option>
              <option value="Foundation">Foundation / Subst.</option>
              <option value="Level 01">Level 01 (Ground)</option>
              <option value="Level 02">Level 02 (First)</option>
              <option value="Roof">Roof Framing</option>
            </select>

            <select
              value={selectedDiscipline}
              onChange={(e) => setSelectedDiscipline(e.target.value)}
              className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 text-[11px] text-slate-600 focus:outline-hidden"
            >
              <option value="All">All Trades</option>
              <option value="Structural">Structural</option>
              <option value="Architectural">Architectural</option>
              <option value="MEP">MEP</option>
            </select>
          </div>
        </div>

        {/* Element Search */}
        <div className="p-2 border-b border-slate-100">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Search elements or grid..."
              value={searchElement}
              onChange={(e) => setSearchElement(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded pl-7 pr-2 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Elements Scrollable Tree */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredElements.length > 0 ? (
            filteredElements.map((el) => {
              const isSelected = el.id === selectedElementId;
              return (
                <div
                  key={el.id}
                  onClick={() => onSelectElement(el.id)}
                  className={`p-3 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-indigo-50/80 border-l-4 border-indigo-600'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-indigo-600">
                      {el.id}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        el.status === 'verified'
                          ? 'bg-emerald-500'
                          : el.status === 'review_required'
                          ? 'bg-amber-500'
                          : 'bg-indigo-500'
                      }`}
                      title={`Status: ${el.status}`}
                    />
                  </div>

                  <h4 className="text-xs font-semibold text-slate-900 mt-0.5 leading-snug line-clamp-1">
                    {el.name}
                  </h4>

                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500">
                    <span>Grid {el.gridLocation}</span>
                    <span className="font-mono font-bold text-slate-800">
                      {(el.calculation?.netQuantity || 0).toLocaleString()} {el.calculation?.unit || 'm³'}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-6 text-center text-slate-400 text-xs">
              No takeoff elements match the filter.
            </div>
          )}
        </div>

        {/* Tree Footer / Summary */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[11px] text-slate-600">
          <span className="font-medium">{filteredElements.length} Takeoff Items</span>
          <button
            onClick={onTriggerAiScan}
            className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" /> Scan Sheet
          </button>
        </div>
      </div>

      {/* CENTER PANE: CAD / Drawing Vector Viewer Canvas */}
      <div className="flex-1 h-full flex flex-col overflow-hidden relative bg-[#1E293B]">
        {activeDrawing ? (
          <DrawingViewer
            drawing={activeDrawing}
            elements={elements}
            openItems={openItems}
            selectedElementId={selectedElementId}
            onSelectElement={(el) => onSelectElement(el.id)}
            onSelectOpenItem={onSelectOpenItem}
            onAddElementBoundingBox={onAddNewElement}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            No drawing loaded.
          </div>
        )}
      </div>

      {/* RIGHT PANE: Contextual Inspector & Engineering Recalculation Engine */}
      <ElementInspector
        element={selectedElement}
        onUpdateElement={onUpdateElement}
        onShowMeWhy={handleShowWhy}
        boqItems={boqItems}
        currencySymbol={projectData?.tender?.currencySymbol || projectData?.contract?.currencySymbol || '$'}
      />
    </div>
  );
};
