
import React from 'react';
import MissionControls from './MissionControls';
import StatusPanel from './StatusPanel';
import { Waypoint } from '../types';
import { RoverData } from '../hooks/useRoverConnection';

type LeftSidebarProps = {
  onMissionUpload: (waypoints: Waypoint[], fileName: string) => void;
  onUploadInitiated: () => void;
  onClearMission: () => void;
  roverData: RoverData;
  isConnected: boolean;
  onChangeMode: (mode: string) => void;
  onArmDisarm: () => void;
};

const LeftSidebar: React.FC<LeftSidebarProps> = ({ 
  onMissionUpload, 
  onUploadInitiated, 
  onClearMission, 
  roverData,
  isConnected,
  onChangeMode,
  onArmDisarm,
}) => {
  return (
    <aside className="w-1/4 max-w-xs flex flex-col gap-4">
      <MissionControls 
        onMissionUpload={onMissionUpload} 
        onUploadInitiated={onUploadInitiated} 
        onClearMission={onClearMission}
        roverMode={roverData.mode}
        roverStatus={roverData.status}
        isConnected={isConnected}
        onChangeMode={onChangeMode}
        onArmDisarm={onArmDisarm}
      />
      <StatusPanel 
        roverData={roverData}
        isConnected={isConnected}
      />
    </aside>
  );
};

export default LeftSidebar;
