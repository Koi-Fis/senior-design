// EGG UTA Arduino Code - rev13
// Last Updated 7/27/2025

// TODO:
// Set up NPK sensor
//    Next step is to retry with different pins probably
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

// - Moisture Sensor One Pins
//   - VCC on IO Pin 7
//   - GND on GND Pin
//   - AO on Analog IO Pin A0

// - Moisture Sensor Two Pins
//   - VCC on IO Pin 8
//   - GND on GND Pin
//   - AO on Analog IO Pin A1

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
#define DHTPIN 4 // DHT sensor Digital Pin
#define DHTPINTWO 3 // DHT sensor Digital Pin
// If multiple DHT sensors are used, declare additional pins above!
// Datasheet Note:
//  Pin 15 should be avoided!
//  It can work, but DHT must be disconnected during program upload!

// Moisture Sensor Globals
#define moistureSensorOnePower 7
#define moistureSensorOnePin A0
#define moistureSensorTwoPower 8
#define moistureSensorTwoPin A1
int moistureOne;
int moistureTwo;
// Values sampled from the Moisture Sensor are in the range of 0-1000, where...
//  1000 is as DRY as the sensor can measure (too dry!)
//  0 is as MOIST as the sensor can measure (too wet!)
// Likely need to establish our own range for acceptable moisture levels!
//  For example a value of 1-499 could reflect the EGG is too wet,
//  a value of 500-799 could reflect being at the desired saturation/moisture,
//  and a value of 800 to 999 could reflect the EGG is too dry.

// Pump Globals
const int pumpPin = 9;

// Fan Globals
const int fanOne = 5;
const int fanTwo = 6;

// Initialize DHT Sensor
DHT dht(DHTPIN, DHTTYPE);
DHT dht2(DHTPINTWO, DHTTYPE);

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
unsigned long lastTriggerDay = 0;

// Polling Interval Globals
unsigned long lastSensorPoll = 0;
const unsigned long POLL_INTERVAL = 120000; // Polling sensors every 60 seconds (1 minute) // CHANGE TO 30000

// Begin the web server, and instantiate its globals
WiFiServer server(80);
bool pumpOn = false;
bool fan1On = false;
bool fan2On = false;

// Counter to delete data regularly
int entryCounter = 0;

// Setup Routine ========================================================================
void setup() {
  Serial.begin(9600); // Select Baud Rate
  delay(1000); // Delay for Serial Monitor Connection

  // Initialize the DHT22 Sensor
  Serial.println(F("Initializing DHT22 Sensor..."));
  dht.begin();
  dht2.begin();

  // Set up analog pins for the Moisture Sensor
  pinMode(moistureSensorOnePower, OUTPUT);
  pinMode(moistureSensorTwoPower, OUTPUT);
  digitalWrite(moistureSensorTwoPower, LOW); // Initially keep the Moisture Sensor OFF

  // Set up pins for Pump functionality
  pinMode(pumpPin, OUTPUT);
  digitalWrite(pumpPin, LOW); // Initially keep the Pump OFF

  // Set up pins for Fan functionality
  pinMode(fanOne, OUTPUT);
  analogWrite(fanOne, 0); // Initially keep the Fan OFF
  pinMode(fanTwo, OUTPUT);
  analogWrite(fanTwo, 0); // Initially keep the Fan OFF

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
  digitalWrite(moistureSensorOnePower, LOW); // Initially keep the Moisture Sensor OFF
  Serial.print("Connected to ");
  Serial.println(ssid);

  // Setting up the html website
  server.begin();
  delay(1000);
  IPAddress ip = WiFi.localIP();
  Serial.print("Hosting html website at this URL: http://");
  Serial.println(ip);

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
  auto timeZoneOffsetHours = GMTOffset_hour + DayLightSaving;
  auto unixTime = EpochTime + (timeZoneOffsetHours * 3600);
  RTCTime timeToSet = RTCTime(unixTime);
  Serial.print("Unix Time: ");
  Serial.println(unixTime);
  RTC.setTime(timeToSet);
  // Retrieve the date and time from the RTC and print them
  RTC.getTime(currentTime);

  // Reaffirm the IP the html site is being hosted at
  IPAddress ip = WiFi.localIP();
  Serial.print("Hosting html website at this URL: http://");
  Serial.println(ip);

  // Reading temperature or humidity takes about 250 milliseconds!
  // Sensor readings may also be up to 2 seconds!
  float h = dht.readHumidity();        // Read Humidity
  float t = dht.readTemperature();     // Read temperature as Celsius (isFahrenheit = false)
  float f = dht.readTemperature(true); // Read temperature as Fahrenheit (isFahrenheit = true)
  delay(1000);
  float h2 = dht2.readHumidity();        // Read Humidity
  float t2 = dht2.readTemperature();     // Read temperature as Celsius (isFahrenheit = false)
  float f2 = dht2.readTemperature(true); // Read temperature as Fahrenheit (isFahrenheit = true)

  // Check if any reads failed and exit early (to try again).
  if (isnan(h) || isnan(t) || isnan(f)) {
    Serial.println(F("Failed to read from DHT sensor one!"));
    return; // Exits to the beginning of the loop()
  }

  if (isnan(h2) || isnan(t2) || isnan(f2)){
    Serial.println(F("Failed to read from DHT sensor two!"));
    return; // Exits to the beginning of the loop()
  }

  float hif = dht.computeHeatIndex(f, h); // Compute heat index in Fahrenheit
  float hic = dht.computeHeatIndex(t, h, false); // Compute heat index in Celsius
  float hif2 = dht2.computeHeatIndex(f2, h2); // Compute heat index in Fahrenheit
  float hic2 = dht2.computeHeatIndex(t2, h2, false); // Compute heat index in Celsius

  // Average the values from the two sensors to be output into the log file
  h = (h + h2)/2;
  t = (t + t2)/2;
  f = (f + f2)/2;
  hif = (hif + hif2)/2;
  hic = (hic + hic2)/2;

  // Reading the Moisture Sensor's analog value
  updateMoisture();
  //Serial.print("Analog Output: ");
  //Serial.println(moisture);

  // NPK declaration -- Need to be changed with working module
  float nitrogen = -1.0;
  float phosphorus = -1.0;
  float potassium = -1.0;

  // Increment the entry counter
  entryCounter += 1;
  // Break into days since epoch
  unsigned long secondsInDay = unixTime % 86400;
  unsigned long currentDay = unixTime / 86400;

  // Delete the file after getting 1 day's worth of entries
  if ((entryCounter == 576) || (secondsInDay < 120 && currentDay != lastTriggerDay)) {
    deleteFile("log.csv");
    entryCounter = 1;
    lastTriggerDay = currentDay;
  }
  Serial.print("Number of Entries: ");
  Serial.println(entryCounter);

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
    logFile.print(moistureOne); // Moisture
    logFile.print(",");
    logFile.print(moistureTwo); // Moisture
    logFile.print(",");
    logFile.print(nitrogen); // Moisture
    logFile.print(",");
    logFile.print(phosphorus); // Moisture
    logFile.print(",");
    logFile.println(potassium); // Moisture
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
  Serial.print(F("°F  Moisture One: "));
  Serial.print(moistureOne);
  Serial.print(F("/1000  Moisture Two: "));
  Serial.print(moistureTwo);
  Serial.print(F("/1000  Nitrogen: "));
  Serial.print(nitrogen);
  Serial.print(F("mg/kg  Phosphorus: "));
  Serial.print(phosphorus);
  Serial.print(F("mg/kg  Potassium: "));
  Serial.print(potassium);
  Serial.println(F("mg/kg"));
}

