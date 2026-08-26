/**
 * AI BOQ & Tender Estimation Engineer - Phase 13 Tender 32-Rule Test Suite Modal
 */

import React, { useState } from 'react';
import {
  X,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { TenderTestResult } from '../types/tender';

interface TenderTestSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunTests: () => {
    results: TenderTestResult[];
    totalTests: number;
    passedCount: number;
    failedCount: number;
    executionTimeMs: number;
  };
}

export const TenderTestSuiteModal: React.FC<TenderTestSuiteModalProps> = ({
  isOpen,
  onClose,
  onRunTests,
}) => {
  const [testResults, setTestResults] = useState<TenderTestResult[] | null>(null);
  const [totalTests, setTotalTests] = useState(0);
  const [passedCount, setPassedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [executionTime, setExecutionTime] = useState(0);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PASS' | 'FAILED'>('ALL');
  const [isRunning, setIsRunning] = useState(false);

  if (!isOpen) return null;

  const handleExecute = () => {
    setIsRunning(true);
    setTimeout(() => {
      const suite = onRunTests();
      setTestResults(suite.results);
      setTotalTests(suite.totalTests);
      setPassedCount(suite.passedCount);
      setFailedCount(suite.failedCount);
      setExecutionTime(suite.executionTimeMs);
      setIsRunning(false);
    }, 100);
  };

  const filteredResults = (testResults || []).filter((t) => {
    const matchesSearch =
      t.testName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      t.category.toLowerCase().includes(searchFilter.toLowerCase()) ||
      t.actual.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExportJson = () => {
    if (!testResults) return;
    const blob = new Blob(
      [
        JSON.stringify(
          {
            suiteTitle: 'Phase 13 Tender Management 32-Rule Validation Suite',
            executedAt: new Date().toISOString(),
            totalTests,
            passedCount,
            failedCount,
            executionTimeMs: executionTime,
            results: testResults,
          },
          null,
          2
        ),
      ],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Tender_Test_Suite_Results_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Tender Management 32-Rule Automated Test Suite
              </h2>
              <p className="text-xs text-slate-500">
                Rigorous mathematical, scope, workflow, and compliance verification engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Controls */}
        <div className="p-4 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handleExecute}
              disabled={isRunning}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-white" />
              {testResults ? 'Re-run 32 Tests' : 'Execute Test Suite'}
            </button>

            {testResults && (
              <button
                onClick={handleExportJson}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Export JSON Log
              </button>
            )}
          </div>

          {testResults && (
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {passedCount} Passed
              </span>
              <span className="flex items-center gap-1.5 text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                <XCircle className="w-3.5 h-3.5" />
                {failedCount} Failed
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                <Clock className="w-3.5 h-3.5" />
                {executionTime} ms
              </span>
            </div>
          )}
        </div>

        {/* Filters */}
        {testResults && (
          <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search test name or category..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-medium mr-1">Filter:</span>
              {(['ALL', 'PASS', 'FAILED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    statusFilter === st
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content Body: Test Table */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
          {!testResults ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-3">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                Ready to execute 32 Tender Verification Tests
              </h3>
              <p className="text-xs text-slate-500 max-w-md mt-1 mb-4">
                Validates scope matrix, addenda impacts, provisional sums, prime cost attendance, competitor deviations, risk scores, and mathematical reconciliation.
              </p>
              <button
                onClick={handleExecute}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" />
                Run All 32 Tests
              </button>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center">#</th>
                    <th className="py-2.5 px-3 w-20">Status</th>
                    <th className="py-2.5 px-4">Test Name & Category</th>
                    <th className="py-2.5 px-4">Expected Condition</th>
                    <th className="py-2.5 px-4">Actual Result</th>
                    <th className="py-2.5 px-3 w-20 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredResults.map((t) => (
                    <tr key={t.testId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono font-medium">
                        {t.testId}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            t.status === 'PASS'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {t.status === 'PASS' ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          {t.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-slate-800">{t.testName}</div>
                        <div className="text-[10px] text-indigo-600 font-medium">{t.category}</div>
                        {t.notes && <div className="text-[10px] text-slate-400 mt-0.5">{t.notes}</div>}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 font-mono text-[11px]">
                        {t.expected}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[11px] text-slate-700">
                        {t.actual}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-400 font-mono text-[11px]">
                        {t.executionTimeMs} ms
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-white border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            {testResults ? `${filteredResults.length} of ${totalTests} tests displayed` : '32 tests loaded'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
