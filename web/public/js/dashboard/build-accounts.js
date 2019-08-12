$(async () => {
    let accountsHtml = ""
    let accounts = await FetchAllAccounts();
    if (accounts.length == 0) {
        accountsHtml = `
            <p>No steam accounts associated with your account.</p>
            <div class="btn btn-primary btn-lg btn-block" id="big-add-acc-button" data-toggle="modal" data-target="#add-acc-modal" type="button">Add Account</div>`
    } else {
        for (let i in accounts) {
            accountsHtml += buildAccount(accounts[i])
        }
    }
    $("#content-body").css("align-items", "flex-start")
    $("#content-body").html(`<div id="accounts-container">` + accountsHtml + `</div>`)
})