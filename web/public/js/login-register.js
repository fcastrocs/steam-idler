$(() => {

    // Login form
    $('#login-form').submit((e) => {
        e.preventDefault();
        let data = $('#login-form').serialize();
        $.post('/login', data, res => {
            window.location = "/"
        }).fail((xhr, status, err) => {
            $('#login-error').text(xhr.responseText);
        })
    })

    // Show register form
    $('#show-register').click(() => {
        $('#login-form').hide(1000);
        $("#register-form").removeAttr('hidden')
    });

    // Register form
    $('#register-form').submit((e) => {
        e.preventDefault();
        let data = $('#register-form').serialize();
        $.post('/register', data, res => {
            window.location = "/"
        }).fail((xhr, status, err) => {
            $("#register-error").text(xhr.responseText);
        })
    })
})