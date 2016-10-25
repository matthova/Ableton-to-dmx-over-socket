const osc = require('node-osc');
const SerialPort = require('serialport');

const n_lights = 10 ;
const destination = {
  r: [],
  g: [],
  b: [],
};

for (let i = 0; i < n_lights; i++ ) {
  destination.r.push(0);
  destination.g.push(0);
  destination.b.push(0);
}

function write_lights() {
  for (let i = 0; i < n_lights; i++) {
    const packet = new Buffer(5);
    packet[0] = 255;
    packet[1] = i * 4;
    packet[2] = destination.r[i] === 255 ? 254 : destination.r[i];
    packet[3] = destination.g[i] === 255 ? 254 : destination.g[i];
    packet[4] = destination.b[i] == 255 ? 254 : destination.b[i];
    port.write(packet);
  }
}

// Set up port 1337 to receive OSC commands
const oscServer = new osc.Server(1337, '0.0.0.0');
oscServer.on("message", function (msg, rinfo) {
  const channelRegex = /^\/(\w)(\d+)$/;
  const messageParse = channelRegex.exec(msg[0]);
  if (messageParse != undefined) {
    const color = messageParse[1];
    const channel = Number(messageParse[2]);
    const amount = parseInt(Number(msg[1]).toFixed(5) * 255);
    destination[color][channel - 1] = amount;
  }
});

const port = new SerialPort('/dev/tty.usbmodem1421', { baudRate: 115200 });
port.on('open', function() {
  console.log('Port open');
  setInterval(() => {
    write_lights();
  }, 20);
});

// open errors will be emitted as an error event
port.on('error', function(err) {
  console.log('Error: ', err.message);
})

port.on('data', function(data) {
  console.log('data', data.toString());
})