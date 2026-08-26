import React, { useState, useEffect } from 'react';
import { MEPTestSuiteRunner, MEPTestCaseResult } from '../engine/mepTestSuite';
import { MEPEngine } from '../engine/mepEngine';

interface MepTestSuiteModalProps {
  onClose: () => void;
}

export const MepTestSuiteModal: React.FC<MepTestSuiteModalProps> = ({ onClose }) => {
  const [suiteMode, setSuiteMode] = useState<'MILESTONE_10' | 'RULES_40'>('MILESTONE_10');
  const [results40, setResults40] = useState<MEPTestCaseResult[]>([]);
  const [milestones10, setMilestones10] = useState<
    {
      testId: number;
      title: string;
      description: string;
      passed: boolean;
      expected: string;
      actual: string;
      rule: string;
    }[]
  >([]);
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [running, setRunning] = useState<boolean>(true);

  const runAll = () => {
    setRunning(true);
    setTimeout(() => {
      setResults40(MEPTestSuiteRunner.runAllTests());
      setMilestones10(MEPEngine.run10CriticalTests());
      setRunning(false);
    }, 150);
  };

  useEffect(() => {
    runAll();
  }, []);

  const total40 = results40.length;
  const passed40 = results40.filter(r => r.passed).length;

  const total10 = milestones10.length;
  const passed10 = milestones10.filter(m => m.passed).length;

  const activeTotal = suiteMode === 'MILESTONE_10' ? total10 : total40;
  const activePassed = suiteMode === 'MILESTONE_10' ? passed10 : passed40;
  const activeFailed = activeTotal - activePassed;
  const activePassRate = activeTotal > 0 ? ((activePassed / activeTotal) * 100).toFixed(1) : '0.0';

  const filtered40 = results40.filter(r => {
    const matchDiscipline = selectedDiscipline === 'ALL' || r.discipline === selectedDiscipline;
    const matchQuery =
      searchQuery === '' ||
      r.testName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.formulaOrRule.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.details.toLowerCase().includes(searchQuery.toLowerCase());
    return matchDiscipline && matchQuery;
  });

  const filtered10 = milestones10.filter(m => {
    return (
      searchQuery === '' ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.rule.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.expected.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.actual.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <span className="px-2.5 py-1 bg-amber-500 text-slate-950 text-xs font-mono font-black rounded-md uppercase">
              Phase 15E Verification
            </span>
            <div>
              <h3 className="text-base font-bold font-mono text-white">
                Industrial MEP Verification &amp; Milestone Validation Engine
              </h3>
              <p className="text-xs text-slate-400">
                Electrical, HVAC, Plumbing, Fire Fighting, ELV, Supports, Equipment &amp; Zero-Assumptions Policy
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

        {/* Mode Selector Tabs */}
        <div className="bg-slate-950 px-6 pt-3 border-b border-slate-800 flex items-center gap-4">
          <button
            onClick={() => setSuiteMode('MILESTONE_10')}
            className={`pb-3 font-mono text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              suiteMode === 'MILESTONE_10'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px]">
              10
            </span>
            10 Critical Milestone Tests (Phase 15E)
          </button>

          <button
            onClick={() => setSuiteMode('RULES_40')}
            className={`pb-3 font-mono text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              suiteMode === 'RULES_40'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">
              40
            </span>
            40-Rule Comprehensive Engineering Test Suite
          </button>
        </div>

        {/* Metrics Banner */}
        <div className="bg-slate-950/80 px-6 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-6">
            <div>
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Total Assertions</span>
              <span className="text-xl font-bold font-mono text-white">{activeTotal}</span>
            </div>
            <div>
              <span className="text-[10px] text-emerald-400 font-mono uppercase block">Passed</span>
              <span className="text-xl font-bold font-mono text-emerald-400">{activePassed}</span>
            </div>
            <div>
              <span className="text-[10px] text-rose-400 font-mono uppercase block">Failed</span>
              <span className="text-xl font-bold font-mono text-rose-400">{activeFailed}</span>
            </div>
            <div>
              <span className="text-[10px] text-amber-400 font-mono uppercase block">Pass Rate</span>
              <span className="text-xl font-bold font-mono text-amber-300">{activePassRate}%</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={runAll}
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
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {suiteMode === 'RULES_40' ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {['ALL', 'Electrical', 'HVAC', 'Plumbing', 'Fire Fighting', 'Fire Alarm', 'ELV', 'General'].map(disc => (
                <button
                  key={disc}
                  onClick={() => setSelectedDiscipline(disc)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                    selectedDiscipline === disc
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {disc}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-400 font-mono font-bold">
                ✓ 10 Mandatory Milestone Assertions
              </span>
              <span className="text-[11px] text-slate-400">
                (Cable, Pipe, Duct, Missing Spec, Conflict, Duplicate, User Edit, Equipment, Sprinkler, Supports)
              </span>
            </div>
          )}

          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Search test assertions..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
            />
          </div>
        </div>

        {/* Results List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 bg-slate-900/60">
          {running ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400 mx-auto mb-3" />
              <p className="text-xs text-slate-400 font-mono">Executing deterministic MEP verification suites...</p>
            </div>
          ) : suiteMode === 'MILESTONE_10' ? (
            filtered10.map(m => (
              <div
                key={m.testId}
                className={`p-4 rounded-xl border transition-all ${
                  m.passed
                    ? 'bg-slate-950/80 border-slate-800 hover:border-amber-500/50'
                    : 'bg-rose-950/40 border-rose-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center space-x-2.5">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono ${
                        m.passed ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      }`}
                    >
                      M{m.testId}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white font-mono flex items-center gap-2">
                        {m.title}
                      </h4>
                      <p className="text-[11px] text-slate-400">{m.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-black font-mono uppercase ${
                        m.passed
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      }`}
                    >
                      {m.passed ? 'VERIFIED' : 'FAILED'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-900/90 p-3 rounded-lg border border-slate-800 font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Expected Engineering Value</span>
                      <span className="text-slate-200">{m.expected}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-400 block uppercase">Actual Engine Output</span>
                      <span className="text-amber-300 font-bold">{m.actual}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 pt-1">
                    <strong className="text-slate-200 font-mono">Core Engineering Rule: </strong>
                    <span className="text-amber-300/90 font-mono">{m.rule}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            filtered40.map(t => (
              <div
                key={t.testId}
                className={`p-4 rounded-xl border transition-all ${
                  t.passed
                    ? 'bg-slate-950/80 border-slate-800 hover:border-emerald-500/50'
                    : 'bg-rose-950/40 border-rose-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold font-mono ${
                        t.passed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      }`}
                    >
                      {t.testId}
                    </span>
                    <h4 className="text-xs font-bold text-white font-mono">
                      {t.testName}
                    </h4>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-mono rounded border border-slate-700">
                      {t.discipline}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                        t.passed
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      }`}
                    >
                      {t.passed ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Expected Output</span>
                      <span className="text-slate-300">{t.expected}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-400 block uppercase">Actual Evaluated Result</span>
                      <span className="text-emerald-400 font-bold">{t.actual}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 pt-1">
                    <strong className="text-slate-200 font-mono">Formula / Rule: </strong>
                    {t.formulaOrRule}
                  </div>
                  <p className="text-[11px] text-slate-400 italic">
                    {t.details}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            Showing {suiteMode === 'MILESTONE_10' ? filtered10.length : filtered40.length} of {activeTotal} assertions
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-amber-500 text-slate-950 text-xs font-black font-mono rounded-lg hover:bg-amber-400 transition-colors"
          >
            Close Runner
          </button>
        </div>
      </div>
    </div>
  );
};
