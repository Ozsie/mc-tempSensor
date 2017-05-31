[![NPM](https://nodei.co/npm/mc-tempsensor.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/mc-tempsensor/)

[![Coverage Status](https://coveralls.io/repos/github/Ozsie/mc-tempSensor/badge.svg?branch=master)](https://coveralls.io/github/Ozsie/mc-tempSensor?branch=master)
[![Build Status](https://travis-ci.org/Ozsie/mc-tempSensor.svg?branch=master)](https://travis-ci.org/Ozsie/mc-tempSensor)

**NOTE: Version 2.0.0 breaks compatibility with version 1.x**

A simple library for accessing a DS18B20 digital thermometer on a RaspberryPi

***Installation***

```
npm install mc-tempsensor
```

***Documentation***

https://ozsie.github.io/mc-tempSensor/mc-tempsensor/2.0.0/

***Settings***

The default settings when initializing are:

```
{
  defaultPath: true,
  installKernelMod: false
}
```

When ```defaultPath``` is set to true, the expected input to init is just the sensor ID. If set to false, the full path is required.

```installKernelMod``` can be set to true to automatically install the required kernel modules, w1-gpio and w1-therm.

***Examples***

This example assumes you have installed the necessary kernel modules, w1-gpio and w1-therm.

```
var tempSensor = require('mc-tempsensor');

// 28-800000263717 is the ID of your DS18B20 thermometer which can be found in /sys/bus/w1/devices/
tempsensor.init('28-800000263717');

tempSensor.readAndParse(function(err, data) {
  if (err) {
    // Handle error
  } else {
    console.log('Temperature is ' + data[0].temperature.celcius + ' C');
  }
})
```

If you for some reason need to specify the exact location of the temperature file:

```
var tempSensor = require('mc-tempsensor');

// 28-800000263717 is the ID of your DS18B20 thermometer which can be found in /sys/bus/w1/devices/
tempsensor.init('/sys/bus/w1/devices/28-800000263717/w1-slave', {defaultPath: false, installKernelMod: false});

tempSensor.readAndParse(function(err, data) {
  if (err) {
    // Handle error
  } else {
    console.log('Temperature is ' + data[0].temperature.celcius + ' C');
  }
})
```

Multiple temperature sources can be used:

```
var tempSensor = require('mc-tempsensor');

// 28-800000263717 is the ID of your DS18B20 thermometer which can be found in /sys/bus/w1/devices/
tempsensor.init(['28-800000263717', '28-800000555555']);

tempSensor.readAndParse(function(err, data) {
  if (err) {
    // Handle error
  } else {
    for (var i in data) {
      console.log('Temperature for sensor ' + i + ' is ' + data[i].temperature.celcius + ' C');
    }
  }
})
```

A callback method can be used when initializing:

```
var tempSensor = require('mc-tempsensor');

// 28-800000263717 is the ID of your DS18B20 thermometer which can be found in /sys/bus/w1/devices/
tempsensor.init(['28-800000263717', '28-800000555555'], undefined, function(err) {
  if (err) {
    console.log(err);
  }
});

```

When using init without sensor input, all sensors in default location will be used:

```
var tempSensor = require('mc-tempsensor');

tempsensor.init(undefined, undefined, function(err) {
  if (err) {
    console.log(err);
  }
});

```

***Data format***

```
[{
  crc,
  available,
  temperature: {
    raw,
    celcius
  },
  time
}]
```
