let a = require("./mailer/")

async function test(){
    try {
        let res = await a.sendInvite("link", "fcastro16@gmail.com")
        console.log(res);
    } catch (error) {
        console.log(error);
    }
}

test();