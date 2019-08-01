$(() => {
    // Get steam accounts
    $.get('steamacc/get', (accounts) => {
        let accountsHtml = ""
        for (let i in accounts) {
            accountsHtml += buildAccount(accounts[i])
        }
        if (accountsHtml === "") {
            accountsHtml = `
            <div id="no-accounts">
                <p id="no-accounts-text">No steam accounts associated with your account.</p>
                <div class="btn-primary" id="big-add-acc-button" data-toggle="modal" data-target="#add-acc-modal" type="button">Add Account</div>
            </div>`
        }
        $("#content-body").html(accountsHtml)
    })
})