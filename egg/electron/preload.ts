// electron/preload.ts
import { contextBridge, ipcRenderer } from 'electron';
import type { ArduinoAPI, ArduinoSensorData, ArduinoDataState, ArduinoConfig } from './types/arduino';
import { IPC_CHANNELS } from './types/arduino';

// Remove all listeners on window unload to prevent memory leaks
window.addEventListener('beforeunload', () => {
  ipcRenderer.removeAllListeners(IPC_CHANNELS.ARDUINO_DATA_UPDATE);
  ipcRenderer.removeAllListeners(IPC_CHANNELS.ARDUINO_CONNECTION_STATUS);
  ipcRenderer.removeAllListeners(IPC_CHANNELS.ARDUINO_ERROR);
});

// -----------------------------
// Arduino API Implementation
// -----------------------------
const arduinoAPI: ArduinoAPI = {
  onDataUpdate: (callback: (data: ArduinoSensorData) => void) => {
    const wrapped = (_: any, data: ArduinoSensorData) => callback(data);
    ipcRenderer.on(IPC_CHANNELS.ARDUINO_DATA_UPDATE, wrapped);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.ARDUINO_DATA_UPDATE, wrapped);
  },

  onConnectionStatusChange: (callback: (isConnected: boolean) => void) => {
    const wrapped = (_: any, status: boolean) => callback(status);
    ipcRenderer.on(IPC_CHANNELS.ARDUINO_CONNECTION_STATUS, wrapped);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.ARDUINO_CONNECTION_STATUS, wrapped);
  },

  onError: (callback: (error: string) => void) => {
    const wrapped = (_: any, err: string) => callback(err);
    ipcRenderer.on(IPC_CHANNELS.ARDUINO_ERROR, wrapped);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.ARDUINO_ERROR, wrapped);
  },

  getCurrentData: (): Promise<ArduinoDataState> =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_ARDUINO_DATA),

  updateConfig: (config: Partial<ArduinoConfig>): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.UPDATE_ARDUINO_CONFIG, config),
};

// -----------------------------
// Schedule API Implementation
// -----------------------------

type ScheduleData = {
  id: string;
  enabled: boolean;
  time: string;
  frequency: "daily" | "weekly" | "bi-weekly" | "every other day";
  urlOn: string | string[];
  urlOff: string | string[];
};

const scheduleAPI = {
  createSchedule: (scheduleData: ScheduleData) =>
    ipcRenderer.invoke('create-schedule', scheduleData),

  clearSchedule: (id: string) =>
    ipcRenderer.invoke('clear-schedule', id),

  getActiveSchedules: (): Promise<string[]> =>
    ipcRenderer.invoke('get-active-schedules'),
};

// -----------------------------
// Expose to Renderer
// -----------------------------

const existingAPI = (window as any).electronAPI || {};

const enhancedElectronAPI = {
  ...existingAPI,
  arduino: arduinoAPI,
  schedule: scheduleAPI,
};

contextBridge.exposeInMainWorld('electronAPI', enhancedElectronAPI);

// Utility: platform info
contextBridge.exposeInMainWorld('platform', {
  isWindows: process.platform === 'win32',
  isMac: process.platform === 'darwin',
  isLinux: process.platform === 'linux',
});
