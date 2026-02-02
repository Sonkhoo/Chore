import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

import { Heatmap, DayData } from './components/Heatmap';
import "./App.css";

function App() {
  const [data, setData] = useState<DayData[]>(() => {
    const arr: DayData[] = [];
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - (364 - i));
      arr.push({ date: d.toISOString().split('T')[0], state: 0 });
    }
    return arr;
  });

  // Load data from database on mount
  useEffect(() => {
    loadHabitData();
  }, []);

  const loadHabitData = async () => {
    try {
      const dbData = await invoke<Array<{ date: string; state: number }>>('get_habit_data');
      
      // Merge database data with initial data
      setData(prev => {
        const updated = [...prev];
        dbData.forEach(dbDay => {
          const index = updated.findIndex(d => d.date === dbDay.date);
          if (index !== -1) {
            updated[index] = { date: dbDay.date, state: dbDay.state as 0 | 1 | 2 };
          }
        });
        return updated;
      });
    } catch (error) {
      console.error('Failed to load habit data:', error);
    }
  };

  // Handler to update a day's state (cycle 0->1->2->0)
  const handleDayClick = async (date: string) => {
    const currentDay = data.find(d => d.date === date);
    const newState = currentDay ? ((currentDay.state + 1) % 3) as 0 | 1 | 2 : 1;
    
    // Update UI immediately
    setData(prev => prev.map(day =>
      day.date === date ? { ...day, state: newState } : day
    ));

    // Save to database
    try {
      await invoke('save_habit_day', { date, state: newState });
    } catch (error) {
      console.error('Failed to save habit day:', error);
      // Revert on error
      await loadHabitData();
    }
  };

  return (
    <main className="container" style={{ background: 'transparent' }}>
      <Heatmap data={data} onDayClick={handleDayClick} />
    </main>
  );
}

export default App;