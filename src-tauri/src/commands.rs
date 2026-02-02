use tauri::{AppHandle, Manager};
use sqlx::SqlitePool;

use crate::models::HabitDay;

#[tauri::command]
pub async fn get_habit_data(app: AppHandle) -> Result<Vec<HabitDay>, String> {
    let pool = app
        .try_state::<SqlitePool>()
        .ok_or_else(|| "Database not initialized yet".to_string())?;

    let habits = sqlx::query_as::<_, HabitDay>("SELECT date, state FROM habits ORDER BY date")
        .fetch_all(pool.inner())
        .await
        .map_err(|e| e.to_string())?;

    Ok(habits)
}

#[tauri::command]
pub async fn save_habit_day(app: AppHandle, date: String, state: i32) -> Result<(), String> {
    let pool = app
        .try_state::<SqlitePool>()
        .ok_or_else(|| "Database not initialized yet".to_string())?;

    sqlx::query(
        r#"
        INSERT INTO habits (date, state)
        VALUES (?, ?)
        ON CONFLICT(date) DO UPDATE SET
            state = excluded.state,
            updated_at = CURRENT_TIMESTAMP
        "#,
    )
    .bind(date)
    .bind(state)
    .execute(pool.inner())
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn delete_habit_day(app: AppHandle, date: String) -> Result<(), String> {
    let pool = app
        .try_state::<SqlitePool>()
        .ok_or_else(|| "Database not initialized yet".to_string())?;

    sqlx::query("DELETE FROM habits WHERE date = ?")
        .bind(date)
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}