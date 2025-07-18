# This file connects python functions to React using the Flask library
# TODO: Figure out how python to React works

from flask import Flask, jsonify, request
from flask_cors import CORS
from interface import pump, fan1_on, fan2_on, fan1_off, fan2_off, get_json
import time

app = Flask(__name__)
CORS(app)

@app.route("/")
def hello():
    return "<p>Hello, World!</p>"

@app.route("/")
def hello():
    return "<p>Hello, World!</p>"

@app.route("/api/pump", methods=["POST"])
def start_pump():
    message = pump()
    return jsonify({"message": message})

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

if __name__ == "__main__":
    app.run(port=5173)