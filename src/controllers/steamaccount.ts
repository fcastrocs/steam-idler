import { Request, Response } from "express";
import { SocksClientOptions } from "socks";
import ModelSteamAcc, { ISteamAccDoc } from "../models/steamaccount";
import Steam from "../modules/steam";
import * as SteamCommunity from "../modules/steamcommunity";
import ModelProxy, { IProxyDoc } from "../models/proxy";
import ModelSteamCM from "../models/steamcm";
import SteamVerify from "../modules/steamverify";
import SteamMap from "../modules/steammap";
import retry from "retry";
import ModelSteamAccStatus from "../models/steamAccStatus";
import { LoginRes } from "../@types/controllers";
import { startFarming, stopFarmingInterval } from "./steamfarmer";
import SteamFarm from "../modules/steamfarmer";

const UNEXPECTED = "unexpected error";
const ACCNOTONLINE = "This account is not online.";
const ACCNOTFOUND = "This account does not exists.";
const BADBODY = "Body passed is incorrect.";

/**
 * Add new account
 * @route
 */
export async function add(req: Request, res: Response): Promise<unknown> {
  const userId = req.session.userId || "";
  const accountName = req.body.accountName;

  if (!req.body.password) return res.status(400).send(BADBODY);

  if (SteamVerify.get(userId)) {
    return res.status(400).send("This Steam account is waiting for veritifaction.");
  }

  if (SteamMap.has(userId, accountName)) {
    return res.status(400).send("This Steam account is already online.");
  }

  if (await ModelSteamAcc.findOne({ userId, accountName }).exec()) {
    return res.status(400).send("This Steam account already exists.");
  }

  // set login options
  const loginOptions: LoginOptions = {
    accountName,
    password: req.body.password,
  };

  // mobile code passed?
  if (req.body.code) loginOptions.twoFactorCode = req.body.code;

  // attempt login and update db
  try {
    const loginRes = await login(userId, loginOptions);
    await afterLoginSteps(userId, accountName, loginRes);
  } catch (error) {
    const err = normalizeError(error);
    return res.status(500).send(err);
  }

  return res.status(200).send("okay");
}

/**
 * Remove Steam account
 * @route
 */
export async function remove(req: Request, res: Response): Promise<unknown> {
  const userId = req.session.userId || "";
  const accountName = req.body.accountName;

  const account = await ModelSteamAcc.findOneAndDelete({ userId, accountName }).exec();
  if (!account) return res.status(400).send(ACCNOTFOUND);

  await accountCleanUp(userId, account);
  res.send("okay");
}

/**
 * Helper function to clean up Steam account after removing it from DB.
 * @helper
 */
export async function accountCleanUp(userId: string, account: ISteamAccDoc): Promise<void> {
  const accountName = account.accountName;
  const status = await ModelSteamAccStatus.findOneAndDelete({ userId, accountName }).exec();
  if (!status) throw "Steam account status not found.";

  const steam = SteamMap.remove(userId, accountName);
  if (!steam) return;
  steam.destroyConnection(true);

  const farmer = SteamFarm.remove(userId, accountName);
  if (!farmer) return;
  stopFarmingInterval(userId, accountName);
}

/**
 * Verify Steam Guard after login
 * @route
 */
export async function verifyLogin(req: Request, res: Response): Promise<unknown> {
  const userId = req.session.userId || "";
  const accountName = req.body.accountName;

  if (!req.body.code) return res.status(400).send(BADBODY);

  // check if theres an account waiting steam guard verificaiton
  const loginConfig = SteamVerify.get(userId);
  if (!loginConfig) return res.status(400).send("Steam accout waiting verification not found.");

  // set steam guard code
  const loginOptions = loginConfig.loginOptions;

  if (loginConfig.type === "email") {
    loginOptions.authCode = req.body.code;
  } else {
    loginOptions.twoFactorCode = req.body.code;
  }

  // get last proxy
  const proxy = loginConfig.proxy;

  // attemp login
  try {
    const loginRes = await login(userId, loginOptions, proxy);
    await afterLoginSteps(userId, accountName, loginRes);
  } catch (error) {
    const err = normalizeError(error);

    // update steam account status
    const query = { userId, accountName };
    await ModelSteamAccStatus.findOneAndUpdate(query, {
      state: "error",
      error: err,
      proxyId: undefined,
    }).exec();

    return res.status(500).send(err);
  }
  // remove verification
  SteamVerify.remove(userId);

  return res.status(200).send("okay");
}

/**
 * Relogin a steam account
 * @route
 */
