import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Calendar, 
  Edit3, 
  Layers, 
  FileText, 
  AlertCircle, 
  HelpCircle, 
  CheckCircle2, 
  FileSpreadsheet, 
  Activity, 
  Settings2, 
  Users, 
  Briefcase, 
  Hash, 
  ArrowRight,
  FolderKanban,
  Coins,
  ShieldCheck,
  Archive,
  RotateCcw,
  FolderOpen
} from 'lucide-react';
import { ProjectRecord } from '../types';
import { DocumentStorageService } from '../services/documentStorage';

interface ProjectDashboardProps {
  project: ProjectRecord;
  onEditProject: () => void;
  onOpenProjectList: () => void;
  onCreateNewProject: () => void;
  onToggleArchive: () => void;
  // Module navigation triggers
  onNavigateToDrawings?: () => void;
  onNavigateToIntelligence?: () => void;
  onNavigateToTakeoff?: () => void;
  onNavigateToMeasurementEngine?: () => void;
  onNavigateToSteel?: () => void;
  onNavigateToArchitectural?: () => void;
  onNavigateToMep?: () => void;
  onNavigateToBoq?: () => void;
  onNavigateToRateAnalysis?: () => void;
  onNavigateToTender?: () => void;
  onNavigateToBbs?: () => void;
  onNavigateToOpenItems?: () => void;
}

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({
  project,
  onEditProject,
  onOpenProjectList,
  onCreateNewProject,
  onToggleArchive,
  onNavigateToDrawings,
  onNavigateToIntelligence,
  onNavigateToTakeoff,
  onNavigateToMeasurementEngine,
  onNavigateToSteel,
  onNavigateToArchitectural,
  onNavigateToMep,
  onNavigateToBoq,
  onNavigateToRateAnalysis,
  onNavigateToTender,
  onNavigateToBbs,
  onNavigateToOpenItems,
}) => {
  const isArchived = project.status === 'Archived';
  const [drawingCount, setDrawingCount] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    async function loadStats() {
      if (!project?.id) return;
      try {
        const docs = await DocumentStorageService.getDocumentsByProject(project.id, false);
        if (isMounted) {
          setDrawingCount(docs.length);
        }
      } catch (e) {
        console.error('Failed to load drawing count for dashboard:', e);
      }
    }
    loadStats();
    return () => {
      isMounted = false;
    };
  }, [project?.id]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Top Controls & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenProjectList}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>All Projects Directory</span>
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-bold text-slate-900 line-clamp-1">{project.project?.name}</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onToggleArchive}
            className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title={isArchived ? 'Restore to Active' : 'Archive Project'}
          >
            {isArchived ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                <span>Restore to Active</span>
              </>
            ) : (
              <>
                <Archive className="w-3.5 h-3.5 text-slate-500" />
                <span>Archive Project</span>
              </>
            )}
          </button>

          <button
            onClick={onEditProject}
            className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
            <span>EDIT PROJECT</span>
          </button>

          <button
            onClick={onCreateNewProject}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <span>+ CREATE NEW PROJECT</span>
          </button>
        </div>
      </div>

      {/* Main Project Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-xs px-2.5 py-1 rounded-md font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {project.id}
              </span>
              {project.project?.projectNumber && (
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                  CODE: {project.project.projectNumber}
                </span>
              )}
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                  isArchived
                    ? 'bg-slate-100 text-slate-600 border border-slate-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {project.status || 'Active'}
              </span>
              {project.isTestProject && (
                <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">
                  TEST FIXTURE
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {project.project?.name || 'Unnamed Project'}
            </h1>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="font-semibold text-slate-800">
                  {project.project?.location}
                  {project.project?.city ? `, ${project.project.city}` : ''}
                  {project.project?.country ? `, ${project.project.country}` : ''}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>{project.project?.projectType || 'RCC Building'}</span>
                {project.project?.buildingType && <span>({project.project.buildingType})</span>}
              </div>

              {project.tender?.currency && (
                <div className="flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="font-bold text-slate-800 font-mono">
                    Currency: {project.tender.currency} ({project.tender.currencySymbol || project.tender.currency})
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Company Logo or Badge */}
          {project.company?.logoUrl ? (
            <div className="w-24 h-24 border border-slate-200 rounded-xl p-2 bg-slate-50 flex items-center justify-center shrink-0">
              <img
                src={project.company.logoUrl}
                alt={project.company.name}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : (
            <div className="w-24 h-24 rounded-xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 p-2 text-center shrink-0">
              <Briefcase className="w-6 h-6 mb-1 text-slate-300" />
              <span className="text-[10px] font-semibold">No Logo</span>
            </div>
          )}
        </div>

        {/* 3-Column Stakeholder Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1: Contractor / Company */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-200 pb-2">
              <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
              <span>CONTRACTOR / COMPANY</span>
            </div>
            <div className="text-xs space-y-1 text-slate-700">
              <p className="font-bold text-slate-900">{project.company?.name || '-'}</p>
              {project.company?.licenseNumber && (
                <p className="text-[11px] text-slate-500 font-mono">Lic: {project.company.licenseNumber}</p>
              )}
              {project.company?.contactPerson && (
                <p className="text-[11px] text-slate-600">Contact: {project.company.contactPerson}</p>
              )}
              {project.company?.email && (
                <p className="text-[11px] text-slate-500">{project.company.email}</p>
              )}
              {project.company?.phone && (
                <p className="text-[11px] text-slate-500 font-mono">{project.company.phone}</p>
              )}
            </div>
          </div>

          {/* Column 2: Client / Employer */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-200 pb-2">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span>CLIENT / EMPLOYER</span>
            </div>
            <div className="text-xs space-y-1 text-slate-700">
              <p className="font-bold text-slate-900">{project.client?.name || '-'}</p>
              {project.client?.companyName && (
                <p className="text-[11px] text-slate-600 font-medium">{project.client.companyName}</p>
              )}
              {project.client?.contactPerson && (
                <p className="text-[11px] text-slate-600">Rep: {project.client.contactPerson}</p>
              )}
              {project.client?.email && (
                <p className="text-[11px] text-slate-500">{project.client.email}</p>
              )}
              {project.client?.phone && (
                <p className="text-[11px] text-slate-500 font-mono">{project.client.phone}</p>
              )}
            </div>
          </div>

          {/* Column 3: Tender & Milestones */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-200 pb-2">
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>TENDER PARAMETERS</span>
            </div>
            <div className="text-xs space-y-1 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Contract Type:</span>
                <span className="font-bold text-slate-900">{project.tender?.contractType || 'Item Rate (BOQ)'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tender Ref:</span>
                <span className="font-mono text-slate-800">{project.tender?.tenderReference || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Submission Due:</span>
                <span className="font-mono font-bold text-rose-600">
                  {project.tender?.tenderSubmissionDeadline || project.project?.tenderSubmissionDeadline || '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Validity:</span>
                <span className="text-slate-800">{project.tender?.tenderValidity || '90 Days'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Geometry & Scope summary pills */}
        <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
          {project.project?.numberOfFloors !== undefined && (
            <span className="px-2.5 py-1 rounded-md bg-slate-100 font-semibold text-slate-700 border border-slate-200">
              Floors: {project.project.numberOfFloors} Total ({project.project.basementFloors || 0} Basements + {project.project.upperFloors || 0} Upper)
            </span>
          )}
          {project.project?.builtUpAreaM2 !== undefined && (
            <span className="px-2.5 py-1 rounded-md bg-slate-100 font-semibold text-slate-700 border border-slate-200 font-mono">
              BUA: {project.project.builtUpAreaM2.toLocaleString()} {project.engineeringSettings?.areaUnit || 'm²'}
            </span>
          )}
          {project.tender?.scope && project.tender.scope.length > 0 && (
            <div className="flex items-center gap-1.5 ml-auto flex-wrap">
              <span className="text-slate-400 font-medium">Scope:</span>
              {project.tender.scope.map((s) => (
                <span
                  key={s}
                  className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-[11px] border border-indigo-100"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Module Status Cards (Strictly 0 for fresh project) */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Project Takeoff Modules & Engineering Status
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 gap-3">
          {/* 1. Drawings */}
          <div
            onClick={onNavigateToDrawings}
            className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer space-y-2"
          >
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">Drawings</span>
              <Layers className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 font-mono">{drawingCount}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {drawingCount > 0 ? `${drawingCount} registered drawing${drawingCount > 1 ? 's' : ''}` : 'No drawings uploaded yet'}
              </p>
            </div>
          </div>

          {/* 2. Drawing Intelligence */}
          <div
            onClick={onNavigateToIntelligence || onNavigateToDrawings}
            className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer space-y-2"
          >
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">Intelligence</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 font-mono">Phase 3</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Drawing analysis engine</p>
            </div>
          </div>

          {/* 3. Quantity Takeoff Engine */}
          <div
            onClick={onNavigateToTakeoff}
            className="bg-white border border-indigo-200 rounded-xl p-3.5 shadow-2xs hover:border-indigo-400 hover:shadow-xs transition-all cursor-pointer space-y-2 bg-gradient-to-b from-indigo-50/30 to-transparent"
          >
            <div className="flex items-center justify-between text-indigo-700">
              <span className="text-xs font-bold">Takeoff Engine</span>
              <span className="text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">Phase 4</span>
            </div>
            <div>
              <p className="text-2xl font-black text-indigo-950 font-mono">Active</p>
              <p className="text-[11px] text-indigo-600 mt-0.5">Deterministic calculations</p>
            </div>
          </div>

          {/* 3B. Professional Measurement & Calculation Engine (Phase 15A) */}
          <div
            onClick={onNavigateToMeasurementEngine || onNavigateToTakeoff}
            className="bg-white border border-indigo-300 rounded-xl p-3.5 shadow-2xs hover:border-indigo-500 hover:shadow-sm transition-all cursor-pointer space-y-2 bg-gradient-to-b from-indigo-100/40 to-transparent"
          >
            <div className="flex items-center justify-between text-indigo-800">
              <span className="text-xs font-extrabold">Calc Engine</span>
              <span className="text-[10px] font-mono font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded shadow-2xs">Phase 15A</span>
            </div>
            <div>
              <p className="text-2xl font-black text-indigo-950 font-mono">25 Tests</p>
              <p className="text-[11px] text-indigo-700 font-semibold mt-0.5">Deterministic Math & Trace</p>
            </div>
          </div>

          {/* 4. Steel & Roof Engine (Phase 6) */}
          <div
            onClick={onNavigateToSteel}
            className="bg-white border border-indigo-200 rounded-xl p-3.5 shadow-2xs hover:border-indigo-400 hover:shadow-xs transition-all cursor-pointer space-y-2 bg-gradient-to-b from-indigo-50/20 to-transparent"
          >
            <div className="flex items-center justify-between text-indigo-700">
              <span className="text-xs font-bold">Steel & Roof</span>
              <span className="text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">Phase 6</span>
            </div>
            <div>
              <p className="text-2xl font-black text-indigo-950 font-mono">Engine</p>
              <p className="text-[11px] text-indigo-600 mt-0.5">Members, purlins & roof</p>
            </div>
          </div>

          {/* 5. Masonry, DPC, Openings & Finishes Engine (Phase 15C) */}
          <div
            onClick={onNavigateToArchitectural}
            className="bg-white border border-indigo-300 rounded-xl p-3.5 shadow-2xs hover:border-indigo-500 hover:shadow-sm transition-all cursor-pointer space-y-2 bg-gradient-to-b from-indigo-100/40 to-transparent"
          >
            <div className="flex items-center justify-between text-indigo-800">
              <span className="text-xs font-extrabold">Masonry & Finishes</span>
              <span className="text-[10px] font-mono font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded shadow-2xs">Phase 15C</span>
            </div>
            <div>
              <p className="text-2xl font-black text-indigo-950 font-mono">16 Schedules</p>
              <p className="text-[11px] text-indigo-700 font-semibold mt-0.5">DPC, Plaster, Paint, Zero Guess</p>
            </div>
          </div>

          {/* 6. MEP Quantity Takeoff Engine (Phase 8) */}
          <div
            onClick={onNavigateToMep}
            className="bg-white border border-amber-200 rounded-xl p-3.5 shadow-2xs hover:border-amber-400 hover:shadow-xs transition-all cursor-pointer space-y-2 bg-gradient-to-b from-amber-50/40 to-transparent"
          >
            <div className="flex items-center justify-between text-amber-800">
              <span className="text-xs font-bold">MEP Takeoff</span>
              <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">Phase 8</span>
            </div>
            <div>
              <p className="text-2xl font-black text-amber-950 font-mono">10 Disciplines</p>
              <p className="text-[11px] text-amber-700 mt-0.5">Electrical, HVAC, Plumbing, Fire, ELV</p>
            </div>
          </div>

          {/* 7. RCC & BBS Rebar Engine (Phase 15B) */}
          <div
            onClick={onNavigateToBbs}
            className="bg-white border border-indigo-300 rounded-xl p-3.5 shadow-2xs hover:border-indigo-500 hover:shadow-sm transition-all cursor-pointer space-y-2 bg-gradient-to-b from-indigo-100/30 to-transparent"
          >
            <div className="flex items-center justify-between text-indigo-800">
              <span className="text-xs font-extrabold">BBS & RCC</span>
              <span className="text-[10px] font-mono font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded shadow-2xs">Phase 15B</span>
            </div>
            <div>
              <p className="text-2xl font-black text-indigo-950 font-mono">IS 456 / BS</p>
              <p className="text-[11px] text-indigo-700 font-semibold mt-0.5">d²/162 Core & Shapes</p>
            </div>
          </div>

          {/* 6. Open Items */}
          <div
            onClick={onNavigateToOpenItems}
            className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs hover:border-amber-300 hover:shadow-xs transition-all cursor-pointer space-y-2"
          >
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">Open Items</span>
              <HelpCircle className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 font-mono">0</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Pending queries</p>
            </div>
          </div>

          {/* 7. BOQ Items */}
          <div
            onClick={onNavigateToBoq}
            className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer space-y-2"
          >
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">BOQ Schedule</span>
              <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 font-mono">Phase 9</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Unified measured schedule</p>
            </div>
          </div>

          {/* 8. Rate Analysis Engine (Phase 12) */}
          <div
            onClick={onNavigateToRateAnalysis}
            className="bg-white border border-emerald-200 rounded-xl p-3.5 shadow-2xs hover:border-emerald-400 hover:shadow-xs transition-all cursor-pointer space-y-2 bg-gradient-to-b from-emerald-50/40 to-transparent"
          >
            <div className="flex items-center justify-between text-emerald-800">
              <span className="text-xs font-bold">Rate Analysis & Pricing</span>
              <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded">Phase 12</span>
            </div>
            <div>
              <p className="text-2xl font-black text-emerald-950 font-mono">Build-up</p>
              <p className="text-[11px] text-emerald-700 mt-0.5">Direct cost, overhead & profit</p>
            </div>
          </div>

          {/* 9. Tender Management (Phase 13) */}
          <div
            onClick={onNavigateToTender}
            className="bg-white border border-indigo-300 rounded-xl p-3.5 shadow-2xs hover:border-indigo-500 hover:shadow-xs transition-all cursor-pointer space-y-2 bg-gradient-to-b from-indigo-50/60 to-transparent"
          >
            <div className="flex items-center justify-between text-indigo-900">
              <span className="text-xs font-black">Tender & Bid Submission</span>
              <span className="text-[10px] font-mono font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded">Phase 13</span>
            </div>
            <div>
              <p className="text-2xl font-black text-indigo-950 font-mono">Package</p>
              <p className="text-[11px] text-indigo-700 mt-0.5">Reconciliation, QA & 13-folder ZIP</p>
            </div>
          </div>
        </div>
      </div>

      {/* Engineering Settings & Measurement Standards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Card: Engineering & Standards */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-indigo-600" />
              <span>ENGINEERING & MEASUREMENT SETTINGS</span>
            </h3>
            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
              {project.engineeringSettings?.unitSystem || 'Metric'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Length</span>
              <span className="font-mono font-bold text-slate-800 text-sm">
                {project.engineeringSettings?.lengthUnit || 'm'}
              </span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Area</span>
              <span className="font-mono font-bold text-slate-800 text-sm">
                {project.engineeringSettings?.areaUnit || 'm²'}
              </span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Volume</span>
              <span className="font-mono font-bold text-slate-800 text-sm">
                {project.engineeringSettings?.volumeUnit || 'm³'}
              </span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Weight</span>
              <span className="font-mono font-bold text-slate-800 text-sm">
                {project.engineeringSettings?.weightUnit || 'kg'}
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-bold text-slate-600 block">Applicable Design Codes:</span>
            {project.engineeringSettings?.applicableCodes && project.engineeringSettings.applicableCodes.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {project.engineeringSettings.applicableCodes.map((code) => (
                  <span
                    key={code}
                    className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200"
                  >
                    {code}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                No design code configured yet. (Edit project to configure standards).
              </p>
            )}

            {project.engineeringSettings?.customCodes && (
              <p className="text-xs text-slate-600 font-mono mt-1">
                Custom Specs: {project.engineeringSettings.customCodes}
              </p>
            )}
          </div>
        </div>

        {/* Right Card: Consultant Team */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>CONSULTANT & DESIGN TEAM</span>
            </h3>
            <span className="text-[11px] text-slate-500">
              {project.consultants?.length ? `${project.consultants.length} Specialized Firms` : 'Primary Consultants'}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {project.consultant?.leadConsultant && (
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-500">Lead Consultant:</span>
                <span className="font-bold text-slate-800">{project.consultant.leadConsultant}</span>
              </div>
            )}

            {project.consultant?.architect && (
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-500">Architect:</span>
                <span className="font-bold text-slate-800">{project.consultant.architect}</span>
              </div>
            )}

            {project.consultant?.structuralConsultant && (
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-500">Structural Consultant:</span>
                <span className="font-bold text-slate-800">{project.consultant.structuralConsultant}</span>
              </div>
            )}

            {project.consultant?.mepConsultant && (
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-500">MEP Consultant:</span>
                <span className="font-bold text-slate-800">{project.consultant.mepConsultant}</span>
              </div>
            )}

            {project.consultants && project.consultants.length > 0 && (
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                {project.consultants.map((c) => (
                  <div key={c.id} className="flex justify-between items-center text-[11px] text-slate-600">
                    <span>{c.role}: <strong className="text-slate-800">{c.name}</strong></span>
                    {c.contactPerson && <span className="text-slate-400">({c.contactPerson})</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Project Notes / Special Requirements Panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
        <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-600" />
          <span>PROJECT-SPECIFIC NOTES & SPECIAL REQUIREMENTS</span>
        </h3>

        {project.projectNotes ? (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
            {project.projectNotes}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-lg border border-slate-100">
            No special project notes or tender restrictions entered. Click [EDIT PROJECT] to add measurement rules, wastage allowances, or addenda items.
          </p>
        )}
      </div>
    </div>
  );
};
