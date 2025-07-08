#!/bin/bash

echo "Running check_sensors.bash at %(date)"

# Task will run here
python tasks.py check_sensors

echo "Sensor data has been downloaded."