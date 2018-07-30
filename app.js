const SerialPort  = require('serialport');
const db          = require('./helper/mongo.client');
const io          = require('socket.io-client');

const PORT        = '/dev/tty.usbmodem1411';
const BAUD_RATE   = 19200;

const Readline    = SerialPort.parsers.Readline;
const port        = new SerialPort(PORT, { baudRate: BAUD_RATE });
const parser      = new Readline();

const socket      = io('http://localhost:3800/api/v1/io/logs')
var count         = 0;

//  Available ports
SerialPort.list().then(ports => {
  console.log("[serial] Available Ports");
  for (var i = 0; i < ports.length; i++) {
    console.log("[serial] port: ", ports[i].comName);
  }
});

// Serial Parser
port.pipe(parser);
parser.on('data', (data) => {
  var obj = JSON.parse(data)
  console.log("[serial][data] %s >>> %s", obj.type, count++);

  if(obj.type == "imu"){
    socket.emit('imu', obj);
  }else if(obj.type == "gps"){
    socket.emit('gps', obj);
  }

});

socket.on('connect', function(){
  console.log('[socket] socket connected ');
});

socket.on('action', function(data){
  console.log('[socket] action', data);
});

socket.on('disconnect', function(){
  console.log('[socket] disconnect');
});
