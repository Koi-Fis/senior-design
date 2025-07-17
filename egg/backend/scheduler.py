from crontab import CronTab
import sys

def init(cron):
    job = cron.new(command='egg/backend/update.sh >> /home/djd5603/senior-design/egg/backend/logs/scheduler.log 2>1')
    job.minute.every(5)
    cron.write()
    return

def create_job(cron, freq):
    job = cron.new(command='echo "Running scheduler.py at $(date)" >> /home/djd5603/senior-design/egg/backend/logs/scheduler.log 2>1')
    job.minute.every(freq)
    cron.write()
    return

def delete_job(cron):
    jobs = list(cron)
    if jobs:
        cron.remove(jobs[0])
        cron.write()
    return

def main():
    cron = CronTab(user='root')
    
    # init(cron)
    # create_job(cron, sys.argv[1])
    # delete_job(cron)

    for job in cron:
        print(job)

    return

if __name__ == "__main__":
    main()