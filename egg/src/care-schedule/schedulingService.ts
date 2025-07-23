// schedulingService.ts
type Frequency = "daily" | "weekly" | "bi-weekly" | "every other day";

interface ScheduleOptions {
  time: string;
  frequency: Frequency;
  urlOn: string | string[];
  urlOff: string | string[];
}

class SchedulingService {
  private schedules = new Map<string, NodeJS.Timeout>();

  startSchedule(id: string, options: ScheduleOptions) {
    this.stopSchedule(id); // Avoid duplicates

    const scheduleNext = () => {
      const [h, m] = options.time.split(":").map(Number);
      const now = new Date();
      const next = new Date();
      next.setHours(h, m, 0, 0);

      if (next <= now) {
        if (options.frequency === "daily") next.setDate(next.getDate() + 1);
        else if (options.frequency === "weekly") next.setDate(next.getDate() + 7);
        else if (options.frequency === "bi-weekly") next.setDate(next.getDate() + 14);
        else if (options.frequency === "every other day") next.setDate(next.getDate() + 2);
      }

      const delay = next.getTime() - Date.now();
      const timer = setTimeout(async () => {
        try {
          const onUrls = Array.isArray(options.urlOn) ? options.urlOn : [options.urlOn];
          const offUrls = Array.isArray(options.urlOff) ? options.urlOff : [options.urlOff];

          await Promise.all(onUrls.map(url => fetch(url)));
          setTimeout(() => {
            offUrls.forEach(url => fetch(url));
          }, 15000); // turn off after 15 seconds
        } catch (e) {
          console.error("Schedule error:", e);
        }
        scheduleNext(); // recursively schedule next
      }, delay);

      this.schedules.set(id, timer);
    };

    scheduleNext();
  }

  stopSchedule(id: string) {
    const timer = this.schedules.get(id);
    if (timer) clearTimeout(timer);
    this.schedules.delete(id);
  }

  stopAll() {
    this.schedules.forEach(clearTimeout);
    this.schedules.clear();
  }
}

export const schedulingService = new SchedulingService();
