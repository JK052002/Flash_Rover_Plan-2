import React from 'react';
import { TrashIcon } from '../icons/TrashIcon';
import { Waypoint } from '../../types';
import { calculateBearing, calculateDestination, calculateDistance } from '../../utils/geo';

type QGCWaypointTableProps = {
  waypoints: Waypoint[];
  onDelete: (id: number) => void;
  onUpdate: (id: number, newValues: Partial<Omit<Waypoint, 'id'>>) => void;
  activeWaypointIndex?: number | null;
};

const QGCWaypointTable: React.FC<QGCWaypointTableProps> = ({ waypoints, onDelete, onUpdate, activeWaypointIndex }) => {
  const headers = ['#', 'Command', 'Action', 'Delay', 'PWM', 'Servo No', 'Frame', 'Distance', 'Lat', 'Long', 'Alt', 'Actions'];

  const handleValueChange = (
    id: number,
    field: keyof Omit<Waypoint, 'id' | 'command' | 'action'>,
    value: string
  ) => {
    const numericValue = value === '' ? 0 : parseFloat(value);
    if (isNaN(numericValue)) return;

    const waypointIndex = waypoints.findIndex(wp => wp.id === id);
    if (waypointIndex === -1) return;

    const currentWaypoint = waypoints[waypointIndex];
    const previousWaypoint = waypointIndex > 0 ? waypoints[waypointIndex - 1] : null;

    if (field === 'param4' && previousWaypoint) {
      // User edited the DISTANCE field. Recalculate lat/lng.
      const bearing = calculateBearing(previousWaypoint, currentWaypoint);
      const newPosition = calculateDestination(previousWaypoint, bearing, numericValue);
      onUpdate(id, {
        param4: numericValue,
        lat: newPosition.lat,
        lng: newPosition.lng,
      });
    } else if ((field === 'lat' || field === 'lng') && previousWaypoint) {
      // User edited LAT or LNG. Recalculate the distance (param4).
      const newPosition = {
        lat: field === 'lat' ? numericValue : currentWaypoint.lat,
        lng: field === 'lng' ? numericValue : currentWaypoint.lng,
      };
      const newDistance = calculateDistance(previousWaypoint, newPosition);
      onUpdate(id, {
        [field]: numericValue,
        param4: newDistance,
      });
    } else {
      onUpdate(id, { [field]: numericValue });
    }
  };

  const handleCommandChange = (e: React.ChangeEvent<HTMLSelectElement>, id: number) => {
    onUpdate(id, { command: e.target.value });
  };
  
  const handleActionChange = (e: React.ChangeEvent<HTMLSelectElement>, id: number) => {
    onUpdate(id, { action: e.target.value });
  };
  
  return (
    <div className="bg-[#111827] h-full rounded-md p-3 flex flex-col text-sm text-gray-300 overflow-hidden">
      <h2 className="text-lg font-bold mb-2">Mission Plan (QGC WPL 110)</h2>
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-[#111827]">
            <tr>
              {headers.map(header => (
                <th key={header} scope="col" className="px-2 py-2 text-xs text-gray-400 uppercase font-medium whitespace-nowrap">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {waypoints.length === 0 ? (
                <tr>
                    <td colSpan={headers.length} className="text-center py-8 text-gray-500">
                        Upload a mission file or use the drawing tools to begin.
                    </td>
                </tr>
            ) : (
              waypoints.map((wp, index) => {
                const isActive = wp.id === activeWaypointIndex;
                const isFirstWaypoint = index === 0;
                return (
                  <tr key={wp.id} className={`hover:bg-gray-800 ${isActive ? 'bg-green-800/50' : ''}`}>
                    <td className="px-2 py-1">{wp.id}</td>
                    <td className="px-2 py-1">
                      <select 
                        value={wp.command}
                        onChange={(e) => handleCommandChange(e, wp.id)}
                        className="bg-gray-700 border-gray-600 rounded p-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 w-full"
                      >
                        <option>WAYPOINT</option>
                        <option>LOITER_TURNS</option>
                        <option>LAND</option>
                        <option>TAKEOFF</option>
                      </select>
                    </td>
                     <td className="px-2 py-1">
                      <select 
                        value={wp.action || 'NONE'}
                        onChange={(e) => handleActionChange(e, wp.id)}
                        className="bg-gray-700 border-gray-600 rounded p-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 w-full"
                      >
                        <option>NONE</option>
                        <option>DO_SET_SERVO</option>
                      </select>
                    </td>
                    <td className="px-2 py-1"><input title="Delay in seconds" type="number" value={wp.param1 || 0} onChange={(e) => handleValueChange(wp.id, 'param1', e.target.value)} className="bg-gray-700 w-16 p-1 rounded" /></td>
                    <td className="px-2 py-1"><input title="PWM value" type="number" value={wp.param2 || 0} onChange={(e) => handleValueChange(wp.id, 'param2', e.target.value)} className="bg-gray-700 w-16 p-1 rounded" /></td>
                    <td className="px-2 py-1"><input title="Servo number" type="number" value={wp.param3 || 0} onChange={(e) => handleValueChange(wp.id, 'param3', e.target.value)} className="bg-gray-700 w-16 p-1 rounded" /></td>
                    <td className="px-2 py-1"><input type="number" value={wp.frame} onChange={(e) => handleValueChange(wp.id, 'frame', e.target.value)} className="bg-gray-700 w-16 p-1 rounded" /></td>
                    <td className="px-2 py-1">
                      <input 
                        type="number" 
                        value={(wp.param4 || 0).toFixed(2)} 
                        onChange={(e) => handleValueChange(wp.id, 'param4', e.target.value)} 
                        className="bg-gray-700 w-20 p-1 rounded disabled:bg-gray-800 disabled:cursor-not-allowed"
                        disabled={isFirstWaypoint}
                        title={isFirstWaypoint ? "Distance is relative to the previous waypoint and cannot be set for the first point." : "Distance from previous waypoint in meters."}
                      />
                    </td>
                    <td className="px-2 py-1 font-mono"><input type="number" step="0.000001" value={wp.lat} onChange={(e) => handleValueChange(wp.id, 'lat', e.target.value)} className="bg-gray-700 w-24 p-1 rounded" /></td>
                    <td className="px-2 py-1 font-mono"><input type="number" step="0.000001" value={wp.lng} onChange={(e) => handleValueChange(wp.id, 'lng', e.target.value)} className="bg-gray-700 w-24 p-1 rounded" /></td>
                    <td className="px-2 py-1"><input type="number" value={wp.alt} onChange={(e) => handleValueChange(wp.id, 'alt', e.target.value)} className="bg-gray-700 w-16 p-1 rounded" /></td>
                    <td className="px-2 py-1">
                      <button onClick={() => onDelete(wp.id)} className="text-red-500 hover:text-red-400 p-1">
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QGCWaypointTable;