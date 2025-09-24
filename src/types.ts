
export interface LogEntry {
  timestamp: string;
  lat: number;
  lng: number;
  event: string;
}

export interface MissionLog {
  id: string;
  name: string;
  status: 'Completed' | 'Incomplete' | 'In Progress';
  timestamp: Date;
  entries: LogEntry[];
}

export type Waypoint = {
  id: number;
  command: string;
  lat: number;
  lng: number;
  alt: number;
  frame: number;
  param1?: number;
  param2?: number;
  param3?: number;
  param4?: number;
  action?: string;
};

export type ViewMode = 'dashboard' | 'planning' | 'live';

/**
 * A consistent data structure for feeding the Live Report view,
 * abstracting the source (simulation vs. real rover).
 */
export type LiveRoverData = {
  position: { lat: number; lng: number } | null;
  heading: number;
  battery: number;
  status: 'armed' | 'disarmed';
  mode: string;
  rtk_status: string;
  // Simulated values for display
  hrms: string | number;
  vrms: string | number;
  imu_status: string;
  activeWaypointIndex: number | null;
  completedWaypointIds: number[];
  distanceToNext: number;
};
