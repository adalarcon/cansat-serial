const env         = require('dotenv').config()
const SerialPort  = require('serialport');
const db          = require('./helper/mongo.client');
const io          = require('socket.io-client');

const PORT        = '/dev/tty.usbmodem1411';
const BAUD_RATE   = 19200;

const Readline    = SerialPort.parsers.Readline;
const port        = new SerialPort(PORT, { baudRate: BAUD_RATE });
const parser      = new Readline();

//const socket    = io('http://localhost:3800/api/v1/io/logs')
const socket      = io('https://cansat.herokuapp.com/api/v1/io/logs')
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

// on get data from port
parser.on('data', (data) => {
  console.log("imput: ", data);

  if(data && data !=''){
    var obj = JSON.parse(data)
    obj.timestamp = new Date();
    console.log("[serial][data] %s >>> %s", obj.type, count++);

    // Send data
    socket.emit(obj.type, obj);

    // Save Data
    db.insertOne('logs', obj).then(function(data){

    }).catch(function (error) {
      console.log(error);
    });
  }

});

socket.on('connect', () => {
  console.log('[socket] socket connected ');
});

socket.on('action', (data) => {
  console.log('[socket] action', data);
});

socket.on('disconnect', () => {
  console.log('[socket] disconnect');
});
