import React, { useEffect, useState, createContext } from "react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";
import GaugeChart from "react-gauge-chart";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import "bootstrap/dist/css/bootstrap.min.css";
import "./growth.css";

// -----------------------------
// Types
// -----------------------------
type PlantDetailData = {
  display_pid: string;
  min_temp: number;
  max_temp: number;
  min_env_humid: number;
  max_env_humid: number;
  min_soil_moist: number;
  max_soil_moist: number;
};

type SensorData = {
  temperature_celcius: number;
  humidity: number;
  moisture_one: number;
  moisture_two: number;
};

// -----------------------------
// Config
// -----------------------------
const PLANTBOOK_TOKEN = "fc6cec3131e4a6873732f919be941bd8736b4836";
const SENSOR_URL = "http://192.168.50.137/data.json";

const plantOptions = [
  { key: "radish andes f1", label: "Radish" },
  { key: "tomato motto f1", label: "Tomato" },
  { key: "spinacia oleracea", label: "Spinach" },
];

// -----------------------------
// Context to Globalize Plant Selection
// -----------------------------
const PlantContext = createContext<{
  selectedPlant: string;
  setSelectedPlant: (value: string) => void;
}>({ selectedPlant: "", setSelectedPlant: () => {} });

// -----------------------------
// Utility: Normalize Moisture
// -----------------------------
function normalizeMoisture(raw: number): number {
  const dry = 0; // 0 = dry (0%)
  const wet = 70; // 70 = wet (100%)
  const clamped = Math.min(Math.max(raw, dry), wet);
  return Math.round((clamped / wet) * 100);
}

