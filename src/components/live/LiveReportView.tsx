
import React from 'react';
import { Waypoint, LiveRoverData } from '../../types';
import MapView from '../MapView';
import WaypointStatusList from './WaypointStatusList';
import LiveControls from './LiveControls';
import LiveStatusbar from './LiveStatusbar';

type LiveReportViewProps = {
  missionWaypoints: Waypoint[];
  liveRoverData: LiveRoverData;
  missionName: string | null;
  onPause: () => void;
  onStop: () => void;
  onSkip: () => void;
  onGoBack: () => void;
};

const LiveReportView: React.FC<LiveReportViewProps> = ({
  missionWaypoints,
  liveRoverData,
  missionName,
  onPause,
  onStop,
  onSkip,
  onGoBack,
}) => {
  return (
    <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
      {/* Top section with 3 panels */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Left Panel: Waypoint List */}
        <aside className="w-[320px] flex-shrink-0 bg-[#111827] rounded-lg overflow-hidden">
          <WaypointStatusList
            waypoints={missionWaypoints}
            activeWaypointId={liveRoverData.activeWaypointIndex}
            completedWaypointIds={liveRoverData.completedWaypointIds}
          />
        </aside>

        {/* Center Panel: Map View */}
        <main className="flex-1 flex flex-col">
          <MapView
            missionWaypoints={missionWaypoints}
            onMapClick={() => {}}
            roverPosition={liveRoverData.position}
            activeWaypointIndex={liveRoverData.activeWaypointIndex}
            heading={liveRoverData.heading}
            viewMode="live"
            isFullScreen={false} // Full screen is handled by the browser
            onNewMissionDrawn={() => {}}
            isConnectedToRover={false} // In live view, we just display data
            onUpdateWaypointPosition={() => {}}
          />
        </main>

        {/* Right Panel: Controls */}
        <aside className="w-[240px] flex-shrink-0">
          <LiveControls 
            onPause={onPause}
            onStop={onStop}
            onSkip={onSkip}
            onGoBack={onGoBack}
          />
        </aside>
      </div>

      {/* Bottom Panel: Status Bar */}
      <footer className="h-[180px] flex-shrink-0">
        <LiveStatusbar 
            missionName={missionName}
            waypoints={missionWaypoints}
            liveRoverData={liveRoverData}
        />
      </footer>
    </div>
  );
};

export default LiveReportView;
