import React from 'react';
import { Radio, CloudRain, AlertTriangle, Play, Pause, RotateCcw, Satellite, Sliders } from 'lucide-react';
import { SimulationParams } from '../types/flood';

interface SimulationControlsProps {
  params: SimulationParams;
  onChangeParams: (updater: (prev: SimulationParams) => SimulationParams) => void;
  isLiveStreaming: boolean;
  onToggleLiveStream: () => void;
  onReset: () => void;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  params,
  onChangeParams,
  isLiveStreaming,
  onToggleLiveStream,
  onReset,
}) => {
  return (
    <div className="bg-slate-900 border-b border-slate-800 p-4 text-slate-200">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
        {/* Left: Sensor Mode & Live Feed Toggle */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleLiveStream}
              className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                isLiveStreaming
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
              }`}
            >
              {isLiveStreaming ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Live Stream Active (Sentinel-1 SAR)</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Stream Paused (Click to Resume)</span>
                </>
              )}
            </button>
          </div>

          {/* Sensor Mode Switch */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-md text-xs">
            <button
              onClick={() => onChangeParams((p) => ({ ...p, sensorMode: 'sar_radar' }))}
              className={`px-2.5 py-1 rounded transition-colors ${
                params.sensorMode === 'sar_radar'
                  ? 'bg-sky-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sentinel-1 SAR (Radar)
            </button>
            <button
              onClick={() => onChangeParams((p) => ({ ...p, sensorMode: 'optical_ndwi' }))}
              className={`px-2.5 py-1 rounded transition-colors ${
                params.sensorMode === 'optical_ndwi'
                  ? 'bg-sky-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sentinel-2 (MNDWI)
            </button>
            <button
              onClick={() => onChangeParams((p) => ({ ...p, sensorMode: 'composite' }))}
              className={`px-2.5 py-1 rounded transition-colors ${
                params.sensorMode === 'composite'
                  ? 'bg-sky-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              SAR + DEM Composite
            </button>
          </div>

          {/* Timeframe Phase */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-md text-xs">
            <button
              onClick={() => onChangeParams((p) => ({ ...p, timeframe: 'pre_flood' }))}
              className={`px-2.5 py-1 rounded transition-colors ${
                params.timeframe === 'pre_flood'
                  ? 'bg-slate-700 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pre-Flood Base
            </button>
            <button
              onClick={() => onChangeParams((p) => ({ ...p, timeframe: 'live' }))}
              className={`px-2.5 py-1 rounded transition-colors ${
                params.timeframe === 'live'
                  ? 'bg-sky-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Live Detection
            </button>
            <button
              onClick={() => onChangeParams((p) => ({ ...p, timeframe: 'peak' }))}
              className={`px-2.5 py-1 rounded transition-colors ${
                params.timeframe === 'peak'
                  ? 'bg-rose-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Peak Inundation
            </button>
          </div>
        </div>

        {/* Right: Simulation Parameters (Rainfall, Barrage Gates, Embankment Breach) */}
        <div className="flex flex-wrap items-center gap-6">
          {/* Rainfall Surge Slider */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300">
              <CloudRain className="w-3.5 h-3.5 text-sky-400" />
              <span>Churia Rainfall:</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="300"
                step="25"
                value={params.rainfallSurgeMm}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  onChangeParams((p) => ({ ...p, rainfallSurgeMm: val }));
                }}
                className="w-24 accent-sky-400 cursor-pointer"
              />
              <span className="text-xs font-mono tabular-nums text-white min-w-[52px]">
                +{params.rainfallSurgeMm} mm
              </span>
            </div>
          </div>

          {/* Koshi Barrage Gate Opening */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300">
              <Sliders className="w-3.5 h-3.5 text-sky-400" />
              <span>Koshi Barrage:</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="10"
                max="56"
                step="2"
                value={params.koshiBarrageGatesOpen}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  onChangeParams((p) => ({ ...p, koshiBarrageGatesOpen: val }));
                }}
                className="w-24 accent-sky-400 cursor-pointer"
              />
              <span className="text-xs font-mono tabular-nums text-white min-w-[64px]">
                {params.koshiBarrageGatesOpen}/56 gates
              </span>
            </div>
          </div>

          {/* Embankment Breach Simulation Switch */}
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
            <input
              type="checkbox"
              checked={params.embankmentBreach}
              onChange={(e) => {
                const val = e.target.checked;
                onChangeParams((p) => ({ ...p, embankmentBreach: val }));
              }}
              className="rounded bg-slate-800 border-slate-700 text-rose-500 focus:ring-0 w-4 h-4"
            />
            <span className={params.embankmentBreach ? 'text-rose-400 font-bold' : 'text-slate-300'}>
              Simulate Dyke Breach
            </span>
          </label>

          {/* Reset button */}
          <button
            onClick={onReset}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            title="Reset Simulation Parameters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
