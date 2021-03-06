/**
 * Messaage Proxy is a built-in microservice that ecapsulates 
 * details of protocols (e.g. http and mqtt) and provides unified
 * RESTful interfaces for other services to communicate with each other.
 * 
 */
const EventEmitter = require('events').EventEmitter,
	Logger = require('../logger'),
	MqttBroker = require('../config').MqttBroker,
	ProxyConfig = require('../config').MessageProxy,
	http = require('http'),
	url = require('url'),
	mqtt = require('mqtt'),
	qs = require('querystring'),
	rp = require('request-promise-native'),
	_ = require('lodash');

let running = false;

/**
 * MessageProxy Class
 * @constructor MessageProxy
 * @return {MessageProxy} a new MessageProxy instance
 */
const MessageProxy = module.exports = class MessageProxy extends EventEmitter {

	constructor() {
		super();
		// this.clients collects mqtt clients that call proxy for subscritions
		this.clients = {};
		this.pendingClients = {};
		this.topics = [];
		this.pendingTopics = [];
		// listening for subscribe/request from clients
		this.server = http.createServer((req, res) => {
			let postData = "";
			req.on('data', (chunk) => {
				postData += chunk;
			});
			req.on('end', () => {
				let data = qs.parse(postData);
				if (data.protocol === 'http') {
					_httpHandler.call(this, res, data);
				} else {
					_mqttHandler.call(this, req, res, data);
				}
			});
		});

		// initialize mqtt agent
		this.mqttAgents = {};
		this.mqttAgents[_getAgentKey()] = _createMqttClient.call(this, MqttBroker.host, MqttBroker.port);

		// binding mqtt subcribed event handler
		this.on('subscribed', (broker, topic) => {
			let topicKey = _getTopicKey(broker, topic);
			_.remove(this.pendingTopics, (value) => {
				return value === topicKey;
			});
			let clients = [];
			_.forEach(this.pendingClients[topicKey], (res, key) => {
				clients.push(key);
				res.writeHead(204);
				res.end();
			});
			this.clients[topicKey] = clients;
			this.pendingClients[topicKey] = undefined;
			this.topics.push(topicKey);
		});
	}

	/**
	 * Start the proxy
	 * @return {void}
	 */
	start() {
		if (!running) {
			this.server.listen(ProxyConfig.port);
			running = true;
		}
	}
};

/**
 * handle REST GET service request
 * @param {Response} [res] http response
 * @param {Object} [data] http service request content
 * @param {String} [data.uri] uri of rest api
 * @param {Object} [data.message] key-value pairs of the api's parameters
 * @return {void}
 */
function _httpHandler(res, data) {
	let uri = 'http://' + data.uri,
		msg = JSON.parse(data.message);
	let fnGETOptions = (uri, msg) => {
		_.forEach(msg, (value, key) => {
			uri += '\/' + key + '\/' + value;
		});
		return {method: "GET", uri: uri};
	}

	let opts = fnGETOptions(uri, msg);
	rp(opts)
		.then(function (parsedBody) {
			res.writeHead(200, {'Content-Type': "text/plain"});
			res.write(parsedBody);
			res.end();
		})
		.catch(function (err) {
			// if request fails, set response status 404 and send back the error
			res.writeHead(404, {'Content-Type': "text/plain"});
			res.write(JSON.stringify({code: "ERROR", error: err.error}));
			res.end();
		});
};

/**
 * handle mqtt service subscribe request
 * @param {HttpRequest} [req] http request
 * @param {HTTPResponse} [res] http response
 * @param {Object} [data] http service request content
 * @param {String} [data.message.port] mqtt client's listen port for published messages
 * @param {String} [data.message.topic] topic the mqtt client want to subscribe
 * @return {void}
 */
function _mqttHandler(req, res, data) {
	let	client = req.connection.remoteAddress.substring(7),
		msg = JSON.parse(data.message),
		topic = msg.topic,
		port = msg.port,
		broker = msg.broker || MqttBroker;
	let fnAddClient = (map, broker, topic, client, port) => {
		let key = _getTopicKey(broker, topic);
		let clients = map[key] || new Array();
		if (_.indexOf(clients, client + ':' + port) == -1) {
			clients.push(client + ':' + port);
		}
		map[key] = clients;
	}

	let fnAddPendingReq = (map, broker, topic, key, res) => {
		let topicKey = _getTopicKey(broker, topic);
		let reqs = map[topicKey] || {};
		if (!reqs[key]) {
			reqs[key] = res;
		}
		map[topicKey] = reqs;
	};

	let topicKey = _getTopicKey(broker, topic);
	if (this.topics.indexOf(topicKey) !== -1) {
		// this topic is already subscribed, update client list directly
		fnAddClient(this.clients, broker, topic, client, port);
		res.writeHead(204);
		res.end();
	} else {
		let key = client + ":" + port;
		fnAddPendingReq(this.pendingClients, broker, topic, key, res);
		// subscribe request is sent, waiting for mqtt broker's response
		if (this.pendingTopics.indexOf(topicKey) !== -1) {
			return;
		}
		// subscribe the topic for the first time
		this.pendingTopics.push(topicKey);

		let mqttAgent = this.mqttAgents[_getAgentKey(broker)];
		if (!mqttAgent) {
			mqttAgent = _createMqttClient.call(this, broker.host, broker.port);
			this.mqttAgents[_getAgentKey(broker)] = mqttAgent;
		}
		mqttAgent.subscribe(topic, null, (err, granted) => {
			if (err) {
				res.writeHead(503);
				res.write(JSON.stringify({message: err.message}));
				res.end();
			} else {
				this.emit('subscribed', broker, granted[0].topic);
			}
		});
	}
};

/**
 * Send notification to clients who subscribe a specific topic when get a message from broker
 * @param {String} [topic] topic of the message
 * @param {Buffer} [message] message get from broker
 * @return {void}
 */
function _notifyClient(topicKey, message) {
	let clients = this.clients[topicKey];
	let topic = topicKey.split('|')[1];
	if (clients) {
		_.forEach(clients, (value) => {
			let opts = {
				host: value.split(':')[0],
				port: value.split(':')[1],
				method: "POST"
			};
			let req = http.request(opts);
			let content = {
				topic: topic,
				message: message.toString('utf-8')
			};
			req.write(JSON.stringify(content));
			req.end();
		});
	}
};

function _createMqttClient(host, port) {
	if (! (host && port)) {
		throw new Error('Customized broker required both host and port values.');
	}
	let agent = mqtt.connect({
		host: host,
		port: port
	});
	agent.on('connect', () => {
		Logger.info('Mqtt-Proxy', 'is listening to MQTT broker ' + host + ':' + port);
	});
	agent.on('message', (topic, message) => {
		let topicKey = _getTopicKey({host: host, port: port}, topic);
		_notifyClient.call(this, topicKey, message);
	});
	return agent;
}

function _getAgentKey(broker) {
	if (broker && broker.host && broker.port) {
		return broker.host + ':' + broker.port;
	}
	return MqttBroker.host + ':' + MqttBroker.port; 
}

function _getTopicKey(broker, topic) {
	return _getAgentKey(broker) + '|' + topic;
}