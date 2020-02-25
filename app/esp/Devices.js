const Device = require('./Device.js');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('db/main.json');
const db = low(adapter);

class Devices {
  constructor() {
    this.list = {};
    this.loadAllDevices();
  }

  loadAllDevices() {
    const allDevices = db.get('devices').value();
    if (allDevices && allDevices.length) {
      allDevices.forEach((device) => {
        let name = device.meta.name ? device.meta.name : 'noname';
        console.log('Device loaded:', device.chip, name);
        this.addDevice(device.chip, device.meta);
      });
    }
  }

  addDevice(id, meta) {
    const device = new Device(id, meta);
    this.list[id] = device;
    return device;
  }
/*
  refreshDb() {
    Object.keys(this.list).forEach((id) => {
      this.list[id].refreshDb();
    });
  }
  */

  getDevice(id) {
    if (this.list[id]) {
      return this.list[id];
    } else {
      return this.addDevice(id);
    }
  }

  renameDevice(id, newName) {
     console.log('Rename device: ', id, newName);
    if (this.list[id]) {
      console.log('Do it!');
      this.list[id].rename(newName);
    } else {
      console.warn('Device not exist');
    }
  }

  getMyDevices(ids) {
    const myDevices = [];

    ids.forEach((id) => {
      if (this.list[id]) {
        myDevices.push(this.list[id]);
      }
    });

    return myDevices;
  }
}

module.exports = Devices;