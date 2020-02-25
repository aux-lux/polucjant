local function connectToSocket ()
	local sk
	local active = true
	local pinger = tmr.create()
	local blinkPin = 4
	local output = {}
	
	local function setupPing ()
		pinger:start()
	end
	
	local function send (str)
		if type(str)=="string" then
			sk:send(str)
		else
			print("Invalid string")
			print(str)
		end
	end
	
	local function doPing ()
		if send then
			send("ping")
			active = false
		else
			print("Disconnected")
			connectToSocket(readFromArduino)
			pinger:stop()
			active = true
		end
	end
	
	local function connect (port, address, onConnect, onData)
		sk = net.createConnection(net.TCP, 0)
		sk:connect(port, address)
        if doDebug then
            print("Connecting to socket...")
            gpio.write(blinkPin, gpio.LOW)
        end
		sk:on("receive", function(sck, string)
			if string == "pong" then
				active = true
			else
				ok, json = pcall(sjson.decode, string)
				if ok then
					if type(onData) == "lightfunction" or type(onData) == "function" then
						onData(json)
					end
				else
					print('Incorrect json string')
					print(string)
				end
			end
			
		end)
		sk:on("connection", function(sck,c)
            if doDebug then
                print('Connected to socket')
                gpio.write(blinkPin, gpio.HIGH)
            end
			setupPing()
			if type(onConnect) == "lightfunction" or type(onConnect) == "function" then
				onConnect(sk)
			end
		end)
		sk:on("disconnection", function(skc,c)
			print("Disconnected")
            pinger:stop()
            print("Reconnecting in 5 seconds")
            tmr.create():alarm(5000, tmr.ALARM_SINGLE, function()
                connect(port, address, onConnect, onReceive)
            end)
		end)
	end
	
	pinger:register(5000, 1, doPing)
	output.connect = connect
	output.send = send
	
	return output
end

return connectToSocket()
