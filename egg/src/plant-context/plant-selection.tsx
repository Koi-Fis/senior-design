import React, { createContext, useContext, useState, useEffect } from 'react';

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

type PlantContextType = {
  selectedPlant: string;
  setSelectedPlant: (plant: string) => void;
};

const PlantContext = createContext<PlantContextType>({
  selectedPlant: "",
  setSelectedPlant: () => {},
});

export const PlantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // const [selectedPlant, setSelectedPlant] = useState<string>(() =>
  //   loadFromStorage("plant", "")
  // );
  const [selectedPlant, setSelectedPlant] = useState("radish andes f1");

  useEffect(() => {
    saveToStorage("plant", selectedPlant);
  }, [selectedPlant]);

  return (
    <PlantContext.Provider value={{ selectedPlant, setSelectedPlant }}>
      {children}
    </PlantContext.Provider>
  );
};

export const usePlant = () => useContext(PlantContext);