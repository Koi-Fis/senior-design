import React, { useEffect, useState } from "react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";
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
const SENSOR_URL = "http://192.168.50.100/data.json";

const plantOptions = [
  { key: "radish andes f1", label: "Radish" },
  { key: "tomato motto f1", label: "Tomato" },
  { key: "spinacia oleracea", label: "Spinach" },
];

// -----------------------------
// Utility: Normalize Moisture
// -----------------------------
function normalizeMoisture(raw: number): number {
  const dry = 1023; // hypothetical dry value
  const wet = 300; // hypothetical wet value
  const clamped = Math.min(Math.max(raw, wet), dry);
  return Math.round(((dry - clamped) / (dry - wet)) * 100);
}

// -----------------------------
// Component
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

  const radarData = plantData && sensorData ? [
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
      Sensor: (normalizeMoisture(sensorData.moisture_one) + normalizeMoisture(sensorData.moisture_two)) / 2,
      Ideal: (plantData.min_soil_moist + plantData.max_soil_moist) / 2,
    },
    {
      metric: "Potassium",
      Sensor: 5, // Assuming this is potassium for example
      Ideal: 10,
    },
    {
      metric: "Phosphorus",
      Sensor: 5, // Assuming this is phosphorus for example
      Ideal: 10,
    },
    {
      metric: "Nitrogen",
      Sensor: 5, // Assuming this is nitrogen for example
      Ideal: 20,
    },
  ] : [];

   return (
    <div className="canvas-container py-4">
      <div className="radish-info">
      <h2 className="mb-4">Growth Compass – Sensor vs Ideal</h2>

      <DropdownButton
        id="plant-dropdown"
        title={plantOptions.find((opt) => opt.key === selectedPlant)?.label || "Select Plant"}
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
            <PolarRadiusAxis angle={30} domain={[0, 60]} />
            <Radar name="Sensor" dataKey="Sensor" stroke="#ff4d4d" fill="#ff4d4d" fillOpacity={0.4} />
            <Radar name="Ideal" dataKey="Ideal" stroke="#4caf50" fill="#4caf50" fillOpacity={0.4} />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      )}
    </div>

    <div className="radish-info">
      <h3>Sensor Data</h3>
      {sensorData && (
        <ul>
          <li>Temperature: {sensorData.temperature_celcius} °C</li>
          <li>Humidity: {sensorData.humidity} %</li>
          <li>Soil Moisture 1: {sensorData.moisture_one} %</li>
          <li>Soil Moisture 2: {sensorData.moisture_two} %</li>
        </ul>
      )}
    </div>
    </div>
  );
}
