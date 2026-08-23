import React from 'react';
import { X, CheckCircle, HelpCircle, FileText, ArrowRight, ShieldCheck, Ruler, Check } from 'lucide-react';
import { DetectedElement, BoqItem, BbsBarRecord, ProjectRecord } from '../types';

interface ShowMeWhyModalProps {
  isOpen: boolean;
  onClose: () => void;
  element?: DetectedElement | null;
  boqItem?: BoqItem | null;
  bbsRecords?: BbsBarRecord[];
  allElements?: DetectedElement[];
  projectData?: ProjectRecord | any | null;
  onVerifyElement?: (id: string) => void;
}

export const ShowMeWhyModal: React.FC<ShowMeWhyModalProps> = ({
  isOpen,
  onClose,
  element,
  boqItem,
  bbsRecords = [],
  allElements = [],
  projectData = null,
  onVerifyElement,
}) => {
  if (!isOpen || (!element && !boqItem)) return null;

  const methodology = 
    projectData?.tender?.measurementStandard || 
    projectData?.contract?.measurementMethodology || 
    'Standard POMI / NRM2';

  const currency = 
    projectData?.tender?.currencySymbol || 
    projectData?.contract?.currencySymbol || 
    '$';

  const matchingBbs = element
    ? (bbsRecords || []).filter((b) => b.memberId === element.id || (element.linkedBbsMarks || []).includes(b.barMark))
    : [];

  const calculationSteps = element?.calculation?.steps || [
    element?.calculation?.expressionWithValues || 'Length × Width × Height'
  ];

  const calculationDeductions = element?.calculation?.deductions || [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-xl overflow-hidden text-slate-800">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Audit Trail & Mathematical Proof (&quot;Show Me Why&quot;)
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {methodology}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                100% Deterministic calculation breakdown linked to source drawings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {element && (
            <>
              {/* Element Header & Meta */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-mono font-bold text-indigo-600 uppercase tracking-wider">
                      {element.id} • {element.category?.replace('_', ' ').toUpperCase()}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">{element.name}</h3>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-600">
                      <span><strong>Level:</strong> {element.level}</span>
                      <span>•</span>
                      <span><strong>Grid:</strong> {element.gridLocation}</span>
                      <span>•</span>
                      <span><strong>Discipline:</strong> {element.discipline}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 font-medium block">Calculated Net Quantity</span>
                    <span className="text-xl font-mono font-extrabold text-slate-900">
                      {element.calculation?.netQuantity?.toLocaleString() || 0} {element.calculation?.unit || 'm³'}
                    </span>
                  </div>
                </div>

                {/* Source Drawing Link */}
                <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Source Drawing: <strong>{element.drawingNumber}</strong> ({element.drawingRevision})</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-500">
                    <span>AI Confidence:</span>
                    <span className="font-mono text-emerald-600 font-bold">
                      {((element.confidence || 0.95) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Mathematical Equation & Calculation Steps */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Mathematical Quantity Breakdown
                </h4>
                <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3 font-mono text-xs">
                  <div className="p-3 bg-indigo-50/50 rounded border border-indigo-100 text-indigo-950">
                    <span className="text-[10px] font-sans text-indigo-600 font-bold uppercase block mb-1">Standard Equation:</span>
                    <span className="text-sm font-bold">{element.calculation?.formula || 'Length × Width × Height × Count'}</span>
                  </div>

                  <div className="space-y-1 text-slate-700">
                    {calculationSteps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2 py-0.5">
                        <span className="text-indigo-600 font-bold">[{idx + 1}]</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>

                  {calculationDeductions.length > 0 && (
                    <div className="pt-2 border-t border-slate-200 space-y-1">
                      <span className="text-[10px] font-sans text-rose-600 font-bold uppercase block">
                        Deductions Applied (Voids / Openings / Overlaps):
                      </span>
                      {calculationDeductions.map((ded, idx) => (
                        <div key={idx} className="flex items-center justify-between text-rose-700">
                          <span>• {ded.reason}</span>
                          <span className="font-bold">
                            -{ded.volumeM3 ? `${ded.volumeM3} m³` : `${ded.areaM2} m²`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm font-bold text-slate-900">
                    <span className="font-sans">Final Net Takeoff:</span>
                    <span>{element.calculation?.netQuantity} {element.calculation?.unit}</span>
                  </div>
                </div>
              </div>

              {/* Contributing Rebar BBS Marks */}
              {matchingBbs.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Associated Bar Bending Schedule (BBS) Marks
                  </h4>
                  <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-500 font-bold text-[10px] uppercase border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2">Bar Mark</th>
                          <th className="px-3 py-2">Dia</th>
                          <th className="px-3 py-2">Shape</th>
                          <th className="px-3 py-2 text-right">Cut L (m)</th>
                          <th className="px-3 py-2 text-center">Total Bars</th>
                          <th className="px-3 py-2 text-right">Weight (kg)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {matchingBbs.map((b) => (
                          <tr key={b.id} className="hover:bg-slate-50">
                            <td className="px-3 py-2 font-bold text-indigo-600">{b.barMark}</td>
                            <td className="px-3 py-2 font-bold text-slate-900">T{b.diameterMm}</td>
                            <td className="px-3 py-2 text-slate-600 font-sans">{b.shapeCode} ({b.shapeDescription})</td>
                            <td className="px-3 py-2 text-right">{b.cuttingLengthM.toFixed(2)}</td>
                            <td className="px-3 py-2 text-center">{b.totalBars}</td>
                            <td className="px-3 py-2 text-right font-bold text-slate-900">
                              {b.totalWeightKg.toLocaleString()} kg
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* If inspecting BOQ Item */}
          {boqItem && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-mono font-bold text-indigo-600 uppercase">
                      {boqItem.itemNumber} • {boqItem.sectionCode}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">{boqItem.description}</h3>
                    <div className="text-xs text-slate-600 mt-1">
                      <span>Specification Reference: <strong>{boqItem.specificationReference}</strong></span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 font-medium block">Total Line Amount</span>
                    <span className="text-xl font-mono font-extrabold text-slate-900">
                      {currency}{boqItem.totalAmount?.toLocaleString() || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contributing Takeoff Elements */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Contributing CAD/Drawing Takeoff Elements ({(boqItem.contributingElementIds || []).length})
                </h4>
                <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2 text-xs">
                  {(boqItem.contributingElementIds || []).map((id) => (
                    <div key={id} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100">
                      <span className="font-mono font-bold text-indigo-600">{id}</span>
                      <span className="text-slate-600 font-medium">Drawing Source Element</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Audit standard: <strong className="text-slate-700">{methodology}</strong>
          </div>

          <div className="flex items-center gap-2">
            {element && onVerifyElement && (
              <button
                onClick={() => {
                  onVerifyElement(element.id);
                  onClose();
                }}
                className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white flex items-center gap-1.5 shadow-2xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark Verified as Engineer</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-md bg-slate-200 hover:bg-slate-300 text-xs font-semibold text-slate-700"
            >
              Close Audit Trail
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
