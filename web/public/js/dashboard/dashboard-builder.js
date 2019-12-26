/* eslint-disable no-undef */
$(async () => {

    // build accounts
    (async function builder() {
        let accounts = await FetchAllAccounts();
        g_accountsLength = accounts.length;

        let idledSeconds = 0;
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

            idledSeconds += accounts[i].idledSeconds;
        }

        g_totalSecondsIdled = idledSeconds;

    })();

    // refresh accounts every minute
    let interval = 0.5 * 60 * 1000
    setInterval(async () => {
        let online = 0;
        let offline = 0;
        let accounts = await FetchAllAccounts();
        g_accountsLength = accounts.length;
        let idledSeconds = 0;

        for (let i in accounts) {
            // check if account should be updated
            updateAccountStatus(accounts[i])
            if (accounts[i].status === "Online" || accounts[i].status === "In-game") {
                online++;
            } else {
                offline++
            }
            idledSeconds += accounts[i].idledSeconds;
        }

        g_totalSecondsIdled = idledSeconds;
        g_online = online;
        g_offline = offline;

    }, interval);

    //refresh accounts stats
    setInterval(() => {
        $("#accounts-stats").html(`<div>Accounts: ${g_accountsLength}
        \t|\tOnline: ${g_online}
        \t|\tOffline: ${g_offline}</div><div>Total Hours Idled: ${time(g_totalSecondsIdled, "hrs", true)}</div>`);
    }, 2000);

})