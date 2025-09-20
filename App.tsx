import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import LeftSidebar from './components/LeftSidebar';
import MapView from './components/MapView';
import PlanControls from './components/plan/PlanControls';
import QGCWaypointTable from './components/plan/QGCWaypointTable';
import SimulatorControls from './components/simulator/SimulatorControls';
import MissionLogs from './components/MissionLogs';
import { Waypoint } from './types';
import { toQGCWPL110 } from './utils/missionParser';
import { useSimulation } from './hooks/useSimulation';
import { useRoverConnection } from './hooks/useRoverConnection';
import { exportLogsToCSV } from './utils/logExporter';
import { calculateDistancesForMission } from './utils/geo';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<'dashboard' | 'planning' | 'simulator'>('dashboard');
  const [missionWaypoints, setMissionWaypoints] = useState<Waypoint[]>([]);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const uploadInitiatedRef = useRef(false);

  // Standalone simulator hook
  const {
    roverPosition: simRoverPosition,
    activeWaypointIndex: simActiveWaypointIndex,
    isRunning: simIsRunning,
    isArmed: simIsArmed,
    lastExecutedCommand: simLastExecutedCommand,
    speed: simSpeed,
    logEntries,
    play: simPlay,
    pause: simPause,
    reset: simReset,
    setSpeed: simSetSpeed
  } = useSimulation(missionWaypoints);

  // Hook for real rover connection
  const {
    connectionStatus,
    roverData,
    connect,
    disconnect,
    sendCommand,
  } = useRoverConnection();

  useEffect(() => {
    // Pause local simulation if user navigates away from the simulator tab
    if (viewMode !== 'simulator' && simIsRunning) {
      simPause();
    }
  }, [viewMode, simIsRunning, simPause]);


  useEffect(() => {
    const onFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullScreenChange);
  }, []);
  
  // Effect to automatically re-enter fullscreen after file dialog closes
  useEffect(() => {
    const handleFocus = () => {
      if (uploadInitiatedRef.current) {
        uploadInitiatedRef.current = false; // Reset flag
        document.documentElement.requestFullscreen().catch(err => {
          console.warn("Could not automatically re-enter fullscreen:", err.message);
        });
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handleToggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };
  
  const handleToggleConnection = () => {
    if (connectionStatus === 'DISCONNECTED' || connectionStatus === 'ERROR') {
        connect();
    } else {
        disconnect();
    }
  };

  const handleChangeMode = (mode: string) => {
    sendCommand({ command: 'SET_MODE', mode: mode });
  };
  
  const handleArmDisarm = () => {
    const shouldArm = roverData.status === 'disarmed';
    sendCommand({ command: 'ARM_DISARM', arm: shouldArm });
  }

  const handleMapClick = (lat: number, lng: number) => {
    console.log(`Map clicked at: ${lat}, ${lng}`);
  };
  
  const handleUploadInitiated = () => {
    if (document.fullscreenElement) {
      uploadInitiatedRef.current = true;
    }
  };

  const handleMissionUpload = (waypoints: Waypoint[]) => {
    const missionWithDistances = calculateDistancesForMission(waypoints);
    setMissionWaypoints(missionWithDistances);
  };
  
  const handleClearMission = () => {
    setMissionWaypoints([]);
  };

  const handleDeleteWaypoint = (id: number) => {
    setMissionWaypoints(prevWaypoints => {
        const newWaypoints = prevWaypoints.filter(wp => wp.id !== id);
        return calculateDistancesForMission(newWaypoints);
    });
  };

  const handleUpdateWaypoint = (id: number, newValues: Partial<Omit<Waypoint, 'id'>>) => {
    setMissionWaypoints(prevWaypoints => 
      prevWaypoints.map(wp => (wp.id === id ? { ...wp, ...newValues } : wp))
    );
  };
  
  const handleUpdateWaypointPosition = (waypointId: number, newPosition: { lat: number, lng: number }) => {
    setMissionWaypoints(prevWaypoints => {
      const updatedWaypoints = prevWaypoints.map(wp => 
        wp.id === waypointId 
          ? { ...wp, lat: newPosition.lat, lng: newPosition.lng } 
          : wp
      );
      return calculateDistancesForMission(updatedWaypoints);
    });
  };

  const handleNewMissionDrawn = (points: { lat: number, lng: number }[]) => {
    const newWaypoints: Waypoint[] = points.map((p, index) => ({
      id: index + 1,
      command: 'WAYPOINT',
      lat: p.lat,
      lng: p.lng,
      alt: 50,
      frame: 3,
    }));
    const newWaypointsWithDistances = calculateDistancesForMission(newWaypoints);
    setMissionWaypoints(newWaypointsWithDistances);
  };

  const handleExportMission = () => {
    if (missionWaypoints.length === 0) {
      alert("No mission to export.");
      return;
    }
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
    exportLogsToCSV(logEntries);
  };
  
  const isConnectedToRover = connectionStatus === 'CONNECTED_TO_ROVER';
  
  const displayRoverPosition = isConnectedToRover ? roverData.position : (viewMode === 'simulator' ? simRoverPosition : null);
  const displayActiveWaypointIndex = isConnectedToRover ? roverData.current_waypoint_id : (viewMode === 'simulator' ? simActiveWaypointIndex : null);
  const displayRoverHeading = isConnectedToRover ? roverData.heading : null;

  return (
    <div className="text-white min-h-screen flex flex-col font-sans">
      <Header 
        viewMode={viewMode} 
        setViewMode={setViewMode} 
        isFullScreen={isFullScreen}
        onToggleFullScreen={handleToggleFullScreen}
        hasMission={missionWaypoints.length > 0}
        connectionStatus={connectionStatus}
        onToggleConnection={handleToggleConnection}
      />
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
            <div className="flex-[0_0_180px] overflow-hidden">
              <QGCWaypointTable 
                waypoints={missionWaypoints} 
                onDelete={handleDeleteWaypoint} 
                onUpdate={handleUpdateWaypoint}
                activeWaypointIndex={displayActiveWaypointIndex}
              />
            </div>
          )}
           {viewMode === 'dashboard' && (
            <div className="flex-[0_0_180px] overflow-hidden">
                <MissionLogs />
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
            ) : ( // Simulator View
              <SimulatorControls 
                isRunning={simIsRunning}
                isArmed={simIsArmed}
                lastExecutedCommand={simLastExecutedCommand}
                speed={simSpeed}
                onPlay={simPlay}
                onPause={simPause}
                onReset={simReset}
                onSetSpeed={simSetSpeed}
                isRoverConnected={isConnectedToRover}
                onExportLogs={handleExportLogs}
                hasLogs={logEntries.length > 0}
              />
            )}
          </aside>
        )}
      </main>
    </div>
  );
};

export default App;