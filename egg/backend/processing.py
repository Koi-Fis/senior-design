import sqlite3
import sys

# Temp storage for code

refresh_rate = 300 # 5 mins
refresh_limit = 86400 # 1 day
daily_entries = refresh_limit / refresh_rate

with sqlite3.connect('egg_test.db') as conn:    
    cursor = conn.cursor()

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
