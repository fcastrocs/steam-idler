const Steam = require('./steam')
const EventEmitter = require('events').EventEmitter;

class AccountHandler extends EventEmitter {
    constructor(user, pass){
        super();
        this.user = user;
        this.pass = pass;

        //establish a connection with steam
        //let steamCM = this.GetRanCM();
        //this.proxy = process.env.proxies.next();
        console.log('here')
        console.log(process.env.proxies.next())
        //let proxy = this.SplitProxy(this.proxy);

        /*this.options = {
            timeout: 10000, //timeout for lost connection, bad proxy
            proxy: {
                ipaddress: proxy[0],
                port: proxy[1],
                type: 4
            },
            destination: {
                host: steamCM[0],
                port: steamCM[1]
            }
        }*/
    }

    Connect(){
        this.client = new Steam(options);
        client.on('error', err =>{
            //Could not connect
            console.log('could not connect')
        })

        client.on('connected', () =>{
            console.log('connected');
        })
    }

    GetRanCM() {
        let index = Math.floor(Math.random() * process.env.steamcm)
		let server = process.env.steamcm[index].split(":");
		server[1] = parseInt(server[1]);
		return server;
    }
    
    SplitProxy(proxy) {
		let proxySplit = proxy.val.split(":");
		proxySplit[1] = parseInt(proxy[1]); //cast port to integer
		return proxySplit;
	}
}

module.exports = AccountHandler;