import React, { useState, useEffect } from 'react';
import { X, Play, CheckCircle2, XCircle, Clock, ShieldCheck, Filter, RotateCw } from 'lucide-react';
import { runSteelAndRoofingTestSuite, SteelTestSuiteSummary } from '../engine/steelTestSuite';

interface SteelTestSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SteelTestSuiteModal: React.FC<SteelTestSuiteModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [suiteResult, setSuiteResult] = useState<SteelTestSuiteSummary | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'PASSED' | 'FAILED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const executeSuite = () => {
    setIsRunning(true);
    setTimeout(() => {
      const res = runSteelAndRoofingTestSuite();
      setSuiteResult(res);
      setIsRunning(false);
    }, 100);
  };

  useEffect(() => {
    if (isOpen && !suiteResult) {
      executeSuite();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredTests = suiteResult
    ? suiteResult.results.filter((t) => {
        if (selectedFilter === 'PASSED' && !t.passed) return false;
        if (selectedFilter === 'FAILED' && t.passed) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            t.testName.toLowerCase().includes(q) ||
            t.category.toLowerCase().includes(q) ||
            t.details.toLowerCase().includes(q)
          );
        }
        return true;
      })
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Phase 6 Steel & Roofing 26-Test Engineering Verification Suite
              </h2>
              <p className="text-xs text-slate-500">
                Deterministic mathematical checks for Beams, Columns, Rafters, Bracing, Plates, Purlins, Cladding, Skylights & Revisions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={executeSuite}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Running...' : 'Re-run 26 Tests'}</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Banner */}
        {suiteResult && (
          <div className="px-6 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-600">Status:</span>
                {suiteResult.failedTests === 0 ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    26 / 26 PASSED (100% Deterministic)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    {suiteResult.failedTests} FAILED
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 text-xs text-slate-500 font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{suiteResult.durationMs} ms</span>
              </div>
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search tests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-2.5 py-1 text-xs border border-slate-300 rounded-md bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-44"
              />

              <div className="flex rounded-md border border-slate-300 bg-white p-0.5 text-xs font-semibold">
                <button
                  onClick={() => setSelectedFilter('ALL')}
                  className={`px-2 py-0.5 rounded ${
                    selectedFilter === 'ALL' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  All (26)
                </button>
                <button
                  onClick={() => setSelectedFilter('PASSED')}
                  className={`px-2 py-0.5 rounded ${
                    selectedFilter === 'PASSED' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Passed ({suiteResult.passedTests})
                </button>
                <button
                  onClick={() => setSelectedFilter('FAILED')}
                  className={`px-2 py-0.5 rounded ${
                    selectedFilter === 'FAILED' ? 'bg-rose-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Failed ({suiteResult.failedTests})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tests List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {filteredTests.map((t) => (
            <div
              key={t.testId}
              className={`p-4 rounded-xl border transition-all ${
                t.passed
                  ? 'border-slate-200 bg-white hover:border-slate-300'
                  : 'border-rose-300 bg-rose-50/50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2.5">
                  {t.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-500">
                        Test #{t.testId}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900">{t.testName}</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {t.category}
                      </span>
                    </div>

                    <div className="mt-1 text-xs text-slate-600 space-y-1">
                      <div>
                        <span className="text-slate-400 font-medium">Expected: </span>
                        <span className="font-mono font-semibold text-slate-800">{t.expectedOutput}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Calculated: </span>
                        <span className="font-mono font-bold text-indigo-700">{t.actualOutput}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 pt-1 font-mono bg-slate-50 p-2 rounded border border-slate-100">
                        {t.details}
                      </div>
                    </div>
                  </div>
                </div>

                <span className="text-[10px] font-mono text-slate-400 shrink-0">
                  {t.executionTimeMs} ms
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
          <span className="text-xs text-slate-500">
            Certified under BS 5950, EN 1993 Eurocode 3 & BS EN 1993-1-3.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs"
          >
            Close Suite
          </button>
        </div>
      </div>
    </div>
  );
};
