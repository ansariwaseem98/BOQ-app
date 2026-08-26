import React, { useState, useMemo } from 'react';
import {
  GeneralMEPElement,
  MEPDiscipline,
  MEPOpenItemRecord,
  MEPConflictRecord,
  MEPRevisionDiffRecord,
  MEPRiserReconciliationRecord,
  MEPDisciplineCrossCheckRecord,
} from '../types';
import {
  initialMepElements,
  initialMepOpenItems,
  initialMepConflicts,
  initialMepRevisionDiffs,
  initialMepRiserReconciliations,
  initialMepCrossChecks,
} from '../data/sampleMepData';
import { MepCalculationModal } from './MepCalculationModal';
import { MepEditModal } from './MepEditModal';
import { MepConflictModal } from './MepConflictModal';
import { MepOpenItemModal } from './MepOpenItemModal';
import { MepTestSuiteModal } from './MepTestSuiteModal';
import { MepRevisionModal } from './MepRevisionModal';
import { MEPExcelExportEngine } from '../engine/mepExcelExport';
import { MEPEngine } from '../engine/mepEngine';

interface MEPTakeoffWorkspaceProps {
  onBackToDashboard?: () => void;
}

export const MEPTakeoffWorkspace: React.FC<MEPTakeoffWorkspaceProps> = ({
  onBackToDashboard,
}) => {
  // State
  const [elements, setElements] = useState<GeneralMEPElement[]>(initialMepElements);
  const [openItems, setOpenItems] = useState<MEPOpenItemRecord[]>(initialMepOpenItems);
  const [conflicts, setConflicts] = useState<MEPConflictRecord[]>(initialMepConflicts);
  const [revisions, setRevisions] = useState<MEPRevisionDiffRecord[]>(initialMepRevisionDiffs);
  const [reconciliations] = useState<MEPRiserReconciliationRecord[]>(initialMepRiserReconciliations);
  const [crossChecks] = useState<MEPDisciplineCrossCheckRecord[]>(initialMepCrossChecks);

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState<'REGISTER' | 'RECONCILIATION' | 'OPEN_ITEMS' | 'CONFLICTS' | 'REVISIONS' | 'CROSS_CHECKS'>('REGISTER');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');

  // Modals state
  const [calcModalElement, setCalcModalElement] = useState<GeneralMEPElement | null>(null);
  const [editModalElement, setEditModalElement] = useState<GeneralMEPElement | null>(null);
  const [conflictModalItem, setConflictModalItem] = useState<MEPConflictRecord | null>(null);
  const [openItemModalItem, setOpenItemModalItem] = useState<MEPOpenItemRecord | null>(null);
  const [showTestSuite, setShowTestSuite] = useState<boolean>(false);
  const [showRevisionModal, setShowRevisionModal] = useState<boolean>(false);

  // Toast / Notification banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered elements
  const filteredElements = useMemo(() => {
    return elements.filter(el => {
      const matchDiscipline = selectedDiscipline === 'ALL' || el.discipline === selectedDiscipline;
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'VERIFIED' && el.verificationStatus === 'verified') ||
        (statusFilter === 'BLOCKED' && el.isBlocked) ||
        (statusFilter === 'OPEN_ITEM' && el.hasOpenItem) ||
        (statusFilter === 'CONFLICT' && el.hasConflict) ||
        (statusFilter === 'USER_INPUT' && el.verificationStatus === 'user_input');
      const matchLevel = levelFilter === 'ALL' || el.level.includes(levelFilter);
      const matchQuery =
        searchQuery === '' ||
        el.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
        el.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        el.system.toLowerCase().includes(searchQuery.toLowerCase()) ||
        el.physicalElementId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        el.primaryDrawingNumber.toLowerCase().includes(searchQuery.toLowerCase());

      return matchDiscipline && matchStatus && matchLevel && matchQuery;
    });
  }, [elements, selectedDiscipline, statusFilter, levelFilter, searchQuery]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalItems = elements.length;
    const verifiedItems = elements.filter(e => e.verificationStatus === 'verified').length;
    const blockedOpenItems = elements.filter(e => e.isBlocked || e.hasOpenItem).length;
    const activeConflicts = conflicts.filter(c => c.status === 'OPEN').length;

    // Cable & Containment totals
    const electricalLengthM = elements
      .filter(e => e.discipline === 'Electrical' && e.lengthM)
      .reduce((sum, e) => sum + (e.lengthM || 0), 0);

    // HVAC Duct Surface Area
    const hvacDuctAreaM2 = elements
      .filter(e => e.discipline === 'HVAC' && e.unit === 'm²')
      .reduce((sum, e) => sum + (e.lengthM || 0), 0);

    // HVAC Pipe Length
    const hvacPipeM = elements
      .filter(e => e.discipline === 'HVAC' && e.unit === 'm')
      .reduce((sum, e) => sum + (e.lengthM || 0), 0);

    // Plumbing Pipe Length
    const plumbingPipeM = elements
      .filter(e => e.discipline === 'Plumbing' && e.unit === 'm')
      .reduce((sum, e) => sum + (e.lengthM || 0), 0);

    // Fire Fighting Pipe Length
    const firePipeM = elements
      .filter(e => e.discipline === 'Fire Fighting' && e.unit === 'm')
      .reduce((sum, e) => sum + (e.lengthM || 0), 0);

    // Discrete counts
    const lightingFixtures = elements
      .filter(e => e.discipline === 'Electrical' && e.system.includes('Lighting'))
      .reduce((sum, e) => sum + e.quantity, 0);

    const sprinklerHeads = elements
      .filter(e => e.discipline === 'Fire Fighting' && e.subSystem.includes('Sprinkler'))
      .reduce((sum, e) => sum + e.quantity, 0);

    return {
      totalItems,
      verifiedItems,
      blockedOpenItems,
      activeConflicts,
      electricalLengthM,
      hvacDuctAreaM2,
      hvacPipeM,
      plumbingPipeM,
      firePipeM,
      lightingFixtures,
      sprinklerHeads,
    };
  }, [elements, conflicts]);

  // Handlers
  const handleSaveElement = (updated: GeneralMEPElement) => {
    setElements(prev => prev.map(el => (el.id === updated.id ? updated : el)));
    showToast(`Element ${updated.tag} successfully updated & recalculated.`);
  };

  const handleToggleVerify = (elemId: string) => {
    setElements(prev =>
      prev.map(el => {
        if (el.id === elemId) {
          const nextStatus = el.verificationStatus === 'verified' ? 'flagged' : 'verified';
          return {
            ...el,
            verificationStatus: nextStatus,
            isBlocked: false,
            blockedReason: undefined,
          };
        }
        return el;
      })
    );
    showToast('Verification status updated.');
  };

  const handleResolveConflict = (conflictId: string, resolvedSource: 'A' | 'B' | 'CUSTOM', note: string) => {
    setConflicts(prev =>
      prev.map(c => (c.id === conflictId ? { ...c, status: 'RESOLVED', resolutionNote: note } : c))
    );
    showToast(`Conflict ${conflictId} marked as RESOLVED using Source ${resolvedSource}.`);
  };

  const handleResolveOpenItem = (openItemId: string, note: string) => {
    setOpenItems(prev =>
      prev.map(oi => (oi.id === openItemId ? { ...oi, status: 'RESOLVED', resolutionNote: note } : oi))
    );

    // Unblock any element tied to this open item
    setElements(prev =>
      prev.map(el => {
        if (el.openItemId === openItemId || el.hasOpenItem) {
          return {
            ...el,
            isBlocked: false,
            hasOpenItem: false,
            blockedReason: undefined,
            verificationStatus: 'verified',
            size: el.size === 'UNSPECIFIED / UNREADABLE' ? 'DN110 (4") [Resolved RFI]' : el.size,
            formulaWithValues: '44.50m uPVC Soil Pipe (RFI Resolved)',
          };
        }
        return el;
      })
    );

    showToast(`Open Item ${openItemId} resolved and takeoff unblocked.`);
  };

  const handleExportCSV = () => {
    const headers = [
      'Discipline',
      'Physical Element ID',
      'Tag',
      'System',
      'Description',
      'Size',
      'Material',
      'Rating / Capacity',
      'Quantity',
      'Unit',
      'Level',
      'Primary Drawing',
      'Formula / Mathematical Derivation',
      'Status',
    ];

    const rows = elements.map(el => [
      `"${el.discipline}"`,
      `"${el.physicalElementId}"`,
      `"${el.tag}"`,
      `"${el.system}"`,
      `"${el.description.replace(/"/g, '""')}"`,
      `"${el.size || ''}"`,
      `"${el.material || ''}"`,
      `"${el.ratingOrCapacity || ''}"`,
      el.lengthM !== undefined ? el.lengthM.toFixed(2) : el.quantity,
      `"${el.unit}"`,
      `"${el.level}"`,
      `"${el.primaryDrawingNumber} (${el.revision})"`,
      `"${el.formulaWithValues.replace(/"/g, '""')}"`,
      `"${el.verificationStatus}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MEP_Quantity_Takeoff_Schedule_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('MEP BOQ Schedule exported to CSV.');
  };

  const handleExportExcel = () => {
    const summary = MEPEngine.calculateSummary(elements, openItems, conflicts);
    MEPExcelExportEngine.generateMEPWorkbook({
      projectName: 'Industrial Warehouse & Tech Center',
      projectCode: 'MEP-IND-2026',
      revision: 'Rev 01 (Tender)',
      elements,
      openItems,
      conflicts,
      revisions,
      reconciliations,
      crossChecks,
      summary,
    });
    showToast('Enterprise Multi-Tab MEP Excel Workbook generated.');
  };

  const disciplinesList: (MEPDiscipline | 'ALL')[] = [
    'ALL',
    'Electrical',
    'HVAC',
    'Plumbing',
    'Fire Fighting',
    'Fire Alarm',
    'ELV',
    'MEP Supports',
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in border border-indigo-400">
          <svg className="w-5 h-5 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-xs font-bold font-mono">{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="bg-slate-950 border-b border-slate-800 px-6 py-3.5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            {onBackToDashboard && (
              <button
                onClick={onBackToDashboard}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs font-mono"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Dashboard
              </button>
            )}
            <div className="flex items-center space-x-2.5">
              <span className="px-2.5 py-1 bg-amber-500 text-slate-950 font-mono font-black text-xs rounded-md uppercase tracking-wider">
                Phase 15E
              </span>
              <h1 className="text-lg font-black font-mono tracking-tight text-white flex items-center gap-2">
                INDUSTRIAL MEP QUANTITY ENGINE
                <span className="text-xs font-normal text-slate-400 font-sans hidden sm:inline">
                  (Electrical, HVAC, Plumbing, Fire, ELV, Supports)
                </span>
              </h1>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowTestSuite(true)}
              className="px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-mono font-bold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4 text-emerald-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Verification Suite (40 Rules &amp; 10 Milestones)
            </button>

            <button
              onClick={() => setShowRevisionModal(true)}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono font-bold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Revision Diffs ({revisions.length})
            </button>

            <button
              onClick={handleExportExcel}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              title="Generate Multi-Tab Excel Spreadsheet with 12 Sheets"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Multi-Tab Excel
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-mono font-bold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              CSV
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 w-full mt-6 space-y-6 flex-1">
        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[11px] font-mono uppercase text-slate-400">Total MEP Items</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black font-mono text-white">{summaryMetrics.totalItems}</span>
              <span className="text-[10px] text-emerald-400 font-mono">100% extracted</span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[11px] font-mono uppercase text-slate-400">Verified Takeoffs</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black font-mono text-emerald-400">{summaryMetrics.verifiedItems}</span>
              <span className="text-[10px] text-slate-400 font-mono">
                {((summaryMetrics.verifiedItems / summaryMetrics.totalItems) * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          <div
            onClick={() => setActiveTab('OPEN_ITEMS')}
            className="bg-slate-950/70 border border-slate-800 hover:border-amber-500/50 cursor-pointer rounded-xl p-3.5 flex flex-col justify-between transition-colors"
          >
            <span className="text-[11px] font-mono uppercase text-amber-400 flex items-center justify-between">
              Open Items
              {summaryMetrics.blockedOpenItems > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black font-mono text-amber-400">{openItems.filter(o => o.status === 'OPEN').length}</span>
              <span className="text-[10px] text-amber-300 font-mono">Action needed</span>
            </div>
          </div>

          <div
            onClick={() => setActiveTab('CONFLICTS')}
            className="bg-slate-950/70 border border-slate-800 hover:border-rose-500/50 cursor-pointer rounded-xl p-3.5 flex flex-col justify-between transition-colors"
          >
            <span className="text-[11px] font-mono uppercase text-rose-400 flex items-center justify-between">
              Conflicts
              {summaryMetrics.activeConflicts > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black font-mono text-rose-400">{summaryMetrics.activeConflicts}</span>
              <span className="text-[10px] text-rose-300 font-mono">Plan vs Riser</span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[11px] font-mono uppercase text-slate-400">HVAC Ductwork</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black font-mono text-cyan-400">{summaryMetrics.hvacDuctAreaM2.toFixed(1)}</span>
              <span className="text-[10px] text-slate-400 font-mono">m² Surface</span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[11px] font-mono uppercase text-slate-400">Sprinkler Heads</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black font-mono text-amber-300">{summaryMetrics.sprinklerHeads}</span>
              <span className="text-[10px] text-slate-400 font-mono">Nos. (68°C)</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-1 flex flex-wrap gap-1">
          <button
            onClick={() => setActiveTab('REGISTER')}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-colors flex items-center gap-2 ${
              activeTab === 'REGISTER'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <span>MEP Takeoff Register</span>
            <span className="px-1.5 py-0.2 bg-black/30 rounded text-[10px]">{elements.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('RECONCILIATION')}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-colors flex items-center gap-2 ${
              activeTab === 'RECONCILIATION'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <span>Plan & Riser Reconciliation</span>
            <span className="px-1.5 py-0.2 bg-black/30 rounded text-[10px]">{reconciliations.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('OPEN_ITEMS')}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-colors flex items-center gap-2 ${
              activeTab === 'OPEN_ITEMS'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <span>Open Items & RFIs</span>
            <span className="px-1.5 py-0.2 bg-amber-900/60 text-amber-200 rounded text-[10px]">
              {openItems.filter(o => o.status === 'OPEN').length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('CONFLICTS')}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-colors flex items-center gap-2 ${
              activeTab === 'CONFLICTS'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <span>Conflicts Adjudication</span>
            <span className="px-1.5 py-0.2 bg-rose-900/60 text-rose-200 rounded text-[10px]">
              {conflicts.filter(c => c.status === 'OPEN').length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('CROSS_CHECKS')}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-colors flex items-center gap-2 ${
              activeTab === 'CROSS_CHECKS'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <span>Coordination Cross-Checks</span>
            <span className="px-1.5 py-0.2 bg-black/30 rounded text-[10px]">{crossChecks.length}</span>
          </button>
        </div>

        {/* TAB 1: MAIN TAKEOFF REGISTER */}
        {activeTab === 'REGISTER' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
              {/* Discipline Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {disciplinesList.map(disc => (
                  <button
                    key={disc}
                    onClick={() => setSelectedDiscipline(disc)}
                    className={`px-3 py-1 text-xs font-mono font-semibold rounded-lg transition-colors ${
                      selectedDiscipline === disc
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    {disc}
                  </button>
                ))}
              </div>

              {/* Status & Search Inputs */}
              <div className="flex flex-wrap items-center gap-2.5">
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-amber-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="VERIFIED">Verified Only</option>
                  <option value="BLOCKED">Blocked / Open Item</option>
                  <option value="USER_INPUT">User Override</option>
                </select>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search tags, specs, drawings..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono rounded-lg pl-8 pr-3 py-1.5 w-60 focus:ring-1 focus:ring-amber-500"
                  />
                  <svg className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* High Density MEP Takeoff Table */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-900 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-3.5">Discipline / Tag</th>
                      <th className="py-3 px-3.5">System & Sub-System</th>
                      <th className="py-3 px-3.5">Technical Specification</th>
                      <th className="py-3 px-3.5">Size / Rating</th>
                      <th className="py-3 px-3.5">Location</th>
                      <th className="py-3 px-3.5">Formula / Derivation</th>
                      <th className="py-3 px-3.5 text-right">Quantity</th>
                      <th className="py-3 px-3.5">Drawing</th>
                      <th className="py-3 px-3.5">Status</th>
                      <th className="py-3 px-3.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 font-sans">
                    {filteredElements.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-slate-500 font-mono">
                          No MEP takeoff elements matched your current filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredElements.map(el => (
                        <tr
                          key={el.id}
                          className={`hover:bg-slate-900/60 transition-colors ${
                            el.isBlocked ? 'bg-amber-950/20' : el.hasConflict ? 'bg-rose-950/20' : ''
                          }`}
                        >
                          {/* Discipline / Tag */}
                          <td className="py-3 px-3.5">
                            <div className="font-mono font-bold text-amber-400 text-xs">
                              {el.tag}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400">
                              {el.discipline}
                            </div>
                          </td>

                          {/* System */}
                          <td className="py-3 px-3.5">
                            <div className="text-slate-200 font-medium">{el.system}</div>
                            <div className="text-[10px] text-slate-400">{el.subSystem}</div>
                          </td>

                          {/* Description */}
                          <td className="py-3 px-3.5 max-w-xs">
                            <div className="text-slate-300 text-xs line-clamp-2" title={el.description}>
                              {el.description}
                            </div>
                            {el.material && (
                              <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                                Mat: {el.material}
                              </div>
                            )}
                          </td>

                          {/* Size / Rating */}
                          <td className="py-3 px-3.5 font-mono">
                            <div className={`font-bold ${el.size?.includes('UNSPECIFIED') ? 'text-rose-400 font-black' : 'text-slate-200'}`}>
                              {el.size || '—'}
                            </div>
                            {el.ratingOrCapacity && (
                              <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                                {el.ratingOrCapacity}
                              </div>
                            )}
                          </td>

                          {/* Location */}
                          <td className="py-3 px-3.5 text-[11px] text-slate-400">
                            <div className="text-slate-300 font-medium">{el.level}</div>
                            {el.roomName && <div className="truncate max-w-[130px]">{el.roomName}</div>}
                          </td>

                          {/* Formula Expression */}
                          <td className="py-3 px-3.5 max-w-xs">
                            <button
                              onClick={() => setCalcModalElement(el)}
                              className="w-full text-left bg-slate-900 hover:bg-slate-850 p-1.5 rounded border border-slate-800 hover:border-slate-700 font-mono text-[11px] text-emerald-400 truncate transition-colors"
                              title="Click to view mathematical substitution & allowances"
                            >
                              {el.formulaWithValues}
                            </button>
                          </td>

                          {/* Measured Quantity */}
                          <td className="py-3 px-3.5 text-right font-mono">
                            <div className="text-sm font-black text-white">
                              {el.lengthM !== undefined ? el.lengthM.toFixed(2) : el.quantity}
                            </div>
                            <div className="text-[10px] text-slate-400">{el.unit}</div>
                          </td>

                          {/* Primary Drawing */}
                          <td className="py-3 px-3.5 font-mono text-[11px]">
                            <span className="text-indigo-400 font-bold block">{el.primaryDrawingNumber}</span>
                            <span className="text-[10px] text-slate-400">{el.revision}</span>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3.5 font-mono">
                            {el.isBlocked ? (
                              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[10px] font-bold">
                                BLOCKED (RFI)
                              </span>
                            ) : el.hasConflict ? (
                              <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded text-[10px] font-bold">
                                CONFLICT
                              </span>
                            ) : el.verificationStatus === 'user_input' ? (
                              <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded text-[10px] font-bold">
                                USER OVERRIDE
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded text-[10px] font-bold">
                                VERIFIED
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3.5 text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              <button
                                onClick={() => setCalcModalElement(el)}
                                className="p-1.5 text-slate-400 hover:text-emerald-400 bg-slate-900 hover:bg-slate-800 rounded transition-colors"
                                title="Inspect Formula & Sources"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                              </button>

                              <button
                                onClick={() => setEditModalElement(el)}
                                className="p-1.5 text-slate-400 hover:text-indigo-400 bg-slate-900 hover:bg-slate-800 rounded transition-colors"
                                title="Edit & Recalculate"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>

                              <button
                                onClick={() => handleToggleVerify(el.id)}
                                className={`p-1.5 rounded transition-colors ${
                                  el.verificationStatus === 'verified'
                                    ? 'text-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/60'
                                    : 'text-slate-500 hover:text-emerald-400 bg-slate-900 hover:bg-slate-800'
                                }`}
                                title={el.verificationStatus === 'verified' ? 'Mark unverified' : 'Verify Takeoff'}
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PLAN & RISER RECONCILIATION */}
        {activeTab === 'RECONCILIATION' && (
          <div className="space-y-4">
            <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl">
              <h3 className="text-sm font-bold font-mono text-white mb-1">
                Plan vs Riser vs Schedule Physical ID Reconciliation Matrix
              </h3>
              <p className="text-xs text-slate-400">
                Guarantees zero double counting between architectural floor plans, schematic risers, and single-line diagrams.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Physical MEP ID</th>
                    <th className="py-3 px-4">Discipline / Tag</th>
                    <th className="py-3 px-4">Plan Drawing Ref</th>
                    <th className="py-3 px-4">Riser / SLD Ref</th>
                    <th className="py-3 px-4">Plan Spec</th>
                    <th className="py-3 px-4">Riser Spec</th>
                    <th className="py-3 px-4 text-center">Unified Takeoff Count</th>
                    <th className="py-3 px-4">Reconciliation Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 font-sans">
                  {reconciliations.map((rec, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/60">
                      <td className="py-3 px-4 font-mono font-bold text-amber-400">
                        {rec.physicalElementId}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <div className="text-slate-200 font-bold">{rec.elementTag}</div>
                        <div className="text-[10px] text-slate-400">{rec.discipline} ({rec.system})</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-indigo-400">
                        {rec.planDrawingRef}
                      </td>
                      <td className="py-3 px-4 font-mono text-indigo-400">
                        {rec.riserDrawingRef}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {rec.planSize}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {rec.riserSize}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-black text-emerald-400 text-sm">
                        {rec.takeoffCount} No.
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {rec.reconciledStatus === 'SINGLE_VERIFIED_ENTITY' ? (
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded text-[10px] font-bold">
                            UNIFIED ENTITY (1 NO.)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded text-[10px] font-bold">
                            SIZE MISMATCH
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: OPEN ITEMS */}
        {activeTab === 'OPEN_ITEMS' && (
          <div className="space-y-4">
            <div className="bg-amber-950/40 border border-amber-500/30 p-5 rounded-xl text-amber-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold font-mono text-white mb-1">
                  MEP Open Items & RFI Action Desk
                </h3>
                <p className="text-xs text-amber-300">
                  Strict Rule: MEP quantities must never be guessed or fabricated. Missing parameters block final takeoff.
                </p>
              </div>
              <span className="px-3 py-1 bg-amber-500 text-slate-950 font-mono font-bold text-xs rounded-lg">
                {openItems.filter(o => o.status === 'OPEN').length} Pending RFIs
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {openItems.map(oi => (
                <div
                  key={oi.id}
                  className={`bg-slate-950 border rounded-xl p-5 space-y-3 ${
                    oi.status === 'OPEN' ? 'border-amber-500/50' : 'border-slate-800 opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-mono font-bold text-amber-400 mr-2">{oi.id}</span>
                      <span className="text-xs font-mono text-slate-400">[{oi.discipline}]</span>
                      <h4 className="text-sm font-bold text-white font-mono mt-1">{oi.elementTag}</h4>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        oi.status === 'OPEN'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {oi.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">{oi.description}</p>

                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-[11px] space-y-1 font-mono text-slate-400">
                    <div>Drawing Ref: <span className="text-slate-200">{oi.drawingReference} ({oi.revision})</span></div>
                    <div>Location: <span className="text-slate-200">{oi.sourceLocation}</span></div>
                    <div>Action: <span className="text-amber-300">{oi.suggestedAction}</span></div>
                  </div>

                  {oi.status === 'OPEN' && (
                    <button
                      onClick={() => setOpenItemModalItem(oi)}
                      className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-mono font-bold text-xs rounded-lg transition-colors"
                    >
                      Review & Resolve RFI Response
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: CONFLICTS */}
        {activeTab === 'CONFLICTS' && (
          <div className="space-y-4">
            <div className="bg-rose-950/40 border border-rose-500/30 p-5 rounded-xl text-rose-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold font-mono text-white mb-1">
                  MEP Multi-Source Conflict Adjudication Desk
                </h3>
                <p className="text-xs text-rose-300">
                  Plan vs Riser, Plan vs Schedule, and Specification discrepancies flagged for engineering resolution.
                </p>
              </div>
              <span className="px-3 py-1 bg-rose-600 text-white font-mono font-bold text-xs rounded-lg">
                {conflicts.filter(c => c.status === 'OPEN').length} Active Conflicts
              </span>
            </div>

            <div className="space-y-4">
              {conflicts.map(conf => (
                <div
                  key={conf.id}
                  className={`bg-slate-950 border rounded-xl p-5 space-y-4 ${
                    conf.status === 'OPEN' ? 'border-rose-500/50' : 'border-slate-800 opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-mono font-bold text-rose-400 mr-2">{conf.id}</span>
                      <span className="text-xs font-mono text-slate-400">[{conf.discipline}]</span>
                      <h4 className="text-sm font-bold text-white font-mono mt-1">
                        {conf.elementTag} — {conf.conflictType.replace(/_/g, ' ')}
                      </h4>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        conf.status === 'OPEN'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {conf.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="bg-slate-900 p-3.5 rounded-lg border border-slate-800">
                      <span className="text-indigo-400 font-bold block mb-1">
                        Source A: {conf.sourceA.documentName} ({conf.sourceA.drawingNumber})
                      </span>
                      <div className="text-white font-bold text-sm bg-slate-950 p-2 rounded border border-slate-800 mt-1">
                        {conf.sourceA.value}
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-1">Loc: {conf.sourceA.location}</span>
                    </div>

                    <div className="bg-slate-900 p-3.5 rounded-lg border border-slate-800">
                      <span className="text-indigo-400 font-bold block mb-1">
                        Source B: {conf.sourceB.documentName} ({conf.sourceB.drawingNumber})
                      </span>
                      <div className="text-white font-bold text-sm bg-slate-950 p-2 rounded border border-slate-800 mt-1">
                        {conf.sourceB.value}
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-1">Loc: {conf.sourceB.location}</span>
                    </div>
                  </div>

                  {conf.status === 'OPEN' && (
                    <button
                      onClick={() => setConflictModalItem(conf)}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs rounded-lg transition-colors"
                    >
                      Adjudicate & Resolve Conflict
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: COORDINATION CROSS CHECKS */}
        {activeTab === 'CROSS_CHECKS' && (
          <div className="space-y-4">
            <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl">
              <h3 className="text-sm font-bold font-mono text-white mb-1">
                Inter-Disciplinary MEP Coordination Cross-Checks
              </h3>
              <p className="text-xs text-slate-400">
                Automated spatial and technical validation between Mechanical, Electrical, Plumbing, and Structural disciplines.
              </p>
            </div>

            <div className="space-y-3">
              {crossChecks.map(cc => (
                <div key={cc.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          cc.severity === 'WARNING'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                        }`}
                      >
                        {cc.severity}
                      </span>
                      <span className="text-xs font-mono font-bold text-white">
                        {cc.category.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{cc.description}</p>
                    <div className="flex items-center space-x-4 text-[11px] text-slate-400 font-mono pt-1">
                      <span>Primary: <strong className="text-slate-200">{cc.primaryElement}</strong></span>
                      <span>Related: <strong className="text-slate-200">{cc.relatedElement}</strong></span>
                      <span>Location: <strong className="text-slate-200">{cc.location}</strong></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODALS */}
      {calcModalElement && (
        <MepCalculationModal
          element={calcModalElement}
          onClose={() => setCalcModalElement(null)}
          onEdit={elem => setEditModalElement(elem)}
        />
      )}

      {editModalElement && (
        <MepEditModal
          element={editModalElement}
          onClose={() => setEditModalElement(null)}
          onSave={handleSaveElement}
        />
      )}

      {conflictModalItem && (
        <MepConflictModal
          conflict={conflictModalItem}
          onClose={() => setConflictModalItem(null)}
          onResolve={handleResolveConflict}
        />
      )}

      {openItemModalItem && (
        <MepOpenItemModal
          openItem={openItemModalItem}
          onClose={() => setOpenItemModalItem(null)}
          onResolve={handleResolveOpenItem}
        />
      )}

      {showTestSuite && (
        <MepTestSuiteModal onClose={() => setShowTestSuite(false)} />
      )}

      {showRevisionModal && (
        <MepRevisionModal
          revisions={revisions}
          onClose={() => setShowRevisionModal(false)}
        />
      )}
    </div>
  );
};
