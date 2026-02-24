// Prevents additional console window on Windows in release.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod hook_sender;
mod hook_setup;
mod server;
mod themes;

fn main() {
    // --hook mode: lightweight stdin→TCP sender for Claude Code hooks
    if std::env::args().any(|a| a == "--hook") {
        hook_sender::run_hook_sender();
        return;
    }

    // Normal mode: run the GUI app
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            themes::list_themes,
            themes::get_theme_image,
        ])
        .setup(|app| {
            // Register Claude Code hooks pointing to this exe
            hook_setup::setup_hooks();

            let handle = app.handle().clone();
            tauri::async_runtime::spawn(server::socket_server(handle));
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
