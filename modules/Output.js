const colors = require('colors/safe');

const Output = function (data, setHandler) {
    let lastData;
    console.log(colors.yellow('new Output(' + data.name + ')'));
    /*
    setTimeout(() => {
        if(data.name === 'displayBrightness') {
            setHandler(2);
        } else if(data.name === 'displayValue') {
            setHandler('cafe');
        }
    }, 2000);
    */
    if (lastData) {
        setHandler(lastData);
    }

    setValue = (value) => {
        lastData = value;
        setHandler(value);
    }

    getUIData = () => {
		const output = JSON.parse(JSON.stringify(data));
		output.data = data;
        return output;
    };

	/*let localConnection = connection;
	function setValue (value) {
		if (localConnection) {
			data.value = value;
			const sendString = JSON.stringify({
				operation: 'set',
				id: data.id,
				value: value,
			});
			console.log('Sending: ', sendString);
			localConnection.sendUTF(sendString);
		} else {
			console.warn('Broken socket connection');
		}
	}

	function setConnection (newConnection) {
		localConnection = newConnection;
		setValue(data.value)
	}

	return {
		data: data,
		getId: function () {
			return data.id;
		},
		setValue: setValue,
		setConnection: setConnection,
	}
    */

    return {
        getUIData,
        setValue,
    };
};

module.exports = Output;
