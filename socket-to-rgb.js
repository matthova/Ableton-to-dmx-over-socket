const osc = require('node-osc');
const SerialPort = require('serialport');

let r_destination = 0;
let g_destination = 0;
let b_destination = 0;

function write_lights(red, green, blue) {
  const packet = new Buffer(5);
  packet[0] = 255;
  packet[1] = 1;
  packet[2] = red === 255 ? 254 : red;
  packet[3] = green === 255 ? 254 : green;
  packet[4] = blue == 255 ? 254 : blue;
  port.write(packet);
}

// Set up port 1337 to receive OSC commands
const oscServer = new osc.Server(1337, '0.0.0.0');
oscServer.on("message", function (msg, rinfo) {
  if (msg[0] === '/r') {
    r_destination = parseInt(Number(msg[1]).toFixed(5) * 255);
  } else if (msg[0] === '/g') {
    g_destination = parseInt(Number(msg[1]).toFixed(5) * 255);
  } else if (msg[0] === '/b') {
    b_destination = parseInt(Number(msg[1]).toFixed(5) * 255);
  }
});

const port = new SerialPort('/dev/tty.usbmodem1421', { baudRate: 115200 });
port.on('open', function() {
  console.log('Port open');
  setInterval(() => {
    write_lights(r_destination, g_destination, b_destination);
  }, 10);
});

// open errors will be emitted as an error event
port.on('error', function(err) {
  console.log('Error: ', err.message);
})

port.on('data', function(data) {
  console.log(data.toString());
})