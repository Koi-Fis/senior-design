#!/bin/bash

echo "Running run_fans.sh at $(date)"

# Absolute path to Python
PYTHON="/usr/bin/python3"

# Absolute path to the script
SCRIPT="/home/osboxes/senior-design/egg/backend/tasks.py"

# Run the task
$PYTHON $SCRIPT run_fans