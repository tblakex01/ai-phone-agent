
import React from 'react';
import { PhoneIcon } from './Icons';

interface WelcomeScreenProps {
  onStartCall: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStartCall }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 bg-gray-800">
      <h1 className="text-4xl font-bold text-center text-white mb-4">AI Phone Agent</h1>
      <p className="text-gray-400 text-center mb-12">
        Your personal AI assistant for reservations, appointments, and inquiries.
      </p>
      <button
        onClick={onStartCall}
        className="group flex items-center justify-center w-48 h-48 bg-green-500 rounded-full hover:bg-green-600 transition-all duration-300 shadow-lg transform hover:scale-105"
      >
        <PhoneIcon className="w-20 h-20 text-white transform group-hover:rotate-12 transition-transform" />
      </button>
      <p className="mt-8 text-gray-500">Tap to start</p>
    </div>
  );
};

export default WelcomeScreen;
