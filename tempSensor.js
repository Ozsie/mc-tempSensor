var fs = require('fs');
var path = require('path');
var winston = require('winston');

var sensorDirectory = '/sys/bus/w1/devices/';
var logDirectory = './logs';
var converters = [];

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
        fs.accessSync(sensorDirectory + input[i] + '/w1_slave');
        path = sensorDirectory + input[i] + '/w1_slave';
      } else {
        fs.accessSync(input[i]);
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
        raw: temperature
      },
      time: Date.now()
    };
    for (var name in converters) {
      temp.temperature[name] = converters[name](temperature);
    }
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

var getDirectories = function(srcpath) {
  return fs.readdirSync(srcpath).filter(file => fs.lstatSync(path.join(srcpath, file)).isDirectory());
};

var addConverter = function(name, converterFunc) {
  converters[name] = converterFunc;
};

var init = function(sensors, newSettings, callback) {
  if (newSettings) {
    settings = newSettings;
  }

  if (!sensors) {
    settings.defaultPath = true;
    input = getDirectories(sensorDirectory);
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

var convertToCelcius = function(raw) {
  return raw/1000;
};

var convertToFahrenheit = function(raw) {
  var c = convertToCelcius(raw);
  return c * (9/5) + 32;
};

addConverter('celcius', convertToCelcius);
addConverter('fahrenheit', convertToFahrenheit);

module.exports = {
  init: init,
  readTemp: readTemp,
  parseTemp: parseTemp,
  readAndParse: readAndParse,
  addConverter: addConverter,
  logDirectory: logDirectory
};