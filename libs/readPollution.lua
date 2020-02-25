function readPollution (callback)
    local readings = {}
    local numberOfReadings = 14
    local min01 = 99999
    local min25 = 99999
    local min10 = 99999
    local max01 = 0
    local max25 = 0
    local max10 = 0
    
    require('pms3003')
    pms3003.model=5
    if PMset == nil then
        PMset = 7
    end
    pms3003.init(PMset)
    pms3003.verbose=true

    function readNext ()
        pms3003.read(function()
            pm01 = pms3003.pm01 or 'null'
            pm25 = pms3003.pm25 or 'null'
            pm10 = pms3003.pm10 or 'null'
    
            if pm25 ~= 'null' then
                table.insert(readings, {pm01=pm01,pm25=pm25,pm10=pm10})
            end
    
            if table.getn(readings) < numberOfReadings then
                readNext ()
            else
                local result = {pm01=0,pm25=0,pm10=0}
                pms3003,package.loaded.pms3003 = nil,nil
                for i=3,numberOfReadings
                do
                    result.pm01 = result.pm01 + readings[i].pm01
                    result.pm25 = result.pm25 + readings[i].pm25
                    result.pm10 = result.pm10 + readings[i].pm10

                    max01 = math.max(max01, readings[i].pm01)
                    max25 = math.max(max25, readings[i].pm25)
                    max10 = math.max(max10, readings[i].pm10)

                    min01 = math.min(min01, readings[i].pm01)
                    min25 = math.min(min25, readings[i].pm25)
                    min10 = math.min(min10, readings[i].pm10)
                end

                result.pm01 = (result.pm01 - min01 - max01) / (numberOfReadings - 4)
                result.pm25 = (result.pm25 - min25 - max25) / (numberOfReadings - 4)
                result.pm10 = (result.pm10 - min10 - max10) / (numberOfReadings - 4)
                
                readings = {}
                if type(callback) == "lightfunction" or type(callback) == "function" then
                    callback(result)
                else
                    print('No callback function')
                    print(type(callback))
                end
            end
        end)
    end
    
    readNext()
end

return readPollution