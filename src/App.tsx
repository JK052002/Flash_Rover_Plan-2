
import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import LeftSidebar from './components/LeftSidebar';
import MapView from './components/MapView';
import PlanControls from './components/plan/PlanControls';
import QGCWaypointTable from './components/plan/QGCWaypointTable';
import SimulatorControls from './components/simulator/SimulatorControls';
import LiveReportView from './components/live/LiveReportView';
import { Waypoint, ViewMode, LiveRoverData } from './types';
import { toQGCWPL110 } from './utils/missionParser';
import { useSimulation } from './hooks/useSimulation';
import { useRoverConnection } from './hooks/useRoverConnection';
import { useMissionLogs } from './hooks/useMissionLogs';
import { exportLogsToCSV } from './utils/logExporter';
import { calculateDistancesForMission } from './utils/geo';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [missionWaypoints, setMissionWaypoints] = useState<Waypoint[]>([]);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const uploadInitiatedRef = useRef(false);
  const [currentMissionFileName, setCurrentMissionFileName] = useState<string | null>(null);

  const { 
    missionLogs, 
    createNewLog, 
    addLogEntry, 
    updateActiveLogStatus,
    getActiveLogEntries
  } = useMissionLogs();

  const {
    roverPosition: simRoverPosition,
    activeWaypointIndex: simActiveWaypointIndex,
    isRunning: simIsRunning,
    isArmed: simIsArmed,
    lastExecutedCommand: simLastExecutedCommand,
    speed: simSpeed,
    completedWaypointIds: simCompletedIds,
    distanceToNext: simDistanceToNext,
    hrms: simHrms,
    vrms: simVrms,
    play: simPlay,
    pause: simPause,
    reset: simReset,
    setSpeed: simSetSpeed,
    skip: simSkip,
    goBack: simGoBack,
  } = useSimulation(
    missionWaypoints, 
    addLogEntry,
    () => updateActiveLogStatus('Completed')
  );

  const {
    connectionStatus,
    roverData,
    connect,
    disconnect,
    sendCommand,
  } = useRoverConnection();

  useEffect(() => {
    if (viewMode !== 'simulator' && viewMode !== 'live' && simIsRunning) simPause();
  }, [viewMode, simIsRunning, simPause]);

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
    if (simIsRunning) updateActiveLogStatus('Incomplete');
    const missionWithDistances = calculateDistancesForMission(waypoints);
    setMissionWaypoints(missionWithDistances);
    setCurrentMissionFileName(fileName);
  };
  
  const handleClearMission = () => {
    if (simIsRunning) updateActiveLogStatus('Incomplete');
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

  const handleExportLogs = () => {
    const entries = getActiveLogEntries();
    if (entries.length > 0) exportLogsToCSV(entries);
    else alert("No logs for the current simulation to export.");
  };
  
  const handleSimPlay = () => {
    if (missionWaypoints.length > 0) {
      createNewLog(currentMissionFileName || 'Unnamed Mission');
      simPlay();
    }
  };

  const handleSimReset = () => {
    updateActiveLogStatus('Incomplete');
    simReset();
  };

  const isConnectedToRover = connectionStatus === 'CONNECTED_TO_ROVER';
  
  const displayRoverPosition = isConnectedToRover ? roverData.position : simRoverPosition;
  const displayActiveWaypointIndex = isConnectedToRover ? roverData.current_waypoint_id : simActiveWaypointIndex;
  const displayRoverHeading = isConnectedToRover ? roverData.heading : null;

  // Construct a unified data object for the live view
  const liveRoverData: LiveRoverData = isConnectedToRover ? {
      ...roverData,
      activeWaypointIndex: roverData.current_waypoint_id,
      // Placeholder values for real rover
      hrms: 'N/A', 
      vrms: 'N/A',
      imu_status: 'ALIGNED',
      completedWaypointIds: [], // This would need to come from the rover
      distanceToNext: 0, // This would need to be calculated
  } : {
      position: simRoverPosition,
      heading: 0, // Sim doesn't have heading yet
      battery: 81, // Mock value
      status: simIsArmed ? 'armed' : 'disarmed',
      mode: 'AUTO', // Mock value
      rtk_status: 'RTK Fixed', // Mock value
      hrms: simHrms,
      vrms: simVrms,
      imu_status: 'ALIGNED', // Mock value
      activeWaypointIndex: simActiveWaypointIndex,
      completedWaypointIds: simCompletedIds,
      distanceToNext: simDistanceToNext,
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
      {viewMode === 'live' ? (
        <LiveReportView 
          missionWaypoints={missionWaypoints}
          liveRoverData={liveRoverData}
          missionName={currentMissionFileName}
          onPause={simPause}
          onStop={handleSimReset}
          onSkip={simSkip}
          onGoBack={simGoBack}
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

          {(viewMode === 'planning' || viewMode === 'simulator') && (
            <aside className="w-1/4 max-w-xs flex flex-col">
              {viewMode === 'planning' ? (
                <PlanControls 
                  onUpload={handleMissionUpload} 
                  onExport={handleExportMission} 
                  onUploadInitiated={handleUploadInitiated}
                />
              ) : (
                <SimulatorControls 
                  isRunning={simIsRunning}
                  isArmed={simIsArmed}
                  lastExecutedCommand={simLastExecutedCommand}
                  speed={simSpeed}
                  onPlay={handleSimPlay}
                  onPause={simPause}
                  onReset={handleSimReset}
                  onSetSpeed={simSetSpeed}
                  isRoverConnected={isConnectedToRover}
                  onExportLogs={handleExportLogs}
                  hasLogs={getActiveLogEntries().length > 0}
                />
              )}
            </aside>
          )}
        </main>
      )}
    </div>
  );
};

export default App;
