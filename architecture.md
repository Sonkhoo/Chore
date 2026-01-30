# Dev Contribution Widget — Internal Architecture

### Purpose

This document defines the **internal system architecture**, boundaries, and implementation order for the **Dev Contribution Widget (Windows)**.

Goals:

* Deterministic behavior
* Zero UI blocking
* Secure credential handling
* Offline-first correctness
* Long-term maintainability

Non-goals (explicit):

* Auto-updates (later)
* Notifications (later)
* Cross-device sync
* Cloud backend

---

## 1. Architectural Principles

1. **Frontend is dumb**

   * No business logic
   * No API calls
   * No persistence logic

2. **Rust backend is authoritative**

   * Owns network, storage, scheduling
   * Frontend only invokes commands

3. **Secrets ≠ Data**

   * Secrets → OS secure storage
   * Data → SQLite

4. **Fail closed, not loud**

   * No crashes
   * No blocking UI
   * Cached data is always preferred to errors

---

## 2. High-Level Data Flow

```
┌──────────┐
│ Frontend │
│ (React)  │
└────┬─────┘
     │ invoke()
     ▼
┌──────────────┐
│ Tauri IPC    │  ← hard boundary
│ commands/*  │
└────┬─────────┘
     ▼
┌──────────────┐
│ services/*  │
│ (logic)     │
└────┬─────────┘
     ▼
┌──────────────┐
│ storage/*   │
│ SQLite +    │
│ SecureStore │
└──────────────┘
```

---


## 3. Directory Structure

```
dev-contribution-widget/
│
├── docs/
│   └── ARCHITECTURE.md              # Internal-only blueprint
│
├── src/                             # FRONTEND (React + TS)
│   │
│   ├── app/                         # App bootstrap & layout
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── routes.tsx               # (if ever needed)
│   │
│   ├── components/                  # Pure, stateless UI
│   │   ├── Heatmap/
│   │   │   ├── Heatmap.tsx
│   │   │   ├── DayCell.tsx
│   │   │   └── heatmap.utils.ts     # UI-only math (color/intensity)
│   │   │
│   │   ├── Settings/
│   │   │   ├── SettingsModal.tsx
│   │   │   └── SettingsForm.tsx
│   │   │
│   │   └── StatusIndicator.tsx       # offline / warning badge
│   │
│   ├── services/                    # TS-side logic (smart layer)
│   │   ├── github.service.ts        # fetch + normalize
│   │   ├── leetcode.service.ts
│   │   ├── scheduler.service.ts     # frontend orchestration only
│   │   └── refresh.service.ts
│   │
│   ├── ipc/                         # HARD IPC BOUNDARY
│   │   ├── index.ts                 # invoke wrapper
│   │   ├── storage.ipc.ts           # SQLite calls
│   │   ├── secure.ipc.ts            # keychain calls
│   │   ├── window.ipc.ts            # show/hide/position
│   │   └── tray.ipc.ts
│   │
│   ├── models/                      # Shared DTOs (TS side)
│   │   ├── heatmap.model.ts
│   │   ├── contribution.model.ts
│   │   └── settings.model.ts
│   │
│   ├── state/                       # UI state only (no persistence)
│   │   ├── widget.store.ts
│   │   └── settings.store.ts
│   │
│   ├── styles/
│   │   ├── themes.css
│   │   ├── heatmap.css
│   │   └── globals.css
│   │
│   └── utils/
│       ├── date.ts                  # formatting only
│       └── debounce.ts
│
├── src-tauri/                       # BACKEND (Rust – thin layer)
│   │
│   ├── src/
│   │   ├── main.rs                  # app bootstrap
│   │   │
│   │   ├── commands/                # IPC boundary (STRICT)
│   │   │   ├── github.rs
│   │   │   ├── leetcode.rs
│   │   │   ├── storage.rs
│   │   │   ├── secure.rs
│   │   │   ├── tray.rs
│   │   │   └── window.rs
│   │   │
│   │   ├── services/                # minimal Rust logic
│   │   │   ├── scheduler.rs
│   │   │   └── oauth.rs              # PKCE only
│   │   │
│   │   ├── storage/
│   │   │   ├── sqlite.rs
│   │   │   └── secure.rs
│   │   │
│   │   ├── platform/                # Windows-specific glue
│   │   │   ├── startup.rs
│   │   │   └── power.rs              # sleep / resume hooks
│   │   │
│   │   ├── models/                  # Rust-side DTOs
│   │   │   ├── contribution.rs
│   │   │   ├── heatmap.rs
│   │   │   └── settings.rs
│   │   │
│   │   └── utils/
│   │       └── time.rs
│   │
│   ├── tauri.conf.json
│   └── Cargo.toml
│
├── public/
│   └── tray-icon.png
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md                        # User-facing only

```



