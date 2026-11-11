import React from 'react';
import { SimulationParams, Settlement } from '../types/flood';
import { AlertTriangle, Play, ShieldAlert, Waves, CloudRain, LifeBuoy, MapPin, Truck, CheckCircle } from 'lucide-react';

interface ScenarioSimulatorTabProps {
  params: SimulationParams;
  onChangeParams: (updater: (prev: SimulationParams) => SimulationParams) => void;
  settlements: Settlement[];
  onSelectSettlement: (s: Settlement) => void;
}

export const ScenarioSimulatorTab: React.FC<ScenarioSimulatorTabProps> = ({
  params,
  onChangeParams,
  settlements,
  onSelectSettlement,
}) => {
  const criticalSettlements = settlements.filter((s) => s.severity === 'critical' || s.severity === 'severe');

  const applyPreset = (preset: '2017_benchmark' | 'koshi_emergency' | 'western_surge' | 'moderate') => {
    if (preset === '2017_benchmark') {
      onChangeParams((p) => ({
        ...p,
        rainfallSurgeMm: 250,
        koshiBarrageGatesOpen: 52,
        embankmentBreach: true,
        selectedBasin: 'all',
        timeframe: 'peak',
      }));
    } else if (preset === 'koshi_emergency') {
      onChangeParams((p) => ({
        ...p,
        rainfallSurgeMm: 175,
        koshiBarrageGatesOpen: 56,
        embankmentBreach: true,
        selectedBasin: 'koshi',
        timeframe: 'live',
      }));
    } else if (preset === 'western_surge') {
      onChangeParams((p) => ({
        ...p,
        rainfallSurgeMm: 200,
        koshiBarrageGatesOpen: 32,
        embankmentBreach: false,
        selectedBasin: 'karnali',
        timeframe: 'live',
      }));
    } else {
      onChangeParams((p) => ({
        ...p,
        rainfallSurgeMm: 50,
        koshiBarrageGatesOpen: 24,
        embankmentBreach: false,
        selectedBasin: 'all',
        timeframe: 'live',
      }));
    }
  };

  return (
    <div className="bg-slate-950 p-6 space-y-6 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <Waves className="w-4 h-4 text-sky-400" />
          <span>Hydrological Stress Testing &amp; Embankment Failure Simulation</span>
        </h2>
        <div className="text-xs text-slate-400 mt-0.5">
          Simulate upstream cloudburst scenarios, barrage discharge variations, and catastrophic dyke breaches to evaluate instant settlement inundation waves.
        </div>
      </div>

      {/* Preset Scenarios */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
          Historical &amp; Disaster Risk Scenarios
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <button
            onClick={() => applyPreset('2017_benchmark')}
            className="p-3.5 bg-slate-900 border border-slate-800 hover:border-rose-500 rounded-lg text-left transition-colors group"
          >
            <div className="text-xs font-bold text-white group-hover:text-rose-400">
              2017 Terai Mega-Flood
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Catastrophic 250mm cloudburst across all basins with multiple embankment breaches.
            </div>
            <div className="text-[10px] text-rose-400 font-mono mt-2">
              Run Extreme Scenario →
            </div>
          </button>

          <button
            onClick={() => applyPreset('koshi_emergency')}
            className="p-3.5 bg-slate-900 border border-slate-800 hover:border-amber-500 rounded-lg text-left transition-colors group"
          >
            <div className="text-xs font-bold text-white group-hover:text-amber-400">
              Koshi Barrage Peak Discharge
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              All 56 barrage gates open, western spur overtopping threatening Saptari &amp; Sunsari.
            </div>
            <div className="text-[10px] text-amber-400 font-mono mt-2">
              Run Koshi Emergency →
            </div>
          </button>

          <button
            onClick={() => applyPreset('western_surge')}
            className="p-3.5 bg-slate-900 border border-slate-800 hover:border-sky-500 rounded-lg text-left transition-colors group"
          >
            <div className="text-xs font-bold text-white group-hover:text-sky-400">
              Western Terai Delta Surge
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Karnali &amp; Babai simultaneous crest isolating Rajapur Island and Bhajani.
            </div>
            <div className="text-[10px] text-sky-400 font-mono mt-2">
              Run Western Surge →
            </div>
          </button>

          <button
            onClick={() => applyPreset('moderate')}
            className="p-3.5 bg-slate-900 border border-slate-800 hover:border-emerald-500 rounded-lg text-left transition-colors group"
          >
            <div className="text-xs font-bold text-white group-hover:text-emerald-400">
              Nominal Monsoon Flow
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Standard seasonal water levels with routine early warning and open drainage.
            </div>
            <div className="text-[10px] text-emerald-400 font-mono mt-2">
              Reset to Baseline →
            </div>
          </button>
        </div>
      </div>

      {/* Embankment Breach Mechanics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="border border-slate-800 rounded-lg p-5 bg-slate-900/60 space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Dyke Breach &amp; Flood Wave Propagation Analysis</span>
            </h3>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white">
                    Simulate Structural Embankment Failure
                  </div>
                  <div className="text-xs text-slate-400">
                    Triggers instantaneous overland flash flooding across downstream low-lying wards.
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={params.embankmentBreach}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      onChangeParams((p) => ({ ...p, embankmentBreach: checked }));
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                </label>
              </div>

              {params.embankmentBreach && (
                <div className="mt-3 p-3 bg-rose-950/40 border border-rose-800/80 rounded text-xs text-rose-200 space-y-2">
                  <div className="font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>BREACH PROPAGATION IN PROGRESS: Saptakoshi Spur #12 &amp; Lalbakaiya Ring Bund</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Hydrostatic pressure breach detected. Inundation wave velocity: ~2.4 m/s. Estimated arrival time in Hanumannagar / Tilathi: <strong>38 minutes</strong>. Gaur municipality retention basin water depth increase: <strong>+90 cm within 2 hours</strong>. Immediate life-safety warning sirens required.
                  </p>
                </div>
              )}
            </div>

            {/* Downstream Impacted Settlements List */}
            <div className="space-y-2">
              <div className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Critically Impacted Settlements Under Active Scenario ({criticalSettlements.length})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {criticalSettlements.slice(0, 6).map((s) => (
                  <div
                    key={s.id}
                    onClick={() => onSelectSettlement(s)}
                    className="p-3 bg-slate-950 border border-slate-800 rounded flex items-center justify-between cursor-pointer hover:border-sky-500 transition-colors"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white">{s.name}</div>
                      <div className="text-[10px] text-slate-400">{s.district} · {s.waterDepthCm} cm depth</div>
                    </div>
                    <span className="text-[10px] text-sky-400 font-mono">Inspect →</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Resource Mobilization Estimation */}
        <div className="space-y-4">
          <div className="border border-slate-800 rounded-lg p-5 bg-slate-900/60 space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-2">
              <LifeBuoy className="w-4 h-4 text-sky-400" />
              <span>Emergency Logistics Mobilization</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                <div className="text-slate-400 text-[11px]">Nepal Army &amp; APF Motorized Boats:</div>
                <div className="text-base font-bold text-amber-400 font-mono mt-0.5">
                  {params.embankmentBreach ? '48 rafts deployed (14 deficit)' : '24 rafts deployed (Adequate)'}
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                <div className="text-slate-400 text-[11px]">Mobile Water Purification (NOMAD/PUR):</div>
                <div className="text-base font-bold text-white font-mono mt-0.5">
                  18 high-capacity units en route
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                <div className="text-slate-400 text-[11px]">Emergency Shelter Capacity:</div>
                <div className="text-base font-bold text-white font-mono mt-0.5">
                  34 designated elevated schools active
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                <div className="text-slate-400 text-[11px]">Airdrop Zones for Food Packets:</div>
                <div className="text-base font-bold text-sky-400 font-mono mt-0.5">
                  8 elevated helipad locations designated
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
