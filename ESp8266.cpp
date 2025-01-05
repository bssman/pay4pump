#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>

// WiFi Credentials
const char* ssid = "TECNO CAMON 12 Air";
const char* password = "afms83/406";

// Backend URL
const char* backend_url = "https://pay4pump.onrender.com/api/pump-status"; // Correct endpoint


// Relay pins
const int pump1Pin = D1;
const int pump2Pin = D2;
const int pump3Pin = D3;
const int pump4Pin = D4;

void setup() {
  Serial.begin(115200);

  // Initialize relays
  pinMode(pump1Pin, OUTPUT);
  pinMode(pump2Pin, OUTPUT);
  pinMode(pump3Pin, OUTPUT);
  pinMode(pump4Pin, OUTPUT);

  // Turn off all relays initially
  digitalWrite(pump1Pin, LOW);
  digitalWrite(pump2Pin, LOW);
  digitalWrite(pump3Pin, LOW);
  digitalWrite(pump4Pin, LOW);

  // Connect to WiFi
  connectToWiFi();
}

void loop() {
  // Check pump status periodically
  fetchPumpStatus();

  // Wait before next check
  delay(60000); // Check every 60 seconds
}

void connectToWiFi() {
  Serial.print("Connecting to WiFi...");
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }

  Serial.println("\nWiFi connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

void fetchPumpStatus() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(backend_url);
    int httpCode = http.GET();

    if (httpCode > 0) {
      Serial.printf("HTTP GET Response Code: %d\n", httpCode);

      if (httpCode == HTTP_CODE_OK) {
        String payload = http.getString();
        Serial.println("Payload:");
        Serial.println(payload);

        // Parse the JSON response
        parsePumpStatus(payload);
      }
    } else {
      Serial.printf("HTTP GET Failed: %s\n", http.errorToString(httpCode).c_str());
    }

    http.end();
  } else {
    Serial.println("WiFi disconnected. Reconnecting...");
    connectToWiFi();
  }
}

void parsePumpStatus(String jsonPayload) {
  // Assuming the backend sends JSON like:
  // { "pump1": true, "pump2": false, "pump3": true, "pump4": false }

  if (jsonPayload.indexOf("\"pump1\":true") > -1) {
    digitalWrite(pump1Pin, HIGH); // Turn on Pump 1
  } else {
    digitalWrite(pump1Pin, LOW); // Turn off Pump 1
  }

  if (jsonPayload.indexOf("\"pump2\":true") > -1) {
    digitalWrite(pump2Pin, HIGH); // Turn on Pump 2
  } else {
    
