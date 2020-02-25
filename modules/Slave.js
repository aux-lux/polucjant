const GETTER_TIMEOUT = 60 * 1000;

const colors = require('colors/safe');
const Output = require('./Output.js');
const Input = require('./Input.js');

const Slave = function (connection, id) {
    const _id = id;
    let _connection = connection;
    let _active = false;
    let _locked = false;
    const inputs = {};
    const outputs = {};

    let queueRunning = false;
    const queryQueue = [];
    const requestDataListeners = {};

    uintToString = (uintArray) => {
        var encodedString = String.fromCharCode.apply(null, uintArray),
            decodedString = decodeURIComponent(escape(atob(encodedString)));
        return decodedString;
    }

    updateConnection = (connection) => {
        console.log(colors.yellow(id + ' reconnected'));
        //console.log(id + 'update connection');
        _connection = connection;
        onConnect();
    }

    onConnect = () => {
        console.log(colors.yellow(id + ' connected'));
        _connection.on('message', onMessage);
        _connection.on('close', onClose);

        activate();
    }

    doQueue = () => {
        console.log('doQueue');
        if (!queueRunning && _active && !_locked && queryQueue.length) {
            queueRunning = true;
            const query = queryQueue.shift();
            console.log('lets do this', query)
            _connection.sendUTF(query);
        }
    }

    setDeviceData = (name) => {
        return function (value) {
            console.log(colors.yellow('setDeviceData'), value);
            const output = outputs[name];
            if (output) {
                const sendString = JSON.stringify({
    				operation: 'set',
    				name,
    				value,
    			});
                queryQueue.push(sendString);
                doQueue();
                //_connection.sendUTF(sendString);
            }
        }
    }

    getDeviceData = (name) => (requestId) =>
        new Promise(function(resolve, reject) {
            const input = inputs[name];
            if (input) {
                const sendString = JSON.stringify({
    				operation: 'get',
    				name,
                    requestId,
    			});
                _connection.sendUTF(sendString);
                requestDataListeners[requestId] = resolve;
                setTimeout(reject, GETTER_TIMEOUT);
            }
        });

    parseObject = (ob) => {
        if (ob.requestId) {
            var listener = requestDataListeners[ob.requestId];
            if (listener && typeof listener === 'function') {
                delete requestDataListeners[ob.requestId];
                ob.data.time = (new Date()).getTime();
                listener(ob);
            }
        } else if (ob.status !== undefined) {
            console.log(colors.blue(_id + ' ' + ob.status));
        } else {
            //console.log('ob: ', ob);
            if (ob.outputs && ob.outputs.length) {
                ob.outputs.forEach(function (outputData) {
                    const outputName = outputData.name;
                    outputs[outputName] = new Output(outputData, setDeviceData(outputName));
                });
            }

            if (ob.inputs && ob.inputs.length) {
                ob.inputs.forEach(function (inputData) {
                    const inputName = inputData.name;
                    inputs[inputName] = new Input(inputData, getDeviceData(inputName));
                });
            }
        }
    }

    onMessage = (message) => {
        console.log('on message', message);
        if (message.type === 'utf8' && (message.utf8Data === '1' || message.utf8Data === '[1]')) {
            //_connection.sendBytes(Buffer.alloc(1,49));
            console.log('response');
            queueRunning = false;
            doQueue();
        } else if (message.type === 'utf8') {
            _connection.sendBytes(Buffer.alloc(1,49));
            var ob = getJSON(message.utf8Data);
            if (ob) {
                //console.log('ob: ', ob);
                if (ob instanceof Array) {
                    ob.forEach((singleObject) => {
                        parseObject(singleObject);
                    })
                } else {
                    parseObject(ob);
                }
            }
        }
    };

    activate = () => {
        _active = true;
    };

    deactivate = () => {
        _active = false;
    };

    onClose = (connection) => {
        deactivate();
    };

    getUIData = () => {
        const toReturn = {
            inputs: {},
            outputs: {},
        };

        for(let name in inputs) {
            toReturn.inputs[name] = inputs[name].getUIData();
        };
        for(let name in outputs) {
            toReturn.outputs[name] = outputs[name].getUIData();
        };

        return toReturn;
    };

    getValue = (object) => {
        var input = inputs[object.name];
        if (input) {
            return input.getValue(object.requestId);
        }
    };

    setValue = (object) => {
        var output = outputs[object.name];
        if (output) {
            return output.setValue(object.value);
        }
    };

    onConnect();

    return {
        updateConnection,
        getUIData,
        getValue,
        setValue,
    };
}

module.exports = Slave;

/*
const connection = request.accept(null, request.origin);

connection.on('message', function(message) {
    if (message.type === 'utf8') {
        connection.sendBytes(Buffer.alloc(1,49));
        var ob = getJSON(message.utf8Data);
        if (ob) {
            console.log('ob : ', ob);
            if (ob.requestId) {
                //console.log(colors.blue('Response: ' + ob.name + ' (' + ob.id + ')'));
                let localInput = getInputById(ob.id);
                //console.log('localInput: ', localInput);
                localInput.resolveData(ob);
            } else if (ob.id) {
                if (ob.input && ob.input.length) {
                    for (let i = 0; i < ob.input.length; i++) {
                        let inp = ob.input[i];
                        let localInput = getInputById(inp.id);
                        if (localInput) {
                            console.log(colors.green('Update socket of: ' + inp.name + ' (' + inp.id + ')'));
                            //console.log('Update socket of: ', inp.id);
                            localInput.setConnection(connection);
                        } else {
                            console.log(colors.green('Create input: ' + inp.name + ' (' + inp.id + ')'));
                            //console.log('create input: ', inp.id);
                            inputs.push(new Input(inp, connection));
                        }
                    }
                }
                if (ob.output && ob.output.length) {
                    for (let i = 0; i < ob.output.length; i++) {
                        let outp = ob.output[i];
                        let localOutput = getOutputById(outp.id);
                        if (localOutput) {
                            //console.log('update socket to: ', outp.id);
                            console.log(colors.green('Update socket of: ' + outp.name + ' (' + outp.id + ')'));
                            localOutput.setConnection(connection);
                        } else {
                            //console.log('create output: ', outp.id);
                            console.log(colors.green('Create output: ' + outp.name + ' (' + outp.id + ')'));
                            outputs.push(new Output(outp, connection));
                        }
                    }
                }
            }
        }
    }
});

connection.on('close', function(connection) {
    console.log('User left');
    // close user connection
});
*/
