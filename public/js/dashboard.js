$(()=>{

    $('#add-steamaccount-form').submit((e) =>{
        e.preventDefault();
        let data = $('#add-steamaccount-form').serialize();
        $.post('/steamaccounts', data).done((res) =>{
            if(res.error){
                $('#add-steamacc-error').text(res.error)
            }
        })
    })
    
})