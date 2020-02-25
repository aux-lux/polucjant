local c = {headers={['user-agent']='NodeMCU',['device-id']=node.chipid()}}
if not r then r = 5000 end
function w (s)
    local t,ws,a,q,r=tmr.create(),websocket.createClient(),("ws://%s:%s"):format(s.address, s.port),{},false
    ws:config(c)
	ws:on("connection", function(ws)
        t:register(50, tmr.ALARM_SINGLE, d)
		local b = s.onConnect
		if type(b) == "lightfunction" or type(b) == "function" then
			b()
		end
    end)
    function d ()
        t:register(50, tmr.ALARM_SINGLE, d)
        if not r then
            if table.getn(q) > 0 then
                r = true
                local ok, json = pcall(sjson.encode, q)
                if ok then
                    q = {}
                    ws:send(json)
                end
            else
                r = false
            end
        end
    end

    function f ()
        ws:send('1')
    end

    function m (o)
        t:stop()
        table.insert(q, o)
        t:start()
    end

    ws:on("receive", function(_, msg, opcode)
        if opcode == 2 and msg == "1" then
            r = false
            d()
        elseif opcode == 1 then
            local ok, g = pcall(sjson.decode, msg)
            if ok then
                local f = s.onData
                if type(f) == "lightfunction" or type(f) == "function" then
                    f(g)
                end
            end
        end
    end)

    ws:on("close", function()
        t:unregister()
        q = {}
        r = false
        tmr.create():alarm(r, tmr.ALARM_SINGLE, function()
            reconnect()
        end)
    end)

    function reconnect ()
        q = {}
        r = false
        ws:connect(a)
    end

    ws:connect(a)

    return {
        send=m,
        confirm=f
    }
end

return w