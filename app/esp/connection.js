const wsHttpServer = require('http').createServer();
const WebSocketServer = require('websocket').server;
const wsConfig = require('../config/websocket.json');
const deviceMessageParser = require('./deviceMessageParser.js');

wsHttpServer.listen(wsConfig.port, function() {
	console.log('Normal running at ', wsConfig.port);
});

const wsServer = new WebSocketServer({
	httpServer: wsHttpServer
});

const devicesParsers = {
	'Polucjant v0.4': {rad: 'dwa'},
};

wsServer.on('request', function(request) {
	const { headers } = request.httpRequest;
	console.log({headers});
	const id = headers['device-id'];
	const connection = request.accept(null, request.origin);
	let firstMessage = true;
	let deviceVersion;

	console.log(`${colors.yellow(id)} device connected`);

	connection.on('message', (message) => {
		if (firstMessage) {
			firstMessage = false;
			console.log('First message:', message);
			if (message.type === 'utf8') {
				if (devicesParsers[message.utf8Data]) {
					deviceVersion = devicesParsers[message.utf8Data];
					connection.sendBytes(Buffer.alloc(1,49));
					console.log({deviceVersion});
					setTimeout(() => {
						console.log('Send data request');
						connection.sendBytes(Buffer.alloc(1,51));
					}, 5000);
				} else {
					connection.sendBytes(Buffer.alloc(1,48));
				}
			}
		} else {
			console.log('message: ', message);
			deviceMessageParser(message, headers, deviceVersion);
			connection.sendBytes(Buffer.alloc(1,50));

			setTimeout(() => {
				console.log('Send data request');
				connection.sendBytes(Buffer.alloc(1,51));
			}, 5000);
		}
	});

	connection.on('close', () => {
		console.log(`${colors.red(id)} device disconnected`);
	});
});

module.exports = wsServer;