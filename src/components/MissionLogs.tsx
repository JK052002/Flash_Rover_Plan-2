
import React from 'react';
import { LogsIcon } from './icons/LogsIcon';
import { LogEntry, Waypoint } from '../types';

type MissionLogsProps = {
    logEntries: LogEntry[];
    waypoints: Waypoint[];
};

const MissionLogs: React.FC<MissionLogsProps> = ({ logEntries, waypoints }) => {
  const headers = ['S.No', 'Waypoint', 'Latitude', 'Longitude', 'Alt (m)', 'Status', 'Remark', 'Error'];

  const parseLogEntry = (entry: LogEntry) => {
    const waypointRegex = /Waypoint (\d+)/;
    const match = entry.event.match(waypointRegex);
    const waypointId = match ? parseInt(match[1], 10) : null;
    const waypoint = waypointId ? waypoints.find(wp => wp.id === waypointId) : null;

    let status = 'INFO';
    if (entry.event.startsWith('Reached')) status = 'REACHED';
    else if (entry.event.startsWith('Mission Complete')) status = 'COMPLETED';
    else if (entry.event.startsWith('Skipped')) status = 'SKIPPED';
    else if (entry.event.startsWith('Mission Started')) status = 'STARTED';
    else if (entry.event.startsWith('Resuming')) status = 'RESUMED';
    else if (entry.event.startsWith('Simulation Paused')) status = 'PAUSED';
    else if (entry.event.startsWith('Simulation Reset')) status = 'RESET';


    return {
        waypoint: waypointId ?? '-',
        lat: entry.lat.toFixed(6),
        lng: entry.lng.toFixed(6),
        alt: waypoint ? waypoint.alt.toFixed(2) : '-',
        status: status,
        remark: entry.event,
        error: '-'
    };
  };
  
  const missionEvents = logEntries.filter(e => 
    e.event.includes('Waypoint') || e.event.includes('Mission') || e.event.includes('Simulation')
  );

  return (
    <div className="bg-[#111827] p-4 rounded-lg h-full flex flex-col">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <LogsIcon className="w-5 h-5 text-gray-300"/>
          <h2 className="text-lg font-bold text-white">Mission Logs</h2>
        </div>
        <button className="bg-gray-700 p-1 rounded-md hover:bg-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      <div className="overflow-y-auto flex-1">
        <table className="w-full text-sm text-left text-gray-300">
          <thead className="text-xs text-gray-400 uppercase bg-[#111827] sticky top-0">
            <tr>
              {headers.map(header => (
                <th key={header} scope="col" className="px-4 py-2 whitespace-nowrap">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {missionEvents.length === 0 ? (
                <tr>
                    <td colSpan={headers.length} className="text-center py-8 text-gray-500">
                        No mission logs to display.
                    </td>
                </tr>
            ) : (
                missionEvents.map((entry, index) => {
                    const parsed = parseLogEntry(entry);
                    return (
                        <tr key={`${entry.timestamp}-${index}`} className="border-b border-gray-700 hover:bg-gray-800 text-xs">
                            <td className="px-4 py-1">{index + 1}</td>
                            <td className="px-4 py-1 text-center">{parsed.waypoint}</td>
                            <td className="px-4 py-1 font-mono">{parsed.lat}</td>
                            <td className="px-4 py-1 font-mono">{parsed.lng}</td>
                            <td className="px-4 py-1 text-right">{parsed.alt}</td>
                            <td className="px-4 py-1"><span className="bg-green-800 text-green-200 px-2 py-0.5 rounded-full text-xs font-semibold">{parsed.status}</span></td>
                            <td className="px-4 py-1 truncate max-w-[200px]" title={parsed.remark}>{parsed.remark}</td>
                            <td className="px-4 py-1 text-center">{parsed.error}</td>
                        </tr>
                    )
                })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MissionLogs;
