import requests
import time

arduino_ip = "192.168.50.100"

def pump():
    # Turns pump on for specified amount of time, then turns off
    pump_on()
    time.sleep(5)
    pump_off()
    return

def fan1_on_for(duration):
    # Turns on fan 1 for specified amount of seconds
    fan1_on()
    time.sleep(duration)
    fan1_off()
    return

def fan2_on_for(duration):
    # Turns on fan 2 for specified amount of seconds
    fan2_on()
    time.sleep(duration)
    fan2_off()
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

def fan1_on():
    # Turn fan 1 ON
    response = requests.get(f"http://{arduino_ip}/fan1/on")
    print("Fan 1 ON:", response.status_code)
    return

def fan1_off():
    # Turn fan 1 OFF
    response = requests.get(f"http://{arduino_ip}/fan1/off")
    print("Fan 1 OFF:", response.status_code)
    return

def fan2_on():
    # Turn fan 2 ON
    response = requests.get(f"http://{arduino_ip}/fan2/on")
    print("Fan 2 ON:", response.status_code)
    return

def fan2_off():
    # Turn fan 2 OFF
    response = requests.get(f"http://{arduino_ip}/fan2/off")
    print("Fan 2 OFF:", response.status_code)
    return

# uncomment to test the pump_on() and pump_off() functions
# pump()            
# json = get_json()
# print(json)
