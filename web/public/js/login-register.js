$(() => {

    if($(`input[name="invitecode"]`).val()){
        $('#login-form').hide(0);
        $("#register-form").removeAttr('hidden')
    }

    // Login form
    $('#login-form').submit(function(e){
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

    // Show register form
    $('#show-register').click(() => {
        $('#login-form').hide(1000);
        $("#register-form").removeAttr('hidden')
    });

    // Register form
    $('#register-form').submit(function(e){
        e.preventDefault();
        let self = this;

        $(this).find(".alert-success").attr("hidden", true).html("");
        $(this).find(".alert-danger").attr("hidden", true).html("");

        let data = $('#register-form').serialize();
        $.post('/register', data, function(res){
            $(self).find(".alert-success").attr("hidden", false).html(res)
            $("#register-inputs-box").hide(0);
        }).fail((xhr, status, err) => {
            $(self).find(".alert-danger").attr("hidden", false).html(xhr.responseText);
        })
    })
})