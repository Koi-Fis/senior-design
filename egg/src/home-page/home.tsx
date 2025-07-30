// idea: refresh is NOT automatic. Only load on startup, and then only load again when you hit the refresh button

import 'bootstrap/dist/css/bootstrap.min.css';

import './home.css';
// import React;
import { useState, useEffect, useRef } from 'react';
import Card from 'react-bootstrap/Card';
import Placeholder from 'react-bootstrap/Placeholder';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import LoadingButton from './loadingButton'

// const DATA_URL="http://192.168.50.137/data.json";
const latestSensor = "http://192.168.50.137/api/latest_sensor"

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

const sensorData = () =>{
  const [data, setData] = useState<any[]>(() =>
    loadFromStorage("jsonUpdate", [])
  );
  const [lastUpdated, setLastUpdated] = useState<string>(
  loadFromStorage("lastUpdated", "")
);
  const [error,setError] = useState<string | null>(null);
  const lastRef = useRef<string>('');


  const fetchData = async () => {
    try
    {
      // only fetches the last item of the json
      const res = await fetch(latestSensor);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const json = await res.json();

      const formatted = [
        {title: "Temperature", text: json.temperature_celcius},
        {title: "Humidity", text: json.humidity},
        {title: "Heat Index", text: json.heat_index_celcius},
        {title: "Moisture1", text: json.moisture_one},
        {title: "Moisture2", text: json.moisture_two},
        {title: "Nitrogen", text: json.nitrogen},
        {title: "Phosphorus", text: json.phosphorus},
        {title: "Potassium", text: json.potassium},
      ]
      const formattedJSON = JSON.stringify(formatted);
      // only updates if the json data is different
      if (formattedJSON !== lastRef.current) {
        // clear the cache 
        removeFromStorage("jsonUpdate")
        removeFromStorage("lastUpdated")

        // set the updated json data
        lastRef.current = formattedJSON;
        setData(formatted);
        saveToStorage("jsonUpdate", formatted)

        // set the updated timestamp 
        const now = new Date().toLocaleString();
        setLastUpdated(now);
        saveToStorage("lastUpdated", now);

        console.log("Data has been updated!")
      }
      else {
        console.log("No change in sensor data, setData() is not called")
      }
      setError(null);
    }   catch (err){
      setError(`Failed to fetch data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error(err)
    }
};

  // Load data once upon startup 
  useEffect(()=>{
    if (data.length == 0) {
      fetchData();
    }
  }, []);

  

  return (
    <div className="home-page">
      <div className="stats-container">
        {error && <div className="alert alert-danger">{error}</div>}
        <LoadingButton onClick={fetchData} />
        <div style={{maxHeight: '500px', overflowY: 'auto'}} className="p-3 border">  {/*scrollbar*/}
          <div className="text-muted mb-2">Last update: {lastUpdated || 'unknown'}</div>
          {data.length === 0 ? (
            <Row xs={1} md={2} className="g-4">
              {Array.from({ length: 8 }).map((_, idx) => (
                <Col key={idx}>
                  {/* <Card style={{width: '18rem'}}> */}
                  <Card>
                    <Card.Body>
                      <Card.Title>
                        <Placeholder as="h5" animation="wave">
                          <Placeholder xs={6} />
                        </Placeholder>
                      </Card.Title>
                      <Card.Text>
                        <Placeholder as="p" animation="wave">
                          <Placeholder xs={7} /> <Placeholder xs={4} /> <Placeholder xs={4} />{' '}
                        </Placeholder>
                      </Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
          <Row xs={1} md={2} className="g-4">
            {data.map((card, idx) => (
              <Col key={idx}>
                {/* <Card style={{width: '18rem'}}> */}
                <Card>
                  <Card.Body>
                    <Card.Title>{card.title}</Card.Title>
                    <Card.Text>{card.text}</Card.Text>
                    {/* <Card.Footer>{"Last update: "}</Card.Footer> */}

                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
          )};
        </div>
      </div>
    </div>
  );
};


export default sensorData;