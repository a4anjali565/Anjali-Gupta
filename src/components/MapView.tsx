import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { Settlement, RiverGauge, RiverPath, HighwaySegment, FloodPolygon, BasinId } from '../types/flood';
import { ProbeResult } from '../types/detector';
import { Layers, Crosshair, Radio, ShieldAlert } from 'lucide-react';

interface MapViewProps {
  settlements: Settlement[];
  gauges: RiverGauge[];
  rivers: RiverPath[];
  highways: HighwaySegment[];
  floodPolygons: FloodPolygon[];
  selectedSettlement: Settlement | null;
  onSelectSettlement: (settlement: Settlement) => void;
  selectedBasin: BasinId | 'all';
  onBasinChange: (basin: BasinId | 'all') => void;
  sensorMode: 'sar_radar' | 'optical_ndwi' | 'composite';
  timeframe: 'pre_flood' | 'peak' | 'live';
  // Live Detector additions
  onMapProbe?: (probe: ProbeResult) => void;
  activeProbe?: ProbeResult | null;
  isScanning?: boolean;
  sweepProgress?: number;
  sensitivityThresholdDb?: number;
}

export const MapView: React.FC<MapViewProps> = ({
  settlements,
  gauges,
  rivers,
  highways,
  floodPolygons,
  selectedSettlement,
  onSelectSettlement,
  selectedBasin,
  onBasinChange,
  sensorMode,
  timeframe,
  onMapProbe,
  activeProbe,
  isScanning = true,
  sweepProgress = 50,
  sensitivityThresholdDb = -16.5,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const probeMarkerRef = useRef<L.Marker | null>(null);

  const [tileLayerType, setTileLayerType] = useState<'dark' | 'satellite' | 'streets'>('dark');
  const [showPolygons, setShowPolygons] = useState(true);
  const [showRivers, setShowRivers] = useState(true);
  const [showHighways, setShowHighways] = useState(true);
  const [showGauges, setShowGauges] = useState(true);
  const [showSettlements, setShowSettlements] = useState(true);
  const [showEvacuationRoutes, setShowEvacuationRoutes] = useState(true);
  const [showRadarSweep, setShowRadarSweep] = useState(true);

  // Compute Probe result from coordinates
  const performProbe = useCallback(
    (lat: number, lng: number) => {
      // Find nearest settlement
      let nearestS = settlements[0];
      let minSDist = 999;
      settlements.forEach((s) => {
        const d = Math.hypot(s.lat - lat, s.lng - lng) * 111;
        if (d < minSDist) {
          minSDist = d;
          nearestS = s;
        }
      });

      // Find nearest river
      let nearestRName = rivers[0]?.name || 'Terai Channel';
      let minRDist = 999;
      rivers.forEach((r) => {
        r.coordinates.forEach(([rLat, rLng]) => {
          const d = Math.hypot(rLat - lat, rLng - lng) * 111;
          if (d < minRDist) {
            minRDist = d;
            nearestRName = r.name;
          }
        });
      });

      // Check if point falls close to river or near known flood polygon
      const isCloseToRiver = minRDist < 6.5;
      const isNearSettlementFlooded = nearestS.waterDepthCm > 80 && minSDist < 8;

      let backscatterDb = -10.5;
      let surfaceClass: ProbeResult['surfaceClass'] = 'Dry Ground / Settlement';
      let estimatedDepthCm = 0;
      let waterConfidencePercent = 12;

      if (isNearSettlementFlooded || isCloseToRiver) {
        // High likelihood of inundation
        backscatterDb = Number((sensitivityThresholdDb - 1.2 - Math.random() * 2.2).toFixed(1));
        surfaceClass = 'Standing Flood Water';
        estimatedDepthCm = Math.round(nearestS.waterDepthCm * (1 - minSDist / 15) + Math.random() * 20);
        if (estimatedDepthCm < 15) estimatedDepthCm = 35;
        waterConfidencePercent = Math.min(99, Math.round(88 + Math.random() * 11));
      } else if (minRDist < 12) {
        // Wet saturated soil
        backscatterDb = Number((sensitivityThresholdDb + 1.8 + Math.random() * 1.5).toFixed(1));
        surfaceClass = 'Saturated Wet Soil';
        estimatedDepthCm = Math.round(Math.random() * 25);
        waterConfidencePercent = Math.round(52 + Math.random() * 15);
      } else {
        // Dry / normal agricultural
        backscatterDb = Number((-8.0 - Math.random() * 3).toFixed(1));
        surfaceClass = 'Dry Ground / Settlement';
        estimatedDepthCm = 0;
        waterConfidencePercent = Math.round(5 + Math.random() * 10);
      }

      const probeResult: ProbeResult = {
        lat,
        lng,
        backscatterDb,
        surfaceClass,
        waterConfidencePercent,
        estimatedDepthCm,
        elevationM: Math.round(nearestS.elevationM + (minSDist > 5 ? 15 : 0)),
        nearestRiver: nearestRName,
        distanceToRiverKm: Number(minRDist.toFixed(1)),
        nearestSettlement: nearestS.name,
      };

      if (onMapProbe) {
        onMapProbe(probeResult);
      }
    },
    [settlements, rivers, sensitivityThresholdDb, onMapProbe]
  );

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Center over Nepal Terai
    const map = L.map(mapContainerRef.current, {
      center: [27.05, 84.8],
      zoom: 8,
      minZoom: 6,
      maxZoom: 14,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    // Map click handler for live radar pixel probe
    map.on('click', (e: L.LeafletMouseEvent) => {
      performProbe(e.latlng.lat, e.latlng.lng);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [performProbe]);

  // Update base tile layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    let tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    let attribution = '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap';

    if (tileLayerType === 'satellite') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attribution = '&copy; Esri &mdash; Maxar, Earthstar Geographics';
    } else if (tileLayerType === 'streets') {
      tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      attribution = '&copy; OpenStreetMap contributors';
    }

    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution,
    });

    tileLayer.addTo(map);
  }, [tileLayerType]);

  // Handle Basin pan/zoom
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (selectedBasin === 'koshi') {
      map.flyTo([26.65, 87.0], 9);
    } else if (selectedBasin === 'bagmati_kamala') {
      map.flyTo([26.8, 85.6], 9);
    } else if (selectedBasin === 'narayani') {
      map.flyTo([27.5, 84.1], 9);
    } else if (selectedBasin === 'west_rapti_babai') {
      map.flyTo([28.15, 81.6], 9);
    } else if (selectedBasin === 'karnali' || selectedBasin === 'mahakali_mohana') {
      map.flyTo([28.5, 81.0], 9);
    } else {
      map.flyTo([27.05, 84.8], 8);
    }
  }, [selectedBasin]);

  // Focus map when selectedSettlement changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedSettlement) return;

    map.flyTo([selectedSettlement.lat, selectedSettlement.lng], 11, {
      duration: 1.2,
    });
  }, [selectedSettlement]);

  // Update Crosshair Marker on Active Probe
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    if (probeMarkerRef.current) {
      layerGroup.removeLayer(probeMarkerRef.current);
      probeMarkerRef.current = null;
    }

    if (activeProbe) {
      const isWater = activeProbe.surfaceClass === 'Standing Flood Water';
      const color = isWater ? '#f43f5e' : '#38bdf8';

      const crosshairIcon = L.divIcon({
        className: 'custom-crosshair-marker',
        html: `
          <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; pointer-events: none;">
            <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; border: 1.5px dashed ${color}; animation: spin 8s linear infinite;"></div>
            <div style="position: absolute; width: 22px; height: 22px; border-radius: 50%; border: 1.5px solid ${color};"></div>
            <div style="width: 4px; height: 4px; border-radius: 50%; background-color: ${color};"></div>
            <div style="position: absolute; top: -18px; font-family: monospace; font-size: 10px; font-weight: bold; background: rgba(15,23,42,0.9); padding: 1px 4px; border-radius: 3px; border: 1px solid #334155; color: ${color}; white-space: nowrap;">
              ${activeProbe.backscatterDb} dB
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([activeProbe.lat, activeProbe.lng], { icon: crosshairIcon });
      marker.addTo(layerGroup);
      probeMarkerRef.current = marker;
    }
  }, [activeProbe]);

  // Re-render GIS overlay layers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    // Remove everything except the probe marker if present
    const currentProbeMarker = probeMarkerRef.current;
    layerGroup.clearLayers();
    if (currentProbeMarker) {
      layerGroup.addLayer(currentProbeMarker);
    }

    // 1. Render Flood Extent Polygons (SAR Radar Inundation Masks)
    if (showPolygons && timeframe !== 'pre_flood') {
      floodPolygons.forEach((poly) => {
        let fillColor = '#0284c7';
        let fillOpacity = 0.55;

        if (sensorMode === 'sar_radar') {
          fillColor = poly.severity === 'severe' ? '#0284c7' : '#38bdf8';
          fillOpacity = 0.65;
        } else if (sensorMode === 'optical_ndwi') {
          fillColor = '#0d9488';
          fillOpacity = 0.5;
        } else {
          fillColor = poly.avgDepthM > 1.8 ? '#1d4ed8' : '#0ea5e9';
          fillOpacity = 0.6;
        }

        const polygon = L.polygon(poly.coordinates, {
          color: '#38bdf8',
          weight: 1.5,
          fillColor,
          fillOpacity,
          dashArray: '3, 4',
        });

        polygon.bindTooltip(
          `<div class="p-1 font-sans text-xs">
            <div class="font-bold text-sky-400">${poly.name}</div>
            <div class="text-slate-300">Mean SAR Inundation Depth: <span class="font-mono font-bold text-white">${poly.avgDepthM} m</span></div>
            <div class="text-[10px] text-slate-400">Backscatter Drop: -16.8 dB (Open Water)</div>
          </div>`,
          { sticky: true, className: 'leaflet-custom-tooltip' }
        );

        polygon.addTo(layerGroup);
      });
    }

    // 2. Render River Networks
    if (showRivers) {
      rivers.forEach((river) => {
        const polyline = L.polyline(river.coordinates, {
          color: '#38bdf8',
          weight: 3.5,
          opacity: 0.85,
          lineCap: 'round',
          lineJoin: 'round',
        });

        polyline.bindTooltip(
          `<div class="font-sans text-xs font-semibold text-sky-300">${river.name}</div>`,
          { sticky: true }
        );

        polyline.addTo(layerGroup);
      });
    }

    // 3. Render Highway Lifeline Segments
    if (showHighways) {
      highways.forEach((hwy) => {
        let color = '#22c55e';
        let dashArray: string | undefined = undefined;
        let weight = 3;

        if (hwy.status === 'caution') {
          color = '#f59e0b';
          weight = 3.5;
        } else if (hwy.status === 'submerged_impassable') {
          color = '#ef4444';
          dashArray = '6, 6';
          weight = 4;
        }

        const polyline = L.polyline(hwy.coordinates, {
          color,
          weight,
          dashArray,
          opacity: 0.9,
        });

        polyline.bindTooltip(
          `<div class="p-1 font-sans text-xs">
            <div class="font-bold text-white">${hwy.name}</div>
            <div class="${hwy.status === 'submerged_impassable' ? 'text-rose-400 font-bold' : hwy.status === 'caution' ? 'text-amber-300' : 'text-emerald-400'}">
              Status: ${hwy.status.replace('_', ' ').toUpperCase()}
            </div>
            ${hwy.submergedLengthKm > 0 ? `<div class="text-[10px] text-slate-300 font-mono">${hwy.submergedLengthKm} km underwater</div>` : ''}
          </div>`,
          { sticky: true }
        );

        polyline.addTo(layerGroup);
      });
    }

    // 4. Render River Telemetry Gauges
    if (showGauges) {
      gauges.forEach((gauge) => {
        const isCritical = gauge.currentLevelM >= gauge.dangerLevelM;
        const isWarning = gauge.currentLevelM >= gauge.warningLevelM;

        const pulseColor = isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#38bdf8';

        const customIcon = L.divIcon({
          className: 'custom-gauge-marker',
          html: `
            <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
              <span style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background-color: ${pulseColor}; opacity: 0.35;"></span>
              <span style="position: relative; width: 14px; height: 14px; border-radius: 50%; background-color: ${pulseColor}; border: 2px solid #ffffff; box-shadow: 0 0 8px ${pulseColor};"></span>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([gauge.lat, gauge.lng], { icon: customIcon });

        marker.bindTooltip(
          `<div class="p-1.5 font-sans text-xs">
            <div class="font-bold text-white">${gauge.name}</div>
            <div class="text-[10px] text-slate-400">${gauge.nepaliName}</div>
            <div class="mt-1 flex items-baseline gap-1 font-mono">
              <span class="text-sm font-bold ${isCritical ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-sky-400'}">
                ${gauge.currentLevelM.toFixed(2)}m
              </span>
              <span class="text-[10px] text-slate-400">/ Danger: ${gauge.dangerLevelM}m</span>
            </div>
            <div class="text-[10px] text-slate-300 font-mono">Discharge: ${gauge.dischargeCusecs.toLocaleString()} cusecs</div>
            <div class="text-[10px] text-slate-400">Trend: ${gauge.trend.toUpperCase()} · Updated ${gauge.lastUpdated}</div>
          </div>`,
          { sticky: true }
        );

        marker.addTo(layerGroup);
      });
    }

    // 5. Render Settlement Impact Pins & Evacuation vectors
    if (showSettlements) {
      settlements.forEach((s) => {
        let pinColor = '#38bdf8';
        let radius = 6;

        if (s.severity === 'critical') {
          pinColor = '#ef4444';
          radius = 10;
        } else if (s.severity === 'severe') {
          pinColor = '#f97316';
          radius = 8;
        } else if (s.severity === 'moderate') {
          pinColor = '#eab308';
          radius = 7;
        }

        const isSelected = selectedSettlement?.id === s.id;

        const circleMarker = L.circleMarker([s.lat, s.lng], {
          radius: isSelected ? radius + 4 : radius,
          fillColor: pinColor,
          color: isSelected ? '#ffffff' : '#0f172a',
          weight: isSelected ? 3 : 1.5,
          opacity: 1,
          fillOpacity: 0.9,
        });

        circleMarker.bindTooltip(
          `<div class="p-1 font-sans text-xs">
            <div class="font-bold text-white">${s.name}</div>
            <div class="text-[10px] text-slate-400">${s.district} District · ${s.elevationM}m elev</div>
            <div class="mt-1 flex items-center justify-between gap-3 text-[11px] font-mono">
              <span class="${s.severity === 'critical' ? 'text-rose-400 font-bold' : s.severity === 'severe' ? 'text-amber-400' : 'text-sky-300'}">
                Water Depth: ${s.waterDepthCm} cm
              </span>
              <span class="text-slate-300">Affected: ${s.affectedPopulation.toLocaleString()}</span>
            </div>
            <div class="text-[10px] text-slate-400 mt-0.5">Click to inspect damage assessment</div>
          </div>`,
          { sticky: true }
        );

        circleMarker.on('click', () => {
          onSelectSettlement(s);
        });

        circleMarker.addTo(layerGroup);

        if (showEvacuationRoutes && (isSelected || s.severity === 'critical')) {
          const offsetLat = s.lat + 0.04;
          const offsetLng = s.lng + 0.02;

          const evacLine = L.polyline(
            [
              [s.lat, s.lng],
              [offsetLat, offsetLng],
            ],
            {
              color: '#10b981',
              weight: 2,
              dashArray: '4, 4',
              opacity: 0.8,
            }
          );

          evacLine.bindTooltip(
            `<div class="text-[10px] text-emerald-300 font-sans">
              Evacuation to: ${s.evacuationDestination} (${s.evacuationDistanceKm} km)
            </div>`,
            { sticky: true }
          );

          evacLine.addTo(layerGroup);
        }
      });
    }
  }, [
    settlements,
    gauges,
    rivers,
    highways,
    floodPolygons,
    selectedSettlement,
    showPolygons,
    showRivers,
    showHighways,
    showGauges,
    showSettlements,
    showEvacuationRoutes,
    sensorMode,
    timeframe,
    onSelectSettlement,
  ]);

  return (
    <div className="relative w-full h-[620px] bg-slate-950 overflow-hidden select-none cursor-crosshair">
      {/* The Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Live Animated Radar Sweep Overlay */}
      {showRadarSweep && isScanning && (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          {/* Vertical moving radar sweep line with laser phosphor trailing gradient */}
          <div
            className="absolute top-0 bottom-0 w-32 -translate-x-full transition-all duration-300 ease-linear pointer-events-none"
            style={{
              left: `${sweepProgress}%`,
              background: 'linear-gradient(90deg, transparent 0%, rgba(56, 189, 248, 0.05) 50%, rgba(56, 189, 248, 0.25) 98%, rgba(56, 189, 248, 0.85) 100%)',
              borderRight: '2px solid #38bdf8',
              boxShadow: '0 0 16px rgba(56, 189, 248, 0.6)',
            }}
          >
            <div className="absolute top-3 right-1 font-mono text-[9px] text-sky-300 font-bold tracking-wider uppercase writing-mode-vertical">
              SAR SWATH BEAM
            </div>
          </div>
        </div>
      )}

      {/* Top Floating Controls: Basin Selector & Basemap */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2">
        {/* Basin Selector Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg shadow-lg">
          <button
            onClick={() => onBasinChange('all')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              selectedBasin === 'all'
                ? 'bg-sky-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            All Terai
          </button>
          <button
            onClick={() => onBasinChange('koshi')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              selectedBasin === 'koshi'
                ? 'bg-sky-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Koshi Basin
          </button>
          <button
            onClick={() => onBasinChange('bagmati_kamala')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              selectedBasin === 'bagmati_kamala'
                ? 'bg-sky-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Bagmati & Kamala
          </button>
          <button
            onClick={() => onBasinChange('narayani')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              selectedBasin === 'narayani'
                ? 'bg-sky-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Narayani Basin
          </button>
          <button
            onClick={() => onBasinChange('west_rapti_babai')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              selectedBasin === 'west_rapti_babai'
                ? 'bg-sky-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            West Rapti & Babai
          </button>
          <button
            onClick={() => onBasinChange('karnali')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              selectedBasin === 'karnali'
                ? 'bg-sky-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Karnali & Mahakali
          </button>
        </div>

        {/* Tile Basemap Toggle */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg shadow-lg">
          <button
            onClick={() => setTileLayerType('dark')}
            className={`px-2 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              tileLayerType === 'dark' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Carto Dark
          </button>
          <button
            onClick={() => setTileLayerType('satellite')}
            className={`px-2 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              tileLayerType === 'satellite' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Satellite
          </button>
          <button
            onClick={() => setTileLayerType('streets')}
            className={`px-2 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              tileLayerType === 'streets' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Topo/OSM
          </button>
        </div>
      </div>

      {/* Floating Layer Toggle Menu */}
      <div className="absolute top-16 right-4 z-20 p-3 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-lg shadow-xl text-xs text-slate-200 w-52">
        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
          <span>Detector GIS Layers</span>
          <Layers className="w-3.5 h-3.5 text-sky-400" />
        </div>

        <div className="space-y-1.5">
          <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={showRadarSweep}
              onChange={(e) => setShowRadarSweep(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-0"
            />
            <span className="text-sky-400 font-semibold">Active Radar Swath Beam</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={showPolygons}
              onChange={(e) => setShowPolygons(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-0"
            />
            <span>SAR Inundation Polygons</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={showRivers}
              onChange={(e) => setShowRivers(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-0"
            />
            <span>River Networks (DHM)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={showHighways}
              onChange={(e) => setShowHighways(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-0"
            />
            <span>Mahendra & Postal HWY</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={showGauges}
              onChange={(e) => setShowGauges(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-0"
            />
            <span>Hydrological River Gauges</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={showSettlements}
              onChange={(e) => setShowSettlements(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-0"
            />
            <span>Settlement Impact Pins</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={showEvacuationRoutes}
              onChange={(e) => setShowEvacuationRoutes(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-0"
            />
            <span>Safe Evacuation Corridors</span>
          </label>
        </div>
      </div>

      {/* Floating Prompt Notice on Map */}
      <div className="absolute top-16 left-4 z-20 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-md text-[11px] font-mono text-slate-300 flex items-center gap-2 shadow-lg">
        <Crosshair className="w-3.5 h-3.5 text-sky-400 shrink-0" />
        <span>Click anywhere on the map to trigger an instant SAR Pixel Probe</span>
      </div>

      {/* Bottom GIS Map Legend */}
      <div className="absolute bottom-4 left-4 z-20 p-3 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg shadow-lg text-xs text-slate-200">
        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
          Settlement Severity & Depth
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-white"></span>
            <span>Critical (&gt;1.5m / Marooned)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
            <span>Severe (1.0m - 1.5m)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
            <span>Moderate (0.5m - 1.0m)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
            <span>Shallow (&lt;0.5m)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 border-t-2 border-dashed border-rose-500"></span>
            <span>Submerged HWY</span>
          </div>
        </div>
      </div>
    </div>
  );
};
