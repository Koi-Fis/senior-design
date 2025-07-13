import 'bootstrap/dist/css/bootstrap.min.css';

import './care-schedule.css';
import React, { useState } from 'react';
import useDeviceSchedule from './usePumpSchedule';


function CareSchedule() {
  const TABS = [
    { key: 'water', label: 'Water' },
    { key: 'grow_light', label: 'Grow Light' },
    { key: 'fan', label: 'Fan' }
  ];
  const [activeTab, setActiveTab] = useState<string>(TABS[0].key);

  // Watering schedule state
  const [time, setTime] = useState<string>('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'bi-weekly' | 'every other day'>('daily');
  const [waterEnabled, setWaterEnabled] = useState(false);
  const [LightEnabled, setLightEnabled] = useState(false);
  const [FanEnabled, setFanEnabled] = useState(false);


  // Use the scheduling hook for the water tab
  useDeviceSchedule({
    enabled: waterEnabled,
    time,
    frequency,
    urlOn: "http://192.168.50.169/water/on",
    urlOff: "http://192.168.50.169/water/off"
  });

  // Grow light schedule
useDeviceSchedule({
  enabled: LightEnabled,
  time,
  frequency,
  urlOn: "http://192.168.50.169/grow_light/on",
  urlOff: "http://192.168.50.169/grow_light/off"
});

// Fan schedule
useDeviceSchedule({
  enabled: FanEnabled,
  time,
  frequency,
  urlOn: "http://192.168.50.169/fan/on",
  urlOff: "http://192.168.50.169/fan/off"
});

  return (
    <div className="landing-page">
      <div className="schedule-container">
        <header className="d-flex justify-content-center align-items-center p-3 mb-3">
          <h1 className="text-center">&#127804; Care Schedule</h1>
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
            <div className="wtr-in">
              <label htmlFor="wtr-time" className="form-label">Schedule:</label>
              <input
                type="time"
                id="wtr-time"
                className="form-control form-control-sm me-2"
                value={time}
                onChange={e => setTime(e.target.value)}
                disabled={waterEnabled}
              />
            </div>
            <div className="wtr-in">
              <label htmlFor="wtr-frequency" className="form-label">Frequency:</label>
              <select
                id="wtr-frequency"
                className="form-select form-select-sm me-2"
                value={frequency}
                onChange={e => setFrequency(e.target.value as 'daily' | 'every other day' | 'weekly' | 'bi-weekly')}
                disabled={waterEnabled}
              >
                <option value="daily">Daily</option>
                <option value="every other day">Every other day</option>
                <option value="weekly">Weekly</option>
                <option value="bi-weekly">Bi-Weekly</option>
              </select>
            </div>
            {/* Switch */}
            <div className="form-check form-switch switch">
              <label className="switch">
                <input
                  className="form-check-input que-switch"
                  type="checkbox"
                  id="checkNativeSwitch"
                  checked={waterEnabled}
                  onChange={e => setWaterEnabled(e.target.checked)}
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
             <div className="grow-light-in wtr-in">
              <label htmlFor="grow-light-time" className="form-label">Schedule:</label>
              <input
                type="time"
                id="grow-light-time"
                className="form-control form-control-sm me-2"
                value={time}
                onChange={e => setTime(e.target.value)}
                disabled={LightEnabled}
              />
            </div>
            <div className="grow-light-in wtr-in">
              <label htmlFor="grow-light-frequency" className="form-label">Frequency:</label>
              <select
                id="grow-light-frequency"
                className="form-select form-select-sm me-2"
                value={frequency}
                onChange={e => setFrequency(e.target.value as 'daily' | 'every other day' | 'weekly' | 'bi-weekly')}
                disabled={LightEnabled}
              >
                <option value="daily">Daily</option>
                <option value="every other day">Every other day</option>
                <option value="weekly">Weekly</option>
                <option value="bi-weekly">Bi-Weekly</option>

              </select>
            </div>
            {/* Switch */}
            <div className="form-check form-switch switch">
              <label className="switch">
                <input
                  className="form-check-input que-switch"
                  type="checkbox"
                  id="checkNativeSwitch"
                  checked={LightEnabled}
                  onChange={e => setLightEnabled(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          {/* Fan Tab */}
          <div
          className={`tab-pane fade${activeTab === 'fan' ? ' show active' : ''}`}
          id="fan-tab-pane"
          role="tabpanel"
          aria-labelledby="fan-tab"
          tabIndex={0}
          >
          <div className="fan-in wtr-in">
            <label htmlFor="fan-time" className="form-label">Schedule:</label>
            <input
            type="time"
            id="fan-time"
            className="form-control form-control-sm me-2"
            value={time}
            onChange={e => setTime(e.target.value)}
            disabled={FanEnabled}
            />
          </div>
          <div className="fan-in wtr-in">
            <label htmlFor="fan-frequency" className="form-label">Frequency:</label>
            <select
            id="fan-frequency"
            className="form-select form-select-sm me-2"
            value={frequency}
           onChange={e => setFrequency(e.target.value as 'daily' | 'every other day' | 'weekly' | 'bi-weekly')}
            disabled={FanEnabled}
            >
            <option value="daily">Daily</option>
            <option value="every other day">Every other day</option>
            <option value="weekly">Weekly</option>
            <option value="bi-weekly">Bi-Weekly</option>
            </select>
          </div>
          {/* Switch */}
          <div className="form-check form-switch switch">
            <label className="switch">
            <input
              className="form-check-input que-switch"
              type="checkbox"
              id="fanNativeSwitch"
              checked={FanEnabled}
              onChange={e => setFanEnabled(e.target.checked)}
            />
            <span className="slider"></span>
            </label>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CareSchedule;