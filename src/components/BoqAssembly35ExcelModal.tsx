import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  CheckCircle2,
  Layers,
  FileCheck2,
  ShieldCheck,
  Building2,
  Calculator,
  HardHat,
  Sparkles,
  AlertCircle,
  X,
  FileText
} from 'lucide-react';
import { BOQItemObject, BOQSignOffRecord } from '../types/boqAssemblyTypes';
import { MasterBoqExcelEngine, ExcelWorkbookExportConfig } from '../engine/masterBoqExcelEngine';

interface BoqAssembly35ExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: BOQItemObject[];
  projectName?: string;
  projectNumber?: string;
  clientName?: string;
  consultantName?: string;
  currency?: string;
  revision?: string;
}

export const BoqAssembly35ExcelModal: React.FC<BoqAssembly35ExcelModalProps> = ({
  isOpen,
  onClose,
  items,
  projectName = 'Apex Commercial & Industrial Logistics Facility',
  projectNumber = 'PRJ-2026-IND-004',
  clientName = 'Apex Global Logistics Real Estate Fund',
  consultantName = 'Apex Engineering & Cost Consultants International',
  currency = 'AED',
  revision = 'BOQ Rev 02'
}) => {
  const [exportPreset, setExportPreset] = useState<ExcelWorkbookExportConfig['exportPreset']>('FULL_35_SHEET_MASTER');
  const [includeFormulas, setIncludeFormulas] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [downloadedFileName, setDownloadedFileName] = useState('');

  const [signOff, setSignOff] = useState<BOQSignOffRecord>({
    preparedBy: 'Senior Quantity Surveyor (QS Dept)',
    preparedDate: '2026-02-24',
    checkedBy: 'Chief Commercial Manager & Lead Estimator',
    checkedDate: '2026-02-24',
    approvedBy: 'Director of Project Controls & Chartered QS',
    approvedDate: '2026-02-24',
    tenderNumber: 'TND-2026-APEX-009',
    remarks: 'Phase 15F Certified Master Tender BOQ. Quantities verified against IFC Structural, Architectural and MEP drawings.'
  });

  if (!isOpen) return null;

  const sheetsList = [
    { num: '01', id: '01_COVER', name: 'Cover Page & Governance Sign-Off', group: 'Admin' },
    { num: '02', id: '02_PROJECT_INFO', name: 'Project & Contract Information', group: 'Admin' },
    { num: '03', id: '03_BOQ', name: 'Master Summary BOQ & Pricing Schedule', group: 'BOQ' },
    { num: '04', id: '04_BOQ_DETAILED', name: 'Detailed BOQ with Full Math & Provenance', group: 'BOQ' },
    { num: '05', id: '05_EARTHWORK', name: 'Earthwork & Excavation Schedule', group: 'Discipline' },
    { num: '06', id: '06_PCC', name: 'Plain Cement Concrete (PCC) Blinding', group: 'Discipline' },
    { num: '07', id: '07_RCC', name: 'Reinforced Cement Concrete (RCC) Works', group: 'Discipline' },
    { num: '08', id: '08_REBAR', name: 'High Yield TMT Steel Reinforcement (BBS)', group: 'Discipline' },
    { num: '09', id: '09_FORMWORK', name: 'Formwork & Shuttering Systems', group: 'Discipline' },
    { num: '10', id: '10_MASONRY', name: 'AAC & Solid Block Masonry Works', group: 'Discipline' },
    { num: '11', id: '11_DPC', name: 'Damp Proof Course (DPC) & Plinth Seal', group: 'Discipline' },
    { num: '12', id: '12_STRUCTURAL_STEEL', name: 'Structural Steel Framing & Trusses', group: 'Discipline' },
    { num: '13', id: '13_PURLINS', name: 'Cold-Formed Z & C Purlins / Girts', group: 'Discipline' },
    { num: '14', id: '14_ROOFING', name: 'Insulated Sandwich Roof Cladding', group: 'Discipline' },
    { num: '15', id: '15_SKYLIGHT', name: 'Polycarbonate Multiwall Skylights', group: 'Discipline' },
    { num: '16', id: '16_DOORS_WINDOWS', name: 'Doors, Windows & Ironmongery', group: 'Discipline' },
    { num: '17', id: '17_PLASTER', name: 'Internal & External Plaster Works', group: 'Discipline' },
    { num: '18', id: '18_FINISHES', name: 'Floor, Wall & Ceiling Finishes', group: 'Discipline' },
    { num: '19', id: '19_WATERPROOFING', name: 'Substructure & Roof Waterproofing', group: 'Discipline' },
    { num: '20', id: '20_ELECTRICAL', name: 'Electrical Power, Lighting & DBs', group: 'MEP' },
    { num: '21', id: '21_HVAC', name: 'HVAC Air Handling, VRF & Ducting', group: 'MEP' },
    { num: '22', id: '22_PLUMBING', name: 'Water Supply & Sanitary Drainage', group: 'MEP' },
    { num: '23', id: '23_FIRE_FIGHTING', name: 'Fire Protection Sprinklers & Pumps', group: 'MEP' },
    { num: '24', id: '24_ELV', name: 'Extra Low Voltage, Fire Alarm & CCTV', group: 'MEP' },
    { num: '25', id: '25_EXTERNAL_WORKS', name: 'External Infrastructure & Paving', group: 'Discipline' },
    { num: '26', id: '26_MATERIAL_SUMMARY', name: 'Comprehensive Material Schedule', group: 'Summary' },
    { num: '27', id: '27_LEVEL_SUMMARY', name: 'Building Level-Wise Cost & Qty Breakdown', group: 'Summary' },
    { num: '28', id: '28_TRADE_SUMMARY', name: 'Trade-Wise BOQ Summary (A to AA)', group: 'Summary' },
    { num: '29', id: '29_DRAWING_REGISTER', name: 'Drawing Traceability Register', group: 'Audit' },
    { num: '30', id: '30_CALCULATION_REGISTER', name: 'Calculation Math Derivation Register', group: 'Audit' },
    { num: '31', id: '31_OPEN_ITEMS', name: 'Open Clarifications & RFI Register', group: 'Audit' },
    { num: '32', id: '32_CONFLICTS', name: 'Inter-Disciplinary Conflict Register', group: 'Audit' },
    { num: '33', id: '33_USER_CORRECTIONS', name: 'Manual Override & Audit Trail Register', group: 'Audit' },
    { num: '34', id: '34_REVISION_HISTORY', name: 'BOQ Revision & Snapshot History', group: 'Audit' },
    { num: '35', id: '35_ASSUMPTIONS', name: 'Project Assumptions & Exclusions Log', group: 'Audit' }
  ];

  const handleExport = () => {
    setIsExporting(true);
    setExportSuccess(false);

    try {
      const config: ExcelWorkbookExportConfig = {
        projectName,
        projectNumber,
        clientName,
        consultantName,
        currency,
        revision,
        signOff,
        exportPreset,
        includeFormulas
      };

      const result = MasterBoqExcelEngine.exportMasterWorkbook(items, config);
      if (result.success) {
        setDownloadedFileName(result.fileName);
        setExportSuccess(true);
      }
    } catch (err) {
      console.error('Excel Export Failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl my-6 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-700/60 rounded-xl border border-emerald-500/40">
              <FileSpreadsheet className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Phase 15F — Master 35-Sheet Professional Excel Workbook Engine</h2>
              <p className="text-xs text-emerald-200 mt-0.5 font-medium">
                Standard Compliant Tender BOQ • 35 Synchronized Worksheets • Full Audit & Math Traceability
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-emerald-200 hover:text-white hover:bg-emerald-700/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          {/* Preset Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
              Select Export Package Preset:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {[
                {
                  id: 'FULL_35_SHEET_MASTER',
                  title: '35-Sheet Master Workbook',
                  desc: 'All 35 sheets: Cover, BOQ, Disciplines, Summaries & Audit trails',
                  badge: 'Recommended',
                  badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200'
                },
                {
                  id: 'TENDER_BOQ_PACKAGE',
                  title: 'Tender BOQ Package',
                  desc: 'Sheets 01-04 + Trade Summary for Client / Bidder submission',
                  badge: 'Standard Bid',
                  badgeColor: 'bg-blue-100 text-blue-800 border-blue-200'
                },
                {
                  id: 'DISCIPLINE_PACKAGE',
                  title: 'Discipline Schedules',
                  desc: 'Detailed engineering takeoff schedules (Sheets 05 to 25)',
                  badge: 'Engineering',
                  badgeColor: 'bg-purple-100 text-purple-800 border-purple-200'
                },
                {
                  id: 'AUDIT_PACKAGE',
                  title: 'Governance & Audit Package',
                  desc: 'Reconciliation, Calculations, Open Items, Conflicts & Diff log',
                  badge: 'QA / Audit',
                  badgeColor: 'bg-amber-100 text-amber-800 border-amber-200'
                }
              ].map(preset => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setExportPreset(preset.id as any)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    exportPreset === preset.id
                      ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm text-slate-900">{preset.title}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${preset.badgeColor}`}>
                      {preset.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{preset.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Project & Sign-off Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                Project Header Metadata
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Project Title:</span>
                  <span className="font-semibold text-slate-800">{projectName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Project Number:</span>
                  <span className="font-semibold text-slate-800">{projectNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Client / Employer:</span>
                  <span className="font-semibold text-slate-800">{clientName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Lead Consultant:</span>
                  <span className="font-semibold text-slate-800">{consultantName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Base Currency:</span>
                  <span className="font-semibold text-slate-800">{currency}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">BOQ Revision:</span>
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded inline-block">
                    {revision} (Frozen)
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Governance & Sign-Off Authorization
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Prepared By:</span>
                  <input
                    type="text"
                    value={signOff.preparedBy}
                    onChange={e => setSignOff({ ...signOff, preparedBy: e.target.value })}
                    className="font-medium text-slate-800 border border-slate-200 rounded px-2 py-0.5 text-right w-64 focus:outline-emerald-500"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Checked By:</span>
                  <input
                    type="text"
                    value={signOff.checkedBy}
                    onChange={e => setSignOff({ ...signOff, checkedBy: e.target.value })}
                    className="font-medium text-slate-800 border border-slate-200 rounded px-2 py-0.5 text-right w-64 focus:outline-emerald-500"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Approved By:</span>
                  <input
                    type="text"
                    value={signOff.approvedBy}
                    onChange={e => setSignOff({ ...signOff, approvedBy: e.target.value })}
                    className="font-medium text-slate-800 border border-slate-200 rounded px-2 py-0.5 text-right w-64 focus:outline-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 35-Sheet Visual Index */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                Workbook Sheet Index (All 35 Worksheets)
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                35 Total Worksheets Ready
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1 border border-slate-100 rounded-lg p-2 bg-slate-50/50">
              {sheetsList.map(sheet => (
                <div
                  key={sheet.id}
                  className="flex items-center gap-2 px-2.5 py-1.5 bg-white border border-slate-200/80 rounded-md text-xs hover:border-emerald-300 transition-colors"
                >
                  <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    {sheet.num}
                  </span>
                  <span className="font-medium text-slate-700 truncate">{sheet.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Export Success Notification */}
          {exportSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-emerald-900">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500 text-white rounded-lg">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">35-Sheet Excel Workbook Exported Successfully!</h4>
                  <p className="text-xs text-emerald-700 font-mono mt-0.5">
                    File: {downloadedFileName}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-200/60 px-3 py-1 rounded-full">
                35 Sheets Bundled
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-slate-600">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeFormulas}
                onChange={e => setIncludeFormulas(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
              <span className="font-medium">Include Live Excel Mathematical Formulas</span>
            </label>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generating 35-Sheet Workbook...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Master 35-Sheet Excel</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
