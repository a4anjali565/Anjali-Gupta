export interface DetectionEvent {
  id: string;
  timestamp: string;
  source: 'Sentinel-1A SAR' | 'Sentinel-1B SAR' | 'DHM River Gauge' | 'Embankment Monitor' | 'Optical MNDWI';
  type: 'new_water_detected' | 'threshold_breached' | 'embankment_risk' | 'highway_submerged' | 'radar_sweep_completed';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  location: string;
  coordinates?: [number, number];
}

export interface ProbeResult {
  lat: number;
  lng: number;
  backscatterDb: number;
  surfaceClass: 'Standing Flood Water' | 'Saturated Wet Soil' | 'Agricultural Paddy' | 'Dry Ground / Settlement';
  waterConfidencePercent: number;
  estimatedDepthCm: number;
  elevationM: number;
  nearestRiver: string;
  distanceToRiverKm: number;
  nearestSettlement: string;
}

export interface LiveDetectorState {
  isActive: boolean;
  scanSpeed: 'slow' | 'normal' | 'fast'; // slow: 10s, normal: 5s, fast: 2s
  sweepProgress: number; // 0 to 100% across the map
  soundEnabled: boolean;
  sensitivityThresholdDb: number; // e.g. -16.5 dB
  probeModeActive: boolean;
  lastProbe: ProbeResult | null;
  totalDetectionsCount: number;
  expansionRateKm2Hr: number;
}
