# This file connects python functions to React using the Flask library
# TODO: Figure out how python to React works

from flask import Flask, jsonify, request
from flask_cors import CORS
from interface import pump, get_json

app = Flask(__name__)
CORS(app)

@app.route("/api/pump", methods=["POST"])
def start_pump():
    message = pump()
    return jsonify({"message": message})

@app.route("/api/data", methods=["GET"])
def data():
    data = get_json()
    return jsonify(data)

if __name__ == "__main__":
    app.run(port=5173)