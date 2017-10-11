/**
 * DS18B20 temperature sensor module.
 * @module mc-tempsensor
 * @see module:mc-tempsensor
 * @author Oscar Djupfeldt
 */

var fs = require('fs');
var path = require('path');
var winston = require('winston');

var sensorDirectory = '/sys/bus/w1/devices/';
var logDirectory = './logs';
var converters = [];
var input;

var settings = {defaultPath: true, installKernelMod: false};

if (!fs.existsSync(logDirectory)) {
  fs.mkdir(logDirectory);
}

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)(),
    new (winston.transports.File)({ name:'tempSensor', filename: logDirectory + '/tempSensor.log' })
  ]
});

var modprobe = function(error, stdout, stderr) {
  if (error) {
    logger.error('MODPROB ERROR:  ', error);
    logger.error('MODPROB STDERR: ', stderr);
  }
};

/**
 * Reads the raw data from the sensors.
 *
 * @function readTemp
 * @param {function} callback Function to call when all sensor data has bean read or failed
 * @throws {Error} 'Callback function required' Thrown if no callback function is provided
 */
var readTemp = function(callback) {
  if (!callback || typeof callback !== 'function') {
    throw new Error('Callback function required');
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

/**
 * Parses the raw data from the sensors.
 *
 * @function parseTemp
 * @param {array} input An array containing the data to parse
 * @returns {array} An array with parsed data
 */
var parseTemp = function(input) {
  var response = [];
  for (var i in input) {
    var data = input[i];
    if (data.error) {
      response.push({error: data.error});
      continue;
    }
    if (data.length === 0) {
      response.push({error: 'Could not read data'});
      continue;
    }
    try {
      var crc = data.match(/(crc=)[a-z0-9]*/g)[0];
      crc = crc.split('=')[1];
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
        temperature = temperature.split('=')[1];
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
    } catch (error) {
      response.push({error: error});
    }
  }

  return response;
};

/**
 * Adds a temperature scale converter function. Conversion functions should accept one parameter and return a value
 * representing the converted temperature. The input to the function is the raw temperature from the DS18B20 sensor,
 * an integer value that is 1000 * X, where X is the temperature in Celcius with four decimals.
 *
 * @function readAndParse
 * @param {function} callback Function that is called when readAndParse finishes
 * @throws {Error} 'Callback function required' Thrown if no callback function is provided
 */
var readAndParse = function(callback) {
  if (!callback || typeof callback !== 'function') {
    throw new Error('Callback function required');
  }
  readTemp(function (err, data) {
    if (!err) {
      var temp = parseTemp(data);
      callback(undefined, temp);
    } else {
      err.tempSensorMessage = 'Error when reading temperature';
      logger.error(err.tempSensorMessage, err);
      callback(err);
    }
  });
};

var getDirectories = function(srcpath) {
  return fs.readdirSync(srcpath).filter(file => fs.lstatSync(path.join(srcpath, file)).isDirectory());
};

/**
 * Adds a temperature scale converter function. Conversion functions should accept one parameter and return a value
 * representing the converted temperature. The input to the function is the raw temperature from the DS18B20 sensor,
 * an integer value that is 1000 * X, where X is the temperature in Celcius with four decimals.
 *
 * @function addConverter
 * @param {string} name Name of the converter, this is used to identify the output of {@link parseTemp}
 * @param {function} converterFunc Function implementing the conversion
 * @throws {Error} 'Name must be provided' Thrown if no name is provided
 * @throws {Error} 'Converter function was not a function' Thrown if converterFunc is not a function
 */
var addConverter = function(name, converterFunc) {
  if (!name) {
    throw new Error('Name must be provided');
  }
  if (typeof converterFunc === 'function') {
    converters[name] = converterFunc;
  } else {
    throw new Error('Converter function was not a function');
  }
};

/**
 * Initializes the temp sensor. The module can use one or more available DS18B20 sensors. Depending on the type of
 * parameter one, different behaviors are achieved. Passing a string is equivalent to passing a {string} {array} with one
 * element. Passing {undefined} is equivalent to passing a {string} {array} with all installed sensors.
 *
 * @function init
 * @param {array} sensors Sensors to use, can be either a string, an array of strings or undefined. If settings.defaultPath
 * is set to true, the values are the ID of the sensor, otherwise the full path to the sensor output.
 * @param {object} newSettings object representing changes to settings
 * @param {boolean} newSettings.defaultPath Use default path or not. Defaults to true, prepends '/sys/bus/w1/devices/'
 * and appends '/w1_slave' to the sensor. If set to false, the values of sensor is left untouched.
 * @param {boolean} newSettings.installKernelMod Defaults to false. If set to true, the kernel modules w1-gpio and
 * w1-therm are installed when init is called.
 * @param {function} callback Function to be called when init is finished
 */
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
    exec('modprobe w1-gpio', modprobe);
    exec('modprobe w1-therm', modprobe);
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