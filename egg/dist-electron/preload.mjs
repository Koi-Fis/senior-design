"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  // ... your existing APIs
  // Schedule management
  createSchedule: (scheduleData) => electron.ipcRenderer.invoke("create-schedule", scheduleData),
  clearSchedule: (id) => electron.ipcRenderer.invoke("clear-schedule", id),
  getActiveSchedules: () => electron.ipcRenderer.invoke("get-active-schedules")
});
