import { useState, useRef, useCallback, useEffect } from 'react';
import { io, Socket } from "socket.io-client";

const JETSON_BACKEND_URL = import.meta.env.VITE_JETSON_BACKEND_URL;

// Define types for clarity
export type ConnectionStatus = 'DISCONNECTED' | 'CONNECTING' | 'WAITING_FOR_ROVER' | 'CONNECTED_TO_ROVER' | 'ERROR';
export type CommandResponse = { status: 'success' | 'error', message: string };

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

// FIX: Replaced placeholder with the full initial data object to satisfy the RoverData interface.
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

        // FIX: Replaced placeholder with full connection options.
        const socket = io(JETSON_BACKEND_URL, {
            transports: ['websocket'],
            reconnectionAttempts: 3,
            timeout: 5000,
        });
        socketRef.current = socket;

        // FIX: Replaced placeholders with full event handler logic.
        socket.on('connect', () => {
            console.log('Successfully connected to backend server.');
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

        socket.on('connection_status', (data: { status: ConnectionStatus, message?: string}) => {
            console.log("Backend connection status:", data.status);
            setConnectionStatus(data.status);
            if(data.status === 'ERROR') console.error("Backend Error:", data.message);
        });
        
        socket.on('rover_data', (data: RoverData) => {
            setRoverData(data);
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
    
    // NEW FUNCTION: Allow components to subscribe to command responses
    const addCommandResponseListener = useCallback((callback: (response: CommandResponse) => void) => {
        const socket = socketRef.current;
        if (socket) {
            socket.on('command_response', callback);
            // Return a cleanup function to remove the listener
            return () => socket.off('command_response', callback);
        }
        // Return a dummy function if socket is not available
        return () => {};
    }, []);


    useEffect(() => {
        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, []);
    
    return { 
        connectionStatus, 
        roverData, 
        connect, 
        disconnect, 
        sendCommand,
        addCommandResponseListener // Expose the new function
    };
};

