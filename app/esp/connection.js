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

wsServer.on('request', function(request) {
	const { headers } = request.httpRequest;
	// console.log({headers});
	const id = headers['device-id'];
	const connection = request.accept(null, request.origin);

	console.log(`${colors.yellow(id)} device connected`);

	connection.on('message', (message) => {
		console.log('message: ', message);
		connection.sendBytes(Buffer.alloc(1,49));
		deviceMessageParser(message, headers);
	});

	connection.on('close', () => {
		console.log(`${colors.red(id)} device disconnected`);
	});
});

module.exports = wsServer;