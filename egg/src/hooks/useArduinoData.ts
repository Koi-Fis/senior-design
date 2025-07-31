// src/hooks/useArduinoData.ts
import { useState, useEffect, useCallback } from 'react';
import type { ArduinoSensorData, ArduinoDataState } from '../../electron/types/arduino';

interface UseArduinoDataReturn {
  data: ArduinoSensorData | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  lastUpdate: number;
  refreshData: () => Promise<void>;
}

/**
 * Custom hook to fetch and subscribe to Arduino sensor data via Electron IPC
 */
const useArduinoData = (): UseArduinoDataReturn => {
  const [state, setState] = useState<ArduinoDataState>({
    data: null,
    isConnected: false,
    lastUpdate: 0,
    error: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data from main process
  const loadInitialData = useCallback(async () => {
    try {
      const api = window.electronAPI?.arduino;
      if (!api?.getCurrentData) throw new Error('Arduino API not available');
      const initialState = await api.getCurrentData();
      setState(initialState);
    } catch (err) {
      console.error('Failed to load initial Arduino data:', err);
      setState(prev => ({ ...prev, error: err instanceof Error ? err.message : String(err) }));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Subscribe to live updates
  useEffect(() => {
    const api = window.electronAPI?.arduino;
    if (!api) return;

    const unsubData = api.onDataUpdate((newData: ArduinoSensorData) => {
      setState(prev => ({ ...prev, data: newData, lastUpdate: Date.now(), error: null }));
      setIsLoading(false);
    });
    const unsubConn = api.onConnectionStatusChange((isConnected: boolean) => {
      setState(prev => ({ ...prev, isConnected }));
    });
    const unsubErr = api.onError((error: string) => {
      setState(prev => ({ ...prev, error }));
      setIsLoading(false);
    });

    return () => {
      unsubData();
      unsubConn();
      unsubErr();
    };
  }, []);

  // Manual refresh
  const refreshData = useCallback(async () => {
    try {
      const api = window.electronAPI?.arduino;
      if (!api?.getCurrentData) throw new Error('Arduino API not available');
      setIsLoading(true);
      const freshState = await api.getCurrentData();
      setState(freshState);
    } catch (err) {
      console.error('Failed to refresh Arduino data:', err);
      setState(prev => ({ ...prev, error: err instanceof Error ? err.message : String(err) }));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    data: state.data,
    isConnected: state.isConnected,
    isLoading,
    error: state.error,
    lastUpdate: state.lastUpdate,
    refreshData,
  };
};

export default useArduinoData;
export { useArduinoData };
