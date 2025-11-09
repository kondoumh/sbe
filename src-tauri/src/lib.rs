use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct FavItem {
    project: String,
    page: String,
    url: String,
}

// IPC Command: Get favorites (PoC example)
#[tauri::command]
fn get_favs() -> Vec<FavItem> {
    println!("get_favs called");
    // In real implementation, this would read from storage
    // For PoC, return mock data
    vec![
        FavItem {
            project: "help-jp".to_string(),
            page: "Scrapboxへようこそ".to_string(),
            url: "https://scrapbox.io/help-jp/Scrapboxへようこそ".to_string(),
        },
        FavItem {
            project: "help-jp".to_string(),
            page: "便利な記法".to_string(),
            url: "https://scrapbox.io/help-jp/便利な記法".to_string(),
        },
    ]
}

// IPC Command: Open new window with URL
#[tauri::command]
async fn open_new_window(app: tauri::AppHandle, url: String, title: String) -> Result<(), String> {
    println!("open_new_window called with url: {}, title: {}", url, title);
    use tauri::WebviewWindowBuilder;
    
    let window_label = format!("window_{}", chrono::Utc::now().timestamp_millis());
    
    WebviewWindowBuilder::new(&app, &window_label, tauri::WebviewUrl::External(url.parse().map_err(|e| format!("Invalid URL: {}", e))?))
        .title(&title)
        .inner_size(1024.0, 800.0)
        .build()
        .map_err(|e| format!("Failed to create window: {}", e))?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![get_favs, open_new_window])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
