#!/bin/bash

echo "Running check_sensors.bash at $(date)"

# Absolute path to Python
PYTHON="/usr/bin/python3"

# Absolute path to the script
SCRIPT="/home/djd5603/senior-design/egg/backend/tasks.py"

# Run the task
$PYTHON $SCRIPT check_sensors