// ── Theme System ─────────────────────────────────────

let themes = [];
let currentTheme = null;
let imageCache = {};
let loadedFontFace = null;

// Default CSS variable values (Claude style)
const DEFAULT_COLORS = {
  "--pet-bg-start": "#2a1810",
  "--pet-bg-end": "#1a1008",
  "--pet-accent": "217, 119, 74",
  "--pet-text": "#e8c4a8",
};

export async function initThemes() {
  try {
    const { invoke } = window.__TAURI__.core;
    themes = await invoke("list_themes");
  } catch {
    // Fallback: no themes available (dev mode without Tauri)
    themes = [];
  }

  // Restore saved theme
  const savedId = localStorage.getItem("claude-pet-theme");
  const found = themes.find(t => t.id === savedId);
  if (found) {
    await setTheme(found.id);
  } else {
    // Use default or first available
    const def = themes.find(t => t.id === "default") || themes[0] || null;
    if (def) {
      currentTheme = def;
    }
  }
}

export async function setTheme(id) {
  const theme = themes.find(t => t.id === id);
  if (!theme) return;

  currentTheme = theme;
  localStorage.setItem("claude-pet-theme", id);

  // Preload images for image themes
  if (theme.type === "image") {
    await preloadThemeImages(theme);
  }

  applyThemeColors(theme);
  await applyThemeFont(theme);
}

// ── Colors ───────────────────────────────────────────
function applyThemeColors(theme) {
  const root = document.documentElement;
  const colors = theme.colors;

  if (colors) {
    if (colors.bgStart) root.style.setProperty("--pet-bg-start", colors.bgStart);
    if (colors.bgEnd) root.style.setProperty("--pet-bg-end", colors.bgEnd);
    if (colors.accent) root.style.setProperty("--pet-accent", colors.accent);
    if (colors.text) root.style.setProperty("--pet-text", colors.text);
  } else {
    // Reset to defaults
    for (const [key, val] of Object.entries(DEFAULT_COLORS)) {
      root.style.setProperty(key, val);
    }
  }
}

// ── Font ─────────────────────────────────────────────
async function applyThemeFont(theme) {
  const root = document.documentElement;

  // Remove previous custom font
  if (loadedFontFace) {
    document.fonts.delete(loadedFontFace);
    loadedFontFace = null;
  }

  if (!theme.font) {
    root.style.removeProperty("--pet-font");
    return;
  }

  // font can be a string (family name) or object { family, src }
  if (typeof theme.font === "string") {
    root.style.setProperty("--pet-font", theme.font);
    return;
  }

  if (theme.font.family && theme.font.src) {
    try {
      const { invoke } = window.__TAURI__.core;
      const dataUri = await invoke("get_theme_image", {
        themeId: theme.id,
        filename: theme.font.src,
      });
      const face = new FontFace(theme.font.family, `url(${dataUri})`);
      await face.load();
      document.fonts.add(face);
      loadedFontFace = face;
      root.style.setProperty("--pet-font", theme.font.family);
    } catch (e) {
      console.warn("[pet] Failed to load theme font:", e);
      root.style.removeProperty("--pet-font");
    }
  }
}

// ── Image Preloading ─────────────────────────────────
async function preloadThemeImages(theme) {
  const { invoke } = window.__TAURI__.core;
  const states = theme.states || {};

  for (const [stateId, stateConf] of Object.entries(states)) {
    if (!stateConf.src) continue;
    const cacheKey = `${theme.id}/${stateConf.src}`;
    if (imageCache[cacheKey]) continue;

    try {
      const dataUri = await invoke("get_theme_image", {
        themeId: theme.id,
        filename: stateConf.src,
      });
      imageCache[cacheKey] = dataUri;
    } catch (e) {
      console.warn(`[pet] Failed to load theme image: ${cacheKey}`, e);
    }
  }
}

/**
 * @param {object} stateObj - State object with stateId field
 * @returns {{ type: "emoji"|"image", content: string }}
 */
export function getCharacterForState(stateObj) {
  const stateId = stateObj.stateId || "idle";

  if (currentTheme && currentTheme.type === "image") {
    const stateConf = currentTheme.states?.[stateId];
    if (stateConf?.src) {
      const cacheKey = `${currentTheme.id}/${stateConf.src}`;
      const cached = imageCache[cacheKey];
      if (cached) {
        return { type: "image", content: cached };
      }
    }
  }

  if (currentTheme && currentTheme.type === "emoji") {
    const stateConf = currentTheme.states?.[stateId];
    if (stateConf?.emoji) {
      return { type: "emoji", content: stateConf.emoji };
    }
  }

  // Fallback to state's default emoji
  return { type: "emoji", content: stateObj.emoji || "🤖" };
}

export function getThemes() {
  return themes;
}

export function getCurrentThemeId() {
  return currentTheme?.id || "default";
}
