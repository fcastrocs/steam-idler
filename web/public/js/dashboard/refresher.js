$(() => {
    // Refresh account status every interval seconds
    let interval = 0.5 * 60 * 1000
    setInterval(async () => {
        try {
            let accounts = await FetchAllAccounts();
            if (accounts.length == 0) {
                return;
            }

            for (let i in accounts) {
                updateAccountStatus(accounts[i])
            }
            console.log("Dashboard refreshed.")
        } catch (error) {
            alert(error);
        }
    }, interval);
})