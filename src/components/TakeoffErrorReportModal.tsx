import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Filter,
  Search,
  Download,
  Printer,
  FileSpreadsheet,
  Check,
  Edit2
} from 'lucide-react';
import { TakeoffErrorReportItem } from '../types';
import { EndToEndValidationEngine } from '../engine/endToEndValidationSuite';

interface TakeoffErrorReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TakeoffErrorReportModal: React.FC<TakeoffErrorReportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [reports, setReports] = useState<TakeoffErrorReportItem[]>(() =>
    EndToEndValidationEngine.getTakeoffErrorReports()
  );
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [disciplineFilter, setDisciplineFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionText, setResolutionText] = useState('');

  if (!isOpen) return null;

  const filteredReports = reports.filter((item) => {
    if (severityFilter !== 'ALL' && item.severity !== severityFilter) return false;
    if (disciplineFilter !== 'ALL' && item.discipline !== disciplineFilter) return false;
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.issue.toLowerCase().includes(q) ||
        item.itemCode.toLowerCase().includes(q) ||
        item.drawingNumber.toLowerCase().includes(q) ||
        item.discipline.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const criticalCount = reports.filter((r) => r.severity === 'CRITICAL' && r.status !== 'RESOLVED').length;
  const highCount = reports.filter((r) => r.severity === 'HIGH' && r.status !== 'RESOLVED').length;
  const resolvedCount = reports.filter((r) => r.status === 'RESOLVED').length;

  const disciplines = Array.from(new Set(reports.map((r) => r.discipline)));

  // Resolve item
  const handleResolve = (id: string) => {
    if (!resolutionText.trim()) return;
    setReports(
      reports.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'RESOLVED' as const,
              resolution: resolutionText,
              resolvedBy: 'Lead QS Engineer',
              resolvedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
            }
          : r
      )
    );
    setResolvingId(null);
    setResolutionText('');
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = ['Issue ID', 'Discipline', 'Item Code', 'Issue Description', 'Drawing', 'Severity', 'Status', 'Resolution', 'Resolved By', 'Resolved At'];
    const rows = reports.map((r) => [
      `"${r.id}"`,
      `"${r.discipline}"`,
      `"${r.itemCode}"`,
      `"${r.issue.replace(/"/g, '""')}"`,
      `"${r.drawingNumber}"`,
      `"${r.severity}"`,
      `"${r.status}"`,
      `"${(r.resolution || '').replace(/"/g, '""')}"`,
      `"${r.resolvedBy || ''}"`,
      `"${r.resolvedAt || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Takeoff_Error_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-600 flex items-center justify-center text-white shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Takeoff Error & Review Audit Report</h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                  DEFECT LOG
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Formal register of unreadable dimensions, cross-drawing conflicts, missing specifications, and resolutions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Summary Metric Strip */}
        <div className="px-6 py-3 bg-slate-100/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600">Critical Open:</span>
              <span className="text-sm font-bold text-rose-700">{criticalCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600">High Open:</span>
              <span className="text-sm font-bold text-amber-700">{highCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600">Resolved:</span>
              <span className="text-sm font-bold text-emerald-700">{resolvedCount}</span>
            </div>
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search issues, codes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs w-48 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>

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

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Issue ID</th>
                  <th className="py-2.5 px-3">Discipline</th>
                  <th className="py-2.5 px-3">Item Code</th>
                  <th className="py-2.5 px-4">Issue Description</th>
                  <th className="py-2.5 px-3">Drawing</th>
                  <th className="py-2.5 px-3 text-center">Severity</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-4">Resolution Details</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-3 font-mono font-bold text-slate-700">{report.id}</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
                        {report.discipline}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono text-indigo-700 font-bold whitespace-nowrap">
                      {report.itemCode}
                    </td>
                    <td className="py-2 px-4 font-medium text-slate-900 max-w-xs">{report.issue}</td>
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {report.drawingNumber}
                    </td>
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          report.severity === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : report.severity === 'HIGH'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {report.severity}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          report.status === 'RESOLVED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : report.status === 'IN_REVIEW'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {report.status}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-slate-700 text-[11px] max-w-sm">
                      {resolvingId === report.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            placeholder="Enter resolution notes..."
                            value={resolutionText}
                            onChange={(e) => setResolutionText(e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-indigo-300 rounded text-xs"
                          />
                          <button
                            onClick={() => handleResolve(report.id)}
                            className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setResolvingId(null)}
                            className="p-1 text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <span>{report.resolution || <em className="text-slate-400">Pending resolution</em>}</span>
                          {report.resolvedBy && (
                            <span className="block text-[10px] text-slate-400 mt-0.5">
                              by {report.resolvedBy} on {report.resolvedAt}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      {report.status !== 'RESOLVED' && resolvingId !== report.id && (
                        <button
                          onClick={() => {
                            setResolvingId(report.id);
                            setResolutionText('');
                          }}
                          className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-[11px] font-bold"
                        >
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>All resolved takeoff issues maintain permanent audit histories in the project tender package.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
