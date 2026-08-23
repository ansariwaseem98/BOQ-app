import React, { useState } from 'react';
import { 
  Scale, 
  Plus, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  ShieldCheck,
  Layers,
  X
} from 'lucide-react';
import { BbsBarRecord, BarShapeCode, SteelRebarGrade, DetectedElement } from '../types';
import { computeBbsSummary, generateBbsRecord, REBAR_UNIT_WEIGHTS } from '../engine/bbsEngine';

interface BbsViewerProps {
  bbsRecords?: BbsBarRecord[];
  elements?: DetectedElement[];
  onSelectElement?: (elementId: string) => void;
  onAddBbsRecord?: (record: BbsBarRecord) => void;
  onDeleteBbsRecord?: (id: string) => void;
  onExportExcel?: () => void;
}

export const BbsViewer: React.FC<BbsViewerProps> = ({
  bbsRecords = [],
  elements = [],
  onSelectElement,
  onAddBbsRecord,
  onDeleteBbsRecord,
  onExportExcel,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDia, setSelectedDia] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);

  // New BBS Item state
  const [newBar, setNewBar] = useState<{
    barMark: string;
    memberName: string;
    level: string;
    diameterMm: 8 | 10 | 12 | 16 | 20 | 25 | 32 | 40;
    shapeCode: BarShapeCode;
    rebarGrade: SteelRebarGrade;
    aMm: number;
    bMm: number;
    cMm: number;
    dMm: number;
    eMm: number;
    memberCount: number;
    barsPerMember: number;
    drawingReference: string;
  }>({
    barMark: 'B1-BOT1',
    memberName: 'Floor Beam B1 Bottom Rebar',
    level: 'Level 02',
    diameterMm: 20,
    shapeCode: '11',
    rebarGrade: 'Fe500D',
    aMm: 6000,
    bMm: 500,
    cMm: 0,
    dMm: 0,
    eMm: 0,
    memberCount: 2,
    barsPerMember: 3,
    drawingReference: 'S-201',
  });

  const bbsSummary = computeBbsSummary(bbsRecords);

  const filteredRecords = bbsRecords.filter((rec) => {
    const matchesSearch =
      rec.barMark.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.drawingReference.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDia =
      selectedDia === 'All' || rec.diameterMm.toString() === selectedDia;
    return matchesSearch && matchesDia;
  });

  const handleCreateBar = () => {
    const generated = generateBbsRecord({
      barMark: newBar.barMark,
      memberId: 'MANUAL',
      memberName: newBar.memberName,
      level: newBar.level,
      drawingReference: newBar.drawingReference,
      drawingId: 'DRW-MANUAL',
      diameterMm: newBar.diameterMm,
      rebarGrade: newBar.rebarGrade,
      shapeCode: newBar.shapeCode,
      aMm: newBar.aMm,
      bMm: newBar.bMm,
      cMm: newBar.cMm,
      dMm: newBar.dMm,
      eMm: newBar.eMm,
      memberCount: newBar.memberCount,
      barsPerMember: newBar.barsPerMember,
    });

    if (onAddBbsRecord) {
      onAddBbsRecord(generated);
    }
    setShowAddModal(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8FAFC] text-slate-800 select-none overflow-hidden">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 p-4 shrink-0 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Bar Bending Schedule (BBS Rebar Engine)</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600 border border-slate-200">
                  {bbsRecords.length} Bar Marks
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                BS 8666 / IS 2502 compliant cutting length algorithms, bend deductions & diameter weight matrix
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="bg-indigo-50/70 border border-indigo-100 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Total Steel:</span>
              <span className="font-mono text-sm font-black text-indigo-700">
                {(bbsSummary.totalWeightTons || 0).toFixed(2)} MT ({(bbsSummary.totalWeightKg || 0).toLocaleString()} kg)
              </span>
            </div>

            {onAddBbsRecord && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Bar Mark</span>
              </button>
            )}

            {onExportExcel && (
              <button
                onClick={onExportExcel}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export BBS Excel</span>
              </button>
            )}
          </div>
        </div>

        {/* Rebar Diameter Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-2 border-t border-slate-100">
          {([8, 10, 12, 16, 20, 25, 32, 40] as const).map((dia) => {
            const summaryItem = bbsSummary.byDiameter?.find((s) => s.diameterMm === dia);
            const weightTon = summaryItem?.totalWeightTons || 0;
            return (
              <div
                key={dia}
                onClick={() => setSelectedDia(selectedDia === dia.toString() ? 'All' : dia.toString())}
                className={`p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                  selectedDia === dia.toString()
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold'
                    : 'border-slate-200 bg-slate-50/70 hover:bg-white text-slate-700'
                }`}
              >
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span>Ø {dia} mm</span>
                  <span className="font-mono">({REBAR_UNIT_WEIGHTS[dia]} kg/m)</span>
                </div>
                <div className="font-mono font-bold text-slate-900 mt-1">
                  {weightTon > 0 ? `${weightTon.toFixed(2)} T` : '0.00 T'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Search bar */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search bar mark, member name, sheet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
            />
          </div>

          <div className="text-xs text-slate-500">
            Showing {filteredRecords.length} of {bbsRecords.length} records
          </div>
        </div>
      </div>

      {/* BBS Schedule Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-3">Bar Mark</th>
              <th className="py-2.5 px-3">Structural Member</th>
              <th className="py-2.5 px-2 text-center">Dia (mm)</th>
              <th className="py-2.5 px-2 text-center">Grade</th>
              <th className="py-2.5 px-2 text-center">Shape</th>
              <th className="py-2.5 px-3">Dimensions (mm)</th>
              <th className="py-2.5 px-2 text-right">Cut L (m)</th>
              <th className="py-2.5 px-2 text-center">No. Members</th>
              <th className="py-2.5 px-2 text-center">Bars/Member</th>
              <th className="py-2.5 px-2 text-right">Total Bars</th>
              <th className="py-2.5 px-3 text-right">Total Length (m)</th>
              <th className="py-2.5 px-3 text-right">Weight (kg)</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={13} className="py-12 text-center text-slate-400">
                  No BBS bar records found.
                </td>
              </tr>
            ) : (
              filteredRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2 px-3 font-mono font-bold text-indigo-700 whitespace-nowrap">
                    {rec.barMark}
                  </td>
                  <td className="py-2 px-3">
                    <p className="font-semibold text-slate-900">{rec.memberName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {rec.drawingReference} • {rec.level}
                    </p>
                  </td>
                  <td className="py-2 px-2 text-center font-mono font-bold text-slate-800">
                    Ø{rec.diameterMm}
                  </td>
                  <td className="py-2 px-2 text-center font-mono text-[10px] text-slate-600">
                    {rec.rebarGrade}
                  </td>
                  <td className="py-2 px-2 text-center">
                    <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      Code {rec.shapeCode}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-mono text-[11px] text-slate-600">
                    {rec.aMm ? `A:${rec.aMm} ` : ''}
                    {rec.bMm ? `B:${rec.bMm} ` : ''}
                    {rec.cMm ? `C:${rec.cMm} ` : ''}
                  </td>
                  <td className="py-2 px-2 text-right font-mono font-semibold text-slate-900">
                    {rec.cuttingLengthM.toFixed(3)}
                  </td>
                  <td className="py-2 px-2 text-center font-mono">{rec.memberCount}</td>
                  <td className="py-2 px-2 text-center font-mono">{rec.barsPerMember}</td>
                  <td className="py-2 px-2 text-right font-mono font-bold text-slate-900">
                    {rec.totalBars}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-slate-700">
                    {rec.totalLengthM.toFixed(2)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-black text-indigo-700">
                    {rec.totalWeightKg.toFixed(2)}
                  </td>
                  <td className="py-2 px-3 text-right">
                    {onDeleteBbsRecord && (
                      <button
                        onClick={() => onDeleteBbsRecord(rec.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add BBS Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden text-slate-800">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Add BBS Rebar Record</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Bar Mark</label>
                  <input
                    type="text"
                    value={newBar.barMark}
                    onChange={(e) => setNewBar({ ...newBar, barMark: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Structural Member</label>
                  <input
                    type="text"
                    value={newBar.memberName}
                    onChange={(e) => setNewBar({ ...newBar, memberName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Diameter (mm)</label>
                  <select
                    value={newBar.diameterMm}
                    onChange={(e) => setNewBar({ ...newBar, diameterMm: Number(e.target.value) as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-mono"
                  >
                    {[8, 10, 12, 16, 20, 25, 32, 40].map((d) => (
                      <option key={d} value={d}>Ø{d} mm</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Shape Code (BS 8666)</label>
                  <select
                    value={newBar.shapeCode}
                    onChange={(e) => setNewBar({ ...newBar, shapeCode: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-mono"
                  >
                    <option value="00">00 - Straight</option>
                    <option value="11">11 - L-Bend (Single hook)</option>
                    <option value="21">21 - U-Bar</option>
                    <option value="51">51 - Column / Beam Stirrup Link</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Dimension A (mm)</label>
                  <input
                    type="number"
                    value={newBar.aMm}
                    onChange={(e) => setNewBar({ ...newBar, aMm: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Dimension B (mm)</label>
                  <input
                    type="number"
                    value={newBar.bMm}
                    onChange={(e) => setNewBar({ ...newBar, bMm: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">No. of Members</label>
                  <input
                    type="number"
                    value={newBar.memberCount}
                    onChange={(e) => setNewBar({ ...newBar, memberCount: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Bars per Member</label>
                  <input
                    type="number"
                    value={newBar.barsPerMember}
                    onChange={(e) => setNewBar({ ...newBar, barsPerMember: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBar}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold cursor-pointer"
              >
                Create Bar Mark
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
