
import { useState, useEffect, useRef, useCallback } from 'react';
import { Waypoint, LogEntry } from '../types';
import { calculateDistance, calculateBearing, calculateDestination } from '../utils/geo';

const BASE_SPEED_METERS_PER_SEC = 0.2; // Adjust this for a realistic rover speed

export const useSimulation = (waypoints: Waypoint[], onLogEntry: (entry: Omit<LogEntry, 'timestamp'>) => void, onComplete: () => void) => {
    const [isRunning, setIsRunning] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [activeWaypointIndex, setActiveWaypointIndex] = useState<number | null>(null);
    const [roverPosition, setRoverPosition] = useState<{ lat: number; lng: number } | null>(null);
    const [lastExecutedCommand, setLastExecutedCommand] = useState<string | null>(null);
    const [completedWaypointIds, setCompletedWaypointIds] = useState<number[]>([]);
    const [distanceToNext, setDistanceToNext] = useState(0);

    const isArmed = isRunning; // Rover is "armed" when the simulation is running

    const animationFrameRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number | null>(null);
    const currentSegmentIndexRef = useRef(0);
    const isRunningRef = useRef(isRunning); // Ref to avoid stale state in animation loop

    useEffect(() => {
        isRunningRef.current = isRunning;
    }, [isRunning]);

    const reset = useCallback(() => {
        setIsRunning(false);
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        if (waypoints.length > 0) {
            const startPos = { lat: waypoints[0].lat, lng: waypoints[0].lng };
            currentSegmentIndexRef.current = 0;
            setActiveWaypointIndex(waypoints[0].id);
            setRoverPosition(startPos);
            setLastExecutedCommand(null);
            setCompletedWaypointIds([]);
            if (startPos) onLogEntry({ event: 'Simulation Reset', ...startPos });
        } else {
            setActiveWaypointIndex(null);
            setRoverPosition(null);
            setLastExecutedCommand(null);
            setCompletedWaypointIds([]);
        }
    }, [waypoints, onLogEntry]);

    useEffect(() => {
        reset();
    }, [waypoints, reset]);
    
    useEffect(() => {
        if (waypoints.length === 0 && (roverPosition !== null || activeWaypointIndex !== null)) {
            reset();
        }
    }, [waypoints.length, roverPosition, activeWaypointIndex, reset]);

    const animate = useCallback((timestamp: number) => {
        if (!isRunningRef.current) return;

        if (!lastTimeRef.current) {
            lastTimeRef.current = timestamp;
            animationFrameRef.current = requestAnimationFrame(animate);
            return;
        }

        const deltaTime = (timestamp - lastTimeRef.current) / 1000;
        
        setRoverPosition(prevPos => {
            if (!prevPos || waypoints.length < 2 || currentSegmentIndexRef.current >= waypoints.length - 1) {
                setIsRunning(false); 
                if (waypoints.length > 0) {
                    const finalWp = waypoints[waypoints.length - 1];
                    const eventText = `Mission Complete: Reached Waypoint ${finalWp.id}`;
                    setLastExecutedCommand(eventText);
                    setCompletedWaypointIds(prev => [...prev, finalWp.id]);
                    onLogEntry({ event: eventText, lat: finalWp.lat, lng: finalWp.lng });
                    onComplete();
                }
                return prevPos;
            }

            const endWp = waypoints[currentSegmentIndexRef.current + 1];
            if (!endWp) {
                 setIsRunning(false);
                 return prevPos;
            }
            
            const currentDistanceToNext = calculateDistance(prevPos, endWp);
            setDistanceToNext(currentDistanceToNext);
            const distanceToTravel = deltaTime * BASE_SPEED_METERS_PER_SEC * speed;

            if (distanceToTravel >= currentDistanceToNext) {
                const eventText = `Reached Waypoint ${endWp.id}: ${endWp.command}`;
                setLastExecutedCommand(eventText);
                onLogEntry({ event: eventText, lat: endWp.lat, lng: endWp.lng });
                setCompletedWaypointIds(prev => [...prev, endWp.id]);

                currentSegmentIndexRef.current++;
                const nextWp = waypoints[currentSegmentIndexRef.current + 1];
                if (nextWp) {
                    setActiveWaypointIndex(nextWp.id);
                    return { lat: endWp.lat, lng: endWp.lng };
                } else {
                    setIsRunning(false);
                    const finalEventText = `Mission Complete: Reached Final Waypoint ${endWp.id}`;
                    setLastExecutedCommand(finalEventText);
                    onLogEntry({ event: finalEventText, lat: endWp.lat, lng: endWp.lng });
                    onComplete();
                    return { lat: endWp.lat, lng: endWp.lng };
                }
            } else {
                const bearing = calculateBearing(prevPos, endWp);
                return calculateDestination(prevPos, bearing, distanceToTravel);
            }
        });
        
        lastTimeRef.current = timestamp;
        animationFrameRef.current = requestAnimationFrame(animate);

    }, [waypoints, speed, onLogEntry, onComplete]);
    
    useEffect(() => {
        if(isRunning){
            lastTimeRef.current = null;
            animationFrameRef.current = requestAnimationFrame(animate);
        } else {
            if(animationFrameRef.current){
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
        }
        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        }
    }, [isRunning, animate]);

    const play = useCallback(() => {
        if (waypoints.length < 2 || isRunning) return;
        let startPos = roverPosition;
        if (!startPos || currentSegmentIndexRef.current >= waypoints.length - 1) {
             reset();
             startPos = waypoints.length > 0 ? { lat: waypoints[0].lat, lng: waypoints[0].lng } : null;
             setTimeout(() => {
                const eventText = `Mission Started: Heading to Waypoint ${waypoints[1]?.id || 'end'}`;
                setLastExecutedCommand(eventText);
                if (startPos) onLogEntry({ event: eventText, ...startPos });
                setIsRunning(true);
             }, 0);
             return;
        }
        const eventText = `Resuming: Heading to Waypoint ${waypoints[currentSegmentIndexRef.current + 1]?.id || 'end'}`;
        setLastExecutedCommand(eventText);
        if (startPos) onLogEntry({ event: eventText, ...startPos });
        setIsRunning(true);
    }, [waypoints, isRunning, roverPosition, reset, onLogEntry]);

    const pause = useCallback(() => {
        setIsRunning(false);
        if (roverPosition) onLogEntry({ event: 'Simulation Paused', ...roverPosition });
    }, [onLogEntry, roverPosition]);
    
    const skip = useCallback(() => {
        if (!isRunning || currentSegmentIndexRef.current >= waypoints.length - 2) return;
        
        const skippedWp = waypoints[currentSegmentIndexRef.current + 1];
        onLogEntry({ event: `Skipped Waypoint ${skippedWp.id}`, lat: skippedWp.lat, lng: skippedWp.lng });
        
        currentSegmentIndexRef.current++;

        const newCurrentWp = waypoints[currentSegmentIndexRef.current];
        const newTargetWp = waypoints[currentSegmentIndexRef.current + 1];

        setRoverPosition({ lat: newCurrentWp.lat, lng: newCurrentWp.lng });
        setActiveWaypointIndex(newTargetWp.id);
        
    }, [isRunning, waypoints, onLogEntry]);
    
    const goBack = useCallback(() => {
        if (!isRunning || currentSegmentIndexRef.current <= 0) return;

        const currentTargetWp = waypoints[currentSegmentIndexRef.current + 1];

        setCompletedWaypointIds(prev => prev.filter(id => id !== currentTargetWp.id && id !== waypoints[currentSegmentIndexRef.current].id));
        
        currentSegmentIndexRef.current--;

        const newCurrentWp = waypoints[currentSegmentIndexRef.current];
        const newTargetWp = waypoints[currentSegmentIndexRef.current + 1];
        
        setRoverPosition({ lat: newCurrentWp.lat, lng: newCurrentWp.lng });
        setActiveWaypointIndex(newTargetWp.id);
        onLogEntry({ event: `Going back to Waypoint ${newCurrentWp.id}`, lat: newCurrentWp.lat, lng: newCurrentWp.lng });

    }, [isRunning, waypoints, onLogEntry]);

    useEffect(() => {
        return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current) };
    }, []);
    
    // Mock values for the Live Rover Data
    const hrms = isRunning ? (0.001 + Math.random() * 0.008).toFixed(3) : '0.000';
    const vrms = isRunning ? (0.01 + Math.random() * 0.033).toFixed(3) : '0.000';

    return { roverPosition, activeWaypointIndex, isRunning, isArmed, lastExecutedCommand, speed, completedWaypointIds, distanceToNext, hrms, vrms, play, pause, reset, setSpeed, skip, goBack };
};
