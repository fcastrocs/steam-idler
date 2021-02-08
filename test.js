const request = require("request-promise-native");

async function GetProxies() {
  let url =
    "https://proxy.webshare.io/proxy/list/download/mmfodgnjlbzmrysmezlyenixvifrjskanzxbqwpu/-/socks/username/direct/";

  let proxyList = null;
  try {
    let res = await request.get(url);
    // validate the proxies
    proxyList = res.split("\r\n").map((proxy) => {
      return proxy.replace(":ccqdjjhc-dest:yt4v7cxsvnv6", "");
    });

    console.log(proxyList);

    return Promise.resolve(proxyList);
  } catch (error) {
    return Promise.reject("Could not fetch proxy list.");
  }
}
