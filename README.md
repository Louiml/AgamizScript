# Agamiz Script

A cross-platform desktop application for writing screenplays, manuscripts, and subtitles — with AI assistance, revision tracking, and industry-standard formatting.

![Agamiz Script](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Tauri](https://img.shields.io/badge/Tauri-2.0-orange)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

## Features

### 🎬 Screenplay & Manuscript Writing
- **Fountain-compatible** screenplay editor with Hollywood-standard formatting
- **Manuscript mode** for novels and prose with chapter/centered elements
- **Smart element flow** — Enter/Tab automatically switch between Scene Heading, Action, Character, Dialogue, etc.
- **RTL support** for Hebrew, Arabic, and other right-to-left languages

### 📝 Subtitle Editor
- Full SRT/VTT editor with timeline visualization
- CPS (characters per second) warnings and overlap detection
- Split/merge cues, adjustable timing, live preview

### 📚 Story Bible & Beat Board
- **Character profiles** — name, age, role, description, backstory, motivation, arc, tags
- **Location entries** — description, time of day, notes
- **Beat board** — drag-and-drop index cards with colors, loglines, page intervals
- Real-time sync with the script

### 🤖 AI Assistant
- Integrated AI panel for brainstorming, continuation, translation, and rewriting
- Supports **Ollama** (local), **Gemini**, and custom endpoints
- Context-aware suggestions using current script content

### 🎨 Revision Tracking
- Color-coded revision drafts (White, Blue, Pink, Yellow, Green, etc.)
- Per-paragraph revision markers
- Draft management with labels and timestamps

### 💾 File Formats
| Format | Read | Write |
|--------|------|-------|
| `.ascript` (native JSON) | ✅ | ✅ |
| Fountain (`.fountain`) | ✅ | ✅ |
| Final Draft (`.fdx`) | ✅ | ✅ |
| SubRip (`.srt`) | ✅ | ✅ |
| WebVTT (`.vtt`) | ✅ | ✅ |
| Plain text (`.txt`) | ✅ | ✅ |
| PDF (industry margins) | — | ✅ |

### ⌨️ Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `Tab` / `Shift+Tab` | Next/previous element |
| `Enter` | Smart flow (Scene→Action, Character→Dialogue, etc.) |
| `Ctrl+Enter` | Force paragraph break |
| `Ctrl+S` | Save |
| `Ctrl+E` | Export dialog |

## Tech Stack

- **Frontend**: React 18, TypeScript, Tiptap (ProseMirror), Framer Motion
- **Backend**: Tauri 2 (Rust), SQLite (via Tauri plugins)
- **State**: Zustand with persistence
- **i18n**: react-i18next (EN, HE, AR, RU)
- **Styling**: CSS variables, Tailwind-inspired utility classes

## Getting Started

### Prerequisites
- Node.js 20+
- Rust 1.75+ (for Tauri)
- Windows: Visual Studio Build Tools / WebView2
- macOS: Xcode Command Line Tools
- Linux: WebKitGTK, libssl, etc. (see [Tauri prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites))

### Development

```bash
# Clone
git clone https://github.com/Louiml/AgamizScript.git
cd AgamizScript

# Install dependencies
npm install

# Start dev server (hot reload)
npm run dev

# In another terminal, run Tauri
npm run tauri dev
```

### Build

```bash
# Production build
npm run build

# Tauri bundle (installer)
npm run tauri build
```

## Project Structure

```
AgamizScript/
├── src/
│   ├── components/          # React components
│   │   ├── ai/              # AI Assistant panel
│   │   ├── bible/           # Story Bible (characters/locations)
│   │   ├── cards/           # Beat Board
│   │   ├── editor/          # Screenplay/Manuscript editor
│   │   ├── landing/         # Landing page & templates
│   │   ├── layout/          # Workspace, Sidebar, StatusBar
│   │   ├── settings/        # Settings panel
│   │   ├── subtitles/       # SRT/VTT editor
│   │   └── ui/              # Shared UI (ContextMenu, etc.)
│   ├── editor/              # ProseMirror ↔ JSON conversion
│   ├── extensions/          # Tiptap custom extensions
│   ├── hooks/               # Custom React hooks
│   ├── i18n/                # Translations (EN/HE/AR/RU)
│   ├── lib/                 # I/O, templates, format parsers
│   ├── store/               # Zustand stores (app, project, ai)
│   ├── types/               # TypeScript types & schemas
│   └── utils/               # Helpers (counters, timecode, etc.)
├── src-tauri/               # Tauri (Rust) backend
│   ├── capabilities/        # Permission manifests
│   ├── src/                 # Rust commands & setup
│   └── tauri.conf.json      # App configuration
└── public/                  # Static assets
```

## Configuration

### Ollama (Local AI)
1. Install [Ollama](https://ollama.ai) and pull a model: `ollama pull llama3`
2. In Settings → AI, set provider to "Ollama" and URL to `http://127.0.0.1:11434`

### Gemini
1. Get an API key from [Google AI Studio](https://aistudio.google.com)
2. In Settings → AI, set provider to "Gemini" and paste your key

## Keyboard Navigation
- The editor is fully keyboard-operable
- Element toolbar accessible via `Alt+1`…`Alt+9`
- Outline panel: `Ctrl+O`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Run `npm run typecheck` and `npm run lint`
5. Submit a PR

## License

MIT License — see [LICENSE](LICENSE) for details.

## Acknowledgments

- [Tiptap](https://tiptap.dev) for the excellent editor framework
- [Tauri](https://tauri.app) for the lightweight desktop runtime
- [Fountain](https://fountain.io) for the screenplay markup spec
- [Lucide](https://lucide.dev) for the icon set