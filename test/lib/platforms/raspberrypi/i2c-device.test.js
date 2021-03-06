/**
 * i2c-device test for raspberrypi
 */

const I2CDevice = lib("platforms/raspberrypi/i2c-device"),
    MockI2C = lib("platforms/raspberrypi/i2c");

const EventEmitter = require("events").EventEmitter;

function compareBuffers(a, b) {
  if (!Buffer.isBuffer(a)) {
    return undefined;
  }

  if (!Buffer.isBuffer(b)) {
    return undefined;
  }

  if (typeof a.equals === "function") {
    return a.equals(b);
  }

  if (a.length !== b.length) {
    return false;
  }

  for (const i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }

  return true;
}

describe("I2CDevice", () => {
  let device, wire;

  beforeEach(() => {
    MockI2C.openSync = () => {
    };

    device = new I2CDevice({
      address: 0x4A,
      bus: 1
    });
    device.connect();
  });

  it("is an EventEmitter", () => {
    expect(device).to.be.an.instanceOf(EventEmitter);
  });

  describe("constructor", () => {
    it("sets <address> to the provided address", () => {
      expect(device.address).to.be.eql(0x4A);
    });

    it("sets <bus> to the provided interface", () => {
      expect(device.bus).to.be.eql(1);
    });
  });

  describe(".write", () => {
    let callback;

    beforeEach(() => {
      callback = spy();
      wire = device.i2cWire = { i2cWrite: spy() };
      device.write("command", [1, 2, 3], callback);
    });

    it("writes a set of bytes to the I2C connection", () => {
      let call = wire.i2cWrite.firstCall;

      let bufsMatch = compareBuffers(
        new Buffer(["command"].concat([1, 2, 3])),
        call.args[2]
      );

      expect(bufsMatch).to.be.eql(true);
      expect(call.args[3]).to.be.eql(callback);
    });
  });

  describe(".read", () => {
    let callback;

    beforeEach(() => {
      callback = spy();
      wire = device.i2cWire = { readI2cBlock: spy() };
      device.read("c", 1024, callback);
    });

    it("reads register from I2C connection", () => {
      let call = wire.readI2cBlock.firstCall;

      expect(call.args[0]).to.be.eql(0x4A);
      expect(call.args[1]).to.be.eql("c");
      expect(call.args[2]).to.be.eql(1024);
    });
  });

  describe(".writeByte", () => {
    let callback;

    beforeEach(() => {
      callback = spy();
      wire = device.i2cWire = { sendByte: spy() };
      device.writeByte(1, callback);
    });

    it("writes a single byte to the I2C connection", () => {
      expect(wire.sendByte.calledWith(0x4A, 1, callback)).to.be.ok;
    });
  });

  describe(".readByte", () => {
    let callback;

    beforeEach(() => {
      callback = spy();
      wire = device.i2cWire = { receiveByte: spy() };
      device.readByte(callback);
    });

    it("reads a single byte from the I2C connection", () => {
      expect(wire.receiveByte.calledWith(0x4A, callback)).to.be.ok;
    });
  });
});