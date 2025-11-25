# CLAUDE.MD - AI Assistant Context

This file provides context for AI assistants working with this codebase.

## Project Overview

AI Phone Agent is a voice-based AI application that conducts interactive phone conversations using Google Gemini's audio streaming capabilities. It features real-time speech-to-speech interaction with customizable AI personas.

## Tech Stack

- **Frontend**: React 19 + TypeScript 5.8
- **Build Tool**: Vite 6
- **AI/ML**: Google Gemini SDK (`@google/genai`) for TTS and live audio streaming
- **Styling**: Tailwind CSS (CDN)
- **Audio**: Web Audio API for PCM audio processing

## Project Structure

```
├── components/          # React UI components
│   ├── CallScreen.tsx   # Main call interface and audio handling
│   ├── WelcomeScreen.tsx# Persona selection and configuration
│   ├── StatusIndicator.tsx
│   └── Icons.tsx
├── services/
│   └── geminiService.ts # Gemini API integration (TTS + live sessions)
├── utils/
│   └── audioUtils.ts    # Base64/PCM audio encoding utilities
├── App.tsx              # Root component, view state management
├── index.tsx            # React entry point
├── types.ts             # TypeScript interfaces and types
├── constants.ts         # Model names, voices, persona presets
└── vite.config.ts       # Vite configuration with env injection
```

## Key Files

- `services/geminiService.ts` - Core Gemini integration with `generateGreetingAudio()` and `connectToLiveSession()`
- `components/CallScreen.tsx` - Main call logic, audio pipelines, transcription
- `constants.ts` - Model names (`LIVE_MODEL_NAME`, `TTS_MODEL_NAME`), persona presets
- `types.ts` - `CallStatus`, `PersonaConfig`, `VoiceName`, `TranscriptionEntry`

## Commands

```bash
npm install     # Install dependencies
npm run dev     # Start dev server (localhost:3000)
npm run build   # Build for production
npm run preview # Preview production build
```

## Environment Variables

- `GEMINI_API_KEY` - Required. Set in `.env.local` file.

## Architecture Notes

### Audio Pipeline
- **Input**: 16kHz PCM captured via ScriptProcessorNode → Base64 encoded → sent to Gemini
- **Output**: Base64 from Gemini → decoded to Uint8Array → AudioBuffer → played at 24kHz

### Call Flow
1. User selects persona on WelcomeScreen
2. CallScreen generates greeting audio via TTS model
3. Live session established with Gemini for real-time conversation
4. Audio streamed bidirectionally with live transcription

### Models Used
- `gemini-2.5-flash-native-audio-preview-09-2025` - Live audio conversations
- `gemini-2.5-flash-preview-tts` - Text-to-speech for greetings

### Available Voices
Puck, Charon, Kore, Fenrir, Zephyr

## Code Conventions

- Functional React components with hooks
- TypeScript strict mode
- Path alias: `@/*` maps to project root
- State management via React useState/useRef (no external state library)

## Common Tasks

### Adding a New Persona Preset
Edit `constants.ts` and add to `PERSONA_PRESETS` array with: id, name, description, systemInstruction, greeting, voice.

### Modifying AI Behavior
Update `systemInstruction` in persona config or `DEFAULT_SYSTEM_INSTRUCTION` in constants.

### Changing Audio Settings
Audio sample rates are in `CallScreen.tsx`: input at 16kHz, output at 24kHz.

## Testing

No test framework currently configured. Manual testing via browser.

## Known Considerations

- Requires microphone permissions in browser
- HTTPS required for microphone access in production
- WebRTC/Web Audio API browser compatibility
