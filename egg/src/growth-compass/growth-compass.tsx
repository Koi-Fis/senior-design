import "bootstrap/dist/css/bootstrap.min.css";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import "./growth.css";
import { useEffect, useState } from "react";

type PlantDetailData = {
  pid: string;
  display_pid: string;
  alias: string;
  category: string;
  max_light_mmol: number;
  min_light_mmol: number;
  max_light_lux: number;
  min_light_lux: number;
  max_temp: number;
  min_temp: number;
  max_env_humid: number;
  min_env_humid: number;
  max_soil_moist: number;
  min_soil_moist: number;
  max_soil_ec: number;
  min_soil_ec: number;
  image_url: string;
};

const plantOptions = [
  { key: "radish andes f1", label: "Radish" },
  { key: "tomato motto f1", label: "Tomato" },
  { key: "spinacia oleracea", label: "Spinach" },
];

export default function PlantDetail() {
  const [selectedPlant, setSelectedPlant] = useState<string>("radish andes f1");
  const [data, setData] = useState<PlantDetailData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedPlant) return;
    const slug = encodeURIComponent(selectedPlant);
    fetch(`https://open.plantbook.io/api/v1/plant/detail/${slug}`, {
      headers: {
        Authorization: "Token fc6cec3131e4a6873732f919be941bd8736b4836",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
      })
      .then(setData)
      .catch((err) => {
        console.error(err);
        setError("Failed to load plant details.");
        setData(null);
      });
  }, [selectedPlant]);

  // Find the display label for the selected plant
  const selectedLabel =
    plantOptions.find((opt) => opt.key === selectedPlant)?.label || selectedPlant;

  return (
    <div className="canvas-container">
      <div className="radish-info grid grid-cols-2 gap-4 text-sm">
        <DropdownButton id="dropdown-item-button dropdwn" title={selectedLabel}>
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
        <h2 className="text-2xl font-bold">{selectedLabel}</h2>
        {error && <div className="text-red-600">{error}</div>}
        {!data && !error && <div>Loading plant data...</div>}
        {data && (
          <>
            <div>
              <strong>Category:</strong> {data.category}
            </div>
            <div>
              <strong>Alias:</strong> {data.alias}
            </div>
            <div>
              <strong>Light (mmol):</strong> {data.min_light_mmol} - {data.max_light_mmol}
            </div>
            <div>
              <strong>Light (lux):</strong> {data.min_light_lux} - {data.max_light_lux}
            </div>
            <div>
              <strong>Temp (°C):</strong> {data.min_temp} - {data.max_temp}
            </div>
            <div>
              <strong>Humidity (%):</strong> {data.min_env_humid} - {data.max_env_humid}
            </div>
            <div>
              <strong>Soil Moisture (%):</strong> {data.min_soil_moist} - {data.max_soil_moist}
            </div>
            <div>
              <strong>Soil EC (μS/cm):</strong> {data.min_soil_ec} - {data.max_soil_ec}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/*import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

const DATA_URL="http://192.168.50.100/data.json";

type TemperatureEntry = {
    time: string;
    temperature: number;
};

const TemperatureData = () =>{
    const [data, setData] = useState<TemperatureEntry[]>([]);
    const [error,setError] = useState<string | null>(null);

    const fetchData = async () => {
        try
        {
            const res = await fetch(DATA_URL);
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            const json = await res.json();

            const formatted = json.map((item: { timestamp: string; temperature_celcius: number }) => ({
                time: new Date(item.timestamp).toLocaleTimeString(),
                temperature: item.temperature_celcius,

        }));

            setData(formatted);
            setError(null);
        }   catch (err){
            setError(`Failed to fetch data: ${err instanceof Error ? err.message : 'Unknown error'}`);
            console.error
        }
};
    useEffect(()=>{
        fetchData();
        const interval = setInterval(fetchData, 5 * 6 * 1000);
        return () => clearInterval(interval);
    }, []);

    return(
        <div className="canvas-container">
            <h3>Live Temperature chart</h3>
            {error && <div className="alert alert-danger">{error}</div>}

            <ResponsiveContainer width="50%" height={300}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3"/>
                    <XAxis dataKey="time" />
                    <YAxis domain = {["auto", "auto"]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="temperature" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
            </ResponsiveContainer>

        </div>
    );
};




export default TemperatureData;*/
