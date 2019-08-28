$(async () => {
    let accountsHtml = ""
    let accounts = await FetchAllAccounts();
    if (accounts.length == 0) {
        $("#body").css("display", "unset")
        accountsHtml = `
            <h2>No steam accounts associated with your account.</h2>
            <button type="button" id="big-add-btn" class="btn header-btn" data-toggle="modal" data-target="#add-acc-modal">
                Add Account
            </button>`
    } else {
        for (let i in accounts) {
            // save accounts in cache
            accounts_cache[accounts[i]._id] = accounts[i];
            // build account
            accountsHtml += buildAccount(accounts[i])
        }
    }

    $("#body-spinner").hide()
    $("#accounts-box").html(accountsHtml)

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