// Client Handler for HTML Website ======================================================
void clientHandler() {
  WiFiClient client = server.available();
  if (client) {
    Serial.println("New Client");
    String header = "";
    boolean currentLineIsBlank = true;

    while (client.connected()) {
      if (client.available()) {
        char c = client.read();
        header += c;

        if (c == '\n' && currentLineIsBlank) {
          // === Hardware Control Routes ===
          if (header.indexOf("GET /fan1/on") >= 0) {
            analogWrite(fanOne, 255);
            fan1On = true;
            client.println("HTTP/1.1 200 OK");
            client.println("Access-Control-Allow-Origin: *");
            client.println("Connection: close");
            client.println();
            client.println("Fan 1 ON");
            break;
          } else if (header.indexOf("GET /fan1/off") >= 0) {
            analogWrite(fanOne, 0);
            fan1On = false;
            client.println("HTTP/1.1 200 OK");
            client.println("Access-Control-Allow-Origin: *");
            client.println("Connection: close");
            client.println();
            client.println("Fan 1 OFF");
            break;
          } else if (header.indexOf("GET /fan2/on") >= 0) {
            analogWrite(fanTwo, 255);
            fan2On = true;
            client.println("HTTP/1.1 200 OK");
            client.println("Access-Control-Allow-Origin: *");
            client.println("Connection: close");
            client.println();
            client.println("Fan 2 ON");
            break;
          } else if (header.indexOf("GET /fan2/off") >= 0) {
            analogWrite(fanTwo, 0);
            fan2On = false;
            client.println("HTTP/1.1 200 OK");
            client.println("Access-Control-Allow-Origin: *");
            client.println("Connection: close");
            client.println();
            client.println("Fan 2 OFF");
            break;
          } else if (header.indexOf("GET /pump/on") >= 0) {
            analogWrite(pumpPin, 255);
            pumpOn = true;
            client.println("HTTP/1.1 200 OK");
            client.println("Access-Control-Allow-Origin: *");
            client.println("Connection: close");
            client.println();
            client.println("Pump ON");
            break;
          } else if (header.indexOf("GET /pump/off") >= 0) {
            analogWrite(pumpPin, 0);
            pumpOn = false;
            client.println("HTTP/1.1 200 OK");
            client.println("Access-Control-Allow-Origin: *");
            client.println("Connection: close");
            client.println();
            client.println("Pump OFF");
            break;

          // === JSON Handling ===
          } else if (header.indexOf("GET /data.json") >= 0) {
            File logFile = SD.open("/log.csv");
            bool isDownload = header.indexOf("download=true") >= 0;
            if (logFile) {
              client.println("HTTP/1.1 200 OK");
              client.println("Access-Control-Allow-Origin: *");
              client.println("Content-Type: application/json");
              if (isDownload) client.println("Content-Disposition: attachment; filename=\"log.json\"");
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
              client.println("HTTP/1.1 404 Not Found\r\nContent-Type: text/plain\r\n\r\nlog.csv not found");
            }
            break;

          // === CSV Handling ===
          } else if (header.indexOf("GET /data.csv") >= 0) {
            File logFile = SD.open("/log.csv");
            bool isDownload = header.indexOf("download=true") >= 0;
            if (logFile) {
              client.println("HTTP/1.1 200 OK");
              client.println("Access-Control-Allow-Origin: *");
              client.println("Content-Type: text/csv");
              if (isDownload) client.println("Content-Disposition: attachment; filename=\"log.csv\"");
              client.println("Connection: close");
              client.println();

              while (logFile.available()) {
                client.write(logFile.read());
              }
              logFile.close();
            } else {
              client.println("HTTP/1.1 404 Not Found\r\nContent-Type: text/plain\r\n\r\nCould not open log.csv");
            }
            break;

          // === Main Page ===
          } else {
            client.println("HTTP/1.1 200 OK");
            client.println("Access-Control-Allow-Origin: *");
            client.println("Content-type:text/html\r\n\r\n");

            client.println("<!DOCTYPE html><html><head><title>Control Panel</title></head><body>");
            client.println("<h1>Arduino Control Panel</h1>");

            client.println("<p><strong>Pump Status:</strong> " + String(pumpOn ? "ON" : "OFF") + "</p>");
            client.println("<button onclick=\"sendCommand('/pump/on')\">Turn Pump ON</button>");
            client.println("<button onclick=\"sendCommand('/pump/off')\">Turn Pump OFF</button><br><br>");

            client.println("<p><strong>Fan 1 Status:</strong> " + String(fan1On ? "ON" : "OFF") + "</p>");
            client.println("<button onclick=\"sendCommand('/fan1/on')\">Turn Fan 1 ON</button>");
            client.println("<button onclick=\"sendCommand('/fan1/off')\">Turn Fan 1 OFF</button><br><br>");

            client.println("<p><strong>Fan 2 Status:</strong> " + String(fan2On ? "ON" : "OFF") + "</p>");
            client.println("<button onclick=\"sendCommand('/fan2/on')\">Turn Fan 2 ON</button>");
            client.println("<button onclick=\"sendCommand('/fan2/off')\">Turn Fan 2 OFF</button><br><br>");

            client.println("<hr>");
            client.println("<a href=\"/data.json\" target=\"_blank\">View JSON Data</a><br>");
            client.println("<a href=\"/data.json?download=true\">Download JSON</a><br>");
            client.println("<a href=\"/data.csv\" target=\"_blank\">View CSV Data</a><br>");
            client.println("<a href=\"/data.csv?download=true\">Download CSV</a><br>");

            client.println("<script>");
            client.println("function sendCommand(url) {");
            client.println("  fetch(url).then(() => location.reload());");
            client.println("}");
            client.println("</script>");

            client.println("</body></html>");
            break;
          }
        }

        if (c == '\n') currentLineIsBlank = true;
        else if (c != '\r') currentLineIsBlank = false;
      }
    }

    delay(1);
    client.flush();
    client.stop();
    Serial.println("Client disconnected.");
  }
}


