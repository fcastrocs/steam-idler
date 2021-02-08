const axios = require("axios").default;
const Proxy = require("../models/proxy");

// Returns proxy list from proxyscrape.com
async function GetProxies() {
  let url =
    "https://proxy.webshare.io/proxy/list/download/mmfodgnjlbzmrysmezlyenixvifrjskanzxbqwpu/-/socks/username/direct/";

  try {
    let res = await axios.get(url);
    // validate the proxies
    return res.split("\r\n").map((proxy) => {
      return proxy.replace(":ccqdjjhc-dest:yt4v7cxsvnv6", "");
    });
  } catch (error) {
    console.log(error);
    throw "Could not fetch proxy list.";
  }
}

// Gets proxy list and saves it to database
async function GetAndSaveProxies() {
  try {
    let proxiesArr = await GetProxies();
    let proxies = [];
    //Save to database
    for (let i = 0; i < proxiesArr.length; i++) {
      let proxySplit = proxiesArr[i].split(":");
      proxySplit[1] = parseInt(proxySplit[1]); //cast port to int

      let proxy = new Proxy({
        ip: proxySplit[0],
        port: proxySplit[1],
      });
      proxies.push(proxy);
    }

    await Proxy.deleteMany({}).exec();

    return new Promise((resolve, reject) => {
      Proxy.insertMany(proxies, (err, docs) => {
        if (err) {
          return reject(" - could not store proxies to db");
        }
        return resolve(docs.length);
      });
    });
  } catch (error) {
    return Promise.reject(error);
  }
}

async function GetProxyCount() {
  return new Promise((resolve) => [
    Proxy.countDocuments((err, count) => {
      return resolve(count);
    }),
  ]);
}

// Returns a random proxy from database
let GetProxy = async () => {
  let count = await GetProxyCount();

  if (count == 0) {
    return false;
  }

  let rand = Math.floor(Math.random() * count);
  return await Proxy.findOne().skip(rand).exec();
};

let RemoveProxy = async (proxy) => {
  return new Promise((resolve) => {
    proxy.remove((err) => {
      if (err) {
        console.log(err);
      }
      return resolve();
    });
  });
};

module.exports = {GetAndSaveProxies, GetProxy, RemoveProxy}