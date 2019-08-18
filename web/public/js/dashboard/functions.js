
// builds account div
function buildAccount(account) {
    let buttons = ""
    let data_games = ""; // for start idle button
    let gamesDiv = "" // game images
    let cardsLeft = 0
    let farmingInfo = "" // farming modal info
    let farmingStatus = "off"
    let inventory = "";
    let farmingCountDownId = ""

    // SET CORRECT BUTTON AND STATUS
    if (account.status === "Online" || account.status === "In-game") {
        buttons = `
              <button type="button" class="btn btn-primary btn-sm acc-logout-btn">Logout</button>
              <button type="button" class="btn btn-primary btn-sm acc-set-status-btn">Status</button>
              <button type="button" class="btn btn-primary btn-sm acc-idle-game-btn">Idle Games</button>
              <button type="button" class="btn btn-primary btn-sm redeem-key">Redeem Key</button>
              <button type="button" class="btn btn-primary btn-sm acc-farming-btn">Farming</button>
              <button type="button" class="btn btn-primary btn-sm acc-get-game-btn">Get Games</button>
              <button type="button" class="btn btn-primary btn-sm acc-inventory-btn">Inventory</button>
              <button type="button" class="btn btn-primary btn-sm btn-danger acc-delete-acc-btn">Delete</button>`
    } else if (account.status === "Offline") {
        account.forcedStatus = "Offline"
        buttons = `
              <button type="button" class="btn btn-primary btn-sm acc-login-btn">Login</button>
              <button type="button" class="btn btn-primary btn-sm btn-danger acc-delete-acc-btnc">Delete</button>`
    } else if (account.status === "Reconnecting") {
        account.forcedStatus = "Reconnecting"
    }
    else { // bad account
        account.forcedStatus = "Bad"
        buttons = `<button type="button" class="btn btn-primary btn-sm acc-delete-acc-btn">Delete Acc</button>`
    }

    // only execute when account is online
    if (account.status === "Online" || account.status === "In-game") {
        // BUILD IDLE MODAL
        for (let j in account.games) {
            let url = `https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/${account.games[j].appId}/${account.games[j].logo}.jpg`
            // find if game should be selected/unselected
            let index = -1;
            if (account.isFarming) {
                index = account.farmingGames.findIndex(x => x.game_id === account.games[j].appId)
            } else {
                index = account.gamesPlaying.findIndex(x => x.game_id === account.games[j].appId)
            }

            let selected_unselected = ""
            if (index > -1) { //not found
                data_games += `${account.games[j].appId} `
                selected_unselected = "selected"
            } else {
                selected_unselected = "unselected"
            }
            gamesDiv += `<img class="game-img ${selected_unselected}" data-gameId="${account.games[j].appId}" src="${url}" data-toggle="tooltip" data-placement="top" title="${account.games[j].name}">`
        }
        data_games = data_games.trim()


        // BUILD FARMING MODAL

        // No games to farm
        if (account.farmingData.length == 0) {
            farmingInfo = "<div>No games to farm</div>";
            // there are games to farm
        } else {
            account.farmingData.forEach((game) => {
                cardsLeft += game.cardsRemaining;
                farmingInfo += `<div class="game-farming-info">
                                <div class="game-title" data-id="${game.appId}">${game.title}</div>
                                <div class="play-time">Play time: ${game.playTime}</div>
                                <div class="cards-remaining">Cards Remaining: ${game.cardsRemaining}</div>
                            </div>`
            })
        }

        // START THE FARMING COUNTDOWN IF FARMING
        if (account.isFarming) {
            farmingCountDownId = setInterval(() => {
                let diff = account.nextFarmingCheck - Date.now();
                if (diff < 1) {
                    $(`div[data-id="${account._id}"]`).find(".farming-mode").text("updating")
                    clearInterval(id)
                    return;
                }
                farmingStatus = `Farming: ${time(account.nextFarmingCheck)}`
                $(`div[data-id="${account._id}"]`).find(".farming-mode").text(farmingStatus)
            }, 1000)
        }

        // BUILD INVENTORY MODAL
        if (!account.inventory) {
            inventory = "You do not have an inventory";
        }
        else {
            for (let i in account.inventory) {
                if (!account.inventory.hasOwnProperty(i)) {
                    continue;
                }
                let url = `https://steamcommunity-a.akamaihd.net/economy/image/${account.inventory[i].icon_url}/96fx96f`
                inventory += `<img src="${url}" data-toggle="tooltip" data-placement="top" title="${account.inventory[i].market_name}">`
            }
        }

        var info = `<div class="info">
                        <div class="farming-info">
                            <div><span>Farming: </span><span class="farming-mode info-value">${farmingStatus}</span></div>
                            <div><span>Games left to farm: </span><span class="games-left info-value">${account.farmingData.length}</span></div>
                            <div><span>Cards left: </span><span class="cards-left info-value">${cardsLeft}</span></div>
                        </div>
                        <div class="connection-info">
                            <div><span>Last reconnect: </span><span class="last-connect info-value">∞</span></div>
                            <div><span>Reconnects last hr: </span><span class="last-hr-reconnects info-value">${account.lastHourReconnects}</span></div>
                        </div>
                    </div>`;



        setInterval(() => {
            $(`div[data-id="${account._id}"]`).find(".last-connect").text(time(account.lastConnect))
        }, 1000);

    }

    let acc = `
        <div class="account account-${account.forcedStatus}" data-id="${account._id}" data-realstatus="${account.status}" data-farmcheck="${account.nextFarmingCheck}" data-isFarming="${account.isFarming}" data-farmingCountDownId="${farmingCountDownId}">

            <div class="nick">${account.persona_name}</div>

            <a href="https://steamcommunity.com/profiles/${account.steamid}">
                <img class="avatar avatar-${account.status}" src="${account.avatar}">
            </a>
           
            <div class="status status-${account.forcedStatus}">${account.forcedStatus}</div>
            
            ${info || ""}

            <div class="buttons-box">
                <div class="spinner-border text-primary acc-spinner" role="status" hidden></div>
                <div id="acc-buttons">${buttons}</div>
            </div>

            <div class="modal fade idle-modal" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog games-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Pick Games To Idle</h5>
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body game-body">
                            <div class="alert alert-danger idle-errMsg" role="alert" hidden></div>
                            <div class="games-box">
                                ${gamesDiv}
                            </div>
                            <div class="modal-buttons">
                                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                                <button type="button" class="btn btn-danger stop-idle-btn">Stop Idle</button>
                                <button type="button" class="btn btn-primary start-idle-btn" data-games="${data_games}">Start Idle</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            <div class="modal fade farming-modal" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog farming-dialog" role="document">
                    <div class="modal-content farming-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Farming Info</h5>
                        </div>
                        <div class="modal-body farming-body">
                            <div class="alert alert-danger farming-errMsg" role="alert" hidden></div>
                            <div class="farming-info">
                                ${farmingInfo}
                                <div class="modal-buttons">
                                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                                    <button type="button" class="btn btn-danger stop-farming-btn">Stop</button>
                                    <button type="button" class="btn btn-primary modal-submit start-farming-btn">Start</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="modal fade inventory-modal" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog inventory-dialog" role="document">
                    <div class="modal-content iventory-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Iventory</h5>
                        </div>
                        <div class="modal-body inventory-body">
                            <div class="d-flex justify-content-center">
                                <div class="spinner-border text-info inventory-modal-spinner" role="status" hidden></div>
                            </div>
                            <div class="alert alert-danger iventory-errMsg" role="alert" hidden></div>
                            <div class="iventory-info">
                                ${inventory}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>`
    return acc;
}

