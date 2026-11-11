import React from 'react';
import { DetectionEvent } from '../types/detector';
import { Radio, Volume2, VolumeX, ShieldAlert, AlertTriangle, ArrowRight, Activity, Zap } from 'lucide-react';

interface LiveAlertTickerProps {
  events: DetectionEvent[];
  isScanning: boolean;
  onToggleScan: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  scanSpeed: 'slow' | 'normal' | 'fast';
  onChangeSpeed: (speed: 'slow' | 'normal' | 'fast') => void;
  onSelectEvent: (event: DetectionEvent) => void;
  onTriggerInstantScan: () => void;
  sweepProgress: number;
}

export const LiveAlertTicker: React.FC<LiveAlertTickerProps> = ({
  events,
  isScanning,
  onToggleScan,
  soundEnabled,
  onToggleSound,
  scanSpeed,
  onChangeSpeed,
  onSelectEvent,
  onTriggerInstantScan,
  sweepProgress,
}) => {
  const latestCritical = events.find((e) => e.severity === 'critical') || events[0];

  return (
    <div className="bg-slate-950 border-b border-slate-800 text-slate-100 px-4 py-2 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs select-none">
      {/* Left: Live Status Badge + Radar Sweep Progress Bar */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onToggleScan}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-bold transition-all ${
            isScanning
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}
          title="Toggle automated live radar sweeping"
        >
          <Radio className={`w-3.5 h-3.5 ${isScanning ? 'animate-pulse text-rose-500' : ''}`} />
          <span>{isScanning ? 'LIVE DETECTOR ACTIVE' : 'DETECTOR PAUSED'}</span>
        </button>

        {/* Sweep Progress Bar */}
        <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] text-slate-400">
          <span>SWEEP:</span>
          <div className="w-20 bg-slate-900 border border-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-sky-400 h-full transition-all duration-300 shadow-[0_0_8px_#38bdf8]"
              style={{ width: `${sweepProgress}%` }}
            />
          </div>
          <span className="tabular-nums min-w-[32px] text-white">{Math.round(sweepProgress)}%</span>
        </div>
      </div>

      {/* Middle: Rolling Detection Marquee / Highlight */}
      <div className="flex-1 overflow-hidden flex items-center gap-2">
        {latestCritical ? (
          <div
            onClick={() => onSelectEvent(latestCritical)}
            className="flex items-center gap-2 px-3 py-1 bg-slate-900/90 border border-slate-800 rounded-md cursor-pointer hover:border-sky-500 transition-colors w-full truncate group"
          >
            {latestCritical.severity === 'critical' ? (
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            ) : latestCritical.severity === 'warning' ? (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            ) : (
              <Activity className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            )}

            <span className="font-mono text-[10px] text-slate-400 shrink-0">{latestCritical.timestamp}</span>
            <span className="font-semibold text-slate-200 truncate group-hover:text-white">
              [{latestCritical.source}] {latestCritical.message}
            </span>
            <span className="text-[10px] text-sky-400 shrink-0 flex items-center font-mono ml-auto">
              Locate <ArrowRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        ) : (
          <span className="text-slate-500 font-mono text-[11px]">No active telemetry anomalies detected...</span>
        )}
      </div>

      {/* Right Controls: Manual Scan Now, Speed Selector, Audio Mute */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onTriggerInstantScan}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500/30 transition-all active:scale-95 whitespace-nowrap"
          title="Force immediate SAR radar pass & detection evaluation"
        >
          <Zap className="w-3 h-3 text-sky-400" />
          <span>Scan Now</span>
        </button>

        {/* Scan Speed Segmented Tabs */}
        <div className="flex items-center gap-0.5 p-0.5 bg-slate-900 border border-slate-800 rounded text-[11px] font-mono">
          <button
            onClick={() => onChangeSpeed('fast')}
            className={`px-1.5 py-0.5 rounded ${
              scanSpeed === 'fast' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title="Fast 2-second radar sweep"
          >
            2s
          </button>
          <button
            onClick={() => onChangeSpeed('normal')}
            className={`px-1.5 py-0.5 rounded ${
              scanSpeed === 'normal' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title="Standard 5-second radar sweep"
          >
            5s
          </button>
          <button
            onClick={() => onChangeSpeed('slow')}
            className={`px-1.5 py-0.5 rounded ${
              scanSpeed === 'slow' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title="Real-time 10-second satellite pass sweep"
          >
            10s
          </button>
        </div>

        {/* Audio Ping Mute/Unmute */}
        <button
          onClick={onToggleSound}
          className={`p-1.5 rounded border transition-colors ${
            soundEnabled
              ? 'bg-slate-800 border-slate-700 text-sky-400 hover:text-sky-300'
              : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
          }`}
          title={soundEnabled ? 'Radar audio ping enabled (Click to mute)' : 'Muted (Click to enable audio ping)'}
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};
