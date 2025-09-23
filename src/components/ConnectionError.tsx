
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { LoadingIcon } from './icons/LoadingIcon';
import { ErrorIcon } from './icons/ErrorIcon';

const JETSON_IP = "192.168.1.243";

type ConnectionErrorProps = {
  onRetry: () => void;
  onClose: () => void;
};

const ConnectionError: React.FC<ConnectionErrorProps> = ({ onRetry, onClose }) => {
  const [suggestions, setSuggestions] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSuggestions = async () => {
      setIsLoading(true);
      setError('');
      try {
        if (!process.env.API_KEY) {
          const predefinedError = `AI suggestions could not be loaded: API_KEY is not configured.\n\nHere are some manual checks:\n1. Ensure you are connected to the same Wi-Fi network as the Jetson.\n2. Verify the Jetson's IP address is indeed ${JETSON_IP}.\n3. Check that the backend server script is running on the Jetson.\n4. Check for any firewalls blocking port 5000.`;
          setSuggestions(predefinedError);
          setIsLoading(false);
          return;
        }
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `I am trying to connect a web-based rover control dashboard to its backend server running on a Jetson device at IP address ${JETSON_IP}. The connection is failing. Please provide a concise, step-by-step troubleshooting guide for a user to resolve this issue. Structure the response as a numbered list. Focus on common problems like:
1.  Network Connectivity (Wi-Fi, Ethernet, IP address correctness).
2.  Backend Server Status (checking if the server script is running on the Jetson).
3.  Firewall Issues (on the Jetson or network).
4.  Cabling and Hardware.
Please format the output as plain text with markdown for lists. Keep it clear and easy for a non-expert to follow. Start directly with the troubleshooting steps.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        setSuggestions(response.text);
      } catch (err) {
        console.error("Error fetching AI suggestions:", err);
        setError("Could not fetch troubleshooting suggestions. Please check your network and browser console for more details.");
        setSuggestions('');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, []);
  
  const formattedSuggestions = suggestions.replace(/(\d+\.)/g, '<br/>$1').replace(/\n/g, '<br/>');


  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm" role="alertdialog" aria-modal="true" aria-labelledby="error-title">
      <div className="bg-[#1F2937] text-white rounded-lg shadow-xl w-full max-w-2xl p-6 flex flex-col gap-4 m-4">
        <div className="flex items-center gap-3">
          <ErrorIcon className="w-8 h-8 text-red-500 flex-shrink-0" />
          <h2 id="error-title" className="text-xl font-bold text-red-400">Connection Failed</h2>
        </div>
        <p className="text-gray-300">
          Could not establish a connection to the rover backend at <code className="bg-gray-800 px-2 py-1 rounded-md font-mono">{JETSON_IP}</code>.
        </p>
        <div className="bg-[#111827] p-4 rounded-lg flex-1 overflow-y-auto max-h-[50vh]">
          <h3 className="font-semibold text-orange-400 mb-2">AI-Powered Troubleshooting</h3>
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
              <LoadingIcon className="w-8 h-8 mb-2" />
              <p>Generating troubleshooting steps...</p>
            </div>
          )}
          {error && <p className="text-red-400">{error}</p>}
          {suggestions && (
            <div className="text-gray-300 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: formattedSuggestions }} />
          )}
        </div>
        <div className="flex justify-end gap-4 mt-4">
          <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">
            Close
          </button>
          <button onClick={onRetry} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">
            Retry
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConnectionError;
