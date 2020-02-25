const bcrypt = require('bcrypt');
const low = require('lowdb');
const crypto = require('crypto');
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync('db/main.json');
/*
const adapter = new FileSync('db/main.json', {
  serialize: (data) => JSON.stringify(data),
  deserialize: (data) => JSON.parse(data)
});
*/
const structure = {
  users: [],
  devices: [],
};
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
// user: { email: '', pass: '', devices: [], settings: [] },


// Set some defaults

// Add a post
//db.get('users').push({ email: 'ulolo@world.com', pass: 'fsadfas' }).write();


 //db.set('users', { email: 'hello3@world.com', pass: '1234565' }).write();
/*
// Set a user using Lodash shorthand syntax
db.set('user.name', 'typicode')
  .write()
*/
const checkUser = (email) => !!db.get('users').find({ email }).value();

const register = (email, password) => (new Promise((resolve, reject) => {
  if (checkUser(email)) {
    console.warn('user exist');
    reject('User exist');
  } else {
    hashPassword(password).then((hash) => {
      db.get('users').push({ email: email, pass: hash, devices: [], settings: [] }).write();
    });
  }
}));

const prepareResponse = (user) => ({
  email: user.email,
  devices: user.devices,
  settings: user.settings,
  admin: user.admin,
});

const login = (email, password, token) => (new Promise((resolve, reject) => {
  console.log('logging in: ', email, password, token);
  const userSelector = db.get('users').find({ email });
  if (userSelector.value()) {
    hashPassword(password).then((hash) => {
      const user = userSelector.value();
      bcrypt.compare(password, user.pass, function(err, res) {
        if (res) {
          console.log('success');
          userSelector.assign({ token }).write();
          resolve(prepareResponse(user));
        } else {
          reject('Incorrect password');
        }
      });
    });
  } else {
    reject('User doesn\'t exist');
  }
}));

const generateChipPassword = () => (new Promise((resolve, reject) => {
  crypto.randomBytes(3, (err, buffer) => {
    if (err) {
      reject();
    } else {
      resolve(buffer.toString('hex'));
    }
  });
}));

const registerDevice = (chip) => (new Promise((resolve, reject) => {
  const devices = db.get('devices');
  const exists = devices.find({ chip }).value();
  if (exists) {
    reject('Device exists');
  } else {
    generateChipPassword().then((newPassword) => {
      hashPassword(newPassword).then((hash) => {
        devices.push({ chip, pass: hash, meta: {} }).write();
        resolve(newPassword);
      }, reject);
    }, reject);
  }
}));


const generateToken = () => (new Promise((resolve, reject) => {
  crypto.randomBytes(48, (err, buffer) => {
    if (err) {
      reject();
    } else {
      resolve(buffer.toString('hex'));
    }
  });
}));

const renameDevice = (id, newName) => (new Promise((resolve, reject) => {
  const chipDb = db.get('devices').find({ chip: id.toString() });
  if (chipDb.value()) {
    chipDb.assign({ meta: { name: newName }}).write();
    resolve();
  } else {
    reject();
  }
}));

const checkToken = (token) => (new Promise((resolve, reject) => {
  const userByToken = db.get('users').find({ token });
  if (userByToken.value()) {
    resolve(prepareResponse(userByToken.value()));
  } else {
    reject();
  }
}));

const connectDevice = (user, formData) => (new Promise((resolve, reject) => {
  const email = user.userData.email;
  const chip = formData.chip;
  const pass = formData.pass;
  const devices = db.get('devices');
  const device = devices.find({ chip }).value();
  if (device && !device.assigned) {
    bcrypt.compare(pass, device.pass, function(err, res) {
      if (res) {
        const user = db.get('users').find({ email });
        user.get('devices').push(chip).write();
        console.log('good');
        resolve();
      } else {
        console.log('bad');
        reject();
      }
    });
  }
}));

const deviceMeta = (chip, meta) => {
  const devices = db.get('devices');
  const device = devices.find({ chip });
  const deviceValue = device.value();

  if (deviceValue && !deviceValue.meta) {
    device.set('meta', meta).write();
    return true;
  }

  return false;
};

//registerDevice(3312496, 'CleanAirIsThin');
//registerDevice(961920, 'CleanAirIsThin');

module.exports = {
  login,
  register,
  registerDevice,
  generateToken,
  checkToken,
  connectDevice,
  renameDevice,
  deviceMeta
};

/*
login('im@super.cool', 'mypass').then(() => {
  console.log('success!');
}, (error) => {
  console.warn('Error: ', error);
});
*/

/*
register('im@super.cool', 'mypass').then((success) => {
  console.log('success:' , success);
}, (error) => {
  console.warn('Error: ', error);
});
*/
