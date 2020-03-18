const SECONDS = 1000;
const	MINUTES = 60 * SECONDS;
const	HOURS = 60 * MINUTES;
const	DAYS = 24 * HOURS;

const reactor = new Reactor();
reactor.registerEvent('data');
reactor.registerEvent('device');

// const audio = new Audio('notif.mp3');

var chartSets = [
	{
		name: 'Pollution',
		attr: 'pm25',
		values: []
	},
	/*
	{
		name: 'Temperature',
		attr: 'temp',
		values: []
	},
	{
		name: 'Humidity',
		attr: 'humi',
		values: []
	},
	{
		name: 'Absolute humidity',
		attr: 'humi2',
		values: []
	},
	{
		name: 'Pressure',
		attr: 'pres',
		values: []
	},
	*/
	// {
	// 	name: 'Tvoc',
	// 	attr: 'tvoc',
	// 	values: []
	// },
];

var chartDelay = 10 * SECONDS;
var distance = 24 * HOURS;
var displaySamples = 1000;
var margin = 1.1;
// distance = 1 * HOURS;
var power = 4;
var smoothValue = 10;
//console.log($devices);
socket.on('reconnect', () => {
	// location.reload();
});
socket.on('init', (initialData) => {
	console.log('initialData: ', initialData);
	for(var id in initialData) {
		var intId = parseInt(id, 10);
		var data = initialData[id].data.sort((a, b) => (a.time - b.time));
		var meta = initialData[id].meta;
		// console.log('initialData[id]: ', initialData[id]);
		// console.log('meta: ', meta, data);

		if (data && data.length) {
			devices.add(intId, data, meta);
			reactor.dispatchEvent('device', {
				id: intId,
				data: data,
			});

			chartSets.forEach((set) => {
				set.values.push({
					device: id,
					name: meta ? meta.name : id,
				});
			});
		}
	}

	charts.buildCharts();
});
/*
socket.on('auth', (response) => {
	if (response.success) {
		connectForm.style.display = 'block';
		charts.buildCharts();
	}
});
*/

socket.on('data', (newData) => {
	for(var id in newData) {
		var intId = parseInt(id, 10);
		//console.log(intId, newData[id].length);
		devices.list[intId].pushData(newData[id]);
		reactor.dispatchEvent('data', {
			id: intId,
			data: newData[id]
		});
	}	
});

const trackId = parseInt(localStorage.getItem('track'), 10);
const localVelocityRange = 15;
let currentTrackData;
let firstTime;

const getNorm = (data) => {
	const dataRange = 1500;
	const dataClone = [...data];
	firstTime = data[data.length - dataRange].time;
	currentTrackData = [...data].splice(dataClone.length - localVelocityRange).map(el => parseInt(el.pm25, 10));
	//console.log({dataClone});
	const recentData = dataClone.splice(dataClone.length - dataRange, dataRange).map(el => parseInt(el.pm25, 10)).sort((a,b) => a < b);
	recentData.splice(dataRange - 200, 200);
	recentData.splice(0,800);
	const len = recentData.length;

	const avg = recentData.reduce((a,b) => {
		return a + b;
	});

	// console.log('norm:' , avg /)

	return avg / len;
};

let workingNotifications = false;

if (Notification.permission === "granted") {
	workingNotifications = true;
} else if (Notification.permission !== "denied") {
	Notification.requestPermission().then(function (permission) {
		if (permission === "granted") {
			workingNotifications = true;
		}
	});
}


reactor.addEventListener('device', (data) => {
	if (data.id === trackId) {
		console.log('Device: ', {trackId}, {data});
		window.norm = getNorm(data.data);
	}
});

const STATE_OK = 0;
const STATE_RISING = 1;
const STATE_ALERT = 2;
const STATE_FALLING = 3;

const states = ['ok','rising','alert','falling'];
const sounds = [
	new Audio('ok.mp3'),
	new Audio('alert.mp3'),
	new Audio('rising.mp3'),
	new Audio('falling.mp3'),
];

sounds.forEach((sound) => {
	sound.volume = 0.2;
});

let currentState = STATE_OK;

const changeState = (state) => {
	const messages = [
		'It\'s fine now',
		'Warning, may be bad',
		'ALERT! Close the windows',
		'Soon should be ok',
	];
	document.querySelector('#status').className = states[state];
	var n = new Notification(messages[state]);
	const now = new Date();
	const strTime = `${now.getHours()}:${('0' + now.getMinutes()).slice(-2)}:${('0' + now.getSeconds()).slice(-2)}`;
	console.log(strTime, messages[state]);
	sounds[state].play();
};

let recentReadings;
const ALERT_LEVEL = 8;
const WARNING_LEVEL = 4;

