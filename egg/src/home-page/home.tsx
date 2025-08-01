// src/home.tsx
import React, { useState, useEffect, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './home.css';
import Card from 'react-bootstrap/Card';
import Placeholder from 'react-bootstrap/Placeholder';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import LoadingButton from './loadingButton';
import { useArduinoData } from '../hooks/useArduinoData';

/**
 * Home page that displays the latest Arduino sensor readings
 * with manual refresh control.
 */
export default function HomePage(): JSX.Element {
  const { data, isConnected, isLoading, error, lastUpdate, refreshData } = useArduinoData();

  // Local cache for display
  const [displayData, setDisplayData] = useState<Array<{ title: string; text: number }>>([]);
  const lastRef = useRef<string>('');

  // Whenever data updates, format and store in local state
  useEffect(() => {
    if (data) {
      const formatted = [
        { title: 'Temperature', text: data.temperature_celcius },
        { title: 'Humidity', text: data.humidity },
        { title: 'Heat Index', text: data.heat_index_celcius },
        { title: 'Moisture1', text: data.moisture_one },
        { title: 'Moisture2', text: data.moisture_two },
        { title: 'Nitrogen', text: data.nitrogen },
        { title: 'Phosphorus', text: data.phosphorus },
        { title: 'Potassium', text: data.potassium },
      ];
      const fingerprint = JSON.stringify(formatted);
      if (fingerprint !== lastRef.current) {
        lastRef.current = fingerprint;
        setDisplayData(formatted);
      }
    }
  }, [data]);

  return (
    <div className="home-page">
      <header className="d-flex justify-content-center align-items-center p-3 mb-3">
        <h1 className="text-center grow-title ">&#127804; Home</h1>
      </header>
      <div className="stats-container">
        {error && <div className="alert alert-danger">{error}</div>}

        <LoadingButton
          onClick={refreshData}
          disabled={!isConnected || isLoading}
          label={isLoading ? 'Refreshing...' : 'Refresh Data'}
        />

        <div className="text-muted mb-2">
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
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>
      </div>
    </div>
  );
}
