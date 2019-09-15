
// builds account div
function buildAccount(account) {
    let buttons = ""
    let farmingInfo = "" // farming modal info
    let farmingStatus = "off"
    let gamesDiv = "" // game images
    let inventory = "";
    let cardsLeft = 0

    if (account.status === "Online" || account.status === "In-game") {
        // BUILD GAMES MODAL
        accounts_cache[account._id].selectedGames = [];
        for (let i in account.games) {
            // create image div
            let steamurl = "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps"
            let gameImgUrl = `${steamurl}/${account.games[i].appId}/${account.games[i].logo}.jpg`

            // find if game should be selected/unselected
            let index = -1;
            if (account.isFarming) {
                index = account.farmingGames.findIndex(x => x.game_id === account.games[i].appId)
            } else {
                index = account.gamesPlaying.findIndex(x => x.game_id === account.games[i].appId)
            }

            let select = ""
            if (index > -1) {
                accounts_cache[account._id].selectedGames.push(account.games[i].appId);
                select = "selected"
            } else { // not found
                select = "unselected"
            }

            gamesDiv += `<img class="game-img ${select}" data-gameId="${account.games[i].appId}" src="${gameImgUrl}" data-toggle="tooltip" data-placement="top" title="${account.games[i].name}">`
        }

        // BUILD FARMING MODAL
        if (account.farmingData.length == 0) {
            var disableFarmingBtn = "disabled"
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
            farmingTaskIds[account._id] = setInterval(() => {
                let diff = account.nextFarmingCheck - Date.now();
                if (diff < 1) {
                    $(`div[data-id="${account._id}"]`).find(".farming-mode").text("updating")
                    clearInterval(farmingTaskIds[account._id])
                    return;
                }
                farmingStatus = `${time(account.nextFarmingCheck)}`
                $(`div[data-id="${account._id}"]`).find(".farming-mode").text(farmingStatus)
            }, 1000)
        }

        // BUILD INVENTORY MODAL
        if (!account.inventory) {
            var disableInventoryBtn = "disabled"
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

        lastReconnectTaskIds[account._id] = setInterval(() => {
            $(`div[data-id="${account._id}"]`).find(".last-connect").text(time(account.lastConnect))
        }, 1000);

        //set buttons
        buttons = `
        <button type="button" class="btn btn-primary btn-sm acc-logout-btn">
            Logout
        </button>
        <button type="button" class="btn btn-primary btn-sm acc-set-status-btn">
            Status
        </button>
        <button type="button" class="btn btn-primary btn-sm acc-idle-game-btn">
            Idle Games
        </button>
        <button type="button" class="btn btn-primary btn-sm acc-farming-btn" ${disableFarmingBtn || ""}>
            Farming
        </button>
        <button type="button" class="btn btn-primary btn-sm acc-inventory-btn" ${disableInventoryBtn || ""}>
            Inventory
        </button>
        <button type="button" class="btn btn-primary btn-sm btn-danger acc-delete-acc-btn">
            Delete
        </button>`

        // Set up info
        var info =
            `<div class="info">
             <div class="farming-info">
                 <div>
                     <span>Farming: </span>
                     <span class="farming-mode info-value">${farmingStatus}</span>
                 </div>
                 <div>
                     <span>Games left to farm: </span>
                     <span class="games-left info-value">${account.farmingData.length}</span>
                 </div>
                 <div>
                     <span>Cards left: </span>
                     <span class="cards-left info-value">${cardsLeft}</span>
                 </div>
             </div>
             <div class="connection-info">
                 <div>
                     <span>Last reconnect: </span>
                     <span class="last-connect info-value">∞</span>
                 </div>
                 <div>
                     <span>Reconnects last hr: </span>
                     <span class="last-hr-reconnects info-value">${account.lastHourReconnects}</span>
                 </div>
             </div>
         </div>`;

        var dropdownMenu = `
         <div class="dropdown">
            <button data-toggle="dropdown" class="acc-dropdown-btn" aria-haspopup="true"
                aria-expanded="false">⯆</button>
            <div class="dropdown-menu acc-dropdown-menu">
                <a href="#" class="filter-btn change-avatar-btn">Change avatar</a>
                <a href="#" class="filter-btn change-nick">Change nick</a>
                <a href="#" class="filter-btn change-privacy-btn">Change privacy</a>
                <a href="#" class="filter-btn clear-aliases-btn">Clear previous aliases</a>
                <a href="#" class="filter-btn activate-free-game">Activate free game</a>
                <a href="#" class="filter-btn activate-f2p-game">Activate F2P game</a>
                <a href="#" class="filter-btn redeem-key">Redeem CDKEY</a>
            </div>
        </div>`

    } else if (account.status === "Offline") {
        account.forcedStatus = "Offline"
        buttons = `
              <button type="button" class="btn btn-primary btn-sm acc-login-btn">
                Login
              </button>
              <button type="button" class="btn btn-primary btn-sm btn-danger acc-delete-acc-btn">
                Delete
              </button>`
    } else if (account.status === "Reconnecting") {
        account.forcedStatus = "Reconnecting"
    }
    else { // bad account
        account.forcedStatus = "Bad"
        buttons = `
        <button type="button" class="btn btn-primary btn-sm acc-delete-acc-btn">
            Delete Acc
        </button>`
    }

    let acc = `
        <div class="account account-${account.forcedStatus}" data-id="${account._id}">

            <div class="persona-name">${account.persona_name}</div>

            <div class="avatar-box">
                 ${dropdownMenu || ""}
                <a href="https://steamcommunity.com/profiles/${account.steamid}" target="_blank">
                    <img class="avatar avatar-${account.status}" src="${account.avatar}">
                </a>
            </div>
            
            <div class="status status-${account.forcedStatus}">${account.forcedStatus}</div>

            
            ${info || ""}
    
            <div class="buttons-box">
                <div class="console" hidden></div>
                <div class="acc-buttons">${buttons}</div>
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
                            <div class="games-box">
                                ${gamesDiv}
                            </div>
                            <div class="modal-buttons">
                                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                                <button type="button" class="btn btn-danger stop-idle-btn">Stop Idle</button>
                                <button type="button" class="btn btn-primary start-idle-btn">Start Idle</button>
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
    let gamesDiv = ""
    for (let j in games) {
        let url = `https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/${games[j].appId}/${games[j].logo}.jpg`
        gamesDiv += `<img class="game-img" data-gameId="${games[j].appId}" src="${url}" data-toggle="tooltip" data-placement="top" title="${games[j].name}">`
    }
    $(".activated-game-body").html(gamesDiv)
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
        $.ajax({
            url: "/steamaccounts",
            type: "GET",
            headers: { "cache-control": "no-cache" },
            cache: false,
            success: accounts => resolve(accounts),
            
        })
    })
}