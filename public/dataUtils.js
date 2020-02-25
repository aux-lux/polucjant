var dataUtils = {
	getLatestDataValue: function(data, name) {
		var now = (new Date()).getTime();
		var targetTime = now - chartDelay;

		for (var i=0;i<20;i++) {
			var iData = data[data.length - 1 - i];
			if (iData.time < targetTime) {
				if (i > 0) {
					var data2 = data[data.length - i];
					var timeDifference = data2.time - iData.time;
					var relNow = targetTime - iData.time;
					var proc = relNow / timeDifference;
					var iValue = iData[name];
					var value2 = data[data.length - i][name];
					var valueDif = value2 - iValue;
					return iValue + valueDif * proc;
				}
			}
		}
		return iData = data[data.length - 1][name];
	},
	filterData: function(data, start) {
		var now = (new Date()).getTime();
		var range = now - start;
		var spread = 30 * MINUTES;
		var tempData = [];
		var newData = [];
		var normalData = [];
		var lastTime = start;
		var tempElement = {};
		var index = 0;
		var breakpoint = Math.pow((index + 1) / displaySamples, 1 / power) * range + start;
		data.forEach(function (element) {
			if (element.time >= start) {
				
				if (element.time > breakpoint) {
					tempData.push(tempElement);
					while (element.time > breakpoint) {
						index ++;
						breakpoint = Math.pow((index + 1) / displaySamples, 1 / power) * range + start;
					}
					tempElement = {};
				}
				
				for (var key in element) {
					if (tempElement[key] === undefined) {
						tempElement[key] = { matches: 0, sum: 0 };
					}

					if (typeof element[key] === 'number') {
						tempElement[key].matches ++;
						tempElement[key].sum += element[key];
					}
				}
			}
		});

		tempData.forEach(function (element) {
			for (var key in element) {
				if (key !== 'matches') {
					const ra = key === 'time' ? 1 : 100;
					
					element[key] = Math.round(element[key].sum / element[key].matches * ra) / ra;
				}
			}
			newData.push(element);
		});
		return newData;
	},
	smoothData: function (data, range) {
		var newData = [];
		var wideRange = range * 2 + 1;
		data.forEach(function (element, index) {
			var newElement = { time: element.time };
			for (var key in element) {
				var powerSum = 0;
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
					newElement[key] = Math.round(newElement[key] / powerSum * 100) / 100;
				}
			}
			newData.push(newElement);
		});
		return newData;
	}
};
