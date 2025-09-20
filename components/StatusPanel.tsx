import React from 'react';
import { BatteryIcon } from './icons/BatteryIcon';
import { RtkIcon } from './icons/RtkIcon';
import { SignalIcon } from './icons/SignalIcon';
import { ImuIcon } from './icons/ImuIcon';
import { RoverData } from '../hooks/useRoverConnection';

type StatusPanelProps = {
  roverData: RoverData;
  isConnected: boolean;
}

const StatusPanel: React.FC<StatusPanelProps> = ({ roverData, isConnected }) => {
  
  const getDisplayValue = (value: string | number | null | undefined, unit: string = '') => {
    if (!isConnected || value === null || value === undefined || value === -1 || value === 'UNKNOWN') {
      return 'N/A';
    }
    return `${value}${unit}`;
  };

  const statusItems = [
    { name: 'Mode', value: getDisplayValue(roverData.mode), icon: <ImuIcon className="w-5 h-5 text-yellow-400" /> },
    { name: 'Battery', value: getDisplayValue(roverData.battery, '%'), icon: <BatteryIcon level={isConnected ? roverData.battery : -1} className="w-5 h-5" /> },
    { name: 'RTK', value: getDisplayValue(roverData.rtk_status), icon: <RtkIcon className="w-5 h-5 text-blue-400" /> },
    { name: 'Signal', value: getDisplayValue(roverData.signal_strength), icon: <SignalIcon className="w-5 h-5 text-sky-400" /> },
  ];

  return (
    <div className="bg-[#111827] rounded-lg overflow-hidden">
      <h2 className="bg-purple-700 text-white text-md font-bold p-3">STATUS</h2>
      <ul className="p-4 space-y-4">
        {statusItems.map((item) => (
          <li key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {item.icon}
              <span className="font-medium text-gray-300">{item.name}</span>
            </div>
            <span className="font-mono text-sm text-gray-200 uppercase">{item.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StatusPanel;