#!/bin/bash

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHEDULE_FILE="$DIR/schedule.json"
SCRIPT="$DIR/${TASK}.sh"

# Validate input
if [ -z "$TASK" ]; then
    echo "Usage: $0 task"
    exit 1
fi

SCRIPT="./${TASK}.sh"

# Time since last run calculation
TODAY=$(date +%Y-%m-%d)
LAST_RUN=$(jq -r --arg task "$TASK"'.[$task].last_run' "$SCHEDULE_FILE")

# Exit if task is not found in the JSON
if [ "$LAST_RUN" == "null" ]; then
    echo "Task '$TASK' not found in $SCHEDULE_FILE"
    exit 1
fi

# Calculate day difference
DIFF=$(( ($(date -d "$TODAY" +%s) - $(date -d "$LAST_RUN" +%s)) / 86400 ))

# Run if it has been at least 2 weeks
if (( DIFF >= 14 )); then
    echo "[$TASK] It's been $DIFF days. Running task..."
    
    # Run the task
    bash "$SCRIPT"

    # Update last_run in JSON
    TMP_FILE=$(mktemp)
    jq --arg task "$TASK" --arg date "$TODAY" '.[$task].last_run = $date' "$SCHEDULE_FILE" > "$TMP_FILE" && mv "$TMP_FILE" "$SCHEDULE_FILE"
else
    echo "[$TASK] Only $DIFF days since last run. Skipping."
fi
