// EGG UTA Arduino Code - rev5
// Last Updated 6/8/2025

//NOTE: I mostly just put this file here for reference

// TODO:
// Set up NPK sensor
// Set up additional moisture sensor
// Set up fan control with 2 fans, likely in similar way to pump
// Create a configuration file to control various EGG parameters in a cohesive way
//    Control how often the sensors get polled (POLL_INTERVAL)
//    Dehumidifying routine's length (How long the fans are turned on)
//    Irrigation routine's length (How long the pump is turned on)
//    Speed of the pump and fans (Voltage control)

// Hardware Setup =======================================================================

// - SD Card Reader Pins:
//   - CS on   IO Pin 10
//   - MOSI on IO Pin 11
//   - MISO on IO Pin 12
//   - SCK on  IO Pin 13
//   - VCC on  5V Pin
//   - GND on  GND Pin

// - DHT22 Temperature/Humidity Sensor Pins
//   - Output on   IO Pin 2
//   - Positive on 3.3V Pin
//   - Negative on GND Pin

// - Moisture Sensor Pins
//   - VCC on IO Pin 7
//   - GND on GND Pin
//   - AO on Analog IO Pin A0

// - Pump Pins
//   - MOSFET Gate on Pin 9

// ======================================================================================

// Requires the following Arduino libraries/includes:
// - Standard Arduino SD Card library
// - Standard Arduino RTC library
// - Standard Arduino WiFi library
// - DHT Sensor Library: https://github.com/adafruit/DHT-sensor-library
// - Adafruit Unified Sensor Lib: https://github.com/adafruit/Adafruit_Sensor
#include <SD.h>
#include "DHT.h"
#include "WiFiS3.h"
#include "RTC.h"

// DHT Humidity/Temp Sensor Globals
#define DHTTYPE DHT22   // DHT 22  (AM2302), AM2321
#define DHTPIN 2 // DHT sensor Digital Pin
// If multiple DHT sensors are used, declare additional pins above!
// Datasheet Note:
//  Pin 15 should be avoided!
//  It can work, but DHT must be disconnected during program upload!

// Moisture Sensor Globals
#define moistureSensorPower 7
#define moistureSensorPin A0
// Values sampled from the Moisture Sensor are in the range of 0-1000, where...
//  1000 is as DRY as the sensor can measure (too dry!)
//  0 is as MOIST as the sensor can measure (too wet!)
// Likely need to establish our own range for acceptable moisture levels!
//  For example a value of 1-499 could reflect the EGG is too wet,
//  a value of 500-799 could reflect being at the desired saturation/moisture,
//  and a value of 800 to 999 could reflect the EGG is too dry.

// Pump Globals
const int PumpPin = 9;

// Initialize DHT Sensor
DHT dht(DHTPIN, DHTTYPE);

// SD Card Reading/Writing Globals
const int chipSelect = 10;
#define SD_CS 10
File logFile;

// Timestamp Globals
char ssid[] = "Skynet";     // your network SSID (name)
char pass[] = "t3rm1n4t0r"; // your network password (use for WPA, or use as key for WEP)
int keyIndex = 0;           // your network key index number (needed only for WEP)
#define GMTOffset_hour -5  // # hours difference to UTC -- Just a standard offset
#define DayLightSaving 0   // 1 = daylight saving is active
int status = WL_IDLE_STATUS;
RTCTime currentTime;
unsigned long EpochTime;

// Polling Interval Globals
unsigned long lastSensorPoll = 0;
const unsigned long POLL_INTERVAL = 60000; // Polling sensors every 60 seconds (1 minute)

// Begin the web server
WiFiServer server(80);

// Setup Routine ========================================================================
void setup() {
  Serial.begin(9600); // Select Baud Rate
  delay(1000); // Delay for Serial Monitor Connection

  // Initialize the DHT22 Sensor
  Serial.println(F("Initializing DHT22 Sensor..."));
  dht.begin();

  // Set up analog pins for the Moisture Sensor
  pinMode(moistureSensorPower, OUTPUT);
  digitalWrite(moistureSensorPower, LOW); // Initially keep the Moisture Sensor OFF

  // Set up pins for Pump functionality
  pinMode(PumpPin, OUTPUT);
  digitalWrite(PumpPin, LOW); // Initially keep the Pump OFF

  // Initialize the SD Card Reader
  Serial.println("Initializing SD Card...");
  if (!SD.begin(chipSelect)) { // CS on pin 10
    Serial.println("Initialization failed!");
    while (true);
  }

  RTC.begin(); // Initialize the RTC Module

   // Check for the WiFi module
  if (WiFi.status() == WL_NO_MODULE) {
    Serial.println("Communication with WiFi module failed!");
    while (true); // Don't continue!
  }

  // Attempt to connect to WiFi network
  while (status != WL_CONNECTED) {
    Serial.print("Attempting to connect to SSID: ");
    Serial.print(ssid);
    Serial.println("...");
    status = WiFi.begin(ssid, pass); // Connect to the network
    delay(2000); // Wait 2 seconds for connection before retrying
  }
  Serial.print("Connected to ");
  Serial.println(ssid);

  // Setting up the html website
  server.begin();
  IPAddress ip = WiFi.localIP();
  Serial.print("Hosting html website at this URL: http://");
  //Serial.println(ip);
  Serial.println("192.168.50.169/");

  // Complete Initialization, exit setup routine
  Serial.println("Initialization Complete. Running main loop()...");
}

