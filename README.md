# Project: Dev Contribution Widget (Windows)

> Lightweight Windows desktop widget that shows GitHub + LeetCode contribution heatmaps with zero friction.


## 1. Final Tech Stack (Locked)

### Core

* **Tauri** (Rust backend)
* **WebView2** (system-provided)
* **React + TypeScript** (UI)
* **Vite** (bundler)

### Data & Storage

* **GitHub GraphQL API**
* **LeetCode GraphQL (unofficial)**
* **SQLite (via `tauri-plugin-sql`)**
  (JSON is acceptable for MVP, SQLite for scale)

### Styling

* **CSS Grid** (heatmap)
* **CSS Variables** (themes)
* No heavy UI libraries

### OS Integration

* Tauri Tray API
* Window flags (frameless, skip taskbar)
* Startup via user startup folder

---

## 2. Repository Structure
```
dev-contribution-widget/
├── src/                         # FRONTEND (React)
│   ├── components/              # Pure UI
│   │   ├── Heatmap.tsx
│   │   ├── DayCell.tsx
│   │   └── SettingsModal.tsx
│   │
│   ├── services/                # Thin IPC clients ONLY
│   │   ├── github.ts             # invoke('fetch_github')
│   │   ├── leetcode.ts           # invoke('fetch_leetcode')
│   │   └── cache.ts              # invoke('load_cache')
│   │
│   ├── styles/
│   ├── App.tsx
│   └── main.tsx
│
├── src-tauri/                    # BACKEND (Rust)
│   ├── src/
│   │   ├── main.rs               # app bootstrap
│   │   ├── commands/             # IPC boundary (IMPORTANT)
│   │   │   ├── github.rs
│   │   │   ├── leetcode.rs
│   │   │   └── settings.rs
│   │   │
│   │   ├── services/             # business logic
│   │   │   ├── github.rs          # GraphQL calls
│   │   │   ├── leetcode.rs
│   │   │   ├── scheduler.rs
│   │   │   └── cache.rs
│   │   │
│   │   ├── storage/              # persistence
│   │   │   ├── sqlite.rs
│   │   │   └── secure.rs          # keychain / secrets
│   │   │
│   │   ├── tray.rs               # tray menu
│   │   └── window.rs             # widget window logic
│   │
│   ├── tauri.conf.json
│   └── Cargo.toml
```

---

## 3. Step-by-Step Implementation Plan

---

## STEP 1: Project Bootstrapping

```bash
npm create tauri-app
# Select:
# Frontend: React + TS
# Bundler: Vite
```

Verify:

* App launches
* WebView loads
* Tray icon works

---

## STEP 2: Window Configuration (Critical)

In `tauri.conf.json`:

```json
{
  "windows": [
    {
      "decorations": false,
      "transparent": true,
      "alwaysOnTop": true,
      "skipTaskbar": true,
      "resizable": false,
      "focus": false
    }
  ]
}
```

This ensures:

* No Alt+Tab
* No taskbar
* No focus stealing
* Native widget feel

---

## STEP 3: Tray-Only Control

`src-tauri/src/tray.rs`

* Show / hide widget
* Open settings
* Quit app

Tray menu:

* Show Widget
* Refresh Now
* Settings
* Launch on Startup
* Quit

---

## STEP 4: GitHub Contributions (Reliable Path)

### GraphQL Query

```graphql
query($username: String!) {
  user(login: $username) {
    contributionsCollection {
      contributionCalendar {
        weeks {
          contributionDays {
            date
            contributionCount
          }
        }
      }
    }
  }
}
```

### Backend

* Fetch once every 4h or during refresh
* Store daily counts in DB
* Never block UI thread

---

## STEP 5: LeetCode Contributions

### Strategy

* POST to `https://leetcode.com/graphql`
* Query `submissionCalendar`
* Convert timestamps → daily counts

### Fallback Rule

If fetch fails:

* Use last cached data
* Show warning icon
* Do NOT error or crash

---

## STEP 6: Scheduler & Caching

### Refresh Policy

* Startup fetch (async)
* Daily refresh at fixed time
* Manual refresh via tray

Cache keys:

```
github:YYYY
leetcode:YYYY
```

SQLite schema:

```sql
date TEXT PRIMARY KEY
github_count INT
leetcode_count INT
```

---

## STEP 7: Heatmap Rendering

### Frontend Logic

* Normalize data into `[date → intensity]`
* Map intensity → color scale
* Render via CSS Grid

No canvas required.

Example grid:

```
7 rows × 53 columns
```

---

## STEP 8: Settings UI

Settings modal:

* GitHub username
* Optional GitHub token
* LeetCode username
* Theme selector
* Refresh interval

Persist via:

* Tauri secure storage

---

## STEP 9: Performance Hardening

* Memoize grid rendering
* Update only changed days
* Use `requestIdleCallback`
* No polling loops

Target:

* CPU idle: ~0%
* RAM: <50MB

---

## STEP 10: Installer & Distribution

```bash
npm run tauri build
```

Outputs:

* `.exe` installer
* Portable `.msi` (optional)

No admin permissions required.

---

## 4. README.md (Production-Ready)

Below is a **copy-paste quality README**.

---

# Dev Contribution Widget

A lightweight Windows desktop widget that displays your **GitHub and LeetCode contribution heatmaps** directly on your desktop.

### Features

* Zero-overhead desktop widget
* GitHub & LeetCode daily contributions
* Offline-first (cached data)
* No Electron, no background bloat
* Tray-only app (invisible when not needed)

### Tech Stack

* Tauri (Rust)
* React + TypeScript
* GitHub GraphQL API
* LeetCode GraphQL (unofficial)

### Installation

1. Download the installer from **Releases**
2. Double-click to install
3. Launch from Start Menu

### Usage

* Right-click tray icon → Settings
* Enter usernames
* Widget appears instantly

### Privacy

* All data stored locally
* No analytics
* No external servers

### Limitations

* LeetCode data uses unofficial endpoints
* Rate limits apply

---