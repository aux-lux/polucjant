const WEBSOCKET_PORT = 3311;
const WEBSOCKET_AUTH_PORT = 3312;
const WEB_PORT = 3313;
const fs = require('fs');
var request = require('request');

const colors = require('colors/safe');

const express = require('express');
const app = express();
const iohttp = require('http').Server(app);
const wshttp = require('http');
const io = require('socket.io')(iohttp);
const WebSocketServer = require('websocket').server;

const Slave = require('./modules/Slave');
const connections = [];
const auths = [];

var server = wshttp.createServer();
var authServer = wshttp.createServer(function (request, response) {
	console.log((new Date()) + ' Received request for ' + request.url);
	response.writeHead(404);
    response.end();
});

server.listen(WEBSOCKET_PORT, function() {
	console.log('Normal running at ', WEBSOCKET_PORT);
});
authServer.listen(WEBSOCKET_AUTH_PORT, function() {
	console.log('Auth running at ', WEBSOCKET_AUTH_PORT);

});

const wsServer = new WebSocketServer({
	httpServer: server
});
const wsAuthServer = new WebSocketServer({
	httpServer: authServer
});
function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

getJSON = (msg) => {
	try {
		return JSON.parse(msg);
	} catch (error) {
		console.warn('Error parsing json');
	}
}

var slaves = {};

function getAllSlaves () {
	console.log('getAllSlaves');
	var output = {};
	for (let id in slaves) {
		//console.log('id : ', id);
		output[id] = slaves[id].getUIData();
	}
	return output;
}
//_connection.sendUTF(sendString);
wsServer.on('request', function(request) {
	const { headers } = request.httpRequest;
	//console.log('headers: ', headers);
	const id = headers['device-id'];

	const connection = request.accept(null, request.origin);

	if (slaves[id]) {
		slaves[id].updateConnection(connection);
	} else {
		const slave = new Slave(connection, id);
		slaves[id] = slave;
	}
});

let setCredentials;

wsAuthServer.on('request', function(request) {
	const { headers } = request.httpRequest;
	const id = headers['device-id'];

	console.log(colors.cyan(id + ' new Auth connection'));

	const connection = request.accept(null, request.origin);
	auths.push({
		connection,
		id,
	});

	setCredentials = (credentials) => {
		connection.sendUTF(JSON.stringify(credentials));
	}
	//var connection = request.accept('echo-protocol', request.origin);

	//connection.sendUTF(JSON.stringify({say: 'hello'}));
	/*
	connection.on('close', (reasonCode, description) => {
		console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
	});

	connection.on('message', function(message) {
		console.log('message: ', message);
	});
	/*
	setTimeout(() => {
		console.log('try send stuff');
		connection.sendUTF('Hello from auth');
	}, 500);
	*/
});

setupUI();
function getInitialData () {
	return {
		slaves: getAllSlaves(),
		waitingAuth: getWaitingAuth(),
	};
}

var me;
var volume;
var device;
var token;

function getWaitingAuth() {
	return auths.map((item) => {
		return item.id;
	});
}

function getRandomQuote () {
	return new Promise((resolve, reject) => {
		request(
			'http://www.losowe.pl/',
			function(error, response, body) {
				if (error) {
					reject(error);
				} else {
					var quotePattern = /<blockquote>(.*)<\/blockquote>/;
					resolve(body.match(quotePattern)[1].trim());
				}
			}
		);
	});
}

//4DKFP4TWxeLym8L4hvFWdB
function setupUI() {
	io.on('connection', function(socket){
		console.log('a user connected');
		connections.push(connections);
		socket.on('init', function () {
			//const inida = getInitialData();
			//console.log('inida:', inida.slaves['54321'].inputs);
			socket.emit('init', getInitialData());
		});

		socket.on('quote', function () {
			getRandomQuote().then((quote) => {
				socket.emit('quote', quote);
			}, (error) => {
				socket.emit('quote', 'Nie umim');
				console.warn(error);
			})
		});

		socket.on('wifiAuth', function (credentials) {
			setCredentials(credentials);
		});

		socket.on('set', function (object) {
			const slave = slaves[object.slaveId];
			if (slave) {
				slave.setValue({
					name: object.name,
					value: object.value,
				})
			}
		});

		socket.on('get', function (object) {
			const slave = slaves[object.slaveId];
			if (slave) {
				const {requestId, name} = object;
				slave.getValue({requestId, name}).then(
					(data) => {
						console.log('got data', data);
						socket.emit('get', data);
					},
					() => {
						console.warn('Timeout');
					}
				)
			}
		});

		socket.on('disconnect', function(){
			console.log('user disconnected');
			connections.splice(connections.indexOf(socket), 1);
		});
	});

	app.use('/socket', express.static('node_modules/socket.io-client/dist'));
	app.use(express.static('public'));
	/*
	app.get('/', (req, rex) => {
	console.log('Code: ', req.query.code);
	});
	*/
	app.get('/', (req, res) => {
		if (req.query.code) {
			res.redirect('/');
		} else {
			res.sendFile(__dirname + '/index.html')
		}
	});
	//app.get('/getInit', (req, res) => res.send(getInitialData()) );

	iohttp.listen(WEB_PORT, () => console.log('Example app listening on port ' + WEB_PORT));
}
