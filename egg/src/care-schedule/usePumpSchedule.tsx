import { useEffect, useRef } from "react";

type Frequency = "daily" | "weekly" | "bi-weekly" | "every other day";

interface PumpScheduleOptions {
  enabled: boolean;
  time: string; // "HH:mm"
  frequency: Frequency;
  urlOn: string | string[]; // Accept string or array of URLs
  urlOff: string | string[];
}

function getNextSchedule(
  timeStr: string,
  frequency: Frequency
): Date {
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

function useDeviceSchedule({
  enabled,
  time,
  frequency,
  urlOn,
  urlOff,
}: PumpScheduleOptions) {
  const timerId = useRef<ReturnType<typeof setTimeout> | null>(null);
  const offTimerId = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled || !time || !frequency) return;

    function scheduleDevice() {
      const next = getNextSchedule(time, frequency);
      const delay = next.getTime() - Date.now();

      timerId.current = setTimeout(async () => {
        const onTime = Date.now();

        try {
          const onUrls = Array.isArray(urlOn) ? urlOn : [urlOn];
          const offUrls = Array.isArray(urlOff) ? urlOff : [urlOff];

          // Turn device(s) ON
          await Promise.all(onUrls.map(url =>
            fetch(url).then(res => {
              if (!res.ok) throw new Error(`Failed to turn on device at ${url}`);
            })
          ));

          // Turn device(s) OFF after 15 seconds
          const offDelay = Math.max(0, 15000 - (Date.now() - onTime));
          offTimerId.current = setTimeout(async () => {
            try {
              await Promise.all(offUrls.map(url =>
                fetch(url).then(res => {
                  if (!res.ok) throw new Error(`Failed to turn off device at ${url}`);
                })
              ));
            } catch (error) {
              console.error("Turn off error:", error);
            }
          }, offDelay);

        } catch (error) {
          console.error("Turn on error:", error);
        }

        scheduleDevice(); // Reschedule for next interval
      }, delay);
    }

    scheduleDevice();

    return () => {
      if (timerId.current) clearTimeout(timerId.current);
      if (offTimerId.current) clearTimeout(offTimerId.current);
    };
  }, [enabled, time, frequency, urlOn, urlOff]);
}

export default function usePumpSchedule(options: PumpScheduleOptions) {
  useDeviceSchedule(options);
}

export function useGrowLightSchedule(options: PumpScheduleOptions) {
  useDeviceSchedule(options);
}

export function useFanSchedule(options: PumpScheduleOptions) {
  useDeviceSchedule(options);
}
