
import React from 'react';
import { MissionLog } from '../types';

type LogPreviewModalProps = {
  log: MissionLog | null;
  onClose: () => void;
};

export const LogPreviewModal: React.FC<LogPreviewModalProps> = ({ log, onClose }) => {
  if (!log) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" 
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-[#1F2937] text-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col p-6"
        onClick={e => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className="text-xl font-bold">Log Preview: {log.name}</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white text-2xl"
            aria-label="Close log preview"
          >
            &times;
          </button>
        </div>
        <div className="overflow-y-auto bg-[#111827] p-4 rounded-md flex-1 font-mono text-sm">
          <pre className="whitespace-pre-wrap break-words">
            {log.entries.length > 0 
              ? log.entries.map(entry => `[${entry.timestamp}] ${entry.event} @ (Lat: ${entry.lat.toFixed(6)}, Lng: ${entry.lng.toFixed(6)})`).join('\n')
              : 'No log entries for this mission.'}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default LogPreviewModal;
