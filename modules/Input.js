const colors = require('colors/safe');

const Input = function (data, getHandler) {
	let lastData;

	console.log(colors.yellow('new Input(' + data.name + ')'));

	getValue = (requestId) => new Promise(function(resolve, reject) {
		getHandler(requestId).then((response) => {
			lastData = response.data;
			resolve(response);
		}, reject);
	});

	function setConnection (newConnection) {
		localConnection = newConnection;
	}

	function getUIData () {
		const output = JSON.parse(JSON.stringify(data));
		output.data = data;
        return output;
		/*
		return {
			...data,
			data: lastData,
		};*/
	}

	return {
		getUIData: getUIData,
		getValue: getValue,
		setConnection: setConnection,
	}
}

module.exports = Input;
