import React, { useState } from 'react';
import {
  X,
  Play,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Clock,
  Layers,
  Search,
  Filter,
  RefreshCw,
  Download,
  Info,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Zap,
  FileSpreadsheet
} from 'lucide-react';
import { EndToEndTestResult } from '../types';
import { EndToEndValidationEngine } from '../engine/endToEndValidationSuite';

interface EndToEndTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EndToEndTestModal: React.FC<EndToEndTestModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [testResults, setTestResults] = useState<EndToEndTestResult[]>(() =>
    EndToEndValidationEngine.runAllEndToEndTests()
  );
  const [isRunning, setIsRunning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTestId, setExpandedTestId] = useState<number | null>(null);

  if (!isOpen) return null;

  // Run Test Suite
  const handleRunTests = () => {
    setIsRunning(true);
    setTimeout(() => {
      const results = EndToEndValidationEngine.runAllEndToEndTests();
      setTestResults(results);
      setIsRunning(false);
    }, 150);
  };

  // Metrics
  const totalTests = testResults.length;
  const passedTests = testResults.filter((t) => t.status === 'PASS').length;
  const failedTests = testResults.filter((t) => t.status === 'FAILED').length;
  const mockedCount = testResults.filter((t) => t.status === 'MOCKED').length;
  const notImplementedCount = testResults.filter((t) => t.status === 'NOT_IMPLEMENTED').length;

  const criticalFailures = testResults.filter((t) => t.status === 'FAILED' && t.severity === 'CRITICAL').length;
  const highFailures = testResults.filter((t) => t.status === 'FAILED' && t.severity === 'HIGH').length;
  const mediumFailures = testResults.filter((t) => t.status === 'FAILED' && t.severity === 'MEDIUM').length;
  const lowFailures = testResults.filter((t) => t.status === 'FAILED' && t.severity === 'LOW').length;

  const passRate = totalTests > 0 ? Math.round((passedTests / (totalTests - mockedCount - notImplementedCount)) * 100) : 0;

  // Filters
  const filteredResults = testResults.filter((test) => {
    if (selectedCategory !== 'ALL' && test.category !== selectedCategory) return false;
    if (statusFilter !== 'ALL' && test.status !== statusFilter) return false;
    if (severityFilter !== 'ALL' && test.severity !== severityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        test.testName.toLowerCase().includes(q) ||
        test.input.toLowerCase().includes(q) ||
        test.details.toLowerCase().includes(q) ||
        test.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const categories = Array.from(new Set(testResults.map((t) => t.category)));

  // Export Results
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(testResults, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Phase10_E2E_Test_Results_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">End-to-End Takeoff Test & BOQ Validation Suite</h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  56-RULE TEST HARNESS
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Rigorous multi-discipline validation testing from raw drawing ingestion to verified BOQ freeze.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunTests}
              disabled={isRunning}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Running Tests...' : 'Re-Run Test Suite'}</span>
            </button>
            <button
              onClick={handleExportJson}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Primary Metrics Strip */}
        <div className="px-6 py-3.5 bg-slate-100/90 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 shrink-0">
          <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-slate-500 block">Total Tests</span>
            <span className="text-base font-black text-slate-900">{totalTests}</span>
          </div>

          <div className="bg-white p-2.5 rounded-lg border border-emerald-200 shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-emerald-700 block">Passed Tests</span>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-black text-emerald-700">{passedTests}</span>
              <span className="text-[10px] text-emerald-600 font-bold">({passRate}%)</span>
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-amber-700 block">Mocked Stubs</span>
            <span className="text-base font-black text-amber-700">{mockedCount}</span>
          </div>

          <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-slate-500 block">Not Implemented</span>
            <span className="text-base font-black text-slate-600">{notImplementedCount}</span>
          </div>

          <div className="bg-white p-2.5 rounded-lg border border-rose-200 shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-rose-700 block">Failed Tests</span>
            <span className="text-base font-black text-rose-700">{failedTests}</span>
          </div>

          <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs col-span-2">
            <span className="text-[10px] font-bold uppercase text-slate-500 block mb-0.5">Failure Breakdown</span>
            <div className="flex items-center gap-3 text-xs font-mono font-bold">
              <span className="text-rose-700">Crit: {criticalFailures}</span>
              <span className="text-amber-700">High: {highFailures}</span>
              <span className="text-slate-600">Med: {mediumFailures}</span>
              <span className="text-slate-500">Low: {lowFailures}</span>
            </div>
          </div>
        </div>

        {/* Filter Controls Strip */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search test name, category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs w-64 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden"
            >
              <option value="ALL">All Categories ({testResults.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden"
            >
              <option value="ALL">All Statuses</option>
              <option value="PASS">PASS ({passedTests})</option>
              <option value="MOCKED">MOCKED ({mockedCount})</option>
              <option value="NOT_IMPLEMENTED">NOT IMPLEMENTED ({notImplementedCount})</option>
              <option value="FAILED">FAILED ({failedTests})</option>
            </select>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <span className="text-xs text-slate-500 font-medium">
            Showing {filteredResults.length} of {totalTests} test cases
          </span>
        </div>

        {/* Tests List Accordion View */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2.5">
          {filteredResults.length === 0 ? (
            <div className="py-12 text-center text-slate-400 italic text-xs">
              No test cases match the active filter criteria.
            </div>
          ) : (
            filteredResults.map((test) => {
              const isExpanded = expandedTestId === test.testId;

              return (
                <div
                  key={test.testId}
                  className={`border rounded-xl transition-all duration-150 overflow-hidden ${
                    test.status === 'FAILED'
                      ? 'border-rose-300 bg-rose-50/20'
                      : test.status === 'MOCKED'
                      ? 'border-amber-200 bg-amber-50/10'
                      : test.status === 'NOT_IMPLEMENTED'
                      ? 'border-slate-300 bg-slate-50/40'
                      : 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  {/* Summary Row */}
                  <div
                    onClick={() => setExpandedTestId(isExpanded ? null : test.testId)}
                    className="p-3.5 cursor-pointer flex items-center justify-between gap-4 select-none"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button className="text-slate-400 hover:text-slate-700 shrink-0">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>

                      <span className="font-mono text-xs font-bold text-slate-500 shrink-0 w-9">
                        #{test.testId.toString().padStart(2, '0')}
                      </span>

                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                        {test.category}
                      </span>

                      <h4 className="text-xs font-bold text-slate-900 truncate flex-1">
                        {test.testName}
                      </h4>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          test.severity === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800'
                            : test.severity === 'HIGH'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {test.severity}
                      </span>

                      <span className="font-mono text-[10px] text-slate-400">
                        {test.executionTimeMs}ms
                      </span>

                      {/* Status Tag */}
                      {test.status === 'PASS' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3" />
                          PASS
                        </span>
                      )}
                      {test.status === 'MOCKED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          <AlertTriangle className="w-3 h-3" />
                          MOCKED
                        </span>
                      )}
                      {test.status === 'NOT_IMPLEMENTED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                          <Info className="w-3 h-3" />
                          NOT IMPLEMENTED
                        </span>
                      )}
                      {test.status === 'FAILED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                          <AlertOctagon className="w-3 h-3" />
                          FAILED
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="px-10 pb-4 pt-1 bg-slate-50/80 border-t border-slate-100 text-xs space-y-3 animate-in fade-in duration-100">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                        <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                          <span className="text-[10px] font-bold uppercase text-slate-500 block">Input / Precondition</span>
                          <p className="text-slate-800 font-mono text-[11px] leading-relaxed">{test.input}</p>
                        </div>

                        <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                          <span className="text-[10px] font-bold uppercase text-slate-500 block">Expected Outcome</span>
                          <p className="text-slate-800 font-mono text-[11px] leading-relaxed">{test.expectedResult}</p>
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-500 block">Actual Execution Result</span>
                        <p className="text-emerald-800 font-mono text-[11px] font-bold leading-relaxed">{test.actualResult}</p>
                      </div>

                      <div className="text-[11px] text-slate-600 bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100">
                        <strong className="text-indigo-900">Engineering Assertion Details:</strong> {test.details}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>"No False Pass" Policy Enforced: Passed tests verify real calculation logic; Mocked/Unimplemented items are explicitly flagged.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
          >
            Close Runner
          </button>
        </div>
      </div>
    </div>
  );
};
