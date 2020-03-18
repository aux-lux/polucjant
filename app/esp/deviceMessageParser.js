const fs = require('fs');

const cv = (n) => {
  const a = 65536;
  const ar = [];
  let nn = n;
  if (n<0) {
    nn = a - n;
  }
  let hex = nn.toString(16);
  let o = '';
  var zeros = 4 - hex.length;
  for(let i=0;i<zeros;i++) {
    hex = '0' + hex;
  }
  for(let i=0;i<hex.length;i+=2){
    const dec16 = parseInt(hex.substr(i, 2), 16);
    ar.push(dec16);
    // const char = String.fromCharCode(dec16);
    // o += char;
  }
  return ar;
};
const parseBinary = (buf) => {
  /*
  const temp = buf.readInt16LE(0);
  const humi = buf.readInt16LE(2);
  const pres = buf.readInt16LE(4);
  */
  let pm25 = buf.readInt16LE(0);
  if (pm25 === 9999) {
    pm25 = null;
  }
  
  const now = new Date();
  const nowSeconds = now.getUTCHours() * 60 * 60 + now.getUTCMinutes() * 60 + now.getUTCSeconds();
  const time = Math.max(0, Math.min(65536, Math.round(nowSeconds / 86400 * 65536)));
  // console.log({time});
  const output = Buffer.concat([buf, Buffer.from(cv(time))]);

  return ob = [{pm25, bin: output}];
};

module.exports = (message, headers) => {
  const id = headers['device-id'];
  const device = devices.getDevice(id);
  let ob;
  if (message.type === 'binary') {
    console.log('Bin: ', message.binaryData);
    try {
      ob = parseBinary(message.binaryData);
    } catch (e) {
      console.warn('Wrong Binary');
    }
  } else {
    // console.log('Txt: ', message.utf8Data);
    try {
      ob = JSON.parse(message.utf8Data);
    } catch (e) {
      console.warn('Wrong JSON');
    }
  }

  if (ob && ob.length) {
    const today = new Date();
    if (ob[0].bin) {
      // const folder = `./bdb/data/recent/${id}/${today.getFullYear()}/${today.getMonth()}`;
      // const file = `${today.getDate()}.polu`;
      // const filePath = `${folder}/${file}`;
      const data = ob[0].bin;
      console.log('Length: ', data.length);
      delete ob[0].bin;
      device.pushData(data);

      // const parsedData = parseBinary(data);
      // console.log('dispatch event "data": ', id, data, parsedData);
      // reactor.dispatchEvent('deviceData', {id, data});

      /*
      if (auth.deviceMeta(id, data.data)) {
        reactor.dispatchEvent('device', {
          id: id,
          data: localData[id],
        });
      }
      */

      /*
      fs.mkdir(folder, { recursive: true }, (err) => {
        if (err) return console.log(err);
        fs.appendFile(filePath, data, (err) => {
          if(err) return console.log(err);
        }); 
      });
      */
    }
  
    const now = today.getTime();
    if (ob) {

    }
    /*
    console.log(id, 'ob:' , ob);
    ob.forEach((data) => {
      if (data.verbose !== undefined || data.data !== undefined) {
        console.log(`${colors.green(id)} device attached`);
        if (auth.deviceMeta(id, data.data)) {
          reactor.dispatchEvent('device', {
            id: id,
            data: localData[id],
          });
        }
      }
    });
    */
  }
};