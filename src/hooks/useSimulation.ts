import { useState, useEffect, useRef, useCallback } from 'react';
import { Waypoint } from '../types';
import { LogEntry } from '../utils/logExporter';
import { calculateDistance, calculateBearing, calculateDestination } from '../utils/geo';

const BASE_SPEED_METERS_PER_SEC = 0.2; // Adjust this for a realistic rover speed

export const useSimulation = (waypoints: Waypoint[]) => {
    const [isRunning, setIsRunning] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [activeWaypointIndex, setActiveWaypointIndex] = useState<number | null>(null);
    const [roverPosition, setRoverPosition] = useState<{ lat: number; lng: number } | null>(null);
    const [lastExecutedCommand, setLastExecutedCommand] = useState<string | null>(null);
    const [logEntries, setLogEntries] = useState<LogEntry[]>([]);

    const isArmed = isRunning; // Rover is "armed" when the simulation is running

    const animationFrameRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number | null>(null);
    const currentSegmentIndexRef = useRef(0);
    const isRunningRef = useRef(isRunning); // Ref to avoid stale state in animation loop
    
    const addLogEntry = useCallback((event: string, position: { lat: number, lng: number } | null) => {
        if (!position) return;
        const newEntry: LogEntry = {
            timestamp: new Date().toISOString(),
            lat: position.lat,
            lng: position.lng,
            event: event,
        };
        setLogEntries(prev => [...prev, newEntry]);
    }, []);

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
            setLogEntries([]); // Clear logs on reset
            addLogEntry('Simulation Reset', startPos);
        } else {
            setActiveWaypointIndex(null);
            setRoverPosition(null);
            setLastExecutedCommand(null);
            setLogEntries([]);
        }
    }, [waypoints, addLogEntry]);

    // Effect to reset simulation when waypoints change
    useEffect(() => {
        reset();
    }, [waypoints, reset]);
    
    // Effect to handle case where waypoints are cleared while component is mounted
    useEffect(() => {
        if (waypoints.length === 0 && (roverPosition !== null || activeWaypointIndex !== null)) {
            reset();
        }
    }, [waypoints.length, roverPosition, activeWaypointIndex, reset]);


    const animate = useCallback((timestamp: number) => {
        if (!isRunningRef.current) return; // Stop if paused

        if (!lastTimeRef.current) {
            lastTimeRef.current = timestamp;
            animationFrameRef.current = requestAnimationFrame(animate);
            return;
        }

        const deltaTime = (timestamp - lastTimeRef.current) / 1000; // in seconds
        
        setRoverPosition(prevPos => {
            // Safety checks
            if (!prevPos || waypoints.length < 2 || currentSegmentIndexRef.current >= waypoints.length - 1) {
                setIsRunning(false); 
                if (waypoints.length > 0) {
                    const finalWp = waypoints[waypoints.length - 1];
                    const eventText = `Mission Complete: Reached Waypoint ${finalWp.id}`;
                    setLastExecutedCommand(eventText);
                    addLogEntry(eventText, { lat: finalWp.lat, lng: finalWp.lng });
                }
                return prevPos;
            }

            const startWp = waypoints[currentSegmentIndexRef.current];
            const endWp = waypoints[currentSegmentIndexRef.current + 1];
            if (!startWp || !endWp) { // Extra safety
                 setIsRunning(false);
                 return prevPos;
            }

            const distanceToTravel = deltaTime * BASE_SPEED_METERS_PER_SEC * speed;
            const remainingDistanceToSegmentEnd = calculateDistance(prevPos, endWp);

            if (distanceToTravel >= remainingDistanceToSegmentEnd) {
                // Reached the end waypoint of the current segment
                const eventText = `Reached Waypoint ${endWp.id}: ${endWp.command}`;
                setLastExecutedCommand(eventText);
                addLogEntry(eventText, { lat: endWp.lat, lng: endWp.lng });
                console.log(`Executing command at Waypoint ${endWp.id}: ${endWp.command}`);

                currentSegmentIndexRef.current++;
                const nextWp = waypoints[currentSegmentIndexRef.current];
                if (nextWp) {
                    setActiveWaypointIndex(nextWp.id);
                    return { lat: endWp.lat, lng: endWp.lng };
                } else {
                    // Reached the final waypoint
                    setIsRunning(false);
                    return { lat: endWp.lat, lng: endWp.lng };
                }
            } else {
                const bearing = calculateBearing(prevPos, endWp);
                return calculateDestination(prevPos, bearing, distanceToTravel);
            }
        });
        
        lastTimeRef.current = timestamp;
        animationFrameRef.current = requestAnimationFrame(animate);

    }, [waypoints, speed, addLogEntry]);
    
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
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        }
    }, [isRunning, animate]);


    const play = useCallback(() => {
        if (waypoints.length < 2 || isRunning) return;
        
        let startPos = roverPosition;

        // If simulation ended, reset before playing again
        if (!startPos || currentSegmentIndexRef.current >= waypoints.length - 1) {
             reset();
             startPos = waypoints.length > 0 ? { lat: waypoints[0].lat, lng: waypoints[0].lng } : null;
             // Reset sets isRunning to false, so we need to set it to true in the next tick
             setTimeout(() => {
                const eventText = `Mission Started: Heading to Waypoint ${waypoints[1]?.id || 'end'}`;
                setLastExecutedCommand(eventText);
                if (startPos) addLogEntry(eventText, startPos);
                setIsRunning(true);
             }, 0);
             return;
        }
        
        const eventText = `Resuming: Heading to Waypoint ${waypoints[currentSegmentIndexRef.current + 1]?.id || 'end'}`;
        setLastExecutedCommand(eventText);
        addLogEntry(eventText, startPos);
        setIsRunning(true);
    }, [waypoints, isRunning, roverPosition, reset, addLogEntry]);

    const pause = useCallback(() => {
        setIsRunning(false);
        addLogEntry('Simulation Paused', roverPosition);
    }, [addLogEntry, roverPosition]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    return { roverPosition, activeWaypointIndex, isRunning, isArmed, lastExecutedCommand, speed, logEntries, play, pause, reset, setSpeed };
};