// CSV to JSON Line Conversion Function =================================================
String csvLineToJson(String line) {
  String parts[9];
  int i = 0;
  while (line.length() > 0 && i < 9) {
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
  json += "\"moisture_one\":" + parts[4] + ",";
  json += "\"moisture_two\":" + parts[5] + ",";
  json += "\"nitrogen\":" + parts[6] + ",";
  json += "\"phosphorus\":" + parts[7] + ",";
  json += "\"potassium\":" + parts[8];
  json += "}";
  return json;
}

// Moisture Sensor Function =============================================================
void updateMoisture() {
  digitalWrite(moistureSensorOnePower, HIGH);  // Turn the sensor ON
  delay(10);                                   // Allow power to settle
  moistureOne = analogRead(moistureSensorOnePin);   // Read the analog value form sensor
  digitalWrite(moistureSensorOnePower, LOW);   // Turn the sensor OFF

  digitalWrite(moistureSensorTwoPower, HIGH);  // Turn the sensor ON
  delay(10);                                   // Allow power to settle
  moistureTwo = analogRead(moistureSensorTwoPin);  // Read the analog value form sensor
  digitalWrite(moistureSensorTwoPower, LOW);   // Turn the sensor OFF
  return;
}

void deleteFile(const char* filename) {
  if (SD.exists(filename)) {
    if (SD.remove(filename)) {
      Serial.print("Deleted file: ");
      Serial.println(filename);
    } else {
      Serial.print("Failed to delete file: ");
      Serial.println(filename);
    }
  } else {
    Serial.print("File does not exist: ");
    Serial.println(filename);
  }
}