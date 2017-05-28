var fs = require('fs');
var winston = require('winston');

var logDirectory = './logs';

var settings = {defaultPath: true, installKernelMod: false};

if (!fs.existsSync(logDirectory)) {
  fs.mkdir(logDirectory);
}

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)(),
    new (winston.transports.File)({ name:"tempSensor", filename: logDirectory + '/tempSensor.log' })
  ]
});

var modprobe = function(error, stdout, stderr) {
  if (error) {
    logger.error("MODPROB ERROR:  ", error);
    logger.error("MODPROB STDERR: ", stderr);
  }
};

var readTemp = function(callback) {
  if (!callback || typeof callback !== "function") {
    throw new Error("Callback function required");
  }
  var response = [];
  for (var i in input) {
    try {
      var path;
      if (settings.defaultPath) {
        path = '/sys/bus/w1/devices/' + input[i] + '/w1_slave';
      } else {
        path = input[i];
      }
      var data = fs.readFileSync(path, 'utf8');
      response.push(data);
    } catch (Error) {
      response.push({error: Error});
    }
  }
  callback(undefined, response);
};

var parseTemp = function(input) {
  var response = [];
  for (var i in input) {
    var data = input[i];
    if (data.error) {
      response.push({error: data.error});
      continue;
    }
    var crc = data.match(/(crc=)[a-z0-9]*/g)[0];
    crc = crc.split("=")[1];
    var available = data.match(/([A-Z])\w+/g)[0];
    var temperature = 'n/a';
    if (available === 'YES') {
      if (data.match(/(t=)[0-9]{5}/g)) {
        temperature = data.match(/(t=)[0-9]{5}/g)[0];
      } else if (data.match(/(t=)[0-9]{4}/g)) {
        temperature = data.match(/(t=)[0-9]{4}/g)[0];
      } else if (data.match(/(t=)[0-9]{3}/g)) {
        temperature = data.match(/(t=)[0-9]{3}/g)[0];
      }
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
    response.push(temp);
  }

  return response;
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

var init = function(sensors, newSettings, callback) {
  if (newSettings) {
    settings = newSettings;
  }

  if (!sensors) {
    if (callback) {
      callback("No input selected.");
    } else {
      return "No input selected";
    }
  } else if (typeof sensors === 'string') {
    input = [sensors];
  } else {
    input = sensors;
  }

  if (settings.installKernelMod) {
    exec("modprobe w1-gpio", modprobe);
    exec("modprobe w1-therm", modprobe);
  }
  if (callback) {
    callback(undefined);
  }
};

module.exports = {
  init: init,
  readTemp: readTemp,
  parseTemp: parseTemp,
  readAndParse: readAndParse,
  logDirectory: logDirectory
};