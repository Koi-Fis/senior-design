from crontab import CronTab

cron = CronTab(user='root')
job = cron.new(command='echo "Running scheduler.py at $(date)" >> /home/djd5603/senior-design/egg/backend/logs/scheduler.log 2>1')
job.minute.every(1)
cron.write()