import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { TopNav } from './components/TopNav';
import { LiveAlertTicker } from './components/LiveAlertTicker';
import { OverviewMetricsBar } from './components/OverviewMetricsBar';
import { MapView } from './components/MapView';
import { LiveDetectorInspector } from './components/LiveDetectorInspector';
import { SimulationControls } from './components/SimulationControls';
import { SettlementTriageTable } from './components/SettlementTriageTable';
import { LiveTelemetryPanel } from './components/LiveTelemetryPanel';
import { ScenarioSimulatorTab } from './components/ScenarioSimulatorTab';
import { SettlementDetailModal } from './components/SettlementDetailModal';
import { SitRepModal } from './components/SitRepModal';
import { playRadarPing } from './utils/audioAlert';
import {
  RIVER_GAUGES,
  SETTLEMENTS,
  RIVER_NETWORKS,
  HIGHWAY_SEGMENTS,
  INITIAL_FLOOD_POLYGONS,
  INITIAL_SAR_LOGS,
} from './data/teraiData';
import {
  Settlement,
  RiverGauge,
  FloodPolygon,
  HighwaySegment,
  SARPassLog,
  SimulationParams,
  BasinId,
} from './types/flood';
import { DetectionEvent, ProbeResult } from './types/detector';

const INITIAL_EVENTS: DetectionEvent[] = [
  {
    id: 'evt_01',
    timestamp: '07:44:12 UTC',
    source: 'Sentinel-1A SAR',
    type: 'new_water_detected',
    severity: 'critical',
    message: 'New Inundation detected in Saptari Ward 4 (+3.4 km² specular radar expansion)',
    location: 'Tilathi-Koiladi & Hanumannagar, Saptari',
    coordinates: [26.502, 86.822],
  },
  {
    id: 'evt_02',
    timestamp: '07:42:08 UTC',
    source: 'DHM River Gauge',
    type: 'threshold_breached',
    severity: 'critical',
    message: 'Saptakoshi Chatara station crossed DANGER threshold (8.42m > 7.70m)',
    location: 'Chatara Hydrological Station, Sunsari',
    coordinates: [26.868, 87.158],
  },
  {
    id: 'evt_03',
    timestamp: '07:40:55 UTC',
    source: 'Embankment Monitor',
    type: 'embankment_risk',
    severity: 'warning',
    message: 'Hydrostatic seepage alarm along Lalbakaiya ring dyke upstream of Gaur',
    location: 'Gaur Municipality Ring Bund, Rautahat',
    coordinates: [26.766, 85.281],
  },
  {
    id: 'evt_04',
    timestamp: '07:38:20 UTC',
    source: 'Sentinel-1B SAR',
    type: 'highway_submerged',
    severity: 'critical',
    message: 'Hulaki Postal Highway segment submerged (18.2 km impassable)',
    location: 'Postal HWY (H17), Tilathi Sector',
    coordinates: [26.502, 86.822],
  },
  {
    id: 'evt_05',
    timestamp: '07:35:10 UTC',
    source: 'Optical MNDWI',
    type: 'radar_sweep_completed',
    severity: 'info',
    message: 'Karnali Chisapani delta discharge rate updated to 340,000 cusecs',
    location: 'Rajapur Island Delta, Bardiya',
    coordinates: [28.435, 81.094],
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'map' | 'triage' | 'telemetry' | 'scenarios'>('map');

  // Simulation Parameters State
  const [params, setParams] = useState<SimulationParams>({
    rainfallSurgeMm: 125,
    koshiBarrageGatesOpen: 42,
    embankmentBreach: false,
    selectedBasin: 'all',
    sensorMode: 'sar_radar',
    timeframe: 'live',
    activeLayerMask: {
      floodExtent: true,
      depthHeatmap: true,
      riverNetwork: true,
      highways: true,
      settlements: true,
      gauges: true,
      evacuationRoutes: true,
    },
  });

  // Live Detector Scanning Engine State
  const [isScanning, setIsScanning] = useState(true);
  const [scanSpeed, setScanSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sweepProgress, setSweepProgress] = useState(35);
  const [sensitivityThresholdDb, setSensitivityThresholdDb] = useState(-16.5);
  const [probeModeActive, setProbeModeActive] = useState(true);
  const [activeProbe, setActiveProbe] = useState<ProbeResult | null>({
    lat: 26.551,
    lng: 86.921,
    backscatterDb: -18.2,
    surfaceClass: 'Standing Flood Water',
    waterConfidencePercent: 96.4,
    estimatedDepthCm: 140,
    elevationM: 68,
    nearestRiver: 'Saptakoshi River',
    distanceToRiverKm: 1.4,
    nearestSettlement: 'Hanumannagar Kankalini',
  });
  const [events, setEvents] = useState<DetectionEvent[]>(INITIAL_EVENTS);

  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);

  // SitRep State
  const [isSitRepOpen, setIsSitRepOpen] = useState(false);
  const [sitRepText, setSitRepText] = useState<string>('');
  const [isGeneratingSitRep, setIsGeneratingSitRep] = useState(false);
  const [sitRepLanguage, setSitRepLanguage] = useState<'en' | 'ne'>('en');

  // SAR Logs State
  const [sarLogs, setSarLogs] = useState<SARPassLog[]>(INITIAL_SAR_LOGS);

  // Audio Ping Ref to avoid excessive trigger
  const lastPingTimeRef = useRef<number>(0);

  // Radar Sweep Animation Frame Loop
  useEffect(() => {
    if (!isScanning) return;

    // Speed in % per interval
    const step = scanSpeed === 'fast' ? 1.5 : scanSpeed === 'normal' ? 0.75 : 0.35;
    const intervalTime = 50; // ms

    const timer = setInterval(() => {
      setSweepProgress((prev) => {
        const next = prev + step;
        if (next >= 100) {
          // Play gentle radar blip on sweep cycle completion
          const now = Date.now();
          if (now - lastPingTimeRef.current > 1500) {
            playRadarPing('scan', soundEnabled);
            lastPingTimeRef.current = now;
          }
          return 0;
        }
        return next;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isScanning, scanSpeed, soundEnabled]);

  // Dynamic Gauges calculation based on rainfall & barrage gates
  const dynamicGauges: RiverGauge[] = useMemo(() => {
    return RIVER_GAUGES.map((gauge) => {
      let levelDelta = (params.rainfallSurgeMm / 100) * 0.8;
      if (gauge.id === 'gauge_koshi_barrage') {
        levelDelta += (params.koshiBarrageGatesOpen - 28) * 0.05;
      }
      if (params.embankmentBreach && (gauge.basin === 'koshi' || gauge.basin === 'bagmati_kamala')) {
        levelDelta += 0.45;
      }

      const calculatedLevel = Math.max(gauge.warningLevelM * 0.7, gauge.currentLevelM + levelDelta * 0.4);
      const dischargeDelta = levelDelta * 24000;

      return {
        ...gauge,
        currentLevelM: Number(calculatedLevel.toFixed(2)),
        dischargeCusecs: Math.round(gauge.dischargeCusecs + dischargeDelta),
        trend: levelDelta > 0.2 ? 'rising' : 'steady',
      };
    });
  }, [params.rainfallSurgeMm, params.koshiBarrageGatesOpen, params.embankmentBreach]);

  // Dynamic Settlements impact calculation
  const dynamicSettlements: Settlement[] = useMemo(() => {
    return SETTLEMENTS.map((settlement) => {
      let depthMultiplier = 1 + (params.rainfallSurgeMm / 150) * 0.45;

      if (params.embankmentBreach) {
        if (settlement.district === 'Saptari' || settlement.district === 'Rautahat') {
          depthMultiplier += 0.65;
        } else if (settlement.basin === 'koshi' || settlement.basin === 'bagmati_kamala') {
          depthMultiplier += 0.35;
        }
      }

      if (params.timeframe === 'pre_flood') {
        depthMultiplier = 0.2;
      } else if (params.timeframe === 'peak') {
        depthMultiplier *= 1.35;
      }

      const calcDepth = Math.round(settlement.waterDepthCm * depthMultiplier);

      let severity: Settlement['severity'] = 'shallow';
      if (calcDepth >= 160) severity = 'critical';
      else if (calcDepth >= 100) severity = 'severe';
      else if (calcDepth >= 50) severity = 'moderate';
      else if (calcDepth < 20) severity = 'none';

      const exposedRatio = Math.min(0.92, (calcDepth / 220) * 0.85);
      const calcAffectedPop = Math.round(settlement.totalPopulation * exposedRatio);
      const calcMaroonedHH = Math.round(
        settlement.totalHouseholds * (exposedRatio * (settlement.kacchiHousePercent / 100))
      );
      const calcSubmergedCrop = Math.round(settlement.submergedPaddyHa * depthMultiplier);

      return {
        ...settlement,
        waterDepthCm: calcDepth,
        severity,
        affectedPopulation: calcAffectedPop,
        maroonedHouseholds: calcMaroonedHH,
        submergedPaddyHa: calcSubmergedCrop,
      };
    });
  }, [params.rainfallSurgeMm, params.embankmentBreach, params.timeframe]);

  // Dynamic Highway status
  const dynamicHighways: HighwaySegment[] = useMemo(() => {
    return HIGHWAY_SEGMENTS.map((hwy) => {
      if (params.embankmentBreach && hwy.id.includes('postal')) {
        return {
          ...hwy,
          status: 'submerged_impassable',
          submergedLengthKm: Math.round(hwy.submergedLengthKm * 1.4),
        };
      }
      if (params.rainfallSurgeMm > 200 && hwy.id === 'hwy_mahendra_koshi') {
        return {
          ...hwy,
          status: 'caution',
          submergedLengthKm: 6.5,
        };
      }
      return hwy;
    });
  }, [params.rainfallSurgeMm, params.embankmentBreach]);

  // Dynamic Flood Extent Polygons
  const dynamicPolygons: FloodPolygon[] = useMemo(() => {
    return INITIAL_FLOOD_POLYGONS.map((p) => {
      let multiplier = 1 + (params.rainfallSurgeMm / 200) * 0.5;
      if (params.embankmentBreach && (p.basin === 'koshi' || p.basin === 'bagmati_kamala')) {
        multiplier += 0.4;
      }
      return {
        ...p,
        avgDepthM: Number((p.avgDepthM * multiplier).toFixed(2)),
      };
    });
  }, [params.rainfallSurgeMm, params.embankmentBreach]);

  // Aggregated Overall Totals
  const totalFloodAreaKm2 = useMemo(() => {
    let baseArea = 485;
    baseArea += Math.round((params.rainfallSurgeMm / 10) * 14.5);
    if (params.embankmentBreach) baseArea += 165;
    if (params.timeframe === 'pre_flood') return 65;
    if (params.timeframe === 'peak') baseArea += 210;
    return baseArea;
  }, [params.rainfallSurgeMm, params.embankmentBreach, params.timeframe]);

  const totalAffectedPop = useMemo(() => {
    return dynamicSettlements.reduce((sum, s) => sum + s.affectedPopulation, 0);
  }, [dynamicSettlements]);

  const totalDisplacedPop = useMemo(() => {
    return dynamicSettlements.reduce((sum, s) => sum + s.maroonedHouseholds * 4.8, 0);
  }, [dynamicSettlements]);

  const totalDamagedHouses = useMemo(() => {
    return dynamicSettlements.reduce((sum, s) => sum + s.maroonedHouseholds, 0);
  }, [dynamicSettlements]);

  const totalSubmergedCropsHa = useMemo(() => {
    return dynamicSettlements.reduce((sum, s) => sum + s.submergedPaddyHa, 0);
  }, [dynamicSettlements]);

  const criticalGaugesCount = useMemo(() => {
    return dynamicGauges.filter((g) => g.currentLevelM >= g.dangerLevelM).length;
  }, [dynamicGauges]);

  // Trigger manual instant scan
  const handleTriggerInstantScan = useCallback(() => {
    setSweepProgress(0);
    playRadarPing('alert', soundEnabled);

    const now = new Date();
    const timeStr = `${now.toTimeString().slice(0, 8)} UTC`;
    const randomSettlement = dynamicSettlements[Math.floor(Math.random() * dynamicSettlements.length)];

    const newEvent: DetectionEvent = {
      id: `evt_instant_${Date.now()}`,
      timestamp: timeStr,
      source: 'Sentinel-1A SAR',
      type: 'new_water_detected',
      severity: randomSettlement.waterDepthCm > 120 ? 'critical' : 'warning',
      message: `SAR manual pass: Inundation confirmed near ${randomSettlement.name} (${randomSettlement.waterDepthCm} cm depth)`,
      location: `${randomSettlement.district} District`,
      coordinates: [randomSettlement.lat, randomSettlement.lng],
    };

    setEvents((prev) => [newEvent, ...prev.slice(0, 7)]);
  }, [dynamicSettlements, soundEnabled]);

  // Automated Event Ticker Generator (every 8 to 14s)
  useEffect(() => {
    if (!isScanning) return;

    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = `${now.toTimeString().slice(0, 8)} UTC`;
      const criticalG = dynamicGauges.find((g) => g.currentLevelM >= g.dangerLevelM) || dynamicGauges[0];
      const randomS = dynamicSettlements[Math.floor(Math.random() * dynamicSettlements.length)];

      const possibleEvents: DetectionEvent[] = [
        {
          id: `evt_${Date.now()}_1`,
          timestamp: timeStr,
          source: 'Sentinel-1A SAR',
          type: 'new_water_detected',
          severity: 'critical',
          message: `Backscatter shift (< -17.1 dB) confirms rapid water accumulation in ${randomS.district}`,
          location: `${randomS.name}, ${randomS.district}`,
          coordinates: [randomS.lat, randomS.lng],
        },
        {
          id: `evt_${Date.now()}_2`,
          timestamp: timeStr,
          source: 'DHM River Gauge',
          type: 'threshold_breached',
          severity: 'warning',
          message: `${criticalG.name} water level recorded at ${criticalG.currentLevelM}m (Discharge: ${criticalG.dischargeCusecs.toLocaleString()} cusecs)`,
          location: `${criticalG.river} River, ${criticalG.basin.replace('_', ' ')}`,
          coordinates: [criticalG.lat, criticalG.lng],
        },
        {
          id: `evt_${Date.now()}_3`,
          timestamp: timeStr,
          source: 'Sentinel-1B SAR',
          type: 'radar_sweep_completed',
          severity: 'info',
          message: `Ascending swath pass completed over Terai (${totalFloodAreaKm2} km² active inundation)`,
          location: 'Copernicus Sentinel Swath 142',
        },
      ];

      const picked = possibleEvents[Math.floor(Math.random() * possibleEvents.length)];
      if (picked.severity === 'critical') {
        playRadarPing('danger', soundEnabled);
      }

      setEvents((prev) => [picked, ...prev.slice(0, 7)]);
    }, 10000);

    return () => clearInterval(interval);
  }, [isScanning, dynamicGauges, dynamicSettlements, totalFloodAreaKm2, soundEnabled]);

  // Center on event location
  const handleSelectEvent = (event: DetectionEvent) => {
    if (event.coordinates) {
      setActiveTab('map');
      // If coordinates correspond to a settlement, select it
      const matchS = dynamicSettlements.find(
        (s) => Math.hypot(s.lat - event.coordinates![0], s.lng - event.coordinates![1]) < 0.1
      );
      if (matchS) {
        setSelectedSettlement(matchS);
      }
      setActiveProbe({
        lat: event.coordinates[0],
        lng: event.coordinates[1],
        backscatterDb: -17.8,
        surfaceClass: 'Standing Flood Water',
        waterConfidencePercent: 95.2,
        estimatedDepthCm: 110,
        elevationM: 70,
        nearestRiver: 'Koshi / Gandaki System',
        distanceToRiverKm: 1.8,
        nearestSettlement: event.location,
      });
    }
  };

  // Generate Situation Report
  const generateSitRep = useCallback(
    async (lang: 'en' | 'ne') => {
      setIsGeneratingSitRep(true);
      setIsSitRepOpen(true);

      const criticalNames = dynamicSettlements
        .filter((s) => s.severity === 'critical')
        .map((s) => `${s.name} (${s.waterDepthCm}cm, ${s.maroonedHouseholds} marooned HH)`);

      const payload = {
        regionName:
          params.selectedBasin === 'all'
            ? 'Nepal Terai (All 18 Lowland Districts)'
            : `${params.selectedBasin.replace('_', ' ').toUpperCase()} Basin`,
        riverBasin: params.selectedBasin,
        floodAreaKm2: totalFloodAreaKm2,
        affectedPopulation: totalAffectedPop,
        displacedPopulation: Math.round(totalDisplacedPop),
        submergedCropHa: totalSubmergedCropsHa,
        damagedBuildings: totalDamagedHouses,
        waterGauges: dynamicGauges.map((g) => ({
          name: g.name,
          level: g.currentLevelM,
          danger: g.dangerLevelM,
          trend: g.trend,
        })),
        embankmentBreached: params.embankmentBreach,
        rainfallSurgeMm: params.rainfallSurgeMm,
        criticalSettlements: criticalNames,
        language: lang,
      };

      try {
        const response = await fetch('/api/generate-sitrep', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const data = await response.json();
          setSitRepText(data.report || 'No report generated');
        } else {
          throw new Error('API request failed');
        }
      } catch (err) {
        console.warn('Using client-side fallback generator:', err);
        const isNe = lang === 'ne';
        const fallbackText = isNe
          ? `नेपाल विपद् जोखिम न्यूनीकरण तथा व्यवस्थापन प्राधिकरण (NDRRMA)
आपतकालीन बाढी स्थिति प्रतिवेदन (SITREP-04) : तराई क्षेत्र

१. परिस्थिति अवलोकन (SITUATION OVERVIEW)
सेन्टिनेल-१ SAR भू-उपग्रह तथा जल तथा मौसम विज्ञान विभाग (DHM) को प्रत्यक्ष तथ्याङ्क अनुसार ${payload.regionName} मा जलस्तर खतराको तहभन्दा माथि पुगेको छ। हालसम्म करिब ${totalFloodAreaKm2} वर्ग किलोमिटर जमिन जलमग्न भएको पाइएको छ।

२. बस्ती तथा जनजीवनमा प्रभाव (SETTLEMENT & HUMAN IMPACT)
- प्रभावित कुल जनसंख्या: करिब ${totalAffectedPop.toLocaleString()} नागरिक
- तत्काल उद्धार तथा सुरक्षित आश्रय आवश्यक विस्थापित: ${Math.round(totalDisplacedPop).toLocaleString()}
- जलमग्न तथा क्षतिग्रस्त घरधुरी: ${totalDamagedHouses.toLocaleString()} (कच्ची माटो र खरका छाना भएका बस्तीहरू)
- डुबानमा परेको धानबाली तथा कृषि जमिन: ${totalSubmergedCropsHa.toLocaleString()} हेक्टर
- खानेपानीको मुख्य स्रोत (हाते चापाकल/ट्युबवेल) दूषित भएकाले हैजा तथा झाडापखालाको उच्च जोखिम।

३. तत्काल प्राथमिक उद्धार कार्यहरू (IMMEDIATE ACTION PRIORITIES)
- प्राथमिकता १: डुबानमा परेका वडा र गाउँहरूबाट रबर बोट र नेपाली सेना/सशस्त्र प्रहरी बल परिचालन गरी तत्काल उद्धार।
- प्राथमिकता २: शुद्ध पिउने पानीका लागि क्लोरिन ट्याब्लेट (Aquatabs) तथा जीवनजल वितरण।
- प्राथमिकता ३: उच्च बाँध र विद्यालय आश्रयस्थलहरूमा त्रिपाल र सुक्खा खाद्यान्न ढुवानी।`
          : `NATIONAL DISASTER RISK REDUCTION AND MANAGEMENT AUTHORITY (NDRRMA)
RAPID FLOOD EXTENT & HUMANITARIAN SITUATION REPORT (SITREP-04)

1. SITUATION OVERVIEW & SATELLITE SENSING
Sentinel-1 SAR synthetic aperture radar change detection and DHM river gauge telemetry confirm severe riverine inundation across ${payload.regionName}. Total flood extent has surpassed ${totalFloodAreaKm2} km² with persistent backscatter decrease (< -16.8 dB) indicating deep standing water.

2. SETTLEMENT & HUMANITARIAN IMPACT
- Total Population Exposed: ~${totalAffectedPop.toLocaleString()} individuals
- Displaced / Marooned Requiring Evacuation: ~${Math.round(totalDisplacedPop).toLocaleString()} individuals
- Damaged / Inundated Residential Structures: ~${totalDamagedHouses.toLocaleString()} units
- Submerged Paddy & Farmland: ~${totalSubmergedCropsHa.toLocaleString()} hectares
- Public Health Risk: High contamination rate of shallow handpumps/tube-wells; acute need for WASH interventions.

3. IMMEDIATE OPERATIONAL RESPONSE PRIORITIES
- PRIORITY 1: Rapid search and rescue deployment of Armed Police Force (APF) and Nepal Army motorized boats to marooned settlements.
- PRIORITY 2: Emergency distribution of clean potable water, halogen/purification tablets (Aquatabs), and dry food rations.
- PRIORITY 3: Allocation of heavy-duty tarpaulins, elevated family tents, and sanitary kits at designated municipal elevated schools.`;

        setSitRepText(fallbackText);
      } finally {
        setIsGeneratingSitRep(false);
      }
    },
    [
      params.selectedBasin,
      params.rainfallSurgeMm,
      params.embankmentBreach,
      totalFloodAreaKm2,
      totalAffectedPop,
      totalDisplacedPop,
      totalDamagedHouses,
      totalSubmergedCropsHa,
      dynamicGauges,
      dynamicSettlements,
    ]
  );

  // Export GeoJSON FeatureCollection
  const handleExportGeoJSON = useCallback(() => {
    const featureCollection = {
      type: 'FeatureCollection',
      metadata: {
        title: 'Nepal Terai Rapid Flood Extent & Settlement Impact',
        sensor: 'Sentinel-1 SAR C-Band + DHM Gauges',
        timestamp: new Date().toISOString(),
        totalFloodAreaKm2,
        totalAffectedPopulation: totalAffectedPop,
      },
      features: [
        ...dynamicPolygons.map((poly) => ({
          type: 'Feature',
          properties: {
            id: poly.id,
            name: poly.name,
            basin: poly.basin,
            severity: poly.severity,
            avgDepthM: poly.avgDepthM,
            layerType: 'SAR_Flood_Inundation_Polygon',
          },
          geometry: {
            type: 'Polygon',
            coordinates: [poly.coordinates.map(([lat, lng]) => [lng, lat])],
          },
        })),
        ...dynamicSettlements.map((s) => ({
          type: 'Feature',
          properties: {
            id: s.id,
            name: s.name,
            nepaliName: s.nepaliName,
            district: s.district,
            waterDepthCm: s.waterDepthCm,
            severity: s.severity,
            affectedPopulation: s.affectedPopulation,
            maroonedHouseholds: s.maroonedHouseholds,
            layerType: 'Settlement_Impact_Point',
          },
          geometry: {
            type: 'Point',
            coordinates: [s.lng, s.lat],
          },
        })),
      ],
    };

    const blob = new Blob([JSON.stringify(featureCollection, null, 2)], {
      type: 'application/geo+json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Nepal_Terai_Flood_Extent_${new Date().toISOString().slice(0, 10)}.geojson`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [dynamicPolygons, dynamicSettlements, totalFloodAreaKm2, totalAffectedPop]);

  const handleLocateOnMap = (s: Settlement) => {
    setSelectedSettlement(s);
    setActiveTab('map');
  };

  const handleResetSimulation = () => {
    setParams({
      rainfallSurgeMm: 125,
      koshiBarrageGatesOpen: 42,
      embankmentBreach: false,
      selectedBasin: 'all',
      sensorMode: 'sar_radar',
      timeframe: 'live',
      activeLayerMask: {
        floodExtent: true,
        depthHeatmap: true,
        riverNetwork: true,
        highways: true,
        settlements: true,
        gauges: true,
        evacuationRoutes: true,
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-sky-500 selection:text-slate-950">
      {/* Top Bar Navigation */}
      <TopNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSitRep={() => generateSitRep(sitRepLanguage)}
        onExportGeoJSON={handleExportGeoJSON}
        isLiveStreamActive={isScanning}
      />

      {/* Live Alert & Detector Control Ticker */}
      <LiveAlertTicker
        events={events}
        isScanning={isScanning}
        onToggleScan={() => setIsScanning((prev) => !prev)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
        scanSpeed={scanSpeed}
        onChangeSpeed={setScanSpeed}
        onSelectEvent={handleSelectEvent}
        onTriggerInstantScan={handleTriggerInstantScan}
        sweepProgress={sweepProgress}
      />

      {/* Full-width KPI Strip */}
      <OverviewMetricsBar
        totalFloodAreaKm2={totalFloodAreaKm2}
        totalAffectedPop={totalAffectedPop}
        totalDisplacedPop={Math.round(totalDisplacedPop)}
        totalDamagedHouses={totalDamagedHouses}
        totalSubmergedCropsHa={totalSubmergedCropsHa}
        criticalGaugesCount={criticalGaugesCount}
        embankmentBreached={params.embankmentBreach}
        selectedBasin={params.selectedBasin}
      />

      {/* Main Simulation Control Ribbon */}
      <SimulationControls
        params={params}
        onChangeParams={setParams}
        isLiveStreaming={isScanning}
        onToggleLiveStream={() => setIsScanning((prev) => !prev)}
        onReset={handleResetSimulation}
      />

      {/* Tab Workspaces */}
      <main className="flex-1 flex flex-col">
        {activeTab === 'map' && (
          <div className="flex-1 flex flex-col">
            <MapView
              settlements={dynamicSettlements}
              gauges={dynamicGauges}
              rivers={RIVER_NETWORKS}
              highways={dynamicHighways}
              floodPolygons={dynamicPolygons}
              selectedSettlement={selectedSettlement}
              onSelectSettlement={setSelectedSettlement}
              selectedBasin={params.selectedBasin}
              onBasinChange={(basin) => setParams((p) => ({ ...p, selectedBasin: basin }))}
              sensorMode={params.sensorMode}
              timeframe={params.timeframe}
              onMapProbe={setActiveProbe}
              activeProbe={activeProbe}
              isScanning={isScanning}
              sweepProgress={sweepProgress}
              sensitivityThresholdDb={sensitivityThresholdDb}
            />

            {/* Interactive Live Detector Inspector & Event Stream */}
            <LiveDetectorInspector
              probe={activeProbe}
              onClearProbe={() => setActiveProbe(null)}
              probeModeActive={probeModeActive}
              onToggleProbeMode={() => setProbeModeActive((prev) => !prev)}
              events={events}
              onSelectEvent={handleSelectEvent}
              sensitivityThresholdDb={sensitivityThresholdDb}
              onChangeSensitivity={setSensitivityThresholdDb}
            />

            {/* Quick Settlement Triage Preview below inspector */}
            <div className="p-4 bg-slate-900 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
                  Critical Inundation Priority Settlements
                </span>
                <button
                  onClick={() => setActiveTab('triage')}
                  className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
                >
                  View All Settlements &amp; Export CSV →
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {dynamicSettlements
                  .filter((s) => s.severity === 'critical' || s.severity === 'severe')
                  .slice(0, 6)
                  .map((s) => (
                    <div
                      key={s.id}
                      onClick={() => setSelectedSettlement(s)}
                      className="p-2.5 bg-slate-950 border border-slate-800 hover:border-sky-500 rounded cursor-pointer transition-colors"
                    >
                      <div className="text-xs font-semibold text-white truncate">{s.name}</div>
                      <div className="text-[10px] text-slate-400">{s.district}</div>
                      <div className="text-[11px] font-mono font-bold text-rose-400 mt-1">
                        {s.waterDepthCm} cm depth
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'triage' && (
          <SettlementTriageTable
            settlements={dynamicSettlements}
            onSelectSettlement={setSelectedSettlement}
            onFocusOnMap={handleLocateOnMap}
          />
        )}

        {activeTab === 'telemetry' && (
          <LiveTelemetryPanel
            gauges={dynamicGauges}
            sarLogs={sarLogs}
            isStreaming={isScanning}
          />
        )}

        {activeTab === 'scenarios' && (
          <ScenarioSimulatorTab
            params={params}
            onChangeParams={setParams}
            settlements={dynamicSettlements}
            onSelectSettlement={setSelectedSettlement}
          />
        )}
      </main>

      {/* Settlement Detail Modal */}
      <SettlementDetailModal
        settlement={selectedSettlement}
        onClose={() => setSelectedSettlement(null)}
        onLocateOnMap={handleLocateOnMap}
      />

      {/* Situation Report Modal */}
      <SitRepModal
        isOpen={isSitRepOpen}
        onClose={() => setIsSitRepOpen(false)}
        sitRepText={sitRepText}
        isGenerating={isGeneratingSitRep}
        onRegenerate={generateSitRep}
        language={sitRepLanguage}
        setLanguage={setSitRepLanguage}
      />
    </div>
  );
}
