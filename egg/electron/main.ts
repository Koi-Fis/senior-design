import { app, BrowserWindow, ipcMain, screen } from 'electron' // Add ipcMain and screen import
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { createSplashWindow, closeSplashWindow } from './splash.ts'
import { ArduinoDataService } from './ArduinoDataService';
import { IPC_CHANNELS } from './types/arduino';
import type { ArduinoConfig } from './types/arduino';

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null
let arduinoService: ArduinoDataService | null = null;

// Arduino configuration - make this configurable via settings
const ARDUINO_CONFIG: ArduinoConfig = {
  endpoint: 'http://192.168.50.137/data.json',

  //do every 2 mins
  pollInterval: 120000, // 2 minutes
  timeout: 15000, // 15 seconds
  retryAttempts: 3
};

// ============= SCHEDULING CODE =============

type Frequency = "daily" | "weekly" | "bi-weekly" | "every other day";

interface ScheduleData {
  id: string;
  enabled: boolean;
  time: string;
  frequency: Frequency;
  urlOn: string | string[];
 
}

// Store active schedules
const activeSchedules = new Map<string, {
  onTimer: NodeJS.Timeout | null;
  offTimer: NodeJS.Timeout | null;
}>();

function getNextSchedule(timeStr: string, frequency: Frequency): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const now = new Date();
  const next = new Date();
  next.setHours(hours, minutes, 0, 0);

  if (next <= now) {
    if (frequency === "daily") next.setDate(next.getDate() + 1);
    else if (frequency === "weekly") next.setDate(next.getDate() + 7);
    else if (frequency === "bi-weekly") next.setDate(next.getDate() + 14);
    else if (frequency === "every other day") next.setDate(next.getDate() + 2);
  }

  return next;
}

async function executeDeviceCommand(urls: string | string[]) {
  const urlArray = Array.isArray(urls) ? urls : [urls];
  
  try {
    await Promise.all(urlArray.map(async (url) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to execute command at ${url}: ${response.statusText}`);
      }
    }));
  } catch (error) {
    console.error('Device command error:', error);
    throw error;
  }
}

function scheduleDevice(scheduleData: ScheduleData) {
  const { id, time, frequency, urlOn} = scheduleData;
  
  // Clear existing schedule if any
  clearSchedule(id);
  
  function createSchedule() {
    const next = getNextSchedule(time, frequency);
    const delay = next.getTime() - Date.now();
    
    console.log(`Scheduling ${id} for ${next.toLocaleString()}`);
    
    const onTimer = setTimeout(async () => {
      
      
      try {
        // Turn device ON
        console.log(`Turning ON ${id}`);
        await executeDeviceCommand(urlOn);
        
        
      } catch (error) {
        console.error(`Failed to turn on ${id}:`, error);
      }
      
      // Reschedule for next interval
      createSchedule();
    }, delay);
    
    // Store the timer
    activeSchedules.set(id, { onTimer, offTimer: null });
  }
  
  createSchedule();
}

function clearSchedule(id: string) {
  const schedule = activeSchedules.get(id);
  if (schedule) {
    if (schedule.onTimer) clearTimeout(schedule.onTimer);
    if (schedule.offTimer) clearTimeout(schedule.offTimer);
    activeSchedules.delete(id);
  }
}

// IPC handlers for scheduling
ipcMain.handle('create-schedule', (event, scheduleData: ScheduleData) => {
  console.log('Creating schedule:', scheduleData);
  
  if (scheduleData.enabled && scheduleData.time) {
    scheduleDevice(scheduleData);
    return { success: true, message: `Schedule created for ${scheduleData.id}` };
  } else {
    clearSchedule(scheduleData.id);
    return { success: true, message: `Schedule cleared for ${scheduleData.id}` };
  }
});

ipcMain.handle('clear-schedule', (event, id: string) => {
  console.log('Clearing schedule:', id);
  clearSchedule(id);
  return { success: true, message: `Schedule cleared for ${id}` };
});

ipcMain.handle('get-active-schedules', () => {
  return Array.from(activeSchedules.keys());
});

// ============= END SCHEDULING CODE =============

// ============= ARDUINO SERVICE SETUP =============

const setupArduinoService = (): void => {
  if (!win) return;
  
  // Initialize Arduino service
  arduinoService = new ArduinoDataService(ARDUINO_CONFIG);
  arduinoService.setMainWindow(win);
  
  // Setup IPC handlers for Arduino
  setupArduinoIpcHandlers();
  
  // Start the service
  arduinoService!.start().catch((error: unknown) => {
    console.error('Failed to start Arduino service:', error);
  });
};

const setupArduinoIpcHandlers = (): void => {
  // Handle requests for current Arduino data
  ipcMain.handle(IPC_CHANNELS.GET_ARDUINO_DATA, async () => {
    if (!arduinoService) {
      throw new Error('Arduino service not initialized');
    }
    return arduinoService.getCurrentState();
  });

  // Handle Arduino config updates
  ipcMain.handle(IPC_CHANNELS.UPDATE_ARDUINO_CONFIG, async (_, newConfig) => {
    if (!arduinoService) {
      throw new Error('Arduino service not initialized');
    }
    arduinoService.updateConfig(newConfig);
  });
};

// ============= END ARDUINO SERVICE SETUP =============

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.workAreaSize

  win = new BrowserWindow({
    width: width,
    height: height,
    x: 0,
    y: 0,
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    show: false, // Don't show the main window initially
    frame: true, // Ensure window has a frame (prevents content from being clipped)
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  // Setup Arduino service
  setupArduinoService();

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  // Show main window and close splash when ready
  win.once('ready-to-show', () => {
    // Close splash screen
    closeSplashWindow()
    
    // Show and focus main window
    win?.show()
    win?.focus()
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
  
}

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // Stop Arduino service before quitting
  if (arduinoService) {
    arduinoService.stop();
  }
  
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  
  if (BrowserWindow.getAllWindows().length === 0) {
    createSplashWindow()
    createWindow()
  }
})

// Handle app closing cleanup
app.on('before-quit', () => {
  if (arduinoService) {
    arduinoService.stop();
  }
});

app.whenReady().then(() => {
  createSplashWindow()
  createWindow()
})