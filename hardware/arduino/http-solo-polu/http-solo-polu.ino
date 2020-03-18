#include <ESP8266WiFi.h>
#include <ESP8266Ping.h>
//#include <WebSocketsClient.h>
#include <ESP8266HTTPClient.h>
#include <Adafruit_NeoPixel.h>
#include <credentials.h>
#include "PMS.h"

#define LED_PIN D3
#define NUMPIXELS 1

Adafruit_NeoPixel pixels(NUMPIXELS, LED_PIN, NEO_GRB + NEO_KHZ800);

PMS pms(Serial);
PMS::DATA data;

#define PMS_BAUD 9600
#define SERIAL_BAUD 115200

int id;
int lastInternet;
//#define DEBUG

#ifdef DEBUG
 #define DEBUG_PRINT(x)    Serial.print (x)
 #define DEBUG_PRINTDEC(x) Serial.print (x, DEC)
 #define DEBUG_PRINTLN(x)  Serial.println (x)
#else
 #define DEBUG_PRINT(x)
 #define DEBUG_PRINTDEC(x)
 #define DEBUG_PRINTLN(x)
#endif 

int brightness = 20;
char serverAddress[] = "192.168.0.150";  // server address
IPAddress pingIp (8, 8, 8, 8); // The remote ip to ping
bool internet = false;
bool pmsFailure = false;
bool recognized = false;
//bool websocketUp = false;
//int port = 556;
/*
Adafruit_CCS811 ccs811;
uint16_t ccs811co2;
uint16_t ccs811tvoc;
*/

//WebSocketsClient webSocket;
#define USE_SERIAL Serial1
/*
void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {

  switch(type) {
    case WStype_DISCONNECTED:
      DEBUG_PRINTLN("[WSc] Disconnected!");
      websocketUp = false;
      break;
    case WStype_CONNECTED: {
      DEBUG_PRINTLN("[WSc] Connected");
      webSocket.sendTXT("Polucjant v0.4");
      websocketUp = true;
//      delay(1000);
//      printAllData();
    }
      break;
    case WStype_TEXT:
      DEBUG_PRINT("Text: ");
//      DEBUG_PRINTLN(payload);
      Serial.printf("[WSc] get text: %s\n", payload);
      break;
    case WStype_BIN:
      DEBUG_PRINT("Bin: ");
      websocketUp = true;
      if (payload[0] == 49) {
        DEBUG_PRINTLN("Device recognized");
        recognized = true;
        printAllData();
      } else if (payload[0] == 48) {
        DEBUG_PRINTLN("Device NOT recognized!");
        recognized = false;
      } else if (payload[0] == 50) {
        DEBUG_PRINTLN("Data received.");
      } else if (payload[0] == 51) {
        DEBUG_PRINTLN("Data request.");
        printAllData();
      }
      
//      Serial.printf("[WSc] get binary length: %u\n", length);
//      Serial.println(payload[0]);
//      hexdump(payload, length);
      break;
  }
}
*/
void checkWifi() {
  WiFi.begin(ssid, password);
  DEBUG_PRINT("Connecting");
  while (WiFi.status() != WL_CONNECTED) {
    DEBUG_PRINT(".");
    pixels.setPixelColor(0, brightness, 0, 0);
    pixels.show();
    delay(100);
    pixels.setPixelColor(0, 0, 0, brightness);
    pixels.show();
    delay(100);
  }
  pixels.setPixelColor(0, 0, 0, 0);
  pixels.show();

  DEBUG_PRINTLN("Connected!");
}

void checkInternet() {
  int now = millis();
  if (!lastInternet || now - lastInternet > 1000 * 60) {
    DEBUG_PRINTLN("Checking Internet...");
    internet = Ping.ping(pingIp);
    DEBUG_PRINT("Internet: ");
    DEBUG_PRINTLN(internet);
    if (!internet) {
      DEBUG_PRINTLN("Waiting 10s for reconnect...");
      for (int i=0;i < 50; i++) {
        pixels.setPixelColor(0, brightness, 0, 0);
        pixels.show();
        delay(100);
        pixels.setPixelColor(0, 0, brightness, 0);
        pixels.show();
        delay(100); 
      }
  
      pixels.setPixelColor(0, 0, 0, 0);
      pixels.show();
      checkInternet(); 
    } else {
      lastInternet = millis();
    }
  }
}
/*
void setupWebsocket() {
  id = ESP.getChipId();
  DEBUG_PRINTLN(id);
  webSocket.begin(serverAddress, port, "/");
  char extraHeader[20];
  sprintf(extraHeader,"device-id: %i",id);
  webSocket.setExtraHeaders(extraHeader);
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000);  
}
*/
//////////////////////////////////////////////////////////////////
void setup()
{
  Serial.begin(PMS_BAUD);
  pixels.begin();
  pixels.clear();
  checkWifi();
  checkInternet();
//  setupWebsocket();
}

void setQuality(int pm25) {
  if (pm25 < 10) {
    pixels.setPixelColor(0, 0, brightness, brightness / 4);
  } else if (pm25 < 25) {
    pixels.setPixelColor(0, 0, brightness, 0);
  } else if (pm25 < 50) {
    pixels.setPixelColor(0, brightness, brightness, 0);
  } else if (pm25 < 75) {
    pixels.setPixelColor(0, brightness, brightness/2, 0);
  } else if (pm25 < 100) {
    pixels.setPixelColor(0, brightness, 0, 0);
  } else if (pm25 < 150) {
    pixels.setPixelColor(0, brightness, 0, brightness / 2);
  } else {
    pixels.setPixelColor(0, brightness, 0, brightness);
  }
  pixels.show();
}

void printAllData(){
  DEBUG_PRINTLN("READING DATA...");
  int limit = 1000;
  int pm25 = 9999;
  
  while (!pms.read(data) && limit > 0) {
    pm25 = data.PM_AE_UG_2_5;
    limit -= 1;
    pmsFailure = false;
  }
  
  if (limit == 0) {
    pm25 = 9999;
    DEBUG_PRINTLN("PMS FAILURE");
    pmsFailure = true;
  } else {
    setQuality(pm25);
    uint16_t val0 = pm25;
    uint64_t number = (uint64_t) val0 << 0;
    uint8_t * buf = (uint8_t *) &number;
    size_t buf_len = sizeof(number); // 1 byte
    
//    webSocket.sendBIN(buf, buf_len);
  }
}

void pmsAlert() {
  for(int i=0;i<5;i++) {
    pixels.setPixelColor(0, brightness, brightness, 0);
    pixels.show();
    delay(500);
    pixels.setPixelColor(0, 0, brightness, brightness);
    pixels.show();
    delay(500);
  }
  pixels.setPixelColor(0, 0, 0, 0);
  pixels.show();
}

void wsAlert() {
  DEBUG_PRINTLN("WS ALERT");
  pixels.setPixelColor(0, 0, brightness, 0);
  pixels.show();
  delay(100);
  pixels.setPixelColor(0, brightness, 0, brightness);
  pixels.show();
  delay(100);
  pixels.setPixelColor(0, 0, 0, 0);
  pixels.show();
}

void handleErrors() {
  if (pmsFailure) {
    pmsAlert();
  }
}

void loop() {
  //handleErrors();
}
