$(() => {

    $('#renew-proxies').click(function(){
        $(this).prop("disabled", true);
        $.post('/admin/renewproxies').done(count => {
            $(this).prop("disabled", false);
            alert(`${count} proxies fetched.`)
        }).fail((xhr, status, err) => {
            $(this).prop("disabled", false);
            alert(xhr.responseText)
        })
    });

    $('#renew-steamcms').click(function(){
        $(this).prop("disabled", true);
        $.post('/admin/renewsteamcms').done(count => {
            $(this).prop("disabled", false);
            alert(`${count} Steam CMs fetched.`)
        }).fail((xhr, status, err) => {
            $(this).prop("disabled", false);
            alert(xhr.responseText)
        })
    });


    // Send invite
    $('#send-invite-form').submit(function (e) {
        e.preventDefault();
        $("#invite-btn").prop("disabled", true);
        let data = $('#send-invite-form').serialize();
        $.post('/admin/sendinvite', data, res => {
            $(this)[0].reset();
            $("#invite-btn").prop("disabled", false);
            alert(res);
        }).fail((xhr, status, err) => {
            $("#invite-btn").prop("disabled", false);
            $(this)[0].reset();
            alert(xhr.responseText)
        })
    });

})