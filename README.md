# Claude Pet

A lightweight desktop pet that reacts to [Claude Code](https://docs.anthropic.com/en/docs/claude-code) in real time.

Built with [Tauri 2](https://tauri.app/) — the final binary is ~8 MB.

**Translations**: [한국어](./README.ko.md) · [Add yours!](./CONTRIBUTING.md#adding-a-readme-translation)

[![GitHub stars](https://img.shields.io/github/stars/IMMINJU/claude-pet?style=social)](https://github.com/IMMINJU/claude-pet)
[![GitHub release](https://img.shields.io/github/v/release/IMMINJU/claude-pet)](https://github.com/IMMINJU/claude-pet/releases)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)
![License](https://img.shields.io/badge/license-MIT-green)

<p align="center">
  <img src="./assets/demo.gif" alt="Claude Pet Demo" width="400" />
</p>

## Why?

I run multiple Claude Code sessions at work and kept losing track of which one needs my input. Can't use sound in the office, so I built a small always-on-top widget that shows what each session is doing through an animated character. Once I mapped states to emojis — smiling on success, panicking on errors, dozing when idle — it stopped feeling like a status indicator and started feeling like something alive. So I just called it a "pet."

## What It Does

Claude Pet sits on your desktop and shows what Claude Code is doing — reading files, writing code, running commands, searching, and more. Each action triggers a different emoji and animation.

A few examples: 📖 reading files, ✍️ writing code, ⚡ running commands, 🔍 searching, 😰 errors, 🙋 waiting for input — 17 states in total, each with its own animation.

When you run multiple sessions, they show up side by side (📖A ⚡B 🔍C).

## How It Works

```
Claude Code hooks → claude-pet --hook → TCP socket → Tauri (Rust) → WebView UI
```

1. Claude Code fires hook events (PreToolUse, PostToolUse, Notification, Stop, SessionStart/End, etc.)
2. The built-in hook sender (`claude-pet --hook`) reads JSON from stdin and sends it to `127.0.0.1:19876`
3. The Rust backend receives the JSON and emits it to the frontend
4. The frontend updates the emoji, animation, and speech bubble

## Installation

### Quick Start (pre-built binary)

**macOS / Linux:**

```bash
curl -fsSL https://raw.githubusercontent.com/IMMINJU/claude-pet/main/install.sh | sh
```

**Windows (PowerShell):**

```powershell
irm https://raw.githubusercontent.com/IMMINJU/claude-pet/main/install.ps1 | iex
```

This downloads the latest release, installs to `~/.claude-pet` (or `%LOCALAPPDATA%\claude-pet` on Windows), and registers the Claude Code hooks automatically.

### Build from Source

<details>
<summary>Prerequisites</summary>

- [Rust](https://rustup.rs/) (stable)
- [Node.js](https://nodejs.org/) 18+
- Platform-specific dependencies for [Tauri 2](https://v2.tauri.app/start/prerequisites/)

</details>

```bash
git clone https://github.com/IMMINJU/claude-pet.git
cd claude-pet
npm install
npm run build
```

The binary will be at `src-tauri/target/release/claude-pet` (or `.exe` on Windows).

Hooks are registered automatically when the app starts — no manual configuration needed.

## Usage

1. Launch the pet: run the built binary or `npm run dev` for development
2. Start Claude Code — the pet will react to every tool call
3. **Drag** the widget anywhere on your desktop
4. **Right-click** to open the context menu:
   - Language — switch between available languages
   - Theme — switch between built-in themes
   - Focus Mode — only react to completion, errors, and notifications
   - Reset Sessions
   - Quit

## Features

~8 MB single binary, no runtime dependencies. Transparent, frameless, always-on-top. Tracks multiple Claude Code sessions at once. 3 built-in themes (Default, Cat, Fruits) and you can make your own. Focus Mode if you only care about completions and errors. English and Korean UI, easy to add more.

> Currently tested on Windows 11. macOS/Linux testing and feedback welcome.

## Themes

Right-click → Theme to switch between built-in themes. Each theme has its own emojis and color scheme.

| Theme | Idle | Success | Error | Color Tone |
|-------|------|---------|-------|------------|
| Default | 🤖 | ✅ | 😰 | Orange/Brown |
| Cat | 🐱 | 😻 | 🙀 | Pink/Purple |
| Fruits | 🍎 | 🍉 | 🍅 | Red/Green (image) |

### Custom Themes

Create a folder in `~/.claude-pet/themes/your-theme/` with a `config.json`:

```json
{
  "name": "My Theme",
  "type": "emoji",
  "colors": {
    "bgStart": "#1a1a2e",
    "bgEnd": "#101020",
    "accent": "100, 100, 255",
    "text": "#e0e0ff"
  },
  "states": {
    "idle": { "emoji": "🦊" },
    "read": { "emoji": "📚" },
    "write": { "emoji": "✏️" },
    "bash": { "emoji": "💥" },
    "search": { "emoji": "🔎" },
    "task": { "emoji": "🤖" },
    "web": { "emoji": "🌍" },
    "success": { "emoji": "🎉" },
    "error": { "emoji": "💔" },
    "notification": { "emoji": "🔔" },
    "stop": { "emoji": "💤" }
  }
}
```

Image themes use `"type": "image"` with `"src": "filename.gif"` instead of `"emoji"`. Custom fonts are also supported. See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## Development

```bash
npm run dev
```

This opens the pet widget in development mode with hot reload for the frontend.

To test events manually:

```bash
echo '{"hook_event_name":"PreToolUse","tool_name":"Read","session_id":"test"}' | ./src-tauri/target/debug/claude-pet --hook
```

## Architecture

```
┌──────────────────────────────────────────────────┐
│              Claude Code (terminal)               │
│  hooks: PreToolUse, PostToolUse, Notification...  │
└──────────────────┬───────────────────────────────┘
                   │ stdin (JSON)
                   ▼
          ┌──────────────────┐
          │ claude-pet --hook │
          └────────┬─────────┘
                   │ TCP :19876
                   ▼
┌──────────────────────────────────────────────────┐
│              Claude Pet (Tauri 2)                  │
│  ┌──────────┐    emit     ┌────────────────────┐ │
│  │ Rust TCP │ ──────────▶ │ WebView (HTML/CSS) │ │
│  │ listener │             │ emoji + animation  │ │
│  └──────────┘             └────────────────────┘ │
└──────────────────────────────────────────────────┘
```

## Uninstall

**macOS / Linux:**

```bash
rm -rf ~/.claude-pet
```

**Windows (PowerShell):**

```powershell
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\claude-pet"
```

Then remove the hooks from `~/.claude/settings.json` — delete the entries containing `claude-pet` under each hook event (`PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `Notification`, `Stop`, `SessionStart`, `SessionEnd`, `SubagentStart`, `SubagentStop`, `TaskCompleted`).

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

Easiest ways to start: [make a theme](./CONTRIBUTING.md#creating-a-theme) (just JSON + images), [add a language](./CONTRIBUTING.md#adding-a-language) (one JSON file), or [translate the README](./CONTRIBUTING.md#adding-a-readme-translation).

## License

MIT

[NeoDungGeunMo](https://github.com/neodgm/neodgm) font by Eunbin Jeong (Dalgona.) — [SIL Open Font License 1.1](https://scripts.sil.org/OFL)
