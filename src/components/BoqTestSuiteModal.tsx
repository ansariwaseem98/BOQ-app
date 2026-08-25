import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, XCircle, RefreshCw, Play, Filter, ShieldCheck, FileCode, Check } from 'lucide-react';
import { BoqIntegrationTestResult } from '../types';
import { runAllBoqIntegrationTests } from '../engine/unifiedBoqTestSuite';

interface BoqTestSuiteModalProps {
  onClose: () => void;
}

export const BoqTestSuiteModal: React.FC<BoqTestSuiteModalProps> = ({ onClose }) => {
  const [results, setResults] = useState<BoqIntegrationTestResult[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedTest, setSelectedTest] = useState<BoqIntegrationTestResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const executeTests = () => {
    setIsRunning(true);
    setTimeout(() => {
      const testResults = runAllBoqIntegrationTests();
      setResults(testResults);
      setSelectedTest(testResults[0] || null);
      setIsRunning(false);
    }, 200);
  };

  useEffect(() => {
    executeTests();
  }, []);

  const totalCount = results.length;
  const passedCount = results.filter(r => r.status === 'PASSED').length;
  const failedCount = totalCount - passedCount;
  const passRate = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;

  const categories = ['ALL', 'STRUCTURAL', 'ARCHITECTURAL', 'MEP', 'RECONCILIATION', 'GOVERNANCE'];

  const filteredResults = results.filter(r => {
    if (selectedCategory === 'ALL') return true;
    return r.category === selectedCategory;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">36-Rule Unified BOQ Integration Test Suite</h3>
              <p className="text-xs text-slate-400">Automated verification of takeoff-to-BOQ mathematical integration and governance rules</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={executeTests}
              disabled={isRunning}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              Re-Run All 36 Tests
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          {/* Left Panel: Test List */}
          <div className="w-full sm:w-1/2 border-r border-slate-200 flex flex-col overflow-hidden bg-slate-50/50">
            {/* Top Score Banner */}
            <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
              <div>
                <span className="text-2xs text-slate-500 font-bold uppercase tracking-wider">Test Suite Status</span>
                <div className="text-xl font-bold font-mono text-slate-800 flex items-center gap-2">
                  <span>{passedCount} / {totalCount} Passed</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    failedCount === 0 ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {passRate}% Pass Rate
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2 py-1 rounded text-2xs font-semibold uppercase tracking-wider transition-colors ${
                      selectedCategory === cat
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {cat === 'ALL' ? 'ALL (36)' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Test Items Scrollable List */}
            <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
              {filteredResults.map((test) => (
                <div
                  key={test.testId}
                  onClick={() => setSelectedTest(test)}
                  className={`p-3 cursor-pointer transition-colors flex items-start gap-3 ${
                    selectedTest?.testId === test.testId
                      ? 'bg-indigo-50/80 border-l-4 border-indigo-600'
                      : 'hover:bg-white bg-slate-50/30'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {test.status === 'PASSED' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-2xs font-bold text-slate-500">RULE #{test.testId}</span>
                      <span className="text-2xs px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-semibold uppercase">
                        {test.category}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-800 truncate mt-0.5">{test.name}</div>
                    <div className="text-2xs text-slate-500 font-mono truncate">{test.expectedOutput}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel: Selected Test Details Inspector */}
          <div className="w-full sm:w-1/2 p-6 overflow-y-auto space-y-4 bg-white flex-1">
            {selectedTest ? (
              <>
                <div className="flex items-start justify-between border-b border-slate-200 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-600">TEST #{selectedTest.testId}</span>
                      <span className="text-2xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                        {selectedTest.category}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{selectedTest.name}</h3>
                  </div>
                  <div className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono flex items-center gap-1 ${
                    selectedTest.status === 'PASSED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {selectedTest.status === 'PASSED' ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    {selectedTest.status}
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="font-semibold text-slate-500 uppercase tracking-wider text-2xs block">Test Scenario & Input</span>
                    <p className="mt-1 text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-medium">
                      {selectedTest.inputSummary}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="font-semibold text-slate-500 uppercase tracking-wider text-2xs block">Expected Result</span>
                      <p className="mt-1 text-emerald-800 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-200 font-mono font-semibold">
                        {selectedTest.expectedOutput}
                      </p>
                    </div>

                    <div>
                      <span className="font-semibold text-slate-500 uppercase tracking-wider text-2xs block">Actual Execution Output</span>
                      <p className="mt-1 text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono font-semibold">
                        {selectedTest.actualOutput}
                      </p>
                    </div>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-500 uppercase tracking-wider text-2xs block">Formula & Derivation Rule</span>
                    <p className="mt-1 text-indigo-900 bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-200 font-mono">
                      {selectedTest.formulaChecked}
                    </p>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-500 uppercase tracking-wider text-2xs block">Source Traceability Point</span>
                    <p className="mt-1 text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono">
                      {selectedTest.sourceChecked}
                    </p>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-500 uppercase tracking-wider text-2xs block">Technical Verification Notes</span>
                    <p className="mt-1 text-slate-600 leading-relaxed">
                      {selectedTest.details}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                Select a test to inspect results
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Close Test Suite
          </button>
        </div>
      </div>
    </div>
  );
};
