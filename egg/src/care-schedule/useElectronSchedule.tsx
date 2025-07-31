// src/care-schedule/useElectronSchedule.tsx
import { useEffect } from "react";

type Frequency = "daily" | "weekly" | "bi-weekly" | "every other day";

interface ElectronScheduleOptions {
  id: string;              // unique identifier for the schedule
  enabled: boolean;        // whether the schedule is active
  time: string;            // in "HH:mm" format
  frequency: Frequency;    // repetition pattern
  urlOn: string | string[];
  urlOff: string | string[];
}

/**
 * Hook to create and manage device command schedules via Electron main process
 */
function useElectronSchedule({
  id,
  enabled,
  time,
  frequency,
  urlOn,
  urlOff,
}: ElectronScheduleOptions) {
  useEffect(() => {
    // Ensure the schedule API bridge is available
    if (!window.electronAPI?.schedule) {
      console.warn("Electron schedule API not available");
      return;
    }

    const scheduleData = { id, enabled, time, frequency, urlOn, urlOff };

    // Create or update the schedule in the main process
    window.electronAPI.schedule
      .createSchedule(scheduleData)
      .then((result) => {
        console.log(`Schedule '${id}': ${result.message}`);
      })
      .catch((error) => {
        console.error(`Failed to create/update schedule '${id}':`, error);
      });

    // Cleanup: clear the schedule when it becomes disabled
    return () => {
      if (!enabled && window.electronAPI?.schedule) {
        window.electronAPI.schedule.clearSchedule(id).catch((err) => {
          console.error(`Failed to clear schedule '${id}':`, err);
        });
      }
    };
  }, [id, enabled, time, frequency, urlOn, urlOff]);

  /**
   * Manually clear the schedule
   */
  const clearSchedule = () => {
    if (!window.electronAPI?.schedule) {
      return Promise.reject("Electron schedule API not available");
    }
    return window.electronAPI.schedule.clearSchedule(id);
  };

  return { clearSchedule };
}

export default useElectronSchedule;
