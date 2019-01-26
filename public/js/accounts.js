$(()=>{

    $('form').submit((e) =>{
        e.preventDefault();
        $.post('account/add', (data) =>{
            console.log(data)
        })
    })
    
})