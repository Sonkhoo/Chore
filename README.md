# Dev Contribution Widget

A lightweight **Windows desktop widget** that displays your **GitHub and LeetCode contribution heatmaps** directly on your desktop — with minimal resource usage and zero friction.

---

## Features

- Always-on desktop widget (tray-controlled)
- GitHub & LeetCode daily contribution heatmaps
- Offline-first with local caching
- No Electron, no background bloat
- No sign-up, no external servers

---

## Tech Stack

- **Tauri (Rust backend)**
- **React + TypeScript**
- **WebView2**
- **GitHub GraphQL API**
- **LeetCode GraphQL (unofficial)**

---

## Installation

1. Download the latest installer from **Releases**
2. Run the installer
3. Launch from the Start Menu

No admin permissions required.

---

## Usage

- Right-click the tray icon → **Settings**
- Enter:
  - GitHub username (token optional)
  - LeetCode username
- The widget appears instantly on your desktop

Controls:
- Show / Hide widget
- Manual refresh
- Launch on startup
- Quit

---

## Privacy & Data Storage

- All data is stored **locally**
- No analytics or telemetry
- GitHub tokens (if provided) are stored using **OS secure storage**
- Contribution data is cached locally for offline use

---

## Performance

- Idle CPU usage ~0%
- Memory usage under 50 MB
- No polling loops
- Background refresh is scheduled and throttled

---

## Limitations

- LeetCode data relies on unofficial APIs
- API rate limits apply
- Windows-only (for now)

---

## License

MIT
