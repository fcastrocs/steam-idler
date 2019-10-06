$(() => {
    /***************************************************
    *               ADD STEAM ACCOUNT                  *
    * **************************************************/
    $('#add-steamaccount-form').submit((e) => {
        e.preventDefault();

        //clear previous listeners
        socket.removeAllListeners();

        // Hide form
        $("#add-steamaccount-form").prop("hidden", true)
        // show warning
        $("#add-acc-warning-msg").prop("hidden", false)
        // clear and hide messages
        $('#add-acc-console').prop("hidden", true).html("");
        $('#add-acc-error-msg').prop("hidden", true).text("")
        $('#add-acc-success-msg').prop("hidden", true);

        // get form data and transform it into an object
        let data = $('#add-steamaccount-form').serializeArray();
        let dataObj = new Object();
        data.forEach(item => {
            if (item.value === "") {
                return;
            }
            dataObj[`${item.name}`] = item.value;
        })

        /*********************************
        *          LOG MESSAGES         *
        ********************************/
        socket.on("login-log-msg", msg => {
            let newMsg = `<p>• ${msg}</p>${$('#add-acc-console').html()}`
            $('#add-acc-console').html(newMsg).prop("hidden", false);
        })

        /********************************
        *          ERROR MESSAGE        *
        ********************************/
        socket.on("add-acc-error-msg", msg => {
            // hide warning message
            $("#add-acc-warning-msg").prop("hidden", true);
            // show error msg
            $('#add-acc-error-msg').prop("hidden", false).text(msg)

            /********************************
            *          EMAIL GUARD          *
            ********************************/
            if (msg === "Invalid email guard code." || msg === "Email guard code needed.") {
                // show email guard form
                $("#email-guard-form").prop("hidden", false);
                $("#email-guard-form")[0].reset();

                $('#email-guard-form').submit((e) => {
                    e.preventDefault();
                    // show warning
                    $("#add-acc-warning-msg").prop("hidden", false);
                    // hide form
                    $("#email-guard-form").prop("hidden", true)
                    // hide error msg
                    $('#add-acc-error-msg').text("").prop("hidden", true);
                    // get code
                    let code = $("input[name='emailGuard").val();
                    if (!code) {
                        return;
                    }
                    socket.emit("email-guard", code)
                })

            }

            /********************************
            *         SHARED SECRET         *
            ********************************/
            else if (msg === "Invalid shared secret.") {
                // show form
                $("#add-steamaccount-form").prop("hidden", false);
                $("input[name='sharedSecret").val("");
            }
            /********************************
            *         BAD PASSWORD          *
            ********************************/
            else {
                // show form
                $("#add-steamaccount-form").prop("hidden", false);
                $("#add-steamaccount-form")[0].reset();
            }
        })

        socket.on("logged-in", doc => {
            $('#add-acc-success-msg').prop("hidden", false);
            // Show form
            $('#add-steamaccount-form')[0].reset();
            $("#add-steamaccount-form").prop("hidden", false);
            // hide warning message
            $("#add-acc-warning-msg").prop("hidden", true)
            // Add account to content-body
            $("#no-accounts").hide(0);
            let account = buildAccount(doc);
            $("#accounts-box").append(account)

            //clear listeners
            socket.removeAllListeners();
        })

        // attach the socketId to data
        dataObj.socketId = socket.id

        // send request
        $.post('/steamaccount/add', dataObj);
    })

    //  modal close, clean everythinkg
    $('#add-acc-modal').on('hidden.bs.modal', function () {
        // show form
        $("#add-steamaccount-form").prop("hidden", false)
        // Reset form
        $('#add-steamaccount-form')[0].reset();
        // hide warning
        $("#add-acc-warning-msg").prop("hidden", true)
        // clear and hide messages
        $('#add-acc-console').prop("hidden", true).text("");
        $('#add-acc-error-msg').prop("hidden", true).text("")
        $('#add-acc-success-msg').prop("hidden", true);
        // email guard form
        $("#email-guard-form").prop("hidden", true);
        $("#email-guard-form")[0].reset();
    })

    /**************************************************** 
    *               STEAM - LOGIN                       *
    * **************************************************/
    $(document).on('click', ".acc-login-btn", function () {
        if (apiLimit) {
            alert("You have an ongoing request. Use the Actions button to login all accounts at once.")
            return;
        }

        apiLimit = true;

        let self = $(this).closest("div.account")
        let accountId = self.attr("data-id");
        // hide buttons
        self.find(".acc-buttons").hide();
        // show console box
        consoleBox = self.find(".console");
        consoleBox.prop("hidden", false).html("")

        socket.removeAllListeners();

        /*********************************
        *          LOG MESSAGES         *
        ********************************/
        socket.on("login-log-msg", msg => {
            let newMsg = `<p>• ${msg}</p>${consoleBox.html()}`
            consoleBox.html(newMsg).prop("hidden", false);
        })

        socket.on("logged-in", doc => {
            apiLimit = false;
            socket.removeAllListeners();
            updateAccountStatus(doc);
        })

        // send request
        $.post('/steamaccount/login', { accountId: accountId, socketId: socket.id })
            .fail((xhr, status, err) => {
                apiLimit = false;
                socket.removeAllListeners();
                alert(xhr.responseText)
            })
    })


    /**************************************************** 
    *               STEAM - LOGOUT                      *
    * **************************************************/
    $(document).on('click', ".acc-logout-btn", function () {
        let self = $(this).closest("div.account")
        let accountId = self.attr("data-id");
        // hide all buttons
        self.find("#acc-buttons").hide();
        // enable spinner
        self.find(".acc-spinner").prop("hidden", false);

        $.post('/steamaccount/logout', { accountId: accountId }, (doc) => {
            //clear intervals
            clearInterval(farmingTaskIds[accountId])
            clearInterval(lastReconnectTaskIds[accountId])
            updateAccountStatus(doc);
        }).fail((xhr, status, err) => {
            alert(xhr.responseText)
        })
    })


    /*************************************************** 
    *               STEAM - DELETE ACC                 *
    ***************************************************/
    $(document).on('click', ".acc-delete-acc-btn", function () {
        let self = $(this).closest("div.account");
        let accountId = self.attr("data-id");

        let res = confirm("Are you sure you want to delete this account?");
        if (res !== true) {
            return;
        }

        $.ajax({
            url: '/steamaccount',
            type: 'delete',
            data: {
                accountId: accountId
            },
            success: () => self.fadeOut(800),
            error: (xhr, status, error) => alert(xhr.responseText)
        });
    })

    /**************************************************** 
    *               STEAM - CHANGE NICK                 *
    * **************************************************/
    // open modal
    $(document).on('click', ".change-nick", function (e) {
        e.preventDefault();
        let accountId = $(this).closest("div.account").attr("data-id")
        $("#change-nick-button").attr("data-id", accountId);
        $("#change-nick-modal").modal("toggle")
    })

    // form submit
    $("#change-nick-form").submit(function (e) {
        e.preventDefault();
        let accountId = $("#change-nick-button").attr("data-id");
        // get nick value
        let nickname = $("input[name='nick']").val();
        $.post('/steamaccount/changenick', { nickname: nickname, accountId: accountId }, function (nick) {
            $("#change-nick-modal").modal("toggle")
            $(`div.account[data-id=${accountId}]`).find(".persona-name").text(nick)
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
    $(document).on('click', ".acc-set-status-btn", function (e) {
        e.preventDefault();
        let self = $(this).closest("div.account");
        let accountId = self.attr("data-id")
        //check radio btn with current status
        let status = accounts_cache[accountId].forcedStatus;
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
        $.post('/steamaccount/setstatus', { status: status, accountId: accountId }, function (doc) {
            $("#set-status-modal").modal("toggle")
            setTimeout(() => updateAccountStatus(doc), 300);
        }).fail((xhr, status, err) => {
            alert(xhr.responseText)
        })
    })

    // set status modal close
    $('#set-status-modal').on('hidden.bs.modal', function () {
        $("#set-status-form").find("input:checked").prop('checked', false);
    })

    /**************************************************** 
    *                  STEAM - FARMING                  *
    ***************************************************/
    // open modal
    $(document).on('click', ".acc-farming-btn", function (e) {
        e.preventDefault();
        let self = $(this).closest("div.account");
        //open modal
        self.find(".farming-modal").modal("toggle")
    })

    // stop farming
    $(document).on('click', ".stop-farming-btn", function (e) {
        let self = $(this).closest("div.account");
        let accountId = self.attr("data-id");
        $.post('/steamaccount/stopfarming', { accountId: accountId }, doc => {
            self.find(".farming-modal").modal("toggle");
            // clear the interval
            clearInterval(farmingTaskIds[accountId])
            setTimeout(() => updateAccountStatus(doc), 300);
        }).fail((xhr, status, err) => {
            alert(xhr.responseText)
        })
    })

    // start farming
    $(document).on('click', ".start-farming-btn", function (e) {
        e.preventDefault();
        let self = $(this).closest("div.account");
        let accountId = self.attr("data-id");

        $.post('/steamaccount/startfarming', { accountId: accountId }, doc => {
            self.find(".farming-modal").modal("toggle");
            setTimeout(() => updateAccountStatus(doc), 300);
        }).fail((xhr, status, err) => {
            alert(xhr.responseText)
        })
    })


    /**************************************************** 
    *               STEAM - PLAY GAME                   *
    * **************************************************/
    // Open correct modal
    $(document).on('click', ".acc-idle-game-btn", function (e) {
        e.preventDefault();
        $(this).closest("div.account").find(".idle-modal").modal('toggle');
    })

    // start game idle
    $(document).on('click', ".start-idle-btn", function () {
        let self = $(this).closest("div.account");
        let accountId = self.attr("data-id");

        if (accounts_cache[accountId].isFarming) {
            alert("Cannot start idle while account is farming cards.")
            return;
        }

        let games = accounts_cache[accountId].selectedGames;
        if (games.length == 0) {
            alert("Select a game to idle.")
            return
        }

        $.post('/steamaccount/playgames', { accountId: accountId, games: games }, doc => {
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
        let accountId = self.attr("data-id")
        // can't stop idling if account is farming
        if (accounts_cache[accountId].isFarming) {
            alert("Cannot stop idling while account is farming cards.")
            return;
        }

        //check if accounts is idling
        if (accounts_cache[accountId].selectedGames.length == 0) {
            alert("Account is not idling.")
            return;
        }

        $.post('/steamaccount/stopgames', { accountId: accountId }, (doc) => {
            //close the modal
            self.find(".idle-modal").modal('toggle');
            // clear selected games
            accounts_cache[accountId].selectedGames = [];
            setTimeout(() => updateAccountStatus(doc), 300);
        }).fail((xhr, status, err) => {
            alert(xhr.responseText)
        })
    })

    // game image click
    $(document).on('click', ".game-img", function () {
        // Get gameID
        let gameId = $(this).attr("data-gameId");
        let accountId = $(this).closest("div.account").attr("data-id")

        if (accounts_cache[accountId].isFarming) {
            alert("Cannot make changes while account is farming cards.")
            return;
        }

        let cache = accounts_cache[accountId];

        //not selected
        if ($(this).hasClass("unselected")) {
            // set image as selected
            $(this).removeClass("unselected").addClass("selected")
            $(this).closest("div.account").attr("data-id");

            // Add game to selected games
            cache.selectedGames.push(gameId)
        } else { //selected
            $(this).removeClass("selected").addClass("unselected")

            let index = cache.selectedGames.indexOf(gameId)
            cache.selectedGames.splice(index, 1)
        }
    })


    /**************************************************** 
    *           STEAM - ACTIVATE F2P GAME              *
    * **************************************************/
    // Open modal
    $(document).on('click', ".activate-f2p-game", function (e) {
        e.preventDefault();
        let accountId = $(this).closest("div.account").attr("data-id")
        $("#activate-f2p-game-submit").attr("data-id", accountId)
        $("#activate-f2p-game").modal("toggle")
    })

    // modal hide
    $('#activate-f2p-game').on('hidden.bs.modal', function () {
        $("#activate-f2p-game-form").prop("hidden", false)
        $("input[name=appId]").val("");
        $("#activate-f2p-game-msg").prop("hidden", true).text("")
        $("#activate-f2p-game-errMsg").prop("hidden", true).text("")
    })

    // form submit
    $("body").on('submit', "#activate-f2p-game-form", function (e) {
        e.preventDefault();
        //hide form
        $("#activate-f2p-game-form").prop("hidden", true)
        // show spinner
        $("#spinner-activate-f2p-game").prop("hidden", false)
        //clean any previous messages
        $("#activate-f2p-game-msg").text("").prop("hidden", true)
        $("#activate-f2p-game-errMsg").text("").prop("hidden", true)

        let accountId = $("#activate-f2p-game-submit").attr("data-id");
        let appIds = $("input[name='appId']").val();

        $.post('/steamaccount/activatefreetoplaygames', { accountId: accountId, appIds: appIds }, games => {
            displayGames(games);
            $("#activate-f2p-game-msg").prop("hidden", false).text("Game(s) activated." + " Reloading in 3 secs.")
            $("#spinner-activate-f2p-game").hide();
            setTimeout(() => location.reload(), 3000);
        }).fail((xhr, status, err) => {
            $("#activate-f2p-game-form").prop("hidden", false)
            $("#spinner-activate-f2p-game").prop("hidden", true)
            $("#activate-f2p-game-errMsg").prop("hidden", false).text(`${xhr.responseText}`)
        })
    })


     /**************************************************** 
    *           STEAM - ACTIVATE FREE GAME              *
    * **************************************************/
    // Open modal
    $(document).on('click', ".activate-free-game", function (e) {
        e.preventDefault();
        let accountId = $(this).closest("div.account").attr("data-id")
        $("#activate-free-game-submit").attr("data-id", accountId)
        $("#activate-free-game").modal("toggle")
    })

    // modal hide
    $('#activate-free-game').on('hidden.bs.modal', function () {
        $("#activate-free-game-form").prop("hidden", false)
        $("input[name=packageId]").val("");
        $("#activate-free-game-msg").prop("hidden", true).text("")
        $("#activate-free-game-errMsg").prop("hidden", true).text("")
    })

    // form submit
    $("body").on('submit', "#activate-free-game-form", function (e) {
        e.preventDefault();
        //hide form
        $("#activate-free-game-form").prop("hidden", true)
        // show spinner
        $("#spinner-activate-free-game").prop("hidden", false)
        //clean any previous messages
        $("#activate-free-game-msg").text("").prop("hidden", true)
        $("#activate-free-game-errMsg").text("").prop("hidden", true)

        let accountId = $("#activate-free-game-submit").attr("data-id");
        let packageId = $("input[name='packageId']").val();

        $.post('/steamaccount/activatefreegame', { accountId: accountId, packageId: packageId }, games => {
            displayGames(games);
            $("#activate-free-game-msg").prop("hidden", false).text("Game(s) activated." + " Reloading in 3 secs.")
            $("#spinner-activate-free-game").hide();
            setTimeout(() => location.reload(), 3000);
        }).fail((xhr, status, err) => {
            $("#activate-free-game-form").prop("hidden", false)
            $("#spinner-activate-free-game").prop("hidden", true)
            $("#activate-free-game-errMsg").prop("hidden", false).text(`${xhr.responseText}`)
        })
    })


    /**************************************************** 
    *           STEAM - REDEEM KEY                      *
    * **************************************************/
    // Open redeem key modal
    $(document).on('click', ".redeem-key", function (e) {
        e.preventDefault();
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
        let cdkey = $("input[name=cdkey]").val();

        $("#spinner-redeem-key").prop("hidden", false)

        // hide form
        $("#redeem-key-form").prop("hidden", true)
        // clear previous messages
        $("#redeem-key-msg").prop("hidden", true).text("")
        $("#redeem-key-errMsg").prop("hidden", true).text("")

        $.post('/steamaccount/redeemkey', { accountId: accountId, cdkey: cdkey }, games => {
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
    $(document).on('click', ".acc-inventory-btn", function (e) {
        e.preventDefault();
        let self = $(this).closest("div.account");
        self.find(".inventory-modal").modal("toggle")
    })

    /**************************************************** 
    *              STEAM - AVATAR CHANGE                *
     **************************************************/

    // open avatar modal
    $(document).on("click", ".change-avatar-btn", function (e) {
        e.preventDefault(); // This will prevent page scroll
        let self = $(this).closest("div.account");
        let accountId = self.attr("data-id")
        $("#change-avatar-modal").modal("toggle")
        $("#change-avatar-btn").attr("data-id", accountId)
    })

    // image preview
    $("#avatar-file").change(function () {
        let file = this.files[0];
        if (file) {
            let reader = new FileReader();
            reader.onload = e => {
                $('#avatar-preview').attr('src', e.target.result);
            }
            reader.readAsDataURL(file);
        }
    });

    $("#change-avatar-form").submit(function (e) {
        e.preventDefault();
        let accountId = $("#change-avatar-btn").attr("data-id");
        if (!accountId) {
            alert("Accound Id is needed.")
            return;
        }

        let file = $('#avatar-file').get(0).files[0];
        if (!file) {
            alert("Select an image.")
            return;
        }

        if (!file.type.match(/^image\//)) {
            alert("Select a valid image type.")
            return;
        }

        $("#change-avatar-spinner").prop("hidden", false);
        $(this).hide();

        let ext = file.type.substring(6)
        let filename = `avatar.${ext}`

        let reader = new FileReader();
        reader.onload = e => {
            let binaryImg = e.target.result;

            //send request
            let data = {
                accountId: accountId,
                binaryImg: binaryImg,
                filename: filename
            }
            $.post('/steamaccount/changeavatar', data, avatar => {
                $(`div.account[data-id=${accountId}]`).find(".avatar").attr("src", avatar)
                $('#change-avatar-modal').modal("toggle")
            }).fail((xhr, status, err) => {
                $('#change-avatar-modal').modal("toggle")
                alert(xhr.responseText)
            })

        }
        reader.readAsBinaryString(file);
    })

    // change avatar modal close
    $('#change-avatar-modal').on('hidden.bs.modal', function () {
        $("#change-avatar-spinner").prop("hidden", true);
        $("#change-avatar-form").show();
        $("#change-avatar-form")[0].reset();
        $("#avatar-preview").attr("src", "http://placehold.it/150x150")
    })


    /**************************************************
    *              STEAM - CLEAR ALIASES             *
    **************************************************/
    // Open redeem key modal
    $(document).on('click', ".clear-aliases-btn", function (e) {
        e.preventDefault();
        let accountId = $(this).closest("div.account").attr("data-id")
        $("#clear-aliases-btn").attr("data-id", accountId)
        $("#clear-aliases-modal").modal("toggle")
    })

    $("#clear-aliases-form").submit(function (e) {
        e.preventDefault();

        $("#clear-aliases-spinner").prop("hidden", false);
        $(this).hide();

        let accountId = $("#clear-aliases-btn").attr("data-id")

        $.post('/steamaccount/clearaliases', { accountId: accountId }, () => {
            $(this).show();
            $("#clear-aliases-spinner").prop("hidden", true);
            $('#clear-aliases-modal').modal("toggle")
        }).fail((xhr, status, err) => {
            $("#clear-aliases-spinner").prop("hidden", true);
            $(this).show();
            alert(xhr.responseText)
        })
    })

    /************************************************** 
    *              STEAM - CHANGE PRIVACY             *
    **************************************************/
    // Open change privacy modal
    $(document).on('click', ".change-privacy-btn", function (e) {
        e.preventDefault(); // This will prevent page scroll
        let accountId = $(this).closest("div.account").attr("data-id")
        $("#change-privacy-btn").attr("data-id", accountId)
        $("#change-privacy-modal").modal("toggle")
    })

    // set account settings
    $("#change-privacy-modal").on('shown.bs.modal', function (e) {
        let accountId = $("#change-privacy-btn").attr("data-id")
        if (!accounts_cache[accountId].privacySettings) {
            return;
        }

        let data = accounts_cache[accountId].privacySettings

        // checkboxes first
        for (let name in data.Privacy) {
            if (name === "PrivacyInventoryGifts" || name === "PrivacyPlaytime") {
                continue;
            }
            $(`[name="${name}"]`).val(data.Privacy[name])
        }

        // set checkboxes
        if (data.Privacy.PrivacyPlaytime === "1") {
            $(`[name="PrivacyPlaytime"]`).prop("checked", true)
        }

        if (data.Privacy.PrivacyInventoryGifts === "1") {
            $(`[name="PrivacyInventoryGifts"]`).prop("checked", true)
        }

        // set eCommentPermission
        $(`[name="eCommentPermission"]`).val(data.eCommentPermission)

    })


    // form submit
    $("#change-privacy-form").submit(function (e) {
        e.preventDefault();

        $("#change-privacy-form").hide();
        $("#change-privacy-spinner").prop("hidden", false);

        let accountId = $("#change-privacy-btn").attr("data-id");
        let data = $(this).serializeArray();

        let dataObj = new Object();
        dataObj.Privacy = new Object();

        data.forEach(item => {
            if (item.name === "eCommentPermission") {
                dataObj["eCommentPermission"] = item.value;
            } else {
                dataObj["Privacy"][`${item.name}`] = item.value;
            }
        })

        // if checked then should be private value 1
        if ($(`[name="PrivacyPlaytime"]`).is(":checked")) {
            dataObj.Privacy.PrivacyPlaytime = "1"
        } else { // public value 3
            dataObj.Privacy.PrivacyPlaytime = "3"
        }

        if ($(`[name="PrivacyInventoryGifts"]`).is(":checked")) {
            dataObj.Privacy.PrivacyInventoryGifts = "1"
        } else { // public value 3
            dataObj.Privacy.PrivacyInventoryGifts = "3"
        }

        $.post('/steamaccount/changeprivacy', { accountId: accountId, formData: dataObj }, () => {
            $('#change-privacy-modal').modal("toggle")
            $("#change-privacy-spinner").prop("hidden", true);
            accounts_cache[accountId].privacySettings = dataObj;
            $(this).show();
        }).fail((xhr, status, err) => {
            $("#change-privacy-spinner").prop("hidden", true);
            $(this).show();
            alert(xhr.responseText)
        })

    })

    $("#gamedetails-privacy").change(function () {
        // PRIVATE
        if ($(this).val() === "1") {
            $("#playtime-privacy").prop("checked", true).prop('disabled', true)
        } else {
            $("#playtime-privacy").prop('disabled', false)
        }
    })

    $("#inventory-privacy").change(function () {
        // PRIVATE
        if ($(this).val() === "1") {
            $("#inventory-gifts-privacy").prop("checked", true).prop('disabled', true)
        } else {
            $("#inventory-gifts-privacy").prop('disabled', false)
        }
    })


    // modify form based on selected settings
    $("#profile-privacy").change(function () {

        // FRIENDS ONLY
        if ($(this).val() === "2") {
            $("#playtime-privacy").prop('disabled', false)
            $("#inventory-gifts-privacy").prop('disabled', false)

            // disable public options
            $("#change-privacy-form").find('select').each(function () {
                let self = this;
                //don't disable anything for #profile-privacy
                if ($(this).is('#profile-privacy')) {
                    return
                }

                let publicSelected = false;
                $(this).children().each(function () {
                    // hide and disable public option
                    if ($(this).text() === "Public") {
                        if ($(self).val() === $(this).val()) {
                            publicSelected = true;
                        }
                        $(this).prop("disabled", true).hide();
                    }

                    if ($(this).text() === "Friends Only") {
                        $(this).prop("disabled", false).show();
                        if (publicSelected) {
                            $(self).val($(this).val())
                        }
                    }
                })
            })
        }

        // PRIVATE - disable friends only and public
        if ($(this).val() === "1") {
            // play time should be checked when profile is private
            $("#playtime-privacy").prop("checked", true).prop('disabled', true)
            $("#inventory-gifts-privacy").prop("checked", true).prop('disabled', true)

            // disable public options
            $("#change-privacy-form").find('select').each(function () {
                let self = this;
                //don't disable anything for #profile-privacy
                if ($(this).is('#profile-privacy')) {
                    return
                }

                $(this).children().each(function () {
                    if (($(this).text() === "Public") || ($(this).text() === "Friends Only")) {
                        $(this).prop("disabled", true).hide();
                    }

                    if ($(this).text() === "Private") {
                        $(self).val($(this).val())
                    }
                })
            })
        }

        // PUBLIC - show all options
        if ($(this).val() === "3") {
            $("#playtime-privacy").prop('disabled', false)
            $("#inventory-gifts-privacy").prop('disabled', false)

            // disable public options
            $("#change-privacy-form").find('select').each(function () {
                //don't disable anything for #profile-privacy
                if ($(this).is('#profile-privacy')) {
                    return
                }
                $(this).children().each(function () {
                    $(this).prop("disabled", false).show();
                })
            })
        }
    })


})