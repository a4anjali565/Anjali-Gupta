import React from 'react';
import { ShieldAlert, Droplets, Home, Users, Wheat, Activity } from 'lucide-react';

interface MetricsBarProps {
  totalFloodAreaKm2: number;
  totalAffectedPop: number;
  totalDisplacedPop: number;
  totalDamagedHouses: number;
  totalSubmergedCropsHa: number;
  criticalGaugesCount: number;
  embankmentBreached: boolean;
  selectedBasin: string;
}

export const OverviewMetricsBar: React.FC<MetricsBarProps> = ({
  totalFloodAreaKm2,
  totalAffectedPop,
  totalDisplacedPop,
  totalDamagedHouses,
  totalSubmergedCropsHa,
  criticalGaugesCount,
  embankmentBreached,
  selectedBasin,
}) => {
  return (
    <div className="bg-slate-900/90 border-b border-slate-800 text-slate-100 px-6 py-3">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left: Basin Context with zero-pill typography */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="font-semibold text-slate-200 uppercase tracking-wider font-mono">
            {selectedBasin === 'all' ? 'All 18 Terai Districts' : `${selectedBasin.replace('_', ' ').toUpperCase()} Basin`}
          </span>
          <span aria-hidden="true">·</span>
          <span>Sentinel-1 SAR C-Band Level 2</span>
          <span aria-hidden="true">·</span>
          <span>DHM Flood Early Warning</span>
        </div>

        {/* Right: Emergency State Tag */}
        <div className="flex items-center gap-3 text-xs">
          {embankmentBreached ? (
            <div className="flex items-center gap-1.5 text-rose-400 font-semibold font-mono">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <span>CRITICAL: Embankment Breach Active</span>
            </div>
          ) : criticalGaugesCount > 0 ? (
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold font-mono">
              <Activity className="w-4 h-4 text-amber-500" />
              <span>ALERT: {criticalGaugesCount} Gauges Exceeding Danger Level</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold font-mono">
              <span>● River Basins High Flow (Monsoon Peak)</span>
            </div>
          )}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3">
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3">
          <div className="text-[11px] font-mono tracking-wider uppercase text-slate-400 flex items-center justify-between">
            <span>Flood Extent</span>
            <Droplets className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono tabular-nums text-white">
              {totalFloodAreaKm2.toLocaleString()}
            </span>
            <span className="text-xs font-mono text-slate-400">km²</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            SAR specular detection
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3">
          <div className="text-[11px] font-mono tracking-wider uppercase text-slate-400 flex items-center justify-between">
            <span>Exposed Population</span>
            <Users className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono tabular-nums text-white">
              {totalAffectedPop.toLocaleString()}
            </span>
            <span className="text-xs font-mono text-slate-400">people</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Inundated ward boundaries
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3">
          <div className="text-[11px] font-mono tracking-wider uppercase text-slate-400 flex items-center justify-between">
            <span>Marooned / Displaced</span>
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono tabular-nums text-amber-400">
              {totalDisplacedPop.toLocaleString()}
            </span>
            <span className="text-xs font-mono text-slate-400">need rescue</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Boat/helicopter evacuation
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3">
          <div className="text-[11px] font-mono tracking-wider uppercase text-slate-400 flex items-center justify-between">
            <span>Damaged Dwellings</span>
            <Home className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono tabular-nums text-white">
              {totalDamagedHouses.toLocaleString()}
            </span>
            <span className="text-xs font-mono text-slate-400">units</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            High-risk thatch/mud houses
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 col-span-2 md:col-span-1">
          <div className="text-[11px] font-mono tracking-wider uppercase text-slate-400 flex items-center justify-between">
            <span>Submerged Crops</span>
            <Wheat className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono tabular-nums text-white">
              {totalSubmergedCropsHa.toLocaleString()}
            </span>
            <span className="text-xs font-mono text-slate-400">ha</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Monsoon paddy fields
          </div>
        </div>
      </div>
    </div>
  );
};
