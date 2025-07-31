"use strict";
const electron = require("electron");
const IPC_CHANNELS = {
  ARDUINO_DATA_UPDATE: "arduino-data-update",
  ARDUINO_CONNECTION_STATUS: "arduino-connection-status",
  ARDUINO_ERROR: "arduino-error",
  GET_ARDUINO_DATA: "get-arduino-data",
  UPDATE_ARDUINO_CONFIG: "update-arduino-config"
};
window.addEventListener("beforeunload", () => {
  electron.ipcRenderer.removeAllListeners(IPC_CHANNELS.ARDUINO_DATA_UPDATE);
  electron.ipcRenderer.removeAllListeners(IPC_CHANNELS.ARDUINO_CONNECTION_STATUS);
  electron.ipcRenderer.removeAllListeners(IPC_CHANNELS.ARDUINO_ERROR);
});
const arduinoAPI = {
  onDataUpdate: (callback) => {
    const wrapped = (_, data) => callback(data);
    electron.ipcRenderer.on(IPC_CHANNELS.ARDUINO_DATA_UPDATE, wrapped);
    return () => electron.ipcRenderer.removeListener(IPC_CHANNELS.ARDUINO_DATA_UPDATE, wrapped);
  },
  onConnectionStatusChange: (callback) => {
    const wrapped = (_, status) => callback(status);
    electron.ipcRenderer.on(IPC_CHANNELS.ARDUINO_CONNECTION_STATUS, wrapped);
    return () => electron.ipcRenderer.removeListener(IPC_CHANNELS.ARDUINO_CONNECTION_STATUS, wrapped);
  },
  onError: (callback) => {
    const wrapped = (_, err) => callback(err);
    electron.ipcRenderer.on(IPC_CHANNELS.ARDUINO_ERROR, wrapped);
    return () => electron.ipcRenderer.removeListener(IPC_CHANNELS.ARDUINO_ERROR, wrapped);
  },
  getCurrentData: () => electron.ipcRenderer.invoke(IPC_CHANNELS.GET_ARDUINO_DATA),
  updateConfig: (config) => electron.ipcRenderer.invoke(IPC_CHANNELS.UPDATE_ARDUINO_CONFIG, config)
};
const scheduleAPI = {
  createSchedule: (scheduleData) => electron.ipcRenderer.invoke("create-schedule", scheduleData),
  clearSchedule: (id) => electron.ipcRenderer.invoke("clear-schedule", id),
  getActiveSchedules: () => electron.ipcRenderer.invoke("get-active-schedules")
};
const existingAPI = window.electronAPI || {};
const enhancedElectronAPI = {
  ...existingAPI,
  arduino: arduinoAPI,
  schedule: scheduleAPI
};
electron.contextBridge.exposeInMainWorld("electronAPI", enhancedElectronAPI);
electron.contextBridge.exposeInMainWorld("platform", {
  isWindows: process.platform === "win32",
  isMac: process.platform === "darwin",
  isLinux: process.platform === "linux"
});
