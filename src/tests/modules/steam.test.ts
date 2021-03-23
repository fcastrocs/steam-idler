import { SocksClientOptions } from 'socks';
import Steam from '../../modules/steam';
import * as SteamCommunity from '../../modules/steamcommunity';

const proxy = { ip: '104.227.28.124', port: 9182 };
const steamCM = { host: '162.254.193.74', port: 27026 };

const connectOptions: SocksClientOptions = {
  proxy: {
    host: proxy.ip,
    port: proxy.port,
    type: 5,
    userId: 'ccqdjjhc-dest',
    password: 'yt4v7cxsvnv6',
  },
  command: 'connect',
  destination: steamCM,
};

let sentry: Buffer, loginKey: string | undefined;
let webNonce: string, steamId: string;
let cookie: Cookie;
let steam: Steam;

jest.setTimeout(20000);

describe('Steam functions', () => {
  test('connection', async (done) => {
    const steam = new Steam();
    await steam.connect(connectOptions);
    steam.destroyConnection();
    done();
  });

  test('new login', async (done) => {
    const steam = new Steam();
    await steam.connect(connectOptions);
    const accountName = 'sky111222333@hotmail.com';
    const res = await steam.login({
      accountName,
      password: 'Chivas10@',
      twoFactorCode: 'F53GK',
      machineName: 'desktop123',
    });

    loginKey = res.auth.loginKey;
    sentry = res.auth.sentry;
    steam.destroyConnection();
    done();
  });

  test('relogin', async (done) => {
    steam = new Steam();
    await steam.connect(connectOptions);

    const accountName = 'sky111222333@hotmail.com';
    const res = await steam.login({
      accountName,
      shaSentryfile: sentry,
      loginKey,
      machineName: 'desktop123',
    });

    webNonce = res.auth.webNonce;
    steamId = res.data.steamId;
    done();
  });

  test('idle game', (done) => {
    steam.clientGamesPlayed([730]);
    done();
  });

  test('activate free game', async () => {
    const res = await steam.clientRequestFreeLicense([730]);
    expect(res.length).toBe(1);
  });

  test('web login', async (done) => {
    const res = await SteamCommunity.login(steamId, webNonce, proxy);
    cookie = res;
    done();
  });

  test('farm data', async (done) => {
    await SteamCommunity.getFarmingData(steamId, cookie, proxy);
    done();
  });

  test('inventory', async (done) => {
    await SteamCommunity.getCardsInventory(steamId, cookie, proxy);
    done();
  });
});
