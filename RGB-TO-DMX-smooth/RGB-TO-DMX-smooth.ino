#include <DmxSimple.h>

const uint16_t dmx_channels = 40; // How many channels?
const uint16_t slope = 600;
uint16_t current[dmx_channels];          // Holds the desired value for each channel

byte dest[dmx_channels];          // Holds the desired value for each channel

byte channelByte;
byte amountByte;

void setup() {
  // Initialize each dmx channel's amount to zero
  for (uint16_t i = 0; i < dmx_channels; i++) {
    current[i] = 0;
    dest[i] = 0;
  }

  DmxSimple.maxChannel(dmx_channels);
  DmxSimple.usePin(4);

  cli(); // stop interrupts

  // TIMER 1 for interrupt frequency 100 Hz:
  TCCR1A = 0; // set entire TCCR1A register to 0
  TCCR1B = 0; // same for TCCR1B
  TCNT1  = 0; // initialize counter value to 0
  // set compare match register for 100 Hz increments
  OCR1A = 19999; // = 16000000 / (8 * 100) - 1 (must be <65536)
  // turn on CTC mode
  TCCR1B |= (1 << WGM12);
  // Set CS12, CS11 and CS10 bits for 8 prescaler
  TCCR1B |= (0 << CS12) | (1 << CS11) | (0 << CS10);
  // enable timer compare interrupt
  TIMSK1 |= (1 << OCIE1A);

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

  Serial.begin(115200);
}

// Constantly write to all DMX channels
// Write the most recent declared value for each channel
void loop() {
  for (uint16_t i = 0; i < dmx_channels; i++) {
    DmxSimple.write(i + 1, (current[i] >> 8) & 0xff);
  }
}


ISR(TIMER1_COMPA_vect) {
  for (uint16_t i = 0; i < dmx_channels; i++) {
    byte currentByte = (current[i] >> 8) & 0xff;
    if (currentByte == dest[i]) {
      // If current equals destination do nothing
    } else if (currentByte > dest[i]) {
      // If the current value is greater than the destination, subtract from the current value
      if (current[i] <= slope) {
        // If subtracting from the current would set it negative
        // Just set it to zero
        current[i] = 0;        
      } else if (currentByte - slope <= dest[i]) {
        // If subtracting from the current value will send it lower than the destination
        // Just set it to the destination
        current[i] = dest[i] << 8;
      } else {
        // No weird caveats? Ok, just subtract from the current value
        current[i] = current[i] - slope;
      }
    } else {
      // If the current value is less than the destination
      // If the current value is greater than the destination, subtract from the current value
      if (current[i] >= 0xffff - slope) {
        // If adding to the current would overflow
        // Just set it to max
        current[i] = 0xffff;        
      } else if (currentByte + slope >= dest[i]) {
        // If adding to the current value will send it higher than the destination
        // Just set it to the destination
        current[i] = dest[i] << 8;
      } else {
        // No weird caveats? Ok, just subtract from the current value
        current[i] = current[i] + slope;
      }
    }
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

