const authForm = document.getElementById('auth-form');
const menuBar = document.getElementById('menu-bar');
const userWrapper = document.getElementById('user-wrapper');
const logoutButton = document.getElementById('logout');
const mainMenu = document.getElementById('main-menu');

const inputEmail = authForm.querySelector('input[name=email]');
const inputPassword = authForm.querySelector('input[name=password]');

const loginButton = authForm.querySelector('.sumit-login');
const registerButton = authForm.querySelector('.sumit-register');

const devicesList = document.getElementById('rename-devices');
const connectForm = document.getElementById('connect-device');
const connectDeviceId = connectForm.querySelector('input[name=device-id]');
const connectDevicePass = connectForm.querySelector('input[name=device-pass]');
const connectSubmit = connectForm.querySelector('button');

var token = localStorage.getItem('token');

socket.on('auth', (auth) => {
	console.log('auth: ', auth);
	if (auth.success === true) {
		const userData = auth.userData;
		if (userData.admin === true) {
			setAdmin();
		}
		userWrapper.querySelector('#user').innerHTML = '<span>logged as: </span>' + userData.email;
		userWrapper.style.display = 'block';
		// connectForm.style.display = 'block';
		authForm.style.display = 'none';
		buildUserInterface();
	} else {
		authForm.style.display = 'block';
	}
});

const menu = {
	list: [],
	add: (button, wrapper) => {
		button.addEventListener('click', () => {
			const wasOn = button.classList.contains('active');
			menu.list.forEach((element) => {
				element.wrapper.style.display = 'none';
				element.button.classList.remove('active');
			});
			if (!wasOn) {
				wrapper.style.display = 'block';
				button.classList.add('active');
			}
		});

		menu.list.push({
			button,
			wrapper
		});
	}
};

const buildUserInterface = () => {
	const linkButton = document.createElement('div');
	linkButton.className = 'admin-button button';
	mainMenu.appendChild(linkButton);
	linkButton.innerHTML = `<div class="icon">${SVGchip}</div><div class="modifier link border">${SVGlink}</div><div class="modifier link">${SVGlink}</div>`;

	menu.add(linkButton, connectForm);

	const listButton = document.createElement('div');
	listButton.className = 'admin-button button';
	mainMenu.appendChild(listButton);
	listButton.innerHTML = `<div class="icon">${SVGchip}</div>`;

	menu.add(listButton, devicesList);
};

socket.emit('introduce', token);
socket.on('token', (newToken) => {
	localStorage.setItem('token', newToken);
	authForm.style.display = 'block';
});


const submitConnect = (event) => {
  event.preventDefault();
	const chipId = connectDeviceId.value;
	const chipPass = connectDevicePass.value;

	if (chipId && chipPass) {
		socket.emit('connectDevice', { chip: chipId, pass: chipPass });
	} else {
		console.warn('Fill all fields');
	}
};

connectForm.addEventListener('submit', submitConnect);
connectSubmit.addEventListener('click', submitConnect);

registerButton.addEventListener('click', () => {
	const email = inputEmail.value;
	const pass = inputPassword.value;

	if (email && pass) {
		socket.emit('register', { email, pass });
	} else {
		console.warn('Fill form');
	}
});

logoutButton.addEventListener('click', () => {
	localStorage.removeItem('token');
	window.location.reload();
});


const buildAddDevice = () => {
	// const svgChip = fs.readFileSync('/img/chip2.svg');
	const adminButton = document.createElement('div');
	adminButton.className = 'admin-button button';
	mainMenu.appendChild(adminButton);
	adminButton.innerHTML = `<div class="icon">${SVGchip}</div><div class="modifier add border">${SVGadd}</div><div class="modifier add">${SVGadd}</div>`;

	const adminForm = document.createElement('form');
	adminForm.id = 'admin-form';
	adminForm.className = 'form';

	const adminTitle = document.createElement('h4');
	adminTitle.innerText = 'Add device';

	const chipInput = document.createElement('input');
	chipInput.setAttribute('placeholder', 'chip id');

	const submitButton = document.createElement('button');
	submitButton.innerText = 'Add';
	submitButton.id = 'submit-device';

	const newPasswordWrapper = document.createElement('div');
	newPasswordWrapper.id = 'new-password';

	const submitDevice = (event) => {
    event.preventDefault();

		if (chipInput.value) {
			socket.emit('addDevice', chipInput.value);
		} else {
			console.warn('Insert chip id');
		}
	};

	menu.add(adminButton, adminForm);

	socket.on('devicePassword', (newPassword) => {
		if (newPassword) {
			console.log('devicePassword: ', newPassword);
			newPasswordWrapper.innerText = 'Password: ' + newPassword;
		}
	});

	submitButton.addEventListener('click', submitDevice);
	adminForm.addEventListener('submit', submitDevice);

	adminForm.appendChild(adminTitle);
	adminForm.appendChild(chipInput);
	adminForm.appendChild(submitButton);
	adminForm.appendChild(newPasswordWrapper);
	document.body.insertBefore(adminForm, authForm);
}

const setAdmin = () => {
	buildAddDevice();
};

const submitLogin = (event) => {
  event.preventDefault();

	const email = inputEmail.value;
	const pass = inputPassword.value;

	if (email && pass) {
		socket.emit('login', { email, pass });
	} else {
		console.warn('Fill form');
	}
}

authForm.addEventListener('submit', submitLogin);
loginButton.addEventListener('click', submitLogin);
