import { useState } from 'react';
import CareSchedule from './care-schedule/care-schedule';
import './App.css';

const pages = [
  { id: 'care-schedule', label: 'Care Schedule' },
  { id: 'growth-compass', label: 'Growth Compass' },
  { id: 'machines', label: 'Machines' },
];

function App() {
  const [activePage, setActivePage] = useState<string | null>(null);



  return (
    <div className="app-shell">
      {/* Sidebar gets a fixed width */}
      <div className="sidebar">
        {pages.map(page => (
          <button
            key={page.id}
            className="sidebar-button"
            onClick={() => setActivePage(page.id)}
          >
            {page.label}
          </button>
        ))}
      </div>

      {/* Page container grows to fill the rest */}
      <div className="page-container">
        {activePage === 'care-schedule' && <CareSchedule />}
        {/* add other pages here when you build them */}
      </div>
    </div>
  );
}

export default App;