// Looping Routine ======================================================================
void loop() {

  // Sample the Timestamp
  EpochTime = WiFi.getTime();
  // Account for WiFi connectivity errors by reading the time
  while(EpochTime <= 0)
  {
    Serial.println("Error during reading epoch time! Bad WiFi connection! Retrying...");
    delay(3000);
    EpochTime = WiFi.getTime();
  }

  // Handle clients on the html website
  clientHandler();

  // Poll the sensors at the desired POLL_INTERVAL
  unsigned long currentTime = millis();
  if (currentTime - lastSensorPoll >= POLL_INTERVAL) {
    lastSensorPoll = currentTime;
    Serial.println("\nPolling Sensors...");
    pollSensors();
  }
}

// Polling Sensors Routine ==============================================================
void pollSensors(){
  // Update the timestamp from Unix time to real time
  UpdateRTC(EpochTime);

  // Reading temperature or humidity takes about 250 milliseconds!
  // Sensor readings may also be up to 2 seconds!
  float h = dht.readHumidity();        // Read Humidity
  float t = dht.readTemperature();     // Read temperature as Celsius (isFahrenheit = false)
  float f = dht.readTemperature(true); // Read temperature as Fahrenheit (isFahrenheit = true)

  // Check if any reads failed and exit early (to try again).
  if (isnan(h) || isnan(t) || isnan(f)) {
    Serial.println(F("Failed to read from DHT sensor!"));
    return; // Exits to the beginning of the loop()
  }

  float hif = dht.computeHeatIndex(f, h); // Compute heat index in Fahrenheit
  float hic = dht.computeHeatIndex(t, h, false); // Compute heat index in Celsius

  // Reading the Moisture Sensor's analog value
  int moisture = updateMoisture();
  //Serial.print("Analog Output: ");
  //Serial.println(moisture);

  // Open the log file to be written to:
  //  Future added sensors may write to different .csv files!
  logFile = SD.open("log.csv", FILE_WRITE);

  // Add data entry to log.csv:
  //  Precision of the recorded data values is 2 decimal places
  //  Timestamp is recorded in CST, not UTC
  //  Humidity, Temperature, and Heat Index is recorded on each line at a recorded time
  //  Temperature and Heat Index are written in Celsius
  if (logFile) {
    logFile.print(String(currentTime)); // Timestamp
    logFile.print(",");
    logFile.print(t); // Temperature
    logFile.print(",");
    logFile.print(h); // Humidity
    logFile.print(",");
    logFile.print(hic); // Heat Index
    logFile.print(",");
    logFile.println(moisture); // Moisture
    logFile.close();
  }
  else { // File opening error(s) occured
    Serial.println("Error opening DHTlog.csv!");
  }

  // Print out the sampled data for Serial Monitoring
  Serial.print("Timestamp: " + String(currentTime) + "  ");
  Serial.print(F("Humidity: "));
  Serial.print(h);
  Serial.print(F("%  Temperature: "));
  Serial.print(t);
  Serial.print(F("°C "));
  Serial.print(f);
  Serial.print(F("°F  Heat index: "));
  Serial.print(hic);
  Serial.print(F("°C "));
  Serial.print(hif);
  Serial.print(F("°F  Moisture: "));
  Serial.print(moisture);
  Serial.println(F("/1000"));
}

