const marginScale = 0.2;
var colors = {
	hour: '#bcf',
	min15: '#e3e3e3',
	min5: '#ebebeb',
	min1: '#f1f1f1',
};
const dividers = {
	pm25: 1,
	temp: 1,
	humi: 1,
	humi2: 1,
	pres: 1,
};
const horizontals = {
	pm25: [25,50,75,100,125,150,175,200,225,250,275,300,325,350,375,400,425,450,475,500,525,550,575,600,625,650,675,700],
	temp: [-25,-20,-15,-10,-5,{v:0,c:0},5,10,15,20,25,30,35,40,45,50,55,60],
	humi: [0,10,20,30,40,50,60,70,80,90,100],
	humi2: [0,2,4,6,8,10,12,14,16],
	pres: [950,955,960,965,970,975,980,985,990,995,1000,1005,1010,1015,1020,1025,1030,1035,1040,1045,1050],
};

const goodRanges = {
	co2: [400,1000],
	// tvoc: [0,25],
	pm25: [0,25],
	humi: [40,60],
};
const badRanges = {
	co2: [10000,100000],
	// tvoc: [0,25],
	pm25: [200,1000],
};
const units = {
	pm25: 'µg/m3',
	temp: '°C',
	humi: '%',
	humi2: 'g/m3',
	pres: 'hPa',
	co2: 'ppm',
	// tvoc: 'ppb',
};
let status = {};

if (localStorage.getItem('status')) {
	status = JSON.parse(localStorage.getItem('status'));
}

