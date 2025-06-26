import sqlite3
import urllib.request
import json
import time

refresh = 1
while(True):

    print()
    print("refresh", refresh, '\n')
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
        #cursor.execute("SELECT * FROM eggbase")
        #print(cursor.fetchone())

        with urllib.request.urlopen("http://192.168.50.169/data.json") as url: 
            data = json.load(url)
            #print(json.dumps(data, indent = 1), '\n')

        #with open('data.json', 'r') as file:
            #data = json.load(file)
            #print(json.dumps(data, indent = 1), '\n')

            for item in data:
                #print(item, '\n')

                val = (item['timestamp'], item['temperature_celcius'], item['humidity'], item['heat_index_celcius'], item['moisture_one'],
                    item['moisture_two'], item['nitrogen'], item['phosphorus'], item['potassium'])
                sql = "INSERT OR IGNORE INTO eggbase (timestamp, temperature_celcius, humidity, heat_index_celcius, moisture_one," \
                    "moisture_two, nitrogen, phosphorus, potassium) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
                #print(sql)

                cursor.execute(sql, val)
                #print(cursor.rowcount)

        '''
        cursor.execute("SELECT * FROM eggbase")
        entries = cursor.fetchall()
        #print(entries, '\n')
        #print(len(entries), "entries", '\n')

        count = 1
        for entry in entries:
            timestamp, temp, humidity, heat, m1, m2, n, p, k = entry
            print("ENTRY", count)
            print("timestamp:    ", timestamp)
            print("temperature:  ", temp)
            print("humidity:     ", humidity)
            print("heat index:   ", heat)
            print("moisture one: ", m1)
            print("moisture two: ", m2)
            print("nitrogen:     ", n)
            print("phosphorus:   ", p)
            print("potassium:    ", k, '\n')
            count += 1
        '''

    time.sleep(60)
    refresh += 1