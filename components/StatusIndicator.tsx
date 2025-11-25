
import React from 'react';
import { CallStatus } from '../types';
import { MicIcon } from './Icons';

interface StatusIndicatorProps {
  status: CallStatus;
}

const getStatusInfo = (status: CallStatus): { text: string; color: string; pulse: boolean } => {
  switch (status) {
    case CallStatus.IDLE:
      return { text: 'Initializing', color: 'text-gray-400', pulse: false };
    case CallStatus.GREETING:
        return { text: 'Starting Call...', color: 'text-yellow-400', pulse: false };
    case CallStatus.CONNECTING:
      return { text: 'Connecting...', color: 'text-yellow-400', pulse: true };
    case CallStatus.LISTENING:
      return { text: 'Listening...', color: 'text-green-400', pulse: true };
    case CallStatus.AGENT_SPEAKING:
      return { text: 'Agent Speaking', color: 'text-blue-400', pulse: false };
    case CallStatus.THINKING:
        return { text: 'Thinking...', color: 'text-purple-400', pulse: true };
    case CallStatus.ERROR:
      return { text: 'Connection Error', color: 'text-red-400', pulse: false };
    case CallStatus.ENDED:
      return { text: 'Call Ended', color: 'text-gray-500', pulse: false };
    default:
      return { text: 'Unknown Status', color: 'text-gray-400', pulse: false };
  }
};

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status }) => {
  const { text, color, pulse } = getStatusInfo(status);

  return (
    <div className={`mt-2 flex items-center justify-center space-x-2 ${color}`}>
        {pulse && <MicIcon className="w-5 h-5 animate-pulse" />}
        <span className="text-sm font-medium">{text}</span>
    </div>
  );
};

export default StatusIndicator;
