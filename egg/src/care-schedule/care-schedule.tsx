import "bootstrap/dist/css/bootstrap.min.css";
import "./care-schedule.css";
import { useState, useEffect } from "react";
import useDeviceSchedule from "./usePumpSchedule";

type Frequency = "daily" | "weekly" | "bi-weekly" | "every other day";

const loadFromStorage = <T,>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) as T : fallback;
  } catch {
    return fallback;
  }
};

const saveToStorage = <T,>(key: string, value: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Handle error
  }
};

const removeFromStorage = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // Handle error
  }
};

// Reusable component for each device tab
type DeviceTabProps = {
  label: string;
  id: string;
  time: string;
  setTime: (t: string) => void;
  frequency: Frequency;
  setFrequency: (f: Frequency) => void;
  enabled: boolean;
  setEnabled: (b: boolean) => void;
  activeTab: string;
};

function DeviceTab({
  id,
  time,
  setTime,
  frequency,
  setFrequency,
  enabled,
  setEnabled,
  activeTab,
}: DeviceTabProps) {
  return (
    <div
      className={`tab-pane fade${activeTab === id ? " show active" : ""}`}
      id={`${id}-tab-pane`}
      role="tabpanel"
      aria-labelledby={`${id}-tab`}
      tabIndex={0}
    >
      <div className="wtr-in">
        <label htmlFor={`${id}-time`} className="form-label">Schedule:</label>
        <input
          type="time"
          id={`${id}-time`}
          className="form-control form-control-sm me-2 bruh"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          disabled={enabled}
        />
      </div>
      <div className="wtr-in">
        <label htmlFor={`${id}-frequency`} className="form-label">Frequency:</label>
        <select
          id={`${id}-frequency`}
          className="form-select form-select-sm me-2 bruh"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as Frequency)}
          disabled={enabled}
        >
          <option value="daily">Daily</option>
          <option value="every other day">Every other day</option>
          <option value="weekly">Weekly</option>
          <option value="bi-weekly">Bi-Weekly</option>
        </select>
      </div>
      <div className="form-check form-switch switch">
        <label className="switch">
          <input
            className="form-check-input que-switch"
            type="checkbox"
            id={`${id}-switch`}
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          <span className="slider"></span>
        </label>
      </div>
    </div>
  );
}

function CareSchedule() {
  const TABS = [
    { key: "water", label: "Water" },
    { key: "grow_light", label: "Grow Light" },
    { key: "fan", label: "Fan" },
  ];
  const [activeTab, setActiveTab] = useState<string>(TABS[0].key);

  // Load enabled-only state
  const enabledWater = loadFromStorage<boolean>("waterEnabled", false);
  const enabledLight = loadFromStorage<boolean>("lightEnabled", false);
  const enabledFan = loadFromStorage<boolean>("fanEnabled", false);

  const [waterTime, setWaterTime] = useState<string>(() =>
    enabledWater ? loadFromStorage("waterTime", "") : ""
  );
  const [waterFreq, setWaterFreq] = useState<Frequency>(() =>
    enabledWater ? loadFromStorage("waterFreq", "daily") : "daily"
  );
  const [waterEnabled, setWaterEnabled] = useState<boolean>(enabledWater);

  const [lightTime, setLightTime] = useState<string>(() =>
    enabledLight ? loadFromStorage("lightTime", "") : ""
  );
  const [lightFreq, setLightFreq] = useState<Frequency>(() =>
    enabledLight ? loadFromStorage("lightFreq", "daily") : "daily"
  );
  const [lightEnabled, setLightEnabled] = useState<boolean>(enabledLight);

  const [fanTime, setFanTime] = useState<string>(() =>
    enabledFan ? loadFromStorage("fanTime", "") : ""
  );
  const [fanFreq, setFanFreq] = useState<Frequency>(() =>
    enabledFan ? loadFromStorage("fanFreq", "daily") : "daily"
  );
  const [fanEnabled, setFanEnabled] = useState<boolean>(enabledFan);

  // Save/remove state for Water
  useEffect(() => {
    if (waterEnabled) {
      saveToStorage("waterTime", waterTime);
      saveToStorage("waterFreq", waterFreq);
      saveToStorage("waterEnabled", true);
    } else {
      removeFromStorage("waterTime");
      removeFromStorage("waterFreq");
      removeFromStorage("waterEnabled");
    }
  }, [waterTime, waterFreq, waterEnabled]);

  // Save/remove state for Grow Light
  useEffect(() => {
    if (lightEnabled) {
      saveToStorage("lightTime", lightTime);
      saveToStorage("lightFreq", lightFreq);
      saveToStorage("lightEnabled", true);
    } else {
      removeFromStorage("lightTime");
      removeFromStorage("lightFreq");
      removeFromStorage("lightEnabled");
    }
  }, [lightTime, lightFreq, lightEnabled]);

  // Save/remove state for Fan
  useEffect(() => {
    if (fanEnabled) {
      saveToStorage("fanTime", fanTime);
      saveToStorage("fanFreq", fanFreq);
      saveToStorage("fanEnabled", true);
    } else {
      removeFromStorage("fanTime");
      removeFromStorage("fanFreq");
      removeFromStorage("fanEnabled");
    }
  }, [fanTime, fanFreq, fanEnabled]);

  // Scheduling hooks
  useDeviceSchedule({
    enabled: waterEnabled,
    time: waterTime,
    frequency: waterFreq,
    urlOn: "http://192.168.50.137/pump/on",
    urlOff: "http://192.168.50.137/pump/off",
  });

  useDeviceSchedule({
    enabled: lightEnabled,
    time: lightTime,
    frequency: lightFreq,
    urlOn: "http://192.168.50.100/grow_light/on",
    urlOff: "http://192.168.50.100/grow_light/off",
  });

  useDeviceSchedule({
    enabled: fanEnabled,
    time: fanTime,
    frequency: fanFreq,
    urlOn: "http://127.0.0.1:5173/api/fans_on",
    urlOff: "http://127.0.0.1:5173/api/fans_off",
  });

  return (
    <div className="landing-page">
      <div className="schedule-container">
        <header className="d-flex justify-content-center align-items-center p-3 mb-3">
          <h1 className="text-center">&#127804; Care Schedule</h1>
        </header>

        <ul className="nav nav-tabs" role="tablist">
          {TABS.map((tab) => (
            <li className="nav-item" role="presentation" key={tab.key}>
              <button
                className={`nav-link${activeTab === tab.key ? " active" : ""} nav-btn`}
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

        <div className="tab-content">
          <DeviceTab
            label="Water"
            id="water"
            time={waterTime}
            setTime={setWaterTime}
            frequency={waterFreq}
            setFrequency={setWaterFreq}
            enabled={waterEnabled}
            setEnabled={setWaterEnabled}
            activeTab={activeTab}
          />
          <DeviceTab
            label="Grow Light"
            id="grow_light"
            time={lightTime}
            setTime={setLightTime}
            frequency={lightFreq}
            setFrequency={setLightFreq}
            enabled={lightEnabled}
            setEnabled={setLightEnabled}
            activeTab={activeTab}
          />
          <DeviceTab
            label="Fan"
            id="fan"
            time={fanTime}
            setTime={setFanTime}
            frequency={fanFreq}
            setFrequency={setFanFreq}
            enabled={fanEnabled}
            setEnabled={setFanEnabled}
            activeTab={activeTab}
          />
        </div>
      </div>
    </div>
  );
}

export default CareSchedule;
