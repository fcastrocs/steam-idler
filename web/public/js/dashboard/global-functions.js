/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
function time(time, mode, isSeconds) {
    let delta = time;
    // convert to seconds
    if (!isSeconds) {
        delta = Math.abs((Date.now() - time) / 1000)
    }

    if (mode === "hrs") {
        let hours = delta / 3600
        return hours.toFixed(3);
    }
    else if (mode === "mins") {
        let minutes = delta / 60;
        return minutes.toFixed(2);
    }
}

// Replaces status of existing account in dashboard
function updateAccountStatus(account) {
    let accountId = account._id;
    let checkTimeChanged = false;
    let realStatusChanged = false;
    let forcedStatusChanged = false;
    let isFarmingChanged = false

    // check if isFarming changed.
    let oldFarmingStatus = accounts_cache[accountId].isFarming;
    if (oldFarmingStatus !== account.isFarming) {
        isFarmingChanged = true;
    }

    // Check if farming check time changed
    if (account.isFarming) {
        let oldFarmingCheck = accounts_cache[accountId].nextFarmingCheck
        // farming check time hasnt changed
        if (oldFarmingCheck !== account.nextFarmingCheck) {
            checkTimeChanged = true;
        }
    }

    // real status changed
    let oldStatus = accounts_cache[accountId].status
    if (oldStatus !== account.status) {
        realStatusChanged = true;
    }

    // check if forced status changed while account is online
    let forcedStatus = accounts_cache[accountId].forcedStatus;
    if (forcedStatus !== account.forcedStatus) {
        forcedStatusChanged = true;
    }

    // nothing changed
    if (!checkTimeChanged && !realStatusChanged && !forcedStatusChanged && !isFarmingChanged) {
        return
    }

    accounts_cache[account._id] = account;
    let accountHtml = buildAccount(account)

    // Replace old acc with this one
    $(`.account[data-id="${accountId}"]`).replaceWith(accountHtml);
}


// shows games activated in modal
function displayGames(games) {
    // Show activated games in modal
    let gamesModal = ""
    for (let j in games) {
        let url = `https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/${games[j].appId}/${games[j].logo}.jpg`
        gamesModal += `<img class="game-img" data-gameId="${games[j].appId}" src="${url}" data-toggle="tooltip" data-placement="top" title="${games[j].name}">`
    }
    $(".activated-game-body").html(gamesModal)
    $(".activated-games").attr("hidden", false).show(0);
}

// Remove selected games in idle modal
function unselectGames(obj) {
    obj.find(".game-body").first().children(".game-img").each(function () {
        if ($(this).hasClass("selected")) {
            $(this).removeClass("selected").addClass("unselected")
        }
    })
}

// Fetch all user's steam accounts from db
function FetchAllAccounts() {
    return new Promise(resolve => {
        $.get("/steamaccounts", accounts => {
            resolve(accounts);
        })
    })
}