import React, { useState } from 'react';
import { PhoneIcon, SettingsIcon } from './Icons';
import { PERSONA_PRESETS, VOICE_NAMES, MAX_INPUT_LENGTHS } from '../constants';
import { PersonaConfig, VoiceName } from '../types';

interface WelcomeScreenProps {
  onStartCall: (config: PersonaConfig) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStartCall }) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(PERSONA_PRESETS[0].id);
  
  // State for config fields
  const [customConfig, setCustomConfig] = useState<PersonaConfig>(PERSONA_PRESETS[0]);

  const handlePresetChange = (presetId: string) => {
    setSelectedPresetId(presetId);
    if (presetId === 'custom') return;
    
    const preset = PERSONA_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setCustomConfig(preset);
    }
  };

  const handleConfigChange = (field: keyof PersonaConfig, value: string) => {
    // Enforce max length limits
    if (field === 'name' && value.length > MAX_INPUT_LENGTHS.name) return;
    if (field === 'systemInstruction' && value.length > MAX_INPUT_LENGTHS.systemInstruction) return;
    if (field === 'greeting' && value.length > MAX_INPUT_LENGTHS.greeting) return;

    setCustomConfig(prev => ({
      ...prev,
      [field]: value
    }));
    setSelectedPresetId('custom');
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 text-white overflow-y-auto">
      <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[500px]">
        <h1 className="text-3xl font-bold text-center mb-2">AI Phone Agent</h1>
        <p className="text-gray-400 text-center mb-8 text-sm max-w-xs">
          Your intelligent voice assistant for calls, reservations, and inquiries.
        </p>

        {/* Persona Display/Config Toggle */}
        <div className="w-full max-w-xs mb-8">
             <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600 transition-all duration-300">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-300">Current Persona</span>
                    <button 
                        onClick={() => setIsConfigOpen(!isConfigOpen)}
                        className="text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300"
                    >
                        <SettingsIcon className="w-4 h-4" />
                        {isConfigOpen ? 'Hide' : 'Configure'}
                    </button>
                </div>
                {!isConfigOpen && (
                    <div className="text-center animate-fadeIn">
                        <p className="font-semibold text-lg">{customConfig.name}</p>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{customConfig.description || 'Custom Persona'}</p>
                    </div>
                )}

                {isConfigOpen && (
                    <div className="space-y-4 mt-4 animate-fadeIn">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Preset Template</label>
                            <select 
                                value={selectedPresetId}
                                onChange={(e) => handlePresetChange(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                {PERSONA_PRESETS.map(preset => (
                                    <option key={preset.id} value={preset.id}>{preset.name}</option>
                                ))}
                                <option value="custom">Custom</option>
                            </select>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-xs text-gray-400">Name</label>
                                <span className="text-[10px] text-gray-500">{customConfig.name.length}/{MAX_INPUT_LENGTHS.name}</span>
                            </div>
                            <input
                                type="text"
                                value={customConfig.name}
                                maxLength={MAX_INPUT_LENGTHS.name}
                                onChange={(e) => handleConfigChange('name', e.target.value)}
                                className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Voice</label>
                            <select 
                                value={customConfig.voice}
                                onChange={(e) => handleConfigChange('voice', e.target.value as VoiceName)}
                                className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                {VOICE_NAMES.map(voice => (
                                    <option key={voice} value={voice}>{voice}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-xs text-gray-400">System Instructions</label>
                                <span className="text-[10px] text-gray-500">{customConfig.systemInstruction.length}/{MAX_INPUT_LENGTHS.systemInstruction}</span>
                            </div>
                            <textarea 
                                value={customConfig.systemInstruction}
                                maxLength={MAX_INPUT_LENGTHS.systemInstruction}
                                onChange={(e) => handleConfigChange('systemInstruction', e.target.value)}
                                className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-xs text-white focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                                placeholder="Describe how the agent should behave..."
                            />
                        </div>

                         <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-xs text-gray-400">Greeting Message</label>
                                <span className="text-[10px] text-gray-500">{customConfig.greeting.length}/{MAX_INPUT_LENGTHS.greeting}</span>
                            </div>
                            <textarea 
                                value={customConfig.greeting}
                                maxLength={MAX_INPUT_LENGTHS.greeting}
                                onChange={(e) => handleConfigChange('greeting', e.target.value)}
                                className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-xs text-white focus:ring-2 focus:ring-blue-500 outline-none h-16 resize-none"
                                placeholder="What the agent says first..."
                            />
                        </div>
                    </div>
                )}
             </div>
        </div>

        <button
          onClick={() => onStartCall(customConfig)}
          className="group flex items-center justify-center w-32 h-32 bg-green-500 rounded-full hover:bg-green-600 transition-all duration-300 shadow-xl transform hover:scale-105 border-4 border-green-400/30"
        >
          <PhoneIcon className="w-12 h-12 text-white transform group-hover:rotate-12 transition-transform" />
        </button>
        <p className="mt-6 text-gray-500 text-sm">Tap to start call</p>
      </div>
    </div>
  );
};

export default WelcomeScreen;