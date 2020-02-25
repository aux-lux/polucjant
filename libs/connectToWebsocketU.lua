local config = {
    headers = {
        ['user-agent']='NodeMCU',
        ['device-id']=node.chipid()
    }
}

if not RECONNECTION_TIME then
    RECONNECTION_TIME = 5000
end

function connectToWebsocket (settings)
    local sendTimer = tmr.create()
    local ws = websocket.createClient()
    local websocketAddress = ("ws://%s:%s"):format(settings.address, settings.port)
    local queryQueue = {}
    local queueRunning = false

    function generateRequestId ()
        return ("R%05d"):format(node.random(10000,99999))
    end

    ws:config(config)

    ws:on("connection", function(ws)
        sendTimer:register(50, tmr.ALARM_SINGLE, doQueue)
		local callback = settings.onConnect
		if type(callback) == "lightfunction" or type(callback) == "function" then
			callback()
		end
    end)

    function doQueue ()
        sendTimer:register(50, tmr.ALARM_SINGLE, doQueue)
        if not queueRunning then
            if table.getn(queryQueue) > 0 then
                queueRunning = true
                local ok, json = pcall(sjson.encode, queryQueue)
                if ok then
                    queryQueue = {}
                    ws:send(json)
                end
            else
                queueRunning = false
            end
        end
    end

    function sendConfirmation ()
        ws:send('1')
    end

    function sendMessage (sendObject)
        sendTimer:stop()
        table.insert(queryQueue, sendObject)
        sendTimer:start()
    end

    ws:on("receive", function(_, msg, opcode)
        if opcode == 2 and msg == "1" then
            queueRunning = false
            doQueue()
        elseif opcode == 1 then
            local ok, object = pcall(sjson.decode, msg)
            if ok then
                local callback = settings.onData
                if type(callback) == "lightfunction" or type(callback) == "function" then
                    callback(object)
                end
            end
        end
    end)

    ws:on("close", function(_, status)
        sendTimer:unregister()
        queryQueue = {}
        queueRunning = false
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

    return {
        send=sendMessage,
        confirm=sendConfirmation
    }
end

return connectToWebsocket
