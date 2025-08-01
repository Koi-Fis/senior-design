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

// ============= PYTHON CRON SCHEDULING CODE =============

type Frequency = "daily" | "weekly" | "bi-weekly" | "every other day";

interface ScheduleData {
  id: string;
  enabled: boolean;
  time: string;
  frequency: Frequency;
  urlOn: string | string[];
}

// Simple function to make HTTP calls to Python Flask backend
async function callPythonScheduler(scheduleData: ScheduleData) {
  const { id, time, frequency } = scheduleData;
  
  // Parse time to get hours, minutes, and period
  const [hours, minutes] = time.split(':').map(Number);
  let hours12 = hours;
  let period = 'AM';

  if (hours === 0) {
    hours12 = 12;
  } else if (hours === 12) {
    period = 'PM';
  } else if (hours > 12) {
    hours12 = hours - 12;
    period = 'PM';
  }

  const hoursStr = hours12.toString().padStart(2, '0');
  const minutesStr = minutes.toString().padStart(2, '0');

  // Map device IDs to Python task names
  const taskMap: { [key: string]: string } = {
    'water': 'water_plants',
    'fan': 'run_fans',
    'grow_light': 'grow_light' // You'll need to create this task in Python
  };

  const taskName = taskMap[id] || id;
  
  const url = `http://127.0.0.1:5173/api/schedule?task=${taskName}&hour=${hoursStr}&min=${minutesStr}&ampm=${period}&freq=${frequency}`;
  
  try {
    console.log(`Calling Python scheduler: ${url}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.text();
    console.log(`Python scheduler response: ${result}`);
    return { success: true, message: result };
  } catch (error) {
    console.error(`Failed to call Python scheduler for ${id}:`, error);
    throw error;
  }
}

// IPC handlers for scheduling - now just calls Python
ipcMain.handle('create-schedule', async (event, scheduleData: ScheduleData) => {
  console.log('Creating schedule via Python cron:', scheduleData);
  
  try {
    if (scheduleData.enabled && scheduleData.time) {
      const result = await callPythonScheduler(scheduleData);
      return { success: true, message: `Python cron schedule created for ${scheduleData.id}` };
    } else {
      // For disabling, you might want to add a Python endpoint to remove cron jobs
      console.log(`Schedule disabled for ${scheduleData.id} - cron job should be removed`);
      return { success: true, message: `Schedule disabled for ${scheduleData.id}` };
    }
  } catch (error) {
    return { success: false, message: `Failed to create schedule: ${error}` };
  }
});

ipcMain.handle('clear-schedule', async (event, id: string) => {
  console.log('Clearing schedule via Python cron:', id);
  // You might want to add a Python endpoint to remove specific cron jobs
  // For now, just log it
  return { success: true, message: `Schedule clear requested for ${id} (Python cron cleanup needed)` };
});

ipcMain.handle('get-active-schedules', () => {
  // Since schedules are now in cron, we can't easily track them in Electron
  // You might want to add a Python endpoint to list active cron jobs
  return [];
});

// ============= END PYTHON CRON SCHEDULING CODE =============

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

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
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
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
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