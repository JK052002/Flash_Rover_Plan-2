
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
import { exportLogsToCSV } from './utils/logExporter';
import { calculateDistancesForMission } from './utils/geo';
import ConnectionError from './components/ConnectionError';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [missionWaypoints, setMissionWaypoints] = useState<Waypoint[]>([]);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const uploadInitiatedRef = useRef(false);
  const [currentMissionFileName, setCurrentMissionFileName] = useState<string | null>(null);

  const { 
    missionLogs, 
    getActiveLogEntries
  } = useMissionLogs();

  const {
    connectionStatus,
    roverData,
    connect,
    disconnect,
    sendCommand,
  } = useRoverConnection();

  useEffect(() => {
    const onFullScreenChange = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullScreenChange);
  }, []);
  
  useEffect(() => {
    const handleFocus = () => {
      if (uploadInitiatedRef.current) {
        uploadInitiatedRef.current = false;
        document.documentElement.requestFullscreen().catch(err => {
          console.warn("Could not automatically re-enter fullscreen:", err.message);
        });
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handleToggleFullScreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else if (document.exitFullscreen) document.exitFullscreen();
  };
  
  const handleToggleConnection = () => {
    if (connectionStatus === 'DISCONNECTED' || connectionStatus === 'ERROR') connect();
    else disconnect();
  };

  const handleChangeMode = (mode: string) => sendCommand({ command: 'SET_MODE', mode: mode });
  const handleArmDisarm = () => sendCommand({ command: 'ARM_DISARM', arm: roverData.status === 'disarmed' });
  const handleMapClick = (lat: number, lng: number) => console.log(`Map clicked at: ${lat}, ${lng}`);
  
  const handleUploadInitiated = () => {
    if (document.fullscreenElement) uploadInitiatedRef.current = true;
  };

  const handleMissionUpload = (waypoints: Waypoint[], fileName: string) => {
    const missionWithDistances = calculateDistancesForMission(waypoints);
    setMissionWaypoints(missionWithDistances);
    setCurrentMissionFileName(fileName);
  };
  
  const handleClearMission = () => {
    setMissionWaypoints([]);
    setCurrentMissionFileName(null);
  };

  const handleDeleteWaypoint = (id: number) => {
    setMissionWaypoints(prev => calculateDistancesForMission(prev.filter(wp => wp.id !== id)));
  };

  const handleUpdateWaypoint = (id: number, newValues: Partial<Omit<Waypoint, 'id'>>) => {
    setMissionWaypoints(prev => prev.map(wp => (wp.id === id ? { ...wp, ...newValues } : wp)));
  };
  
  const handleUpdateWaypointPosition = (waypointId: number, newPosition: { lat: number, lng: number }) => {
    setMissionWaypoints(prev => calculateDistancesForMission(prev.map(wp => 
      wp.id === waypointId ? { ...wp, ...newPosition } : wp
    )));
  };

  const handleNewMissionDrawn = (points: { lat: number, lng: number }[]) => {
    const newWaypoints: Waypoint[] = points.map((p, index) => ({
      id: index + 1, command: 'WAYPOINT', lat: p.lat, lng: p.lng, alt: 50, frame: 3,
    }));
    handleMissionUpload(newWaypoints, `Drawn Mission - ${new Date().toLocaleTimeString()}`);
  };

  const handleExportMission = () => {
    if (missionWaypoints.length === 0) return alert("No mission to export.");
    const fileContent = toQGCWPL110(missionWaypoints);
    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'mission.waypoints';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCloseErrorModal = () => {
    disconnect();
  };

  const isConnectedToRover = connectionStatus === 'CONNECTED_TO_ROVER';
  
  const displayRoverPosition = isConnectedToRover ? roverData.position : null;
  const displayActiveWaypointIndex = isConnectedToRover ? roverData.current_waypoint_id : null;
  const displayRoverHeading = isConnectedToRover ? roverData.heading : null;

  const liveRoverData: LiveRoverData = isConnectedToRover ? {
      ...roverData,
      activeWaypointIndex: roverData.current_waypoint_id,
      hrms: 'N/A', 
      vrms: 'N/A',
      imu_status: 'ALIGNED',
      completedWaypointIds: [], // This would need to come from the rover
      distanceToNext: 0, // This would need to be calculated
  } : {
      position: null,
      heading: 0,
      battery: 0,
      status: 'disarmed',
      mode: 'UNKNOWN',
      rtk_status: 'N/A',
      hrms: '0.000',
      vrms: '0.000',
      imu_status: 'UNALIGNED',
      activeWaypointIndex: null,
      completedWaypointIds: [],
      distanceToNext: 0,
  };

  return (
    <div className="text-white min-h-screen flex flex-col font-sans bg-slate-800">
      <Header 
        viewMode={viewMode} 
        setViewMode={setViewMode} 
        isFullScreen={isFullScreen}
        onToggleFullScreen={handleToggleFullScreen}
        hasMission={missionWaypoints.length > 0}
        connectionStatus={connectionStatus}
        onToggleConnection={handleToggleConnection}
      />
      {connectionStatus === 'ERROR' && <ConnectionError onRetry={connect} onClose={handleCloseErrorModal} />}
      
      {viewMode === 'live' ? (
        <LiveReportView 
          missionWaypoints={missionWaypoints}
          liveRoverData={liveRoverData}
          missionName={currentMissionFileName}
          isConnected={isConnectedToRover}
        />
      ) : (
        <main className="flex-1 flex p-4 gap-4 overflow-hidden">
          {viewMode === 'dashboard' && (
            <LeftSidebar 
              onMissionUpload={handleMissionUpload} 
              onUploadInitiated={handleUploadInitiated}
              onClearMission={handleClearMission}
              roverData={roverData}
              isConnected={isConnectedToRover}
              onChangeMode={handleChangeMode}
              onArmDisarm={handleArmDisarm}
              missionLogs={missionLogs}
            />
          )}
          
          <div className="flex-1 flex flex-col gap-4">
            <MapView 
              missionWaypoints={missionWaypoints} 
              onMapClick={handleMapClick}
              roverPosition={displayRoverPosition}
              activeWaypointIndex={displayActiveWaypointIndex}
              heading={displayRoverHeading}
              viewMode={viewMode}
              isFullScreen={isFullScreen}
              onNewMissionDrawn={handleNewMissionDrawn}
              isConnectedToRover={isConnectedToRover}
              onUpdateWaypointPosition={handleUpdateWaypointPosition}
            />
            
            {viewMode === 'dashboard' && (
              <div className="flex-[0_0_180px] overflow-hidden">
                  <MissionLogs logEntries={getActiveLogEntries()} waypoints={missionWaypoints} />
              </div>
            )}
            
            {viewMode !== 'dashboard' && (
              <div className="flex-[0_0_240px] overflow-hidden">
                <QGCWaypointTable 
                  waypoints={missionWaypoints} 
                  onDelete={handleDeleteWaypoint} 
                  onUpdate={handleUpdateWaypoint}
                  activeWaypointIndex={displayActiveWaypointIndex}
                />
              </div>
            )}
          </div>

          {viewMode === 'planning' && (
            <aside className="w-1/4 max-w-xs flex flex-col">
              <PlanControls 
                onUpload={handleMissionUpload} 
                onExport={handleExportMission} 
                onUploadInitiated={handleUploadInitiated}
              />
            </aside>
          )}
        </main>
      )}
    </div>
  );
};

export default App;
