$(()=>{
    // Login form
    $('#login-form').submit((e) =>{
        e.preventDefault();
        let data = $('#login-form').serialize();
        $.post('/login', data).done(res =>{
            if(res.error){
                $('#login-error').text(res.error);
            }else{
                window.location = `/dashboard/${res.username}`
            }
        })
    });
    
    // Show register form
    $('#show-register').click(() =>{
        $('#login-form').hide(1000);
        $("#register-form").removeAttr('hidden')
    });

    // Register form
    $('#register-form').submit(e=>{
        e.preventDefault();
        let data = $('#register-form').serialize();
        $.post('/register', data).done(res =>{
            if(res.error){
                $("#register-error").text(res.error);
                return;
            }
            //redirect to index page
            window.location = "/"
        })
    });
})