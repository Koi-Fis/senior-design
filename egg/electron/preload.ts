// Add this to your electron/preload.ts

import { contextBridge, ipcRenderer } from 'electron';

type Frequency = "daily" | "weekly" | "bi-weekly" | "every other day";

interface ScheduleData {
  id: string;
  enabled: boolean;
  time: string;
  frequency: Frequency;
  urlOn: string | string[];
  urlOff: string | string[];
}

contextBridge.exposeInMainWorld('electronAPI', {
  // ... your existing APIs
  
  // Schedule management
  createSchedule: (scheduleData: ScheduleData) => 
    ipcRenderer.invoke('create-schedule', scheduleData),
  
  clearSchedule: (id: string) => 
    ipcRenderer.invoke('clear-schedule', id),
  
  getActiveSchedules: () => 
    ipcRenderer.invoke('get-active-schedules'),
});

// Update your type declarations
declare global {
  interface Window {
    electronAPI: {
      // ... your existing APIs
      createSchedule: (scheduleData: ScheduleData) => Promise<{ success: boolean; message: string }>;
      clearSchedule: (id: string) => Promise<{ success: boolean; message: string }>;
      getActiveSchedules: () => Promise<string[]>;
    }
  }
}