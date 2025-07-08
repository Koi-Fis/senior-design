import { useEffect, useRef } from 'react';

type Frequency = 'daily' | 'weekly' | 'bi-weekly';

interface PumpScheduleOptions {
  enabled: boolean;
  time: string; // "HH:mm"
  frequency: Frequency;
  urlOn: string;  // URL to turn ON the pump
  urlOff: string; // URL to turn OFF the pump
}

function getNextSchedule(timeStr: string, frequency: Frequency): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();
  const next = new Date();
  next.setHours(hours, minutes, 0, 0);

  if (next <= now) {
    if (frequency === 'daily') {
      next.setDate(next.getDate() + 1);
    } else if (frequency === 'weekly') {
      next.setDate(next.getDate() + 7);
    } else if (frequency === 'bi-weekly') {
      next.setDate(next.getDate() + 14);
    }
  }
  return next;
}

export default function usePumpSchedule({ enabled, time, frequency, urlOn, urlOff }: PumpScheduleOptions) {
  const timerId = useRef<ReturnType<typeof setTimeout> | null>(null);
  const offTimerId = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled || !time || !frequency) return;

    function schedulePump() {
      const next = getNextSchedule(time, frequency);
      const delay = next.getTime() - Date.now();

      timerId.current = setTimeout(async () => {
        try {
          // Turn pump ON
          const response = await fetch(urlOn);
          if (!response.ok) throw new Error('HTTP error! Failed to turn on pump');
          // Optionally: notify success

          // Schedule pump OFF after 15 seconds (15000ms)
          offTimerId.current = setTimeout(async () => {
            try {
              const offResponse = await fetch(urlOff);
              if (!offResponse.ok) throw new Error('HTTP error! Failed to turn off pump');
              // Optionally: notify success
            } catch (error) {
              // Optionally: handle error
            }
          }, 15000);

        } catch (error) {
          // Optionally: notify error
        }
        schedulePump(); // Reschedule for next interval
      }, delay);
    }

    schedulePump();

    return () => {
      if (timerId.current) clearTimeout(timerId.current);
      if (offTimerId.current) clearTimeout(offTimerId.current);
    };
  }, [enabled, time, frequency, urlOn, urlOff]);
}