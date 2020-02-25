RECONNECTION_TIME = 5000

function wsLite (settings)
    local ws = websocket.createClient()
    local websocketAddress = ("ws://%s:%s"):format(settings.address, settings.port)
    print(websocketAddress)
    print('Websocket connecting ...')

    ws:on("connection", function(ws)
        print('Websocket connected')
		local callback = settings.onConnect
		if type(callback) == "lightfunction" or type(callback) == "function" then
			callback()
		end
    end)

    ws:on("receive", function(_, msg, opcode)
        if opcode == 1 then            
			local callback = settings.onData
			if type(callback) == "lightfunction" or type(callback) == "function" then
				callback(msg)
			end
        end
    end)

    ws:on("close", function(_, status)
        print('Websocket disconnected')
        tmr.create():alarm(RECONNECTION_TIME, tmr.ALARM_SINGLE, function()
            reconnect()
        end)
    end)

    function reconnect ()
        queryQueue = {}
        queueRunning = false
        ws:connect(websocketAddress)
    end

    ws:connect(websocketAddress)
end

return wsLite