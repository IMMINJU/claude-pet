import { t } from "./i18n.js";
import {
  STATE_IDLE, STATE_ERROR, STATE_SUCCESS,
  TRANSIENT_DURATION, SESSION_TIMEOUT, LABEL_CHARS,
  stateForEvent,
} from "./states.js";
import { getCharacterForState } from "./themes.js";

// ── App State ────────────────────────────────────────
let sessions = {};
let labelIndex = 0;
let transientTimers = {};

// ── DOM Refs ─────────────────────────────────────────
const emojiEl = document.getElementById("emoji");
const emojiRowEl = document.getElementById("emoji-row");
const statusTextEl = document.getElementById("status-text");
const bubbleEl = document.getElementById("bubble");
const bubbleTextEl = document.getElementById("bubble-text");

// ── Session Management ───────────────────────────────
function getOrCreateSession(sessionId) {
  if (!sessions[sessionId]) {
    const label = LABEL_CHARS[labelIndex % LABEL_CHARS.length];
    labelIndex++;
    sessions[sessionId] = {
      id: sessionId,
      label,
      state: STATE_IDLE,
      lastSeen: Date.now(),
    };
  }
  return sessions[sessionId];
}

export function cleanupSessions() {
  const now = Date.now();
  let changed = false;
  for (const id of Object.keys(sessions)) {
    if (now - sessions[id].lastSeen > SESSION_TIMEOUT) {
      delete sessions[id];
      changed = true;
    }
  }
  if (changed) refreshDisplay();
}

// ── Event Processing ─────────────────────────────────
export function handleEvent(event) {
  const sessionId = event.session_id || "unknown";
  const hookEvent = event.hook_event_name || "";
  const newState = stateForEvent(event);

  const session = getOrCreateSession(sessionId);
  session.state = newState;
  session.lastSeen = Date.now();

  // Clear any existing transient timer for this session
  if (transientTimers[sessionId]) {
    clearTimeout(transientTimers[sessionId]);
    delete transientTimers[sessionId];
  }

  // Schedule return to idle for transient states
  if (hookEvent === "PostToolUse") {
    const resp = event.tool_response;
    const isError = resp && typeof resp === "object" && resp.success === false;
    const delay = isError ? TRANSIENT_DURATION.error : TRANSIENT_DURATION.success;
    transientTimers[sessionId] = setTimeout(() => returnToIdle(sessionId), delay);
  } else if (hookEvent === "Stop") {
    transientTimers[sessionId] = setTimeout(() => returnToIdle(sessionId), TRANSIENT_DURATION.stop);
  }

  refreshDisplay();
}

function returnToIdle(sessionId) {
  delete transientTimers[sessionId];
  if (sessions[sessionId]) {
    if (Date.now() - sessions[sessionId].lastSeen >= 1000) {
      sessions[sessionId].state = STATE_IDLE;
      refreshDisplay();
    }
  }
}

// ── Character Rendering ──────────────────────────────
function renderCharacterInto(el, stateObj) {
  const char = getCharacterForState(stateObj);
  if (char.type === "image") {
    el.textContent = "";
    let img = el.querySelector("img");
    if (!img) {
      img = document.createElement("img");
      el.appendChild(img);
    }
    img.src = char.content;
    img.alt = stateObj.stateId || "";
  } else {
    // emoji
    const img = el.querySelector("img");
    if (img) img.remove();
    el.textContent = char.content;
  }
}

// ── Display ──────────────────────────────────────────
export function refreshDisplay() {
  const active = Object.values(sessions).filter(
    s => Date.now() - s.lastSeen <= SESSION_TIMEOUT
  );

  let bubbleText;

  if (active.length === 0) {
    // No sessions: show default idle emoji
    emojiRowEl.innerHTML = "";
    emojiRowEl.appendChild(emojiEl);
    renderCharacterInto(emojiEl, STATE_IDLE);
    emojiEl.className = "state-idle";
    emojiEl.style.display = "";
    statusTextEl.textContent = t("statusIdle");
    bubbleText = "";
  } else if (active.length === 1) {
    // Single session: big emoji, no label
    const s = active[0];
    emojiRowEl.innerHTML = "";
    emojiRowEl.appendChild(emojiEl);
    renderCharacterInto(emojiEl, s.state);
    emojiEl.className = s.state.animClass;
    emojiEl.style.display = "";
    statusTextEl.textContent = t(s.state.statusKey);
    bubbleText = getBubbleText(s.state);
  } else {
    // Multi-session: emojis side by side with labels
    emojiEl.style.display = "none";
    emojiRowEl.innerHTML = "";
    active.forEach(s => {
      const unit = document.createElement("div");
      unit.className = "emoji-unit";

      const char = document.createElement("span");
      char.className = "emoji-char " + s.state.animClass;
      renderCharacterInto(char, s.state);

      const label = document.createElement("span");
      label.className = "emoji-label";
      label.textContent = s.label;

      unit.appendChild(char);
      unit.appendChild(label);
      emojiRowEl.appendChild(unit);
    });

    // Status & bubble: show most recently active
    const latest = active.reduce((a, b) => a.lastSeen > b.lastSeen ? a : b);
    statusTextEl.textContent = t(latest.state.statusKey);
    const raw = getBubbleText(latest.state);
    bubbleText = raw ? `[${latest.label}] ${raw}` : "";
  }

  // Update bubble
  if (bubbleText) {
    bubbleTextEl.textContent = bubbleText;
    bubbleEl.classList.remove("hidden");
  } else {
    bubbleEl.classList.add("hidden");
  }
}

function getBubbleText(state) {
  if (state.bubbleText) return state.bubbleText;
  if (state.bubbleKey) return t(state.bubbleKey, state.bubbleVars);
  return "";
}

export function resetSessions() {
  sessions = {};
  labelIndex = 0;
  for (const id of Object.keys(transientTimers)) {
    clearTimeout(transientTimers[id]);
  }
  transientTimers = {};
  refreshDisplay();
}
