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

    // user list
    $.get('/admin/userlist', userlist => {
        let usersHtml = "";

        userlist.forEach(user => {
            console.log(user);
            usersHtml += ` <div class="user-item" data-id="${user._id}">
            <span class="user-name">${user.username}</span>
            <button type="button" class="btn btn-primary">Ban</button>
            <button type="button" class="btn btn-primary">Delete</button>
            </div><div`
        });

        $("#user-list").html(usersHtml);
    })

})