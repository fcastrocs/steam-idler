$(() => {

    let filterIntervalId = null;
    let interval = 3000
    let alertShown = false;

    // SHOW ALL
    $("#show-all-filter").click(() => {
        resetFilters()

        let count = 0;
        $(".account").each(function (index) {
            count = index;
            $(this).show();
        })
        $("#current-filter-txt").text(`All > ${count + 1} accs`)
        if(count == 0){
            showAlert("No accounts to show.")
        }
    })

    // SHOW ONLINE
    $("#show-online-filter").click(() => {
        resetFilters()

        filterIntervalId = setInterval(() => filter(), interval);
        filter()
        function filter() {
            let count = 0
            $(".account").each(function (index) {
                if ($(this).hasClass("account-Bad") || $(this).hasClass("account-Reconnecting")
                    || $(this).hasClass("account-Offline")) {
                    $(this).hide();
                } else {
                    count++;
                    $(this).show();
                }
            })
            $("#current-filter-txt").text(`Online > ${count} accs`)
            if(count == 0){
                showAlert("No accounts online.")
            }
        }
    })


    // SHOW OFFLINE
    $("#show-offline-filter").click(() => {
        resetFilters()

        filterIntervalId = setInterval(() => filter(), interval);
        filter()
        function filter() {
            let count = 0;
            $(".account").each(function () {
                if (!$(this).hasClass("account-Offline")) {
                    $(this).hide();
                } else {
                    count++;
                    $(this).show();
                }
            })
            $("#current-filter-txt").text(`Offline > ${count} accs`)
            if (count == 0) {
                showAlert("No accounts offline.")
            }
        }
    })

    // SHOWING RECONNECTING
    $("#show-reconnecting-filter").click(() => {
        resetFilters()

        filterIntervalId = setInterval(() => filter(), interval);
        filter()
        function filter() {
            let count = 0;
            $(".account").each(function () {
                if (!$(this).hasClass("account-Reconnecting")) {
                    $(this).hide();
                } else {
                    count++;
                    $(this).show();
                }
            })
            $("#current-filter-txt").text(`Reconnecting > ${count} accs`)
            if (count == 0) {
                showAlert("No accounts reconnecting.")
            }
        }
    })

    // SHOWING BAD
    $("#show-bad-filter").click(() => {
        resetFilters()

        filterIntervalId = setInterval(() => filter(), interval);
        filter()
        function filter() {
            let count = 0;
            $(".account").each(function () {
                if (!$(this).hasClass("account-Bad")) {
                    $(this).hide();
                } else {
                    count++;
                    $(this).show();
                }
            })
            $("#current-filter-txt").text(`Bad > ${count} accs`)
            if (count == 0) {
                showAlert("No bad accounts.")
            }
        }
    })

    // SHOWING IN-GAME
    $("#show-idling-filter").click(() => {
        resetFilters()

        filterIntervalId = setInterval(() => filter(), interval);
        filter()
        function filter() {
            let count = 0;
            $(".account").each(function () {
                if ($(this).find(".avatar").hasClass("avatar-In-game")) {
                    count++;
                    $(this).show();
                } else {
                    $(this).hide();
                }
            })
            $("#current-filter-txt").text(`In-Game > ${count} accs`)
            // no in-game  accounts
            if (count == 0) {
                showAlert("No accounts in-game.")
            }
        }
    })

    // SHOWING NOT IN-GAME
    $("#show-notingame-filter").click(() => {
        resetFilters()

        filterIntervalId = setInterval(() => filter(), interval);
        filter()
        function filter() {
            let count = 0
            $(".account").each(function (index) {
                if ($(this).hasClass("account-Bad") || $(this).hasClass("account-Reconnecting")
                    || $(this).hasClass("account-Offline")) {
                    $(this).hide();
                } else {
                    // not in game
                    if (!$(this).find(".avatar").hasClass("avatar-In-game")) {
                        count++;
                        $(this).show();
                    } else {
                        $(this).hide(0)
                    }
                }
            })
            $("#current-filter-txt").text(`Not In-Game > ${count} accs`)
            if (count == 0) {
                showAlert("No accounts not in-game.");
            }
        }
    })

    // SHOWING FARMING
    $("#show-farming-filter").click(() => {
        resetFilters()

        filterIntervalId = setInterval(() => filter(), interval);
        filter()
        function filter() {
            let count = 0
            $(".account").each(function (index) {
                let status = $(this).find(".farming-item").text();
                if (status.includes("off")) {
                    $(this).hide()
                } else {
                    count++;
                    $(this).show();
                }
            })
            $("#current-filter-txt").text(`Farming > ${count} accs`)
            if (count == 0) {
                showAlert("No accounts farming.");
            }
        }
    })

    // SHOWING FARMABLE
    $("#show-farmable-filter").click(() => {
        resetFilters()

        filterIntervalId = setInterval(() => filter(), interval);
        filter()
        function filter() {
            let count = 0
            $(".account").each(function () {
                let cardsleft = $(this).find(".cards-remaining").data("cards");
                if (cardsleft === "0" || !cardsleft) {
                    $(this).hide()
                } else {
                    count++;
                    $(this).show();
                }
            })
            $("#current-filter-txt").text(`Farmable > ${count} accs`)
            if (count == 0) {
                showAlert("No accounts with available cards to farm");
            }
        }
    })

    function resetFilters(){
        $("#alert-filters").remove();
        clearInterval(filterIntervalId)
        alertShown = false;
    }

    function showAlert(msg) {
        if(alertShown){
            return
        }
        alertShown = true;
        $("#accounts-box").append(`<div id="alert-filters" class="alert alert-dark alert-dismissible">
            ${msg}
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
            </button>
            </div>`)
    }

})