const STEEMIT_BANDWIDTH_AVERAGE_WINDOW_SECONDS = 60 * 60 * 24 * 7
    , STEEM_VOTING_MANA_REGENERATION_SECONDS = 432000 // 432000 sec = 5 days
    , STEEM_RC_MANA_REGENERATION_SECONDS = 432000 // 432000 sec = 5 days
    , CHAIN_ENERGY_REGENERATION_SECONDS = 432000 // 432000 sec = 5 days
;

let urlParse = require(`url-parse`)
;

function calculateVotingPower(account) {
    if (`voting_manabar` in account) {
        let totalShares = parseFloat(account.vesting_shares) + parseFloat(account.received_vesting_shares) - parseFloat(account.delegated_vesting_shares) - parseFloat(account.vesting_withdraw_rate)
            , elapsed = Math.floor(Date.now() / 1000) - account.voting_manabar.last_update_time
            , maxMana = totalShares * 1000000
            , currentMana = parseFloat(account.voting_manabar.current_mana) + elapsed * maxMana / STEEM_VOTING_MANA_REGENERATION_SECONDS;

        if (currentMana > maxMana) {
            currentMana = maxMana;
        }

        return (currentMana * 100 / maxMana).toFixed(2);
    } else if (`energy` in account) {
        return (calculateCurrentValue(account, `energy`) / 100)
    } else {
        return (calculateCurrentValue(account, `voting_power`) / 100)
    }
}

function calculateCurrentValue(account, key) {
    let lastVoteTime = Date.parse(account.last_vote_time)
        , deltaTime = parseInt((new Date().getTime() - lastVoteTime + (new Date().getTimezoneOffset() * 60000)) / 1000)
        , currentValue = parseInt(account[key] + (deltaTime * 10000 / CHAIN_ENERGY_REGENERATION_SECONDS))
    ;
    if (currentValue > 10000) {
        currentValue = 10000;
    }

    return currentValue;
}

function parsePostUrl(url) {
    let parsed = urlParse(url.toLowerCase())
        , parts = parsed.pathname.split(`/`)
        , queryParams = parseQueryParams(parsed.query)
        , authorIndex = 0
    ;
    if (`author` in queryParams && `permlink` in queryParams) {
        return {
            author: queryParams[`author`]
            , permlink: queryParams[`permlink`]
        };
    }

    for (let i in parts) {
        if (parts[i].length === 0) {
            continue;
        }
        if (parts[i][0] === `@`) {
            authorIndex = i * 1;
            break;
        }
    }
    if (authorIndex === 0) {
        return {};
    }

    return {
        author: parts[authorIndex].slice(1),
        permlink: parts[authorIndex + 1]
    };
}

function parseQueryParams(queryString) {
    if (queryString[0] === `?`) {
        queryString = queryString.slice(1);
    }
    let queryParts = queryString.split(`&`)
        , queryParams = {}
    ;

    for (let i in queryParts) {
        let [key, val] = queryParts[i].split(`=`);
        queryParams[key] = decodeURIComponent(val);
    }

    return queryParams;
}

function isArrayContainsProperty(objects, propertyName, propertyValue) {
    let result = false;
    for (let i in objects) {
        if (objects[i][propertyName] === propertyValue) {
            result = true;
            break;
        }
    }

    return result;
}

module.exports = {
    calculateVotingPower: calculateVotingPower
    , parsePostUrl: parsePostUrl
    , isArrayContainsProperty: isArrayContainsProperty
};
