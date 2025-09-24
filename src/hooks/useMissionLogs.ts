
import { useState, useRef, useCallback } from 'react';
import { MissionLog, LogEntry } from '../types';

export const useMissionLogs = () => {
  const [missionLogs, setMissionLogs] = useState<MissionLog[]>([]);
  const activeLogIdRef = useRef<string | null>(null);

  const createNewLog = useCallback((name: string) => {
    // If a previous log was in progress, mark it as incomplete.
    if (activeLogIdRef.current) {
       setMissionLogs(prev => prev.map(log => 
        log.id === activeLogIdRef.current && log.status === 'In Progress'
          ? { ...log, status: 'Incomplete' } 
          : log
      ));
    }

    const newLog: MissionLog = {
      id: `log-${Date.now()}`,
      name: name || 'Unnamed Mission',
      status: 'In Progress',
      timestamp: new Date(),
      entries: [],
    };
    setMissionLogs(prev => [newLog, ...prev]);
    activeLogIdRef.current = newLog.id;
  }, []);

  const addLogEntry = useCallback((entry: Omit<LogEntry, 'timestamp'>) => {
    if (!activeLogIdRef.current) return;
    
    const newLogEntry: LogEntry = {
        ...entry,
        timestamp: new Date().toISOString(),
    };

    setMissionLogs(prevLogs => prevLogs.map(log => 
      log.id === activeLogIdRef.current 
        ? { ...log, entries: [...log.entries, newLogEntry] }
        : log
    ));
  }, []);

  const updateActiveLogStatus = useCallback((status: 'Completed' | 'Incomplete') => {
    if (activeLogIdRef.current) {
        setMissionLogs(prev => prev.map(log => 
            log.id === activeLogIdRef.current && log.status === 'In Progress'
            ? { ...log, status } 
            : log
        ));
        activeLogIdRef.current = null;
    }
  }, []);

  const getActiveLogEntries = useCallback((): LogEntry[] => {
    const activeLog = missionLogs.find(log => log.id === activeLogIdRef.current);
    return activeLog?.entries ?? [];
  }, [missionLogs]);

  return { 
    missionLogs, 
    createNewLog, 
    addLogEntry, 
    updateActiveLogStatus,
    getActiveLogEntries
  };
};
