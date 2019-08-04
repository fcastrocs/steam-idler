$(() => {
    // Refresh account status every interval seconds
    let interval = 30000;
    setInterval(() => {
        refreshAccounts();
    }, interval);
})