// -----------------------------
// Main Component
// -----------------------------
export default function PlantRadarComparison() {
  const [selectedPlant, setSelectedPlant] = useState<string>("radish andes f1");
  const [plantData, setPlantData] = useState<PlantDetailData | null>(null);
  const [sensorData, setSensorData] = useState<SensorData | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const slug = encodeURIComponent(selectedPlant);

        const [plantRes, sensorRes] = await Promise.all([
          fetch(`https://open.plantbook.io/api/v1/plant/detail/${slug}`, {
            headers: {
              Authorization: `Token ${PLANTBOOK_TOKEN}`,
            },
          }),
          fetch(SENSOR_URL),
        ]);

        if (!plantRes.ok || !sensorRes.ok)
          throw new Error("Failed to fetch data");

        const plantJson = await plantRes.json();
        const sensorJson = await sensorRes.json();

        setPlantData(plantJson);

        const latestSensor = sensorJson[sensorJson.length - 1];
        setSensorData(latestSensor);
      } catch (err) {
        console.error(err);
      }
    };

    fetchAll();
  }, [selectedPlant]);

  const radarData =
    plantData && sensorData
      ? [
          {
            metric: "Temperature",
            Sensor: sensorData.temperature_celcius,
            Ideal: (plantData.min_temp + plantData.max_temp) / 2,
          },
          {
            metric: "Humidity",
            Sensor: sensorData.humidity,
            Ideal: (plantData.min_env_humid + plantData.max_env_humid) / 2,
          },
          {
            metric: "Soil Moisture",
            Sensor:
              (normalizeMoisture(sensorData.moisture_one) +
                normalizeMoisture(sensorData.moisture_two)) /
              2,
            Ideal: (plantData.min_soil_moist + plantData.max_soil_moist) / 2,
          },
          {
            metric: "Potassium",
            Sensor: 5,
            Ideal: 10,
          },
          {
            metric: "Phosphorus",
            Sensor: 5,
            Ideal: 10,
          },
          {
            metric: "Nitrogen",
            Sensor: 5,
            Ideal: 20,
          },
        ]
      : [];

  return (
    <PlantContext.Provider value={{ selectedPlant, setSelectedPlant }}>
      <div className="canvas-container py-4">

        <div className="GaugeCharts">
          <div className="gauge-wrapper">
            <div className="gauge-title">Temperature</div>
            <GaugeChart
              id="gauge-chart-temp"
              hideText={true}
              nrOfLevels={3}
              colors={["#679c81", "#eefdf4","#1d1d35"]}
              arcWidth={0.3}
              percent={
                sensorData && plantData
                  ? sensorData.temperature_celcius >
                    (plantData.min_temp + plantData.max_temp) / 2
                    ? 0.8
                    : sensorData.temperature_celcius <
                      (plantData.min_temp + plantData.max_temp) / 2
                    ? 0.2
                    : 0.5
                  : 0
              }
            />
            <div className="gauge-label">
              {sensorData && plantData
                ? sensorData.temperature_celcius >
                  (plantData.min_temp + plantData.max_temp) / 2
                  ? `Hot ${(
                      (sensorData.temperature_celcius * 9) / 5 +
                      32
                    ).toFixed(1)}°F`
                  : sensorData.temperature_celcius <
                    (plantData.min_temp + plantData.max_temp) / 2
                  ? `Cold ${(
                      (sensorData.temperature_celcius * 9) / 5 +
                      32
                    ).toFixed(1)}°F`
                  : `Ideal ${(
                      (sensorData.temperature_celcius * 9) / 5 +
                      32
                    ).toFixed(1)}°F`
                : ""}
            </div>
          </div>

          <div className="gauge-wrapper">
            <div className="gauge-title">Humidity</div>
            <GaugeChart
              id="gauge-chart-humidity"
              hideText={true}
              nrOfLevels={3}
              colors={["#679c81", "#eefdf4","#1d1d35"]}
              arcWidth={0.3}
              percent={
                sensorData && plantData
                  ? sensorData.humidity >
                    (plantData.min_env_humid + plantData.max_env_humid) / 2
                    ? 0.8
                    : sensorData.humidity <
                      (plantData.min_env_humid + plantData.max_env_humid) / 2
                    ? 0.2
                    : 0.5
                  : 0
              }
            />
            <div className="gauge-label">
              {sensorData && plantData
                ? sensorData.humidity >
                  (plantData.min_env_humid + plantData.max_env_humid) / 2
                  ? "High"
                  : sensorData.humidity <
                    (plantData.min_env_humid + plantData.max_env_humid) / 2
                  ? "Low"
                  : "Ideal"
                : ""}
            </div>
          </div>

          <div className="gauge-wrapper">
            <div className="gauge-title">Soil Moisture</div>
            <GaugeChart
              id="gauge-chart-moisture"
              hideText={true}
              nrOfLevels={3}
              colors={["#1d1d35", "#eefdf4", "#679c81"]} // Reversed colors: red=dry, green=ideal, blue=wet
              arcWidth={0.3}
              percent={
                sensorData && plantData
                  ? (normalizeMoisture(sensorData.moisture_one) +
                      normalizeMoisture(sensorData.moisture_two)) /
                    2 /
                    100 // Divide by 100 to get 0-1 range
                  : 0
              }
            />

            <div className="gauge-label">
              {sensorData && plantData
                ? (() => {
                    const avgMoisture =
                      (normalizeMoisture(sensorData.moisture_one) +
                        normalizeMoisture(sensorData.moisture_two)) /
                      2;

                    // Define moisture ranges
                    if (avgMoisture <= 24)
                      return `Dry`;
                    if (avgMoisture >= 25 && avgMoisture <= 70)
                      return `Ideal`;
                    if (avgMoisture > 70)
                      return `Wet`;
                  })()
                : ""}
            </div>
          </div>
        </div>

        <div className="radish-info">
          <h2 className="mb-4">Growth Compass – Sensor vs Ideal</h2>

          <DropdownButton
            id="plant-dropdown"
            title={
              plantOptions.find((opt) => opt.key === selectedPlant)?.label ||
              "Select Plant"
            }
          >
            {plantOptions.map((opt) => (
              <Dropdown.Item
                as="button"
                key={opt.key}
                onClick={() => setSelectedPlant(opt.key)}
              >
                {opt.label}
              </Dropdown.Item>
            ))}
          </DropdownButton>

          {radarData.length > 0 && (
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar
                  name="Sensor"
                  dataKey="Sensor"
                  stroke="#ff4d4d"
                  fill="#ff4d4d"
                  fillOpacity={0.4}
                />
                <Radar
                  name="Ideal"
                  dataKey="Ideal"
                  stroke="#4caf50"
                  fill="#4caf50"
                  fillOpacity={0.4}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="radish-info"></div>
      </div>
    </PlantContext.Provider>
  );
}
