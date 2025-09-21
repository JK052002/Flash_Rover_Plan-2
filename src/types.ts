
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
