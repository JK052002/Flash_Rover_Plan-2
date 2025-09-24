import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import LeftSidebar from './components/LeftSidebar';
import MapView from './components/MapView';
import PlanControls from './components/plan/PlanControls';
import QGCWaypointTable from './components/plan/QGCWaypointTable';
import LiveReportView from './components/live/LiveReportView';
import MissionLogs from './components/MissionLogs';
import { Waypoint, ViewMode, LiveRoverData } from './types';
import { toQGCWPL110 } from './utils/missionParser';
import { useRoverConnection } from './hooks/useRoverConnection';
import { useMissionLogs } from './hooks/useMissionLogs';
import { calculateDistancesForMission } from './utils/geo';
import ConnectionError from './components/ConnectionError';
import CommandErrorModal from './components/CommandErrorModal';

type CommandError = {
  title: string;
  message: string;
  causes: string[];
};

const App: React.FC = () => {
  // --- All existing state and hooks remain the same ---
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [missionWaypoints, setMissionWaypoints] = useState<Waypoint[]>([]);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const uploadInitiatedRef = useRef(false);
  const [currentMissionFileName, setCurrentMissionFileName] = useState<string | null>(null);
  const [commandError, setCommandError] = useState<CommandError | null>(null);
  const { missionLogs, getActiveLogEntries } = useMissionLogs();
  const {
    connectionStatus,
    roverData,
    connect,
    disconnect,
    sendCommand,
    addCommandResponseListener,
  } = useRoverConnection();

  // --- All existing useEffect and handler functions remain the same ---
  useEffect(() => {
    if (connectionStatus === 'CONNECTED_TO_ROVER') {
      const removeListener = addCommandResponseListener((response) => {
        if (response.status === 'error') {
          let causes = ['The vehicle is not in a state to accept this command.', 'Check vehicle logs for more details.'];
          if (response.message.includes("is not armable")) {
              causes = ["Vehicle's pre-arm checks failed (e.g., GPS lock, IMU calibration).", "Safety switch on the vehicle may not be pressed.", "Review the vehicle's pre-arm check list."];
          } else if (response.message.includes("Mode")) {
              causes = ["The vehicle cannot switch to this mode in its current state.", "The requested mode may not be available for this vehicle type."];
          }
          setCommandError({ title: 'Command Rejected by Vehicle', message: response.message, causes });
        }
      });
      return () => removeListener();
    }
  }, [connectionStatus, addCommandResponseListener]);
  
  const handleToggleFullScreen = () => {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen();
      else if (document.exitFullscreen) document.exitFullscreen();
  };
  const handleToggleConnection = () => {
      if (connectionStatus === 'DISCONNECTED' || connectionStatus === 'ERROR') connect();
      else disconnect();
  };
  const handleArmDisarm = () => {
      if (missionWaypoints.length === 0 && roverData.status === 'disarmed') {
      setCommandError({
          title: 'Mission Not Loaded',
          message: 'Cannot start a mission because no mission file has been uploaded.',
          causes: ['Upload a valid `.waypoints` or `.plan` file.', 'Ensure the mission appears in the plan table.'],
      });
      return;
      }
      sendCommand({ command: 'ARM_DISARM', arm: roverData.status === 'disarmed' });
  };
  const handleChangeMode = (mode: string) => sendCommand({ command: 'SET_MODE', mode: mode });
  const handleMapClick = (lat: number, lng: number) => console.log(`Map clicked at: ${lat}, ${lng}`);
  const handleUploadInitiated = () => { if (document.fullscreenElement) uploadInitiatedRef.current = true; };
  const handleMissionUpload = (waypoints: Waypoint[], fileName: string) => {
      setMissionWaypoints(calculateDistancesForMission(waypoints));
      setCurrentMissionFileName(fileName);
  };
  const handleClearMission = () => {
      setMissionWaypoints([]);
      setCurrentMissionFileName(null);
  };
  const handleDeleteWaypoint = (id: number) => setMissionWaypoints(prev => calculateDistancesForMission(prev.filter(wp => wp.id !== id)));
  const handleUpdateWaypoint = (id: number, newValues: Partial<Omit<Waypoint, 'id'>>) => setMissionWaypoints(prev => prev.map(wp => (wp.id === id ? { ...wp, ...newValues } : wp)));
  const handleUpdateWaypointPosition = (waypointId: number, newPosition: { lat: number, lng: number }) => {
      setMissionWaypoints(prev => calculateDistancesForMission(prev.map(wp => 
      wp.id === waypointId ? { ...wp, ...newPosition } : wp
      )));
  };
  const handleNewMissionDrawn = (points: { lat: number, lng: number }[]) => {
      const newWaypoints: Waypoint[] = points.map((p, index) => ({ id: index + 1, command: 'WAYPOINT', lat: p.lat, lng: p.lng, alt: 50, frame: 3 }));
      handleMissionUpload(newWaypoints, `Drawn Mission - ${new Date().toLocaleTimeString()}`);
  };
  const handleExportMission = () => {
      if (missionWaypoints.length === 0) return alert("No mission to export.");
      const blob = new Blob([toQGCWPL110(missionWaypoints)], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'mission.waypoints';
      link.click();
  };
  const isConnectedToRover = connectionStatus === 'CONNECTED_TO_ROVER';
  const liveRoverData: LiveRoverData = isConnectedToRover ? {
      ...roverData, activeWaypointIndex: roverData.current_waypoint_id, hrms: 'N/A', vrms: 'N/A',
      imu_status: 'ALIGNED', completedWaypointIds: [], distanceToNext: 0,
  } : {
      position: null, heading: 0, battery: 0, status: 'disarmed', mode: 'UNKNOWN', rtk_status: 'N/A',
      hrms: '0.000', vrms: '0.000', imu_status: 'UNALIGNED', activeWaypointIndex: null,
      completedWaypointIds: [], distanceToNext: 0,
  };
  const commonMapProps = {
    missionWaypoints, onMapClick: handleMapClick, roverPosition: liveRoverData.position,
    activeWaypointIndex: liveRoverData.activeWaypointIndex, heading: liveRoverData.heading,
    viewMode, isFullScreen, onNewMissionDrawn: handleNewMissionDrawn, isConnectedToRover,
    onUpdateWaypointPosition: handleUpdateWaypointPosition
  };
  const commonSidebarProps = {
      onMissionUpload: handleMissionUpload, onUploadInitiated: handleUploadInitiated, onClearMission: handleClearMission,
      roverData, isConnected: isConnectedToRover, onChangeMode: handleChangeMode, onArmDisarm: handleArmDisarm,
      missionLogs
  };

  const renderMainContent = () => {
    // This function remains the same as before
    switch (viewMode) {
      case 'planning': return ( <main className="flex-1 flex p-4 gap-4 overflow-hidden"> <div className="flex-1 flex flex-col gap-4"> <MapView {...commonMapProps} /> <div className="flex-[0_0_240px] overflow-hidden"> <QGCWaypointTable waypoints={missionWaypoints} onDelete={handleDeleteWaypoint} onUpdate={handleUpdateWaypoint} activeWaypointIndex={liveRoverData.activeWaypointIndex} /> </div> </div> <aside className="w-1/4 max-w-xs flex flex-col"> <PlanControls onUpload={handleMissionUpload} onExport={handleExportMission} onUploadInitiated={handleUploadInitiated} /> </aside> </main> );
      case 'live': return <LiveReportView missionWaypoints={missionWaypoints} liveRoverData={liveRoverData} missionName={currentMissionFileName} isConnected={isConnectedToRover} />;
      case 'dashboard': default: return ( <main className="flex-1 flex p-4 gap-4 overflow-hidden"> <LeftSidebar {...commonSidebarProps} /> <div className="flex-1 flex flex-col gap-4"> <MapView {...commonMapProps} /> <div className="flex-[0_0_240px] overflow-hidden"> <MissionLogs logEntries={getActiveLogEntries()} waypoints={missionWaypoints} /> </div> </div> </main> );
    }
  };

  return (
    <>
      {/* Main application container. Blur is applied here. */}
      <div className={`text-white min-h-screen flex flex-col font-sans bg-slate-800 transition-all duration-300 ${commandError || connectionStatus === 'ERROR' ? 'blur-sm pointer-events-none' : ''}`}>
        <Header 
          viewMode={viewMode} setViewMode={setViewMode} isFullScreen={isFullScreen}
          onToggleFullScreen={handleToggleFullScreen} hasMission={missionWaypoints.length > 0}
          connectionStatus={connectionStatus} onToggleConnection={handleToggleConnection}
        />
        {renderMainContent()}
      </div>

      {/* Modals are rendered outside the main container, so they are not affected by the blur. */}
      {connectionStatus === 'ERROR' && (
        <ConnectionError 
          onRetry={connect} 
          onClose={disconnect} 
          failedIp={"Jetson"} 
        />
      )}
      <CommandErrorModal 
        isOpen={!!commandError}
        onClose={() => setCommandError(null)}
        errorInfo={commandError}
      />
    </>
  );
};

export default App;

