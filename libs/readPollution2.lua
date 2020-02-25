function readPollution (callback)
    require('pms3003')
    pms3003.model=5
    if PMset == nil then
        PMset = 7
    end
    pms3003.init(PMset)
    pms3003.verbose=true

    function readNext ()
        pms3003.read(function()
            pm25 = pms3003.pm25 or 'null'

            if type(callback) == "lightfunction" or type(callback) == "function" then
                callback(pm25)
            end

            readNext()
        end)
    end
    
    readNext()
end

return readPollution
