import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  Settings,
  History,
  ShieldCheck,
  Building2,
  Scale,
  FileText,
  Layers,
  HelpCircle,
  AlertCircle,
  X,
  PlayCircle,
  Palette,
  FileCode,
  Loader2,
  DollarSign,
  Sparkles,
} from 'lucide-react';
import {
  ProjectData,
  DrawingRecord,
  BoqItem,
  DetectedElement,
  BbsBarRecord,
  OpenItem,
  AssumptionRecord,
  RevisionComparison,
  UnifiedBoqItem,
  ExcelExportType,
  ExcelExportMode,
  ExportSettingsConfig,
  ExportHistoryRecord,
  ExportColorTheme,
} from '../types';
import {
  ProfessionalExcelExportEngine,
  DEFAULT_EXPORT_SETTINGS,
  MasterExportPayload,
} from '../engine/professionalExcelExportEngine';
import { THEME_PALETTES } from '../engine/exportThemeEngine';

interface ExportCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectData: ProjectData | null;
  drawings: DrawingRecord[];
  boqItems: UnifiedBoqItem[] | BoqItem[];
  elements: DetectedElement[];
  bbsRecords: BbsBarRecord[];
  openItems: OpenItem[];
  conflicts?: any[];
  assumptions?: AssumptionRecord[];
  exclusions?: any[];
  revisions: RevisionComparison[];
  onOpenTestRunner?: () => void;
}

