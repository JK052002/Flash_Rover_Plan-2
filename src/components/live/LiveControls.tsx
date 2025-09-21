
import React from 'react';
import { PlayIcon } from '../icons/PlayIcon';
import { PauseIcon } from '../icons/PauseIcon';

type LiveControlsProps = {
    onSkip: () => void;
    onGoBack: () => void;
    onPause: () => void;
    onStop: () => void;
}

const LiveControls: React.FC<LiveControlsProps> = ({ onSkip, onGoBack, onPause, onStop }) => {
  return (
    <div className="h-full flex flex-col gap-4">
        <button 
            onClick={onSkip}
            className="w-full flex-1 bg-orange-500 text-white font-bold text-xl rounded-lg flex items-center justify-center gap-3 hover:bg-orange-600 transition-colors"
        >
            <PlayIcon className="w-6 h-6 rotate-90" /> SKIP
        </button>
        <button 
            onClick={onGoBack}
            className="w-full flex-1 bg-blue-600 text-white font-bold text-xl rounded-lg flex items-center justify-center gap-3 hover:bg-blue-700 transition-colors"
        >
            <span className="transform -scale-x-100 inline-block">
                <PlayIcon className="w-6 h-6 -rotate-90" />
            </span>
             GO BACK
        </button>
        <button 
            onClick={onPause}
            className="w-full flex-1 bg-blue-600 text-white font-bold text-xl rounded-lg flex items-center justify-center gap-3 hover:bg-blue-700 transition-colors"
        >
            <PauseIcon className="w-6 h-6" /> PAUSE
        </button>
        <button 
            onClick={onStop}
            className="w-full flex-1 bg-red-600 text-white font-bold text-xl rounded-lg flex items-center justify-center gap-2 hover:bg-red-700 transition-colors"
        >
            <div className="w-5 h-5 bg-white" /> STOP
        </button>
    </div>
  );
};

export default LiveControls;
