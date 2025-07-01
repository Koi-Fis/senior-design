import 'bootstrap/dist/css/bootstrap.min.css';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import './care-schedule.css';


function CareSchedule() {
  const turnOnPump = async() => {
    try{
      const response = await fetch("http://192.168.50.169/pump/off");
      if (!response.ok) throw new Error('HTTP error! status: Failed to turn on pump');
      console.log("Pump turned on successfully");
      } catch (error) {
        console.error("Error turning on pump:", error);
      }
  };

  return(
    <div className ="landing-page">
      <div className = "schedule-container">

      <DropdownButton className = "schedule-drop" id="dropdown-basic-button" title="Select a Scheduler">
      <Dropdown.Item href="#/action-1">schedule water</Dropdown.Item>
      <Dropdown.Item href="#/action-2">schedule fan</Dropdown.Item>
      <Dropdown.Item href="#/action-3">schedule grow light</Dropdown.Item>
      </DropdownButton>
      </div>

      <div className = "manual-ctrl">

        <button onClick={turnOnPump} className="watering-btn manual-btns">Watering</button> 
        <button className="Fan-btn manual-btns">Fan</button> 
        <button className="Light-btn manual-btns">Grow Light</button> 
      </div>
      
    </div>
  )

}

export default CareSchedule;