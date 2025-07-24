import { useState } from 'react';
import CareSchedule from './care-schedule/care-schedule';
import GrowthCompass from './growth-compass/growth-compass';
import Home from './home-page/home';
import './App.css';
import { PlantProvider } from './plant-context/plant-selection';

const pages = [
  { id: 'home', label: 'Home'},
  { id: 'care-schedule', label: 'Care Schedule' },
  { id: 'growth-compass', label: 'Growth Compass' },
];

function App() {
  const [activePage, setActivePage] = useState<string>('care-schedule');



  return (
    <PlantProvider>
      {/* <Routes> */}
        <div className="app-shell">
          {/* Sidebar gets a fixed width */}
          <div className="sidebar">
            <div className="logo-container">
              <div className="logo">

              </div>
            </div>
            {pages.map(page => (
              <button
                key={page.id}
                className={`btn   ${activePage === page.id ? 'active' : ''}`}
                onClick={() => setActivePage(page.id)}
              >
                <span>{page.label}</span>
              </button>
            ))}
            

          </div>
            
          {/* Page container grows to fill the rest */}
          <div className="page-container">
            {activePage == 'home' && <Home />}
            {activePage === 'care-schedule' && <CareSchedule />}
            {activePage === 'growth-compass' && <GrowthCompass />}
            {/* add other pages here when you build them */}
          </div>
        </div>
      {/* </Routes> */}
    </PlantProvider>
  );
}

export default App;