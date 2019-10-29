$(() => {
    // fetch stats
    $.get("/api/idledhours", hours =>{
        $("#idled-hours").text(formatNumber(hours));
    })

    $.get("/api/steamaccscount", count =>{
        $("#accounts-count").text(formatNumber(count));
    })

    function formatNumber(num) {
        return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
      }

    // show register form if request comes from invite link
    if ($(`input[name="invitecode"]`).val()) {
        $('#slider-wrap').hide();
        $("#register-form").show();
    }

    //show change password form if request comes from recovery link
    if ($(`input[name="recoverUsername"]`).val()) {
        $('#slider-wrap').hide();
        $("#changepass-form").show();
    }

    //show login form if there is a login message, such as from register/confirm
    if ($("#login-message").text() !== "") {
        $('#slider-wrap').hide();
        $("#login-form").show();
    }

    // Show login form
    $('#login-btn').click(() => {
        $('#slider-wrap').hide()
        $("form").css("display", "none")
        $("#login-form").fadeIn(500)
    });

    // Show register form
    $('#register-btn').click(() => {
        $('#slider-wrap').hide()
        $("form").css("display", "none")
        $("#register-form").fadeIn(500)
    });

    // Show recover form
    $('#recover-btn').click(() => {
        $('#slider-wrap').hide()
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
            console.log(xhr.responseText)
            $(self).find(".alert-danger").attr("hidden", false).html(xhr.responseText);
        })
    })

    // Recover form
    $("#recover-form").submit(function (e) {
        e.preventDefault();
        // Clear danger alert
        $(this).find(".alert-danger").prop("hidden", true).text("")
        let data = $(this).serialize();
        $.post('/recovery', data, (res)=>{
            // recovery email sent
            $(this).find(".alert-success").prop("hidden", false).text(res)
            $("#recover-form-box").hide(0)
        }).fail((xhr, status, err) => {
            $(this).find(".alert-danger").prop("hidden", false).text(xhr.responseText);
        })
    })

    // change password
    $('#changepass-form').submit(function (e) {
        e.preventDefault();
        $(this).find(".alert-danger").attr("hidden", true).html("");
        let data = $("#changepass-form").serialize();
        console.log(data)
        $.post('/recovery/changepass', data, res =>{
            $(this).hide();
            // Reset recover form
            $(this).trigger("reset").hide();
            // show login form
            $("#login-message").text(res)
            $("#login-form").show();
        }).fail((xhr, status, err) => {
            $(this).find(".alert-danger").attr("hidden", false).html(xhr.responseText);
            $(this).trigger("reset")
        })
    })

    $(".show-pass").on("click", function(e){
        let type = $(`input[name="password"]`).attr("type")
        if(type === "password"){
            $(`input[name="password"]`).attr("type", "text");
            $(this).text("Hide");
        }else{
            type = "password"
            $(`input[name="password"]`).attr("type", "password");
            $(this).text("Show");
        }
    })

})