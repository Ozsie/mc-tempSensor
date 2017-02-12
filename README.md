A simple library for accessing a DS18B20 digital thermometer on a RaspberryPi

Example:

```
var tempSensor = require('mc-tempsensor');

tempSensor.readAndParse(function(err, data) {
  if (err) {
    // Handle error
  } else {
    // Use data!
  }
})
```

Data format:

```
{
  crc,
  available,
  temperature: {
    raw,
    celcius
  },
  time
}
```
