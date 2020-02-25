#include <BME280I2C.h>
#include <Wire.h>
#include <ESP8266WiFi.h>
#include <WebSocketsClient.h>
#include <credentials.h>
#include "PMS.h"

PMS pms(Serial);
PMS::DATA data;

#define PMS_BAUD 9600
#define SERIAL_BAUD 115200

BME280I2C bme;    // Default : forced mode, standby time = 1000 ms
                  // Oversampling = pressure ×1, temperature ×1, humidity ×1, filter off,
int id;
int pinSet = D7;
int pinReset = D8;
#define DEBUG

#ifdef DEBUG
 #define DEBUG_PRINT(x)    Serial1.print (x)
 #define DEBUG_PRINTDEC(x) Serial1.print (x, DEC)
 #define DEBUG_PRINTLN(x)  Serial1.println (x)
#else
 #define DEBUG_PRINT(x)
 #define DEBUG_PRINTDEC(x)
 #define DEBUG_PRINTLN(x)
#endif 

char serverAddress[] = "192.168.0.150";  // server address
int port = 556;
/*
Adafruit_CCS811 ccs811;
uint16_t ccs811co2;
uint16_t ccs811tvoc;
*/

WebSocketsClient webSocket;
#define USE_SERIAL Serial1

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {

  switch(type) {
    case WStype_DISCONNECTED:
      USE_SERIAL.printf("[WSc] Disconnected!\n");
      break;
    case WStype_CONNECTED: {
      USE_SERIAL.printf("[WSc] Connected to url: %s\n", payload);

      // send message to server when Connected
      webSocket.sendTXT("[{\"verbose\":true,\"data\":[\"co2\",\"tvoc\",\"pm25\",\"temp\",\"pres\",\"humi\"]}]");
    }
      break;
    case WStype_TEXT:
      USE_SERIAL.printf("[WSc] get text: %s\n", payload);

      // send message to server
      // webSocket.sendTXT("message here");
      break;
    case WStype_BIN:
      USE_SERIAL.printf("[WSc] get binary length: %u\n", length);
      hexdump(payload, length);

      // send data to server
      // webSocket.sendBIN(payload, length);
      break;
  }

}

//////////////////////////////////////////////////////////////////
void setup()
{
  Serial.begin(PMS_BAUD);

  pinMode(pinSet, OUTPUT);
  digitalWrite(pinSet, HIGH);
  
  pinMode(pinReset, OUTPUT);
  digitalWrite(pinReset, HIGH);
//  Serial1.begin(SERIAL_BAUD);

//  while(!Serial) {} // Wait

  DEBUG_PRINTLN("Serial up!");

  Wire.begin(D6,D5);

  WiFi.begin(ssid, password);

  id = ESP.getChipId();
  DEBUG_PRINTLN(id);

  DEBUG_PRINT("Connecting");
  while (WiFi.status() != WL_CONNECTED) {
    DEBUG_PRINT(".");
    delay(100);
  }

  DEBUG_PRINTLN("Connected!");

  while(!bme.begin())
  {
    delay(100);
    DEBUG_PRINT("*");
  }
/*
  if (!ccs811.begin()) {
//    Serial.println("CCS811 Initialization failed.");
  }
  while(!ccs811.available()){
    delay(100);
//    Serial.print('+');
  }
  */
  webSocket.begin(serverAddress, port, "/");

  char extraHeader[20];
  sprintf(extraHeader,"device-id: %i",id);
  webSocket.setExtraHeaders(extraHeader);

  // event handler
  webSocket.onEvent(webSocketEvent);

  // use HTTP Basic Authorization this is optional remove if not needed
  // webSocket.setAuthorization("user", "Password");

  // try ever 5000 again if connection has failed
  webSocket.setReconnectInterval(5000);
}


void printAllData(){
   float temp(NAN), hum(NAN), pres(NAN);
   int pm25 = 9999;

   BME280::TempUnit tempUnit(BME280::TempUnit_Celsius);
   BME280::PresUnit presUnit(BME280::PresUnit_Pa);

   bme.read(pres, temp, hum, tempUnit, presUnit);
/*
   ccs811.setEnvironmentalData(hum, temp);
   
   while(ccs811.readData());

   ccs811co2 = ccs811.geteCO2();
   ccs811tvoc = ccs811.getTVOC();
*/
/*
   JSONVar myArray;
   
   JSONVar myObject;
//   myObject["co2"] = ccs811co2;
//   myObject["tvoc"] = ccs811tvoc;
   myObject["temp"] = (int) temp;
   myObject["humi"] = (int) hum;
   myObject["pres"] = (int) pres;
*/

   while (!pms.read(data)) {
     pm25 = data.PM_AE_UG_2_5;
   }
   

   uint16_t val0 = temp * 100;
   uint16_t val1 = hum * 100;
   uint16_t val2 = (pres * 100) - 10000000;
   uint16_t val3 = pm25;
   uint64_t number = ((uint64_t) val0 << 0) + ((uint64_t) val1 << 16) + ((uint64_t) val2 << 32) + ((uint64_t) val3 << 48);
   uint8_t * buf = (uint8_t *) &number;
   size_t buf_len = sizeof(number); // 4 byte
  
//   myArray[0] = myObject;
   
//   String json = JSON.stringify(myArray);
//   DEBUG_PRINTLN(json);
   //webSocket.sendTXT(json);
   /*
   Serial.println(temp);
   Serial.println(val0);
   Serial.println(hum);
   Serial.println(val1);
   Serial.println(pres);
   Serial.println(val2);
   Serial.println(-7);
   Serial.println(val3);
   */
   
   webSocket.sendBIN(buf, buf_len);
   /*
   Serial.print("Temp: ");
   Serial.print(temp);
   Serial.print("°"+ String(tempUnit == BME280::TempUnit_Celsius ? 'C' :'F'));
   Serial.print("\t\tHumidity: ");
   Serial.print(hum);
   Serial.print("% RH");
   Serial.print("\t\tPressure: ");
   Serial.print(pres);
   Serial.println("Pa");
   */
}
/*
void printCCS811Data(){
   while(ccs811.readData());

   ccs811co2 = ccs811.geteCO2();
   ccs811tvoc = ccs811.getTVOC();

   JSONVar myArray;
   
   JSONVar myObject;
   myObject["co2"] = ccs811co2;
   myObject["tvoc"] = ccs811tvoc;

   myArray[0] = myObject;

//   Serial.println(JSON.stringify(myArray));
}
*/
//////////////////////////////////////////////////////////////////
void loop() {
  webSocket.loop();
  //printBME280Data();
  printAllData();
  delay(1000);
}

//////////////////////////////////////////////////////////////////
