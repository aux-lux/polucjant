local blinkPin = 4
local state = 0

if not WIFI_CHECK_FREQUENCY then
    WIFI_CHECK_FREQUENCY = 1000
end

function connectToWifi (station_cfg, callback)
	if doDebug then
		print("Starting WiFi connection")
	end
    local mytimer = tmr.create()
    wifi.setmode(wifi.STATION)
    wifi.sta.config(station_cfg)
	wifi.eventmon.register(wifi.eventmon.STA_DISCONNECTED, function (response)

		if response.reason == wifi.eventmon.reason.ASSOC_LEAVE then
			return
		end

		connectToWifi(station_cfg, callback)
	end)
	--wifi.sta.disconnect(function () connectToWifi(station_cfg, callback) end)
    function checkWifiConnection ()
        if wifi.sta.getip() == nil then
			if doDebug then
				if state==0 then
					state = 1
					gpio.write(blinkPin, gpio.HIGH)
				else
					state = 0
					gpio.write(blinkPin, gpio.LOW)
				end
			end
        else
			if doDebug then
				print("Connected to WiFi")
				gpio.write(blinkPin, gpio.LOW)
			end
            mytimer:stop()
            if type(callback) == "lightfunction" or type(callback) == "function" then
				callback()
			end
        end
    end

    mytimer:register(WIFI_CHECK_FREQUENCY, 1, checkWifiConnection)
    mytimer:start()
end

return connectToWifi
