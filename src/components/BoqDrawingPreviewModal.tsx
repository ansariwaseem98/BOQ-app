import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, FileText, Layers, CheckCircle2, Zap } from 'lucide-react';
import { UnifiedBoqItem } from '../types';
import { AutoCAD2021Modal } from './AutoCAD2021Modal';
import { AutoCAD2021LaunchConfig } from '../engine/autocad2021IntegrationEngine';

interface BoqDrawingPreviewModalProps {
  item: UnifiedBoqItem;
  onClose: () => void;
}

export const BoqDrawingPreviewModal: React.FC<BoqDrawingPreviewModalProps> = ({ item, onClose }) => {
  const [zoom, setZoom] = useState(1);
  const [isAutoCADModalOpen, setIsAutoCADModalOpen] = useState(false);

  const autoCadConfig: AutoCAD2021LaunchConfig = {
    drawingNumber: item.primaryDrawingNumber || 'DWG-001',
    drawingTitle: item.drawingTitle || `Drawing Sheet ${item.primaryDrawingNumber}`,
    filename: `${item.primaryDrawingNumber || 'drawing'}.dwg`,
    fileFormat: 'DWG',
    elementTag: item.elementType || item.discipline,
    itemCode: item.itemCode,
    category: item.category,
    quantity: item.finalQuantity,
    unit: item.unit,
    unitRateAed: item.finalRate,
    totalAmountAed: item.totalAmount,
    scale: '1:100',
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-blue-300 font-bold">{item.primaryDrawingNumber}</span>
                <span className="text-2xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">{item.revision}</span>
              </div>
              <h3 className="text-base font-semibold text-white truncate max-w-md">
                {item.drawingTitle || `Drawing Sheet ${item.primaryDrawingNumber}`}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* AutoCAD 2021 Launcher Button */}
            <button
              onClick={() => setIsAutoCADModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm border border-rose-500 transition-all cursor-pointer"
              title="Open this drawing sheet in Autodesk AutoCAD 2021 (v24.0 / AC1032)"
            >
              <span className="w-4 h-4 rounded bg-white/20 flex items-center justify-center text-[10px] font-black">A</span>
              <span className="hidden sm:inline">Open in</span>
              <span>AutoCAD 2021</span>
            </button>

            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
              <button
                onClick={() => setZoom(prev => Math.max(0.6, prev - 0.2))}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono text-2xs text-slate-300">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom(prev => Math.min(2.5, prev + 0.2))}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoom(1)}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
                title="Reset Zoom"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawing Canvas Area */}
        <div className="p-6 overflow-auto flex-1 bg-slate-100 flex items-center justify-center min-h-[350px]">
          <div
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
            className="transition-transform duration-150 bg-white border border-slate-300 shadow-md rounded-lg p-6 max-w-2xl w-full text-slate-800"
          >
            {/* Title Block on CAD Blueprint Canvas */}
            <div className="border-4 border-slate-800 p-4 space-y-4 font-mono text-xs">
              <div className="flex justify-between border-b-2 border-slate-800 pb-2">
                <div>
                  <span className="text-2xs text-slate-500 uppercase font-bold block">PROJECT BLUEPRINT / CAD REGISTER</span>
                  <span className="font-bold text-sm text-slate-900">{item.primaryDrawingNumber} — {item.revision}</span>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-2xs">VERIFIED SOURCE</span>
                </div>
              </div>

              {/* Blueprint vector preview mockup */}
              <div className="h-64 bg-slate-900 rounded-md p-4 flex flex-col justify-between border border-slate-700 relative overflow-hidden">
                {/* CAD Grid Lines */}
                <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>

                {/* Highlight box for the takeoff element */}
                <div className="relative z-10 p-3 bg-indigo-950/80 border border-indigo-400 rounded text-indigo-200">
                  <div className="flex items-center justify-between text-2xs">
                    <span className="font-bold text-indigo-300">ELEMENT CALLOUT: {item.itemCode}</span>
                    <span className="text-emerald-400 font-mono font-bold">{item.finalQuantity} {item.unit}</span>
                  </div>
                  <div className="mt-1 font-sans text-xs text-white font-medium">{item.description}</div>
                  <div className="text-2xs text-indigo-300 font-mono mt-1">Location: {item.sourceLocation || 'Standard Grid'}</div>
                </div>

                <div className="relative z-10 flex justify-between items-end text-2xs text-slate-400 font-mono border-t border-slate-800 pt-2">
                  <span>SCALE 1:100 @ A1</span>
                  <span>ORIGINAL SHEET ID: {item.takeoffSourceId}</span>
                </div>
              </div>

              {/* Drawing Title & Metadata Footer */}
              <div className="grid grid-cols-3 gap-2 border-t-2 border-slate-800 pt-2 text-2xs">
                <div>
                  <span className="text-slate-500 block">ELEMENT TYPE</span>
                  <span className="font-bold text-slate-900">{item.elementType}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">SPATIAL ZONE</span>
                  <span className="font-bold text-slate-900">{item.level || 'General Building'} ({item.zone || 'Core'})</span>
                </div>
                <div>
                  <span className="text-slate-500 block">DISCIPLINE</span>
                  <span className="font-bold text-slate-900">{item.discipline}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>AutoCAD 2021 Integration Ready (AC1032) • Currency: <strong>AED</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAutoCADModalOpen(true)}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Zap className="w-3.5 h-3.5 text-rose-200" />
              <span>Launch in AutoCAD 2021</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium transition-colors"
            >
              Close Drawing Preview
            </button>
          </div>
        </div>
      </div>

      {/* AutoCAD 2021 Integration Modal */}
      <AutoCAD2021Modal
        isOpen={isAutoCADModalOpen}
        onClose={() => setIsAutoCADModalOpen(false)}
        config={autoCadConfig}
      />
    </div>
  );
};
