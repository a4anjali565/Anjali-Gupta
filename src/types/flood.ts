export type BasinId = 'koshi' | 'narayani' | 'karnali' | 'bagmati_kamala' | 'west_rapti_babai' | 'mahakali_mohana';

export type InundationSeverity = 'none' | 'shallow' | 'moderate' | 'severe' | 'critical';

export interface RiverGauge {
  id: string;
  name: string;
  nepaliName: string;
  river: string;
  basin: BasinId;
  lat: number;
  lng: number;
  currentLevelM: number;
  warningLevelM: number;
  dangerLevelM: number;
  dischargeCusecs: number;
  trend: 'rising' | 'steady' | 'receding';
  lastUpdated: string;
}

export interface Settlement {
  id: string;
  name: string;
  nepaliName: string;
  district: string;
  province: string;
  basin: BasinId;
  lat: number;
  lng: number;
  elevationM: number;
  totalPopulation: number;
  totalHouseholds: number;
  kacchiHousePercent: number; // Mud/thatch/bamboo (vulnerable)
  // Dynamic computed fields based on flood simulation
  waterDepthCm: number;
  severity: InundationSeverity;
  affectedPopulation: number;
  maroonedHouseholds: number;
  submergedPaddyHa: number;
  hospitalAtRisk: boolean;
  schoolShelterAvailable: boolean;
  handpumpContaminationRisk: 'Low' | 'Moderate' | 'High' | 'Extreme';
  evacuationDestination: string;
  evacuationDistanceKm: number;
}

export interface RiverPath {
  id: string;
  name: string;
  basin: BasinId;
  coordinates: [number, number][]; // [lat, lng]
}

export interface HighwaySegment {
  id: string;
  name: string;
  routeNumber: string; // e.g. H01 (Mahendra), H17 (Postal/Hulaki)
  coordinates: [number, number][];
  status: 'open' | 'caution' | 'submerged_impassable';
  submergedLengthKm: number;
}

export interface FloodPolygon {
  id: string;
  name: string;
  basin: BasinId;
  coordinates: [number, number][]; // Polygon outer boundary
  severity: 'shallow' | 'moderate' | 'severe';
  avgDepthM: number;
}

export interface SARPassLog {
  satellite: string; // 'Sentinel-1A' | 'Sentinel-1B'
  orbitDirection: 'Ascending' | 'Descending';
  relativeOrbit: number;
  sensor: string; // 'C-Band SAR (IW mode, VV/VH)'
  backscatterDeltaDb: number;
  acquisitionTime: string;
  coverageAreaKm2: number;
  confidenceScore: number;
}

export interface SimulationParams {
  rainfallSurgeMm: number; // 0 to 300 mm
  koshiBarrageGatesOpen: number; // 10 to 56 gates
  embankmentBreach: boolean;
  selectedBasin: BasinId | 'all';
  sensorMode: 'sar_radar' | 'optical_ndwi' | 'composite';
  timeframe: 'pre_flood' | 'peak' | 'live';
  activeLayerMask: {
    floodExtent: boolean;
    depthHeatmap: boolean;
    riverNetwork: boolean;
    highways: boolean;
    settlements: boolean;
    gauges: boolean;
    evacuationRoutes: boolean;
  };
}
