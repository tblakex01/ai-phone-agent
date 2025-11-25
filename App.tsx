
import React, { useState } from 'react';
import WelcomeScreen from './components/WelcomeScreen';
import CallScreen from './components/CallScreen';
import { PersonaConfig } from './types';
import { PERSONA_PRESETS } from './constants';

type View = 'welcome' | 'call';

const App: React.FC = () => {
  const [view, setView] = useState<View>('welcome');
  const [personaConfig, setPersonaConfig] = useState<PersonaConfig>(PERSONA_PRESETS[0]);

  const startCall = (config: PersonaConfig) => {
    setPersonaConfig(config);
    setView('call');
  };

  const endCall = () => {
    setView('welcome');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md h-[90vh] max-h-[800px] bg-gray-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden border-4 border-gray-700">
        {view === 'welcome' && <WelcomeScreen onStartCall={startCall} />}
        {view === 'call' && <CallScreen onEndCall={endCall} config={personaConfig} />}
      </div>
    </div>
  );
};

export default App;
