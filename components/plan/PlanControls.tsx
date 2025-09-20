
import React, { useRef, useCallback } from 'react';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';
import { Waypoint } from '../../types';
import { parseMissionFile, ParsedWaypoint } from '../../utils/missionParser';

type PlanControlsProps = {
  onUpload: (waypoints: Waypoint[]) => void;
  onExport: () => void;
  onUploadInitiated: () => void;
}

const PlanControls: React.FC<PlanControlsProps> = ({ onUpload, onExport, onUploadInitiated }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0];
      try {
        const parsedWaypoints: ParsedWaypoint[] = await parseMissionFile(file);
        const mission: Waypoint[] = parsedWaypoints.map((wp, index) => ({
            ...wp,
            id: index + 1,
            command: wp.command || 'WAYPOINT',
        }));
        onUpload(mission);
      } catch (error) {
        console.error("Error parsing mission file:", error);
        alert((error as Error).message);
      }
    }
  };
  
  const handleUploadClick = () => {
    onUploadInitiated();
    fileInputRef.current?.click();
  };


  return (
    <div className="bg-[#111827] h-full rounded-md p-3 flex flex-col gap-4 text-sm text-gray-300">
       <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={(e) => processFiles(e.target.files)} 
          accept=".waypoint,.csv,.dxf"
        />

      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="form-checkbox bg-gray-800 border-gray-600 text-green-500 focus:ring-green-500" />
          Grid
        </label>
      </div>

      <div className="relative">
        <select className="w-full bg-[#1F2937] border border-gray-600 rounded-md pl-3 pr-8 py-2 appearance-none focus:outline-none focus:ring-1 focus:ring-green-500">
          <option>GoogleHybridMap</option>
          <option>OpenStreetMap</option>
          <option>GoogleSatellite</option>
        </select>
        <ChevronDownIcon className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      <p className="text-xs text-gray-400">Status: loaded tiles</p>

      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-2">
            <button onClick={handleUploadClick} className="bg-green-600 hover:bg-green-700 py-2 rounded-md font-semibold col-span-2">Upload Mission</button>
            <button onClick={onExport} className="bg-blue-600 hover:bg-blue-700 py-2 rounded-md font-semibold col-span-2">Export Mission</button>
            <button className="bg-gray-600 hover:bg-gray-700 py-2 rounded-md font-semibold">Read from Rover</button>
            <button className="bg-gray-600 hover:bg-gray-700 py-2 rounded-md font-semibold">Write to Rover</button>
        </div>
      </div>
      
      <div className="mt-auto bg-[#1F2937] p-3 rounded-md border border-gray-700">
        <h3 className="font-bold text-gray-200 mb-2">Home Location</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <span className="font-semibold text-gray-400">Lat:</span>
          <span>13.07195380</span>
          <span className="font-semibold text-gray-400">Long:</span>
          <span>80.26194361</span>
          <span className="font-semibold text-gray-400">ASL:</span>
          <span>12.80</span>
        </div>
      </div>
    </div>
  );
};

export default PlanControls;