export async function reLogin(req: Request, res: Response): Promise<unknown> {
  const userId = req.session.userId || "";
  const accountName = req.body.accountName;

  if (SteamMap.has(userId, accountName)) {
    return res.status(400).send("This Steam account is already online.");
  }

  const query = { userId, accountName: accountName };

  // get steam account status
  const status = await ModelSteamAccStatus.findOne(query).exec();
  if (!status) return res.status(400).send("Steam account status not found.");

  // get steam account
  const account = await ModelSteamAcc.findOne(query).exec();
  if (!account) return res.status(400).send("Steam account not found.");

  // get previously used proxy
  const previousProxy = (await ModelProxy.findById(status.proxyId).exec()) || undefined;

  // setup login options
  const loginOptions: LoginOptions = {
    accountName: account.accountName,
    password: account.auth.password,
    machineName: account.auth.machineName,
    loginKey: account.auth.loginKey,
    shaSentryfile: Buffer.from(account.auth.sentry.buffer),
  };

  // re-obtain sentry and loginKey after a verification or bad pass error
  if (
    status.state === "error" &&
    (isVerificationError(status.error) || isBadPasswordError(status.error))
  ) {
    delete loginOptions.loginKey;
    delete loginOptions.shaSentryfile;
  }

  // attempt login
  try {
    const loginRes = await login(userId, loginOptions, previousProxy);
    await afterLoginSteps(userId, accountName, loginRes);
  } catch (error) {
    const err = normalizeError(error);
    // update steam account status
    await ModelSteamAccStatus.findOneAndUpdate(query, {
      state: "error",
      error: err,
      proxyId: undefined,
    }).exec();
    return res.status(500).send(err);
  }

  return res.status(200).send("okay");
}

/**
 * Logout
 * @route
 */
export async function logout(req: Request, res: Response): Promise<unknown> {
  const userId = req.session.userId || "";
  const accountName = req.body.accountName;

  // get steam instance
  const steam = SteamMap.get(userId, accountName);
  if (!steam) {
    return res.status(400).send("This Steam account is not online.");
  }

  // stop farming interval if exists
  stopFarmingInterval(userId, accountName);

  // logout
  steam.destroyConnection(true);

  // remove from steammap
  SteamMap.remove(userId, accountName);

  // update status
  await ModelSteamAccStatus.findOneAndUpdate({ userId, accountName }, { state: "offline" }).exec();

  return res.status(200).send("okay");
}

/**
 * idle an array of appids
 * @route
 */
export async function idleGames(req: Request, res: Response): Promise<unknown> {
  const userId = req.session.userId || "";
  const accountName = req.body.accountName;
  const appIds = req.body.appIds;

  if (!appIds) {
    return res.status(400).send("appIds was not passed.");
  }

  if (!Array.isArray(appIds)) {
    return res.status(400).send("appIds must be an int array.");
  }

  for (const value of appIds) {
    if (typeof value !== "number") {
      return res.status(400).send("appIds must be an int array.");
    }
  }

  const query = { userId, accountName };

  // get steam account
  const steamAccount = await ModelSteamAcc.findOne(query).exec();
  if (!steamAccount) return res.status(400).send(ACCNOTFOUND);

  // get steam instance
  const steam = SteamMap.get(userId, accountName);
  if (!steam) return res.status(400).send(ACCNOTONLINE);

  // validate appIds against account games
  let foundAppIds = 0;
  for (const appId of appIds) {
    for (const game of steamAccount.data.games) {
      if (game.appid === `${appId}`) {
        foundAppIds++;
        break;
      }
    }
  }

  if (appIds.length !== foundAppIds) {
    return res.status(400).send("This account does not own one of the appIds.");
  }

  steam.clientGamesPlayed(appIds);

  // update account status
  await ModelSteamAccStatus.findOneAndUpdate(query, {
    idlingAppIds: appIds,
    state: appIds.length ? "in-game" : "online",
  }).exec();

  return res.send("okay");
}

/**
 * Change EPersonaState (how you appear to friends)
 * @route
 */
export async function changeEpersonaState(req: Request, res: Response): Promise<unknown> {
  const userId = req.session.userId || "";
  const accountName = req.body.accountName;
  const state = req.body.state;

  if (state === "undefined") return res.status(400).send("state parameter was not passed.");
  if (typeof state !== "number") return res.status(400).send("state parameter must be an int.");
  if (state < 0 || state > 7)
    return res.status(400).send("state parameter must be in 0-7 (inclusive) range.");

  // get steam instance
  const steam = SteamMap.get(userId, accountName);
  if (!steam) return res.status(400).send(ACCNOTONLINE);

  steam.clientChangeStatus({ personaState: state });

  // save state
  await ModelSteamAccStatus.findOneAndUpdate(
    { userId, accountName },
    { ePersonaState: state }
  ).exec();

  return res.status(200).send("okay");
}

/**
 * Change nickname
 * @route
 */
