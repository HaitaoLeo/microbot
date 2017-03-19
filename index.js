/**
 * index.js
 * 
 */
 var Master = require('./lib/master');

 module.exports = {
 	Robot: require("./lib/robot"),

 	Driver: require("./lib/driver"),
 	Adaptor: require("./lib/adaptor"),
 	
 	Service: require("./lib/service/service"),

 	Utils: require("./lib/utils"),

 	robot: Master.createRobot,
 	service: Master.createService

};