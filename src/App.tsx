import { useState, useEffect } from 'react';
import { Heatmap, DayData } from './components/Heatmap';
import { SettingsModal } from './components/SettingsModal';
import { fetchAllContributions } from './services/data-fetcher';
import "./App.css";

function App() {
  const [data, setData] = useState<DayData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // For testing - the user should replace these via a Settings UI later
  const githubUser = "sonkhoo"; // e.g., "saankhadeep"
  const githubToken = "read:user"; // Needs a Classic PAT with 'read:user' scope
  const leetcodeUser = ""; // e.g., "saankha_dev"

  useEffect(() => {
    async function loadData() {
      try {
        const realData = await fetchAllContributions(githubUser, githubToken, leetcodeUser);
        setData(realData);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [githubUser, leetcodeUser, githubToken]);

  // function generateMockData() {
  //   const mockData = Array.from({ length: 365 }, (_, i) => {
  //     const date = new Date();
  //     date.setDate(date.getDate() - (365 - i));
  //     const random = Math.random();
  //     return {
  //       date: date.toISOString().split('T')[0],
  //       github: random > 0.7 ? Math.floor(Math.random() * 8) : 0,
  //       leetcode: random > 0.85 ? Math.floor(Math.random() * 5) : 0
  //     };
  //   });
  //   setData(mockData);
  // }

  return (
    <main className="container" style={{ background: 'transparent' }}>
      <Heatmap data={data} onSettingsClick={() => setIsSettingsOpen(true)} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      {isLoading && <div className="loading-overlay">Syncing...</div>}
      {error && <div className="error-toast">{error}</div>}
    </main>
  );
}

export default App;
