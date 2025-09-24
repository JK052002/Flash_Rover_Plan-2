import React, { useRef, useState } from 'react';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';
import ActionsDropdown from './ActionsDropdown';
import { Waypoint } from '../../types';
import { parseMissionFile, ParsedWaypoint } from '../../utils/missionParser';

// A simple custom dropdown component for the map type selector
const MapTypeDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState('GoogleHybridMap');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const options = ['GoogleHybridMap', 'OpenStreetMap', 'GoogleSatellite'];

  const toggleDropdown = () => setIsOpen(!isOpen);

  // You'd also need a handleClickOutside function here
  // for a full implementation similar to ActionsDropdown

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="w-full bg-[#1F2937] border border-gray-600 rounded-md pl-3 pr-8 py-2 text-left appearance-none focus:outline-none focus:ring-1 focus:ring-green-500 flex justify-between items-center"
      >
        <span>{selectedOption}</span>
        <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <ul className="absolute z-10 w-full mt-1 bg-[#1F2937] border border-gray-600 rounded-md shadow-lg">
          {options.map((option) => (
            <li
              key={option}
              className="px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 cursor-pointer"
              onClick={() => {
                setSelectedOption(option);
                setIsOpen(false);
              }}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

type PlanControlsProps = {
  onUpload: (waypoints: Waypoint[], fileName: string) => void;
  onExport: () => void;
  onUploadInitiated: () => void;
}

const PlanControls: React.FC<PlanControlsProps> = ({ onUpload, onExport, onUploadInitiated }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // States for the new input fields
  const [pwm, setPwm] = useState('');
  const [servoNo, setServoNo] = useState('');

  // Function to handle and validate input for 3-4 digit whole numbers
  const handleNumericInputChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
    // Allow only digits and limit length to 4
    if (/^\d{0,4}$/.test(value)) {
      setter(value);
    }
  };

  const processFiles = async (files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0];
      setIsUploading(true);
      try {
        const parsedWaypoints: ParsedWaypoint[] = await parseMissionFile(file);
        const mission: Waypoint[] = parsedWaypoints.map((wp, index) => ({
          ...wp,
          id: index + 1,
          command: wp.command || 'WAYPOINT',
        }));
        onUpload(mission, file.name);
      } catch (error) {
        console.error("Error parsing mission file:", error);
        alert((error as Error).message);
      } finally {
        setIsUploading(false);
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
        <MapTypeDropdown />
      </div>

      <p className="text-xs text-gray-400">Status: loaded tiles</p>

      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleUploadClick}
            className={`py-2 rounded-md font-semibold col-span-2 ${isUploading ? 'bg-green-800 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload Mission'}
          </button>
          <button onClick={onExport} className="bg-blue-600 hover:bg-blue-700 py-2 rounded-md font-semibold col-span-2">Export Mission</button>
          <button className="bg-gray-600 hover:bg-gray-700 py-2 rounded-md font-semibold">Read from Rover</button>
          <button className="bg-gray-600 hover:bg-gray-700 py-2 rounded-md font-semibold">Write to Rover</button>
          <div className="col-span-2">
            <ActionsDropdown />
          </div>
          
          {/* New container for the PWM and Servo No inputs */}
          <div className="col-span-2 flex flex-col gap-2 mt-2">
            {/* PWM Row */}
            <div className="flex items-center gap-8">
              <label htmlFor="pwm" className="text-xs font-semibold text-gray-400 w-16">PWM</label>
              <input
                id="pwm"
                type="text"
                inputMode="numeric"
                pattern="\d{3,4}"
                title="Enter a 3 or 4 digit number"
                value={pwm}
                onChange={(e) => handleNumericInputChange(setPwm, e.target.value)}
                //className="flex-1 rounded border border-gray-600 bg-[#1F2937] px-2 py-1.5 text-sm text-gray-300"
                className="w-70 rounded border border-gray-600 bg-[#1F2937] px-2 py-1.5 text-sm text-gray-300"
                maxLength={4}
              />
            </div>
            {/* Servo No Row */}
            <div className="flex items-center gap-8">
              <label htmlFor="servo" className="text-xs font-semibold text-gray-400 w-16">Servo No</label>
              <input
                id="servo"
                type="text"
                inputMode="numeric"
                pattern="\d{3,4}"
                title="Enter a 3 or 4 digit number"
                value={servoNo}
                onChange={(e) => handleNumericInputChange(setServoNo, e.target.value)}
                // Change the input box 
                className="w-70 rounded border border-gray-600 bg-[#1F2937] px-2 py-1.5 text-sm text-gray-300"
                //className="flex-1 rounded border border-gray-600 bg-[#1F2937] px-2 py-1.5 text-sm text-gray-300"
                maxLength={4}
              />
            </div>
          </div>
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
