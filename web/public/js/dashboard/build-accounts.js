$(async () => {
    let accountsHtml = ""
    let accounts = await FetchAllAccounts();
    if (accounts.length == 0) {
        $("#body").css("display", "unset")
        accountsHtml = `
            <h2>No steam accounts associated with your account.</h2>
            <button type="button" id="big-add-btn" class="btn header-btn" data-toggle="modal" data-target="#add-acc-modal">Add Account</button>`
    } else {
        for (let i in accounts) {
            accountsHtml += buildAccount(accounts[i])
        }
    }

    $("#body-spinner").hide()
    $("#accounts-box").html(accountsHtml)
})