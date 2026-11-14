export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Detector {
  id: string;
  string_index: number;
  level_index: number;
  position: Vec3;
  gain: number;
  time_offset_ns: number;
  dark_rate_hz: number;
  online: boolean;
}

export interface PhotonHit {
  channel_id: string;
  arrival_ns: number;
  raw_charge: number;
}

export interface TriggerState {
  fired: boolean;
  distinct_channels: number;
  window_start_ns: number;
  window_end_ns: number;
  matched_channels: string[];
}

export interface EventRecord {
  id: string;
  created_at: string;
  triggered: boolean;
  multiplicity: number;
  total_charge_pe: number;
  energy_proxy_gev: number;
  rms_residual_ns: number;
  vertex: Vec3;
  emission_time_ns: number;
  converged: boolean;
  iterations: number;
  waveform: number[];
  charge_histogram: number[];
  matched_channels: string[];
  hits: PhotonHit[];
  kind: string;
  truth_vertex?: Vec3;
}

export interface ArrayOverview {
  mode: string;
  experiment: string;
  channels: {
    total: number;
    online: number;
    offline: number;
    average_dark_rate_hz: number;
  };
  recorded_events: number;
  policy_families: string[];
  policy_cases_per_family: number;
}

export interface SimulationParams {
  seed: number;
  event_position: Vec3;
  light_yield: number;
  jitter_ns: number;
  noise_hits: number;
}

export interface StreamActivity {
  kind: string;
  recorded_events: number;
  at: string;
  mode: string;
}
