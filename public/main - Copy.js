var SECONDS = 1000,
		MINUTES = 60 * SECONDS,
		HOURS = 60 * MINUTES,
		DAYS = 24 * HOURS;

var chartDelay = 10 * SECONDS;
var distance = 18 * HOURS;
// distance = 1 * HOURS;
var power = 3;
var $devices = document.getElementById('devices');
//console.log($devices);
var socket = io();

socket.on('init', (initialData) => {
	for(var id in initialData) {
		devices.add(id, initialData[id]);
	}
});

socket.on('data', (newData) => {
	for(var id in newData) {
		devices.list[id].pushData(newData[id]);
	}
});

socket.on('device', (newDevice) => {
	devices.add(parseInt(newDevice.id, 10), newDevice.data);
});

var chartSize = {
	width: 1600,
	height: 200,
};
var colors = {
	hour: '#bcf',
	min5: '#e5e5e5',
	min1: '#f1f1f1',
};
var chartColors = [
	'#6a1',
	'#c72',
	'#27d',
	'#e4d',
	'#ec4',
	'#e44'
];
var horizontals = {
	pm25: [25,50,75,100,125,150,175,200,225,250,275,300]
};

var groups = [
	[961920,3312496]
];

var devices = {
	list: {},

	drawDevice: function (device) {
		var $title = document.createElement('h4');
		$title.innerText = device.id;
		device.$wrapper = document.createElement('div');
		device.$wrapper.className = 'device-wrapper';

		device.$wrapper.appendChild($title);
		$devices.appendChild(device.$wrapper);
	},
	add: function(id, initialData) {
		var device = {
			id: id,
			data: initialData.data || [],
			charts: {},
			makeChart: function (name) {
				device.charts[name] = document.createElement('canvas');
				$devices.appendChild(device.charts[name]);
				var ctx = device.charts[name].getContext('2d');
				device.charts[name].width = ctx.width = chartSize.width;
				device.charts[name].height = ctx.height = chartSize.height;
				device.drawChart(name);
				setInterval(function () {
					// var t0 = performance.now();
					device.drawChart(name)
					// console.log('Draw speed:', performance.now() - t0, 'ms');
				}, 1000);
			},
			drawChart: function(name) {
				device.filteredData = device.filterData(device.data);
				device.smoothedData = device.smoothData(device.filteredData, 7);
				var displayData = device.smoothedData;
				if (displayData && displayData.length) {
					var now = (new Date()).getTime();
					var start = Math.max(displayData[0].time, now - distance);
					var range = now - start - chartDelay;
					var ctx = device.charts[name].getContext('2d');
					ctx.lineWidth = 1;
					var min;
					var max;

					// geting extremes
					displayData.forEach(function (element) {
						if (element[name] && element[name] !== 'null') {
							if (min === undefined || max === undefined) {
								min = element[name];
								max = element[name];
							} else {
								min = Math.min(element[name], min);
								max = Math.max(element[name], max);
							}
						}
					});

					if (name === 'pm25') {
						min = 0;
						max = Math.max(max, 26);
					}

					var spread = (max - min) * 1.1;

					// drawing vertical lines
					ctx.clearRect(0, 0, chartSize.width, chartSize.height);
					var toMinutes = 60;
					for(var i=0;i<toMinutes; i++) {
						var marker = i * MINUTES;
						var px = Math.pow(((now - start - marker) / range), power);
						//console.log(i, px);
						if (px >= 0 && px <= 1) {
							ctx.beginPath();
							if (i%5 === 0 && i > 0) {
								ctx.strokeStyle = colors.min5;
							} else {
								ctx.strokeStyle = colors.min1;
							}
							ctx.moveTo(Math.round(px * chartSize.width) - 0.5, 0);
							ctx.lineTo(Math.round(px * chartSize.width) - 0.5, chartSize.height);
							ctx.stroke();
						}
					}
					var toHoursPart = 8;
					var toHours = 14;
					for(var i=12;i<12*toHours; i++) {
						var marker = i * MINUTES * 5;
						var px = Math.pow(((now - start - marker) / range), power);
						//console.log(i, px);
						if (px >= 0 && px <= 1) {
							ctx.beginPath();
							if (i%12 === 0) {
								ctx.strokeStyle = colors.hour;
							} else {
								ctx.strokeStyle = colors.min5;
							}

							if (i < 12*toHoursPart || i % 3 === 0) {
								ctx.moveTo(Math.round(px * chartSize.width) - 0.5, 0);
								ctx.lineTo(Math.round(px * chartSize.width) - 0.5, chartSize.height);
								ctx.stroke();
							}
						}
					}
					var toDay = 24;
					for(var i=toHours;i<toDay; i++) {
						var marker = i * HOURS;
						var px = Math.pow(((now - start - marker) / range), power);
						if (px >= 0 && px <= 1) {
							ctx.beginPath();
							ctx.strokeStyle = colors.hour;
							ctx.moveTo(Math.round(px * chartSize.width) - 0.5, 0);
							ctx.lineTo(Math.round(px * chartSize.width) - 0.5, chartSize.height);
							ctx.stroke();
						}
					}

					// drawing horizontal lines;
					horizontals[name].forEach(function (horizontal) {
						var py = 1 - horizontal / spread;
						if (py >= 0 && py <= 1) {
							ctx.beginPath();
							ctx.strokeStyle = colors.min5;
							ctx.moveTo(0, Math.round(py * chartSize.height) + 0.5);
							ctx.lineTo(chartSize.width, Math.round(py * chartSize.height) + 0.5);
							ctx.stroke();
						}
					});

					// draw chart paths
					ctx.beginPath();
					ctx.strokeStyle = '#fff';
					ctx.lineWidth = 4;
					var first = true;
					displayData.forEach(function (element) {
						if (element[name]) {
							if (element[name] === 'null') {
								first = true;
							} else {
								var value = element[name];
								var py = 1 - value / spread;
								var px = Math.pow((element.time - start) / range, power);
								if (first) {
									ctx.moveTo(Math.round(px * chartSize.width), py * chartSize.height);
									first = false;
								} else {
									ctx.lineTo(Math.round(px * chartSize.width), py * chartSize.height);
								}
							}
						}
					});
					ctx.stroke();

					//drawing front
					ctx.beginPath();
					ctx.strokeStyle = chartColors[0];
					ctx.lineWidth = 1;
					var first = true;
					displayData.forEach(function (element) {
						if (element[name]) {
							if (element[name] === 'null') {
								first = true;
							} else {
								var value = element[name];
								var py = 1 - value / spread;
								var px = Math.pow((element.time - start) / range, power);
								if (first) {
									ctx.moveTo(Math.round(px * chartSize.width), py * chartSize.height);
									first = false;
								} else {
									ctx.lineTo(Math.round(px * chartSize.width), py * chartSize.height);
								}
							}
						}
					});
					ctx.stroke();
				}
			},
			smoothData: function (data, range) {
				var newData = [];
				var wideRange = range * 2 + 1;
				data.forEach(function (element, index) {
					var newElement = { time: element.time };
					var powerSum = 0;
					for (var key in element) {
						if (key !== 'time') {
							if (newElement[key] === undefined) {
								newElement[key] = 0;
							}
							for (var i=0; i < wideRange; i++) {
								if (data[index + i - range] !== undefined) {
									var power = Math.sin(i / wideRange * Math.PI);
									powerSum += power;
									newElement[key] += data[index + i - range][key] * power;
								}
							}
							if (key === 'pm25') {
								newElement[key] = Math.round(newElement[key] / powerSum * 100) / 100;
							} else {
								newElement[key] = Math.round(newElement[key] / powerSum);
							}
						}
					}
					newData.push(newElement);
				});

				return newData;
			},
			filterData: function (data) {
				var now = (new Date()).getTime();
				var start = Math.max(data[0].time, now - distance);
				var range = now - start;
				var spread = 1 * MINUTES;
				var tempData = [];
				var newData = [];
				var normalData = [];
				var lastTime = start;
				var tempElement = { matches: 0 };
				// compact data
				data.forEach(function (element) {
					if (element.time >= start) {
						var chunkSize = (1 - Math.pow((element.time - start) / range, power)) * spread;
						if (element.time < lastTime + chunkSize) {
							if (tempElement.matches === 0) {
								tempElement.matches = 1;
								for (var key in element) {
									tempElement[key] = element[key];
								}
							} else {
								tempElement.matches ++;
								for (var key in element) {
									tempElement[key] += element[key];
								}
							}
						} else {
							lastTime = element.time;
							tempData.push(tempElement);
							tempElement = { matches: 1};
							for (var key in element) {
								tempElement[key] = element[key];
							}
						}
					}
				});

				// reduce data;
				tempData.forEach(function (element) {
					for (var key in element) {
						if (key !== 'matches') {
							if (key === 'pm25') {
								element[key] = Math.round(element[key] / element.matches * 100) / 100;
							} else {
								element[key] = Math.round(element[key] / element.matches);
							}
						}
					}
					delete element.matches;
					//console.log('element', element);
					newData.push(element);
				});
				//newData = newData.concat(normalData);
				//console.log(tempData);
				return newData;
			},
			pushData: function (newData) {
				//console.log(device.id, ' add: ', newData)
				device.data = device.data.concat(newData);
				//devices.filteredData = device.data;
				//device.filterData();
				//devices.filteredData = device.filterData();
				//console.log(device.id,device.data.length,devices.filteredData.length);
			},
		};
		devices.list[id] = device;
		devices.drawDevice(device);
		device.makeChart('pm25');
	}
};
