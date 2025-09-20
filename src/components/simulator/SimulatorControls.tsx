import React from 'react';
import { PlayIcon } from '../icons/PlayIcon';
import { PauseIcon } from '../icons/PauseIcon';
import { ResetIcon } from '../icons/ResetIcon';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';
import { SimulationIcon } from '../icons/SimulationIcon';

type SimulatorControlsProps = {
    isRunning: boolean;
    isArmed: boolean;
    lastExecutedCommand: string | null;
    speed: number;
    onPlay: () => void;
    onPause: () => void;
    onReset: () => void;
    onSetSpeed: (speed: number) => void;
    isRoverConnected: boolean;
    onExportLogs: () => void;
    hasLogs: boolean;
}

const SimulatorControls: React.FC<SimulatorControlsProps> = ({ 
    isRunning, 
    isArmed, 
    lastExecutedCommand,
    speed, 
    onPlay, 
    onPause, 
    onReset, 
    onSetSpeed,
    isRoverConnected,
    onExportLogs,
    hasLogs
}) => {
  return (
    <div className="bg-[#111827] h-full rounded-md p-4 flex flex-col gap-4 text-sm text-gray-300">
        <div className="flex items-center gap-3">
            <SimulationIcon className="w-6 h-6 text-green-400" />
            <h2 className="text-lg font-bold text-white">Mission Simulator</h2>
        </div>

        {isRoverConnected ? (
            <div className="flex-1 flex items-center justify-center text-center bg-gray-800/50 rounded-lg p-4">
                <p className="text-yellow-400 font-semibold">
                    Live rover is connected. <br/> Simulator controls are disabled.
                </p>
            </div>
        ) : (
            <>
                <div className="flex items-center justify-around gap-4 py-4">
                    <button 
                        onClick={onReset}
                        className="p-3 rounded-full bg-gray-600 hover:bg-gray-700 transition-colors"
                        title="Reset Simulation"
                    >
                        <ResetIcon className="w-6 h-6" />
                    </button>

                    {isRunning ? (
                        <button 
                            onClick={onPause}
                            className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
                            title="Pause Simulation"
                        >
                            <PauseIcon className="w-8 h-8" />
                        </button>
                    ) : (
                        <button 
                            onClick={onPlay}
                            className="p-4 rounded-full bg-green-600 hover:bg-green-700 transition-colors"
                            title="Play Simulation"
                        >
                            <PlayIcon className="w-8 h-8" />
                        </button>
                    )}
                </div>

                <div>
                    <label htmlFor="speed-select" className="block text-sm font-medium text-gray-300 mb-1">
                        Simulation Speed
                    </label>
                    <div className="relative">
                        <select 
                            id="speed-select" 
                            value={speed}
                            onChange={(e) => onSetSpeed(Number(e.target.value))}
                            className="w-full bg-[#1F2937] border border-gray-600 rounded-md pl-3 pr-8 py-2 appearance-none focus:outline-none focus:ring-1 focus:ring-green-500"
                        >
                            <option value={1}>1x (Normal)</option>
                            <option value={2}>2x</option>
                            <option value={5}>5x</option>
                        </select>
                        <ChevronDownIcon className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                </div>
                
                <div className="pt-2">
                    <button 
                        onClick={onExportLogs}
                        disabled={!hasLogs}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed py-2 rounded-md font-semibold transition-colors"
                    >
                        Download Logs
                    </button>
                </div>


                <div className="mt-auto bg-[#1F2937] p-3 rounded-md border border-gray-700">
                    <h3 className="font-bold text-gray-200 mb-2">Simulation Status</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <span className="font-semibold text-gray-400">Status:</span>
                        <span className={`font-semibold ${isRunning ? 'text-green-400' : 'text-yellow-400'}`}>
                            {isRunning ? 'Simulating' : 'Idle'}
                        </span>
                        <span className="font-semibold text-gray-400">Arming:</span>
                        <span className={`font-semibold ${isArmed ? 'text-red-500' : 'text-gray-400'}`}>
                            {isArmed ? 'ARMED' : 'DISARMED'}
                        </span>
                        <span className="font-semibold text-gray-400">Speed:</span>
                        <span>{speed}x</span>
                        <span className="font-semibold text-gray-400 col-span-2 mt-1">Last Command:</span>
                        <span className="col-span-2 font-mono text-cyan-400 truncate">{lastExecutedCommand || 'N/A'}</span>
                    </div>
                </div>
            </>
        )}
    </div>
  );
};

export default SimulatorControls;