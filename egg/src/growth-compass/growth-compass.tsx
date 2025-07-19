import "bootstrap/dist/css/bootstrap.min.css";
import './growth.css';
import { useEffect, useState } from 'react';

import {
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




export default TemperatureData;