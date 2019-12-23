/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

// builds account div
function buildAccount(account) {
    // modals
    let farmingModal = "" // farming modal info
    let gamesModal = "" // game images
    let inventoryModal = "";

    // buttons
    let iconBtns = "";
    let settingsBtnMenu = ""

    let farmingStatus = "off"

    // ACCOUNT IS ONLINE
    if (account.status === "Online" || account.status === "In-game") {

        // set buttons that will appear when account is online or in-game
        iconBtns = `<img class="icon icon-img acc-idle-game-btn" src="/static/images/game-controller.svg" title="Idle Games">
                <img class="icon icon-img acc-farming-btn" src="/static/images/farming.svg" title="Farm Cards">
                <img class="icon icon-img acc-inventory-btn" src="/static/images/inventory.svg" title="Inventory">`

        settingsBtnMenu = `<a href="#" class="acc-set-status-btn">Change status</a>
                        <a href="#" class="change-avatar-btn">Change avatar</a>
                        <a href="#" class="change-nick">Change nick</a>
                        <a href="#" class="change-privacy-btn">Change privacy</a>
                        <a href="#" class="get-intentory-btn">Refresh inventory</a>
                        <a href="#" class="clear-aliases-btn">Clear previous aliases</a>
                        <a href="#" class="activate-free-game">Activate free promo game</a>
                        <a href="#" class="activate-f2p-game">Activate F2P game</a>
                        <a href="#" class="redeem-key">Redeem CDKEY</a>
                        <hr>
                        <a href="#" class="acc-logout-btn">Logout</a>
                        <a href="#" class="acc-delete-btn text-danger">Delete</a>`

        // uptime timer
        lastReconnectTaskIds[account._id] = setInterval(() => {
            $(`div[data-id="${account._id}"]`).find(".uptimehrs-item").text(time(account.lastConnect, "hrs"))
        }, 3000)

        // BUILD GAMES MODAL
        accounts_cache[account._id].selectedGames = [];
        for (let i in account.games) {
            let select = ""

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

            if (index > -1) {
                accounts_cache[account._id].selectedGames.push(account.games[i].appId);
                select = "selected"
            } else { // not found
                select = "unselected"
            }
            gamesModal += `<img class="game-img ${select}" data-gameId="${account.games[i].appId}" src="${gameImgUrl}" data-toggle="tooltip" data-placement="top" title="${account.games[i].name}">`
        }

        // start farming countdown if farming
        if (account.isFarming) {
            farmingStatus = '<span class="text-success">on</span>'

            farmingTaskIds[account._id] = setInterval(() => {
                let diff = account.nextFarmingCheck - Date.now();
                if (diff < 1) {
                    $(`.account[data-id="${account._id}"]`).find(".next-farming-check").text("updating...");
                    clearInterval(farmingTaskIds[account._id])
                    return;
                }
                let farmingCheck = `${time(account.nextFarmingCheck, "mins")}`
                $(`.account[data-id="${account._id}"]`).find(".next-farming-check").text(farmingCheck + " mins");
            }, 5000)
        }

        // build farming modal
        if (account.farmingData.length == 0) {
            farmingModal = "No cards to farm."
        } else {
            let cardsLeft = 0;
            account.farmingData.forEach((game) => {
                cardsLeft += game.cardsRemaining;
                farmingModal += `<div class="game-farming-info">
                                    <div class="game-title" data-id="${game.appId}">${game.title}</div>
                                    <div class="play-time">Play time: ${game.playTime}</div>
                                    <div class="cards-remaining">Cards Remaining: ${game.cardsRemaining}</div>
                                </div>`
            })

            farmingModal = `<div class="farming-info">
                                <div>
                                    <span>Next farming check: </span>
                                    <span class="next-farming-check">∞</span>
                                </div>
                                <div>Games left to farm: ${account.farmingData.length}</div>
                                <div class="cards-left" data-cards="${cardsLeft}">Cards left: ${cardsLeft}</div>
                           </div> ${farmingModal}`
        }

        // build inventory modal
        if (account.inventory.length == 0) {
            inventoryModal = "Inventory is empty"
        }
        else {
            account.inventory.forEach(item => {
                let url = `https://steamcommunity-a.akamaihd.net/economy/image/${item.icon}/96fx96f`
                inventoryModal += `<img src="${url}" data-toggle="tooltip" data-placement="top" title="${item.name}">`
            });
        }

        //${account.lastHourReconnects}
    }
    // ACCOUNT IS OFFLINE
    else if (account.status === "Offline") {
        account.forcedStatus = "Offline"

        settingsBtnMenu = `<a href="#" class="filter-btn acc-login-btn">Login</a>
            <a href="#" class="acc-delete-btn text-danger">Delete</a>`
    }
    // ACCOUNT IS RECONNECTING
    else if (account.status === "Reconnecting") {
        account.forcedStatus = "Reconnecting"
    }
    // ACCOUNT IS BAD
    else {
        account.forcedStatus = "Bad"
        settingsBtnMenu = `<a href="#" class="filter-btn acc-login-btn">Login</a>
            <a href="#" class="acc-delete-btn text-danger">Delete</a>`
    }

    let acc = `<div class="account account-${account.forcedStatus}" data-id="${account._id}">

                    <span class="avatar-item">
                        <a href="https://steamcommunity.com/profiles/${account.steamid}" target="_blank">
                            <img class="avatar avatar-${account.status}" src="${account.avatar}">
                        </a>
                    </span>

                    <span id="account-info">
                        <span class="nick-item nick-${account.status}">${account.persona_name}</span>
                        <span class="username-item">${account.user}</span>
                        <span class="status-item status-${account.forcedStatus}">${account.forcedStatus}</span>
                        <span class="idling-item">${account.gamesPlaying.length} / 32</span>
                        <span class="uptimehrs-item" data-toggle="tooltip">∞</span>
                        <span class="idlinghrs-item">${time(account.idledSeconds, "hrs", true)}</span>
                        <span class="farming-item">${farmingStatus}</span>
                        <span class="icons-item">
                            ${iconBtns}
                            <span class="dropdown">
                                <img class="icon icon-img" data-toggle="dropdown" class="acc-dropdown-btn" src="/static/images/settings.svg" title="Settings">
                                <div class="dropdown-menu">
                                    ${settingsBtnMenu}
                                </div>
                            </span>
                        </span>
                    </span>


                    <div class="modal fade idle-modal" tabindex="-1" role="dialog" aria-hidden="true">
                        <div class="modal-dialog games-dialog">
                            <div class="modal-content games-content">
                                <div class="modal-header">
                                    <h5 class="modal-title">Pick Games To Idle</h5>
                                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                        <span aria-hidden="true">&times;</span>
                                    </button>
                                </div>
                                <div class="modal-body game-body">
                                    <div class="games-box">
                                        ${gamesModal}
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
                                        ${farmingModal}
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
                                    <h5 class="modal-title">Inventory</h5>
                                </div>
                                <div class="modal-body inventory-body">
                                    <div class="d-flex justify-content-center">
                                        <div class="spinner-border text-info inventory-modal-spinner" role="status" hidden></div>
                                    </div>
                                    <div class="alert alert-danger iventory-errMsg" role="alert" hidden></div>
                                    <div class="iventory-info">
                                        ${inventoryModal}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`
    return acc;
}

// Returns format 00:00:00
/*function time(time) {
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
}*/


function time(time, mode, isSeconds) {
    let delta = time;
    // convert to seconds
    if(!isSeconds){
        delta = Math.abs((Date.now() - time) / 1000)
    }

    if(mode === "hrs"){
        let hours = delta / 3600
        return hours.toFixed(3);
    }
    else if (mode === "mins"){
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

// function getAllAccountIds() {
//     let accountIds = []
//     $(".account").each(function () {
//         accountIds.push($(this).attr("data-id"))
//     })
//     return accountIds;
// }

// Fetch all user's steam accounts from db
function FetchAllAccounts() {
    return new Promise(resolve => {
        $.ajax({
            url: "/steamaccounts",
            type: "GET",
            headers: { "cache-control": "no-cache" },
            cache: false,
            success: accounts => resolve(accounts),

        })
    })
}