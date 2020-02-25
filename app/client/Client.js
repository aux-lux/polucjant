class Client {
  constructor (socket, clients) {
    this.socket = socket;
    this.clients = clients;
    this.stack = {};
    this.intervalTime = 5000;

    this.interval = setInterval(this.updateData.bind(this), this.intervalTime);
    this.bindEvents();
    this.setRoutes();
  }

  onConnect() {

  }

  doDeviceExist(id) {
    if (!this.devices) {
      return false;
    }
    const device = this.devices.filter((device) => {
      return device.id === id;
    });
    return !!device.length;
  }

  bindEvents() {
    reactor.addEventListener('data', (event) => {
		  if (this.doDeviceExist(event.id)) {
				if (this.stack[event.id] === undefined) {
          this.stack[event.id] = [];
        }
				this.stack[event.id].push(event.data);
      }
    });
    
  }

  getCurrentStatus() {
    console.log('C status');
  }

  onAuthorize(userData) {
    console.log('Authorized!');
    this.socket.emit('auth', { success: true, userData: userData });
    this.userData = userData;
    this.devices = devices.getMyDevices(userData.devices);

    if (this.devices.length) {
      this.devices.forEach((device) => {
        this.stack[device.id] = { meta: device.meta, data: device.getData() };
      });
      this.socket.emit('init', this.stack);
      this.stack = {};
    }
  }
  
  onUnauthorize() {
    this.socket.emit('auth', { success: false });
    console.log('Unthorized!');
  }

  checkToken(token) {
    auth.checkToken(token).then(
      this.onAuthorize.bind(this),
      this.onUnauthorize.bind(this)
    );
  }

  setToken(token) {
    this.token = token;
  }

  updateData() {
    this.socket.emit('data', this.stack);
    this.stack = {};
  }

  disconnect() {
    clearInterval(this.interval);
    this.clients.remove(this);
  }
  
  register(formData) {
    auth.register(formData.email, formData.pass).then(() => {
      this.socket.emit('registerStatus', { success: true });
    }, () => {
      this.socket.emit('registerStatus', { success: false });
    });
  }

  login(formData) {
    auth.login(formData.email, formData.pass, this.token).then((userData) => {
      this.userData = userData;
      this.socket.emit('auth', { success: true, userData: userData });
    }, () => {
      this.socket.emit('auth', { success: false });
    });
  }

  onIntroduce(token) {
    if (token) {
      this.setToken(token);
      this.checkToken(token);
    } else {
      auth.generateToken().then((newToken) => {
        this.setToken(newToken);
        this.socket.emit('token', newToken);
        this.onUnauthorize();
      }, console.warn);
    }
  }

  setRoutes() {
    const client = this;
    const socket = client.socket;

    socket.on('introduce', this.onIntroduce.bind(this));

    socket.on('register', (formData) => {
      client.register(formData);
    });

    socket.on('login', (formData) => {
      client.login(formData);
    });

    socket.on('rename', (data) => {
      
      auth.renameDevice(data.id, data.name).then(() => {
          devices.renameDevice(data.id, data.name);
          this.socket.emit('renameStatus', { success: true });
        }, () => {
          this.socket.emit('renameStatus', { success: false });
        });
    });

    socket.on('addDevice', (chipId) => {
      console.log('add device', chipId);
      auth.registerDevice(chipId).then((newPassword) => {
        socket.emit('devicePassword', newPassword);
      }, console.warn);
    });

    socket.on('connectDevice', (formData) => {
      auth.connectDevice(client, formData).then(() => {
        console.log('Success');
      }, console.warn);
    });

		//socket.emit('init', client.getCurrentStatus());
		socket.on('connect', function () {
      console.log('connect');
			//const inida = getInitialData();
			//console.log('inida:', inida.slaves['54321'].inputs);
			// socket.emit('init', getInitialData());
    });
    
    socket.on('reconnect', function () {
      //updateData
      console.log('reconnect');
    });

		socket.on('disconnect', function(){
			console.log('client disconnected');
      client.disconnect();
      //socket.socket.connect();
			//connections.splice(connections.indexOf(socket), 1);
		});
	}
}

module.exports = Client;