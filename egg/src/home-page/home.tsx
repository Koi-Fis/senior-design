import 'bootstrap/dist/css/bootstrap.min.css';

import './home.css';
import React, { useState, useEffect } from 'react';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';

const DATA_URL="http://192.168.50.100/data.json";

const sensorData = () =>{
  const [data, setData] = useState<any[]>([]);
  const [error,setError] = useState<string | null>(null);

  const fetchData = async () => {
    try
    {
      const res = await fetch(DATA_URL);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const json = await res.json();

      // const formatted = json.map((item: any) => ({
      //   time: new Date(item.timestamp).toLocaleTimeString(),
      //   temperature: item.temperature_celcius,
      //   humidity: item.humidity,
      //   heat_idx: item.heat_index_celsius,
      //   moisture1: item.moisture_one,
      //   moisture2: item.moisture_two,
      //   N: item.nitrogen,
      //   P: item.phosphorus,
      //   K: item.potassium,
      //}));

      const latestItem = json[json.length-1];
      const formatted = [
        {title: "Temperature", text: latestItem.temperature_celcius},
        {title: "Humidity", text: latestItem.humidity},
        {title: "Heat Index", text: latestItem.heat_index_celcius},
        {title: "Moisture1", text: latestItem.moisture_one},
        {title: "Moisture2", text: latestItem.moisture_two},
        {title: "Nitrogen", text: latestItem.nitrogen},
        {title: "Phosphorus", text: latestItem.phosphorus},
        {title: "Potassium", text: latestItem.potassium},
      ]

      setData(formatted);
      setError(null);
    }   catch (err){
      setError(`Failed to fetch data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error(err)
    }
};

  useEffect(()=>{
    fetchData();
    const interval = setInterval(fetchData, 30 * 1000);
    return () => clearInterval(interval);
  }, []);


//TODO: consider adding a placeholder/loading page
  return (
    <div className="home-page">
      <div className="stats-container">
        {error && <div className="alert alert-danger">{error}</div>}
       <Row xs={1} md={2} className="g-4">
        {/* {Array.from({ length: 4 }).map((_, idx) => ( */}
        {data.map((card, idx) => (
          <Col key={idx}>
            <Card>
              
              <Card.Body>
                {/* <Card.Title>{card.time}</Card.Title>
                <Card.Text>{card.temperature}</Card.Text> */}
                <Card.Title>{card.title}</Card.Title>
                <Card.Text>{card.text}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
      </div>
    </div>
  );
};

export default sensorData;