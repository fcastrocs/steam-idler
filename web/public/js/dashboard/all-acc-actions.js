$(() => {

    /**************************************************** 
     *               LOGIN ALL ACCS                 *
     * **************************************************/
    $("#sidebar-login").click(() => {
        let accountIds = getAllAccountIds();

        if (accountIds.length == 0) {
            alert("You do not have any accounts.")
            return;
        }

        alert("Okay, please wait until accounts come online.")
        let interval = 0
        accountIds.forEach(accountId => {
            interval += 100;
            setTimeout(() => {
                $.post("/dashboard/loginaccount", { accountId: accountId })
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

        alert("Okay, please wait until accounts come offline.")

        let interval = 0
        accountIds.forEach(accountId => {
            interval += 100;
            setTimeout(() => {
                $.post("/dashboard/logoutaccount", { accountId: accountId })
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
        alert("Okay, please wait until accounts change status.")


        let accountIds = getAllAccountIds();
        let status = $('input[name="status"]:checked').val();

        let interval = 0
        accountIds.forEach(accountId => {
            interval += 100;
            setTimeout(() => {
                $.post("/dashboard/setstatus", { accountId: accountId, status: status })
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

    $("body").on('submit', "#all-activate-game-form", function (e) {
        e.preventDefault();
        // Change form id so it goes back to actions.js
        $("#all-activate-game-form").removeAttr('id').attr("id", "activate-game-form");
        $("#activate-free-game-modal").modal("toggle");
        alert("Okay, please wait ultil game(s) activate.")


        let accountIds = getAllAccountIds();
        if(accountIds.length == 0){
            return
        }

        let appIds = $("input[name=appId]").val();
        if (!appIds) {
            return
        }

        let interval = 0
        accountIds.forEach(accountId => {
            interval += 100;
            setTimeout(() => {
                $.post('/dashboard/activatefreegame', { accountId: accountId, appIds: appIds })
            }, interval);
        })
    })

    // Change form id so it goes back to actions.js
    $(".activate-free-game-close").click(() => {
        $("#all-activate-game-form").removeAttr('id').attr("id", "activate-game-form");
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