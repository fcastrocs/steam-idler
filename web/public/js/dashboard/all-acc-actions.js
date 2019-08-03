$(() => {

    function checkCompletedReq(received, sent) {
        if (received == sent) {
            $("#sidebar-menu").show(0)
            $("#sidebar-spinner").attr("hidden", true);
            $("#sidebar-msg").delay(4000).hide(0);
            $("#sidebar-errMsg").delay(4000).hide(0);
            refreshDashboard();
        }
    }

    /**************************************************** 
     *               LOGIN ALL ACCS                     *
     * **************************************************/
    $("#sidebar-login").click(() => {
        let accountIds = getAllAccountIds();

        if (accountIds.length == 0) {
            alert("You do not have any accounts.")
            return;
        }

        $("#sidebar-menu").hide(0);
        $("#sidebar-spinner").attr("hidden", false);

        let goodResponse = 0;
        let badResponse = 0;
        let interval = 0

        accountIds.forEach(accountId => {
            interval += 100;
            setTimeout(() => {
                $.post("/dashboard/loginaccount", { accountId: accountId }, () => {
                    goodResponse++;
                    $("#sidebar-msg").attr("hidden", false).text(`${goodResponse} accounts logged in.`).show(0);
                    checkCompletedReq((goodResponse + badResponse), accountIds.length)
                }).fail((xhr, status, err) => {
                    badResponse++;
                    //$("#sidebar-errMsg").attr("hidden", false).text(`${badResponse} of ${accountIds.length} accounts failed.`).show(0)
                    checkCompletedReq((goodResponse + badResponse), accountIds.length)
                })
            }, interval);
        })

    })

    /**************************************************** 
     *               LOGOUT ALL ACCS                    *
     * **************************************************/
    $("#sidebar-logout").click(() => {
        let accountIds = getAllAccountIds();

        if (accountIds.length == 0) {
            alert("You do not have any accounts.")
            return;
        }

        $("#sidebar-menu").hide(0);
        $("#sidebar-spinner").attr("hidden", false);

        let goodResponse = 0;
        let badResponse = 0;
        let interval = 0

        accountIds.forEach(accountId => {
            interval += 100;
            setTimeout(() => {
                $.post("/dashboard/logoutaccount", { accountId: accountId }, () => {
                    goodResponse++;
                    $("#sidebar-msg").attr("hidden", false).text(`${goodResponse} accounts logged out.`).show(0);
                    checkCompletedReq((goodResponse + badResponse), accountIds.length)
                }).fail((xhr, status, err) => {
                    badResponse++;
                    checkCompletedReq((goodResponse + badResponse), accountIds.length)
                })
            }, interval);
        })
    })

    /**************************************************** 
    *               CHANGE ALL STATUS                  *
    * **************************************************/
    $("#sidebar-status").click(() => {
        // Change form id so it doesn't go to actions.js
        $("#set-status-form").removeAttr('id').attr("id", "all-set-status-form");
        $("#set-status-modal").modal("toggle");
    })


    $("body").on('submit', "#all-set-status-form", function (e) {
        e.preventDefault();
        // Change form id so it goes back to actions.js
        $("#all-set-status-form").removeAttr('id').attr("id", "set-status-form");
        $("#set-status-modal").modal("toggle");

        let accountIds = getAllAccountIds();
        if (accountIds.length == 0) {
            alert("You do not have any accounts.")
            return;
        }

        let status = $('input[name="status"]:checked').val();

        $("#sidebar-menu").hide(0);
        $("#sidebar-spinner").attr("hidden", false);

        let goodResponse = 0;
        let badResponse = 0;
        let interval = 0

        accountIds.forEach(accountId => {
            interval += 100;
            setTimeout(() => {
                $.post("/dashboard/setstatus", { accountId: accountId, status: status }, () => {
                    goodResponse++;
                    $("#sidebar-msg").attr("hidden", false).text(`${goodResponse} accounts set status.`).show(0);
                    checkCompletedReq((goodResponse + badResponse), accountIds.length)
                }).fail((xhr, status, err) => {
                    badResponse++;
                    checkCompletedReq((goodResponse + badResponse), accountIds.length)
                })
            }, interval);
        })
    })

    // Change form id so it goes back to actions.js
    $("#set-status-modal-close").click(() => {
        $("#all-set-status-form").removeAttr('id').attr("id", "set-status-form");
    })


    /**************************************************** 
    *               GET GAME IN ALL ACCS                *
    * **************************************************/
    $("#sidebar-getGame").click(() => {
        // change form id so it doesn't go to actions.js
        $("#activate-game-form").removeAttr("id").attr("id", "all-activate-game-form");
        $("#activate-free-game-modal").modal("toggle");
    })

    // form submit
    $("body").on('submit', "#all-activate-game-form", function (e) {
        e.preventDefault();

        let accountIds = getAllAccountIds();
        if (accountIds.length == 0) {
            return
        }

        let appIds = $("input[name=appId]").val();
        if (!appIds) {
            return
        }

        // hide the form
        $("#all-activate-game-form").hide(0);
        // show spinner
        $("#spinner-activate-game").attr("hidden", false).show(0)
        //clean any previous messages
        $("#activate-game-msg").text("").hide(0)
        $("#activate-game-errMsg").text("").hide(0)

        let interval = 0
        let activated = 0;
        let fail = 0;
        accountIds.forEach((accountId, index) => {
            interval += 100;
            setTimeout(() => {
                $.post('/dashboard/activatefreegame', { accountId: accountId, appIds: appIds }, games => {
                    activated += 1
                    $("#activate-game-msg").removeAttr("hidden", false).text(`Game(s) activated in ${activated} accounts.`).show(0)
                    processGames(accountId, games)

                    if (index == accountIds.length - 1) {
                        $("#spinner-activate-game").hide(0)
                    }
                }).fail((xhr, status, err) => {
                    fail += 1
                    $("#activate-game-errMsg").removeAttr("hidden", false).text(`${xhr.responseText} ${fail} accounts.`).show(0)
                    if (index == accountIds.length - 1) {
                        $("#spinner-activate-game").hide(0)
                        // show forma again
                        $("#all-activate-game-form").show(0);
                    }
                })
            }, interval);
        })
    })

    // modal hide
    $('#activate-free-game-modal').on('hidden.bs.modal', function () {
        $("#all-activate-game-form").removeAttr('id').attr("id", "activate-game-form");
        $("#activate-game-form").show(0)
    })

    /**************************************************** 
    *             STOP IDLING ALL ACCOUNTS              *
    * **************************************************/
    $("#sidebar-stopIdling").click(() => {
        let accountIds = getAllAccountIds();

        if (accountIds.length == 0) {
            alert("You do not have any accounts.")
            return;
        }
    })

    function getAllAccountIds() {
        let accountIds = []
        $(".account").each(function () {
            accountIds.push($(this).attr("data-id"))
        })
        return accountIds;
    }

})