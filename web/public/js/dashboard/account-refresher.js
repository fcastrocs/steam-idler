$(() => {
    // Refresh account status every interval seconds
    let interval = 60000;
    setInterval(() => {
        refreshDashboard();
        console.log("dashboard refreshed")
    }, interval);
})