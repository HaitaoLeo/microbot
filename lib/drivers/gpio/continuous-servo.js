const Driver = require('../../driver');

const ContinuousServo = module.exports = class ContinuousServo extends Driver {
  /**
   * A Continuous Servo driver
   *
   * @constructor ContinuousServo
   *
   * @param {Object} opts options object
   * @param {String|Number} opts.pin the pin to connect to
   */
  constructor(opts) {
    super(opts);

    this.angleValue = 0;
    this.freq = opts.freq || null;
    this.pwmScale = opts.pwmScale || {
      bottom: 0,
      top: 180
    };
    this.pulseWidth = opts.pulseWidth || {
      min: 500,
      max: 2400
    };

    if (this.pin == null) {
      throw new Error("No pin specified for Continous Servo. Cannot proceed");
    }

    this.commands = {
      clockwise: this.clockwise,
      counter_clockwise: this.counterClockwise,
      stop: this.stop
    };
  }

  /**
   * Rotates the Continuous Servo clockwise
   *
   * @param {Function} [callback] - (err, val) triggers when write is complete
   * @return {void}
   * @publish
   */
  clockwise(callback) {
    return this.rotate("clockwise", callback);
  }

  /**
   * Rotates the Continuous Servo counter-clockwise
   *
   * @param {Function} [callback] - (err, val) triggers when write is complete
   * @return {void}
   * @publish
   */
  counterClockwise(callback) {
    return this.rotate("rounter-clockwise", callback);
  }

  /**
   * Rotates the Continuous Servo
   *
   * @param {String} direction 'clockwise' or 'counter-clockwise'
   * @param {Function} [callback] - (err, val) triggers when write is complete
   * @return {void}
   * @publish
   */
  rotate(callback) {
    var spin = (direction === "clockwise") ? 180 : 0;

    var scaledDuty = (spin).fromScale(
      this.pwmScale.bottom,
      this.pwmScale.top
    );

    this.connection.servoWrite(
      this.pin,
      scaledDuty,
      this.freq,
      this.pulseWidth,
      callback
    );
  }

  /**
   * Starts the Continuous Servo
   *
   * @param {Function} callback to be triggered when started
   * @return {void}
   */
  start(callback) {
    callback();
  }

  /**
   * Stops the Continuous Servo
   *
   * @param {Function} callback to be triggered when stopped
   * @return {void}
   */
  halt(callback) {
    callback();
  }

  /**
   * Stops the Continuous Servo's rotation
   *
   * @param {Function} callback (err, val) triggers when write is complete
   * @return {void}
   * @publish
   */
  stop(callback) {
    var scaledDuty = (90).fromScale(
      this.pwmScale.bottom,
      this.pwmScale.top
    );

    this.connection.servoWrite(
      this.pin,
      scaledDuty,
      this.freq,
      this.pulseWidth,
      callback
    );
  }

}