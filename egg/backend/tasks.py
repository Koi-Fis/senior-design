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

def run_fan1(period):
    period = int(period)*60 # input recast as an int and converted from minutes to seconds

    interface.fan1_on()
    time.sleep(period)
    interface.fan1_off()

    return

def run_fan2(period):
    period = int(period)*60 # input recast as an int and converted from minutes to seconds

    interface.fan2_on()
    time.sleep(period)
    interface.fan2_off()

    return

def main():
    match(sys.argv[1].lower()):
        case "water_plants":
            # python water_plants.py minutes
            water_plants(sys.argv[2])
        case "check_sensors":
            # python check_sensors.py
            check_sensors()
        case "run_fan1":
            run_fan1(sys.argv[2])
        case "run_fan2":
            run_fan2(sys.argv[2])
        case default:
            print("function not found")
            exit()
            
    return
    
if __name__ == "__main__":
    main()