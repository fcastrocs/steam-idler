const axios = require("axios").default;

async function GetProxies() {
  let url =
    "https://proxy.webshare.io/proxy/list/download/mmfodgnjlbzmrysmezlyenixvifrjskanzxbqwpu/-/socks/username/direct/";

  try {
    let res = await axios.get(url);
    // validate the proxies
    return res.data.split("\r\n").map((proxy) => {
      return proxy.replace(":ccqdjjhc-dest:yt4v7cxsvnv6", "");
    });
  } catch (error) {
    console.log(error);
    throw "Could not fetch proxy list.";
  }
}

(async () => {
    let proxies = await GetProxies();
    console.log(proxies);
})();
