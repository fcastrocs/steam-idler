$(() => {

    /**************************************************** 
     *               LOGIN ALL ACCS                     *
     * **************************************************/
    $("#sidebar-login").click(() => {
        let accountIds = getAllAccountIds();

        if (accountIds.length == 0) {
            alert("You do not have any accounts.")
            return;
        }

        $("#sidebar-menu").prop("hidden", true)
        $("#sidebar-spinner").prop("hidden", false)

        let goodResponse = 0;
        let badResponse = 0;
        let interval = 0;
        accountIds.forEach(accountId => {
            setTimeout(() => {
                $.post("/steamaccount/login", { accountId: accountId }, (doc) => {
                    goodResponse++;
                    $("#sidebar-msg").prop("hidden", false).text(`${goodResponse} accounts logged in.`).show()
                    updateAccountStatus(doc);
                    checkCompletedReq((goodResponse + badResponse), accountIds.length)
                }).fail((xhr, status, err) => {
                    badResponse++;
                    $("#sidebar-errMsg").attr("hidden", false).text(`${badResponse} accounts failed.`).show()
                    checkCompletedReq((goodResponse + badResponse), accountIds.length)
                })
            }, interval);
            interval += 300;
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

        $("#sidebar-menu").prop("hidden", true)
        $("#sidebar-spinner").prop("hidden", false)

        let goodResponse = 0;
        let badResponse = 0;
        accountIds.forEach(accountId => {
            $.post("/steamaccount/logout", { accountId: accountId }, (doc) => {
                goodResponse++;
                $("#sidebar-msg").prop("hidden", false).text(`${goodResponse} accounts logged out.`).show()
                updateAccountStatus(doc);
                checkCompletedReq((goodResponse + badResponse), accountIds.length)
            }).fail((xhr, status, err) => {
                badResponse++;
                $("#sidebar-errMsg").attr("hidden", false).text(`${badResponse} accounts failed.`).show()
                checkCompletedReq((goodResponse + badResponse), accountIds.length)
            })

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


    $(document).on('submit', "#all-set-status-form", function (e) {
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

        $("#sidebar-menu").prop("hidden", true)
        $("#sidebar-spinner").prop("hidden", false)

        let goodResponse = 0;
        let badResponse = 0;
        accountIds.forEach(accountId => {
            $.post("/steamaccount/setstatus", { accountId: accountId, status: status }, (doc) => {
                goodResponse++;
                $("#sidebar-msg").prop("hidden", false).text(`${goodResponse} accounts set status.`).show()
                updateAccountStatus(doc);
                checkCompletedReq((goodResponse + badResponse), accountIds.length)
            }).fail((xhr, status, err) => {
                badResponse++;
                $("#sidebar-errMsg").attr("hidden", false).text(`${badResponse} accounts failed.`).show()
                checkCompletedReq((goodResponse + badResponse), accountIds.length)
            })
        })
    })

    // Change form id so it goes back to actions.js
    $("#set-status-modal-close").click(() => {
        $("#all-set-status-form").removeAttr('id').attr("id", "set-status-form");
    })

    /**************************************************** 
    *             STOP IDLING ALL ACCOUNTS              *
    * **************************************************/
    $("#sidebar-stopIdling").click(() => {
        if(!confirm("Are you sure you want to stop all accounts from idling?")){
            return
        }

        let accountIds = getAllAccountIds();

        if (accountIds.length == 0) {
            alert("You do not have any accounts.")
            return;
        }

        //hide sidebar and show spinner
        $("#sidebar-menu").prop("hidden", true)
        $("#sidebar-spinner").prop("hidden", false)

        let goodResponse = 0;
        let badResponse = 0;
        accountIds.forEach(accountId => {
            $.post('/steamaccount/stopgames', { accountId: accountId }, (doc) => {
                goodResponse++;
                $("#sidebar-msg").attr("hidden", false).text(`${goodResponse} accounts stopped idling.`).show();
                checkCompletedReq((goodResponse + badResponse), accountIds.length)
                updateAccountStatus(doc);
            }).fail((xhr, status, err) => {
                badResponse++;
                $("#sidebar-errMsg").attr("hidden", false).text(`${badResponse} accounts failed.`).show()
                checkCompletedReq((goodResponse + badResponse), accountIds.length)
            })
        })

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
        $("#all-activate-game-form").prop("hidden", true)
        // show spinner
        $("#spinner-activate-game").prop("hidden", false)
        //clean any previous messages
        $("#activate-game-msg").text("").prop("hidden", true)
        $("#activate-game-errMsg").text("").prop("hidden", true)

        let activated = 0;
        let fail = 0;
        accountIds.forEach((accountId, index) => {
            $.post('/steamaccount/activatefreegame', { accountId: accountId, appIds: appIds }, games => {
                activated += 1
                $("#activate-game-msg").prop("hidden", false).text(`Game(s) activated in ${activated} accounts.`)
                processGames(accountId, games)
                // hide the spinner on last response
                if (index == accountIds.length - 1) {
                    $("#spinner-activate-game").prop("hidden", true)
                }
            }).fail((xhr, status, err) => {
                fail += 1
                $("#activate-game-errMsg").prop("hidden", false).text(`${xhr.responseText} ${fail} accounts.`)
                if (index == accountIds.length - 1) {
                    $("#spinner-activate-game").prop("hidden", true)
                    // show forma again
                    $("#all-activate-game-form").prop("hidden", false)
                }
            })
        })
    })

    // modal hide
    $('#activate-free-game-modal').on('hidden.bs.modal', function () {
        $("#all-activate-game-form").removeAttr('id').attr("id", "activate-game-form");
        $("#activate-game-form").prop("hidden", false)
    })


    function checkCompletedReq(received, sent) {
        if (received == sent) {
            $("#sidebar-menu").prop("hidden", false)
            $("#sidebar-spinner").prop("hidden", true)
            $("#sidebar-msg").delay(5000).fadeOut();
            $("#sidebar-errMsg").delay(5000).fadeOut();
        }
    }
})