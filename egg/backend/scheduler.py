from crontab import CronTab
import sys
from datetime import datetime

# python [task] [time12hr] [frequency]
# Ex: python scheduler.py 'water_plants' '08:15' 'daily'


# Frontend passes task, time, and frequency.
# 1. Check for and remove prior jobs
# 2. Run frequency bash
# 3. Run task with frequency

def list_jobs(cron):
    count = len(list(cron))
    print(f"Tasks Scheduled [{count}]:")
    for job in cron:
        print(job)

def create_job(cron, task, time, frequency):
    # Account for time
    hour, minute = map(int, time.split(':'))
    weekday = (datetime.today().weekday() + 1) % 7

    # Every other day and bi-weekly must be calculated every day/week
    if(frequency=='every other day'):
        bash = "every_other_day.sh" + " " + task + ".sh"
    elif(frequency=='bi-weekly'):
        bash = "bi_weekly.sh" + " " + task + ".sh"
    else:
        bash = task + ".sh"

    # Create job
    print(f"Scheduling '{task}'")
    job = cron.new(command=bash, comment=task)

    # TODO: Schedule time and frequency
    if (frequency == 'daily') or (frequency == 'every other day'):
        print(f"Scheduling job {task} {frequency} at {hour}:{minute}")
        job.setall(f"{minute} {hour} * * *")
    elif (frequency == 'weekly') or (frequency == 'bi-weekly'):
        day_name = ""
        if weekday==0 or weekday==7:
            day_name="sunday"
        elif weekday==1:
            day_name="monday"
        elif weekday==2:
            day_name="tuesday"
        elif weekday==3:
            day_name="wednesday"
        elif weekday==4:
            day_name="thursday"
        elif weekday==5:
            dayname="friday"
        elif weekday==6:
            dayname="saturday"
        print(f"Scheduling job {task} {frequency} on {day_name}s at {hour}:{minute}")
        job.setall(f"{minute} {hour} * * {weekday}")
    else:
        print(f"Frequency '{frequency}' is not valid")

    cron.write()
    return

# Deletes ALL existing instances of "task"
def delete_job(cron, task):
    removed = False # Flag is used to prevent running cron.write more than necessary
    for job in cron:
        if job.comment==task:
            print(f"Clearing prior job instance of '{task}' containing {job.command}")
            cron.remove(job)
            removed = True
    if removed:
        cron.write()
    else:
        print(f"No task found called '{task}'")
    return

# library function for converting am/pm time to 24hr time
def convert_time(input):
    # input: "HH:MM AM/PM" (example: "03:30 PM", "10:00 AM")
    try:
        time = datetime.strptime(input, '%I:%M %p')
        return time.strftime('%H:%M')
    except ValueError:
        return "Invalid input, use HH:MM AM/PM."

def main():
    # Initialize cron object
    cron = CronTab(user=True)

    # Take input passed from frontend
    task = sys.argv[1]
    time_12hr = sys.argv[2]
    frequency = sys.argv[3]

    # Convert 12 hour format to 24 hour format
    time_24hr = convert_time(time_12hr)

    # TODO: Validate input?

    # Clear prior instance of task
    delete_job(cron, task)

    # Create new instance of task
    create_job(cron, task, time_24hr, frequency)

    # List current jobs
    list_jobs(cron)

    return

if __name__ == "__main__":
    main()