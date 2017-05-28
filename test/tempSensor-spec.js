var chai = require('chai');
var expect = chai.expect; // we are using the "expect" style of Chai
var tempSensor = require('./../tempSensor');

describe('TempSensor', function() {
  before(function() {
    tempSensor.init('28-800000263717', {installKernelMod: false, defaultPath: true}, function() {});
  });

  it('readTemp should return error when temperature file is not available', function(done) {
    tempSensor.readTemp(function(err, data) {
      expect(data).to.exist;
      expect(data.length).to.equal(1);
      expect(err).to.not.exist;
      expect(data[0].error.errno).to.equal(-2);
      expect(data[0].error.code).to.equal('ENOENT');
      expect(data[0].error.syscall).to.equal('open');
      expect(data[0].error.path).to.equal('/sys/bus/w1/devices/28-800000263717/w1_slave');
      done();
    });
  });

  it('readAndParse should return error when temperature file is not available', function(done) {
    tempSensor.readAndParse(function(err, data) {
      expect(data).to.exist;
      expect(data.length).to.equal(1);
      expect(err).to.not.exist;
      expect(data[0].error.errno).to.equal(-2);
      expect(data[0].error.code).to.equal('ENOENT');
      expect(data[0].error.syscall).to.equal('open');
      expect(data[0].error.path).to.equal('/sys/bus/w1/devices/28-800000263717/w1_slave');
      done();
    });
  });

  it('readTemp should return data when temperature file is available', function(done) {
    tempSensor.init('./test/testTemp.txt', {installKernelMod: false, defaultPath: false}, function() {});
    tempSensor.readTemp(function(err, data) {
      expect(data).to.exist;
      expect(data.length).to.equal(1);
      expect(data[0]).to.equal('00 11 22 33 44 55 aa bb cc dd : crc=66 YES\n77 88 99 ee ff 00 11 22 33 44 t=35000');
      expect(err).to.not.exist;
      done();
    });
  });

  it('readTemp should return data when multiple temperature files are available', function(done) {
    tempSensor.init([
       './test/testTemp.txt'
      ,'./test/testTemp2.txt'
    ], {
       installKernelMod: false
      ,defaultPath: false
    }, function() {});
    tempSensor.readTemp(function(err, data) {
      expect(data).to.exist;
      expect(data.length).to.equal(2);
      expect(data[0]).to.equal('00 11 22 33 44 55 aa bb cc dd : crc=66 YES\n77 88 99 ee ff 00 11 22 33 44 t=35000');
      expect(data[1]).to.equal('00 11 22 33 44 55 aa bb cc dd : crc=55 YES\n77 88 99 ee ff 00 11 22 33 44 t=10000');
      expect(err).to.not.exist;
      done();
    });
  });

  it('readAndParse should return data when temperature file is available', function(done) {
    tempSensor.init('./test/testTemp.txt', {installKernelMod: false, defaultPath: false}, function() {});
    tempSensor.readAndParse(function(err, temp) {
      expect(temp).to.exist;
      expect(temp[0].crc).to.equal('66');
      expect(temp[0].available).to.equal('YES');
      expect(temp[0].temperature.raw).to.equal(35000);
      expect(temp[0].temperature.celcius).to.equal(35);
      expect(temp[0].time).to.exist;
      expect(err).to.not.exist;
      done();
    });
  });

  it('readAndParse should return data when multiple temperature files are available', function(done) {
    tempSensor.init([
       './test/testTemp.txt'
      ,'./test/testTemp2.txt'
    ], {
       installKernelMod: false
      ,defaultPath: false
    }, function() {});
    tempSensor.readAndParse(function(err, temp) {
      expect(temp).to.exist;
      expect(temp.length).to.equal(2);
      expect(temp[0].crc).to.equal('66');
      expect(temp[0].available).to.equal('YES');
      expect(temp[0].temperature.raw).to.equal(35000);
      expect(temp[0].temperature.celcius).to.equal(35);
      expect(temp[0].time).to.exist;

      expect(temp[1].crc).to.equal('55');
      expect(temp[1].available).to.equal('YES');
      expect(temp[1].temperature.raw).to.equal(10000);
      expect(temp[1].temperature.celcius).to.equal(10);
      expect(temp[1].time).to.exist;
      expect(err).to.not.exist;
      done();
    });
  });

  it('parseTemp should extract correct data from read temperature', function(done) {
    tempSensor.init('./test/testTemp.txt', {installKernelMod: false, defaultPath: false}, function() {});
    tempSensor.readTemp(function(err, data) {
      var temp = tempSensor.parseTemp(data);
      expect(temp).to.exist;
      expect(temp.length).to.equal(1);
      expect(temp[0].crc).to.equal('66');
      expect(temp[0].available).to.equal('YES');
      expect(temp[0].temperature.raw).to.equal(35000);
      expect(temp[0].temperature.celcius).to.equal(35);
      expect(temp[0].time).to.exist;
      done();
    });
  });

  it('parseTemp should extract correct data from read temperature when multiple sources are used', function(done) {
    tempSensor.init([
       './test/testTemp.txt'
      ,'./test/testTemp2.txt'
    ], {
       installKernelMod: false
      ,defaultPath: false
    }, function() {});

    tempSensor.readTemp(function(err, data) {
      var temp = tempSensor.parseTemp(data);
      expect(temp).to.exist;
      expect(temp.length).to.equal(2);
      expect(temp[0].crc).to.equal('66');
      expect(temp[0].available).to.equal('YES');
      expect(temp[0].temperature.raw).to.equal(35000);
      expect(temp[0].temperature.celcius).to.equal(35);
      expect(temp[0].time).to.exist;

      expect(temp[1].crc).to.equal('55');
      expect(temp[1].available).to.equal('YES');
      expect(temp[1].temperature.raw).to.equal(10000);
      expect(temp[1].temperature.celcius).to.equal(10);
      expect(temp[1].time).to.exist;
      done();
    });
  });
});