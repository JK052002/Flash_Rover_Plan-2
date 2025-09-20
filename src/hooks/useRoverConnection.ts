import { useState, useRef, useCallback, useEffect } from 'react';
import { io, Socket } from "socket.io-client";

// IMPORTANT: Change this to your Jetson's IP address.
const JETSON_BACKEND_URL = "http://192.168.1.105:5000";

export type ConnectionStatus = 'DISCONNECTED' | 'CONNECTING' | 'WAITING_FOR_ROVER' | 'CONNECTED_TO_ROVER' | 'ERROR';

export interface RoverData {
    position: { lat: number; lng: number } | null;
    heading: number;
    battery: number;
    status: 'armed' | 'disarmed';
    mode: string;
    rtk_status: string;
    signal_strength: string;
    current_waypoint_id: number | null;
}

const initialRoverData: RoverData = {
    position: null,
    heading: 0,
    battery: -1,
    status: 'disarmed',
    mode: 'UNKNOWN',
    rtk_status: 'N/A',
    signal_strength: 'N/A',
    current_waypoint_id: null,
};

export const useRoverConnection = () => {
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('DISCONNECTED');
    const [roverData, setRoverData] = useState<RoverData>(initialRoverData);
    
    const socketRef = useRef<Socket | null>(null);

    const connect = useCallback(() => {
        if (socketRef.current?.connected) return;
        setConnectionStatus('CONNECTING');
        console.log(`Attempting to connect to backend at ${JETSON_BACKEND_URL}...`);
        
        if (socketRef.current) socketRef.current.disconnect();

        const socket = io(JETSON_BACKEND_URL, {
            transports: ['websocket'],
            reconnectionAttempts: 3,
            timeout: 5000,
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Successfully connected to backend server.');
            // Now we wait for the backend to confirm connection to the rover
            setConnectionStatus('WAITING_FOR_ROVER');
        });
        
        socket.on('disconnect', () => {
            console.warn('Disconnected from backend server.');
            setConnectionStatus('DISCONNECTED');
            setRoverData(initialRoverData);
        });

        socket.on('connect_error', (err) => {
            console.error('Connection Error:', err.message);
            setConnectionStatus('ERROR');
            socket.disconnect();
        });

        socket.on('connection_status', (data: { status: 'CONNECTED_TO_ROVER' | 'WAITING_FOR_ROVER' | 'ERROR', message?: string}) => {
            console.log("Backend connection status:", data.status);
            setConnectionStatus(data.status);
            if(data.status === 'ERROR') console.error("Backend Error:", data.message);
        });

        socket.on('rover_data', (data: RoverData) => {
            setRoverData(data);
        });
        
        socket.on('command_response', (data: { status: 'success' | 'error', message: string }) => {
            console.log(`Command Response (${data.status}): ${data.message}`);
            // Here you could add UI feedback, like a toast notification
        });

    }, []);

    const disconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
            setConnectionStatus('DISCONNECTED');
            setRoverData(initialRoverData);
            console.log("User disconnected.");
        }
    }, []);

    const sendCommand = useCallback((command: object) => {
        if (socketRef.current?.connected && connectionStatus === 'CONNECTED_TO_ROVER') {
            socketRef.current.emit('send_command', command);
        } else {
            console.warn("Cannot send command: Not connected to rover.", {status: connectionStatus});
        }
    }, [connectionStatus]);

    useEffect(() => {
        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, []);
    
    return { connectionStatus, roverData, connect, disconnect, sendCommand };
};