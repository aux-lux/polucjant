local a={headers={['user-agent']='NodeMCU',['device-id']=node.chipid()}}if not RECONNECTION_TIME then RECONNECTION_TIME=5000 end;function connectToWebsocket(b)local c=tmr.create()local d=websocket.createClient()local e="ws://%s:%s":format(b.address,b.port)local f={}local g=false;function generateRequestId()return"R%05d":format(node.random(10000,99999))end;d:config(a)d:on("connection",function(d)c:register(50,tmr.ALARM_SINGLE,doQueue)local h=b.onConnect;if type(h)=="lightfunction"or type(h)=="function"then h()end end)function doQueue()c:register(50,tmr.ALARM_SINGLE,doQueue)if not g then if table.getn(f)>0 then g=true;local i,j=pcall(sjson.encode,f)if i then f={}d:send(j)end else g=false end end end;function sendConfirmation()d:send('1')end;function sendMessage(k)c:stop()table.insert(f,k)c:start()end;d:on("receive",function(l,m,n)if n==2 and m=="1"then g=false;doQueue()elseif n==1 then local i,o=pcall(sjson.decode,m)if i then local h=b.onData;if type(h)=="lightfunction"or type(h)=="function"then h(o)end end end end)d:on("close",function(l,p)c:unregister()f={}g=false;tmr.create():alarm(RECONNECTION_TIME,tmr.ALARM_SINGLE,function()reconnect()end)end)function reconnect()f={}g=false;d:connect(e)end;d:connect(e)return{send=sendMessage,confirm=sendConfirmation}end;return connectToWebsocket