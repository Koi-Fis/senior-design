#!/bin/bash

echo "echo "Initializing database updater at $(date)" >> /home/djd5603/senior-design/egg/backend/logs/scheduler.log 2>1"

# Absolute path to Python
PYTHON="/usr/bin/python3"

# Absolute path to the script
SCRIPT="/home/djd5603/senior-design/egg/backend/tasks.py"

# Run the task
$PYTHON $SCRIPT update_database