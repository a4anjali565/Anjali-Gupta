import React, { useState, useMemo } from 'react';
import { Settlement, BasinId, InundationSeverity } from '../types/flood';
import { Search, Download, AlertTriangle, Hospital, School, ArrowUpDown, ChevronRight } from 'lucide-react';

interface SettlementTriageTableProps {
  settlements: Settlement[];
  onSelectSettlement: (settlement: Settlement) => void;
  onFocusOnMap: (settlement: Settlement) => void;
}

export const SettlementTriageTable: React.FC<SettlementTriageTableProps> = ({
  settlements,
  onSelectSettlement,
  onFocusOnMap,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [basinFilter, setBasinFilter] = useState<BasinId | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<InundationSeverity | 'all'>('all');
  const [sortBy, setSortBy] = useState<'depth' | 'population' | 'marooned' | 'kacchi'>('depth');
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');

  const filteredAndSortedSettlements = useMemo(() => {
    return settlements
      .filter((s) => {
        if (basinFilter !== 'all' && s.basin !== basinFilter) return false;
        if (severityFilter !== 'all' && s.severity !== severityFilter) return false;
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          const matchName = s.name.toLowerCase().includes(q);
          const matchNe = s.nepaliName.includes(q);
          const matchDist = s.district.toLowerCase().includes(q);
          if (!matchName && !matchNe && !matchDist) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let valA = 0;
        let valB = 0;
        if (sortBy === 'depth') {
          valA = a.waterDepthCm;
          valB = b.waterDepthCm;
        } else if (sortBy === 'population') {
          valA = a.affectedPopulation;
          valB = b.affectedPopulation;
        } else if (sortBy === 'marooned') {
          valA = a.maroonedHouseholds;
          valB = b.maroonedHouseholds;
        } else if (sortBy === 'kacchi') {
          valA = a.kacchiHousePercent;
          valB = b.kacchiHousePercent;
        }
        return sortDirection === 'desc' ? valB - valA : valA - valB;
      });
  }, [settlements, basinFilter, severityFilter, searchQuery, sortBy, sortDirection]);

  const handleExportCSV = () => {
    const headers = [
      'Rank',
      'Settlement Name',
      'Nepali Name',
      'District',
      'Province',
      'River Basin',
      'Elevation (m)',
      'Water Depth (cm)',
      'Severity',
      'Affected Population',
      'Marooned Households',
      'Kacchi House %',
      'Submerged Paddy (ha)',
      'Hospital at Risk',
      'Handpump Contamination',
      'Evacuation Destination',
    ];

    const rows = filteredAndSortedSettlements.map((s, idx) => [
      idx + 1,
      `"${s.name}"`,
      `"${s.nepaliName}"`,
      `"${s.district}"`,
      `"${s.province}"`,
      `"${s.basin}"`,
      s.elevationM,
      s.waterDepthCm,
      s.severity,
      s.affectedPopulation,
      s.maroonedHouseholds,
      s.kacchiHousePercent,
      s.submergedPaddyHa,
      s.hospitalAtRisk ? 'Yes' : 'No',
      s.handpumpContaminationRisk,
      `"${s.evacuationDestination}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Nepal_Terai_Flood_Settlement_Impact_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSort = (field: 'depth' | 'population' | 'marooned' | 'kacchi') => {
    if (sortBy === field) {
      setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
  };

  return (
    <div className="bg-slate-950 p-6 space-y-4">
      {/* Search and Filters Header */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search settlement, district, or ward..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-md text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>

        {/* Filter Segmented Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Basin Filter */}
          <select
            value={basinFilter}
            onChange={(e) => setBasinFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-md text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="all">All River Basins</option>
            <option value="koshi">Koshi Basin</option>
            <option value="bagmati_kamala">Bagmati & Kamala</option>
            <option value="narayani">Narayani Basin</option>
            <option value="west_rapti_babai">West Rapti & Babai</option>
            <option value="karnali">Karnali Basin</option>
            <option value="mahakali_mohana">Mahakali & Mohana</option>
          </select>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-md text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="all">All Inundation Tiers</option>
            <option value="critical">Critical (&gt;1.5m / Marooned)</option>
            <option value="severe">Severe (1.0m - 1.5m)</option>
            <option value="moderate">Moderate (0.5m - 1.0m)</option>
            <option value="shallow">Shallow (&lt;0.5m)</option>
          </select>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-md hover:bg-slate-800 hover:text-white transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="border border-slate-800 rounded-lg overflow-x-auto bg-slate-900/60">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-mono uppercase tracking-wider">
              <th className="py-3 px-4 w-12 text-center">#</th>
              <th className="py-3 px-4">Settlement / Ward</th>
              <th className="py-3 px-4">District / Basin</th>
              <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => toggleSort('depth')}>
                <div className="flex items-center gap-1">
                  <span>Water Depth</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => toggleSort('population')}>
                <div className="flex items-center gap-1">
                  <span>Affected Pop</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => toggleSort('marooned')}>
                <div className="flex items-center gap-1">
                  <span>Marooned HH</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => toggleSort('kacchi')}>
                <div className="flex items-center gap-1">
                  <span>Kacchi Risk</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4">Lifeline Facilities</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredAndSortedSettlements.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500">
                  No settlements matching search criteria.
                </td>
              </tr>
            ) : (
              filteredAndSortedSettlements.map((s, idx) => (
                <tr
                  key={s.id}
                  className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                  onClick={() => onSelectSettlement(s)}
                >
                  <td className="py-3 px-4 text-center font-mono text-slate-400">
                    {idx + 1}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white group-hover:text-sky-300 transition-colors">
                      {s.name}
                    </div>
                    <div className="text-[11px] text-slate-400 font-sans">
                      {s.nepaliName}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-slate-200">{s.district}</div>
                    <div className="text-[11px] text-slate-400 capitalize">
                      {s.basin.replace('_', ' ')}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            s.waterDepthCm >= 150
                              ? 'bg-rose-500'
                              : s.waterDepthCm >= 100
                              ? 'bg-orange-500'
                              : s.waterDepthCm >= 50
                              ? 'bg-yellow-400'
                              : 'bg-sky-400'
                          }`}
                          style={{ width: `${Math.min(100, (s.waterDepthCm / 220) * 100)}%` }}
                        />
                      </div>
                      <span className="font-mono font-bold tabular-nums text-white">
                        {s.waterDepthCm} cm
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums text-slate-200">
                    {s.affectedPopulation.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums text-amber-400 font-semibold">
                    {s.maroonedHouseholds.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums">
                    <span className={s.kacchiHousePercent > 65 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                      {s.kacchiHousePercent}%
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {s.hospitalAtRisk && (
                        <span className="text-rose-400 inline-flex items-center gap-1 text-[11px]" title="Hospital Inundated">
                          <Hospital className="w-3.5 h-3.5 text-rose-400" />
                          <span>Clinic At Risk</span>
                        </span>
                      )}
                      {s.schoolShelterAvailable ? (
                        <span className="text-emerald-400 inline-flex items-center gap-1 text-[11px]" title="Designated School Shelter Available">
                          <School className="w-3.5 h-3.5" />
                          <span>Shelter</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">No Shelter</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onFocusOnMap(s)}
                        className="px-2 py-1 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors whitespace-nowrap"
                      >
                        Locate Map
                      </button>
                      <button
                        onClick={() => onSelectSettlement(s)}
                        className="p-1 text-slate-400 hover:text-sky-300 rounded transition-colors"
                        title="View Full Settlement Assessment"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
