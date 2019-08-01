$(() => {
    // Refresh account status every interval seconds
    let interval = 5000;
    setInterval(() => {
        $.get('steamacc/get', (accounts) => {
            for (let i in accounts) {
                // find account div
                let self = $(`.account[data-id="${accounts[i]._id}"]`)
                let status = self.find(".status").first().text();

                // Check if status has changed
                if (status === accounts[i].status) {
                    continue;
                }

                let account = buildAccount(accounts[i])

                // Replace old acc with this one
                self.replaceWith(account);
            }
        })
    }, interval);
})