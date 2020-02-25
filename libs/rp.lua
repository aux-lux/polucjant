function p (callback)
pms=require('pms')
pms.model=5
if PMset == nil then
PMset = 7
end
pms.init(PMset)
pms.verbose=true
function r ()
pms.read(function()
pm25 = pms.pm25 or 'null'
if type(callback) == "lightfunction" or type(callback) == "function" then callback(pm25) end
r()
end)
end
r()
end
return p