#!/bin/bash

echo "Running run_fans.sh at $(date)" >> /home/osboxes/senior-design/senior-design/egg/backend/logs/scheduler.log 2>&1

# Absolute path to Python
PYTHON="/usr/bin/python3"

# Absolute path to the script
SCRIPT="/home/osboxes/senior-design/senior-design/egg/backend/tasks.py"

# Run the task
$PYTHON $SCRIPT run_fans 5