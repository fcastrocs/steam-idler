$(() => {

    // show register form if request comes from invite link
    if ($(`input[name="invitecode"]`).val()) {
        $('#info').hide();
        $("#register-form").show();
    }

    //show change password form if request comes from recovery link
    if ($(`input[name="recoverUsername"]`).val()) {
        $('#info').hide();
        $("#changepass-form").show();
    }

    // Show register form
    $('#login-btn').click(() => {
        $('#info').hide()
        $("form").css("display", "none")
        $("#login-form").fadeIn(500)
    });

    // Show register form
    $('#register-btn').click(() => {
        $('#info').hide()
        $("form").css("display", "none")
        $("#register-form").fadeIn(500)
    });

    // Show recover form
    $('#recover-btn').click(() => {
        $('#info').hide()
        $("form").css("display", "none")
        $("#recover-form").fadeIn(500)
    });

    // Login form
    $('#login-form').submit(function (e) {
        e.preventDefault();
        let self = this;
        let data = $('#login-form').serialize();
        $(this).find(".text-success").hide(0);
        $(this).find(".alert-danger").text("").attr("hidden", true)
        $.post('/login', data, res => {
            window.location = "/"
        }).fail((xhr, status, err) => {
            $(self).find(".alert-danger").text(xhr.responseText).attr("hidden", false)
        })
    })

    // Register form
    $('#register-form').submit(function (e) {
        e.preventDefault();
        let self = this;

        $(this).find(".alert-success").attr("hidden", true).html("");
        $(this).find(".alert-danger").attr("hidden", true).html("");

        let data = $('#register-form').serialize();
        $.post('/register', data, function (res) {
            $(self).find(".alert-success").attr("hidden", false).html(res)
            $("#register-inputs-box").hide(0);
        }).fail((xhr, status, err) => {
            $(self).find(".alert-danger").attr("hidden", false).html(xhr.responseText);
        })
    })

    // Recover form
    $("#recover-form").submit(function (e) {
        e.preventDefault();

        $(this).find(".alert-danger").attr("hidden", true).html("");
        let self = this;
        let data = $(this).serialize();
        $.post('/recovery', data, function (res) {
            $(self).find(".alert-success").attr("hidden", false).html(res)
            $("#recover-form-box").hide(0)
        }).fail((xhr, status, err) => {
            $(self).find(".alert-danger").attr("hidden", false).html(xhr.responseText);
        })
    })

    // change password
    $('#changepass-form').submit(function (e) {
        e.preventDefault();

        $(this).find(".alert-danger").attr("hidden", true).html("");

        let self = this;
        let data = $("#changepass-form").serialize();

        $.post('/recovery/changepass', data, function (res) {
            window.location = res;
        }).fail((xhr, status, err) => {
            $(self).find(".alert-danger").attr("hidden", false).html(xhr.responseText);
        })
    })

})