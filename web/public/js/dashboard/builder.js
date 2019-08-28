$(async () => {

    let accounts = await FetchAllAccounts();
    if (accounts.length == 0) {
        $("#body").css("display", "unset");
        $("#no-accounts-box").prop("hidden", false)
    } else {
        for (let i in accounts) {
            // save accounts in cache
            accounts_cache[accounts[i]._id] = accounts[i];
            // build account
            $("#accounts-box").append(buildAccount(accounts[i]))
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