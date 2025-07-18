import "bootstrap/dist/css/bootstrap.min.css";
import "./care-schedule.css";
import React, { useState } from "react";
import useDeviceSchedule from "./usePumpSchedule";

// Reusable component for each device tab
type DeviceTabProps = {
  label: string;
  id: string;
  time: string;
  setTime: (t: string) => void;
  frequency: "daily" | "weekly" | "bi-weekly" | "every other day";
  setFrequency: (f: any) => void;
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
        <label htmlFor={`${id}-time`} className="form-label">
          Schedule:
        </label>
        <input
          type="time"
          id={`${id}-time`}
          className="form-control form-control-sm me-2"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          disabled={enabled}
        />
      </div>
      <div className="wtr-in">
        <label htmlFor={`${id}-frequency`} className="form-label">
          Frequency:
        </label>
        <select
          id={`${id}-frequency`}
          className="form-select form-select-sm me-2"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as any)}
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

  // Watering
  const [waterTime, setWaterTime] = useState("");
  const [waterFreq, setWaterFreq] = useState<
    "daily" | "weekly" | "bi-weekly" | "every other day"
  >("daily");
  const [waterEnabled, setWaterEnabled] = useState(false);

  // Grow Light
  const [lightTime, setLightTime] = useState("");
  const [lightFreq, setLightFreq] = useState<
    "daily" | "weekly" | "bi-weekly" | "every other day"
  >("daily");
  const [lightEnabled, setLightEnabled] = useState(false);

  // Fan
  const [fanTime, setFanTime] = useState("");
  const [fanFreq, setFanFreq] = useState<
    "daily" | "weekly" | "bi-weekly" | "every other day"
  >("daily");
  const [fanEnabled, setFanEnabled] = useState(false);

  // Scheduling hooks
  useDeviceSchedule({
    enabled: waterEnabled,
    time: waterTime,
    frequency: waterFreq,
    urlOn: "http://192.168.50.100/pump/on",
    urlOff: "http://192.168.50.100/pump/off",
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
    //urlOn: ["http://192.168.50.100/fan1/on", "http://192.168.50.100/fan2/on"],
    //urlOff: ["http://192.168.50.100/fan1/off", "http://192.168.50.100/fan2/off"],

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
                className={`nav-link${activeTab === tab.key ? " active" : ""}`}
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
