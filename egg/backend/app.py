# This file connects python functions to React using the Flask library
# TODO: Figure out how python to React works

from flask import Flask, jsonify, request
from flask_cors import CORS
from interface import pump, pump_on, pump_off, fan1_on, fan2_on, fan1_off, fan2_off, get_json, get_ip
import scheduler
import time
import subprocess
import sqlite3
import urllib

app = Flask(__name__)
CORS(app)

@app.route("/")
def hello():
    return "<p>Hello, World!</p>"

@app.route("/api/latest_db")
def sensor():
    with sqlite3.connect('egg_test.db') as conn:    
        cursor = conn.cursor()
        val = (1,)
        sql = "SELECT * FROM(SELECT * FROM eggbase ORDER BY timestamp DESC) AS sub ORDER BY timestamp DESC LIMIT ?;"
        cursor.execute(sql, val)
        entry = cursor.fetchone()
        return "<p>" + str(entry) + "</p>"
    
@app.route("/api/latest_sensor")
def last_sensor():
    with urllib.request.urlopen("http://192.168.50.137/data.json") as url:
        entries = url.readlines()
        if entries:
            return "<p>" + entries[-1].decode()[:-3] + "</p>"
        else:
            return

@app.route("/api/cron_water")
def cron_water():
    freq = request.args.get("freq")
    command = f"sudo python scheduler.py {freq}"
    subprocess.run(command, shell=True)
    return "<p>Watering frequency set to " + freq + " minutes!</p>"


@app.route("/api/pump", methods=["GET"])
def start_pump():
    pump()
    return "<p>Pump on!</p>"

@app.route("/api/pump_x")
def pump_x():
    duration = request.args.get("time")
    pump_on()
    time.sleep(int(duration))
    pump_off()
    return "<p>Pump on for " + duration + " seconds!</p>"

@app.route("/api/data", methods=["GET"])
def data():
    data = get_json()
    return jsonify(data)

@app.route("/api/fans_on", methods=["GET"])
def fans_on():
    fan1_on()
    fan2_on()
    return "<p>Fans on!</p>"

@app.route("/api/fans_off", methods=["GET"])
def fans_off():
    fan1_off()
    fan2_off()
    return "<p>Fans off!</p>"

@app.route("/api/fans", methods=["GET"])
def fans():
    fan1_on()
    fan2_on()
    time.sleep(5)
    fan1_off()
    fan2_off()
    return "<p>Hello, fans!</p>"

@app.route("/api/fans_x")
def fans_x():
    duration = request.args.get("time")
    fan1_on()
    fan2_on()
    time.sleep(int(duration))
    fan1_off()
    fan2_off()
    return "<p>Fans on for " + duration + " seconds!</p>"

if __name__ == "__main__":
    app.run(port=5173)