const Chart = function (chartSet) {
	var chart = {
		set: chartSet,
		status: {},
		labels: {},
		$chartWrapper: document.createElement('div'),
		$labelsWrapper: document.createElement('div'),
		$chartTitle: document.createElement('h2'),
		$axisLabels: document.createElement('div'),
		$timeLabels: document.createElement('div'),
		buildChart: function() {
			var name = chartSet.attr;
			chart.name = name;
			chart.$canvas = document.createElement('canvas');
			chart.$chartWrapper.className = 'chart-wrapper';
			var ctx = chart.$canvas.getContext('2d');
			chart.$canvas.width = ctx.width = chartSize.width;
			chart.$canvas.height = ctx.height = chartSize.height;

			chart.$chartWrapper.className = 'chart-wrapper';
			chart.$chartTitle.innerText = chartSet.name;
			chart.$chartWrapper.appendChild(chart.$chartTitle);
			chart.$labelsWrapper.className = 'labels-wrapper';
			chart.$chartWrapper.appendChild(chart.$labelsWrapper);
			chart.$chartWrapper.appendChild(chart.$canvas);

			if (!status[chart.name]) {
				status[chart.name] = {};

				chartSet.values.forEach(function (value, index) {
					var id = value.device;
					status[chart.name][id] = true;
					localStorage.setItem('status', JSON.stringify(status));
				});
			}

			chart.drawChart();
			chart.makeLabels();

			reactor.addEventListener('device', chart.drawChart);
			setInterval(chart.chartUpdate, 500);
			reactor.addEventListener('data', chart.drawChart);
		},
		chartUpdate: function () {
			//console.log('update chart');
			chart.drawChart();
			for (var id in chart.labels) {
				chart.labels[id].updateValue();
			}
		},
		checkHighestValue: function() {
			var name = chartSet.attr;
			var higher;
			chartSet.values.forEach(function (value, index) {
				var device = devices.list[value.device];
				if (device && device[dataSource]) {
					var data = device[dataSource];
					var lastData = data[data.length - 1];
					if (lastData[name]) {
						if (higher === undefined) {
							higher = lastData[name];
						} else {
							higher = Math.max(lastData[name], higher);
						}
					}
				}
			});

			return higher;
		},
		makeLabels: function () {
			var name = chartSet.attr;
			chartSet.values.forEach(function (value, index) {
				var id = value.device;
				chart.$axisLabels.className = 'axis-labels';
				chart.$chartWrapper.appendChild(chart.$axisLabels);
				chart.$timeLabels.className = 'time-labels';
				chart.$chartWrapper.appendChild(chart.$timeLabels);
				var $label = document.createElement('div');
				if (status[chart.name][id]) {
					$label.className = 'chart-label';
				} else {
					$label.className = 'chart-label disabled';
				}
				$label.style.background = chartColors[index];
				chart.$labelsWrapper.appendChild($label);

				var label = {
					$element: $label,
					id: id,
					updateValue: function () {
						var labelName = '<div class="device-id">' + id + '</div><span class="label-name">' + value.name + '</span>';
						var device = devices.list[id];
						if (device && device[dataSource]) {
							var extremes = chart.getExtremes();
							var min = extremes.min;
							var max = extremes.max;
							var spread = (max - min);
							var data = device[dataSource];
							var lastData = data[data.length - 1];
							var prelastData = data[data.length - 2];
							var targetValue = dataUtils.getLatestDataValue(data, name);
							//$label.className = 'chart-label higher';
							var py = 1 - (targetValue - min) / spread;
							$label.innerHTML = labelName + Math.round(targetValue / dividers[name]*100)/100 + units[name];
						}
					}
				};
				chart.labels[id] = label;
				label.updateValue();
				$label.addEventListener('click', (e) => {
					status[chart.name][id] = !status[chart.name][id];
					$label.classList.toggle('disabled', !status[chart.name][id]);
					localStorage.setItem('status', JSON.stringify(status));
					chart.drawChart();
				});
			});
		},
		getStart: function() {
			var now = (new Date()).getTime();
			var start;
			chartSet.values.forEach(function (value) {
				var device = devices.list[value.device];
				if (device && device[dataSource]) {
					if (start === undefined) {
						start = device[dataSource][0].time;
					} else {
						start = Math.min(start, device[dataSource][0].time);
					}
				}
			});
			return Math.max(start, now - distance);
		},
		getExtremes: function() {
			var name = chartSet.attr;
			var min;
			var max;

			chartSet.values.forEach(function (value, index) {
				var deviceId = value.device;
				var device = devices.list[deviceId];

				if (device && device[dataSource]) {
					device[dataSource].forEach(function (element) {
						//console.log('ena: ', element[name]);
						if (element[name]) {
							if (min === undefined || max === undefined) {
								min = element[name];
								max = element[name];
							} else {
								min = Math.min(min, element[name]);
								max = Math.max(max, element[name]);
							}
						}
					});
				}
			});
			/*
			if (name === 'temp') {
				min = Math.min(min, 0);
				max = Math.max(max, 0);
			}
			*/
			if (name === 'humi2') {
				min = 0;
			}
			const vrange = max - min;
			const margin = vrange * marginScale;
			const output =  {min: min - margin, max: max + margin, margin: margin };

			if (name === 'pm25' || name === 'humi') {
				//output.min = Math.max(output.min, 0);
				output.min = 0;
				output.margin = 0;
			}
			if (name === 'humi2') {
				output.min = 0;
			}
			if (name === 'pm25') {
				output.max = Math.max(27.5, output.max);
				output.margin = 0;
			}
			if (name === 'co2') {
				output.min = 400;
			}
			if (name === 'humi') {
				output.max = 100 * dividers.humi;
			}
			return output;
		},
		addAxisLabel: function(py, number, name) {
			var $label = document.createElement('div');
			$label.className = 'axis-label';
			$label.style.top = `${py}px`;
			$label.innerHTML = `${number}<span class="units">${units[name]}</span>`;
			
			chart.$axisLabels.appendChild($label);
		},
		addTimeLabel: function(px, number) {
			var $label = document.createElement('div');
			$label.className = 'time-label';
			$label.style.left = `${px}px`;
			$label.innerText = `${number}:00`;
			
			chart.$timeLabels.appendChild($label);
		},
		drawLines: function(now, start, extremes, spread, range) {
			var atm = new Date();
			var min = extremes.min;
			var max = extremes.max;
			//console.log('draw lines: ', now, start, min, max, spread, range);
			var name = chartSet.attr;
			var ctx = chart.$canvas.getContext('2d');
			// drawing vertical lines
			ctx.clearRect(0, 0, chartSize.width, chartSize.height);

			/* chart delay line
			var cdx = Math.pow(((now - start - chartDelay) / range), power);
			ctx.beginPath();
			ctx.strokeStyle = 'red';
			ctx.moveTo(Math.round(cdx * chartSize.width) - 0.5, 0);
			ctx.lineTo(Math.round(cdx * chartSize.width) - 0.5, chartSize.height);
			ctx.stroke();
			*/

			var nextFullHour = Math.ceil(now / HOURS) * HOURS;
			var markersShift = nextFullHour - now;
			
			chart.$axisLabels.innerText = '';
			chart.$timeLabels.innerText = '';
			//console.log(now, start, markersShift, now-start);
			var toMinutes = 60;
			for(var i=0;i<toMinutes; i++) {
				var marker = i * MINUTES;
				var dif = (now - start - marker + markersShift);

				if (dif >= 0) {
					var px = Math.pow((dif / range), power);
					//console.log(i, px);
					if (px >= 0 && px <= 1) {
						ctx.beginPath();
						if (i%15 === 0 && i > 0) {
							ctx.strokeStyle = colors.min15;
						} else if (i%5 === 0 && i > 0) {
							ctx.strokeStyle = colors.min5;
						} else {
							ctx.strokeStyle = colors.min1;
						}
						ctx.moveTo(Math.round(px * chartSize.width) - 0.5, 0);
						ctx.lineTo(Math.round(px * chartSize.width) - 0.5, chartSize.height);
						ctx.stroke();
					}
				}
			}
			var toHoursPart = 8;
			var toHours = 14;
			for(var i=12;i<12*toHours; i++) {
				var marker = i * MINUTES * 5;
				var dif = (now - start - marker + markersShift);
				if (dif >= 0) {
					var px = Math.pow((dif / range), power);

					if (px >= 0 && px <= 1) {
						ctx.beginPath();
						if (i%12 === 0) {
							ctx.strokeStyle = colors.hour;
						} else if (i%3 === 0) {
							ctx.strokeStyle = colors.min15;
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
			}
			var toDay = 24;
			for(var i=toHours;i<toDay; i++) {
				var marker = i * HOURS;
				var dif = (now - start - marker + markersShift);

				if (dif >= 0) {
					var px = Math.pow((dif / range), power);

					if (px >= 0 && px <= 1) {
						ctx.beginPath();
						ctx.strokeStyle = colors.hour;
						ctx.moveTo(Math.round(px * chartSize.width) - 0.5, 0);
						ctx.lineTo(Math.round(px * chartSize.width) - 0.5, chartSize.height);
						ctx.stroke();
					}
				}
			}

			var nowHour = (new Date()).getHours();
			var lastPx;
			for(var i=0;i<24; i++) {
				var marker = i * HOURS;
				var dif = (now - start - marker + markersShift);
				if (dif >= 0) {
					var px = Math.pow((dif / range), power);
					var tooTight = lastPx > 0 && Math.abs(lastPx - px) * chartSize.width < 50;
					if (px >= 0 && px <= 1 && !tooTight) {
						var hour = (nowHour - i + 25) % 24;
						chart.addTimeLabel(px * chartSize.width, hour);
						lastPx = px;
					}
				}
			}
			
			if (horizontals[name] && horizontals[name].length) {
				horizontals[name].forEach(function (horizontal) {

					var value;
					var specials = [colors.hour];
					if (typeof horizontal === 'number') {
						value = horizontal;
						color = colors.min5;
					} else {
						value = horizontal.v;
						color = specials[horizontal.c];
					}
					
					var py = 1 - (value * dividers[name] - min) / spread;
					if (name === 'temp') {
						// console.log(py, value);
					}
					if (py >= 0 && py <= 1) {
						ctx.beginPath();
						ctx.strokeStyle = color;
						ctx.moveTo(0, Math.round(py * chartSize.height) + 0.5);
						ctx.lineTo(chartSize.width, Math.round(py * chartSize.height) + 0.5);
						ctx.stroke();
						
						chart.addAxisLabel(py * chartSize.height, value, name);
					}
				});
			}

			if (chart.set.attr === 'pm25' && window.norm > 0) {
				var py = 1 - (window.norm * dividers[name] - min) / spread;
				ctx.beginPath();
				console.log('draw norm: ', py);
				ctx.strokeStyle = 'red';
				var px = Math.pow((firstTime - start) / range, power);
				// console.log({firstTime});
				// console.log('px: ', px);
				ctx.moveTo(px * chartSize.width, Math.round(py * chartSize.height) + 0.5);
				ctx.lineTo(chartSize.width, Math.round(py * chartSize.height) + 0.5);
				ctx.stroke();
				// console.log('py', py);
			}
			// console.log(chart.set.attr === 'pm25', window.norm);

			// drawing horizontal lines;
			
			
			if (goodRanges[name] && goodRanges[name].length) {
				var py0 = (max - goodRanges[name][0] * dividers[name]) / spread;
				var py1 = (max - goodRanges[name][1] * dividers[name]) / spread;
				
				// if (py0 >= 0 && py0 <= 1 && py1 >= 0 && py1 <= 1) {
					var pyMin = Math.min(py0, py1);
					var pyDif = Math.max(py0, py1) - pyMin;
					var greenPattern = ctx.createPattern(greenImage, "repeat");
					ctx.fillStyle = greenPattern;
					ctx.fillRect(0, pyMin * chartSize.height, chartSize.width, pyDif * chartSize.height);
				// }
			}

			if (badRanges[name] && badRanges[name].length) {
				var py0 = (max - badRanges[name][0] * dividers[name]) / spread;
				var py1 = (max - badRanges[name][1] * dividers[name]) / spread;
				
				// if (py0 >= 0 && py0 <= 1 && py1 >= 0 && py1 <= 1) {
					var pyMin = Math.min(py0, py1);
					var pyDif = Math.max(py0, py1) - pyMin;
					var greenPattern = ctx.createPattern(redImage, "repeat");
					ctx.fillStyle = greenPattern;
					ctx.fillRect(0, pyMin * chartSize.height, chartSize.width, pyDif * chartSize.height);
				// }
			}
		},
		drawChart: function() {
			var name = chartSet.attr;
			var ctx = chart.$canvas.getContext('2d');
			var now = (new Date()).getTime();
			var start = chart.getStart();
			var range = now - start - chartDelay;
			var extremes = chart.getExtremes();
			var min = extremes.min;
			var max = extremes.max;
			var spread = (max - min);

			//console.log(name, extremes);

			ctx.clearRect(0, 0, chartSize.width, chartSize.height);

			chart.drawLines(now, start, extremes, spread, range);
			
			// console.log('chartSet.values :', chartSet.values);

			chartSet.values.forEach(function (value, index) {
				var deviceId = value.device;
				var device = devices.list[deviceId];
				
				//console.log('devices: ', devices);
				// console.log('chart.name: ', chart.name);
				if (device && device[dataSource] && status[chart.name][deviceId]) {
					displayData = device[dataSource];
					ctx.beginPath();
					ctx.strokeStyle = chartColors[index];
					ctx.lineWidth = 1;
					var first = true;
					var pPx;
					var ppxmin = 99999;
					var ppxmax = 0;
					var lastTime = displayData[0].time;
					// console.log(device, displayData);
					displayData.forEach(function (element, index) {
						if (element[name] !== undefined) {
							const timeDif =element.time - lastTime;
							const timeTolerance = 1000*60;
							if (element[name] === 'null' || element.time - lastTime > 1 * HOURS) {
								first = true;
							} else {
								var elementValue = element[name];
								var py = 1 - (elementValue - min) / spread;
								var px = Math.pow((element.time - start) / range, power);

								if (first) {
									ctx.moveTo(px * chartSize.width, py * chartSize.height);
									// console.log(name, px * chartSize.width, py * chartSize.height);
									first = false;
								} else {
									ctx.lineTo(px * chartSize.width, py * chartSize.height);
									/* DEBUG LINES
									if (index === 1) {
										ctx.moveTo(Math.round(px * chartSize.width) + 0.5, 0);
										ctx.lineTo(Math.round(px * chartSize.width) + 0.5, 10);
										ctx.moveTo(px * chartSize.width, py * chartSize.height);
									}
									*/
								}
								pPx = px;
							}
							lastTime = element.time;
						}
					});
					//console.log('spcs:', ppxmin*100, ppxmax*100);
					ctx.stroke();
					//chart.data[deviceId] = device[id];
				}
			});
		}
	}

	return chart;
};
