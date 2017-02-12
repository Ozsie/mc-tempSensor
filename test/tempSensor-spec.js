var chai = require('chai');
var expect = chai.expect; // we are using the "expect" style of Chai
var tempSensor = require('./../tempSensor');

describe('TempSensor', function() {
  it('readTemp should return error when temperature file is not available', function(done) {
    tempSensor.readTemp(function(err, data) {
      expect(data).to.not.exist;
      expect(err).to.exist;
      expect(err.errno).to.equal(-2);
      expect(err.code).to.equal('ENOENT');
      expect(err.syscall).to.equal('open');
      expect(err.path).to.equal('/sys/bus/w1/devices/28-800000263717/w1_slave');
      done();
    });
  });

  it('readAndParse should return error when temperature file is not available', function(done) {
    tempSensor.readAndParse(function(err, data) {
      expect(data).to.not.exist;
      expect(err).to.exist;
      expect(err.errno).to.equal(-2);
      expect(err.code).to.equal('ENOENT');
      expect(err.syscall).to.equal('open');
      expect(err.path).to.equal('/sys/bus/w1/devices/28-800000263717/w1_slave');
      done();
    });
  });

  it('readTemp should return data when temperature file is available', function(done) {
    tempSensor.settings.input = "./test/testTemp.txt";
    tempSensor.readTemp(function(err, data) {
      expect(data).to.exist;
      expect(data).to.equal('00 11 22 33 44 55 aa bb cc dd : crc=66 YES\n77 88 99 ee ff 00 11 22 33 44 t=35000');
      expect(err).to.not.exist;
      done();
    });
  });

  it('readAndParse should return data when temperature file is available', function(done) {
    tempSensor.settings.input = "./test/testTemp.txt";
    tempSensor.readAndParse(function(err, temp) {
      expect(temp.crc).to.equal('66');
      expect(temp.available).to.equal('YES');
      expect(temp.temperature.raw).to.equal(35000);
      expect(temp.temperature.celcius).to.equal(35);
      expect(temp.time).to.exist;
      expect(err).to.not.exist;
      done();
    });
  });

  it('parseTemp should extract correct data from read temperature', function(done) {
    tempSensor.settings.input = "./test/testTemp.txt";
    tempSensor.readTemp(function(err, data) {
      var temp = tempSensor.parseTemp(data);
      expect(temp.crc).to.equal('66');
      expect(temp.available).to.equal('YES');
      expect(temp.temperature.raw).to.equal(35000);
      expect(temp.temperature.celcius).to.equal(35);
      expect(temp.time).to.exist;
      done();
    });
  });
});