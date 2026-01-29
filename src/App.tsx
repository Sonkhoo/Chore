import { useState, useEffect } from 'react';
import { Heatmap, DayData } from './components/Heatmap';
import "./App.css";

function App() {
  const [data, setData] = useState<DayData[]>([]);

  useEffect(() => {
    // Generate mock data for the last 130 days (~4 months)
    const mockData = Array.from({ length: 130 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (130 - i));

      const random = Math.random();
      let github = 0;
      let leetcode = 0;

      if (random > 0.7) {
        github = Math.floor(Math.random() * 8);
      }
      if (random > 0.85) {
        leetcode = Math.floor(Math.random() * 5);
      }

      return {
        date: date.toISOString().split('T')[0],
        github,
        leetcode
      };
    });

    setData(mockData);
  }, []);

  return (
    <main className="container" style={{ background: 'transparent' }}>
      <Heatmap data={data} />
    </main>
  );
}

export default App;
