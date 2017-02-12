var fs = require('fs');
var settings = JSON.parse(fs.readFileSync('settings.json', 'utf8'));
var winston = require('winston');
var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)(),
    new (winston.transports.File)({ name:"tempSensor", filename: settings.logs.directory + '/tempSensor.log' })
  ]
});

var modprobe = function(error, stdout, stderr) {
 if (error) {
   logger.error("MODPROB ERROR:  ", error);
   logger.error("MODPROB STDERR: ", stderr);
 }
};

if (settings.installKernelMod) {
  exec("modprobe w1-gpio", modprobe);
  exec("modprobe w1-therm", modprobe);
}

var readTemp = function(callback) {
  if (!callback || typeof callback !== "function") {
    throw new Error("Callback function required");
  }
  fs.readFile(settings.input, 'utf8', callback);
};

var parseTemp = function(data) {
  var crc = data.match(/(crc=)[a-z0-9]*/g)[0];
  crc = crc.split("=")[1];
  var available = data.match(/([A-Z])\w+/g)[0];
  var temperature = 'n/a';
  if (available === 'YES') {
    temperature = data.match(/(t=)[0-9]{5}/g)[0];
    temperature = temperature.split("=")[1];
    temperature = parseInt(temperature);
  }
  var temp = {
    crc: crc,
    available: available,
    temperature: {
      raw: temperature,
      celcius: temperature / 1000
    },
    time: Date.now()
  };

  return temp;
};

var readAndParse = function(callback) {
  if (!callback || typeof callback !== "function") {
    throw new Error("Callback function required");
  }
  readTemp(function (err, data) {
    if (!err) {
      var temp = parseTemp(data);
      callback(undefined, temp);
    } else {
      err.tempSensorMessage = "Error when reading temperature";
      logger.error(err.tempSensorMessage, err);
      callback(err);
    }
  });
};

module.exports = {
  readTemp: readTemp,
  parseTemp: parseTemp,
  readAndParse: readAndParse,
  settings: settings
};