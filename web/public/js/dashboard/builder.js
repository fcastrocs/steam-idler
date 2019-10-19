$(async () => {

    // build accounts
    (async function builder() {
        let accounts = await FetchAllAccounts();
        g_accountsLength = accounts.length;
        for (let i in accounts) {
            // save accounts in cache
            accounts_cache[accounts[i]._id] = accounts[i];
            // build account
            $("#accounts-box").append(buildAccount(accounts[i]))
            if (accounts[i].status === "Online" || accounts[i].status === "In-game") {
                g_online++;
            } else {
                g_offline++;
            }
        }
    })();

    // refresh accounts every minute
    let interval = 1 * 60 * 1000
    setInterval(async () => {
        let online = 0;
        let offline = 0;
        let accounts = await FetchAllAccounts();
        g_accountsLength = accounts.length;
        for (let i in accounts) {
            // check if account should be updated
            updateAccountStatus(accounts[i])
            if (accounts[i].status === "Online" || accounts[i].status === "In-game") {
                online++;
            } else {
                offline++
            }
        }
        g_online = online;
        g_offline = offline;

    }, interval);

    //refresh accounts stats
    setInterval(() => {
        $("#accounts-stats").text(`Accounts: ${g_accountsLength}
        \t|\tOnline: ${g_online}
        \t|\tOffline: ${g_offline}`);
    }, 2000);

})