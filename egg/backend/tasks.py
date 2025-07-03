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

def main():
    match(sys.argv[0].lower()):
        case "water_plants":
            # python water_plants.py minutes
            water_plants(sys.argv[1])
        case "check_sensors":
            # python check_sensors.py
            check_sensors()
        case default:
            print("function not found")
            exit()
            
    return
    
if __name__ == "__name__":
    main()