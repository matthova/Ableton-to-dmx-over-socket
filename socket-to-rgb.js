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

// Set up port 1337 to receive OSC commands
const oscServer = new osc.Server(1337, '0.0.0.0');
oscServer.on("message", function (msg, rinfo) {
  // console.log('message', msg);
  const channelRegex = /^\/(\w)(\d+)$/;
  const messageParse = channelRegex.exec(msg[0]);
  if (messageParse != undefined) {
    const color = messageParse[1];
    const channel = Number(messageParse[2]);
    const amount = parseInt(Number(msg[1]));
    destination[color][channel - 1] = amount;
  }
});

// We're assuming that each destination is a 4 channel RGBW DMX light
function write_lights(port) {
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

function setupPort(foundPort) {
  const port = new SerialPort(foundPort.comName, { baudRate: 115200 });

  port.on('open', function() {
    console.log('Port open');
    setInterval(() => {
      write_lights(port);
    }, 20);
  });

  // open errors will be emitted as an error event
  port.on('error', function(err) {
    console.log('Error: ', err.message);
  });

  port.on('data', function(data) {
    console.log('data', data.toString());
  });
}

// Go through all of the ports and connect to the arduino
SerialPort.list((err, ports) => {
  for (const port of ports) {
    if (port.manufacturer && port.manufacturer.includes('Arduino')) {
      setupPort(port);
    }
  }
})

