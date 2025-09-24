// src/components/ConnectionError.ts

import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { LoadingIcon } from './icons/LoadingIcon';
import { ErrorIcon } from './icons/ErrorIcon';

// ❌ REMOVED THIS HARDCODED CONSTANT
// const JETSON_IP = "192.168.1.243";

// ✅ UPDATED PROPS: Add failedIp
type ConnectionErrorProps = {
  onRetry: () => void;
  onClose: () => void;
  failedIp: string; // The IP address we failed to connect to
};

// ✅ UPDATED COMPONENT: Destructure the new prop
const ConnectionError: React.FC<ConnectionErrorProps> = ({ onRetry, onClose, failedIp }) => {
  const [suggestions, setSuggestions] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSuggestions = async () => {
      setIsLoading(true);
      setError('');
      try {
        if (!process.env.API_KEY) {
          // ✅ UPDATED DYNAMIC IP in the predefined error message
          const predefinedError = `AI suggestions could not be loaded: API_KEY is not configured.\n\nHere are some manual checks:\n1. Ensure you are connected to the same Wi-Fi network as the Jetson.\n2. Verify the Jetson's IP address is indeed ${failedIp}.\n3. Check that the backend server script is running on the Jetson.\n4. Check for any firewalls blocking port 5000.`;
          setSuggestions(predefinedError);
          setIsLoading(false);
          return;
        }
        
        // This part remains the same, but now uses the dynamic IP
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `I am trying to connect a web-based rover control dashboard to its backend server running on a Jetson device at IP address ${failedIp}. The connection is failing...`; // (rest of the prompt)
        
        // ... (rest of the fetch logic is unchanged)

      } catch (err) {
        // ... (error handling is unchanged)
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
    // ✅ Add failedIp to the dependency array
  }, [failedIp]);
  
  const formattedSuggestions = suggestions.replace(/(\d+\.)/g, '<br/>$1').replace(/\n/g, '<br/>');

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm" role="alertdialog" aria-modal="true" aria-labelledby="error-title">
      <div className="bg-[#1F2937] text-white rounded-lg shadow-xl w-full max-w-2xl p-6 flex flex-col gap-4 m-4">
        {/* ... (header is unchanged) */}
        <p className="text-gray-300">
          Could not establish a connection to the rover backend at <code className="bg-gray-800 px-2 py-1 rounded-md font-mono">{failedIp}</code>.
        </p>
        {/* ... (rest of the JSX is unchanged) */}
      </div>
    </div>
  );
};

export default ConnectionError;