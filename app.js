const env         = require('dotenv').config()
const SerialPort  = require('serialport');
const db          = require('./helper/mongo.client');
const io          = require('socket.io-client');

const PORT        = 'COM13';
const BAUD_RATE   = 57600;

const Readline    = SerialPort.parsers.Readline;
const port        = new SerialPort(PORT, { baudRate: BAUD_RATE });
const parser      = new Readline();

const socket    = io('http://localhost:3000/api/v1/io/logs')
//const socket      = io('https://cansat.herokuapp.com/api/v1/io/logs')
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
  console.log("[serial] imput: ", data);
  if(data && data !=''){
    try {
         var obj = JSON.parse(data)
         obj.timestamp = new Date();
         console.log("[socket][data] %s >>> %s", obj.type, count++);
         socket.emit(obj.type, obj);

         // Save Data
         db.insertOne('logs', obj).then().catch(function (error) {
           console.log("[serial] Error inserting on database: ", error);
         });
    } catch (err) {
        console.log("[serial] Error parsing JSON", err);
    }
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
