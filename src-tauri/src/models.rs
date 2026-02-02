use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct HabitDay {
    pub date: String,
    pub state: i32, // 0 = empty, 1 = half, 2 = full
}
