import { t } from "./i18n.js";

// ── State Mapping ────────────────────────────────────
export const TOOL_STATES = {
  Read:         { stateId: "read",    emoji: "📖", animClass: "state-read",    bubbleKey: "reading",   statusKey: "statusReading" },
  Edit:         { stateId: "write",   emoji: "✍️", animClass: "state-write",   bubbleKey: "editing",   statusKey: "statusEditing" },
  Write:        { stateId: "write",   emoji: "✍️", animClass: "state-write",   bubbleKey: "writing",   statusKey: "statusWriting" },
  Bash:         { stateId: "bash",    emoji: "⚡", animClass: "state-bash",    bubbleKey: "running",   statusKey: "statusRunning" },
  Grep:         { stateId: "search",  emoji: "🔍", animClass: "state-search",  bubbleKey: "searching", statusKey: "statusSearching" },
  Glob:         { stateId: "search",  emoji: "🔍", animClass: "state-search",  bubbleKey: "finding",   statusKey: "statusSearching" },
  Task:         { stateId: "task",    emoji: "🤖", animClass: "state-task",    bubbleKey: "agent",     statusKey: "statusAgent" },
  WebFetch:     { stateId: "web",     emoji: "🌐", animClass: "state-web",     bubbleKey: "webFetch",  statusKey: "statusWeb" },
  WebSearch:    { stateId: "web",     emoji: "🌐", animClass: "state-web",     bubbleKey: "webSearch", statusKey: "statusWeb" },
  NotebookEdit: { stateId: "write",   emoji: "📓", animClass: "state-write",   bubbleKey: "notebook",  statusKey: "statusNotebook" },
};

export const STATE_SUCCESS       = { stateId: "success",      emoji: "✅", animClass: "state-success",       bubbleKey: "success",      statusKey: "statusDone" };
export const STATE_ERROR         = { stateId: "error",        emoji: "😰", animClass: "state-error",         bubbleKey: "error",        statusKey: "statusError" };
export const STATE_NOTIFICATION  = { stateId: "notification", emoji: "🙋", animClass: "state-notification",  bubbleKey: "notification", statusKey: "statusNotification" };
export const STATE_STOP          = { stateId: "stop",         emoji: "😴", animClass: "state-stop",          bubbleKey: "stopped",      statusKey: "statusStopped" };
export const STATE_IDLE          = { stateId: "idle",         emoji: "🤖", animClass: "state-idle",          bubbleKey: "idle",         statusKey: "statusIdle" };
export const STATE_SESSION_START = { stateId: "sessionStart", emoji: "👋", animClass: "state-session-start", bubbleKey: "sessionStart", statusKey: "statusSessionStart" };
export const STATE_SESSION_END   = { stateId: "sessionEnd",   emoji: "👋", animClass: "state-session-end",   bubbleKey: "sessionEnd",   statusKey: "statusSessionEnd" };
export const STATE_SUBAGENT      = { stateId: "subagent",     emoji: "🔀", animClass: "state-task",          bubbleKey: "subagent",     statusKey: "statusSubagent" };
export const STATE_TASK_DONE     = { stateId: "taskDone",     emoji: "🎉", animClass: "state-task-done",     bubbleKey: "taskDone",     statusKey: "statusTaskDone" };

export const TRANSIENT_DURATION = { success: 1500, error: 3000, stop: 5000, sessionStart: 3000, sessionEnd: 5000, taskDone: 3000 };
export const SESSION_TIMEOUT = 60000;
export const LABEL_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function stateForEvent(event) {
  const hookEvent = event.hook_event_name || "";

  if (hookEvent === "PreToolUse") {
    const tool = event.tool_name || "";
    if (TOOL_STATES[tool]) return TOOL_STATES[tool];
    return {
      stateId: "unknown",
      emoji: "🔧",
      animClass: "state-write",
      bubbleKey: "toolDefault",
      bubbleVars: { tool },
      statusKey: "statusWorking"
    };
  }

  if (hookEvent === "PostToolUse") {
    const resp = event.tool_response;
    if (resp && typeof resp === "object" && resp.success === false) {
      return STATE_ERROR;
    }
    return STATE_SUCCESS;
  }

  if (hookEvent === "Notification") {
    const msg = event.message || t("notification");
    const short = msg.length > 25 ? msg.slice(0, 25) + "..." : msg;
    return {
      stateId: "notification",
      emoji: "🙋",
      animClass: "state-notification",
      bubbleText: short,
      statusKey: "statusNotification"
    };
  }

  if (hookEvent === "Stop") return STATE_STOP;
  if (hookEvent === "PostToolUseFailure") return STATE_ERROR;
  if (hookEvent === "SessionStart") return STATE_SESSION_START;
  if (hookEvent === "SessionEnd") return STATE_SESSION_END;
  if (hookEvent === "SubagentStart") return STATE_SUBAGENT;
  if (hookEvent === "SubagentStop") return STATE_SUCCESS;
  if (hookEvent === "TaskCompleted") return STATE_TASK_DONE;

  return STATE_IDLE;
}
