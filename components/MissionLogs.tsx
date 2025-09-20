import React from 'react';
import { LogsIcon } from './icons/LogsIcon';

const MissionLogs: React.FC = () => {
  const headers = ['S.No', 'Waypoint', 'Latitude', 'Longitude', 'Alt (m)', 'Status', 'Remark', 'Error'];
  
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
                <th key={header} scope="col" className="px-6 py-3 whitespace-nowrap">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Table body would be populated here. Adding a placeholder row for styling. */}
            <tr className="border-b border-gray-700">
                <td colSpan={headers.length} className="text-center py-8 text-gray-500">
                    No mission logs to display.
                </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MissionLogs;