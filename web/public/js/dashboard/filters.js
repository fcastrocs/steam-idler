$(() => {

    let filterIntervalId = null;
    let interval = 10000

    // SHOW ALL
    $("#show-all-filter").click(() => {
        count = 0;
        clearInterval(filterIntervalId)
        $(".account").each(function (index) {
            count = index;
            $(this).show();
        })
        $("#current-filter-txt").text(`Showing All > ${count + 1} accounts`)
    })

    // SHOW ONLINE
    $("#show-online-filter").click(() => {
        clearInterval(filterIntervalId)
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
            $("#current-filter-txt").text(`Showing Online > ${count} accounts`)
        }
    })


    // SHOW OFFLINE
    $("#show-offline-filter").click(() => {
        clearInterval(filterIntervalId)
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
            $("#current-filter-txt").text(`Showing Offline > ${count} accounts`)
        }
    })

    // SHOWING RECONNECTING
    $("#show-reconnecting-filter").click(() => {
        clearInterval(filterIntervalId)
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
            $("#current-filter-txt").text(`Showing Reconnecting > ${count} accounts`)
        }
    })

    // SHOWING BAD
    $("#show-bad-filter").click(() => {
        clearInterval(filterIntervalId)
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
            $("#current-filter-txt").text(`Showing Bad > ${count} accounts`)
        }
    })

    // SHOWING IN-GAME
    $("#show-idling-filter").click(() => {
        clearInterval(filterIntervalId)
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
            $("#current-filter-txt").text(`Showing In-Game > ${count} accounts`)
        }
    })

    // SHOWING NOT IN-GAME
    $("#show-notingame-filter").click(() => {
        clearInterval(filterIntervalId)
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
            $("#current-filter-txt").text(`Showing Not In-Game > ${count} accounts`)
        }
    })

    // SHOWING FARMING
    $("#show-farming-filter").click(() => {
        clearInterval(filterIntervalId)
        filterIntervalId = setInterval(() => filter(), interval);
        filter()
        function filter() {
            let count = 0
            $(".account").each(function (index) {
                let status = $(this).find(".farming-mode").text();
                if (status !== "Farming: off") {
                    count++;
                    $(this).show();
                } else {
                    $(this).hide(0)
                }
            })
            $("#current-filter-txt").text(`Showing Farming > ${count} accounts`)
        }
    })

    // SHOWING FARMABLE
    $("#show-farmable-filter").click(() => {
        clearInterval(filterIntervalId)
        filterIntervalId = setInterval(() => filter(), interval);
        filter()
        function filter() {
            let count = 0
            $(".account").each(function (index) {
                let carsleft = $(this).find(".info > .cards-left").text();
                if (carsleft !== "Cards left: 0") {
                    count++;
                    $(this).show();
                } else {
                    $(this).hide(0)
                }
            })
            $("#current-filter-txt").text(`Showing Farmable > ${count} accounts`)
        }
    })

})