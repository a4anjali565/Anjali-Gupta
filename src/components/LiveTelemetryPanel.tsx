import React from 'react';
import { RiverGauge, SARPassLog } from '../types/flood';
import { Activity, Satellite, ArrowUpRight, ArrowDownRight, Minus, AlertTriangle, ShieldCheck, Radio } from 'lucide-react';

interface LiveTelemetryPanelProps {
  gauges: RiverGauge[];
  sarLogs: SARPassLog[];
  isStreaming: boolean;
}

export const LiveTelemetryPanel: React.FC<LiveTelemetryPanelProps> = ({
  gauges,
  sarLogs,
  isStreaming,
}) => {
  return (
    <div className="bg-slate-950 p-6 space-y-6 text-slate-100">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Radio className="w-4 h-4 text-sky-400" />
            <span>Hydro-Meteorological Telemetry &amp; SAR Change Detection</span>
          </h2>
          <div className="text-xs text-slate-400 mt-0.5">
            Real-time automated feed from Nepal Department of Hydrology &amp; Meteorology (DHM) and Copernicus Sentinel-1 Radar constellation.
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
            <span className="text-slate-400">Stream Status:</span>
            <span className={isStreaming ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
              {isStreaming ? 'LIVE (10s Polling)' : 'PAUSED'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Left River Gauges (70%) - Right SAR Constellation Logs (30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* River Gauges */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-sky-400" />
              <span>DHM River Stations &amp; Flood Inundation Gauges (10 Stations)</span>
            </h3>
            <span className="text-[11px] text-slate-400">Levels in meters (m)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {gauges.map((gauge) => {
              const isDanger = gauge.currentLevelM >= gauge.dangerLevelM;
              const isWarning = gauge.currentLevelM >= gauge.warningLevelM;
              const percentOfDanger = Math.min(100, (gauge.currentLevelM / (gauge.dangerLevelM * 1.15)) * 100);

              return (
                <div
                  key={gauge.id}
                  className={`p-3.5 rounded-lg border transition-all ${
                    isDanger
                      ? 'bg-rose-950/20 border-rose-800/80 shadow-sm'
                      : isWarning
                      ? 'bg-amber-950/20 border-amber-800/60'
                      : 'bg-slate-900/80 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-semibold text-white">
                        {gauge.name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-sans">
                        {gauge.nepaliName} · {gauge.river}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 font-mono text-xs">
                      {gauge.trend === 'rising' ? (
                        <span className="text-rose-400 flex items-center">
                          <ArrowUpRight className="w-3.5 h-3.5" /> Rising
                        </span>
                      ) : gauge.trend === 'receding' ? (
                        <span className="text-emerald-400 flex items-center">
                          <ArrowDownRight className="w-3.5 h-3.5" /> Receding
                        </span>
                      ) : (
                        <span className="text-slate-400 flex items-center">
                          <Minus className="w-3.5 h-3.5" /> Steady
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Level readout */}
                  <div className="mt-3 flex items-baseline justify-between font-mono">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-2xl font-bold ${isDanger ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-sky-300'}`}>
                        {gauge.currentLevelM.toFixed(2)}
                      </span>
                      <span className="text-xs text-slate-400">m</span>
                    </div>

                    <div className="text-right text-[11px] text-slate-400">
                      <div>Warning: <span className="text-amber-300 font-bold">{gauge.warningLevelM}m</span></div>
                      <div>Danger: <span className="text-rose-400 font-bold">{gauge.dangerLevelM}m</span></div>
                    </div>
                  </div>

                  {/* Visual gauge bar */}
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mt-2 relative border border-slate-800">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isDanger ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : 'bg-sky-400'
                      }`}
                      style={{ width: `${percentOfDanger}%` }}
                    />
                  </div>

                  {/* Discharge & Time */}
                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Discharge: <span className="text-slate-200 font-semibold">{gauge.dischargeCusecs.toLocaleString()}</span> cusecs</span>
                    <span>{gauge.lastUpdated}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Remote Sensing SAR Constellation Orbit Logs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-2">
              <Satellite className="w-3.5 h-3.5 text-sky-400" />
              <span>SAR Constellation Passes</span>
            </h3>
          </div>

          <div className="space-y-3">
            {sarLogs.map((log, index) => (
              <div
                key={index}
                className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sky-300">{log.satellite}</span>
                  <span className="font-mono text-[10px] text-slate-400">{log.orbitDirection} (Orbit {log.relativeOrbit})</span>
                </div>

                <div className="text-slate-400 text-[11px]">
                  Sensor: <span className="text-slate-200 font-mono">{log.sensor}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                  <div className="bg-slate-950 p-2 rounded border border-slate-800">
                    <div className="text-slate-500 text-[10px]">Δσ⁰ Backscatter:</div>
                    <div className="text-white font-bold">{log.backscatterDeltaDb} dB</div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800">
                    <div className="text-slate-500 text-[10px]">Confidence:</div>
                    <div className="text-emerald-400 font-bold">{log.confidenceScore}%</div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                  <span>Coverage: {log.coverageAreaKm2.toLocaleString()} km²</span>
                  <span>{log.acquisitionTime}</span>
                </div>
              </div>
            ))}

            {/* Technical note on SAR methodology */}
            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-lg text-[11px] text-slate-400 space-y-1.5">
              <div className="font-semibold text-slate-300 font-mono text-xs">
                SAR Detection Methodology Note:
              </div>
              <p>
                C-band synthetic aperture radar (Sentinel-1) transmits microwaves that pierce heavy Himalayan monsoon cloud cover. Calm standing water exhibits specular reflection, bouncing radar pulses away and resulting in a steep drop in backscatter coefficient (&lt; -16.5 dB) compared to dry soil or vegetation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
