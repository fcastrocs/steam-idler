$(async () => {
    let accountsHtml = ""
    let accounts = await FetchAllAccounts();
    if (accounts.length == 0) {
        accountsHtml = `
        <div id="no-accounts">
            <p id="no-accounts-text">No steam accounts associated with your account.</p>
            <div class="btn-primary" id="big-add-acc-button" data-toggle="modal" data-target="#add-acc-modal" type="button">Add Account</div>
        </div>`
    } else {
        for (let i in accounts) {
            accountsHtml += buildAccount(accounts[i])
        }
    }
    $("#content-body").html(accountsHtml)
})