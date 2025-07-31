#!/bin/bash

SCHEDULE_FILE="schedule.json"
TASK="$1"

# Validate input
if [ -z "$TASK" ]; then
    echo "Usage: $0 TASK_NAME"
    exit 1
fi

SCRIPT="./${TASK}.sh"

# Time since last run calculation
TODAY=$(date +%Y-%m-%d)
LAST_RUN=$(jq -r --arg task "$TASK" '.[$task].last_run' "$SCHEDULE_FILE")

# Exit if task is not found in the JSON
if [ "$LAST_RUN" == "null" ]; then
    echo "Task '$TASK' not found in $SCHEDULE_FILE"
    exit 1
fi

# Calculate day difference
DIFF=$(( ( $(date -d "$TODAY" +%s) - $(date -d "$LAST_RUN" +%s) ) / 86400 ))

# Run task if it's been 2 or more days
if (( DAYS_DIFF >= 2 )); then
    echo "[$TASK] It's been $DAYS_DIFF days. Running task..."

    bash "$SCRIPT"

    # Update last_run to today
    TMP_FILE=$(mktemp)
    jq --arg task "$TASK" --arg date "$TODAY" '.[$task].last_run = $date' "$SCHEDULE_FILE" > "$TMP_FILE" && mv "$TMP_FILE" "$SCHEDULE_FILE"
else
    echo "[$TASK] Only $DAYS_DIFF days since last run. Skipping."
fi
