import './care-schedule.css';

function CareSchedule() {
  const turnOnPump = async() => {
    try{
      const response = await fetch("http://192.168.50.169/fan2/off");
      if (!response.ok) throw new Error('HTTP error! status: Failed to turn on pump');
      console.log("Pump turned on successfully");
      } catch (error) {
        console.error("Error turning on pump:", error);
      }
  };

  return(
    <div className ="landing-page">
      <div className = "schedule-container">
        
        <button onClick={turnOnPump} className="watering-btn">Watering</button>

      </div>
      
    </div>
  )

}

export default CareSchedule;