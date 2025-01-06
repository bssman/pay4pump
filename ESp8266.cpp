#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <ArduinoJson.h>

// WiFi Credentials
const char* ssid = "TECNO CAMON 12 Air"; // Replace with your WiFi SSID
const char* password = "afms83/406";     // Replace with your WiFi password

// Backend URL
const char* backend_url = "https://pay4pump.onrender.com/api/pump-status"; // Replace with your endpoint

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
  // Fetch pump status periodically
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
    WiFiClient client;
    HTTPClient http;

    if (http.begin(client, backend_url)) { // Updated API for HTTPClient
      int httpCode = http.GET();

      if (httpCode > 0) {
        Serial.printf("HTTP GET Response Code: %d\n", httpCode);

        if (httpCode == HTTP_CODE_OK) {
          String payload = http.getString();
          Serial.println("Payload:");
          Serial.println(payload);

          // Parse the JSON response
          parsePumpStatus(payload);
        } else {
          Serial.printf("Unexpected HTTP Code: %d\n", httpCode);
        }
      } else {
        Serial.printf("HTTP GET Failed: %s\n", http.errorToString(httpCode).c_str());
      }

      http.end();
    } else {
      Serial.println("HTTPClient initialization failed.");
    }
  } else {
    Serial.println("WiFi disconnected. Reconnecting...");
    connectToWiFi();
  }
}

void parsePumpStatus(String jsonPayload) {
  // Create a JSON document with enough capacity
  StaticJsonDocument<256> doc;

  // Deserialize the JSON payload
  DeserializationError error = deserializeJson(doc, jsonPayload);

  if (error) {
    Serial.print("JSON Deserialization failed: ");
    Serial.println(error.c_str());
    return;
  }

  // Control the pumps based on JSON values
  bool pump1 = doc["pump1"] | false; // Default to false if not found
  bool pump2 = doc["pump2"] | false;
  bool pump3 = doc["pump3"] | false;
  bool pump4 = doc["pump4"] | false;

  digitalWrite(pump1Pin, pump1 ? HIGH : LOW);
  digitalWrite(pump2Pin, pump2 ? HIGH : LOW);
  digitalWrite(pump3Pin, pump3 ? HIGH : LOW);
  digitalWrite(pump4Pin, pump4 ? HIGH : LOW);

  // Debugging output
  Serial.printf("Pump1: %s, Pump2: %s, Pump3: %s, Pump4: %s\n",
                pump1 ? "ON" : "OFF",
                pump2 ? "ON" : "OFF",
                pump3 ? "ON" : "OFF",
                pump4 ? "ON" : "OFF");
}
