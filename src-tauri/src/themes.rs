use base64::Engine;
use serde::Serialize;
use std::fs;
use std::path::PathBuf;

#[derive(Serialize, Clone)]
pub struct ThemeInfo {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub theme_type: String,
    pub states: serde_json::Value,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub colors: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub font: Option<serde_json::Value>,
    pub builtin: bool,
}

fn builtin_themes_dir() -> Option<PathBuf> {
    let exe_dir = std::env::current_exe().ok()?.parent()?.to_path_buf();
    // In dev: src-tauri/target/debug → look for src/themes
    // In production: bundled in resource dir next to exe
    let candidates = [
        exe_dir.join("themes"),
        exe_dir.join("../themes").canonicalize().unwrap_or_default(),
        // dev mode: navigate from target/debug to src/themes
        exe_dir.join("../../src/themes").canonicalize().unwrap_or_default(),
        // Tauri resource dir
        exe_dir.join("_up_/themes").canonicalize().unwrap_or_default(),
    ];
    candidates.into_iter().find(|p| p.is_dir())
}

fn user_themes_dir() -> Option<PathBuf> {
    let home = dirs::home_dir()?;
    let dir = home.join(".claude-pet").join("themes");
    if dir.is_dir() {
        Some(dir)
    } else {
        None
    }
}

fn load_themes_from_dir(dir: &PathBuf, builtin: bool) -> Vec<ThemeInfo> {
    let mut themes = Vec::new();
    let entries = match fs::read_dir(dir) {
        Ok(e) => e,
        Err(_) => return themes,
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }

        let config_path = path.join("config.json");
        if !config_path.exists() {
            continue;
        }

        let text = match fs::read_to_string(&config_path) {
            Ok(t) => t,
            Err(_) => continue,
        };

        let config: serde_json::Value = match serde_json::from_str(&text) {
            Ok(c) => c,
            Err(_) => continue,
        };

        let id = entry.file_name().to_string_lossy().to_string();
        let name = config
            .get("name")
            .and_then(|v| v.as_str())
            .unwrap_or(&id)
            .to_string();
        let theme_type = config
            .get("type")
            .and_then(|v| v.as_str())
            .unwrap_or("emoji")
            .to_string();
        let states = config
            .get("states")
            .cloned()
            .unwrap_or(serde_json::json!({}));
        let colors = config.get("colors").cloned();
        let font = config.get("font").cloned();

        themes.push(ThemeInfo {
            id,
            name,
            theme_type,
            states,
            colors,
            font,
            builtin,
        });
    }

    themes
}

#[tauri::command]
pub fn list_themes() -> Vec<ThemeInfo> {
    let mut themes = Vec::new();

    if let Some(dir) = builtin_themes_dir() {
        themes.extend(load_themes_from_dir(&dir, true));
    }

    if let Some(dir) = user_themes_dir() {
        themes.extend(load_themes_from_dir(&dir, false));
    }

    themes
}

#[tauri::command]
pub fn get_theme_image(theme_id: String, filename: String) -> Result<String, String> {
    // Path traversal prevention
    if theme_id.contains("..")
        || theme_id.contains('/')
        || theme_id.contains('\\')
        || filename.contains("..")
        || filename.contains('/')
        || filename.contains('\\')
    {
        return Err("Invalid path".to_string());
    }

    // Search in user themes first, then builtin (user overrides builtin)
    let candidates: Vec<PathBuf> = [user_themes_dir(), builtin_themes_dir()]
        .into_iter()
        .flatten()
        .map(|dir| dir.join(&theme_id).join(&filename))
        .collect();

    let file_path = candidates
        .iter()
        .find(|p| p.is_file())
        .ok_or_else(|| format!("Image not found: {theme_id}/{filename}"))?;

    let data = fs::read(file_path).map_err(|e| format!("Read error: {e}"))?;

    let mime = match file_path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
    {
        "png" => "image/png",
        "gif" => "image/gif",
        "jpg" | "jpeg" => "image/jpeg",
        "webp" => "image/webp",
        "svg" => "image/svg+xml",
        "ttf" => "font/ttf",
        "woff" => "font/woff",
        "woff2" => "font/woff2",
        _ => "application/octet-stream",
    };

    let b64 = base64::engine::general_purpose::STANDARD.encode(&data);
    Ok(format!("data:{mime};base64,{b64}"))
}
