const fs = require('fs');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const structure = {
  data: [],
  format: [],
};
const compressor =  {
  serialize: (data) => JSON.stringify(data),
  deserialize: (data) => JSON.parse(data)
};

class DataArchivizer {
  constructor() {
    
  }

  archivize() {
    const ids = Object.keys(devices.list);
    const accuracy = MINUTES * 5;
    const now = Math.floor((new Date()).getTime() / DAYS) * DAYS;

    ids.forEach((id, index) => {
      const adapter = new FileSync(`db/data/recent/${id}.json`, compressor);
      const db = low(adapter);
      const format = db.get('format').value();
      const data = db.get('data').value();
      const parsedData = this.parseData(data, format);
      const dataToKeep = [];
      const dataToArchive = [];
      
      parsedData.forEach((element) => {
        if (now - element.time > DAYS) {
          dataToArchive.push(element);
        } else {
          dataToKeep.push(element);
        }
      });
      console.log('parsedData: ', parsedData.length);
      console.log('dataToArchive: ', dataToArchive.length);
      console.log('dataToKeep: ', dataToKeep.length);

      if (dataToArchive.length) {
        const reducedData = this.reduceAll(dataToArchive, accuracy, format);
        const splittedData = this.splitIntoDays(reducedData);

        for(let year in splittedData) {
          for(let month in splittedData[year]) {
            for(let day in splittedData[year][month]) {
              const dir = `db/data/archival/${id}/${year}/${month}`;
              const dbPath = `${dir}/${day}.json`;
              fs.mkdirSync(dir, { recursive: true });
              const newAdapter = new FileSync(dbPath, compressor);
              const newDb = low(newAdapter);
              newDb.defaults(structure).write();
              newDb.set('format', format);
              newDb.set('data', splittedData[year][month][day]).write();
              console.log('Save: ', id, year, month, day);
            }
          }
        }

        const formatedData = dataToKeep.map((data) => {
          return this.formatData(data, format);
        });

        db.set('data', formatedData).write();

        console.log('Data of', id, 'has been archied (', dataToArchive.length, ')');
      } else {
        console.log('Already archived');
      }
    });

    // devices.refreshDb();
  }

  splitIntoDays(dataArray) {
    const dates = {};

    dataArray.forEach((data, index) => {
      const date = new Date(data.time);
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth() + 1;
      const day = date.getUTCDate();

      if (!dates[year]) { dates[year] = {}; }
      if (!dates[year][month]) { dates[year][month] = {}; }
      if (!dates[year][month][day]) { dates[year][month][day] = []; }

      dates[year][month][day].push(data);
    });

    return dates;
  }

  formatData(data, format) {
    return format.map((key) => {
      return data[key];
    }).join(',');
  }

  parseData(data, format) {
    return data.map((element) => {
      const partials = element.split(',');
      const out = {};
      partials.forEach((part, index) => {
        out[format[index]] = parseInt(part, 10);
      });
      return out;
    });
  }

  reduceAll(dataArray, accuracy) {
    const out = [];
    let chunk = [];
    let block;
    dataArray.forEach((data) => {
      const dataBlock = Math.floor(data.time / accuracy);
      if(dataBlock !== block) {
        block = dataBlock;

        if (chunk.length) {
          out.push(this.reduceData(chunk));
          chunk = [];
        }
      }
      chunk.push(data);
    });

    if (chunk.length) {
      out.push(this.reduceData(chunk));
      chunk = [];
    }

    return out;
  }

  reduceData(dataArray) {
    const sumObject = {};
    const matches = {};
    const precisions = {
      'pm25': 1,
      'temp': 1,
    };

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

    let out = {};

    for (let key in sumObject) {
      let value = 'null';
      const pow = precisions[key] !== undefined ? Math.pow(10, precisions[key]) : 1;
      value = Math.round(sumObject[key] / matches[key] * pow) / pow;
      out[key] = value;
    }

    return out;
  }
}
module.exports = DataArchivizer;
