const osc = require('node-osc');
const SerialPort = require('serialport');

n_lights = 10;

let r_destination = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
let g_destination = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
let b_destination = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

function write_lights(light, red, green, blue) {
  const packet = new Buffer(5);
  packet[0] = 255;
  packet[1] = (light - 1) * 4 + 1;
  packet[2] = red === 255 ? 254 : red;
  packet[3] = green === 255 ? 254 : green;
  packet[4] = blue == 255 ? 254 : blue;
  port.write(packet);
}

// Set up port 1337 to receive OSC commands
const oscServer = new osc.Server(1337, '0.0.0.0');
oscServer.on("message", function (msg, rinfo) {
  if (msg[0].includes('/r')) {
    const channel = msg[0].split('/r')[1];
    r_destination[channel] = parseInt(Number(msg[1]).toFixed(5) * 255);
  } else if (msg[0].includes('/g')) {
    const channel = msg[0].split('/g')[1];
    g_destination[channel] = parseInt(Number(msg[1]).toFixed(5) * 255);
  } else if (msg[0].includes('/b')) {
    const channel = msg[0].split('/b')[1];
    b_destination[channel] = parseInt(Number(msg[1]).toFixed(5) * 255);
  }
});

const port = new SerialPort('/dev/ttyACM0', { baudRate: 115200 });
port.on('open', function() {
  console.log('Port open');
  setInterval(() => {
    for(let i = 0; i < n_lights; i++) {
      write_lights(i, r_destination[i], g_destination[i], b_destination[i]);
    }
  }, 50);
});

// open errors will be emitted as an error event
port.on('error', function(err) {
  console.log('Error: ', err.message);
})

port.on('data', function(data) {
  console.log(data.toString());
})
