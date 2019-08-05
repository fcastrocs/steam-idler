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
            <button type="button" class="btn btn-primary btn-sm get-game">Get Games</button>
            <button type="button" class="btn btn-primary btn-sm btn-danger delete-acc">Delete</button>`
    } else if (account.status === "Offline") {
        account.forcedStatus = "Offline"
        buttons = `
            <button type="button" class="btn btn-primary btn-sm acc-login">Login</button>
            <button type="button" class="btn btn-primary btn-sm acc-logout" hidden>Logout</button>
            <button type="button" class="btn btn-primary btn-sm set-status" hidden>Status</button>
            <button type="button" class="btn btn-primary btn-sm redeem-key" hidden>Redeem Key</button>
            <button type="button" class="btn btn-primary btn-sm idle-game" hidden>Idle</button>
            <button type="button" class="btn btn-primary btn-sm get-game" hidden>Get Games</button>
            <button type="button" class="btn btn-primary btn-sm btn-danger delete-acc">Delete</button>`
    } else if (account.status === "Reconnecting") {
        account.forcedStatus = "Reconnecting"
        buttons = `
            <button type="button" class="btn btn-primary btn-sm acc-login" hidden>Login</button>
            <button type="button" class="btn btn-primary btn-sm acc-logout" hidden>Logout</button>
            <button type="button" class="btn btn-primary btn-sm set-status" hidden>Status</button>
            <button type="button" class="btn btn-primary btn-sm redeem-key" hidden>Redeem Key</button>
            <button type="button" class="btn btn-primary btn-sm idle-game" hidden>Idle</button>
            <button type="button" class="btn btn-primary btn-sm get-game" hidden>Get Games</button>
            <button type="button" class="btn btn-primary btn-sm btn-danger delete-acc" hidden>Delete</button>`
    }
    else { // bad account
        account.forcedStatus = "Bad"
        buttons = `<button type="button" class="btn btn-primary btn-sm delete-acc">Delete Acc</button>`
    }

    // farming info
    let cardsLeft = 0
    account.farmingInfo.forEach((game)=>{
        cardsLeft += game.cardsRemaining;
    })

    let acc = `
        <div class="account account-${account.forcedStatus}" data-id="${account._id}" data-realstatus="${account.status}">

            <div class="nick">${account.persona_name}</div>

            <a href="https://steamcommunity.com/profiles/${account.steamid}">
                <img class="avatar avatar-${account.status}" src="${account.avatar}">
            </a>
            
            <div class="info">
                <div class="status status-${account.forcedStatus}">${account.forcedStatus}</div>
                <div class="cards-left">Cards left: ${cardsLeft}</div>
                <div class="games-left">Games left to farm: ${account.farmingInfo.length}</div>
            </div>

            <div class="account-buttons">
                ${buttons}
            </div>

            <div class="d-flex justify-content-center">
                <div class="spinner-border text-primary login-wait" role="status" hidden></div>
            </div>

            <div class="modal fade games-idle tabindex="-1" role="dialog" aria-hidden="true">
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

        </div>`
    return acc;
}


// Refreshes accounts if its status change
function refreshAccounts() {
    $.get('steamacc/get', (accounts) => {
        for (let i in accounts) {
            // find account div
            let self = $(`.account[data-id="${accounts[i]._id}"]`)
            let status = self.attr("data-realstatus")

            // Check if status has changed
            if (status === accounts[i].status) {
                // don't check forced status for offline accounts
                if (status === "Offline") {
                    continue;
                }
                //also check forced status
                let forcedStatus = self.find(".status").first().text();
                if (forcedStatus == accounts[i].forcedStatus) {
                    continue;
                }
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
