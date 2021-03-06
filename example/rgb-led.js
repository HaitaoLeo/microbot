let Microbot = require('../index.js');

let mike = Microbot.robot({
  name: "Mike",
  devices: {
    led_1: {
      driver: 'rgb-led',
      connection: 'arduino_A',
      redPin: 9,
      greenPin: 10,
      bluePin: 11
    },
    // led_2: {driver: 'led', connection: 'arduino_B', pin: 10}
    // button: {driver: 'button', connection: 'arduino_A', pin: 2}
  },
  connections: {
    // arduino_A: {adaptor: 'arduino', port: 'COM3'}
    arduino_A: {
      adaptor: 'arduino',
      port: '/dev/cu.usbmodem1421'
    }
    // arduino_B: {adaptor: 'arduino', port: 'COM3'}
  },
  run: function() {
    var color;
    setInterval(() => {
      if (color == "ff0000") {
        color = "00ff00";
        console.log(color);
      } else {
        color = "ff0000";
        console.log(color);
        console.log(color == "ff0000");
      }
      this.led_1.setRGB(color);
    }, 1000);
}
}).start();
