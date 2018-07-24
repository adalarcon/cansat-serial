const SerialPort  = require('serialport');
const ab2str      = require('arraybuffer-to-string')
const db          = require('./helper/mongo.client');
const parser      = require('./helper/parser');

const PORT = '/dev/tty.usbmodem1421';
const BAUD_RATE = 19200;

var result = "";

var port = new SerialPort(PORT, {
  baudRate: BAUD_RATE
});

console.log("Connecting to port:  ", PORT, " at ", BAUD_RATE);

setInterval(function() {
  console.log('.');
  run();
}, 3000);


// Open errors will be emitted as an error event
port.on('error', function(err) {
  console.log('Error: ', err.message);
})

// Read data that is available but keep the stream from entering "flowing mode"
// port.on('readable', function () {
//   //console.log('Data:', port.read());
//   result += arrayBufferToString(port.read());
// });

port.on('open', function() {
  console.log('Port connected');
});

port.on('data', function(data) {
  result += parser.arrayBufferToString(data);
});

var run = function(){
  if(result){
    try{
      var logs = result.split("#");
      if(logs.length>= 2){
        for (var i = 0; i < logs.length; i++) {
          db.insertOne('logs', JSON.parse(logs[i])).then(function(data){
            console.log('.');
          }).catch(function (error) {
            console.log(error);
          });
        }
        result = "";
      }
    }catch(e){
      //console.log(e);
    }
  }
}
