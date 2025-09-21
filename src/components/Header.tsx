
import React from 'react';
import { WrenchIcon } from './icons/WrenchIcon';
import { FullScreenToggleIcon } from './icons/FullScreenToggleIcon';
import { ConnectionStatus } from '../hooks/useRoverConnection';
import { ViewMode } from '../types';

type HeaderProps = {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
  hasMission: boolean;
  connectionStatus: ConnectionStatus;
  onToggleConnection: () => void;
};

const Header: React.FC<HeaderProps> = ({ 
  viewMode, 
  setViewMode, 
  isFullScreen, 
  onToggleFullScreen, 
  hasMission,
  connectionStatus,
  onToggleConnection 
}) => {
  const getButtonClass = (mode: ViewMode) => {
    const baseClass = "px-4 py-2 text-sm font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed";
    if (viewMode === mode) {
      return `${baseClass} bg-green-500`;
    }
    return `${baseClass} text-gray-300 hover:bg-gray-700`;
  };

  const getConnectionButtonState = () => {
    switch (connectionStatus) {
      case 'CONNECTED_TO_ROVER':
        return { text: 'DISCONNECT', className: 'bg-red-500 hover:bg-red-600', disabled: false };
      case 'CONNECTING':
      case 'WAITING_FOR_ROVER':
        return { text: 'WAITING...', className: 'bg-yellow-500 cursor-not-allowed', disabled: true };
      case 'ERROR':
        return { text: 'CONNECT', className: 'bg-gray-600 hover:bg-gray-700', disabled: false };
      case 'DISCONNECTED':
      default:
        return { text: 'CONNECT', className: 'bg-green-500 hover:bg-green-600', disabled: false };
    }
  };

  const { text: connButtonText, className: connButtonClassName, disabled: connButtonDisabled } = getConnectionButtonState();

  return (
    <header className="bg-[#111827] flex items-center justify-between p-3 shadow-lg">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="bg-orange-500 p-2 rounded-md">
            <WrenchIcon className="w-6 h-6 text-gray-900" />
          </div>
          <h1 className="text-xl font-bold text-orange-400">LAND ROVER</h1>
        </div>
        <nav className="flex items-center bg-[#1F2937] rounded-lg">
          <button onClick={() => setViewMode('dashboard')} className={getButtonClass('dashboard')}>DashBoard</button>
          <button onClick={() => setViewMode('planning')} className={getButtonClass('planning')}>Edit Plan</button>
          <button onClick={() => setViewMode('simulator')} className={getButtonClass('simulator')} disabled={!hasMission}>Simulator</button>
          <button onClick={() => setViewMode('live')} className={getButtonClass('live')} disabled={!hasMission}>Live Report</button>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <button 
          onClick={onToggleConnection}
          disabled={connButtonDisabled}
          className={`font-bold px-6 py-2 rounded-lg transition-colors ${connButtonClassName}`}
        >
          {connButtonText}
        </button>
        <button 
          onClick={onToggleFullScreen} 
          className="p-2 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
          aria-label={isFullScreen ? "Exit full screen" : "Enter full screen"}
          title={isFullScreen ? "Exit full screen" : "Enter full screen"}
        >
          <FullScreenToggleIcon isFullScreen={isFullScreen} className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default Header;
