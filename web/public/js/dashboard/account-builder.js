/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

/**
 * Builds account html
 */
function buildAccount(account) {
    let iconBtns = "";
    let farmingStatus = "off"
    let gamesHtml = "";
    let farmingHtml = "";
    let inventoryHtml = "";
    let settingsMenuHtml = "";

    // ACCOUNT IS ONLINE
    if (account.status === "Online" || account.status === "In-game") {
        iconBtns = buildIconBtns(account.status);
        settingsMenuHtml = buildSettingsMenu(account.status);

        // uptime timer
        startUptimeTimer(account);

        // Build games modal
        gamesHtml = buildGames(account);

        // start farming countdown if farming
        if (account.isFarming) {
            farmingStatus = '<span class="text-success">on</span>'
            startFarmingCountDown(account);
        }

        // build farming modal
        farmingHtml = buildFarming(account.farmingData);

        // build inventory modal
        inventoryHtml = buildInventory(account.inventory)
    }
    // ACCOUNT IS OFFLINE
    else if (account.status === "Offline") {
        account.forcedStatus = "Offline"
        settingsMenuHtml = buildSettingsMenu(account.status);
    }
    // ACCOUNT IS RECONNECTING
    else if (account.status === "Reconnecting") {
        account.forcedStatus = "Reconnecting"
        settingsMenuHtml = buildSettingsMenu(account.status);
    }
    // ACCOUNT IS BAD
    else {
        account.forcedStatus = "Bad"
        settingsMenuHtml = buildSettingsMenu(account.status);
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
                                    ${settingsMenuHtml}
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
                                        ${gamesHtml}
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
                                        ${farmingHtml}
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
                                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                        <span aria-hidden="true">&times;</span>
                                    </button>
                                </div>
                                <div class="modal-body inventory-body">
                                    <div class="d-flex justify-content-center">
                                        <div class="spinner-border text-info inventory-spinner" hidden></div>
                                    </div>
                                    <div class="inventory-info">
                                        ${inventoryHtml}
                                    </div>
                                </div>
                                <div class="modal-buttons">
                                    <button class="btn btn-primary modal-btn refresh-intentory-btn">Reload Inventory</button>
                                    <button class="btn btn-primary modal-btn send-offer-btn">Send offer</button>
                                    <button class="btn btn-secondary modal-btn" data-dismiss="modal">Close</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`
    return acc;
}

/**
 * Create icon btns
 */
function buildIconBtns(status) {
    let iconBtns = "";
    if (status === "Online" || status === "In-game") {
        iconBtns = `<img class="icon icon-img acc-idle-game-btn" src="/static/images/game-controller.svg" title="Idle Games">
                    <img class="icon icon-img acc-farming-btn" src="/static/images/farming.svg" title="Farm Cards">
                    <img class="icon icon-img acc-inventory-btn" src="/static/images/inventory.svg" title="Inventory">`
    }
    return iconBtns;
}

/**
 * Creates settings menu
 */
function buildSettingsMenu(status) {
    let settingsMenuHtml = "";
    if (status === "Online" || status === "In-game") {
        settingsMenuHtml = `<a href="#" class="acc-set-status-btn">Change status</a>
                            <a href="#" class="change-avatar-btn">Change avatar</a>
                            <a href="#" class="change-nick">Change nick</a>
                            <a href="#" class="change-privacy-btn">Change privacy</a>
                            <a href="#" class="clear-aliases-btn">Clear previous aliases</a>
                            <a href="#" class="activate-free-game">Activate free promo game</a>
                            <a href="#" class="activate-f2p-game">Activate F2P game</a>
                            <a href="#" class="redeem-key">Redeem CDKEY</a>
                            <hr>
                            <a href="#" class="acc-logout-btn">Logout</a>
                            <a href="#" class="acc-delete-btn text-danger">Delete</a>`
    }
    else if (status === "Offline") {
        settingsMenuHtml = `<a href="#" class="filter-btn acc-login-btn">Login</a>
                            <a href="#" class="acc-delete-btn text-danger">Delete</a>`
    }
    else if (status === "Reconnecting") {
        settingsMenuHtml = "";
    } else {
        settingsMenuHtml = `<a href="#" class="filter-btn acc-login-btn">Login</a>
                            <a href="#" class="acc-delete-btn text-danger">Delete</a>`
    }
    return settingsMenuHtml;
}

/**
 * Starts the uptime timer
 */
function startUptimeTimer(account) {
    upTimeTaskIds[account._id] = setInterval(() => {
        $(`div[data-id="${account._id}"]`).find(".uptimehrs-item").text(time(account.lastConnect, "hrs"))
    }, 3000)
}

/**
 * Starts the farming countdown
 */
function startFarmingCountDown(account) {
    if (account.isFarming) {
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
}

/**
 * Creates games html for the games modal
 */
function buildGames(account) {
    // Create selected games array
    accounts_cache[account._id].selectedGames = [];

    let gamesHtml = "";
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
        gamesHtml += `<img class="game-img ${select}" data-gameId="${account.games[i].appId}" src="${gameImgUrl}" data-toggle="tooltip" data-placement="top" title="${account.games[i].name}">`
    }

    return gamesHtml;
}

/**
 * Creates inventory html for the games modal
 */
function buildInventory(inventory) {
    let inventoryHtml = ""
    if (inventory.length == 0) {
        inventoryHtml = "Inventory is empty"
    }
    else {
        inventory.forEach(item => {
            let url = `https://steamcommunity-a.akamaihd.net/economy/image/${item.icon}/96fx96f`
            inventoryHtml += `<img class="inventory-item" src="${url}" data-toggle="tooltip" data-placement="top" title="${item.name}">`
        });
    }
    return inventoryHtml;
}

/**
 * Creates farming html for the farming modal
 */
function buildFarming(farmingData) {
    let farmingHtml = "";
    if (farmingData.length == 0) {
        farmingHtml = "No cards to farm."
    } else {
        let cardsLeft = 0;

        farmingData.forEach((game) => {
            cardsLeft += game.cardsRemaining;
            farmingHtml += `<div class="game-farming-info">
                                <div class="game-title" data-id="${game.appId}">${game.title}</div>
                                <div class="play-time">Play time: ${game.playTime}</div>
                                <div class="cards-remaining">Cards Remaining: ${game.cardsRemaining}</div>
                            </div>`
        })

        farmingHtml = `<div>Next farming check: <span class="next-farming-check">∞</span></div>
                       <div>Games left to farm: ${farmingData.length}</div>
                       <div class="cards-left" data-cards="${cardsLeft}">Cards left: ${cardsLeft}</div>
                       ${farmingHtml}`
    }
    return farmingHtml;
}
