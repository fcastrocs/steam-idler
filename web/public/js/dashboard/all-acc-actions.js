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
        pauseDashboardRefresh = true;

        socket.on("logged-in", doc => {
            updateAccountStatus(doc);
        })

        $.post("/steamaccounts/login", { socketId: socket.id }, res => {
            pauseDashboardRefresh = false;
            socket.removeAllListeners();
            apiLimit = false;
            hideSpinner();
            alert(res);
        }).fail((xhr, status, err) => {
            pauseDashboardRefresh = false;
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
    *               GET GAME IN ALL ACCS                *
    * **************************************************/
    $("#all-getgame-btn").click(() => {
        // change form id so it doesn't go to actions.js
        $("#activate-game-form").removeAttr("id").attr("id", "all-activate-game-form");
        $("#activate-free-game-modal").modal("toggle");
    })

    // form submit
    $(document).on('submit', "#all-activate-game-form", function (e) {
        e.preventDefault();

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

        $.post('/steamaccounts/activatefreegame', { appIds: appIds }, res => {
            $("#activate-game-msg").prop("hidden", false).text(res.msg + "\nReloading in 3 secs.")
            $("#spinner-activate-game").prop("hidden", true)
            processGames(null, res.games)
            setTimeout(() => location.reload(), 3000);
        }).fail((xhr, status, err) => {
            $("#activate-game-errMsg").prop("hidden", false).text(xhr.responseText)
            $("#spinner-activate-game").prop("hidden", true)
            // show forma again
            $("#all-activate-game-form").prop("hidden", false)
        })
    })

    // modal hide
    $('#activate-free-game-modal').on('hidden.bs.modal', function () {
        $("#all-activate-game-form").removeAttr('id').attr("id", "activate-game-form");
        $("#activate-game-form").prop("hidden", false)
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