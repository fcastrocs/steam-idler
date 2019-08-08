// builds account div
function buildAccount(account) {

    // build idle games modal data
    let games = account.games
    let data_games = "";
    let gamesDiv = ""
    for (let j in games) {
        let url = `https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/${games[j].appId}/${games[j].logo}.jpg`
        // find if game should be selected/unselected
        let index = account.gamesPlaying.findIndex(x => x.game_id === games[j].appId)
        let selected_unselected = ""
        if (index > -1) { //not found
            data_games += `${games[j].appId} `
            selected_unselected = "selected"
        } else {
            selected_unselected = "unselected"
        }
        gamesDiv += `<img class="game-img ${selected_unselected}" data-gameId="${games[j].appId}" src="${url}" data-toggle="tooltip" data-placement="top" title="${games[j].name}">`
    }
    data_games = data_games.trim()

    // Set correct buttons
    let buttons = ""
    if (account.status === "Online" || account.status === "In-game") {
        buttons = `
            <button type="button" class="btn btn-primary btn-sm acc-login" hidden>Login</button>
            <button type="button" class="btn btn-primary btn-sm acc-logout">Logout</button>
            <button type="button" class="btn btn-primary btn-sm set-status">Status</button>
            <button type="button" class="btn btn-primary btn-sm idle-game">Idle</button>
            <button type="button" class="btn btn-primary btn-sm redeem-key">Redeem Key</button>
            <button type="button" class="btn btn-primary btn-sm farming">Farming</button>
            <button type="button" class="btn btn-primary btn-sm get-game">Get Games</button>
            <button type="button" class="btn btn-primary btn-sm acc-inventory-btn">Inventory</button>
            <button type="button" class="btn btn-primary btn-sm btn-danger delete-acc">Delete</button>`
    } else if (account.status === "Offline") {
        account.forcedStatus = "Offline"
        buttons = `
            <button type="button" class="btn btn-primary btn-sm acc-login">Login</button>
            <button type="button" class="btn btn-primary btn-sm acc-logout" hidden>Logout</button>
            <button type="button" class="btn btn-primary btn-sm set-status" hidden>Status</button>
            <button type="button" class="btn btn-primary btn-sm idle-game" hidden>Idle</button>
            <button type="button" class="btn btn-primary btn-sm redeem-key" hidden>Redeem Key</button>
            <button type="button" class="btn btn-primary btn-sm farming" hidden>Farming</button>
            <button type="button" class="btn btn-primary btn-sm get-game" hidden>Get Games</button>
            <button type="button" class="btn btn-primary btn-sm acc-inventory-btn" hidden>Inventory</button>
            <button type="button" class="btn btn-primary btn-sm btn-danger delete-acc">Delete</button>`
    } else if (account.status === "Reconnecting") {
        account.forcedStatus = "Reconnecting"
        buttons = `
            <button type="button" class="btn btn-primary btn-sm acc-login" hidden>Login</button>
            <button type="button" class="btn btn-primary btn-sm acc-logout" hidden>Logout</button>
            <button type="button" class="btn btn-primary btn-sm set-status" hidden>Status</button>
            <button type="button" class="btn btn-primary btn-sm idle-game" hidden>Idle</button>
            <button type="button" class="btn btn-primary btn-sm redeem-key" hidden>Redeem Key</button>
            <button type="button" class="btn btn-primary btn-sm farming" hidden>Farming</button>
            <button type="button" class="btn btn-primary btn-sm get-game" hidden>Get Games</button>
            <button type="button" class="btn btn-primary btn-sm acc-inventory-btn" hidden>Inventory</button>
            <button type="button" class="btn btn-primary btn-sm btn-danger delete-acc">Delete</button>`
    }
    else { // bad account
        account.forcedStatus = "Bad"
        buttons = `<button type="button" class="btn btn-primary btn-sm delete-acc">Delete Acc</button>`
    }

    // farming modal
    let cardsLeft = 0
    let farmingInfo = "<div>No games to farm</div>";
    account.farmingData.forEach((game) => {
        cardsLeft += game.cardsRemaining;
        farmingInfo += `<div class="game-farming-info">
                            <div class="game-title" data-id="${game.appId}">${game.title}</div>
                            <div class="play-time">Play time: ${game.playTime}</div>
                            <div class="cards-remaining">Cards Remaining: ${game.cardsRemaining}</div>
                        </div>`
    })

    // set farming next check coutdown
    let farmingStatus = ""
    if (account.isFarming && account.status !== "Offline") {
        let id = setInterval(() => {
            let diff = account.nextFarmingCheck - Date.now();
            if (diff < 1) {
                $(`div[data-id="${account._id}"]`).find(".farming-mode").text("Farming: updating")
                clearInterval(id)
                return;
            }
            var date = new Date(diff);
            var minutes = "0" + date.getMinutes();
            var seconds = "0" + date.getSeconds();
            var nextCheck = minutes.substr(-2) + ':' + seconds.substr(-2);

            farmingStatus = `Farming: ${nextCheck}`
            $(`div[data-id="${account._id}"]`).find(".farming-mode").text(farmingStatus)
        }, 1000)
    } else {
        farmingStatus = "off"
    }

    // inventory
    let inventory = "";
    if(!account.inventory){
        inventory = "You do not have an inventory";
    }
    else{
        for(let i in account.inventory){
            if(!account.inventory.hasOwnProperty(i)){
                continue;
            }
            let url = `https://steamcommunity-a.akamaihd.net/economy/image/${account.inventory[i].icon_url}/96fx96f`
            inventory += `<img src="${url}" data-toggle="tooltip" data-placement="top" title="${account.inventory[i].market_name}">`
        }
    }

    let acc = `
        <div class="account account-${account.forcedStatus}" data-id="${account._id}" data-realstatus="${account.status}" data-farmcheck="${account.nextFarmingCheck}">

            <div class="nick">${account.persona_name}</div>

            <a href="https://steamcommunity.com/profiles/${account.steamid}">
                <img class="avatar avatar-${account.status}" src="${account.avatar}">
            </a>
            
            <div class="info">
                <div class="status status-${account.forcedStatus}">${account.forcedStatus}</div>
                <div class="cards-left">Cards left: ${cardsLeft}</div>
                <div class="games-left">Games left to farm: ${account.farmingData.length}</div>
                <div class="farming-mode">Farming: ${farmingStatus}</div>
            </div>

            <div class="account-buttons">
                ${buttons}
            </div>

            <div class="d-flex justify-content-center">
                <div class="spinner-border text-primary login-wait" role="status" hidden></div>
            </div>

            <div class="modal fade games-idle" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog games-dialog" role="document">
                    <div class="modal-content games-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Pick Games To Idle</h5>
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body game-body">
                            ${gamesDiv}
                            <div class="modal-buttons">
                                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                                <button type="button" class="btn btn-danger stop-idle">Stop Idle</button>
                                <button type="button" class="btn btn-primary start-idle" data-games="${data_games}">Start Idle</button>
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
                            <div class="d-flex justify-content-center">
                                <div class="spinner-border text-info farming-modal-spinner" role="status" hidden></div>
                            </div>
                            <div class="alert alert-danger farming-errMsg" role="alert" hidden></div>
                            <div class="farming-info">
                                ${farmingInfo}
                                <div class="modal-buttons">
                                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                                    <button type="button" class="btn btn-danger">Stop</button>
                                    <button type="button" class="btn btn-primary modal-submit start-farming">Start</button>
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


// Refreshes accounts if its status change
function refreshAccounts() {
    $.get('steamacc/get', (accounts) => {
        for (let i in accounts) {
            // find account div
            let self = $(`.account[data-id="${accounts[i]._id}"]`)

            let checkTimeChanged = false;
            let realStatusChanged = false;
            let forcedStatusChanged = false;

            // account is farming
            if (accounts[i].isFarming) {
                let nextCheck = parseInt(self.attr("data-farmcheck"));
                // farming check time hasnt changed
                if (nextCheck != accounts[i].nextFarmingCheck) {
                    checkTimeChanged = true;
                }
            }

            // real status changed
            if (self.attr("data-realstatus") !== accounts[i].status) {
                realStatusChanged = true;
            }

            // check if forced status changed while account is online
            let status = self.find(".status").first().text()
            if (status != accounts[i].forcedStatus && (accounts[i].status !== "Offline")) {
                forcedStatusChanged = true;
            }


            // nothing changed
            if (!checkTimeChanged && !realStatusChanged && !forcedStatusChanged) {
                continue;
            }

            let account = buildAccount(accounts[i])

            // Replace old acc with this one
            self.replaceWith(account);
        }
    })
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
