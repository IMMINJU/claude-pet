use std::fs;
use std::path::PathBuf;

const HOOK_EVENTS: &[&str] = &["PreToolUse", "PostToolUse", "Notification", "Stop"];

/// Register hooks in Claude Code settings on app startup.
pub fn setup_hooks() {
    let home = match dirs::home_dir() {
        Some(h) => h,
        None => {
            eprintln!("[pet] Could not determine home directory, skipping hook setup");
            return;
        }
    };

    // Get current exe path for the hook command
    let exe_path = match std::env::current_exe() {
        Ok(p) => p.to_string_lossy().replace('\\', "/"),
        Err(e) => {
            eprintln!("[pet] Could not determine exe path: {e}");
            return;
        }
    };

    let command = format!("{exe_path} --hook");

    let settings_path = home.join(".claude").join("settings.json");
    if let Err(e) = register_hooks(&settings_path, &command) {
        eprintln!("[pet] Failed to register hooks: {e}");
    }
}

fn register_hooks(settings_path: &PathBuf, command: &str) -> Result<(), String> {
    // Read existing settings
    let mut settings: serde_json::Value = if settings_path.exists() {
        let text = fs::read_to_string(settings_path)
            .map_err(|e| format!("read settings: {e}"))?;
        if text.trim().is_empty() {
            serde_json::json!({})
        } else {
            serde_json::from_str(&text)
                .map_err(|e| format!("parse settings: {e}"))?
        }
    } else {
        serde_json::json!({})
    };

    let hooks = settings
        .as_object_mut()
        .ok_or("settings is not an object")?
        .entry("hooks")
        .or_insert_with(|| serde_json::json!({}));

    let hooks_obj = hooks
        .as_object_mut()
        .ok_or("hooks is not an object")?;

    let hook_entry = serde_json::json!({
        "matcher": "",
        "hooks": [
            {
                "type": "command",
                "command": command,
            }
        ]
    });

    let mut added = Vec::new();
    let mut skipped = Vec::new();

    for &event in HOOK_EVENTS {
        let event_hooks = hooks_obj
            .entry(event)
            .or_insert_with(|| serde_json::json!([]));

        let arr = event_hooks
            .as_array_mut()
            .ok_or(format!("{event} is not an array"))?;

        // Check if claude-pet hook is already registered
        let already_exists = arr.iter().any(|entry| {
            entry
                .get("hooks")
                .and_then(|h| h.as_array())
                .map(|hooks_arr| {
                    hooks_arr.iter().any(|h| {
                        h.get("command")
                            .and_then(|c| c.as_str())
                            .map(|c| c.contains("claude-pet") && c.contains("--hook"))
                            .unwrap_or(false)
                    })
                })
                .unwrap_or(false)
        });

        if already_exists {
            skipped.push(event);
        } else {
            arr.push(hook_entry.clone());
            added.push(event);
        }
    }

    // Save settings
    if let Some(parent) = settings_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("create settings dir: {e}"))?;
    }

    let json_str = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("serialize settings: {e}"))?;
    fs::write(settings_path, json_str + "\n")
        .map_err(|e| format!("write settings: {e}"))?;

    if !added.is_empty() {
        println!("[pet] Installed hooks: {}", added.join(", "));
    }
    if !skipped.is_empty() {
        println!("[pet] Already installed: {}", skipped.join(", "));
    }

    Ok(())
}
