// ── i18n (JSON-based) ────────────────────────────────
// Add a new language: create locales/{code}.json and add to locales/index.json

let availableLangs = [];
let strings = {};       // { en: {...}, ko: {...} }
let currentLang = "en";

export async function initI18n() {
  currentLang = localStorage.getItem("claude-pet-lang") || "en";

  // Load language manifest
  try {
    const res = await fetch("./locales/index.json");
    availableLangs = await res.json();
  } catch {
    availableLangs = [{ code: "en", name: "English" }];
  }

  // Load all locale files in parallel
  await Promise.all(
    availableLangs.map(async (lang) => {
      try {
        const res = await fetch(`./locales/${lang.code}.json`);
        strings[lang.code] = await res.json();
      } catch {
        strings[lang.code] = {};
      }
    })
  );

  // Fallback if saved lang doesn't exist
  if (!strings[currentLang]) {
    currentLang = "en";
  }
}

export function t(key, vars) {
  let text = (strings[currentLang] && strings[currentLang][key])
    || (strings.en && strings.en[key])
    || key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, v);
    }
  }
  return text;
}

export function getLang() {
  return currentLang;
}

export function setLang(lang) {
  currentLang = lang;
  localStorage.setItem("claude-pet-lang", currentLang);
}

export function getAvailableLangs() {
  return availableLangs;
}

export function updateMenuLabels() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
}