export function ExportCenterModal({
  isOpen,
  onClose,
  projectData,
  drawings,
  boqItems,
  elements,
  bbsRecords,
  openItems,
  conflicts = [],
  assumptions = [],
  exclusions = [],
  revisions = [],
  onOpenTestRunner,
}: ExportCenterModalProps) {
  const [activeTab, setActiveTab] = useState<'catalog' | 'validation' | 'settings' | 'csv' | 'history'>('catalog');
  const [exportMode, setExportMode] = useState<ExcelExportMode>('FINAL');
  const [settings, setSettings] = useState<ExportSettingsConfig>(DEFAULT_EXPORT_SETTINGS);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [exportProgressText, setExportProgressText] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [excelReadyFile, setExcelReadyFile] = useState<{ fileName: string; buffer: Uint8Array } | null>(null);
  const [exportHistory, setExportHistory] = useState<ExportHistoryRecord[]>(() =>
    ProfessionalExcelExportEngine.getExportHistory()
  );

  // Memoized Master Payload
  const masterPayload: MasterExportPayload = useMemo(
    () => ({
      projectData,
      drawings,
      boqItems,
      elements,
      bbsRecords,
      openItems,
      conflicts,
      assumptions,
      exclusions,
      revisions,
      exportType: 'TENDER_PACKAGE',
      exportMode,
      settings,
    }),
    [
      projectData,
      drawings,
      boqItems,
      elements,
      bbsRecords,
      openItems,
      conflicts,
      assumptions,
      exclusions,
      revisions,
      exportMode,
      settings,
    ]
  );

  // Live Validation Report
  const validationReport = useMemo(
    () => ProfessionalExcelExportEngine.validateExportPayload(masterPayload),
    [masterPayload]
  );

  if (!isOpen) return null;

  // Handle XLSX Generation & Download with 2-step state flow
  const handleExportXlsx = async (type: ExcelExportType, title: string) => {
    if (exportMode === 'FINAL' && !validationReport.canExportFinal) {
      setToastMessage('Export blocked: Resolve critical validation errors before official Final release.');
      setTimeout(() => setToastMessage(null), 4500);
      return;
    }

    setIsExporting(type);
    setExportProgressText('Preparing Professional BOQ with verified totals & styles...');
    setExcelReadyFile(null);

    try {
      const payload: MasterExportPayload = {
        ...masterPayload,
        exportType: type,
      };

      // Real ExcelJS generation with styling & formula validation
      const result = await ProfessionalExcelExportEngine.generateExcelWorkbookAsync(payload);
      
      setExcelReadyFile({
        fileName: result.fileName,
        buffer: result.buffer,
      });

      // Trigger instant direct download
      const blob = new Blob([result.buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      ProfessionalExcelExportEngine.downloadBlob(blob, result.fileName);

      setExportHistory(ProfessionalExcelExportEngine.getExportHistory());
      setToastMessage(`Generated & Downloaded ${title} (${result.fileName})`);
    } catch (err) {
      console.error('Export error:', err);
      setToastMessage('An error occurred while generating Excel file.');
    } finally {
      setIsExporting(null);
      setExportProgressText('');
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  // Handle CSV Download
  const handleDownloadCsv = (datasetKey?: string) => {
    try {
      const csvMap = ProfessionalExcelExportEngine.generateCsvExports(masterPayload);
      if (datasetKey && csvMap[datasetKey]) {
        const blob = new Blob([csvMap[datasetKey]], { type: 'text/csv;charset=utf-8;' });
        const prefix = (projectData?.project?.name || (projectData as any)?.name || 'PROJECT').replace(/[^a-zA-Z0-9_-]/g, '_').toUpperCase();
        ProfessionalExcelExportEngine.downloadBlob(blob, `${prefix}_${datasetKey}`);
        setToastMessage(`Downloaded ${datasetKey}`);
      } else {
        // Download all primary CSVs
        Object.entries(csvMap).forEach(([name, content], idx) => {
          setTimeout(() => {
            const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
            const prefix = (projectData?.project?.name || (projectData as any)?.name || 'PROJECT').replace(/[^a-zA-Z0-9_-]/g, '_').toUpperCase();
            ProfessionalExcelExportEngine.downloadBlob(blob, `${prefix}_${name}`);
          }, idx * 200);
        });
        setToastMessage('Downloaded all structured CSV datasets.');
      }
    } catch (err) {
      console.error('CSV Export Error:', err);
      setToastMessage('Failed to generate CSV export.');
    } finally {
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const catalogOptions: {
    type: ExcelExportType;
    title: string;
    description: string;
    sheets: string;
    icon: React.ElementType;
    isPrimary?: boolean;
  }[] = [
    {
      type: 'TENDER_PACKAGE',
      title: 'Complete Tender Package',
      description: 'Comprehensive 13-Sheet master workbook: Cover, Priced BOQ, Detailed Takeoff, Calculations, BBS, Steel, Registers & Pricing.',
      sheets: '13 Dedicated Sheets',
      icon: FileSpreadsheet,
      isPrimary: true,
    },
    {
      type: 'BOQ_SUMMARY',
      title: 'Main BOQ Schedule',
      description: 'Standard priced bill with hierarchical section headings, subtotals, AED currency, and Grand Total.',
      sheets: 'Priced BOQ',
      icon: Scale,
    },
    {
      type: 'BOQ_DETAILED',
      title: 'Detailed Quantity Takeoff',
      description: 'Spatial hierarchy breakdown by Building, Level, Zone, Gross Qty, Deductions, and Drawing Ref.',
      sheets: 'Detailed Takeoff',
      icon: Layers,
    },
    {
      type: 'BBS_SCHEDULE',
      title: 'Bar Bending Schedule (BBS)',
      description: 'BS 8666 / IS 2502 compliant rebar schedule with bar marks, shape codes, dimensions, and diameter breakdown.',
      sheets: 'Rebar BBS',
      icon: Building2,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden text-slate-100">
        
        {/* Toast Notification */}
        {toastMessage && (
          <div className="absolute top-4 right-4 z-50 bg-emerald-950 border border-emerald-500 text-emerald-100 px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-200 text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/20 border border-blue-500/30 rounded-lg text-blue-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100">Professional Export & BOQ Presentation Suite</h2>
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded">
                  IS 1200 / POMI / CESMM4
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded">
                  Currency: {settings.currency}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate formatted, client-presentable Excel workbooks (.xlsx) and clean UTF-8 CSV datasets.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onOpenTestRunner && (
              <button
                onClick={onOpenTestRunner}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-2 transition"
                title="Run comprehensive 76-point export quality audit"
              >
                <PlayCircle className="w-4 h-4" />
                <span>Run Export Test Suite</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs & Status Bar */}
        <div className="px-6 py-2 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-2 ${
                activeTab === 'catalog'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Workbook Catalog</span>
            </button>

            <button
              onClick={() => setActiveTab('csv')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-2 ${
                activeTab === 'csv'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>CSV Clean Data</span>
            </button>

            <button
              onClick={() => setActiveTab('validation')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-2 ${
                activeTab === 'validation'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Pre-Flight Validation</span>
              {validationReport.criticalErrorsCount > 0 ? (
                <span className="px-1.5 py-0.2 bg-red-500/20 text-red-400 rounded-full font-bold">
                  {validationReport.criticalErrorsCount}
                </span>
              ) : (
                <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 rounded-full font-bold">
                  100%
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-2 ${
                activeTab === 'settings'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Theme & Formatting</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-2 ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Export History</span>
              <span className="text-slate-500">({exportHistory.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-400">Export Governance:</span>
            <div className="flex bg-slate-900 border border-slate-700 rounded-lg p-0.5">
              <button
                onClick={() => setExportMode('DRAFT')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                  exportMode === 'DRAFT'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                DRAFT / INTERNAL
              </button>
              <button
                onClick={() => setExportMode('FINAL')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                  exportMode === 'FINAL'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                FINAL CONTRACT TENDER
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Progress / Loading Banner */}
          {isExporting && (
            <div className="bg-blue-950/80 border border-blue-500/50 rounded-xl p-4 flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                <div>
                  <div className="font-semibold text-blue-200">Preparing Professional BOQ...</div>
                  <div className="text-xs text-blue-300/80">{exportProgressText}</div>
                </div>
              </div>
              <div className="text-xs font-mono text-blue-400 bg-blue-900/60 px-3 py-1 rounded">
                Theme: {settings.colorTheme} | {settings.currency}
              </div>
            </div>
          )}

          {/* Excel Ready Banner */}
          {excelReadyFile && !isExporting && (
            <div className="bg-emerald-950/80 border border-emerald-500/50 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <div>
                  <div className="font-semibold text-emerald-200">Excel Ready: {excelReadyFile.fileName}</div>
                  <div className="text-xs text-emerald-300/80">
                    File compiled with full borders, styling, formulas, print setup, and grand total reconciliation.
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const blob = new Blob([excelReadyFile.buffer], {
                      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    });
                    ProfessionalExcelExportEngine.downloadBlob(blob, excelReadyFile.fileName);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center gap-2 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>[ DOWNLOAD XLSX ]</span>
                </button>
                <button
                  onClick={() => handleDownloadCsv('BOQ.csv')}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg flex items-center gap-2 transition"
                >
                  <FileCode className="w-4 h-4" />
                  <span>[ DOWNLOAD CSV ]</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: WORKBOOK CATALOG */}
          {activeTab === 'catalog' && (
            <div className="space-y-6">
              {/* Primary Master Export Banner */}
              <div className="p-5 bg-gradient-to-r from-blue-950/80 to-slate-900 border border-blue-500/40 rounded-xl flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-400" />
                    <h3 className="text-base font-bold text-white">Full Tender Package (Multi-Sheet XLSX)</h3>
                    <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-300 rounded font-semibold">
                      Print-Ready & Client-Presentable
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                    Builds all 13 sheets (Cover Summary, Priced BOQ with section subtotals, Detailed Takeoff, Calculation Logs, BBS, Steel, Registers, and Pricing Summary) in theme <span className="font-semibold text-blue-300">{settings.colorTheme}</span> with currency <span className="font-semibold text-blue-300">{settings.currency}</span>.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleExportXlsx('TENDER_PACKAGE', 'Complete Tender Package')}
                    disabled={Boolean(isExporting)}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-blue-600/30 flex items-center gap-2 transition disabled:opacity-50"
                  >
                    {isExporting === 'TENDER_PACKAGE' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>[ DOWNLOAD EXCEL ]</span>
                  </button>

                  <button
                    onClick={() => handleDownloadCsv()}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-2 transition"
                  >
                    <FileCode className="w-4 h-4" />
                    <span>[ DOWNLOAD CSV ]</span>
                  </button>
                </div>
              </div>

              {/* Sub-Catalog Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {catalogOptions.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <div
                      key={opt.type}
                      className="p-4 bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-xl flex flex-col justify-between space-y-4 transition"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-slate-800 text-blue-400 rounded-lg">
                              <Icon className="w-4 h-4" />
                            </div>
                            <h4 className="font-bold text-sm text-slate-100">{opt.title}</h4>
                          </div>
                          <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            {opt.sheets}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{opt.description}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-mono">
                          Format: .xlsx (ExcelJS)
                        </span>
                        <button
                          onClick={() => handleExportXlsx(opt.type, opt.title)}
                          disabled={Boolean(isExporting)}
                          className="px-3.5 py-1.5 bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Export Sheet</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CLEAN CSV DATASETS */}
          {activeTab === 'csv' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                <h3 className="text-sm font-bold text-slate-100">Clean Tabular CSV Data Exports</h3>
                <p className="text-xs text-slate-400">
                  Standard UTF-8 comma-separated value tables with clean headers, no merged cells, and plain numbers for direct database or analytics import.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { file: 'BOQ.csv', title: 'Bill of Quantities', desc: 'Item No., Description, Unit, Qty, Rate, Amount' },
                  { file: 'BBS.csv', title: 'Bar Bending Schedule', desc: 'Bar Mark, Dia, Shape, Length, Bars, Total Weight' },
                  { file: 'Steel.csv', title: 'Structural Steel Summary', desc: 'Member Mark, Profile, Grade, Length, Weight' },
                  { file: 'Calculations.csv', title: 'Calculation Logs', desc: 'Element, Notation, Expression, Qty, Unit, Drawing' },
                  { file: 'Drawings.csv', title: 'Drawing Register', desc: 'Drawing ID, Number, Title, Rev, Detected Elements' },
                  { file: 'Open_Items.csv', title: 'Open Items & RFIs', desc: 'Item ID, Element, Description, Status, Action' },
                ].map((item) => (
                  <div key={item.file} className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-lg flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-200">{item.title}</span>
                        <span className="text-[10px] font-mono bg-blue-950 text-blue-300 px-1.5 py-0.5 rounded border border-blue-800">
                          {item.file}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => handleDownloadCsv(item.file)}
                      className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download {item.file}</span>
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => handleDownloadCsv()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Download All CSVs</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PRE-FLIGHT VALIDATION */}
          {activeTab === 'validation' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Export Integrity & Total Reconciliation</h3>
                  <p className="text-xs text-slate-400">
                    Automated 9-point rule check confirming 100% balanced totals and zero missing technical data.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Overall Status:</span>
                  {validationReport.criticalErrorsCount === 0 ? (
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      READY FOR FINAL TENDER
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                      {validationReport.criticalErrorsCount} BLOCKING ISSUES
                    </span>
                  )}
                </div>
              </div>

              {/* Total Reconciliation Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-lg">
                  <div className="text-xs text-slate-400">BOQ Grand Total</div>
                  <div className="text-lg font-bold text-emerald-400 mt-1">
                    {settings.currency} {validationReport.reconciliation.boqGrandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Sum of all priced trade items</div>
                </div>

                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-lg">
                  <div className="text-xs text-slate-400">Total Rebar (BBS Weight)</div>
                  <div className="text-lg font-bold text-blue-400 mt-1">
                    {validationReport.reconciliation.bbsTotalWeightKg.toLocaleString(undefined, { minimumFractionDigits: 2 })} kg
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Rebar schedule balance check</div>
                </div>

                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-lg">
                  <div className="text-xs text-slate-400">Structural Steel Total</div>
                  <div className="text-lg font-bold text-purple-400 mt-1">
                    {validationReport.reconciliation.steelSummaryTonne.toLocaleString(undefined, { minimumFractionDigits: 2 })} Tonne
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Steel framework balance check</div>
                </div>
              </div>

              {/* Rules List */}
              <div className="space-y-2">
                {validationReport.rules.map((rule) => (
                  <div
                    key={rule.ruleId}
                    className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      {rule.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : rule.severity === 'CRITICAL' ? (
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      )}
                      <div>
                        <div className="font-semibold text-slate-200">{rule.ruleName}</div>
                        <div className="text-slate-400 text-[11px]">{rule.message}</div>
                      </div>
                    </div>
                    <span className="font-mono text-slate-500 text-[11px]">{rule.ruleId}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: THEME & FORMATTING SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-5 max-w-4xl">
              
              {/* Color Theme Selection */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-bold text-slate-100">Excel Palette Theme</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(Object.keys(THEME_PALETTES) as ExportColorTheme[]).map((themeKey) => {
                    const t = THEME_PALETTES[themeKey];
                    const isSelected = settings.colorTheme === themeKey;
                    return (
                      <button
                        key={themeKey}
                        onClick={() => setSettings({ ...settings, colorTheme: themeKey })}
                        className={`p-3 rounded-lg border text-left transition flex flex-col justify-between space-y-2 ${
                          isSelected
                            ? 'bg-slate-800 border-blue-500 shadow-md ring-1 ring-blue-500'
                            : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-200">{t.name}</span>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
                        </div>
                        <div className="flex gap-1.5">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: `#${t.primaryArgb.slice(2)}` }} />
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: `#${t.subSectionArgb.slice(2)}` }} />
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: `#${t.grandTotalBgArgb.slice(2)}` }} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Currency & Financial Standards */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-slate-100">Currency & Financial Settings</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Pricing Currency (Default: AED)</label>
                    <select
                      value={settings.currency}
                      onChange={(e) => setSettings({ ...settings, currency: e.target.value, currencySymbol: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-bold"
                    >
                      <option value="AED">AED (UAE Dirham)</option>
                      <option value="SAR">SAR (Saudi Riyal)</option>
                      <option value="QAR">QAR (Qatari Riyal)</option>
                      <option value="USD">USD (US Dollar)</option>
                      <option value="EUR">EUR (Euro)</option>
                      <option value="GBP">GBP (British Pound)</option>
                      <option value="INR">INR (Indian Rupee)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Tender Revision</label>
                    <input
                      type="text"
                      value={settings.revision || 'Rev 01'}
                      onChange={(e) => setSettings({ ...settings, revision: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Value Added Tax (VAT %)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={Boolean(settings.enableVat)}
                        onChange={(e) => setSettings({ ...settings, enableVat: e.target.checked })}
                        className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
                      />
                      <span className="text-xs text-slate-300">Apply VAT</span>
                      <input
                        type="number"
                        step="0.1"
                        value={settings.vatRatePercent || 5.0}
                        onChange={(e) => setSettings({ ...settings, vatRatePercent: parseFloat(e.target.value) || 0 })}
                        disabled={!settings.enableVat}
                        className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 disabled:opacity-40"
                      />
                      <span className="text-xs text-slate-400">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stakeholders & Governance */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                <h3 className="text-sm font-bold text-slate-100">Cover Page Stakeholders & Sign-Off</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Contractor / Bidder Name</label>
                    <input
                      type="text"
                      value={settings.contractorName || ''}
                      placeholder="e.g. Al Naboodah Construction Group"
                      onChange={(e) => setSettings({ ...settings, contractorName: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Lead Consultant Name</label>
                    <input
                      type="text"
                      value={settings.consultantName || ''}
                      placeholder="e.g. AECOM Middle East"
                      onChange={(e) => setSettings({ ...settings, consultantName: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Prepared By (Senior QS)</label>
                    <input
                      type="text"
                      value={settings.preparedBy || ''}
                      onChange={(e) => setSettings({ ...settings, preparedBy: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Approved By (Commercial Director)</label>
                    <input
                      type="text"
                      value={settings.approvedBy || ''}
                      onChange={(e) => setSettings({ ...settings, approvedBy: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: EXPORT HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Export Audit Log & History</h3>
                  <p className="text-xs text-slate-400">
                    Track all generated Excel workbooks, time stamps, and reconciliation states.
                  </p>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {exportHistory.length} Record(s) Stored
                </span>
              </div>

              {exportHistory.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No export records yet. Click "[ DOWNLOAD EXCEL ]" to generate your first professional package.
                </div>
              ) : (
                <div className="space-y-2">
                  {exportHistory.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-950 text-blue-400 rounded">
                          <FileSpreadsheet className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-200">{rec.fileName}</div>
                          <div className="text-slate-400 text-[11px] flex items-center gap-2 mt-0.5">
                            <span>{new Date(rec.timestamp).toLocaleString()}</span>
                            <span>•</span>
                            <span>{rec.sheetsCount} Sheets</span>
                            <span>•</span>
                            <span>{rec.totalItems} Items</span>
                            <span>•</span>
                            <span>{(rec.fileSizeBytes / 1024).toFixed(1)} KB</span>
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-semibold text-[11px]">
                        {rec.reconciliationStatus}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="text-slate-400 flex items-center gap-2">
            <span>Standard:</span>
            <span className="font-mono text-slate-300">IS 1200 / POMI / CESMM4</span>
            <span>•</span>
            <span>Currency:</span>
            <span className="font-mono font-bold text-emerald-400">{settings.currency}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg transition"
            >
              Close
            </button>
            <button
              onClick={() => handleExportXlsx('TENDER_PACKAGE', 'Complete Tender Package')}
              disabled={Boolean(isExporting)}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg shadow-blue-600/30 flex items-center gap-2 transition disabled:opacity-50"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>[ DOWNLOAD EXCEL ]</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