// Returns format 00:00:00
function time(time) {
    // convert to seconds
    let delta = Math.abs((Date.now() - time) / 1000)
    let days = Math.floor(delta / 86400)
    delta -= days * 86400
    let hours = Math.floor(delta / 3600)
    delta -= hours * 3600
    let minutes = Math.floor(delta / 60)
    delta -= minutes * 60;
    let seconds = Math.floor(delta);
    hours = "0" + hours
    minutes = "0" + minutes
    seconds = "0" + seconds
    return hours.substr(-2) + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
}



// Replaces status of existing account in dashboard
// if force == true, then force update
function updateAccountStatus(account) {
    // find account div
    let self = $(`.account[data-id="${account._id}"]`)

    let checkTimeChanged = false;
    let realStatusChanged = false;
    let forcedStatusChanged = false;
    let isFarmingChanged = false

    // check if isFarming changed.
    let oldFarmingStatus = Boolean(self.attr("data-isFarming"));
    if (oldFarmingStatus === "true") {
        oldFarmingStatus = true;
    } else {
        oldFarmingStatus = false;
    }
    if (oldFarmingStatus !== account.isFarming) {
        isFarmingChanged = true;
    }

    // Check if farming check time changed
    if (account.isFarming) {
        let nextCheck = parseInt(self.attr("data-farmcheck"));
        // farming check time hasnt changed
        if (nextCheck != account.nextFarmingCheck) {
            checkTimeChanged = true;
        }
    }

    // real status changed
    if (self.attr("data-realstatus") !== account.status) {
        realStatusChanged = true;
    }

    // check if forced status changed while account is online
    let status = self.find(".status").first().text()
    if (status != account.forcedStatus && (account.status !== "Offline")) {
        forcedStatusChanged = true;
    }

    // nothing changed
    if (!checkTimeChanged && !realStatusChanged && !forcedStatusChanged && !isFarmingChanged) {
        return
    }

    account = buildAccount(account)

    // Replace old acc with this one
    self.replaceWith(account);
}


// shows games activated in modal, and adds them to account
function processGames(accountId, games) {
    // Show activated games in modal
    let gamesDiv = ""
    for (let j in games) {
        let url = `https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/${games[j].appId}/${games[j].logo}.jpg`
        gamesDiv += `<img class="game-img" data-gameId="${games[j].appId}" src="${url}" data-toggle="tooltip" data-placement="top" title="${games[j].name}">`
    }
    $(".activated-game-body").html(gamesDiv)
    $(".activated-games").attr("hidden", false).show(0);

    //show activated games in idle modal
    gamesDiv = ""
    for (let j in games) {
        let url = `https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/${games[j].appId}/${games[j].logo}.jpg`
        gamesDiv += `<img class="game-img unselected" data-gameId="${games[j].appId}" src="${url}" data-toggle="tooltip" data-placement="top" title="${games[j].name}">`
    }
    $(`div.account[data-id="${accountId}"]`).find(".game-body").first().append(gamesDiv)
}

// Remove selected games in idle modal
function unselectGames(obj) {
    obj.find(".game-body").first().children(".game-img").each(function () {
        if ($(this).hasClass("selected")) {
            $(this).removeClass("selected").addClass("unselected")
        }
    })
}

function getAllAccountIds() {
    let accountIds = []
    $(".account").each(function () {
        accountIds.push($(this).attr("data-id"))
    })
    return accountIds;
}

// Fetch all user's steam accounts from db
function FetchAllAccounts() {
    return new Promise((resolve, reject) => {
        // Refresh account status every interval seconds
        $.get("/steamaccounts", accounts => {
            return resolve(accounts);
        }).fail((xhr, status, err) => {
            return reject(xhr.responseText)
        })
    })
}