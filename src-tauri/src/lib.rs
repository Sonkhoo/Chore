use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    path::BaseDirectory,
    Manager,
};
use sqlx::SqlitePool;

mod commands;
mod models;
mod db;

pub fn run() {
    tauri::Builder::default()
        // ---- Plugins ----
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())

        // ---- App setup ----
        .setup(|app| {
            // Get the app data directory and database path using Tauri v2 API
            let db_path = app.path().resolve("chore.db", BaseDirectory::AppData)?;
            std::fs::create_dir_all(db_path.parent().unwrap())
                .expect("failed to create app data dir");
            let db_url = format!("sqlite:{}?mode=rwc", db_path.display());

            // Initialize SQLite pool and run migrations
            let pool = tauri::async_runtime::block_on(async {
                let pool = SqlitePool::connect(&db_url)
                    .await
                    .expect("failed to connect to database");
                for migration in db::migrations() {
                    sqlx::query(&migration.sql)
                        .execute(&pool)
                        .await
                        .expect("failed to run migration");
                }
                pool
            });
            app.manage(pool);

            // Menu items
            let show = MenuItem::with_id(app, "show", "Show Widget", true, None::<&str>)?;
            let hide = MenuItem::with_id(app, "hide", "Hide Widget", true, None::<&str>)?;
            let settings =
                MenuItem::with_id(app, "settings", "Settings", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

            // Menu
            let menu = Menu::with_items(app, &[&show, &hide, &settings, &quit])?;

            // Tray icon
            let _tray = TrayIconBuilder::new()
                .menu(&menu)
                .on_menu_event(|app, event| {
                    match event.id.as_ref() {
                        "quit" => {
                            app.exit(0);
                        }
                        "show" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        "hide" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.hide();
                            }
                        }
                        "settings" => {
                            // TODO: open settings window
                            println!("Settings clicked");
                        }
                        _ => {}
                    }
                })
                .build(app)?;

            Ok(())
        })

        // ---- Commands ----
        .invoke_handler(tauri::generate_handler![
            commands::get_habit_data,
            commands::save_habit_day,
            commands::delete_habit_day,
        ])

        // ---- Run ----
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}