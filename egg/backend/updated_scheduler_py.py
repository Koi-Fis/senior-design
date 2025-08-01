# Add this to the end of your scheduler.py main() function

def main():
    # Initialize cron object
    cron = CronTab(user=True)

    # Check if this is a remove command
    if len(sys.argv) > 1 and sys.argv[1] == "remove":
        if len(sys.argv) < 3:
            print("Error: No task specified for removal")
            return
        
        task = sys.argv[2]
        print(f"Removing all instances of task: {task}")
        delete_job(cron, task)
        list_jobs(cron)
        return

    # Original scheduling logic
    if len(sys.argv) < 4:
        print("Error: Not enough arguments. Usage: scheduler.py <task> <time> <frequency>")
        return
        
    # Take input passed from frontend
    task = sys.argv[1]
    time_12hr = sys.argv[2]
    time_12hr = time_12hr.replace("_", " ")
    frequency = sys.argv[3]

    # Convert 12 hour format to 24 hour format
    time_24hr = convert_time(time_12hr)

    # Clear prior instance of task
    delete_job(cron, task)

    # Create new instance of task
    create_job(cron, task, time_24hr, frequency)

    # Update initialization date
    update_init(task, frequency)

    # List current jobs
    list_jobs(cron)

    return