reactor.addEventListener('data', (data) => {
	// console.log('data: ', data);
	if (data.id === trackId) {
		const newData = [...data.data].map(el => parseInt(el.pm25, 10));
		currentTrackData = currentTrackData.concat(newData);
		currentTrackData.splice(0, currentTrackData.length - localVelocityRange);
		const min = Math.min(...currentTrackData);
		const max = Math.max(...currentTrackData);
		const rising = currentTrackData.indexOf(min) < currentTrackData.indexOf(max);
		const velocity = Math.abs(min-max);
		const outOfNorm = Math.round(Math.max(0, max - norm));

		let newState;
		if (outOfNorm > ALERT_LEVEL) {
			newState = STATE_ALERT;
		} else if (outOfNorm > WARNING_LEVEL) {
			if (rising) {
				newState = STATE_RISING;
			} else {
				newState = STATE_FALLING;
			}
		} else {
			newState = STATE_OK;
		}

		if (currentState !== newState) {
			currentState = newState;
			changeState(newState);
		}
		recentReadings = `N: ${Math.round(norm)} [${min}, ${max}] R: ${rising?'↑':'↓'}, V: ${velocity}, O: ${outOfNorm}`;
		if (newState > 0) {
			console.log(recentReadings);
		}
	}
});

socket.on('device', (newDevice) => {
	console.log('on device');
	var intId = parseInt(newDevice.id, 10);
	reactor.dispatchEvent('device', {
		id: intId,
		data: newDevice.data,
	});
	devices.add(intId, newDevice.data);
});

var chartSize = {
	width: 700,
	height: 200,
};
var chartColors = [
	'#6a1',
	'#c72',
	'#27d',
	'#c5b',
	'#ec4',
	'#e44'
];



// chartSets = [];

var dataSource = 'smoothedData';
var charts = {
	list: {},
	buildCharts: function() {
		var $chartsWrapper = document.getElementById('charts');
		chartSets.forEach(function (chartSet) {
			var chart = (new Chart(chartSet));
			chart.buildChart();
			$chartsWrapper.appendChild(chart.$chartWrapper);
		});
	},
};
var greenImage = new Image();
greenImage.src = 'img/green.png';

var redImage = new Image();
redImage.src = 'img/red.png';

const createDeviceForm = (id, name) => {
	const form = document.createElement('form');
	form.className = 'device';

	const formName = document.createElement('input');
	formName.type = 'text';
	formName.placeholder = name ? name : id;

	const formButton = document.createElement('button');
	formButton.type = 'submit';
	formButton.innerText = 'Save';

	form.appendChild(formName);
	form.appendChild(formButton);

	form.addEventListener('submit', (e) => {
		e.preventDefault();
		const name = formName.value;
		formName.placeholder = name;
		formName.value = '';

		chartSets.forEach((set) => {
			set.values.forEach((element) => {
				if (parseInt(element.device, 10) === id) {
					element.name = name;
				}
			});
		});
		socket.emit('rename', {
			id,
			name,
		});
	});

	return form;
};

const calculateAbsoluteHumidity = (data) => {
	data.forEach((item, index) => {
		const t = item.temp / dividers.temp;
		const h = item.humi / dividers.humi;
		const temp = Math.pow(2.718281828, (17.67 * t) / (t + 243.5));
		data[index].humi2 = (6.112 * temp * h * 2.1674) / (273.15 + t);
	});
}

var devices = {
	list: {},

	drawDevice: function (device) {
		var $title = document.createElement('h4');
		$title.innerText = device.id;
		device.$wrapper = document.createElement('div');
		device.$wrapper.className = 'device-wrapper';
		device.$wrapper.appendChild($title);
	},
	add: function(id, initialData, meta) {
		console.log('add device', id, initialData);
		const form = createDeviceForm(id, meta ? meta.name : id);
		devicesList.appendChild(form);

		var device = {
			id: id,
			data: initialData || [],
			charts: {},
			pushData: function (newData) {
				var now = (new Date()).getTime();
				device.data = device.data.concat(newData);
				var start = Math.max(device.data[0].time, now - distance);
				device.filteredData = dataUtils.filterData(device.data, start);
				device.smoothedData = dataUtils.smoothData(device.filteredData, smoothValue);
				calculateAbsoluteHumidity(device.smoothedData);

				if (id === trackId) {
					window.norm = getNorm(device.data);
				}
			},
		};
		
		//console.log('device: ', device);
		devices.list[id] = device;
		var now = (new Date()).getTime();
		var start = Math.max(device.data[0].time, now - distance);
		device.filteredData = dataUtils.filterData(device.data, start);
		device.smoothedData = dataUtils.smoothData(device.filteredData, smoothValue);
		calculateAbsoluteHumidity(device.smoothedData);
		// console.log(device.data);
	}
};

// charts.buildCharts();
