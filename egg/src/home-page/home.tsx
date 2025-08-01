// src/home.tsx
import React, { useState, useEffect, useRef, createContext} from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './home.css';
import Card from 'react-bootstrap/Card';
import Placeholder from 'react-bootstrap/Placeholder';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
// import LoadingButton from './loadingButton';
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import ListGroup from 'react-bootstrap/ListGroup';
import Carousel from 'react-bootstrap/Carousel';
import { useArduinoData } from '../hooks/useArduinoData';
import { usePlant } from '../plant-context/plant-selection';

// -----------------------------
// Offload plant selection
// -----------------------------
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

// -----------------------------
// Config
// -----------------------------
const PLANTBOOK_TOKEN = "fc6cec3131e4a6873732f919be941bd8736b4836";

const plantOptions = [
  { key: "radish andes f1", label: "Radish" },
  { key: "tomato motto f1", label: "Tomato" },
  { key: "spinacia oleracea", label: "Spinach" },
  { key: "ocimum basilicum", label: "Basil"},
];

// -----------------------------
// Context to Globalize Plant Selection
// -----------------------------
const PlantContext = createContext<{
  selectedPlant: string;
  setSelectedPlant: (value: string) => void;
}>({ selectedPlant: "", setSelectedPlant: () => {} });

// -----------------------------
// Utility: Normalize Moisture and get comparison status
// -----------------------------
function normalizeMoisture(raw: number): number {
  const dry = 987; // 0 = dry (0%)
  const wet = 469; // 70 = wet (100%)
  const clamped = Math.max(Math.min(raw, dry), wet);
  return Math.round(((dry - clamped) / (dry - wet)) * 100);
}

function getStatus(value: number, min: number, max: number): string {
  if (value < min) return "Too Low";
  if (value > max) return "Too High";
  return "Optimal"
}

/**
 * Home page that displays the latest Arduino sensor readings
 * with manual refresh control.
 */
export default function HomePage(): JSX.Element {
  const { data, isConnected, isLoading, error, lastUpdate, refreshData } = useArduinoData();
  const { selectedPlant, setSelectedPlant } = usePlant();
  const [plantData, setPlantData] = useState<PlantDetailData | null>(null);

  // Local cache for display
  const [displayData, setDisplayData] = useState<Array<{ title: string; text: number; status: string, expected: number }>>([]);
  const lastRef = useRef<string>('');

  // Whenever data updates, format and store in local state
  useEffect(() => {
    if (data && plantData) {
      removeFromStorage("plant");
      saveToStorage("plant", selectedPlant);
      const formatted = [
        { title: 'Temperature', text: data.temperature_celcius, 
          status: getStatus(data.temperature_celcius, plantData.min_temp, plantData.max_temp),
          expected: (plantData.min_temp + plantData.max_temp) / 2,
        },
        { title: 'Humidity', text: data.humidity,
          status: getStatus(data.humidity, plantData.min_env_humid, plantData.max_env_humid),
          expected: (plantData.min_env_humid + plantData.max_env_humid) / 2,
        },
        // { title: 'Heat Index', text: data.heat_index_celcius,
        //   // status: getStatus(data.heat_index_celcius, )
        //   status: 'No info',
        //   expected: 0,
        //  },
        { title: 'Moisture Percentage', text: (normalizeMoisture(data.moisture_one) + normalizeMoisture(data.moisture_two)) / 2,
          status: getStatus(((normalizeMoisture(data.moisture_one) + normalizeMoisture(data.moisture_two)) / 2), 
                              plantData.min_soil_moist, plantData.max_soil_moist),
          expected: 0,
         },
        { title: 'Nitrogen', text: data.nitrogen,
          status: getStatus(data.nitrogen, 10, 10),
          expected: 0,
         },
        { title: 'Phosphorus', text: data.phosphorus,
          status: getStatus(data.phosphorus, 10, 10),
          expected: 0,
         },
        { title: 'Potassium', text: data.potassium,
          status: getStatus(data.potassium, 10, 10),
          expected: 0,
         },
      ];
      const fingerprint = JSON.stringify(formatted);
      if (fingerprint !== lastRef.current) {
        lastRef.current = fingerprint;
        setDisplayData(formatted);
      }
    }
  }, [data, plantData]);

  useEffect(() => {
    const fetchPlantData = async () => {
      try {
        const slug = encodeURIComponent(selectedPlant);

        const plantRes = await fetch(`https://open.plantbook.io/api/v1/plant/detail/${slug}`, {
          headers: {
            Authorization: `Token ${PLANTBOOK_TOKEN}`,
          },
        });

        if (!plantRes.ok) throw new Error("Failed to fetch plant data");

        const plantJson = await plantRes.json();
        setPlantData(plantJson);
      } catch (err) {
        console.error(err);
      }
    };

    fetchPlantData();
  }, [selectedPlant]);

  return (
    <PlantContext.Provider value={{ selectedPlant, setSelectedPlant }}>
      <div className="home-page">
        <header className="d-flex justify-content-center align-items-center p-3 mb-3">
          <h1 className="text-center grow-title ">&#127804; Home</h1>
        </header>
        
          <div className="carousel-container">
            <Carousel fade controls = {false} indicators={true}>
              {["egg1final", "egg2final", "egg3final", "egg4final", "egg5final", "egg6final", "egg7final", "egg8final"].map((imgName, i) => (
                <Carousel.Item key={i}>
                  <img className="d-block w-100" src={`../src/assets/${imgName}.svg`} alt={`Slide ${i + 1}`} />
                </Carousel.Item>
              ))}

            </Carousel>
          </div>

        <div className="stats-container">
          {error && <div className="alert alert-danger">{error}</div>}

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
                    onClick={() => {
                      setSelectedPlant(opt.key)
                      refreshData();
                    }}
                  >
                    {opt.label}
                  </Dropdown.Item>
                ))}
          </DropdownButton>

          <div className={`mb-2 timestamp ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected
              ? `Last update: ${new Date(lastUpdate).toLocaleString()}`
              : 'Disconnected'}
          </div>
   
          <div style={{ maxHeight: '500px', overflowY: 'auto' }} className="p-3 border">
          
            {isLoading && displayData.length === 0 ? (
              <Row xs={1} md={2} className="g-4">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <Col key={idx}>
                    <Card>
                      <Card.Body>
                        <Card.Title>
                          <Placeholder as="h5" animation="wave">
                            <Placeholder xs={6} />
                          </Placeholder>
                        </Card.Title>
                        <Card.Text>
                          <Placeholder as="p" animation="wave">
                            <Placeholder xs={7} /> <Placeholder xs={4} />
                          </Placeholder>
                        </Card.Text>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : (
              <Row xs={1} md={2} className="g-4">
                {displayData.map((card, idx) => (
                  <Col key={idx}>
                    <Card>

                      <Card.Body>
                        <Card.Title>{card.title}</Card.Title>
                        <Card.Text>{card.text}</Card.Text>
                        <Card.Footer>{card.status}</Card.Footer>
                      </Card.Body>
                      
                      {/* <ListGroup variant="flush">
                        <ListGroup.Item>{card.title}</ListGroup.Item>
                        <ListGroup.Item>{card.text}</ListGroup.Item>
                        <ListGroup.Item>{card.status}</ListGroup.Item>
                        <ListGroup.Item>{card.expected}</ListGroup.Item>
                      </ListGroup> */}

                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </div>
        </div>
      </div>
    </PlantContext.Provider>
  );
};
