local a={name=...,model=3,mlen=nil,stdATM=nil,verbose=nil,debug=nil,pm01=nil,pm25=nil,pm10=nil,psd=nil}_G[a.name]=a;local function b(c)assert(a.debug~=true or#c==a.mlen,'%s: Incomplete message.':format(a.name))local d,e,f={},0,#c/2-2;local g,h,i;for g=-1,f do h,i=c:byte(2*g+3,2*g+4)d[g]=h*0x100+i;e=e+(g<f and h+i or 0)if a.debug==true then end end;h,i,f,g=nil,nil,nil,nil;assert(a.debug~=true or d[-1]==0x424D and d[0]==#c-4,'%s: Wrongly phrased message.':format(a.name))if e==d[#d]and a.stdATM~=true then a.pm01,a.pm25,a.pm10=d[1],d[2],d[3]elseif e==d[#d]then a.pm01,a.pm25,a.pm10=d[4],d[5],d[6]else a.pm01,a.pm25,a.pm10=nil,nil,nil end;if a.verbose==true then end;if e==d[#d]and d[0]==28 then psd={}for g=1,5 do psd[g]=d[g+7]-d[g+6]end else psd=nil end;if a.verbose==true and a.psd then end end;local j=nil;local k=false;function a.init(l,m,n)if m==true then _G[a.name],package.loaded[a.name]=nil,nil end;if type(l)=='number'then j=l;gpio.mode(j,gpio.OUTPUT)end;if type(j)=='number'then uart.on('data',0,function(c)end,0)gpio.write(j,gpio.LOW)if a.verbose==true then end;uart.on('data')end;if not k then a.mlen=({32,24,24,nil,32,nil,32})[a.model]a.model=a.mlen and'PMSx003':gsub('x',a.model)or nil end;k=a.model~=nil and a.mlen~=nil;return k end;function a.read(o)assert(k,'Need %s.init(...) before %s.read(...)':format(a.name,a.name))assert(type(o)=='function'or o==nil,'%s.init %s argument should be %s':format(a.name,'1st','function'))uart.on('data',a.mlen*2,function(c)local p=c:find("BM")if p then tmr.stop(4)b(c:sub(p,a.mlen+p-1))a.init(nil,nil,'finished')if type(o)=='function'then o()end end end,0)if a.verbose==true then end;gpio.write(j,gpio.HIGH)tmr.alarm(4,2000,0,function()a.pm01,a.pm25,a.pm10,a.psd=nil,nil,nil,nil;a.init(nil,nil,'failed')if type(o)=='function'then o()end end)end;return a