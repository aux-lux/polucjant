const fs = require('fs');

class Device {
  constructor(id, meta) {
    this.id = id;
    this.getRaw();
    if (this.buf) {
      console.log(this.buf.length);
      this.data = this.parseRaw(this.buf);
      this.parsedData = this.parseData(this.data);
    }
    // this.refreshDb();
    
    this.order = ['time', 'pm25', 'temp', 'humi', 'pres'];
    /*
    this.meta = meta || {};
    // this.db.defaults(structure).write();

    const format = this.db.get('format').value();
    if (!format || !format.length) {
      this.db.set('format', this.order).write();
    }
    */
  }

  rename(newName) {
    console.log('rename', newName);
    this.meta.name = newName;
  }

  getDataPath() {
    const today = new Date();
    const folder = `./bdb/data/recent/${this.id}/${today.getFullYear()}/${today.getMonth()}`;
    const file = `${today.getDate()}.polu`;
    const filePath = `${folder}/${file}`;

    return filePath;
  }

  parseData(data) {
    const now = new Date();
    const day = 86400;
    const timestamp = Math.floor(now.getTime() / 1000 / day) * day;
    const parsedData = [];
    data.forEach((ob, index) => {
      const newOb = {
        time: Math.floor((timestamp + ob.time / 65536 * day) * 1000),
        pm25: ob.pm25 === 9999 ? null : ob.pm25,
        temp: ob.temp / 100,
        humi: ob.humi / 100,
        pres: (ob.pres + 10000000) / 10000,
      };
      parsedData[index] = newOb;
    });

    // console.log({parsedData});
    return parsedData;
  }

  parseRaw(buf) {
    const newData = [];
    for (let i=0; i< buf.length;i+=10) {
      const temp = buf.readInt16LE(i + 0);
      const humi = buf.readInt16LE(i + 2);
      const pres = buf.readInt16LE(i + 4);
      let   pm25 = buf.readInt16LE(i + 6);
      const time = buf.readInt16LE(i + 8);
      if (pm25 === 9999) {
        pm25 = null;
      }
      const ob = {temp, humi, pres, pm25, time};
      newData.push(ob);
    }

    return newData;
  }

  getRaw() {
    const filePath = this.getDataPath();
    // const adapter = new FileSync(filePath, compressor);
    try {
      fs.accessSync(filePath, fs.constants.R_OK | fs.constants.W_OK);
      this.buf = fs.readFileSync(filePath);
    } catch (err) {
      console.error('no access!');
    }
    // this.db = low(adapter);
  }

  getData() {
    return this.parsedData;
    /*
    const rawData = this.db.get('data').value();
    const parsedData = this.parseData(rawData);
    const now = (new Date()).getTime();

    return parsedData.filter((element) => {
      const dif = now - element.time;
      return dif < HOURS * 12;
    });
    */
  }

  pushData(data) {
    const today = new Date();
    const folder = `./bdb/data/recent/${this.id}/${today.getFullYear()}/${today.getMonth()}`;
    const file = `${today.getDate()}.polu`;
    const filePath = `${folder}/${file}`;

    fs.mkdir(folder, { recursive: true }, (err) => {
      if (err) return console.log(err);
      fs.appendFile(filePath, data, (err) => {
        if(err) return console.log(err);
      }); 
    });

    console.log(data);
    const parsedBin = this.parseRaw(data);
    const parsedData = this.parseData(parsedBin);
    this.parsedData.push(parsedData.pop());
    // console.log('Push: ', parsedData);
    // this.db.get('data').push(this.formatData(data)).write();
    //console.log('Data:', data);
    /*
    const nowMinute = Math.floor(data.time / MINUTES);
    if (lastMinute !== nowMinute) {
      if (chunkDatas.length) {
        const reduced = Device.reduceData(chunkDatas);
        reduced[0] = lastMinute;
        db.get('data').push(reduced.join(',')).write();
      }
      chunkDatas = [data];
      lastMinute = nowMinute;
    } else {
      chunkDatas.push(data);
    }
    */
  }
/*
  parseData(data) {
    return data.map((element) => {
      const partials = element.split(',');
      const out = {};
      partials.forEach((part, index) => {
        out[this.order[index]] = parseFloat(part);
      });
      return out;
    });
  }
*/
  formatData(data) {
    return this.order.map((key) => {
      return data[key];
    }).join(',');
  }

  /*
  reduceData(dataArray) {
    const sumObject = {};
    const matches = {};
    dataArray.forEach((data) => {
      Object.keys(data).forEach((key) => {
        if (typeof data[key] === 'number') {
          if (!sumObject[key]) {
            sumObject[key] = data[key];
            matches[key] = 1;
          } else {
            sumObject[key] += data[key];
            matches[key] ++;
          }
        }
      });
    });
    return this.order.map((key) => {
      return (sumObject[key]) ? (sumObject[key] / matches[key]).toFixed(key==='pm25'?2:0) : "null";
    });
  }
  */
}



/*
const adapter = new FileSync('db/data/recent/chip.json');
const adapter = new FileSync('db/main.json', {
  serialize: (data) => JSON.stringify(data),
  deserialize: (data) => JSON.parse(data)
});
*/
/*
const db = low(adapter);
db.defaults(structure).write();

const saltRounds = 12;
const myPlaintextPassword = 's0/\/\P4$$w0rD';
const someOtherPlaintextPassword = 'not_bacon';
const now = () => process.hrtime()[0] + process.hrtime()[1] / 1000000000;
const start = now();
//console.log(now());

const hashPassword = (pass) => (new Promise ((resolve, reject) => {
  bcrypt.hash(pass, saltRounds, function(err, hash) {
    if (err) {
      reject(err);
    } else {
      resolve(hash);
    }
  });
}));
*/


/*
const dbDevice = (chip) => {
  

  return device;
};

const getMyChips = (chips) => {
  const refOut = [];
  chips.forEach((chip) => {
    if (!dbs[chip]) {
      dbs[chip] = dbDevice(chip);
    }
    refOut[chip] = dbs[chip];
  });

  return refOut;
};
*/
module.exports = Device;
