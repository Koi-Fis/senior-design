# Make sure to run from egg/backend, with "python sqlite_test.py"
# To run with the daily average code, run with any additional cmd line parameter, ex. "python sqlite_test a"

# This file creates a test sqlite database from
# the /data.json http request

import sqlite3
import urllib.request
import json
import time
import interface
import sys

with sqlite3.connect('egg_test.db') as conn:    
    cursor = conn.cursor()    
    cursor.execute('''CREATE TABLE IF NOT EXISTS eggbase (
    "timestamp"	TEXT NOT NULL UNIQUE,
    "temperature_celcius"	REAL,
    "humidity"	REAL,
    "heat_index_celcius"	TEXT,
    "moisture_one"	INTEGER,
    "moisture_two"	INTEGER,
    "nitrogen"	REAL,
    "phosphorus"	REAL,
    "potassium"	REAL,
    PRIMARY KEY("timestamp"))''')

    data = interface.get_json()
    #print(json.dumps(data, indent = 1), '\n')

    for item in data:
        val = (item['timestamp'], item['temperature_celcius'], item['humidity'], item['heat_index_celcius'], item['moisture_one'],
                item['moisture_two'], item['nitrogen'], item['phosphorus'], item['potassium'])
        sql = "INSERT OR IGNORE INTO eggbase (timestamp, temperature_celcius, humidity, heat_index_celcius, moisture_one," \
                "moisture_two, nitrogen, phosphorus, potassium) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
        cursor.execute(sql, val)
    
    #print("Json loaded!")