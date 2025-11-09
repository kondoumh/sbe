# Tauri 2.0 PoC for sbe

This is a proof-of-concept demonstrating the migration from Electron to Tauri 2.0 with a multi-window approach.

## What's Implemented

### 1. **Multi-Window Architecture**
- Opens Scrapbox pages in separate native windows (not tabs within a single window)
- Each window is a native OS window with its own webview
- Similar to opening multiple browser windows

### 2. **IPC Command: `get_favs`**
- Demonstrates Rust backend → Frontend communication
- Returns a list of favorite pages
- Equivalent to Electron's `ipcMain.handle('get-favs')`

### 3. **IPC Command: `open_new_window`**
- Opens a new window with specified URL and title
- Demonstrates multi-window management
- Each window can load external URLs (Scrapbox pages)

## How to Run

```bash
# Run the PoC in development mode
npm run tauri:dev

# Or use cargo directly
cargo tauri dev
```

## How It Works

### Frontend (src/tauri-poc.html)
- Uses `@tauri-apps/api` to communicate with Rust backend
- `invoke('get_favs')` - fetches favorites from Rust
- `invoke('open_new_window', { url, title })` - opens new windows

### Backend (src-tauri/src/lib.rs)
- `#[tauri::command]` functions expose Rust functions to frontend
- `get_favs()` - returns mock favorite data
- `open_new_window()` - creates new WebviewWindow with external URL

## Key Differences from Electron

| Electron | Tauri |
|----------|-------|
| BrowserView | WebviewWindow (separate windows) |
| ipcRenderer.invoke() | invoke() from @tauri-apps/api |
| ipcMain.handle() | #[tauri::command] |
| electron-store | tauri-plugin-store (not implemented in PoC) |
| JavaScript main process | Rust backend |

## Multi-Window Approach

Unlike Electron's BrowserView which allows tabs within a single window, Tauri uses separate windows:

**Pros:**
- Native OS window management
- Better memory isolation
- Simpler architecture
- Each window can have different permissions

**Cons:**
- No native tab bar (need to implement in UI if desired)
- More OS windows in taskbar/dock
- Different UX than current implementation

## Next Steps

To complete the migration:

1. **Storage Layer**
   - Add `tauri-plugin-store` for persistent storage
   - Migrate electron-store data format

2. **Convert All IPC Commands**
   - Port ~40+ `ipcMain.handle()` calls to Rust commands
   - Update all frontend calls to use Tauri's `invoke()`

3. **Menu System**
   - Implement native menus using Tauri's menu API
   - Port context menus

4. **Tab Management UI** (optional)
   - If you want tabs instead of separate windows:
     - Build a Vue-based tab component
     - Use iframes or manage window list in frontend
     - Alternative: Use a Tauri plugin for webview embedding

5. **Build & Distribution**
   - Configure Tauri bundler for macOS, Windows, Linux
   - Replace electron-builder with Tauri's bundler

## Testing the PoC

1. Click "Load Favorites" - calls Rust backend and displays mock data
2. Click favorite items - opens them in new windows
3. Click "Open Scrapbox.io" - opens Scrapbox in a new window
4. Click "Open Help-JP" - opens Scrapbox help in a new window

Each button demonstrates the multi-window approach where content loads in separate OS windows.

## File Structure

```
/Users/kondoh/dev/sbe/
├── src/
│   └── tauri-poc.html          # PoC HTML page
├── src-tauri/
│   ├── src/
│   │   ├── main.rs             # Entry point
│   │   └── lib.rs              # IPC commands
│   ├── tauri.conf.json         # Tauri configuration
│   └── Cargo.toml              # Rust dependencies
└── package.json                # Added tauri scripts
```

## Performance Notes

Tauri apps are typically:
- Smaller bundle size (~3-10MB vs 50-100MB for Electron)
- Lower memory usage (no Node.js runtime)
- Faster startup time
- Uses system webview (WebKit on macOS)

## Questions to Consider

1. **Do you want a tab UI?** If yes, we need to build it in the frontend
2. **Storage format**: Keep compatible with Electron version or migrate?
3. **Window management**: Should windows remember positions individually?
4. **Update mechanism**: Tauri has its own updater system
