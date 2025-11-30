<div align="center">

<img width="1200" height="475" alt="AI Phone Agent Banner" src="https://github.com/user-attachments/assets/329f405f-581f-480f-afe2-2406463bb092" />

# 📞 AI Phone Agent

**Intelligent AI-powered voice assistant for automating phone calls**

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-API-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

[✨ Features](#-features) • [🚀 Quick Start](#-quick-start) • [🎭 Personas](#-personas) • [🏗️ Architecture](#️-architecture) • [📖 Documentation](#-documentation)

</div>

---

## 🌟 Overview

AI Phone Agent is a cutting-edge voice-based AI application that conducts **real-time phone conversations** using Google Gemini's advanced audio streaming capabilities. It features speech-to-speech interaction with customizable AI personas for various use cases like booking reservations, handling customer calls, and providing tech support.

<div align="center">

| 🎙️ Real-time Voice | 🤖 Multiple Personas | 📝 Live Transcription | 🔊 Natural Speech |
|:---:|:---:|:---:|:---:|
| Bidirectional audio streaming | 5 built-in presets + custom | See conversations in real-time | Multiple voice options |

</div>

---

## ✨ Features

- 🗣️ **Real-time Voice Conversations** - Bidirectional audio streaming with Google Gemini
- 🎭 **Customizable Personas** - Switch between different AI personalities or create your own
- 📝 **Live Transcription** - See both user and agent speech transcribed in real-time
- 🔊 **Multiple Voices** - Choose from 5 different voice options (Puck, Charon, Kore, Fenrir, Zephyr)
- ⚡ **Low Latency** - Optimized audio pipeline for natural conversation flow
- 🎨 **Modern UI** - Clean, phone-like interface built with React and Tailwind CSS
- 📱 **Responsive Design** - Works seamlessly across devices

---

## 🚀 Quick Start

### Prerequisites

- 📦 **Node.js** (v18 or higher recommended)
- 🔑 **Google Gemini API Key** - Get one at [Google AI Studio](https://aistudio.google.com/)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/ai-phone-agent.git
cd ai-phone-agent

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
```

### Configuration

Create a `.env.local` file in the root directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Running the App

```bash
# Start development server
npm run dev
```

🎉 Open [http://localhost:3000](http://localhost:3000) in your browser!

---

## 🎭 Personas

AI Phone Agent comes with **5 pre-configured personas** for common use cases:

| Persona | Description | Voice | Use Case |
|---------|-------------|-------|----------|
| 🧑‍💼 **Personal Assistant** | Helpful assistant for general tasks | Kore | General inquiries & tasks |
| 🍽️ **Restaurant Booker** | Makes dinner reservations | Zephyr | Outbound booking calls |
| 🏢 **Business Receptionist** | Answers calls for TechSolutions Inc | Puck | Inbound business calls |
| 🔧 **Tech Support** | Troubleshoots internet issues | Fenrir | Customer support |
| 📋 **Call Screener** | Screens incoming calls | Charon | Call filtering |

### Custom Personas

Create your own persona by configuring:
- **Name** - Display name for the persona
- **Voice** - Choose from available voices
- **System Instructions** - Define the AI's behavior and role
- **Greeting** - Initial message spoken when call starts

---

## 🛠️ Tech Stack

<div align="center">

| Category | Technology |
|----------|------------|
| ⚛️ **Frontend** | React 19 |
| 📘 **Language** | TypeScript 5.8 |
| ⚡ **Build Tool** | Vite 6 |
| 🤖 **AI/ML** | Google Gemini SDK |
| 🎨 **Styling** | Tailwind CSS |
| 🔊 **Audio** | Web Audio API |

</div>

---

## 🏗️ Architecture

```
ai-phone-agent/
├── 📁 components/           # React UI components
│   ├── CallScreen.tsx       # Main call interface & audio handling
│   ├── WelcomeScreen.tsx    # Persona selection screen
│   ├── StatusIndicator.tsx  # Call status display
│   └── Icons.tsx            # SVG icon components
├── 📁 services/
│   └── geminiService.ts     # Gemini API integration
├── 📁 utils/
│   └── audioUtils.ts        # Audio encoding utilities
├── 📄 App.tsx               # Root component
├── 📄 types.ts              # TypeScript definitions
├── 📄 constants.ts          # Config & persona presets
└── 📄 vite.config.ts        # Build configuration
```

### Audio Pipeline

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Microphone │────▶│ 16kHz PCM    │────▶│   Gemini    │
│   Input     │     │ Base64 Encode│     │   Live API  │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                │
┌─────────────┐     ┌──────────────┐            │
│   Speaker   │◀────│ 24kHz Decode │◀───────────┘
│   Output    │     │ AudioBuffer  │
└─────────────┘     └──────────────┘
```

---

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | 🚀 Start development server |
| `npm run build` | 📦 Build for production |
| `npm run preview` | 👁️ Preview production build |

---

## 🔧 Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | ✅ Yes | Your Google Gemini API key |

### Gemini Models Used

- **Live Conversations**: `gemini-2.5-flash-native-audio-preview-09-2025`
- **Text-to-Speech**: `gemini-2.5-flash-preview-tts`

---

## 📖 Documentation

- [CLAUDE.MD](./CLAUDE.MD) - AI assistant context and codebase guide
- [Google Gemini API](https://ai.google.dev/docs) - Gemini API documentation
- [React Documentation](https://react.dev/) - React framework docs
- [Vite Guide](https://vitejs.dev/guide/) - Vite build tool docs

---

## 🌐 Deployment

### Production Build

```bash
# Create optimized build
npm run build

# Preview locally
npm run preview
```

The build output will be in the `dist/` directory, ready for deployment to any static hosting service.

### Hosting Options

- ▲ **Vercel** - Zero-config deployment
- 🔷 **Netlify** - Simple drag & drop
- ☁️ **Google Cloud Run** - Containerized deployment
- 🅰️ **AWS Amplify** - Full-stack hosting

> **Note**: HTTPS is required for microphone access in production environments.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Google Gemini](https://ai.google.dev/) - Powering the AI conversations
- [React](https://react.dev/) - UI framework
- [Vite](https://vitejs.dev/) - Lightning fast build tool
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

---

<div align="center">

**Built with Google Gemini by [Anthony M]**

[⬆ Back to Top](#-ai-phone-agent)

</div>
