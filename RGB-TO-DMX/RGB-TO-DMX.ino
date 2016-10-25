#include <DmxSimple.h>

const uint16_t dmx_channels = 44; // How many channels?
byte dest[dmx_channels];          // Holds the desired value for each channel

byte channelByte;
byte amountByte;

void setup() {
  Serial.begin(115200);

  // Initialize each dmx channel's amount to zero
  for (uint16_t i = 0; i < dmx_channels; i++) {
    dest[i] = 0;
  }

  DmxSimple.maxChannel(dmx_channels);
  DmxSimple.usePin(4);

  cli(); // stop interrupts

  // set timer2 interrupt every 128us
  TCCR2A = 0; // set entire TCCR2A register to 0
  TCCR2B = 0; // same for TCCR2B
  TCNT2  = 0; // initialize counter value to 0
  // set compare match register for 7.8khz increments
  OCR2A = 255;// = (16*10^6) / (7812.5*8) - 1 (must be <256)
  // turn on CTC mode
  TCCR2A |= (1 << WGM21);
  // Set CS22 bit for 64 prescaler
  TCCR2B |= (1 << CS22);   
  // enable timer compare interrupt
  TIMSK2 |= (1 << OCIE2A);
  
  sei(); // allow interrupts
}

// Constantly write to all DMX channels
// Write the most recent declared value for each channel
void loop() {
  for (uint16_t i = 0; i < dmx_channels; i++) {
    DmxSimple.write(i, dest[i]);
  }
}

/*
 * RGB communication protocol
 * Byte 0 - Opening byte. When we receive a 255, we know we're about to process a command
 * Byte 1 - Starting Channel (The red channel)
 * Byte 2 - Red Amount
 * Byte 3 - Green Amount
 * Byte 4 - Blue Amount
 */
ISR(TIMER2_COMPA_vect) { // Checks for incoming serial every 128us
  if (Serial.available() > 4) {
    byte checkpoint = Serial.read();
    // Once we receive an opening command
    if (checkpoint == 255) {
      byte startingChannel = Serial.read();
      byte amount1 = Serial.read();      
      byte amount2 = Serial.read();
      byte amount3 = Serial.read();
      dest[startingChannel]     = amount1;
      dest[startingChannel + 1] = amount2;
      dest[startingChannel + 2] = amount3;
    }
  }
}
