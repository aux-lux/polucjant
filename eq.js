const WEBSOCKET_PORT = 588;

const express = require('express');
const imageTool = require('get-image-data');
const app = express();
const iohttp = require('http').Server(app);
const wshttp = require('http');
const io = require('socket.io')(iohttp);
const WebSocketServer = require('websocket').server;
const spotify = require('./spotify');
const actions = spotify.actions;
const root = 'http://localhost';
const port = 88;
const baseUrl = `${root}:${port}`;
let device;
let code;

//console.log(spotify);

var server = wshttp.createServer(function(request, response) {
  // process HTTP request. Since we're writing just WebSockets
  // server we don't have to implement anything.
});
server.listen(WEBSOCKET_PORT, function() {
	console.log('Running at ', WEBSOCKET_PORT);
});

wsServer = new WebSocketServer({
  httpServer: server
});

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

wsServer.on('request', function(request) {
	const { headers } = request.httpRequest;
    //console.log('headers: ', headers);
	const id = headers['device-id'];
	console.log('device connected', id);
	var connection = request.accept(null, request.origin);
	connection.on('message', (data) => {
		console.log({data});
	});

	device = { emit: (data) => {
		connection.send(data);
	}}

	/*
	let ar = Array(450 * 3).fill(0)
	for(var i=0;i<450;i++) {
		ar[i*3] = 255;
		ar[i*3 + 1] = 255;
		ar[i*3 + 2] = 255;
	}
	connection.sendBytes(Buffer.from([].concat(...ar)));
	*/
});



setupUI();

function setupUI() {
	io.on('connection', function(socket){
		console.log('a user connected');
		socket.on('init', function (d) {
			console.log({d});
            //const inida = getInitialData();
            //console.log('inida:', inida.slaves['54321'].inputs);
			//socket.emit('init', getInitialData());
		});
		
		spotify.setSocket(socket, baseUrl);
		socket.on('spotify', (data) => {
			if (data) {
        if (data.action) {
					if (typeof actions[data.action] === 'function') {
            actions[data.action](data.value);
					}
					//console.log('is action: ', actions.hasOwnProperty(action));
				} else {
					console.log({ data });
				}
			} else {
				if (!code) {
          actions.auth();
        } else {
          socket.emit('spotify', { code });
        }
			}
		});

		socket.on('disconnect', function(){
			console.log('user disconnected');
			//connection = undefined;
		});
	});

	app.use('/socket', express.static('node_modules/socket.io-client/dist'));
	app.use(express.static('public'));
	app.get('/', (req, res) => {
		if (req.query.code) {
      code = req.query.code;
      spotify.setSpotifyCode(req.query.code);
      res.redirect('/');
    } else {
			res.sendFile(__dirname + '/eq.html')
    }
	});

	iohttp.listen(port, () => console.log(`Example app listening on port ${port}!`));
}
