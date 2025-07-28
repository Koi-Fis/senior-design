import { BrowserWindow, ipcMain, app, screen } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
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
createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
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
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs")
    }
  });
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
app.whenReady().then(() => {
  createSplashWindow();
  createWindow();
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
