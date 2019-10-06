$(() => {

    /**************************************************** 
     *               LOGIN ALL ACCS                     *
     * **************************************************/
    $("#all-login-btn").click(() => {
        if (apiLimit) {
            alert("You have an ongoing request, please wait until it finished.")
            return;
        }
        alert("This may take a while, depending on how many accounts you have.");
        showSpinner();
        apiLimit = true
        socket.on("logged-in", doc => {
            updateAccountStatus(doc);
        })

        $.post("/steamaccounts/login", { socketId: socket.id }, res => {
            socket.removeAllListeners();
            apiLimit = false;
            hideSpinner();
            alert(res);
        }).fail((xhr, status, err) => {
            socket.removeAllListeners();
            apiLimit = false;
            hideSpinner();
            alert(xhr.responseText);
        })
    })

    /**************************************************** 
     *               LOGOUT ALL ACCS                    *
     * **************************************************/
    $("#all-logout-btn").click(() => {
        if (!confirm("Do you want to logout all your accounts?")) {
            return;
        }
        showSpinner();
        $.post("/steamaccounts/logout", res => {
            hideSpinner();
            location.reload();
        }).fail(xhr => {
            hideSpinner();
            alert(xhr.responseText);
        })

    })

    /**************************************************** 
    *               CHANGE ALL STATUS                  *
    * **************************************************/
    $("#all-status-btn").click(() => {
        // Change form id so it doesn't go to actions.js
        $("#set-status-form").removeAttr('id').attr("id", "all-set-status-form");
        $("#set-status-modal").modal("toggle");
    })


    $(document).on('submit', "#all-set-status-form", function (e) {
        e.preventDefault();
        // Change form id so it goes back to actions.js
        $("#all-set-status-form").removeAttr('id').attr("id", "set-status-form");
        $("#set-status-modal").modal("toggle");

        let status = $('input[name="status"]:checked').val();

        $.post("/steamaccounts/setstatus", { status: status }, () => {
            location.reload();
        }).fail(xhr => {
            alert(xhr.responseText);
        })
    })

    // Change form id so it goes back to actions.js
    $("#set-status-modal-close").click(() => {
        $("#all-set-status-form").removeAttr('id').attr("id", "set-status-form");
    })

    /**************************************************** 
    *             STOP IDLING ALL ACCOUNTS              *
    * **************************************************/
    $("#all-stopidle-btn").click(() => {
        if (!confirm("Do you want to stop idling in all your accounts?")) {
            return
        }

        $.post('/steamaccounts/stopgames', () => {
            location.reload();
        }).fail((xhr, status, err) => {
            alert(xhr.responseText);
        })


    })


    /**************************************************** 
    *                 ACTIVATE F2P GAME                 *
    * **************************************************/
    // Open modal
    $("#all-activate-f2p-game-btn").click(() => {
        // change form id so single-acc-actions doesnt handle submit
        $("#activate-f2p-game-form").removeAttr("id").attr("id", "all-activate-f2p-game-form");
        $("#activate-f2p-game").modal("toggle");
    })

    // Form Submit
    $(document).on('submit', "#all-activate-f2p-game-form", function (e) {
        e.preventDefault();

        let appIds = $("input[name=appId]").val();
        if (!appIds) {
            return
        }

        // hide the form
        $("#all-activate-f2p-game-form").prop("hidden", true);
        // show spinner
        $("#spinner-activate-f2p-game").prop("hidden", false);
        //clean any previous messages
        $("#activate-f2p-game-msg").text("").prop("hidden", true)
        $("#activate-f2p-game-errMsg").text("").prop("hidden", true)

        $.post('/steamaccounts/activatefreetoplaygames', { appIds: appIds }, res => {
            $("#activate-f2p-game-msg").prop("hidden", false).text(res.msg + "\nReloading in 3 secs.")
            $("#spinner-activate-f2p-game").prop("hidden", true)
            displayGames(res.games);
            setTimeout(() => location.reload(), 3000);
        }).fail((xhr, status, err) => {
            $("#activate-f2p-game-errMsg").prop("hidden", false).text(xhr.responseText)
            $("#spinner-activate-f2p-game").prop("hidden", true)
            // show forma again
            $("#all-activate-f2p-game-form").prop("hidden", false)
        })
    })

    // modal hide
    $('#activate-f2p-game').on('hidden.bs.modal', function () {
        $("#all-activate-f2p-game-form").removeAttr('id').attr("id", "activate-f2p-game-form");
    })


    /**************************************************** 
   *                 ACTIVATE FREE GAME                 *
   * **************************************************/
    // Open modal
    $("#all-activate-free-game-btn").click(() => {
        // change form id so single-acc-actions doesnt handle submit
        $("#activate-free-game-form").removeAttr("id").attr("id", "all-activate-free-game-form");
        $("#activate-free-game").modal("toggle");
    })

    // Form Submit
    $(document).on('submit', "#all-activate-free-game-form", function (e) {
        e.preventDefault();

        let packageId = $("input[name=packageId]").val();
        if (!packageId) {
            return
        }

        // hide the form
        $("#all-activate-free-game-form").prop("hidden", true);
        // show spinner
        $("#spinner-activate-free-game").prop("hidden", false);
        //clean any previous messages
        $("#activate-free-game-msg").text("").prop("hidden", true)
        $("#activate-free-game-errMsg").text("").prop("hidden", true)

        $.post('/steamaccounts/activatefreegame', { appIds: appIds }, res => {
            $("#activate-free-game-msg").prop("hidden", false).text(res.msg + "\nReloading in 3 secs.")
            $("#spinner-activate-free-game").prop("hidden", true)
            displayGames(res.games);
            setTimeout(() => location.reload(), 3000);
        }).fail((xhr, status, err) => {
            $("#activate-free-game-errMsg").prop("hidden", false).text(xhr.responseText)
            $("#spinner-activate-free-game").prop("hidden", true)
            // show forma again
            $("#all-activate-free-game-form").prop("hidden", false)
        })
    })

    // modal hide
    $('#activate-free-game').on('hidden.bs.modal', function () {
        $("#all-activate-free-game-form").removeAttr('id').attr("id", "activate-free-game-form");
    })


    function showSpinner() {
        $("#all-acc-actions-dropdown-box").hide()
        $("#all-acc-actions-spinner").prop("hidden", false)
    }

    function hideSpinner() {
        $("#all-acc-actions-dropdown-box").show();
        $("#all-acc-actions-spinner").prop("hidden", true)
    }


})