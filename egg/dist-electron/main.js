var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { BrowserWindow, ipcMain, app, screen } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { EventEmitter } from "events";
let splash = null;
function createSplashWindow() {
  splash = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  const splashHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            margin: 0;
            padding: 0;
            background-image: linear-gradient(to right top, #00A86F,  #144e38);
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: white;
            overflow: hidden;
          }
          .splash-content {
            text-align: center;
          }
          .logo {
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 20px;
            animation: fadeIn 0.8s ease-in;
          }
          .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-top: 4px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 20px auto;
          }
          .loading-text {
            font-size: 14px;
            opacity: 0.8;
            animation: fadeIn 1.2s ease-in;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes fadeIn {
            0% { opacity: 0; transform: translateY(10px); }
            100% { opacity: 1; transform: translateY(0); }
          }
        </style>
      </head>
      <body>
        <div class="splash-content">
          <div class="logo">E.G.G</div>
          <div class="spinner"></div>
          <div class="loading-text">Loading...</div>
        </div>
      </body>
    </html>
  `;
  splash.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(splashHTML)}`);
  splash.on("closed", () => {
    splash = null;
  });
  return splash;
}
function closeSplashWindow() {
  if (splash && !splash.isDestroyed()) {
    splash.close();
    splash = null;
  }
}
const IPC_CHANNELS = {
  ARDUINO_DATA_UPDATE: "arduino-data-update",
  ARDUINO_CONNECTION_STATUS: "arduino-connection-status",
  ARDUINO_ERROR: "arduino-error",
  GET_ARDUINO_DATA: "get-arduino-data",
  UPDATE_ARDUINO_CONFIG: "update-arduino-config"
};
class ArduinoDataService extends EventEmitter {
  constructor(initialConfig) {
    super();
    __publicField(this, "config");
    __publicField(this, "currentState");
    __publicField(this, "pollTimer", null);
    __publicField(this, "isPolling", false);
    __publicField(this, "mainWindow", null);
    __publicField(this, "abortController", null);
    this.config = initialConfig;
    this.currentState = {
      data: null,
      isConnected: false,
      lastUpdate: 0,
      error: null
    };
  }
  setMainWindow(window) {
    this.mainWindow = window;
  }
  async start() {
    if (this.isPolling) {
      return;
    }
    this.isPolling = true;
    console.log("Arduino Data Service started");
    await this.fetchData();
    this.startPolling();
  }
  stop() {
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
    console.log("Arduino Data Service stopped");
  }
  getCurrentState() {
    return { ...this.currentState };
  }
  updateConfig(newConfig) {
    const wasPolling = this.isPolling;
    if (wasPolling) {
      this.stop();
    }
    this.config = { ...this.config, ...newConfig };
    if (wasPolling) {
      this.start();
    }
  }
  startPolling() {
    this.pollTimer = setInterval(async () => {
      await this.fetchData();
    }, this.config.pollInterval);
  }
  async fetchData() {
    let retryCount = 0;
    while (retryCount < this.config.retryAttempts) {
      try {
        if (this.abortController) {
          this.abortController.abort();
        }
        this.abortController = new AbortController();
        const timeoutId = setTimeout(() => {
          if (this.abortController) {
            this.abortController.abort();
          }
        }, this.config.timeout);
        const response = await fetch(this.config.endpoint, {
          method: "GET",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
          },
          signal: this.abortController.signal
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const rawData = await response.json();
        const latestData = Array.isArray(rawData) ? rawData[rawData.length - 1] : rawData;
        const sensorData = this.parseArduinoData(latestData);
        this.updateState({
          data: sensorData,
          isConnected: true,
          lastUpdate: Date.now(),
          error: null
        });
        break;
      } catch (error) {
        retryCount++;
        const isLastAttempt = retryCount >= this.config.retryAttempts;
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        console.error(`Arduino fetch attempt ${retryCount} failed:`, error);
        if (isLastAttempt) {
          this.updateState({
            data: this.currentState.data,
            // Keep last known data
            isConnected: false,
            lastUpdate: this.currentState.lastUpdate,
            error: error instanceof Error ? error.message : "Unknown error"
          });
        } else {
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retryCount) * 1e3));
        }
      }
    }
  }
  parseArduinoData(rawData) {
    const sensorData = {
      timestamp: rawData.timestamp ?? (/* @__PURE__ */ new Date()).toISOString(),
      // ISO 8601 string format
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
    console.log("parseArduinoData output:", sensorData);
    return sensorData;
  }
  updateState(newState) {
    const previousState = { ...this.currentState };
    this.currentState = newState;
    this.emit("stateChanged", this.currentState, previousState);
    this.broadcastToRenderers(newState, previousState);
  }
  broadcastToRenderers(newState, previousState) {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      return;
    }
    if (newState.data && (!previousState.data || JSON.stringify(newState.data) !== JSON.stringify(previousState.data))) {
      this.mainWindow.webContents.send(IPC_CHANNELS.ARDUINO_DATA_UPDATE, newState.data);
    }
    if (newState.isConnected !== previousState.isConnected) {
      this.mainWindow.webContents.send(IPC_CHANNELS.ARDUINO_CONNECTION_STATUS, newState.isConnected);
    }
    if (newState.error && newState.error !== previousState.error) {
      this.mainWindow.webContents.send(IPC_CHANNELS.ARDUINO_ERROR, newState.error);
    }
  }
}
createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
let arduinoService = null;
const ARDUINO_CONFIG = {
  endpoint: "http://192.168.50.137/data.json",
  //do every 2 mins
  pollInterval: 12e4,
  // 2 minutes
  timeout: 15e3,
  // 15 seconds
  retryAttempts: 3
};
const activeSchedules = /* @__PURE__ */ new Map();
function getNextSchedule(timeStr, frequency) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const now = /* @__PURE__ */ new Date();
  const next = /* @__PURE__ */ new Date();
  next.setHours(hours, minutes, 0, 0);
  if (next <= now) {
    if (frequency === "daily") next.setDate(next.getDate() + 1);
    else if (frequency === "weekly") next.setDate(next.getDate() + 7);
    else if (frequency === "bi-weekly") next.setDate(next.getDate() + 14);
    else if (frequency === "every other day") next.setDate(next.getDate() + 2);
  }
  return next;
}
async function executeDeviceCommand(urls) {
  const urlArray = Array.isArray(urls) ? urls : [urls];
  try {
    await Promise.all(urlArray.map(async (url) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to execute command at ${url}: ${response.statusText}`);
      }
    }));
  } catch (error) {
    console.error("Device command error:", error);
    throw error;
  }
}
function scheduleDevice(scheduleData) {
  const { id, time, frequency, urlOn, urlOff } = scheduleData;
  clearSchedule(id);
  function createSchedule() {
    const next = getNextSchedule(time, frequency);
    const delay = next.getTime() - Date.now();
    console.log(`Scheduling ${id} for ${next.toLocaleString()}`);
    const onTimer = setTimeout(async () => {
      const onTime = Date.now();
      try {
        console.log(`Turning ON ${id}`);
        await executeDeviceCommand(urlOn);
        const offDelay = Math.max(0, 15e3 - (Date.now() - onTime));
        const offTimer = setTimeout(async () => {
          try {
            console.log(`Turning OFF ${id}`);
            await executeDeviceCommand(urlOff);
          } catch (error) {
            console.error(`Failed to turn off ${id}:`, error);
          }
        }, offDelay);
        const schedule = activeSchedules.get(id);
        if (schedule) {
          schedule.offTimer = offTimer;
        }
      } catch (error) {
        console.error(`Failed to turn on ${id}:`, error);
      }
      createSchedule();
    }, delay);
    activeSchedules.set(id, { onTimer, offTimer: null });
  }
  createSchedule();
}
function clearSchedule(id) {
  const schedule = activeSchedules.get(id);
  if (schedule) {
    if (schedule.onTimer) clearTimeout(schedule.onTimer);
    if (schedule.offTimer) clearTimeout(schedule.offTimer);
    activeSchedules.delete(id);
  }
}
ipcMain.handle("create-schedule", (event, scheduleData) => {
  console.log("Creating schedule:", scheduleData);
  if (scheduleData.enabled && scheduleData.time) {
    scheduleDevice(scheduleData);
    return { success: true, message: `Schedule created for ${scheduleData.id}` };
  } else {
    clearSchedule(scheduleData.id);
    return { success: true, message: `Schedule cleared for ${scheduleData.id}` };
  }
});
ipcMain.handle("clear-schedule", (event, id) => {
  console.log("Clearing schedule:", id);
  clearSchedule(id);
  return { success: true, message: `Schedule cleared for ${id}` };
});
ipcMain.handle("get-active-schedules", () => {
  return Array.from(activeSchedules.keys());
});
const setupArduinoService = () => {
  if (!win) return;
  arduinoService = new ArduinoDataService(ARDUINO_CONFIG);
  arduinoService.setMainWindow(win);
  setupArduinoIpcHandlers();
  arduinoService.start().catch((error) => {
    console.error("Failed to start Arduino service:", error);
  });
};
const setupArduinoIpcHandlers = () => {
  ipcMain.handle(IPC_CHANNELS.GET_ARDUINO_DATA, async () => {
    if (!arduinoService) {
      throw new Error("Arduino service not initialized");
    }
    return arduinoService.getCurrentState();
  });
  ipcMain.handle(IPC_CHANNELS.UPDATE_ARDUINO_CONFIG, async (_, newConfig) => {
    if (!arduinoService) {
      throw new Error("Arduino service not initialized");
    }
    arduinoService.updateConfig(newConfig);
  });
};
function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  win = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    show: false,
    // Don't show the main window initially
    frame: true,
    // Ensure window has a frame (prevents content from being clipped)
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs")
    }
  });
  setupArduinoService();
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  win.once("ready-to-show", () => {
    closeSplashWindow();
    win == null ? void 0 : win.show();
    win == null ? void 0 : win.focus();
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
app.on("window-all-closed", () => {
  if (arduinoService) {
    arduinoService.stop();
  }
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createSplashWindow();
    createWindow();
  }
});
app.on("before-quit", () => {
  if (arduinoService) {
    arduinoService.stop();
  }
});
app.whenReady().then(() => {
  createSplashWindow();
  createWindow();
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
