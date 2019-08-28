// accounts builder and refresher
$(async () => {
    $("#body-spinner").hide()
    let accounts = await FetchAllAccounts();
    if (accounts.length == 0) {
        $("#body-spinner").hide()
        $("#body").css("display", "unset");
        $("#no-accounts-box").prop("hidden", false)
    } else {
        let fade = 0
        for (let i in accounts) {
            // save accounts in cache
            accounts_cache[accounts[i]._id] = accounts[i];
            // build account
            $("#accounts-box").append(buildAccount(accounts[i]))
            let self = $(`div[data-id="${accounts[i]._id}"]`);
            self.prop("hidden", true);
            setTimeout(() => {
                self.prop("hidden", false);
            }, fade);
            fade += 50
        }
    }

    // Refresh dashboard every 30 seconds
    let interval = 1 * 60 * 1000
    setInterval(async () => {
        try {
            accounts = await FetchAllAccounts();
        } catch (error) {
            console.log(error);
            return;
        }

        for (let i in accounts) {
            // check if account should be updated
            updateAccountStatus(accounts[i])
        }
        console.log("Dashboard refreshed.")
    }, interval);
})