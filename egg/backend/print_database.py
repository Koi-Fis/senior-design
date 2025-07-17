import sqlite3

with sqlite3.connect('egg_test.db') as conn:    
        cursor = conn.cursor()

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