// Client Handler for HTML Website ======================================================
void clientHandler(){
  WiFiClient client = server.available();
  if (client) {
    String request = client.readStringUntil('\r');
    client.flush();

    if (request.indexOf("GET /data.json") >= 0) {
      File logFile = SD.open("/log.csv");
      if (logFile) {
        client.println("HTTP/1.1 200 OK");
        client.println("Content-Type: application/json");
        client.println("Connection: close");
        client.println();

        client.print("[");
        bool firstLine = true;
        while (logFile.available()) {
          String line = logFile.readStringUntil('\n');
          line.trim();
          if (line.length() == 0) continue;
          if (!firstLine) client.print(",\n");
          client.print(csvLineToJson(line));
          firstLine = false;
        }
        client.println("]");
        logFile.close();
      } else {
        client.println("HTTP/1.1 404 Not Found");
        client.println("Content-Type: text/plain");
        client.println();
        client.println("log.csv not found");
      }

    } else if (request.indexOf("GET /download") >= 0) {
      File logFile = SD.open("/log.csv");
      if (logFile) {
        client.println("HTTP/1.1 200 OK");
        client.println("Content-Type: text/csv");
        client.println("Content-Disposition: attachment; filename=\"log.csv\"");
        client.println("Connection: close");
        client.println();

        while (logFile.available()) {
          client.write(logFile.read());
        }
        logFile.close();
      } else {
        client.println("HTTP/1.1 404 Not Found");
        client.println("Content-Type: text/plain");
        client.println();
        client.println("Could not open log.csv");
      }

    } else if (request.indexOf("GET /data") >= 0) {
      File logFile = SD.open("/log.csv");
      if (logFile) {
        client.println("HTTP/1.1 200 OK");
        client.println("Content-Type: text/plain");
        client.println("Connection: close");
        client.println();

        while (logFile.available()) {
          client.write(logFile.read());
        }
        logFile.close();
      } else {
        client.println("HTTP/1.1 404 Not Found");
        client.println("Content-Type: text/plain");
        client.println();
        client.println("Could not open log.csv");
      }

    } else if (request.indexOf("GET /pump/on") >= 0) {
      digitalWrite(PumpPin, HIGH); // Turning pump ON
      client.println("HTTP/1.1 200 OK");
      client.println("Content-Type: text/plain");
      client.println();
      client.println("Pump turned ON");

    } else if (request.indexOf("GET /pump/off") >= 0) {
      digitalWrite(PumpPin, LOW); // Turning pump OFF
      client.println("HTTP/1.1 200 OK");
      client.println("Content-Type: text/plain");
      client.println();
      client.println("Pump turned OFF");
    
    } else {
      // Main page
      client.println("HTTP/1.1 200 OK");
      client.println("Content-Type: text/html");
      client.println();
      client.println("<!DOCTYPE html><html><head><title>EGG Control</title></head><body>");
      client.println("<h1>EGG Local Data</h1>");

      client.println("<button onclick=\"sendCommand('/pump/on')\">Turn Pump ON</button>");
      client.println("<button onclick=\"sendCommand('/pump/off')\">Turn Pump OFF</button>");
      client.println("<p id=\"status\"></p>");

      client.println("<p><a href=\"/data.json\" target=\"_blank\">View Sensor Data (JSON)</a></p>");
      client.println("<p><a href=\"/json\" download=\"log.json\">Download JSON</a></p>");
      client.println("<p><a href=\"/data\" target=\"_blank\">View Sensor Data (CSV)</a></p>");
      client.println("<p><a href=\"/download\">Download CSV</a><p>");

      client.println("<script>");
      client.println("function sendCommand(path) {");
      client.println("  fetch(path).then(response => response.text()).then(data => {");
      client.println("    document.getElementById('status').innerText = data;");
      client.println("  }).catch(err => {");
      client.println("    document.getElementById('status').innerText = 'Error sending command.';");
      client.println("  });");
      client.println("}");
      client.println("</script>");

      client.println("</body></html>");
    }

    delay(1);
    client.stop();
  }
}

// CSV to JSON Line Conversion Function =================================================
String csvLineToJson(String line) {
  String parts[5];
  int i = 0;
  while (line.length() > 0 && i < 5) {
    int idx = line.indexOf(',');
    if (idx == -1) {
      parts[i++] = line;
      break;
    } else {
      parts[i++] = line.substring(0, idx);
      line = line.substring(idx + 1);
    }
  }
  // This will need to be altered as more sensors are added!!
  String json = "{";
  json += "\"timestamp\":\"" + parts[0] + "\",";
  json += "\"temperature_celcius\":" + parts[1] + ",";
  json += "\"humidity\":" + parts[2] + ",";
  json += "\"heat_index_celcius\":" + parts[3] + ",";
  json += "\"moisture\":" + parts[4];
  json += "}";
  return json;
}

// Timestamp Function ===================================================================
void UpdateRTC(time_t EpochTime) {

  auto timeZoneOffsetHours = GMTOffset_hour + DayLightSaving;
  auto unixTime = EpochTime + (timeZoneOffsetHours * 3600);
  RTCTime timeToSet = RTCTime(unixTime);
  RTC.setTime(timeToSet);

  // Retrieve the date and time from the RTC and print them
  RTC.getTime(currentTime);
}

// Moisture Sensor Function =============================================================
int updateMoisture() {
  digitalWrite(moistureSensorPower, HIGH);  // Turn the sensor ON
  delay(10);                                // Allow power to settle
  int val = analogRead(moistureSensorPin);  // Read the analog value form sensor
  digitalWrite(moistureSensorPower, LOW);   // Turn the sensor OFF
  return val;                               // Return analog moisture value
}