#!/bin/bash

echo "Running water_plants.bash at $(date)" >> /home/osboxes/senior-design/senior-design/egg/backend/logs/scheduler.log 2>&1

# Absolute path to Python
PYTHON="/usr/bin/python3"

# Absolute path to the script
SCRIPT="/home/osboxes/senior-design/senior-design/egg/backend/tasks.py"

# Run the task
$PYTHON $SCRIPT water_plants 15