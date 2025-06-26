import requests
import time

arduino_ip = "192.168.50.169"

def pump():
    # Turns pump on for specified amount of time, then turns off
    pump_on()
    time.sleep(5)
    pump_off()
    return

def pump_on():
    # Turn pump ON
    response = requests.get(f"http://{arduino_ip}/pump/on")
    print("Pump ON:", response.status_code)
    return

def pump_off():
    # Turn pump OFF
    response = requests.get(f"http://{arduino_ip}/pump/off")
    print("Pump OFF:", response.status_code)
    return

def get_json():
    # retrieves json in the form of a list of dictionaries (for each time stamp)
    response = requests.get(f"http://{arduino_ip}/data.json")
    print(type(response))
    data = response.json()
    return data

# uncomment to test the pump_on() and pump_off() functions
# pump()            
json = get_json()
print(json)
