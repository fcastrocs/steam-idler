$(() => {

    $.ajaxSetup({
        timeout: 180000
    });

    /**************************************************** 
     *               ADD STEAM ACCOUNT                  *
     * **************************************************/
    $('#add-steamaccount-form').submit((e) => {
        e.preventDefault();

        // Hide msg
        $('#add-acc-msg').removeAttr("hidden").hide(0)
        // Hide form
        $("#add-steamaccount-form").hide(0);

        //show loading spinner
        $('#add-acc-errMsg').removeAttr("hidden").show(0).text("Wait, do not refresh the page.")
        $("#spinner").removeAttr("hidden").show(0);

        //form handler
        let data = $('#add-steamaccount-form').serialize();

        $.post('/dashboard/addacc', data, (doc) => {
            // Add account to content-body
            $("#no-accounts").hide(0);
            let account = buildAccount(doc);
            $("#content-body").append(account)

            // success message
            $('#add-acc-msg').show(0).text("Success, account added.")
            //hide spinner
            $("#spinner").hide(0)
            //hide err message
            $('#add-acc-errMsg').hide(0)
            //show form again
            $("#add-steamaccount-form").show(0);
            //hide email guard inputs
            $("#email-guard").hide(0)
            $("input[name='emailGuard").val("")
            $("#shared-secret").show(0)
            $("input[name='sharedSecret").val("")
            $("#username").show(0)
            $("input[name='user").val("")
            $("#password").show(0)
            $("input[name='pass").val("")
            //show pass, user, shared secret inputs
        }).fail((xhr, status, err) => {
            //show form again
            $("#add-steamaccount-form").show(0);
            //stop loading spinner
            $("#spinner").hide(0)

            if (xhr.responseText === "Email guard code needed") {
                $('#add-acc-msg').text("Enter email guard code").show(0)
                $('#add-acc-errMsg').hide(0)
                $("#shared-secret").hide(0);
                $("#username").hide(0);
                $("#password").hide(0);
                $("#email-guard").attr("hidden", false).show(0) //show email guard input
            } else if (xhr.responseText === "Bad User/Pass") {
                $('#add-acc-errMsg').show(0).text("Bad user/pass")
                $("input[name='pass").val("")
            } else if (xhr.responseText == "Invalid guard code") {
                $('#add-acc-errMsg').text("Invalid email guard code, retry").show(0)
                $("#username").hide();
                $("#password").hide();
                $("#shared-secret").hide();
                $("#email-guard").attr("hidden", false).show(0);
                $("input[name='emailGuard").val("")
            } else if (xhr.responseText == "Invalid shared secret") {
                $('#add-acc-errMsg').show(0).text(xhr.responseText)
                $("input[name='sharedSecret").val("")
            } else {
                $('#add-acc-msg').text(xhr.responseText).show(0)
            }
        })
    })

    /**************************************************** 
    *               STEAM - LOGIN                       *
    * **************************************************/
    $("#content-body").on('click', ".acc-login-btn", function () {
        let self = $(this).closest("div.account")
        let accountId = self.attr("data-id");
        // disable all buttons
        self.find(".account-buttons").hide();
        // enable spinner
        self.find(".acc-spinner").prop("hidden", false);
        $.post('/dashboard/loginaccount', { accountId: accountId }, doc => {
            updateAccountStatus(doc);
        }).fail((xhr, status, err) => {
            alert(xhr.responseText)
        })
    })


    /**************************************************** 
    *               STEAM - LOGOUT                      *
    * **************************************************/
    $("#content-body").on('click', ".acc-logout-btn", function () {
        let self = $(this).closest("div.account")
        let accountId = self.attr("data-id");
        // disable all buttons
        self.find(".account-buttons").hide();
        // enable spinner
        self.find(".acc-spinner").prop("hidden", false);

        $.post('/dashboard/logoutaccount', { accountId: accountId }, (doc) => {
            updateAccountStatus(doc);
        }).fail((xhr, status, err) => {
            alert(xhr.responseText)
        })
    })


    /*************************************************** 
    *               STEAM - DELETE ACC                 *
    ***************************************************/
    $("#content-body").on('click', ".acc-delete-acc-btn", function () {
        let self = $(this).closest("div.account");
        let accountId = self.attr("data-id");

        let res = confirm("Are you sure you want to delete this account?");
        if (res !== true) {
            return;
        }

        $.ajax({
            url: '/dashboard/deleteacc',
            type: 'delete',
            data: { accountId: accountId },
            success: data => {
                self.remove();
            },
            error: (xhr, status, error) => {
                alert(xhr.responseText)
            }
        });
    })

    /**************************************************** 
    *               STEAM - CHANGE NICK                 *
    * **************************************************/
    // open modal
    $("#content-body").on('click', ".nick", function () {
        let accountId = $(this).closest("div.account").attr("data-id");
        $("#change-nick-button").attr("data-id", accountId);
        $("#change-nick-modal").modal("toggle")
    })

    // form submit
    $("#change-nick-form").submit(function (e) {
        e.preventDefault();
        let accountId = $("#change-nick-button").attr("data-id");
        // get nick value
        let nickname = $("input[name='nick']").val();
        if (!nickname) {
            return
        }
        $.post('/dashboard/changenick', { nickname: nickname, accountId: accountId }, function (nick) {
            $("#change-nick-modal").modal("toggle")
            $(`div.account[data-id=${accountId}]`).find(".nick").text(nick)
        }).fail((xhr, status, err) => {
            alert(xhr.responseText)
        })
    })

    $('#change-nick-modal').on('hidden.bs.modal', function () {
        $("input[name='nick']").val("");
    })

    /**************************************************** 
    *             STEAM - SET STATUS                    *
    * **************************************************/
    // Open set status modal
    $(document).on('click', ".acc-set-status-btn", function () {
        let self = $(this).closest("div.account");
        let accountId = self.attr("data-id")
        //check radio btn with current status
        let status = self.find(".status").text();
        $(`input[value="${status}"]`).prop('checked', true);
        //open modal
        $("#set-status-button").attr("data-id", accountId)
        $("#set-status-modal").modal("toggle")
    })

    // set status submit
    $(document).on('submit', "#set-status-form", function (e) {
        e.preventDefault();
        let accountId = $("#set-status-button").attr("data-id");
        let status = $('input[name="status"]:checked').val();
        $.post('/dashboard/setstatus', { status: status, accountId: accountId }, function (doc) {
            $("#set-status-modal").modal("toggle")
            setTimeout(() => updateAccountStatus(doc), 300);
        }).fail((xhr, status, err) => {
            alert(xhr.responseText)
        })
    })

    // set status modal close
    $('#set-status-modal').on('hidden.bs.modal', function () {
        $("#set-status-form").find("input:checked").first().prop('checked', false);
    })

    /**************************************************** 
    *                  STEAM - FARMING                  *
    ***************************************************/
    $(document).on('click', ".acc-farming-btn", function () {
        let self = $(this).closest("div.account");
        //open modal
        self.find(".farming-modal").modal("toggle")
    })

    // stop farming
    $(document).on('click', ".stop-farming-btn", function (e) {
        let self = $(this).closest("div.account");
        let accountId = self.attr("data-id");
        $.post('/dashboard/stopfarming', { accountId: accountId }, doc => {
            self.find(".farming-modal").modal("toggle");
            setTimeout(() => updateAccountStatus(doc), 300);
        }).fail((xhr, status, err) => {
            self.find(".farming-errMsg").text(xhr.responseText).prop("hidden", false);
        })
    })

    // start farming
    $(document).on('click', ".start-farming-btn", function (e) {
        e.preventDefault();
        let self = $(this).closest("div.account");
        let accountId = self.attr("data-id");
        // clear error msg txt
        self.find(".farming-errMsg").text("").prop("hidden", true);
        $.post('/dashboard/startfarming', { accountId: accountId }, doc => {
            self.find(".farming-modal").modal("toggle");
            setTimeout(() => updateAccountStatus(doc), 300);
        }).fail((xhr, status, err) => {
            // set error message
            self.find(".farming-errMsg").text(xhr.responseText).prop("hidden", false)
        })
    })

    // on close modal
    $(document).on('hidden.bs.modal', ".farming-modal", function () {
        $(this).find(".farming-errMsg").text("").prop("hidden", true)
    })



    /**************************************************** 
    *               STEAM - PLAY GAME                   *
    * **************************************************/
    // Open correct modal
    $(document).on('click', ".acc-idle-game-btn", function () {
        $(this).closest("div.account").find(".idle-modal").modal('toggle');
    })

    // start game idle
    $(document).on('click', ".start-idle-btn", function () {
        let self = $(this).closest("div.account");
        let accountId = self.attr("data-id");
        let games = $(this).attr("data-games")
        if (!games) {
            self.find(".idle-errMsg").text("Select a game to idle.").prop("hidden", false)
            return
        }
        $.post('/dashboard/playgames', { accountId: accountId, games: games }, doc => {
            //close the modal
            self.find(".idle-modal").modal('toggle');
            setTimeout(() => updateAccountStatus(doc), 300);
        }).fail((xhr, status, err) => {
            alert(xhr.responseText)
        })
    })

    // stop games idle button click
    $(document).on('click', ".stop-idle-btn", function () {
        let self = $(this).closest("div.account");
        //check if accounts is idling
        let games = self.find(".start-idle-btn").attr("data-games")
        if (!games) {
            self.find(".idle-errMsg").text("Account is not idling.").prop("hidden", false)
            return;
        }

        let accountId = self.attr("data-id");
        $.post('/dashboard/stopgames', { accountId: accountId }, (doc) => {
            //close the modal
            self.find(".idle-modal").modal('toggle');
            setTimeout(() => updateAccountStatus(doc), 300);
        }).fail((xhr, status, err) => {
            alert(xhr.responseText)
        })
    })

    // on close modal
    $(document).on('hidden.bs.modal', ".idle-modal", function () {
        $(this).find(".idle-errMsg").text("Account is not idling.").prop("hidden", true)
    })


    // game image click
    $(document).on('click', ".game-img", function () {
        // Get gameID
        let gameId = $(this).attr("data-gameId");

        let start_idle_button = $(this).closest(".modal-body").find("div .start-idle-btn")
        let games = start_idle_button.attr("data-games");

        //not selected
        if ($(this).hasClass("unselected")) {
            // set image as selected
            $(this).removeClass("unselected").addClass("selected")
            $(this).closest("div.account").attr("data-id");

            // add gameId to start idle button
            //no games set
            if (!games) {
                start_idle_button.attr("data-games", gameId);
                return;
            }

            //split string into an array
            games = games.split(" ");
            //check if gameId is already in array
            let index = games.indexOf(gameId);
            //only add gameId if not in array already
            if (index < 0) {
                games.push(gameId);
                games = games.join(" ");
                start_idle_button.attr("data-games", games);
            }
        } else { //selected
            $(this).removeClass("selected").addClass("unselected")
            //no games set
            if (!games) {
                return;
            }
            //split string into an array
            games = games.split(" ");

            // check if gameId is in array
            let index = games.indexOf(gameId);
            if (index < 0) {
                return;
            }

            //delete gameId from array
            games.splice(index, 1);
            games = games.join(" ");
            start_idle_button.attr("data-games", games);
        }
    })



    /**************************************************** 
    *           STEAM - ACTIVATE FREE GAME              *
    * **************************************************/
    // Open activate game modal
    $("#content-body").on('click', ".acc-get-game-btn", function () {
        let accountId = $(this).closest("div.account").attr("data-id")
        $("#activate-free-game").attr("data-id", accountId)
        $("#activate-free-game-modal").modal("toggle")
    })

    // modal hide
    $('#activate-free-game-modal').on('hidden.bs.modal', function () {
        $(".activated-games").prop("hidden", true);
        $(".activated-game-body").html('');
        $("#activate-game-form").prop("hidden", false)
        $("input[name=appId]").val("");
        $("#activate-game-msg").prop("hidden", true).text("")
        $("#activate-game-errMsg").prop("hidden", true).text("")
    })

    // form submit
    $("body").on('submit', "#activate-game-form", function (e) {
        e.preventDefault();

        let accountId = $("#activate-free-game").attr("data-id");
        if (!accountId) {
            return;
        }

        let appIds = $("input[name=appId]").val();
        if (!appIds) {
            return
        }

        //hide form
        $("#activate-game-form").prop("hidden", true)
        // show spinner
        $("#spinner-activate-game").prop("hidden", false)
        //clean any previous messages
        $("#activate-game-msg").text("").prop("hidden", true)
        $("#activate-game-errMsg").text("").prop("hidden", true)

        $.post('/dashboard/activatefreegame', { accountId: accountId, appIds: appIds }, games => {
            $("#activate-game-errMsg").prop("hidden", true)
            $("#activate-game-msg").prop("hidden", false).text("Game(s) activated.")
            processGames(accountId, games);
            //hide spinner
            $("#spinner-activate-game").prop("hidden", true)
        }).fail((xhr, status, err) => {
            $("#activate-game-form").prop("hidden", false)
            $("#spinner-activate-game").prop("hidden", true)
            $("#activate-game-errMsg").prop("hidden", false).text(`${xhr.responseText}`)
        })
    })


    /**************************************************** 
    *           STEAM - REDEEM KEY                      *
    * **************************************************/
    // Open redeem key modal
    $("#content-body").on('click', ".redeem-key", function () {
        let accountId = $(this).closest("div.account").attr("data-id")
        $("#redeem-key").attr("data-id", accountId)
        $("#redeem-key-modal").modal("toggle")
    })


    // close redeem key modal
    $('#redeem-key-modal').on('hidden.bs.modal', function () {
        $(".activated-games").prop("hidden", true);
        $(".activated-game-body").html('');
        $("#redeem-key-form").prop("hidden", false);
        $("input[name=cdkey]").val("");
        $("#redeem-key-msg").prop("hidden", true).text("")
        $("#redeem-key-errMsg").prop("hidden", true).text("")
    })

    // cdkey form submit
    $("#redeem-key-form").submit(function (e) {
        e.preventDefault();
        let accountId = $("#redeem-key").attr("data-id");
        if (!accountId) {
            return;
        }

        let cdkey = $("input[name=cdkey]").val();
        if (!cdkey) {
            return
        }

        $("#spinner-redeem-key").prop("hidden", false)

        // hide form
        $("#redeem-key-form").prop("hidden", true)
        // clear previous messages
        $("#redeem-key-msg").prop("hidden", true).text("")
        $("#redeem-key-errMsg").prop("hidden", true).text("")

        $.post('/dashboard/redeemkey', { accountId: accountId, cdkey: cdkey }, games => {
            $("#redeem-key-msg").prop("hidden", false).text("Successfully added games")
            processGames(accountId, games)
            $("#spinner-redeem-key").prop("hidden", true)
        }).fail((xhr, status, err) => {
            $("#redeem-key-errMsg").prop("hidden", false).text(xhr.responseText)
            $("#redeem-key-form").prop("hidden", false)
            $("#spinner-redeem-key").prop("hidden", true)
        })
    })


    /**************************************************** 
    *                  STEAM - IVENTORY                 *
     **************************************************/
    $(document).on('click', ".acc-inventory-btn", function () {
        let self = $(this).closest("div.account");
        //open modal
        self.find(".inventory-modal").modal("toggle")
    })

})