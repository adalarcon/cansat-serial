const SerialPort  = require('serialport');
const ab2str      = require('arraybuffer-to-string')
const db          = require('./helper/mongo.client');

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
  result += arrayBufferToString(data);
  //result += ab2str(data);
  //console.log(result);
});

var arrayBufferToString = function(buffer){
    var byteArray = new Uint8Array(buffer);
    var str = "", cc = 0, numBytes = 0;
    for(var i=0, len = byteArray.length; i<len; ++i){
        var v = byteArray[i];
        if(numBytes > 0){
            //2 bit determining that this is a tailing byte + 6 bit of payload
            if((cc&192) === 192){
                //processing tailing-bytes
                cc = (cc << 6) | (v & 63);
            }else{
                throw new Error("this is no tailing-byte");
            }
        }else if(v < 128){
            //single-byte
            numBytes = 1;
            cc = v;
        }else if(v < 192){
            //these are tailing-bytes
            throw new Error("invalid byte, this is a tailing-byte")
        }else if(v < 224){
            //3 bits of header + 5bits of payload
            numBytes = 2;
            cc = v & 31;
        }else if(v < 240){
            //4 bits of header + 4bit of payload
            numBytes = 3;
            cc = v & 15;
        }else{
            //UTF-8 theoretically supports up to 8 bytes containing up to 42bit of payload
            //but JS can only handle 16bit.
            throw new Error("invalid encoding, value out of range")
        }

        if(--numBytes === 0){
            str += String.fromCharCode(cc);
        }
    }
    if(numBytes){
        throw new Error("the bytes don't sum up");
    }
    return str;
}

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
