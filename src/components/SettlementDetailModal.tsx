import React from 'react';
import { Settlement } from '../types/flood';
import { X, ShieldAlert, Droplets, Home, Wheat, Users, Hospital, School, Navigation, HeartHandshake, CheckCircle } from 'lucide-react';

interface SettlementDetailModalProps {
  settlement: Settlement | null;
  onClose: () => void;
  onLocateOnMap: (settlement: Settlement) => void;
}

export const SettlementDetailModal: React.FC<SettlementDetailModalProps> = ({
  settlement,
  onClose,
  onLocateOnMap,
}) => {
  if (!settlement) return null;

  // Relief calculation formulas
  const waterLitersPerDay = Math.round(settlement.affectedPopulation * 3.5);
  const aquaTabsPerDay = Math.round(settlement.affectedPopulation * 2);
  const dryRationsKgPerDay = Math.round(settlement.affectedPopulation * 0.45);
  const rescueBoatsNeeded = Math.max(2, Math.ceil(settlement.maroonedHouseholds / 180));
  const tarpaulinsNeeded = Math.round(settlement.maroonedHouseholds * 1.25);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto text-slate-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-800 sticky top-0 bg-slate-900/95 backdrop-blur-md z-10">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {settlement.name}
              </h2>
              <span className="text-sm text-slate-400 font-sans">
                ({settlement.nepaliName})
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
              <span>{settlement.district} District</span>
              <span aria-hidden="true">·</span>
              <span>{settlement.province} Province</span>
              <span aria-hidden="true">·</span>
              <span className="capitalize">{settlement.basin.replace('_', ' ')} Basin</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{settlement.elevationM} m elevation</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Inundation Severity Ribbon */}
          <div
            className={`p-4 rounded-lg border flex items-center justify-between ${
              settlement.severity === 'critical'
                ? 'bg-rose-950/40 border-rose-800 text-rose-200'
                : settlement.severity === 'severe'
                ? 'bg-orange-950/40 border-orange-800 text-orange-200'
                : settlement.severity === 'moderate'
                ? 'bg-yellow-950/40 border-yellow-800 text-yellow-200'
                : 'bg-sky-950/40 border-sky-800 text-sky-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <div>
                <div className="text-xs uppercase font-mono tracking-wider font-bold">
                  {settlement.severity.toUpperCase()} Inundation Status
                </div>
                <div className="text-xs opacity-90 mt-0.5">
                  Standing Water Depth: <span className="font-mono font-bold text-base">{settlement.waterDepthCm} cm</span> ({(settlement.waterDepthCm / 100).toFixed(2)} m)
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                onLocateOnMap(settlement);
                onClose();
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded bg-white text-slate-950 hover:bg-slate-200 transition-colors whitespace-nowrap"
            >
              Center on GIS Map
            </button>
          </div>

          {/* Key Impact Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div className="text-[11px] font-mono text-slate-400 uppercase">Exposed Citizens</div>
              <div className="text-lg font-bold font-mono text-white mt-1">
                {settlement.affectedPopulation.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500">
                {Math.round((settlement.affectedPopulation / settlement.totalPopulation) * 100)}% of population
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div className="text-[11px] font-mono text-slate-400 uppercase">Marooned HH</div>
              <div className="text-lg font-bold font-mono text-amber-400 mt-1">
                {settlement.maroonedHouseholds.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500">Require boat evacuation</div>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div className="text-[11px] font-mono text-slate-400 uppercase">Kacchi Dwellings</div>
              <div className="text-lg font-bold font-mono text-rose-400 mt-1">
                {settlement.kacchiHousePercent}%
              </div>
              <div className="text-[10px] text-slate-500">Mud/thatch collapse risk</div>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div className="text-[11px] font-mono text-slate-400 uppercase">Submerged Crops</div>
              <div className="text-lg font-bold font-mono text-white mt-1">
                {settlement.submergedPaddyHa.toLocaleString()} ha
              </div>
              <div className="text-[10px] text-slate-500">Standing paddy fields</div>
            </div>
          </div>

          {/* Lifeline Infrastructure & WASH Risk */}
          <div className="border border-slate-800 rounded-lg p-4 bg-slate-950/60 space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">
              Lifeline Vulnerability & Public Health
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded">
                <div className="text-slate-400 text-[11px]">Primary Health Post:</div>
                <div className="mt-1 flex items-center gap-1.5">
                  <Hospital className="w-4 h-4 text-rose-400" />
                  <span className={settlement.hospitalAtRisk ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                    {settlement.hospitalAtRisk ? 'Inundated / At Risk' : 'Operational'}
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded">
                <div className="text-slate-400 text-[11px]">School Shelter Facility:</div>
                <div className="mt-1 flex items-center gap-1.5">
                  <School className="w-4 h-4 text-emerald-400" />
                  <span className={settlement.schoolShelterAvailable ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                    {settlement.schoolShelterAvailable ? 'Designated Shelter Open' : 'Submerged / Unavailable'}
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded">
                <div className="text-slate-400 text-[11px]">Handpump / Well Contamination:</div>
                <div className="mt-1 flex items-center gap-1.5">
                  <Droplets className="w-4 h-4 text-sky-400" />
                  <span className="text-amber-400 font-bold font-mono">
                    {settlement.handpumpContaminationRisk} Risk
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Automated Humanitarian Relief Calculator */}
          <div className="border border-slate-800 rounded-lg p-4 bg-slate-950/60 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-sky-400" />
                <span>Estimated 48-Hour Humanitarian Supply Requirements</span>
              </h3>
              <span className="text-[10px] text-slate-400">Sphere Humanitarian Standard</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-mono">
              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded">
                <div className="text-slate-400 text-[11px] font-sans">Potable Water:</div>
                <div className="text-base font-bold text-white mt-0.5">
                  {waterLitersPerDay.toLocaleString()} L/day
                </div>
                <div className="text-[10px] text-slate-500">3.5 L/person/day</div>
              </div>

              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded">
                <div className="text-slate-400 text-[11px] font-sans">Aquatabs (Purification):</div>
                <div className="text-base font-bold text-sky-400 mt-0.5">
                  {aquaTabsPerDay.toLocaleString()} tabs
                </div>
                <div className="text-[10px] text-slate-500">Chlorine tablets</div>
              </div>

              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded">
                <div className="text-slate-400 text-[11px] font-sans">Dry Rations:</div>
                <div className="text-base font-bold text-white mt-0.5">
                  {dryRationsKgPerDay.toLocaleString()} kg/day
                </div>
                <div className="text-[10px] text-slate-500">Beaten rice & biscuits</div>
              </div>

              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded">
                <div className="text-slate-400 text-[11px] font-sans">Rescue Boats Needed:</div>
                <div className="text-base font-bold text-amber-400 mt-0.5">
                  {rescueBoatsNeeded} boats
                </div>
                <div className="text-[10px] text-slate-500">Inflatable motor rafts</div>
              </div>

              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded col-span-2 sm:col-span-2">
                <div className="text-slate-400 text-[11px] font-sans">Emergency Shelter Tarpaulins:</div>
                <div className="text-base font-bold text-white mt-0.5">
                  {tarpaulinsNeeded.toLocaleString()} sheets
                </div>
                <div className="text-[10px] text-slate-500">Heavy-duty UV resistant tarps</div>
              </div>
            </div>
          </div>

          {/* Evacuation Routing Guidance */}
          <div className="border border-emerald-900/60 bg-emerald-950/20 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs font-mono uppercase">
              <Navigation className="w-4 h-4" />
              <span>Recommended Evacuation Corridor</span>
            </div>
            <div className="text-sm font-bold text-white">
              {settlement.evacuationDestination}
            </div>
            <div className="text-xs text-slate-300">
              Estimated corridor distance: <span className="font-mono font-bold text-emerald-300">{settlement.evacuationDistanceKm} km</span> along elevated roadways and high embankment dykes.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-800 bg-slate-950">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-md hover:bg-slate-800 transition-colors"
          >
            Close Assessment
          </button>
        </div>
      </div>
    </div>
  );
};
