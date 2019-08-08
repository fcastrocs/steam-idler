$(() => {

    $('#renew-proxies').click(() => {
        $.post('/admin/renewproxies').done(res => {
            console.log(res);
        })
    });

    $('#renew-steamcms').click(() => {
        $.post('/admin/renewsteamcms').done(res => {
            console.log(res);
        })
    });


    $('#send-invite-form').submit(function (e) {
        e.preventDefault();
        let data = $('#send-invite-form').serialize();
        $.post('/admin/sendinvite', data, (res) => {
            alert(res);
        }).fail((xhr, status, err) => {
            alert(xhr.responseText)
        })

    });

})