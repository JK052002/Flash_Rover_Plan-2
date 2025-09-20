
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
};
