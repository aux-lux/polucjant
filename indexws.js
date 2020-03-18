const express = require('express');
const app = express();
const iohttp = require('http').Server(app);
const io = require('socket.io')(iohttp);

global.SECONDS = 1000;
global.MINUTES = 60 * SECONDS;
global.HOURS = 60 * MINUTES;
global.DAYS = 24 * HOURS;

const { Reactor, Event } = require('./app/utils/events.js');
global.colors = require('colors/safe');
global.auth = require('./auth.js');
global.reactor = new Reactor();
reactor.registerEvent('data');
reactor.registerEvent('device');

const wsServer = require('./app/esp/connection.js');
const Clients = require('./app/client/Clients.js');
const Devices = require('./app/esp/Devices.js');
// const DataArchivizer = require('./app/esp/DataArchivizer.js');
global.devices = new Devices();
// const dataArchivizer = new DataArchivizer();

// setInterval(dataArchivizer.archivize, 1 * DAYS);
// dataArchivizer.archivize();

const clients = new Clients();

//4DKFP4TWxeLym8L4hvFWdB
function setupUI() {
	io.on('connection', function(socket){
		console.log('a user connected');
		const user = clients.add(socket);
	});

	app.use('/socket', express.static('node_modules/socket.io-client/dist'));
	app.use(express.static('public'));
	app.get('/pm25/:value', (req, res) => {
		console.log('Params: ', req.params);
		res.send('Cacy');
	});
  app.get('/', (req, res) => {
		res.sendFile(__dirname + '/index.html')
  });
  //app.get('/getInit', (req, res) => res.send(getInitialData()) );

  iohttp.listen(81, () => console.log('Example app listening on port 81!'));
}

setupUI();
