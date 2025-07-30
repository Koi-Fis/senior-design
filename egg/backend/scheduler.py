from crontab import CronTab
import sys
from datetime import datetime

def init(cron):
    job = cron.new(command='egg/backend/update.sh >> /home/osboxes/Documents/senior-design/egg/backend/logs/scheduler.log 2>1')
    job.minute.every(5)
    cron.write()
    return

def create_job(cron, freq):
    job = cron.new(command='echo "Running scheduler.py at $(date)" >> /home/osboxes/Documents/senior-design/egg/backend/logs/scheduler.log 2>1')
    job.minute.every(freq)
    cron.write()
    return

def cron_schedule(cron, am_pm_time, days):
    job = cron.new(command='echo "Running cron schedule at $(date)" >> /home/osboxes/Documents/senior-design/egg/backend/logs/scheduler.log 2>1')
    time = convert_time(am_pm_time)
    min, hour = time.split(':')
    
    if(days == "daily"):
        str = min + " " + hour + " * * *"
        job.setall(str)
        cron.write()

    elif(days == "weekly"):
        str = min + " " + hour + " * * 0"
        job.setall(str)
        cron.write()

    '''
    # if week%2
    #     water
    #     week=0
    # week++
    elif(days == "bi-weekly"):
        str = min + " " + hour + " 1,15 * *"
        job.setall(str)
        cron.write()

    elif(days == "every other day"):
    '''

    return

def delete_job(cron):
    jobs = list(cron)
    if jobs:
        cron.remove(jobs[0])
        cron.write()
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
    cron = CronTab(user=True)
    
    # init(cron)
    # create_job(cron, sys.argv[1])

    # example:
    # python scheduler.py '08:15' 'daily'
    cron_schedule(cron, sys.argv[1], sys.argv[2])

    #delete_job(cron)

    for job in cron:
        print(job)

    return

if __name__ == "__main__":
    main()