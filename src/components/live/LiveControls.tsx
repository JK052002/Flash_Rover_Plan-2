
import React from 'react';
import { PlayIcon } from '../icons/PlayIcon';
import { PauseIcon } from '../icons/PauseIcon';

type LiveControlsProps = {
    isConnected: boolean;
}

const LiveControls: React.FC<LiveControlsProps> = ({ isConnected }) => {
    const disabledClass = !isConnected ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-80';
    const commonClass = 'w-full flex-1 text-white font-bold text-xl rounded-lg flex items-center justify-center gap-3 transition-colors';

    return (
        <div className="h-full flex flex-col gap-4 relative">
            {!isConnected && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-lg flex items-center justify-center z-10 p-4">
                    <p className="text-center font-semibold text-yellow-300">Connect to Rover to enable mission controls.</p>
                </div>
            )}
            <button
                disabled={!isConnected}
                className={`${commonClass} bg-orange-500 ${disabledClass}`}
                title={!isConnected ? "Connect to rover to use controls" : "Skip to next waypoint"}
            >
                <PlayIcon className="w-6 h-6 rotate-90" /> SKIP
            </button>
            <button
                disabled={!isConnected}
                className={`${commonClass} bg-blue-600 ${disabledClass}`}
                title={!isConnected ? "Connect to rover to use controls" : "Go back to previous waypoint"}
            >
                <span className="transform -scale-x-100 inline-block">
                    <PlayIcon className="w-6 h-6 -rotate-90" />
                </span>
                 GO BACK
            </button>
            <button
                disabled={!isConnected}
                className={`${commonClass} bg-blue-600 ${disabledClass}`}
                title={!isConnected ? "Connect to rover to use controls" : "Pause mission"}
            >
                <PauseIcon className="w-6 h-6" /> PAUSE
            </button>
            <button
                disabled={!isConnected}
                className={`${commonClass} bg-red-600 ${disabledClass}`}
                title={!isConnected ? "Connect to rover to use controls" : "Stop mission"}
            >
                <div className="w-5 h-5 bg-white" /> STOP
            </button>
        </div>
    );
};

export default LiveControls;
