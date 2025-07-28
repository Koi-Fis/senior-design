// Create new file: src/care-schedule/useElectronSchedule.tsx

import { useEffect } from "react";

type Frequency = "daily" | "weekly" | "bi-weekly" | "every other day";

interface ElectronScheduleOptions {
  id: string; // unique identifier for the schedule
  enabled: boolean;
  time: string; // "HH:mm"
  frequency: Frequency;
  urlOn: string | string[];
  urlOff: string | string[];
}

function useElectronSchedule({
  id,
  enabled,
  time,
  frequency,
  urlOn,
  urlOff,
}: ElectronScheduleOptions) {
  useEffect(() => {
    // Only proceed if we have the electron API available
    if (!window.electronAPI) {
      console.warn('Electron API not available');
      return;
    }

    const scheduleData = {
      id,
      enabled,
      time,
      frequency,
      urlOn,
      urlOff,
    };

    // Create or update the schedule in the main process
    window.electronAPI.createSchedule(scheduleData)
      .then(result => {
        console.log(`Schedule ${id}:`, result.message);
      })
      .catch(error => {
        console.error(`Failed to create schedule ${id}:`, error);
      });

    // Cleanup function - this won't clear the schedule when component unmounts
    // The schedule will persist in the main process
    return () => {
      // Only clear if explicitly disabled, not on component unmount
      if (!enabled) {
        window.electronAPI.clearSchedule(id).catch(console.error);
      }
    };
  }, [id, enabled, time, frequency, urlOn, urlOff]);

  // Method to manually clear the schedule
  const clearSchedule = () => {
    if (window.electronAPI) {
      return window.electronAPI.clearSchedule(id);
    }
    return Promise.reject('Electron API not available');
  };

  return { clearSchedule };
}

export default useElectronSchedule;