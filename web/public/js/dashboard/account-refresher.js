$(() => {
    // Refresh account status every interval seconds
    let interval = 10000;
    setInterval(() => {
        refreshAccounts();
    }, interval);
})