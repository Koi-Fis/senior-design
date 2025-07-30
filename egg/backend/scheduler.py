from crontab import CronTab
import sys

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

def cron_schedule():
    

    return

def delete_job(cron):
    jobs = list(cron)
    if jobs:
        cron.remove(jobs[0])
        cron.write()
    return

def main():
    cron = CronTab(user=True)
    
    # init(cron)
    # create_job(cron, sys.argv[1])
    cron_schedule(cron, sys.argv[1])
    # delete_job(cron)

    print(len(cron), "jobs scheduled.")
    for job in cron:
        print(job)

    return

if __name__ == "__main__":
    main()