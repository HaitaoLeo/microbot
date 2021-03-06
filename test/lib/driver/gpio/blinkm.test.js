"use strict";

var BlinkM = lib("drivers/gpio/blinkm");

describe("I2C.BlinkM", function() {
  var driver;

  beforeEach(function() {
    driver = new BlinkM({
      name: "blinkm",
      connection: {},
      pin: 13
    });
  });

  describe("constructor", function() {
    it("sets @address to 0x09", function() {
      expect(driver.address).to.be.eql(0x09);
    });
  });

  describe("#commands", function() {
    it("is an object containing BlinkM commands", function() {
      for (var c in driver.commands) {
        expect(driver.commands[c]).to.be.a("function");
      }
    });
  });

  describe("#goToRGB", function() {
    beforeEach(function() {
      driver.connection.i2cWrite = spy();
    });

    it("uses #i2cWrite to set the RGB LED", function() {
      driver.goToRGB("r", "g", "b");
      expect(driver.connection.i2cWrite.calledWith(
        driver.address,
        0x6e, ["r", "g", "b"]
      )).to.be.called;
    });
  });

  describe("#fadeToRGB", function() {
    beforeEach(function() {
      driver.connection.i2cWrite = spy();
    });

    it("uses #i2cWrite to fade the RGB LED", function() {
      driver.fadeToRGB("r", "g", "b");
      expect(driver.connection.i2cWrite.calledWith(
        driver.address,
        0x63, ["r", "g", "b"]
      )).to.be.called;
    });
  });

  describe("#fadeToHSB", function() {
    beforeEach(function() {
      driver.connection.i2cWrite = spy();
    });

    it("uses #i2cWrite to fade the LED to a HSB value", function() {
      driver.fadeToHSB("h", "s", "b");
      expect(driver.connection.i2cWrite.calledWith(
        driver.address,
        0x68, ["h", "s", "b"]
      )).to.be.called;
    });
  });

  describe("#fadeToRandomRGB", function() {
    beforeEach(function() {
      driver.connection.i2cWrite = spy();
    });

    it("uses #i2cWrite to fade the LED to a random RGB value", function() {
      driver.fadeToRandomRGB("r", "g", "b");
      expect(driver.connection.i2cWrite.calledWith(
        driver.address,
        0x43, ["r", "g", "b"]
      )).to.be.called;
    });
  });

  describe("#fadeToRandomHSB", function() {
    beforeEach(function() {
      driver.connection.i2cWrite = spy();
    });

    it("uses #i2cWrite to fade the LED to a random HSB value", function() {
      driver.fadeToRandomHSB("h", "s", "b");
      expect(driver.connection.i2cWrite.calledWith(
        driver.address,
        0x48, ["h", "s", "b"]
      )).to.be.called;
    });
  });

  describe("#playLightScript", function() {
    beforeEach(function() {
      driver.connection.i2cWrite = spy();
    });

    it("uses #i2cWrite to play a light script", function() {
      driver.playLightScript("id", "repeats", "startAtLine");
      expect(driver.connection.i2cWrite.calledWith(
        driver.address,
        0x70, ["id", "repeats", "startAtLine"]
      )).to.be.called;
    });
  });

  describe("#stopScript", function() {
    beforeEach(function() {
      driver.connection.i2cWrite = spy();
    });

    it("uses #i2cWrite to stop the current script", function() {
      driver.stopScript();
      expect(driver.connection.i2cWrite.calledWith(
        driver.address,
        0x6f, []
      )).to.be.called;
    });
  });

  describe("#setFadeSpeed", function() {
    beforeEach(function() {
      driver.connection.i2cWrite = spy();
    });

    it("uses #i2cWrite to set the fade speed", function() {
      driver.setFadeSpeed(10);
      expect(driver.connection.i2cWrite.calledWith(
        driver.address,
        0x66, [10]
      )).to.be.called;
    });
  });

  describe("#setTimeAdjust", function() {
    beforeEach(function() {
      driver.connection.i2cWrite = spy();
    });

    it("uses #i2cWrite to set the time", function() {
      driver.setTimeAdjust(10);
      expect(driver.connection.i2cWrite.calledWith(
        driver.address,
        0x74, [10]
      )).to.be.called;
    });
  });

  describe("#getAddress", function() {
    beforeEach(function() {
      driver.connection.i2cRead = spy();
    });

    it("uses #i2cRead to get the Address", function() {
      driver.getAddress();
      expect(driver.connection.i2cRead.calledWith(
        driver.address,
        0x61,
        1
      )).to.be.called;
    });
  });

  describe("#setAddress", function() {
    beforeEach(function() {
      driver.connection.i2cWrite = spy();
    });

    it("uses #i2cWrite to set the Address", function() {
      driver.setAddress("newAddress");
      expect(driver.connection.i2cWrite.calledWith(
        9, // original address
        0x41, ["newAddress", 0xd0, 0x0d, "newAddress"]
      )).to.be.called;

      expect(driver.address).to.be.eql("newAddress");
    });
  });

  describe("#getFirmware", function() {
    beforeEach(function() {
      driver.connection.i2cRead = spy();
    });

    it("uses #i2cRead to get the current firmware version", function() {
      driver.getFirmware();
      expect(driver.connection.i2cRead.calledWith(
        driver.address,
        0x5a,
        1
      )).to.be.called;
    });
  });
});
