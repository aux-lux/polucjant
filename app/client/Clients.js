const Client = require('./Client.js');

class Clients {
  constructor() {
    this.list = [];
    this.intervalTime = 5000;
  }
  
  add(socket) {
    const client = new Client(socket, this);

		this.list.push(client);
		return client;
	}

	remove(client) {
		this.list.splice(this.list.indexOf(client), 1);
	}
}

module.exports = Clients;