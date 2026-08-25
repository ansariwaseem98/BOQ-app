import React from 'react';
import { GeneralMEPElement } from '../types';

interface MepCalculationModalProps {
  element: GeneralMEPElement;
  onClose: () => void;
  onEdit?: (element: GeneralMEPElement) => void;
}

export const MepCalculationModal: React.FC<MepCalculationModalProps> = ({
  element,
  onClose,
  onEdit,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="px-2.5 py-1 bg-amber-500 text-slate-950 text-xs font-mono font-bold rounded-md uppercase tracking-wider">
              {element.discipline}
            </span>
            <div>
              <h3 className="text-lg font-bold font-mono tracking-tight flex items-center gap-2">
                {element.tag}
                <span className="text-xs font-normal text-slate-400 font-sans">
                  ({element.physicalElementId})
                </span>
              </h3>
              <p className="text-xs text-slate-300 truncate max-w-lg">
                {element.description}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Primary Formula Display */}
          <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 shadow-inner">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase font-mono font-semibold tracking-wider text-amber-400">
                Mathematical Takeoff Expression
              </span>
              <span className="text-xs font-mono text-slate-400">
                Unit: <strong className="text-white">{element.unit}</strong>
              </span>
            </div>
            <div className="font-mono text-base md:text-lg font-semibold text-emerald-400 bg-slate-900/80 p-3.5 rounded-lg border border-slate-800 break-all select-all">
              {element.formulaWithValues}
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-mono">
              Source Type: <span className="text-slate-200">{element.sourceType}</span> | Confidence Score: <span className="text-emerald-400 font-bold">{(element.confidence * 100).toFixed(1)}%</span>
            </p>
          </div>

          {/* Quantity & Geometric Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
              <p className="text-xs text-slate-500 font-medium">Final Measured Quantity</p>
              <p className="text-2xl font-black text-slate-900 font-mono mt-1">
                {element.lengthM !== undefined ? element.lengthM.toFixed(2) : element.quantity}{' '}
                <span className="text-xs font-normal text-slate-600 font-sans">{element.unit}</span>
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
              <p className="text-xs text-slate-500 font-medium">Size / Dimensions</p>
              <p className="text-base font-bold text-slate-900 font-mono mt-1">
                {element.size || 'N/A'}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
              <p className="text-xs text-slate-500 font-medium">Rating / Capacity</p>
              <p className="text-sm font-bold text-slate-900 font-mono mt-1 truncate">
                {element.ratingOrCapacity || 'N/A'}
              </p>
            </div>
          </div>

          {/* Allowances Breakdown (If applicable) */}
          {element.allowanceBreakdown && element.allowanceBreakdown.length > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                  Applied Engineering Allowances
                </h4>
                <span className="text-xs text-slate-500">Configurable parameters</span>
              </div>
              <div className="divide-y divide-slate-100">
                {element.allowanceBreakdown.map((allw, idx) => (
                  <div key={idx} className="px-4 py-2 flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-medium">{allw.label}</span>
                    <span className="font-mono font-bold text-slate-900">
                      +{allw.value.toFixed(2)} {allw.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Drawing & Location Provenance */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Source Drawings & Provenance
            </h4>
            <div className="space-y-2 text-xs">
              {element.sourceDrawings && element.sourceDrawings.length > 0 ? (
                element.sourceDrawings.map((doc, dIdx) => (
                  <div key={dIdx} className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-indigo-700 mr-2">
                        {doc.drawingNumber}
                      </span>
                      <span className="text-slate-700">{doc.drawingTitle}</span>
                      <span className="ml-2 px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-mono">
                        {doc.revision}
                      </span>
                    </div>
                    <span className="text-slate-500 font-mono text-[11px]">
                      {doc.location}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 font-mono">
                  Primary Drawing: {element.primaryDrawingNumber} ({element.revision})
                </div>
              )}
              <div className="flex items-center gap-4 text-slate-600 pt-1 text-[11px]">
                <span>Level: <strong className="text-slate-900">{element.level}</strong></span>
                {element.roomName && <span>Room: <strong className="text-slate-900">{element.roomName}</strong></span>}
                {element.grid && <span>Grid: <strong className="text-slate-900">{element.grid}</strong></span>}
              </div>
            </div>
          </div>

          {/* Audit Trail */}
          {element.auditTrail && element.auditTrail.length > 0 && (
            <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                Audit Trail ({element.auditTrail.length} records)
              </h4>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {element.auditTrail.map((aud, aIdx) => (
                  <div key={aIdx} className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 mr-2">[{aud.action}]</span>
                      <span>{aud.reason}</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">
                      {new Date(aud.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
          {onEdit && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(element);
              }}
              className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 shadow-xs transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit & Recalculate
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
