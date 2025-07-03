<<<<<<< Updated upstream
<<<<<<< Updated upstream

# Make sure to run from egg/backend, with "python sqlite_test.py"
# To run with the daily average code, run with any additional cmd line parameter, ex. "python sqlite_test a"
=======
# This file creates a test sqlite database from
# the /data.json http request
>>>>>>> Stashed changes
=======
# This file creates a test sqlite database from
# the /data.json http request
>>>>>>> Stashed changes

import sqlite3
import urllib.request
import json
import time
import interface
import sys

refresh_rate = 300 # 5 mins
refresh_limit = 86400 # 1 day
daily_entries = refresh_limit / refresh_rate

refresh = 1
while(True):

    print()
    print("Refresh:", refresh, '\n')
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

        # Daily averaging code
        if(len(sys.argv) > 1):
        #if(refresh * refresh_rate > refresh_limit):
            val = (daily_entries,)
            sql = "SELECT * FROM(SELECT * FROM eggbase ORDER BY timestamp DESC) AS sub ORDER BY timestamp DESC LIMIT ?;"
            cursor.execute(sql, val)

            entries = cursor.fetchall()
            avg_temp, avg_humidity, avg_heat, avg_m1, avg_m2, avg_n, avg_p, avg_k = 0.0, 0.0, 0.0, 0, 0, 0.0, 0.0, 0.0

            for entry in entries:
                timestamp, temp, humidity, heat, m1, m2, n, p, k = entry
                avg_temp += float(temp)
                avg_humidity += float(humidity)
                avg_heat += float(heat)
                avg_m1 += int(m1)
                avg_m2 += int(m2)
                avg_n += float(n)
                avg_p += float(p)
                avg_k += float(k)
            avg_temp /= len(entries)
            avg_humidity /= len(entries)
            avg_heat /= len(entries)
            avg_m1 /= len(entries)
            avg_m2 /= len(entries)
            avg_n /= len(entries)
            avg_p /= len(entries)
            avg_k /= len(entries)

    time.sleep(60)
    refresh += 1