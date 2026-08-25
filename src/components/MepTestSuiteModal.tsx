import React, { useState, useEffect } from 'react';
import { MEPTestSuiteRunner, MEPTestCaseResult } from '../engine/mepTestSuite';

interface MepTestSuiteModalProps {
  onClose: () => void;
}

export const MepTestSuiteModal: React.FC<MepTestSuiteModalProps> = ({ onClose }) => {
  const [results, setResults] = useState<MEPTestCaseResult[]>([]);
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [running, setRunning] = useState<boolean>(true);

  useEffect(() => {
    // Run all 40 tests
    const timer = setTimeout(() => {
      const testResults = MEPTestSuiteRunner.runAllTests();
      setResults(testResults);
      setRunning(false);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;
  const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : '0.0';

  const filteredResults = results.filter(r => {
    const matchDiscipline = selectedDiscipline === 'ALL' || r.discipline === selectedDiscipline;
    const matchQuery =
      searchQuery === '' ||
      r.testName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.formulaOrRule.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.details.toLowerCase().includes(searchQuery.toLowerCase());
    return matchDiscipline && matchQuery;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <span className="px-2.5 py-1 bg-emerald-500 text-slate-950 text-xs font-mono font-bold rounded-md uppercase">
              Phase 8 Test Suite
            </span>
            <div>
              <h3 className="text-base font-bold font-mono">
                MEP Takeoff 40-Rule Engineering Verification Runner
              </h3>
              <p className="text-xs text-slate-300">
                Electrical, HVAC, Plumbing, Fire Fighting, Fire Alarm, ELV, Reconciliation & Conflict rules
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Metrics Banner */}
        <div className="bg-slate-950 text-white px-6 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-6">
            <div>
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Total Assertions</span>
              <span className="text-xl font-bold font-mono text-white">{totalTests}</span>
            </div>
            <div>
              <span className="text-[10px] text-emerald-400 font-mono uppercase block">Passed</span>
              <span className="text-xl font-bold font-mono text-emerald-400">{passedTests}</span>
            </div>
            <div>
              <span className="text-[10px] text-rose-400 font-mono uppercase block">Failed</span>
              <span className="text-xl font-bold font-mono text-rose-400">{failedTests}</span>
            </div>
            <div>
              <span className="text-[10px] text-amber-400 font-mono uppercase block">Pass Rate</span>
              <span className="text-xl font-bold font-mono text-amber-300">{passRate}%</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setRunning(true);
                setTimeout(() => {
                  setResults(MEPTestSuiteRunner.runAllTests());
                  setRunning(false);
                }, 100);
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <svg className={`w-3.5 h-3.5 ${running ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Re-run All Tests
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {['ALL', 'Electrical', 'HVAC', 'Plumbing', 'Fire Fighting', 'Fire Alarm', 'ELV', 'General'].map(disc => (
              <button
                key={disc}
                onClick={() => setSelectedDiscipline(disc)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                  selectedDiscipline === disc
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {disc}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Search test rules..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
            />
          </div>
        </div>

        {/* Results List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {running ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto mb-3" />
              <p className="text-xs text-slate-500 font-mono">Executing 40 deterministic MEP test suites...</p>
            </div>
          ) : (
            filteredResults.map(t => (
              <div
                key={t.testId}
                className={`p-4 rounded-xl border transition-all ${
                  t.passed
                    ? 'bg-white border-slate-200 hover:border-emerald-300 shadow-2xs'
                    : 'bg-rose-50 border-rose-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                        t.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {t.testId}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 font-mono">
                      {t.testName}
                    </h4>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-mono rounded">
                      {t.discipline}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                        t.passed
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {t.passed ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Expected Output</span>
                      <span className="text-slate-800">{t.expected}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Actual Evaluated Result</span>
                      <span className="text-emerald-700 font-bold">{t.actual}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-600 pt-1">
                    <strong className="text-slate-800 font-mono">Formula / Rule: </strong>
                    {t.formulaOrRule}
                  </div>
                  <p className="text-[11px] text-slate-500 italic">
                    {t.details}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            Showing {filteredResults.length} of {totalTests} test cases
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors"
          >
            Close Runner
          </button>
        </div>
      </div>
    </div>
  );
};
