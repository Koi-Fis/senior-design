import sys
import interface
import time

def water_plants(period):
    period = int(period)*60 # input recast as an int and converted from minutes to seconds

    interface.pump_on()
    time.sleep(period)
    interface.pump_off()

    return

def check_sensors():
    data = interface.get_json()[-1] # display latest entry
    print(data)

    return

def run_fans(period):
    period = int(period)*60 # input recast as an int and converted from minutes to seconds

    interface.fan1_on()
    interface.fan2_on()
    
    time.sleep(period)

    interface.fan1_off()
    interface.fan2_off()

    return

def main():
    run = sys.argv[1].lower()
    if run=="water_plants":
        # python water_plants.py minutes
            water_plants(sys.argv[2])
    elif run=="check_sensors":
        # python check_sensors.py
            check_sensors()
    elif run=="run_fans":
        run_fans(sys.argv[2])
    else:
        print("function not found")
        exit()
                     
    return
    
if __name__ == "__main__":
    main()