## 4. Module Responsibilities (Strict)

### `commands/` (IPC Boundary)

**Rules**

* No HTTP calls
* No SQL
* No business logic
* Argument validation only

**Purpose**

* Translate frontend intent → service call
* Return serialized DTOs

Example:

```rust
#[tauri::command]
async fn fetch_github(year: i32) -> Result<HeatmapData, String>
```

---

### `services/github.rs`

**Responsibilities**

* OAuth (PKCE)
* GraphQL queries
* Rate-limit handling
* Data normalization

**Never**

* Talk to frontend
* Store secrets directly

---

### `services/leetcode.rs`

**Responsibilities**

* POST to unofficial GraphQL
* Convert timestamps → daily buckets
* Handle partial failures

**Failure Strategy (locked)**

* Strict mode:

  * Return last cached data
  * Surface warning flag

---

### `services/scheduler.rs`

**Hybrid Scheduler (Locked)**

Triggers:

* App startup
* Resume from sleep
* Fixed interval (default 4h)
* Manual tray refresh

Rules:

* Never overlap runs
* Never block main thread
* Skip refresh if last success < interval

---

### `storage/secure.rs`

**Purpose**

* OS-level secret storage

Stores:

* GitHub OAuth access token
* Refresh token (if introduced later)
* PKCE verifier (temporary)

Never stores:

* Contribution data
* Usernames
* UI preferences

---

### `storage/sqlite.rs`

**Purpose**

* Durable, queryable app state

#### Schema (Final)

```sql
-- daily counts
CREATE TABLE contributions (
  date TEXT PRIMARY KEY, -- YYYY-MM-DD
  github_count INTEGER NOT NULL DEFAULT 0,
  leetcode_count INTEGER NOT NULL DEFAULT 0
);

-- yearly aggregates
CREATE TABLE yearly_stats (
  year INTEGER PRIMARY KEY,
  github_total INTEGER NOT NULL,
  leetcode_total INTEGER NOT NULL,
  last_updated TEXT NOT NULL
);
```

Notes:

* Full history supported
* No raw API JSON stored
* Deterministic recomputation possible

---

## 5. Authentication Model (Locked)

### GitHub

* OAuth 2.0 + PKCE
* System browser only
* Token optional but recommended
* Stored via OS secure storage

Fallback:

* If token missing → public GraphQL

---

### LeetCode

* Username-only
* No authentication
* Best-effort, strict failure mode
* Cached data always returned

---

## 6. Offline & Failure Behavior (Locked)

When offline or API fails:

* Use **last known good data**
* No UI error dialogs
* Optional warning indicator in UI

No retries in tight loops.

---

## 7. Widget Persistence (Windows)

Persist:

* Window position
* Monitor ID
* Visibility state

Restore on:

* App launch
* System reboot
* Monitor reconnect

Edge case:

* If monitor missing → snap to primary display

---

## 8. Frontend Rendering Contract

Backend returns:

```ts
type HeatmapData = {
  date: string;        // YYYY-MM-DD
  intensity: number;   // normalized 0–4
}
```

Frontend responsibilities:

* Grid layout
* Color mapping
* Memoization

No date math in UI.

---

## 9. Performance Constraints

Target:

* CPU idle: ~0%
* RAM: <50 MB
* Network: burst-only

Hard rules:

* No polling loops
* No timers in frontend
* All background work async

---

## 10. Security Guarantees

* Tokens never exposed to JS
* SQLite contains no secrets
* PKCE verifier deleted after exchange
* No background listeners

---

## 11. Extension Points (Future)

Planned later:

* Auto-update service
* Notifications
* Other platforms

Current architecture does not block these.

---

# Implementation Checklist (Follow in Order)

### Phase 1 — Skeleton

1. Bootstrap Tauri + React
2. Tray-only app
3. Frameless widget window
4. Show/hide via tray

### Phase 2 — Storage

5. Add SQLite plugin
6. Create schema + migrations
7. Secure storage abstraction

### Phase 3 — Auth

8. Implement GitHub OAuth PKCE
9. Token storage + retrieval
10. Public fallback mode

### Phase 4 — Data Fetch

11. GitHub GraphQL service
12. LeetCode GraphQL service
13. Normalize daily data
14. Persist to SQLite

### Phase 5 — Scheduler

15. Startup refresh
16. Resume-from-sleep hook
17. Interval refresh
18. Manual refresh

### Phase 6 — UI

19. Heatmap grid
20. Color scaling
21. Memoization
22. Warning indicator

### Phase 7 — Hardening

23. Offline testing
24. API failure simulation
25. Sleep / resume testing
26. DPI + multi-monitor testing

### Phase 8 — Packaging

27. MSI build
28. Startup registration
29. Clean uninstall verification

---
