$(()=>{

    $('#renew-proxies').click(() =>{
        $.post('/admin/renewproxies').done(res =>{
            console.log(res);
        })
    });

    $('#renew-steamcms').click(() =>{
        $.post('/admin/renewsteamcms').done(res =>{
            console.log(res);
        })
    });

})