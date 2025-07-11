import 'bootstrap/dist/css/bootstrap.min.css';

import './care-schedule.css';
import React, { useState } from 'react';
import usePumpSchedule from './usePumpSchedule';


function CareSchedule() {
  const TABS = [
    { key: 'water', label: 'Water' },
    { key: 'grow_light', label: 'Grow Light' },
    { key: 'fan', label: 'Fan' }
  ];
  const [activeTab, setActiveTab] = useState<string>(TABS[0].key);

  // Watering schedule state
  const [time, setTime] = useState<string>('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'bi-weekly'>('daily');
  const [enabled, setEnabled] = useState<boolean>(false);

  // Use the scheduling hook for the water tab
  usePumpSchedule({
    enabled,
    time,
    frequency,
    urlOn: "http://192.168.50.169/fan1/on",
    urlOff: "http://192.168.50.169/fan1/off"
  });

  return (
    <div className="landing-page">
      <div className="schedule-container">
        <header className="d-flex justify-content-center align-items-center p-3 mb-3">
          <h1 className="text-center">Care Schedule</h1>
        </header>

        <ul className="nav nav-tabs" id="myTab" role="tablist">
          {TABS.map(tab => (
            <li className="nav-item" role="presentation" key={tab.key}>
              <button
                className={`nav-link${activeTab === tab.key ? ' active' : ''}`}
                id={`${tab.key}-tab`}
                type="button"
                role="tab"
                aria-controls={`${tab.key}-tab-pane`}
                aria-selected={activeTab === tab.key}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>

        <div className="tab-content" id="myTabContent">
          {/* Water Tab */}
          <div
            className={`tab-pane fade${activeTab === 'water' ? ' show active' : ''}`}
            id="water-tab-pane"
            role="tabpanel"
            aria-labelledby="water-tab"
            tabIndex={0}
          >
            <div className="wtr-in mb-2">
              <label htmlFor="wtr-time" className="form-label mb-0 me-2">Schedule:</label>
              <input
                type="time"
                id="wtr-time"
                className="form-control form-control-sm me-2"
                value={time}
                onChange={e => setTime(e.target.value)}
                disabled={enabled}
              />
            </div>
            <div className="wtr-in mb-2">
              <label htmlFor="wtr-frequency" className="form-label mb-0 me-2">Frequency:</label>
              <select
                id="wtr-frequency"
                className="form-select form-select-sm me-2"
                value={frequency}
                onChange={e => setFrequency(e.target.value as 'daily' | 'weekly' | 'bi-weekly')}
                disabled={enabled}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="bi-weekly">Bi-Weekly</option>
              </select>
            </div>
            {/* Switch */}
            <div className="form-check form-switch">
              <label className="switch">
                <input
                  className="form-check-input que-switch"
                  type="checkbox"
                  id="checkNativeSwitch"
                  checked={enabled}
                  onChange={e => setEnabled(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          {/* Grow Light Tab */}
          <div
            className={`tab-pane fade${activeTab === 'grow_light' ? ' show active' : ''}`}
            id="grow_light-tab-pane"
            role="tabpanel"
            aria-labelledby="grow_light-tab"
            tabIndex={0}
          >
            <button>hi</button>
          </div>

          {/* Fan Tab */}
          <div
            className={`tab-pane fade${activeTab === 'fan' ? ' show active' : ''}`}
            id="fan-tab-pane"
            role="tabpanel"
            aria-labelledby="fan-tab"
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