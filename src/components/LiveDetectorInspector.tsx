import React from 'react';
import { ProbeResult, DetectionEvent } from '../types/detector';
import { Crosshair, Radio, ShieldAlert, AlertTriangle, Activity, Waves, MapPin, X, ArrowDown, ExternalLink } from 'lucide-react';

interface LiveDetectorInspectorProps {
  probe: ProbeResult | null;
  onClearProbe: () => void;
  probeModeActive: boolean;
  onToggleProbeMode: () => void;
  events: DetectionEvent[];
  onSelectEvent: (event: DetectionEvent) => void;
  sensitivityThresholdDb: number;
  onChangeSensitivity: (val: number) => void;
}

export const LiveDetectorInspector: React.FC<LiveDetectorInspectorProps> = ({
  probe,
  onClearProbe,
  probeModeActive,
  onToggleProbeMode,
  events,
  onSelectEvent,
  sensitivityThresholdDb,
  onChangeSensitivity,
}) => {
  return (
    <div className="bg-slate-900 border-t border-slate-800 p-4 text-slate-100">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive SAR Pixel Probe HUD */}
        <div className="lg:col-span-1 bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Crosshair className={`w-4 h-4 ${probeModeActive ? 'text-rose-400 animate-spin' : 'text-sky-400'}`} />
              <span className="text-xs font-mono uppercase tracking-wider font-bold text-white">
                Live SAR Pixel Probe
              </span>
            </div>

            <button
              onClick={onToggleProbeMode}
              className={`px-2 py-0.5 text-[11px] font-mono font-bold rounded transition-colors ${
                probeModeActive
                  ? 'bg-rose-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              {probeModeActive ? 'PROBE ACTIVE (CLICK MAP)' : 'ENABLE PROBE'}
            </button>
          </div>

          {probe ? (
            <div className="space-y-3 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>COORDINATES:</span>
                <span className="text-white font-bold">
                  {probe.lat.toFixed(4)}°N, {probe.lng.toFixed(4)}°E
                </span>
              </div>

              {/* Surface Classification Badge */}
              <div
                className={`p-2.5 rounded border flex items-center justify-between ${
                  probe.surfaceClass === 'Standing Flood Water'
                    ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                    : probe.surfaceClass === 'Saturated Wet Soil'
                    ? 'bg-amber-950/40 border-amber-800 text-amber-300'
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Detection Result</div>
                  <div className="font-bold text-xs">{probe.surfaceClass}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase">Confidence</div>
                  <div className="font-bold text-white">{probe.waterConfidencePercent}%</div>
                </div>
              </div>

              {/* Telemetry Metric Grid */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">SAR Backscatter (σ⁰):</span>
                  <span className={`text-sm font-bold ${probe.backscatterDb < sensitivityThresholdDb ? 'text-rose-400' : 'text-slate-200'}`}>
                    {probe.backscatterDb} dB
                  </span>
                  <span className="text-[10px] text-slate-500 block">Thresh: {sensitivityThresholdDb} dB</span>
                </div>

                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Est. Inundation Depth:</span>
                  <span className="text-sm font-bold text-sky-400">
                    {probe.estimatedDepthCm} cm
                  </span>
                  <span className="text-[10px] text-slate-500 block">Elev: {probe.elevationM}m ASL</span>
                </div>
              </div>

              {/* Geographic Context */}
              <div className="p-2 bg-slate-900/60 rounded border border-slate-800/80 text-[11px] text-slate-300 space-y-1">
                <div>
                  <span className="text-slate-500">Nearest River:</span>{' '}
                  <span className="text-white font-semibold">{probe.nearestRiver}</span>{' '}
                  <span className="text-slate-400">({probe.distanceToRiverKm} km)</span>
                </div>
                <div>
                  <span className="text-slate-500">Nearest Settlement:</span>{' '}
                  <span className="text-white font-semibold">{probe.nearestSettlement}</span>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={onClearProbe}
                  className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Clear Probe Crosshair
                </button>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-slate-500 text-xs font-mono space-y-1">
              <Crosshair className="w-6 h-6 mx-auto text-slate-600 mb-2 opacity-50" />
              <div>Click any point on the Nepal Terai GIS map</div>
              <div className="text-[10px] text-slate-600">
                to perform immediate SAR backscatter pixel diagnostics
              </div>
            </div>
          )}

          {/* Sensitivity Threshold Slider */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
              <span>SAR Water Threshold:</span>
              <span className="text-sky-400 font-bold">{sensitivityThresholdDb} dB</span>
            </div>
            <input
              type="range"
              min="-20"
              max="-14"
              step="0.5"
              value={sensitivityThresholdDb}
              onChange={(e) => onChangeSensitivity(Number(e.target.value))}
              className="w-full accent-sky-400 cursor-pointer h-1 bg-slate-800 rounded"
            />
          </div>
        </div>

        {/* Right Columns (2-Span): Live Detection Stream Log */}
        <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
              <span className="text-xs font-mono uppercase tracking-wider font-bold text-white">
                Live Sensor &amp; Satellite Detection Stream ({events.length} Events)
              </span>
            </div>

            <span className="text-[10px] font-mono text-slate-400">
              Auto-updating via DHM &amp; Copernicus Orbit Feed
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-56 space-y-2 pr-1 font-mono text-xs">
            {events.map((event) => (
              <div
                key={event.id}
                onClick={() => onSelectEvent(event)}
                className={`p-2.5 rounded border cursor-pointer transition-colors flex items-start justify-between gap-3 ${
                  event.severity === 'critical'
                    ? 'bg-rose-950/20 border-rose-800/60 hover:bg-rose-950/40 text-rose-200'
                    : event.severity === 'warning'
                    ? 'bg-amber-950/20 border-amber-800/50 hover:bg-amber-950/40 text-amber-200'
                    : 'bg-slate-900 border-slate-800 hover:bg-slate-850 text-slate-300'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5">
                    {event.severity === 'critical' ? (
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    ) : event.severity === 'warning' ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    ) : (
                      <Activity className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">{event.timestamp}</span>
                      <span className="text-[10px] px-1 py-0.2 rounded bg-slate-900 border border-slate-700 font-semibold text-slate-200">
                        {event.source}
                      </span>
                    </div>
                    <div className="text-xs font-sans font-medium text-white mt-0.5">
                      {event.message}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                </div>

                <button className="text-[10px] text-sky-400 hover:text-sky-300 shrink-0 pt-1">
                  Locate →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
