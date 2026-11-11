import React from 'react';
import { ShieldAlert, Download, FileText, Satellite } from 'lucide-react';

interface TopNavProps {
  activeTab: 'map' | 'triage' | 'telemetry' | 'scenarios';
  setActiveTab: (tab: 'map' | 'triage' | 'telemetry' | 'scenarios') => void;
  onOpenSitRep: () => void;
  onExportGeoJSON: () => void;
  isLiveStreamActive: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenSitRep,
  onExportGeoJSON,
  isLiveStreamActive,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-slate-950 border-b border-slate-800 text-slate-100 sticky top-0 z-50">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-sky-950 border border-sky-800 flex items-center justify-center text-sky-400">
          <Satellite className="w-4 h-4" />
        </div>
        <div>
          <a href="#" className="text-base font-bold tracking-tight text-white whitespace-nowrap block">
            TeraiFlood SAR
          </a>
          <span className="text-[10px] text-slate-400 tracking-wider uppercase font-mono block">
            Nepal Terai Inundation Monitor
          </span>
        </div>
      </div>

      {/* Zone 2: 4-5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('map')}
          className={`transition-colors whitespace-nowrap py-1 border-b-2 ${
            activeTab === 'map'
              ? 'text-sky-400 border-sky-400'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          Geospatial Map
        </button>
        <button
          onClick={() => setActiveTab('triage')}
          className={`transition-colors whitespace-nowrap py-1 border-b-2 ${
            activeTab === 'triage'
              ? 'text-sky-400 border-sky-400'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          Settlement Triage
        </button>
        <button
          onClick={() => setActiveTab('telemetry')}
          className={`transition-colors whitespace-nowrap py-1 border-b-2 ${
            activeTab === 'telemetry'
              ? 'text-sky-400 border-sky-400'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          River & SAR Telemetry
        </button>
        <button
          onClick={() => setActiveTab('scenarios')}
          className={`transition-colors whitespace-nowrap py-1 border-b-2 ${
            activeTab === 'scenarios'
              ? 'text-sky-400 border-sky-400'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          Simulation & Breaches
        </button>
      </nav>

      {/* Zone 3: Primary action + secondary utility */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onExportGeoJSON}
          className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-md hover:bg-slate-800 hover:text-white transition-colors whitespace-nowrap"
          title="Download active flood polygon mask in GeoJSON format"
        >
          <Download className="w-3.5 h-3.5" />
          Export GeoJSON
        </button>

        <button
          onClick={onOpenSitRep}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-sky-400 rounded-md hover:bg-sky-300 transition-colors whitespace-nowrap shadow-sm"
        >
          <FileText className="w-3.5 h-3.5" />
          Generate SitRep
        </button>
      </div>
    </header>
  );
};
