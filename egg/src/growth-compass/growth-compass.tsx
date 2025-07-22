import React, { useEffect, useState, createContext } from "react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
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
      <div className="canvas-container">
        {/* Gauge Charts Section */}
        <div className="GaugeCharts">
          <div className="gauge-wrapper">
            <div className="gauge-title">Temperature</div>
            <GaugeChart
              id="gauge-chart-temp"
              hideText={true}
              nrOfLevels={3}
              colors={["#ff6b6b", "#ffd93d", "#6bcf7f"]}
              arcWidth={0.3}
              percent={
                sensorData && plantData
                  ? Math.min(Math.max(sensorData.temperature_celcius / 40, 0), 1)
                  : 0
              }
            />
            <div className="gauge-label">
              {sensorData && plantData
                ? (() => {
                    const tempF = (sensorData.temperature_celcius * 9) / 5 + 32;
                    const idealMin = (plantData.min_temp * 9) / 5 + 32;
                    const idealMax = (plantData.max_temp * 9) / 5 + 32;
                    
                    if (tempF < idealMin) return `Cold ${tempF.toFixed(1)}°F`;
                    if (tempF > idealMax) return `Hot ${tempF.toFixed(1)}°F`;
                    return `Ideal ${tempF.toFixed(1)}°F`;
                  })()
                : "Loading..."}
            </div>
          </div>

          <div className="gauge-wrapper">
            <div className="gauge-title">Humidity</div>
            <GaugeChart
              id="gauge-chart-humidity"
              hideText={true}
              nrOfLevels={3}
              colors={["#ff6b6b", "#ffd93d", "#6bcf7f"]}
              arcWidth={0.3}
              percent={
                sensorData
                  ? Math.min(Math.max(sensorData.humidity / 100, 0), 1)
                  : 0
              }
            />
            <div className="gauge-label">
              {sensorData && plantData
                ? (() => {
                    const humidity = sensorData.humidity;
                    const idealMin = plantData.min_env_humid;
                    const idealMax = plantData.max_env_humid;
                    
                    if (humidity < idealMin) return `Low ${humidity.toFixed(1)}%`;
                    if (humidity > idealMax) return `High ${humidity.toFixed(1)}%`;
                    return `Ideal ${humidity.toFixed(1)}%`;
                  })()
                : "Loading..."}
            </div>
          </div>

          <div className="gauge-wrapper">
            <div className="gauge-title">Soil Moisture</div>
            <GaugeChart
              id="gauge-chart-moisture"
              hideText={true}
              nrOfLevels={3}
              colors={["#ff6b6b", "#ffd93d", "#6bcf7f"]}
              arcWidth={0.3}
              percent={
                sensorData
                  ? (normalizeMoisture(sensorData.moisture_one) +
                      normalizeMoisture(sensorData.moisture_two)) /
                    200 // Divide by 200 to get 0-1 range (since we're averaging two values)
                  : 0
              }
            />
            <div className="gauge-label">
              {sensorData
                ? (() => {
                    const avgMoisture =
                      (normalizeMoisture(sensorData.moisture_one) +
                        normalizeMoisture(sensorData.moisture_two)) / 2;

                    if (avgMoisture <= 30) return `Dry ${avgMoisture.toFixed(0)}%`;
                    if (avgMoisture >= 70) return `Wet ${avgMoisture.toFixed(0)}%`;
                    return `Ideal ${avgMoisture.toFixed(0)}%`;
                  })()
                : "Loading..."}
            </div>
          </div>
        </div>

        {/* Content Row */}
        <div className="content-row">
          <div className="radish-info">
            <h2>Growth Compass – Sensor vs Ideal</h2>

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
                  <PolarGrid gridType="polygon" stroke="rgba(255,255,255,0.3)" />
                  <PolarAngleAxis 
                    dataKey="metric" 
                    tick={{ fill: '#ffffff', fontSize: 12 }}
                  />
                  <PolarRadiusAxis 
                    angle={30} 
                    domain={[0, 100]} 
                    tick={{ fill: '#ffffff', fontSize: 10 }}
                    tickCount={4}
                  />
                  <Radar
                    name="Current"
                    dataKey="Sensor"
                    stroke="#ff6b6b"
                    fill="#ff6b6b"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Radar
                    name="Ideal"
                    dataKey="Ideal"
                    stroke="#6bcf7f"
                    fill="#6bcf7f"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Legend 
                    wrapperStyle={{ color: '#ffffff' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="radish-info">
            {/* You can add additional content here */}
          </div>
        </div>
      </div>
    </PlantContext.Provider>
  );
}