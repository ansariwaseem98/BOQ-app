import React, { useState } from 'react';
import {
  X,
  Layers,
  Terminal,
  FileCode,
  Download,
  ExternalLink,
  Copy,
  Check,
  Zap,
  Info,
  Monitor,
  Cpu,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FolderOpen
} from 'lucide-react';
import {
  AutoCAD2021IntegrationEngine,
  AutoCAD2021LaunchConfig,
  AUTOCAD_2021_SPECS,
} from '../engine/autocad2021IntegrationEngine';

interface AutoCAD2021ModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AutoCAD2021LaunchConfig;
}

export const AutoCAD2021Modal: React.FC<AutoCAD2021ModalProps> = ({
  isOpen,
  onClose,
  config,
}) => {
  const [activeTab, setActiveTab] = useState<'launch' | 'script' | 'lisp' | 'setup'>('launch');
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [launchStatus, setLaunchStatus] = useState<'idle' | 'launching' | 'launched'>('idle');

  if (!isOpen) return null;

  const scriptContent = AutoCAD2021IntegrationEngine.generateAutoCAD2021Script(config);
  const lispContent = AutoCAD2021IntegrationEngine.generateAutoCAD2021AutoLisp(config);
  const quickCommandLine = `_SCRIPT "${config.drawingNumber}_AutoCAD2021_Sync.scr"`;

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleLaunchDesktop = () => {
    setLaunchStatus('launching');
    AutoCAD2021IntegrationEngine.launchViaProtocol(config);
    // Also trigger script download as a fail-safe
    setTimeout(() => {
      setLaunchStatus('launched');
    }, 1000);
  };

  const handleDownloadFullPackage = () => {
    AutoCAD2021IntegrationEngine.downloadAutoCAD2021Package(config);
  };

  const handleDownloadScript = () => {
    const filename = `${config.drawingNumber.replace(/[^a-zA-Z0-9-_]/g, '_')}_AutoCAD2021_Sync.scr`;
    AutoCAD2021IntegrationEngine.downloadFile(filename, scriptContent, 'application/x-autocad');
  };

  const handleDownloadLisp = () => {
    AutoCAD2021IntegrationEngine.downloadFile('boq_sync_autocad2021.lsp', lispContent, 'application/x-lisp');
  };

  const handleDownloadReg = () => {
    const reg = AutoCAD2021IntegrationEngine.generateAutoCAD2021ProtocolReg();
    AutoCAD2021IntegrationEngine.downloadFile('Register_AutoCAD2021_Protocol.reg', reg, 'text/plain');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Autodesk AutoCAD 2021 Brand Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-red-800 via-rose-900 to-slate-900 text-white flex items-center justify-between border-b border-rose-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-black text-rose-200 text-lg shadow-inner">
              A
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-wide text-white">Autodesk AutoCAD 2021</span>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-200 text-[10px] font-bold border border-rose-400/40">
                  Version 2021 (AC1032 / v24.0)
                </span>
              </div>
              <p className="text-xs text-rose-200/90 flex items-center gap-1.5 mt-0.5">
                <span>Direct CAD Big View & BOQ Bidirectional Integration</span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span className="text-emerald-300 font-semibold text-[11px]">System Ready</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-rose-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CAD Drawing Overview Banner */}
        <div className="px-6 py-3 bg-slate-900 text-slate-300 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 font-mono">
            <span className="px-2 py-0.5 bg-rose-950 text-rose-300 border border-rose-800 rounded font-bold">
              {config.drawingNumber}
            </span>
            <span className="text-white font-semibold truncate max-w-sm">{config.drawingTitle}</span>
            <span className="text-slate-400 text-[11px]">[{config.fileFormat} / Format AC1032]</span>
          </div>

          {config.itemCode && (
            <div className="flex items-center gap-2 bg-slate-800/90 px-3 py-1 rounded-lg border border-slate-700">
              <span className="text-indigo-400 font-bold font-mono">{config.itemCode}</span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-300">{config.quantity} {config.unit}</span>
              <span className="text-slate-400">|</span>
              <span className="text-emerald-400 font-bold font-mono">AED {(config.totalAmountAed || 0).toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2">
          <button
            onClick={() => setActiveTab('launch')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'launch'
                ? 'border-rose-600 text-rose-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>AutoCAD 2021 Quick Launch</span>
          </button>
          <button
            onClick={() => setActiveTab('script')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'script'
                ? 'border-rose-600 text-rose-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>AutoCAD 2021 Script (.SCR)</span>
          </button>
          <button
            onClick={() => setActiveTab('lisp')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'lisp'
                ? 'border-rose-600 text-rose-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>AutoLISP Module (.LSP)</span>
          </button>
          <button
            onClick={() => setActiveTab('setup')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'setup'
                ? 'border-rose-600 text-rose-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>AutoCAD 2021 System Config</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 flex-1 overflow-y-auto bg-slate-50/50 space-y-5">
          {/* TAB 1: QUICK LAUNCH */}
          {activeTab === 'launch' && (
            <div className="space-y-5">
              {/* Primary Call to Action Box */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white border border-slate-800 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-rose-600/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1 max-w-lg">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30">
                      <ShieldCheck className="w-3 h-3 text-rose-400" />
                      <span>Optimized for AutoCAD 2021 (AC1032 Format)</span>
                    </div>
                    <h3 className="text-base font-bold text-white">
                      Open CAD Drawing Directly in Autodesk AutoCAD 2021
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Launches your local desktop AutoCAD 2021 instance. Automatically creates BOQ measurement layers, focuses on takeoff coordinates, and initializes currency reporting in AED.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch gap-2 shrink-0 w-full md:w-auto">
                    <button
                      onClick={handleLaunchDesktop}
                      className="px-5 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-bold text-xs shadow-md hover:shadow-rose-900/40 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Zap className="w-4 h-4 text-rose-200" />
                      <span>Launch in AutoCAD 2021</span>
                    </button>

                    <button
                      onClick={handleDownloadFullPackage}
                      className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      title="Download AutoCAD 2021 Script, AutoLISP, and Batch Launcher package"
                    >
                      <Download className="w-4 h-4 text-slate-400" />
                      <span>Download Package</span>
                    </button>
                  </div>
                </div>

                {launchStatus === 'launched' && (
                  <div className="mt-4 p-3 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      Launch command issued to Autodesk AutoCAD 2021. If AutoCAD is not yet registered to open links, use the 1-click batch launcher or script below.
                    </span>
                  </div>
                )}
              </div>

              {/* One-Click Command Copy Box */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-rose-600" />
                    AutoCAD 2021 Command Line String:
                  </span>
                  <button
                    onClick={() => handleCopy(quickCommandLine, 'command')}
                    className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-2xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copiedType === 'command' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-500" />
                        <span>Copy Command</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-2.5 bg-slate-900 rounded-lg font-mono text-xs text-rose-300 flex items-center justify-between overflow-x-auto">
                  <code>{quickCommandLine}</code>
                  <span className="text-[10px] text-slate-500 ml-3 shrink-0">Paste into AutoCAD 2021 Command Line</span>
                </div>
              </div>

              {/* 3 Integration Pillars */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                    <Terminal className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-xs text-slate-900">AutoCAD 2021 Script (.SCR)</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Automates layer generation, zooms to takeoff coordinates, and establishes INSUNITS in AutoCAD 2021 without manual setup.
                  </p>
                  <button
                    onClick={handleDownloadScript}
                    className="text-xs text-rose-700 font-bold hover:underline flex items-center gap-1 pt-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" /> Download .SCR Script
                  </button>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                    <FileCode className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-xs text-slate-900">AutoLISP Routine (.LSP)</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Installs custom commands (<code>BOQINFO</code>, <code>BOQZOOM</code>, <code>BOQTAG</code>) directly into AutoCAD 2021 command engine.
                  </p>
                  <button
                    onClick={handleDownloadLisp}
                    className="text-xs text-indigo-700 font-bold hover:underline flex items-center gap-1 pt-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" /> Download .LSP File
                  </button>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <Monitor className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-xs text-slate-900">Desktop Protocol Link</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    One-click Windows Registry (.REG) file to associate web links with <code>acad.exe 2021</code> for seamless web-to-CAD clicks.
                  </p>
                  <button
                    onClick={handleDownloadReg}
                    className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1 pt-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" /> Download .REG Setup
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SCRIPT PREVIEW (.SCR) */}
          {activeTab === 'script' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-800">AutoCAD 2021 Native Command Script (.SCR)</h4>
                  <p className="text-2xs text-slate-500">Run via command line inside AutoCAD 2021: SCRIPT</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(scriptContent, 'scr')}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedType === 'scr' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{copiedType === 'scr' ? 'Copied Script' : 'Copy Script'}</span>
                  </button>
                  <button
                    onClick={handleDownloadScript}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .SCR</span>
                  </button>
                </div>
              </div>

              <div className="p-4 bg-slate-900 rounded-xl font-mono text-xs text-slate-200 border border-slate-800 max-h-[380px] overflow-y-auto whitespace-pre">
                {scriptContent}
              </div>
            </div>
          )}

          {/* TAB 3: AUTOLISP MODULE (.LSP) */}
          {activeTab === 'lisp' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-800">AutoCAD 2021 AutoLISP BOQ Synchronization Program</h4>
                  <p className="text-2xs text-slate-500">
                    Supports AutoCAD 2021 Visual Studio Code AutoLISP debugger & Unicode engine
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(lispContent, 'lsp')}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedType === 'lsp' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{copiedType === 'lsp' ? 'Copied AutoLISP' : 'Copy AutoLISP'}</span>
                  </button>
                  <button
                    onClick={handleDownloadLisp}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .LSP</span>
                  </button>
                </div>
              </div>

              <div className="p-4 bg-slate-900 rounded-xl font-mono text-xs text-indigo-200 border border-slate-800 max-h-[380px] overflow-y-auto whitespace-pre">
                {lispContent}
              </div>
            </div>
          )}

          {/* TAB 4: SYSTEM SETUP & AUTOCAD 2021 SPECIFICATIONS */}
          {activeTab === 'setup' && (
            <div className="space-y-4 text-xs">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
                <h4 className="font-bold text-sm text-slate-900">Autodesk AutoCAD 2021 Architecture & Specifications</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Target Software Version</span>
                    <span className="font-bold text-slate-900">{AUTOCAD_2021_SPECS.version}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Native Drawing Database Format</span>
                    <span className="font-bold font-mono text-slate-900">{AUTOCAD_2021_SPECS.acadVer} ({AUTOCAD_2021_SPECS.dwgVersion})</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Standard 64-Bit Install Directory</span>
                    <span className="font-mono text-[11px] text-slate-700 truncate block">{AUTOCAD_2021_SPECS.defaultExecutablePathWin}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Default Project Currency</span>
                    <span className="font-bold text-emerald-700">AED (UAE Dirham)</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
                <h4 className="font-bold text-sm text-slate-900">Configuring Web-to-AutoCAD 2021 1-Click Launching</h4>
                <p className="text-slate-600 leading-relaxed">
                  To enable your browser to open desktop Autodesk AutoCAD 2021 with a single click from any drawing or BOQ preview:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-slate-700 pl-2">
                  <li>Download the <code>Register_AutoCAD2021_Protocol.reg</code> file.</li>
                  <li>Double-click the <code>.reg</code> file to register the <code>acad2021://</code> URL handler in Windows.</li>
                  <li>When prompted by Windows User Account Control (UAC), click <strong>Yes</strong> to confirm.</li>
                  <li>Any "Launch in AutoCAD 2021" button in this application will immediately execute your local AutoCAD 2021!</li>
                </ol>
                <div className="pt-2">
                  <button
                    onClick={handleDownloadReg}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Windows Registry (.REG) Protocol Setup</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>AutoCAD 2021 Integration active • Currency: <strong>AED</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLaunchDesktop}
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Launch in AutoCAD 2021</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
