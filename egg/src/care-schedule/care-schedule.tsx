import 'bootstrap/dist/css/bootstrap.min.css';
import './care-schedule.css';
import React, { useState } from 'react';

/* If you want to use the toggle CSS, add the following import at the top of your file: */
import "bootstrap5-toggle/css/bootstrap5-toggle.min.css";

function CareSchedule() {
  const [activeTab, setActiveTab] = useState('water');
  const [toggleWater, setToggleWater] = useState(false);

  return (
    <div className="landing-page">
      <div className = "schedule-container">
        {/* adding padding to the header */}
        <header className="d-flex justify-content-center align-items-center p-3 mb-3">
          <h1 className="text-center">Care Schedule</h1>
        </header>
        {/* Navigation Tabs */}
      <ul className="nav nav-tabs" id="myTab" role="tablist">
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link${activeTab === 'water' ? ' active' : ''}`}
            id="water-tab"
            type="button"
            role="tab"
            aria-controls="water-tab-pane"
            aria-selected={activeTab === 'water'}
            onClick={() => setActiveTab('water')}
          >
            Water
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link${activeTab === 'Grow Light ' ? ' active' : ''}`}
            id="Grow Light -tab"
            type="button"
            role="tab"
            aria-controls="Grow Light -tab-pane"
            aria-selected={activeTab === 'Grow Light '}
            onClick={() => setActiveTab('Grow Light ')}
          >
            Grow Light 
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link${activeTab === 'Fan' ? ' active' : ''}`}
            id="Fan-tab"
            type="button"
            role="tab"
            aria-controls="Fan-tab-pane"
            aria-selected={activeTab === 'Fan'}
            onClick={() => setActiveTab('Fan')}
          >
            Fan
          </button>
        </li>
      </ul>
      {/* Tab Content */}
      <div className="tab-content" id="myTabContent">
        <div
          className={`tab-pane fade${activeTab === 'water' ? ' show active' : ''}`}
          id="water-tab-pane"
          role="tabpanel"
          aria-labelledby="water-tab"
          tabIndex={0}
        >
          <div className=" wtr-in">
            <label htmlFor="wtr-time" className="form-label mb-0 me-2">Schedule:</label>
            <input type="time" id="wtr-time" className="form-control form-control-sm me-2" />
          </div>
          <div className="wtr-in">
            <label htmlFor="wtr-frequency" className="form-label mb-0 me-2">Frequency:</label>
            <select id="wtr-frequency" className="form-select form-select-sm me-2">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="bi-weekly">Bi-Weekly</option>
            </select>
          </div>
          {/* save button switch to que and deque schedule */}
          <div className="form-check form-switch">
            <label className="switch">
              <input className="form-check-input que-switch" type="checkbox" id="checkNativeSwitch" />
              <span className="slider">
              </span>
            </label>
          </div>
          
        </div>
        <div
          className={`tab-pane fade${activeTab === 'Grow Light ' ? ' show active' : ''}`}
          id="Grow Light -tab-pane"
          role="tabpanel"
          aria-labelledby="Grow Light -tab"
          tabIndex={0}
        >
          <button>hi</button>
        </div>
        <div
          className={`tab-pane fade${activeTab === 'Fan' ? ' show active' : ''}`}
          id="Fan-tab-pane"
          role="tabpanel"
          aria-labelledby="Fan-tab"
          tabIndex={0}
        >
          ...
        </div>
      </div>
      </div>
    </div>
  );
}

export default CareSchedule;
