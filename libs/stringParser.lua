local rule = "{.-}"

function initStringParser(messageHandler)
    local historyString = ''
    return function (str)
        historyString = historyString .. str
        local matches = string.gmatch(historyString, rule)
        local trimLength = 1

        for match in matches do
            local response = string.sub(match, 2, -2)
            messageHandler(response)
            trimLength = trimLength + string.len(match)
        end

        historyString = string.sub(historyString, trimLength)
    end
end

return initStringParser
