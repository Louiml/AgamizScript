use std::sync::Mutex;

/// Path handed to the app when the OS launched it against a `.ascript` file.
pub struct LaunchArgument(pub Mutex<Option<String>>);

/// Returns the `.ascript` path the OS passed at app launch (if any).
/// Consumed once — a second call returns `None`.
#[tauri::command]
fn get_launched_file(state: tauri::State<'_, LaunchArgument>) -> Option<String> {
    let mut guard = state.0.lock().ok()?;
    guard.take()
}

/// Frontend handshake: report the current platform/desktop skin.
#[tauri::command]
fn app_info() -> serde_json::Value {
    serde_json::json!({
        "name": "Agamiz Script",
        "extension": "ascript",
        "schema": "1.0.0",
    })
}

fn detect_launched_path() -> Option<String> {
    let mut args = std::env::args().skip(1);
    loop {
        match args.next() {
            Some(arg) if arg.ends_with(".ascript") || arg.ends_with(".fountain") || arg.ends_with(".fdx") || arg.ends_with(".srt") || arg.ends_with(".vtt") => {
                return Some(arg);
            }
            Some(_) => continue,
            None => return None,
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_os::init())
        .manage(LaunchArgument(Mutex::new(detect_launched_path())))
        .invoke_handler(tauri::generate_handler![get_launched_file, app_info])
        .run(tauri::generate_context!())
        .expect("error while running Agamiz Script");
}