import { t, getLang, setLang, getAvailableLangs, updateMenuLabels, initI18n } from "./i18n.js";
import { handleEvent, cleanupSessions, refreshDisplay, resetSessions, isQuietMode, setQuietMode } from "./sessions.js";
import { initThemes, setTheme, getThemes, getCurrentThemeId } from "./themes.js";

// ── Tauri Event Listener ─────────────────────────────
async function initTauriListener() {
  try {
    const { listen } = window.__TAURI__.event;
    await listen("pet-event", (e) => {
      handleEvent(e.payload);
    });
    console.log("[pet] Tauri event listener ready");
  } catch (err) {
    console.warn("[pet] Tauri API not available, using fallback polling");
  }
}

// ── Window Drag ──────────────────────────────────────
document.getElementById("pet-container").addEventListener("mousedown", async (e) => {
  if (e.button !== 0) return;
  if (e.target.closest("#context-menu")) return;
  try {
    const { getCurrentWindow } = window.__TAURI__.window;
    await getCurrentWindow().startDragging();
  } catch {}
});

// ── Context Menu (Native) ────────────────────────────
document.addEventListener("contextmenu", async (e) => {
  e.preventDefault();
  try {
    const { Menu, MenuItem, Submenu, PredefinedMenuItem } = window.__TAURI__.menu;

    // Language submenu
    const langs = getAvailableLangs();
    const curLang = getLang();
    const langItems = [];
    for (const lang of langs) {
      const prefix = lang.code === curLang ? "* " : "  ";
      const item = await MenuItem.new({
        id: `lang-${lang.code}`,
        text: `${prefix}${lang.name}`,
        action: () => {
          setLang(lang.code);
          updateMenuLabels();
          refreshDisplay();
        },
      });
      langItems.push(item);
    }

    const langMenu = await Submenu.new({
      id: "lang-menu",
      text: t("selectLang"),
      items: langItems,
    });

    // Theme submenu
    const themeList = getThemes();
    const currentThemeId = getCurrentThemeId();
    const themeItems = [];
    for (const theme of themeList) {
      const prefix = theme.id === currentThemeId ? "* " : "  ";
      const item = await MenuItem.new({
        id: `theme-${theme.id}`,
        text: `${prefix}${theme.name}`,
        action: async () => {
          await setTheme(theme.id);
          refreshDisplay();
        },
      });
      themeItems.push(item);
    }

    let themeMenu = null;
    if (themeItems.length > 0) {
      themeMenu = await Submenu.new({
        id: "theme-menu",
        text: t("selectTheme"),
        items: themeItems,
      });
    }

    const quietPrefix = isQuietMode() ? "* " : "  ";
    const quietItem = await MenuItem.new({
      id: "quiet-mode",
      text: `${quietPrefix}${t("focusMode")}`,
      action: () => {
        setQuietMode(!isQuietMode());
        if (isQuietMode()) {
          resetSessions();
        }
      },
    });

    const resetItem = await MenuItem.new({
      id: "reset-sessions",
      text: t("resetSessions"),
      action: () => {
        resetSessions();
      },
    });

    const separator = await PredefinedMenuItem.new({ item: "Separator" });

    const quitItem = await MenuItem.new({
      id: "quit",
      text: t("quit"),
      action: async () => {
        try {
          const { exit } = window.__TAURI__.process;
          await exit(0);
        } catch {
          window.close();
        }
      },
    });

    const items = [langMenu];
    if (themeMenu) items.push(themeMenu);
    items.push(quietItem, resetItem, separator, quitItem);

    const menu = await Menu.new({ items });
    await menu.popup();
  } catch (err) {
    console.warn("[pet] Native menu failed:", err);
  }
});

// ── Init ─────────────────────────────────────────────
async function init() {
  await initI18n();
  await initThemes();
  updateMenuLabels();
  refreshDisplay();
  initTauriListener();
  setInterval(cleanupSessions, 10000);
}

init();