export async function changeNickName(req: Request, res: Response): Promise<unknown> {
  const userId = req.session.userId || "";
  const accountName = req.body.accountName;
  const nickname = req.body.nickname;

  if (typeof nickname !== "string" || nickname.length < 1)
    return res.status(400).send("nickname parameter must be a string, length > 0.");

  const steam = SteamMap.get(userId, accountName);
  if (!steam) return res.status(400).send(ACCNOTONLINE);

  steam.clientChangeStatus({ playerName: nickname });

  await ModelSteamAcc.findOneAndUpdate({ userId, accountName }, { "data.nickname": nickname });

  return res.status(200).send("okay");
}

/**
 * Activates f2p appIds
 * @route
 */
export async function requestFreeLicense(req: Request, res: Response): Promise<unknown> {
  const userId = req.session.userId || "";
  const accountName = req.body.accountName;
  const appIds: number[] = req.body.appIds;

  if (!appIds || !Array.isArray(appIds) || !appIds.length) {
    return res.status(400).send(BADBODY);
  }

  // must be int array
  for (const value of appIds) {
    if (typeof value !== "number") {
      return res.status(400).send(BADBODY);
    }
  }

  // get steam instance
  const steam = SteamMap.get(userId, accountName);
  if (!steam) return res.status(400).send(ACCNOTONLINE);

  const query = { userId, accountName };
  const steamAccount = await ModelSteamAcc.findOne(query).exec();
  if (!steamAccount) return res.status(400).send(ACCNOTFOUND);

  // filter any appIds this account already has
  for (const game of steamAccount.data.games) {
    const appId = Number(game.appid);
    // remove appId from appIds if found
    if (appIds.includes(appId)) {
      appIds.splice(appIds.indexOf(appId), 1);
    }
  }
  if (!appIds.length)
    return res.status(400).send("appIds included only duplicates in the Steam account.");

  // request games
  const games = await steam.clientRequestFreeLicense(appIds);

  // no games were activated`
  if (!games.length) {
    return res.status(400).send("Activation unsuccessful.");
  }

  // push activated games to account games
  for (const game of games) {
    steamAccount.data.games.push(game);
  }

  // mark as modified otherwise it won't update.
  steamAccount.markModified("data.games");
  await steamAccount.save();

  return res.send(games);
}

/**
 * Logins to steam via cm and web, gets account data
 */
async function login(
  userId: string,
  loginOptions: LoginOptions,
  proxy?: IProxyDoc
): Promise<LoginRes> {
  proxy = proxy || (await ModelProxy.getOne());
  const steamcm = await ModelSteamCM.getOne();

  if (!proxy || !steamcm) {
    throw "could not fetch proxy or steamcm";
  }

  // setup socks options
  const socksOptions: SocksClientOptions = {
    proxy: {
      host: proxy.ip,
      port: proxy.port,
      userId: process.env.PROXY_USER,
      password: process.env.PROXY_PASS,
      type: 5,
    },
    destination: {
      host: steamcm.ip,
      port: steamcm.port,
    },
    command: "connect",
  };

  // connect to steam
  const steam = new Steam();
  // connect can throw 'dead proxy or steamcm' or 'encryption failed'
  await steam.connect(socksOptions);

  // listen and handle steam events
  listenToSteamEvents(userId, loginOptions.accountName, steam);

  // attempt login
  try {
    const loginRes = await steam.login(loginOptions);

    const webNonce = loginRes.auth.webNonce;
    const steamId = loginRes.data.steamId;

    const cookie = await SteamCommunity.login(steamId, webNonce, proxy);
    const farmData = await SteamCommunity.getFarmingData(steamId, cookie, proxy);
    const inventory = await SteamCommunity.getCardsInventory(steamId, cookie, proxy);

    loginRes.auth.cookie = cookie;
    loginRes.data.farmData = farmData;
    loginRes.data.inventory = inventory;

    console.log(`STEAM ACCOUNT LOGGEDIN: ${loginOptions.accountName}`);

    return { auth: loginRes.auth, data: loginRes.data, steam, proxyId: proxy._id };
  } catch (error) {
    const err = normalizeError(error);
    if (err === UNEXPECTED) throw UNEXPECTED;

    if (isVerificationError(err)) {
      // save config to reuse when user enters code
      SteamVerify.set(userId, {
        loginOptions,
        proxy,
        type:
          error === "AccountLogonDenied" || error === "InvalidLoginAuthCode" ? "email" : "mobile",
      });

      throw error;
    } else {
      // some other eresult error
      SteamVerify.remove(userId);
      throw error;
    }
  }
}

/**
 * Save steam account, status, and restore idling or farming
 */
