# Contributing to Claude Pet

Thanks for your interest in contributing! This guide covers the most common ways to contribute.

## Creating a Theme

Themes live in `src/themes/{theme-id}/config.json` (built-in) or `~/.claude-pet/themes/{theme-id}/config.json` (user-created).

### Emoji Theme

Create a folder with a `config.json`:

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
    "idle":         { "emoji": "🦊" },
    "read":         { "emoji": "📚" },
    "write":        { "emoji": "✏️" },
    "bash":         { "emoji": "💥" },
    "search":       { "emoji": "🔎" },
    "task":         { "emoji": "🤖" },
    "web":          { "emoji": "🌍" },
    "success":      { "emoji": "🎉" },
    "error":        { "emoji": "💔" },
    "notification": { "emoji": "🔔" },
    "stop":         { "emoji": "💤" },
    "unknown":      { "emoji": "❓" }
  }
}
```

**Colors** (all optional — omit to use defaults):

| Key | Description | Default |
|-----|-------------|---------|
| `bgStart` | Background gradient start | `#2a1810` |
| `bgEnd` | Background gradient end | `#1a1008` |
| `accent` | Accent color as RGB values | `217, 119, 74` |
| `text` | Bubble text color | `#e8c4a8` |

### Image Theme

Use `"type": "image"` and provide image files:

```json
{
  "name": "Pixel Cat",
  "type": "image",
  "colors": { ... },
  "states": {
    "idle": { "src": "idle.gif" },
    "read": { "src": "read.png" },
    "write": { "src": "write.gif" },
    "bash": { "src": "bash.gif" },
    "search": { "src": "search.gif" },
    "task": { "src": "task.gif" },
    "web": { "src": "web.gif" },
    "success": { "src": "success.png" },
    "error": { "src": "error.png" },
    "notification": { "src": "notification.gif" },
    "stop": { "src": "stop.png" }
  }
}
```

Image files go in the same folder as `config.json`.

**Image specs:**
- Size: ~80x80px recommended (displayed at 40px, doubled for retina)
- Format: PNG for static, GIF for animated
- Background: transparent

### Custom Font

Add a `font` field to use a custom font:

```json
{
  "font": "Arial"
}
```

Or bundle a font file in the same theme folder:

```json
{
  "font": { "family": "MyPixelFont", "src": "my-font.ttf" }
}
```

Place the `.ttf`/`.woff2` file next to `config.json` in your theme folder.

### Submitting a Theme

1. Create your theme in `src/themes/{theme-id}/`
2. Test it locally (it should appear in the right-click → Theme menu)
3. Open a PR with your theme folder

## Adding a Language

UI translations are JSON files in `src/locales/`.

1. Copy `src/locales/en.json` to `src/locales/{code}.json` (e.g., `ja.json`)
2. Translate all values (keep the keys as-is)
3. Add your language to `src/locales/index.json`:

```json
[
  { "code": "en", "name": "English" },
  { "code": "ko", "name": "한국어" },
  { "code": "ja", "name": "日本語" }
]
```

4. Open a PR

## Adding a README Translation

1. Copy `README.md` to `README.{code}.md` (e.g., `README.ja.md`)
2. Translate the content
3. Update the **Translations** line at the top of every existing README to include yours:

```markdown
**Translations**: [English](./README.md) · [한국어](./README.ko.md) · [日本語](./README.ja.md)
```

4. Open a PR

## Development Setup

```bash
git clone https://github.com/IMMINJU/claude-pet.git
cd claude-pet
npm install
npm run dev
```

### Project Overview

| Directory | Language | Description |
|-----------|----------|-------------|
| `src/` | JS/CSS/HTML | Frontend — UI, themes, i18n, state management |
| `src-tauri/src/` | Rust | Backend — TCP server, hook sender, theme file loading |

### Rust Modules

| File | Purpose |
|------|---------|
| `main.rs` | Entry point, Tauri builder |
| `hook_sender.rs` | `--hook` mode: stdin → TCP |
| `hook_setup.rs` | Auto-register hooks in `~/.claude/settings.json` |
| `server.rs` | TCP listener → Tauri event emitter |
| `themes.rs` | Theme discovery, image loading (base64) |

### JS Modules

| File | Purpose |
|------|---------|
| `main.js` | Init, Tauri event listener, context menu, window drag |
| `sessions.js` | Session management, display rendering |
| `states.js` | Tool → state mapping (emoji, animation, stateId) |
| `themes.js` | Theme loading, colors, fonts, image cache |
| `i18n.js` | Translation loading, `t()` helper |

## Code Style

- JS: no build step, vanilla ES modules, no framework
- Rust: standard `cargo fmt` formatting
- Keep it simple — this is a tiny app, avoid over-engineering

## Questions?

Open an issue on GitHub.
