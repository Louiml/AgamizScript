<div align="center">

# Agamiz Script

Ad desktop app for writing screenplays, manuscripts, and subtitles — with AI assistance, revision tracking, and industry-standard formatting.

[![Platform](https://img.shields.io/badge/Platform-WindowsOS%20%7C%20Linux-blue?style=for-the-badge)](https://github.com/Louiml/AgamizScript)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

---

#### **Core Tech Stack**

[![Tauri](https://img.shields.io/badge/tauri-%2324C8DB.svg?style=for-the-badge&logo=tauri&logoColor=black)](https://tauri.app)
[![Rust](https://img.shields.io/badge/rust-%23000000.svg?style=for-the-badge&logo=rust&logoColor=white)](https://www.rust-lang.org)
[![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![SQLite](https://img.shields.io/badge/sqlite-%23003B57.svg?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org)

#### **Supported AI Providers**

[![Ollama](https://img.shields.io/badge/Ollama-000000.svg?style=for-the-badge&logo=ollama&logoColor=white)](https://ollama.ai)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-8E75B2.svg?style=for-the-badge&logo=google%20gemini&logoColor=white)](https://aistudio.google.com)

---

</div>

## Features

### Screenplay & Manuscript Writing
* **Fountain-compatible** screenplay editor with Hollywood-standard formatting
* **Manuscript mode** for novels and prose with chapter/centered elements
* **Smart element flow** — `Enter`/`Tab` automatically switch between Scene Heading, Action, Character, Dialogue, etc.
* **RTL support** for Hebrew, Arabic, and other right-to-left languages

### Subtitle Editor
* Full SRT/VTT editor with timeline visualization
* CPS (characters per second) warnings and overlap detection
* Split/merge cues, adjustable timing, live preview

### Story Bible & Beat Board
* **Character profiles** — name, age, role, description, backstory, motivation, arc, tags
* **Location entries** — description, time of day, notes
* **Beat board** — drag-and-drop index cards with colors, loglines, page intervals
* Real-time sync with the script

### AI Assistant
* Integrated AI panel for brainstorming, continuation, translation, and rewriting
* Native integration for **Ollama** (local models) and **Gemini** API
* Context-aware suggestions using active script context

### Revision Tracking
* Color-coded revision drafts (White, Blue, Pink, Yellow, Green, etc.)
* Per-paragraph revision markers
* Draft management with custom labels and timestamps

---

## File Support Matrix

| Format | Read | Write |
|---|:---:|:---:|
| Native JSON (`.ascript`) | ✅ | ✅ |
| Fountain (`.fountain`) | ✅ | ✅ |
| Final Draft (`.fdx`) | ✅ | ✅ |
| SubRip (`.srt`) | ✅ | ✅ |
| WebVTT (`.vtt`) | ✅ | ✅ |
| Plain Text (`.txt`) | ✅ | ✅ |
| PDF (Industry Margins) | — | ✅ |

---

## Keyboard Shortcuts

| Key Combination | Action |
|---|---|
| `Tab` / `Shift+Tab` | Switch to next/previous element |
| `Enter` | Smart element flow (Scene → Action, Character → Dialogue) |
| `Ctrl+Enter` | Force paragraph break |
| `Ctrl+S` | Save project |
| `Ctrl+E` | Open export dialog |
| `Alt+1` … `Alt+9` | Direct element selection |
| `Ctrl+O` | Toggle Outline panel |

---

## Getting Started

### Prerequisites
* **Node.js**: 20+
* **Rust**: 1.75+
* **OS Tools**:
  * **Windows**: Visual Studio Build Tools & WebView2
  * **macOS**: Xcode Command Line Tools
  * **Linux**: WebKitGTK & libssl

### Quickstart

```bash
# Clone repository
git clone [https://github.com/Louiml/AgamizScript.git](https://github.com/Louiml/AgamizScript.git)
cd AgamizScript

# Install dependencies
npm install

# Run web dev server
npm run dev

# Launch desktop app via Tauri
npm run tauri dev