async function afterLoginSteps(userId: string, accountName: string, loginRes: LoginRes) {
  const query = { userId, accountName };
  const steam = loginRes.steam;

  SteamMap.add(userId, accountName, steam);

  const steamAccount = await ModelSteamAcc.findOneAndUpdate(
    query,
    { auth: loginRes.auth, data: loginRes.data },
    { upsert: true, new: true }
  ).exec();
  const status = await ModelSteamAccStatus.findOneAndUpdate(
    query,
    { state: "offline", proxyId: loginRes.proxyId },
    { upsert: true, new: true }
  ).exec();

  if (!steamAccount || !status) {
    throw new Error("Could not get Steam account or status.");
  }

  // restore epersonastate
  steam.clientChangeStatus({ personaState: status.ePersonaState });

  if (status.isFarming) {
    const proxy = await ModelProxy.findById(loginRes.proxyId).exec();
    if (!proxy) throw new Error("Could not get proxy.");
    //retore farming...
    await startFarming(userId, steamAccount, proxy);
  } else if (status.idlingAppIds?.length) {
    // restore idling games if any
    steam.clientGamesPlayed(status.idlingAppIds);
    status.state = "in-game";
    await status.save();
  }
}

/**
 * Attemps reconnect when 'disconnected' event is fired
 */
async function attempReconnect(userId: string, accountName: string): Promise<void> {
  const query = { userId, accountName };

  // get status
  const status = await ModelSteamAccStatus.findOne(query).exec();
  if (!status) return;

  // set reconnecting state
  status.state = "reconnecting";
  await status.save();

  // get account
  const account = await ModelSteamAcc.findOne(query).exec();
  if (!account) return;

  // setup login options
  const loginOptions: LoginOptions = {
    accountName: account.accountName,
    password: account.auth.password,
    machineName: account.auth.machineName,
    loginKey: account.auth.loginKey,
    shaSentryfile: Buffer.from(account.auth.sentry.buffer),
  };

  // fetch proxy and steamcm
  let previousProxy = (await ModelProxy.findById(status.proxyId).exec()) || undefined;

  const operation = retry.operation({
    retries: Number(process.env.STEAMACCOUNT_RECCONNECT_RETRIES),
    maxTimeout: 5000,
  });

  const tryLogin = async () => {
    return new Promise<void>((resolve, reject) => {
      operation.attempt(async () => {
        try {
          const response = await login(userId, loginOptions, previousProxy);
          await afterLoginSteps(userId, account.accountName, response);
          return resolve();
        } catch (error) {
          const err = normalizeError(error);

          if (isVerificationError(err) || isBadPasswordError(err)) {
            //users must handle these errors, don't try again.
            return reject(err);
          } else if (isConnectionError(err)) {
            // use a new proxy
            previousProxy = undefined;
          }

          if (operation.retry(error)) {
            return;
          }

          reject(err);
        }
      });
    });
  };

  try {
    await tryLogin();
  } catch (error) {
    console.log(`STEAM ACCOUNT RECONNECTED FAILED: ${accountName}`);
    console.log(`\tReason: ${error}`);

    status.state = "error";
    status.error = error;
    status.proxyId = previousProxy?._id;
    await status.save();

    // remove so that user can possible fix their account if it's an authentication error
    SteamVerify.remove(userId);
  }
}

/**
 * @listener
 */
function listenToSteamEvents(userId: string, accountName: string, steam: Steam) {
  // catch disconnects, only emmited after login.
  steam.on("disconnected", async () => {
    console.log(`STEAM ACCOUNT DISCONNECTED: ${accountName}`);

    // stop farming interval if exists
    stopFarmingInterval(userId, accountName);

    // remove from online accounts
    SteamMap.remove(userId, accountName);

    // attempt reconnect
    await attempReconnect(userId, accountName);
  });
}

/**
 * @helper
 */
function isVerificationError(error: string): boolean {
  if (
    error === "AccountLogonDenied" || // need email code
    error === "TwoFactorCodeMismatch" ||
    error === "AccountLoginDeniedNeedTwoFactor" ||
    error === "InvalidLoginAuthCode" // invalid email code
  ) {
    return true;
  }
  return false;
}

/**
 * @helper
 */
function isBadPasswordError(error: string): boolean {
  if (error === "InvalidPassword") {
    return true;
  }
  return false;
}

/**
 * @helper
 */
function isConnectionError(error: string): boolean {
  if (
    error === "dead proxy or steamcm" ||
    error === "encryption failed" ||
    error === "RateLimitExceeded"
  ) {
    return true;
  }
  return false;
}

/**
 * @helper
 */
function normalizeError(error: unknown): string {
  let err = "";
  if (typeof error !== "string") {
    console.error(error);

    err = UNEXPECTED;
  } else {
    err = error;
  }
  return err;
}
