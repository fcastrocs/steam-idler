$(() => {

    // Add new account
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

        $.post('/dashboard/addacc', data, (res) => {
            $('#add-acc-msg').show(0).text("Account successfully added.")
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
                $("#email-guard").removeAttr("hidden"); //show email guard input
            } else if (xhr.responseText === "Bad User/Pass") {
                $('#add-acc-errMsg').show(0).text("Bad user/pass")
                $("input[name='pass").val("")
            } else if (xhr.responseText == "Invalid guard code") {
                $('#add-acc-errMsg').text("Invalid email guard code, retry").show(0)
                $("#username").hide();
                $("#password").hide();
                $("#shared-secret").hide();
                $("#email-guard").removeAttr("hidden");
                $("input[name='emailGuard").val("")
            }else if(xhr.responseText == "Invalid shared secret"){
                $('#add-acc-errMsg').show(0).text(xhr.responseText)
                $("input[name='sharedSecret").val("")
            } else {
                $('#add-acc-msg').text(xhr.responseText).show(0)
            }
        })
    })

    // steam account login
    $("#content-body").on('click', ".acc-login", function () {
        let self = $(this).closest("div.account")
        let accountId = self.attr("data-id");

        // disable all buttons
        self.find(".account-buttons").first().hide(0);
        // enable login-wait spinner
        self.find(".login-wait").first().attr("hidden", false);

        $.post('/dashboard/loginaccount', { accountId: accountId }, (res) => {

            // disable login-wait spinner
            self.find("div .login-wait").first().attr("hidden", true);
            // enable all buttons
            self.find(".account-buttons").first().show(0)

            // hide login button
            $(this).attr('hidden', true);

            // show correct buttons
            let buttons = self.find(".account-buttons").first()
            buttons.find("button.acc-logout").attr("hidden", false);
            buttons.find("button.idle-game").attr("hidden", false);
            buttons.find("button.redeem-key").attr("hidden", false);
            buttons.find("button.get-game").attr("hidden", false);

            // change appropiate css
            self.removeClass("account-offline").addClass(`account-${res}`)
            self.find(".info .status").first().removeClass("status-offline").addClass(`status-${res}`).text(res)
            self.find("a .avatar").first().removeClass("avatar-offline").addClass(`avatar-${res}`);
        }).fail((xhr, status, err) => {
            alert(xhr.responseText)
        })
    })


    // steam account logout
    $("#content-body").on('click', ".acc-logout", function () {
        let self = $(this).closest("div.account")
        let accountId = self.attr("data-id");


        // disable all buttons
        self.find(".account-buttons").first().hide(0);
        // enable login-wait spinner
        self.find(".login-wait").first().attr("hidden", false);

        $.post('/dashboard/logoutaccount', { accountId: accountId }, (res) => {
            // disable login-wait spinner
            self.find("div .login-wait").first().attr("hidden", true);
            // enable all buttons
            self.find(".account-buttons").first().show(0)

            // hide all buttons except login and delete
            let buttons = self.find(".account-buttons").first()
            buttons.find("button.acc-login").attr("hidden", false);
            buttons.find("button.acc-logout").attr("hidden", true);
            buttons.find("button.idle-game").attr("hidden", true);
            buttons.find("button.redeem-key").attr("hidden", true);
            buttons.find("button.get-game").attr("hidden", true);

            // change appropiate css
            self.removeClass("account-in-game").removeClass("account-online").addClass(`account-offline`)
            self.find(".info .status").first().removeClass("status-in-game").removeClass("status-online").addClass(`status-offline`).text(res)
            self.find("a .avatar").first().removeClass("avatar-in-game").removeClass("avatar-online").addClass(`avatar-offline`);
        }).fail((xhr, status, err) => {
            alert(xhr.responseText)
        })
    })



    // logout account from steam
    $("#content-body").on('click', ".play-game", function () {
        let accountId = $(this).closest("div.account").attr("data-id");

        // disable login button
        $(this).attr('disabled', true);
        // enable loader
        $(this).children().first().removeAttr("hidden")

        $.post('/dashboard/playgames', { accountId: accountId }).done((res) => {
            if (res === "okay") {
                // add online css
                $(`div.account-online[data-id=${accountId}]`).removeClass("account-online").addClass("account-offline")
                // remove login button
                $(this).attr('hidden', true);
                // add login button
                $(`button.acc-login[data-id=${accountId}]`).attr('hidden', false);
            } else {
                alert(res);
            }
        })
    })

    //open correct game modal
    $("#content-body").on('click', ".idle-game", function () {
        let id = $(this).closest("div.account").attr("data-id");
        $(`#${id}.modal`).modal('toggle');
    })

    //open correct change nick modal
    $("#content-body").on('click', ".nick", function () {
        let self = $(this).closest("div.account");
        self.find(".change-nick-modal").first().modal("toggle")
    })

    // game image click
    $("#content-body").on('click', ".game-img", function () {
        // Get gameID
        let gameId = $(this).attr("data-gameId");

        let start_idle_button = $(this).closest(".modal-body").find("div .start-idle")
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


    // start game idle
    $("#content-body").on('click', ".start-idle", function () {
        let self = $(this).closest("div.account");
        let accountId = self.attr("data-id");
        let games = $(this).attr("data-games")
        if (!games) {
            alert("No games selected.")
            return
        }

        $.post('/dashboard/playgames', { accountId: accountId, games: games }, function (res) {
            //set ingame status
            self.removeClass("account-online").addClass(`account-in-game`)
            self.find(".info .status").removeClass("status-online").addClass(`status-in-game`).text(res)
            self.find("a img.avatar").removeClass("avatar-online").addClass(`avatar-in-game`);
        }).fail((xhr, status, err) => {
            alert(xhr.responseText)
        })
    })

    // start games idle
    $("#content-body").on('click', ".stop-idle", function () {
        let self = $(this).closest("div.account");
        let accountId = self.attr("data-id");
        $.post('/dashboard/stopgames', { accountId: accountId }, function (res) {
            //set online status
            self.removeClass("account-in-game").addClass(`account-online`)
            self.find(".info .status").removeClass("status-in-game").addClass(`status-online`).text(res)
            self.find("a img.avatar").removeClass("avatar-in-game").addClass(`avatar-online`);
        }).fail((xhr, status, err) => {
            alert(xhr.responseText)
        })
    })



    $("#content-body").on('submit', '.change-nick-form', function (e) {
        e.preventDefault();

        let self = $(this).closest("div.account");
        let accountId = self.attr("data-id");

        //form handler
        let nickname = $(this).serializeArray()[0].value;
        if (!nickname) {
            return
        }

        $.post('/dashboard/changenick', { nickname: nickname, accountId: accountId }, function (res) {
            self.find(".change-nick-modal").first().modal("toggle");
            self.find(".nick").first().text(nickname)
        }).fail((xhr, status, err) => {
            alert(xhr.responseText)
        })
    })





    // start games idle
    $("#content-body").on('click', ".delete-acc", function () {
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
})