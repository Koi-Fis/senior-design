import { EventEmitter } from 'events';
import { BrowserWindow } from 'electron';
import type { ArduinoSensorData, ArduinoDataState, ArduinoConfig } from './types/arduino';
import { IPC_CHANNELS } from './types/arduino';

export class ArduinoDataService extends EventEmitter {
  private config: ArduinoConfig;
  private currentState: ArduinoDataState;
  private pollTimer: NodeJS.Timeout | null = null;
  private isPolling = false;
  private mainWindow: BrowserWindow | null = null;
  private abortController: AbortController | null = null;

  constructor(initialConfig: ArduinoConfig) {
    super();
    this.config = initialConfig;
    this.currentState = {
      data: null,
      isConnected: false,
      lastUpdate: 0,
      error: null
    };
  }

  public setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  public async start(): Promise<void> {
    if (this.isPolling) {
      return;
    }

    this.isPolling = true;
    console.log('Arduino Data Service started');
    
    // Initial fetch
    await this.fetchData();
    
    // Start polling
    this.startPolling();
  }

  public stop(): void {
    if (!this.isPolling) {
      return;
    }

    this.isPolling = false;
    
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    console.log('Arduino Data Service stopped');
  }

  public getCurrentState(): ArduinoDataState {
    return { ...this.currentState };
  }

  public updateConfig(newConfig: Partial<ArduinoConfig>): void {
    const wasPolling = this.isPolling;
    
    if (wasPolling) {
      this.stop();
    }

    this.config = { ...this.config, ...newConfig };
    
    if (wasPolling) {
      this.start();
    }
  }

  private startPolling(): void {
    this.pollTimer = setInterval(async () => {
      await this.fetchData();
    }, this.config.pollInterval);
  }

  private async fetchData(): Promise<void> {
    let retryCount = 0;
    
    while (retryCount < this.config.retryAttempts) {
      try {
        // Cancel previous request if still pending
        if (this.abortController) {
          this.abortController.abort();
        }
        
        this.abortController = new AbortController();
        
        // Create timeout signal
        const timeoutId = setTimeout(() => {
          if (this.abortController) {
            this.abortController.abort();
          }
        }, this.config.timeout);
        
        const response = await fetch(this.config.endpoint, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          signal: this.abortController.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const rawData = await response.json();
      

        // FIX: Handle array vs object from the endpoint
        // Use the last element if the data is an array (latest reading)
        const latestData = Array.isArray(rawData) ? rawData[rawData.length - 1] : rawData;

        const sensorData = this.parseArduinoData(latestData);
        
        this.updateState({
          data: sensorData,
          isConnected: true,
          lastUpdate: Date.now(),
          error: null
        });

        // Success - reset retry count
        break;

      } catch (error) {
        retryCount++;
        const isLastAttempt = retryCount >= this.config.retryAttempts;
        
        if (error instanceof Error && error.name === 'AbortError') {
          // Request was aborted, don't treat as error
          return;
        }

        console.error(`Arduino fetch attempt ${retryCount} failed:`, error);
        
        if (isLastAttempt) {
          this.updateState({
            data: this.currentState.data, // Keep last known data
            isConnected: false,
            lastUpdate: this.currentState.lastUpdate,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        } else {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        }
      }
    }
  }

  private parseArduinoData(rawData: any): ArduinoSensorData {
    // Defensive: use ?? instead of || for property fallback (handles 0 correctly)
    const sensorData = {
      timestamp: rawData.timestamp ?? new Date().toISOString(), // ISO 8601 string format
      temperature_celcius: parseFloat(
        rawData.temperature_celcius ?? rawData.temperature ?? rawData.Temperature
      ) || 0,
      humidity: parseFloat(rawData.humidity ?? rawData.Humidity) || 0,
      heat_index_celcius: parseFloat(
        rawData.heat_index_celcius ?? rawData.heatIndex ?? rawData.heat_index
      ) || 0,
      moisture_one: parseFloat(
        rawData.moisture_one ?? rawData.soilMoisture ?? rawData.moistureOne ?? rawData.moisture_one
      ) || 0,
      moisture_two: parseFloat(
        rawData.moisture_two ?? rawData.moistureTwo ?? rawData.moisture_two
      ) || 0,
      nitrogen: parseFloat(rawData.nitrogen ?? rawData.Nitrogen) || 0,
      phosphorus: parseFloat(rawData.phosphorus ?? rawData.Phosphorus) || 0,
      potassium: parseFloat(rawData.potassium ?? rawData.Potassium) || 0
    };
    console.log('parseArduinoData output:', sensorData);
    return sensorData;
  }

  private updateState(newState: ArduinoDataState): void {
    const previousState = { ...this.currentState };
    this.currentState = newState;

    // Emit events for listeners
    this.emit('stateChanged', this.currentState, previousState);

    // Send to renderer processes via IPC
    this.broadcastToRenderers(newState, previousState);
  }

  private broadcastToRenderers(newState: ArduinoDataState, previousState: ArduinoDataState): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      return;
    }

    // Send data update if data changed
    if (newState.data && (!previousState.data || 
        JSON.stringify(newState.data) !== JSON.stringify(previousState.data))) {
      this.mainWindow.webContents.send(IPC_CHANNELS.ARDUINO_DATA_UPDATE, newState.data);
    }

    // Send connection status if changed
    if (newState.isConnected !== previousState.isConnected) {
      this.mainWindow.webContents.send(IPC_CHANNELS.ARDUINO_CONNECTION_STATUS, newState.isConnected);
    }

    // Send error if new error occurred
    if (newState.error && newState.error !== previousState.error) {
      this.mainWindow.webContents.send(IPC_CHANNELS.ARDUINO_ERROR, newState.error);
    }
  }
}