use tauri_plugin_sql::{Migration, MigrationKind};

pub fn migrations() -> Vec<Migration> {
    vec![Migration {
        version: 1,
        description: "create_habits_table",
        kind: MigrationKind::Up,
        sql: r#"
        CREATE TABLE IF NOT EXISTS habits (
            date TEXT PRIMARY KEY,
            state INTEGER NOT NULL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        "#,
    }]
}
