// electron/types/arduino.ts

/**
 * Data structures for Arduino sensor data and state
 */
export interface ArduinoSensorData {
  timestamp:            string;
  temperature_celcius:  number;
  humidity:             number;
  heat_index_celcius:   number;
  moisture_one:         number;
  moisture_two:         number;
  nitrogen:             number;
  phosphorus:           number;
  potassium:            number;
}

export interface ArduinoDataState {
  data:        ArduinoSensorData | null;
  isConnected: boolean;
  lastUpdate:  number;
  error:       string | null;
}

export interface ArduinoConfig {
  endpoint:      string;
  pollInterval:  number;
  timeout:       number;
  retryAttempts: number;
}

/**
 * IPC channel constants
 */
export const IPC_CHANNELS = {
  ARDUINO_DATA_UPDATE:          'arduino-data-update',
  ARDUINO_CONNECTION_STATUS:    'arduino-connection-status',
  ARDUINO_ERROR:                'arduino-error',
  GET_ARDUINO_DATA:            'get-arduino-data',
  UPDATE_ARDUINO_CONFIG:       'update-arduino-config',
  CREATE_SCHEDULE:             'create-schedule',
  CLEAR_SCHEDULE:              'clear-schedule',
  GET_ACTIVE_SCHEDULES:        'get-active-schedules',
} as const;

/**
 * API for Arduino data interactions
 */
export interface ArduinoAPI {
  onDataUpdate:               (callback: (data: ArduinoSensorData) => void) => () => void;
  onConnectionStatusChange:   (callback: (isConnected: boolean) => void) => () => void;
  onError:                    (callback: (error: string) => void) => () => void;
  getCurrentData:             () => Promise<ArduinoDataState>;
  updateConfig:               (config: Partial<ArduinoConfig>) => Promise<void>;
}

/**
 * Data structure for device command schedules
 */
export interface ScheduleData {
  id:         string;
  enabled:    boolean;
  time:       string;                // "HH:mm"
  frequency:  'daily' | 'weekly' | 'bi-weekly' | 'every other day';
  urlOn:      string | string[];

}

/**
 * API for scheduling device commands
 */
export interface ScheduleAPI {
  createSchedule:    (data: ScheduleData) => Promise<{ success: boolean; message: string }>;
  clearSchedule:     (id: string) => Promise<{ success: boolean; message: string }>;
  getActiveSchedules:() => Promise<string[]>;
}

/**
 * Combined Electron API exposed to renderer
 */
export interface ElectronAPI {
  arduino:  ArduinoAPI;
  schedule: ScheduleAPI;
}

// Augment global Window interface
declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
