local active = true
local pinger = tmr.create()
local blinkPin = 4
pinger:register(5000, 1, doPing)

local function setupPing ()
    pinger:start()
end

local function connectToSocket (port, address, onConnect, onReceive)
    local sk=net.createConnection(net.TCP, 0)
    sk:connect(port, address)
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
        setupPing()
        if type(onConnect) == "lightfunction" or type(onConnect) == "function" then
            onConnect(sk)
        end
    end)
    sk:on("disconnection", function(skc,c)
        print("Disconnected")
        connectToSocket()
    end)
end

return connectToSocket