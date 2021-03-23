import { Request, Response } from "express";
import ModelSteamAcc, { ISteamAccDoc } from "../models/steamaccount";
import SteamMap from "../modules/steammap";
import SteamFarmer from "../modules/steamfarmer";
import * as SteamCommunity from "../modules/steamcommunity";
import ModelSteamAccStatus, { ISteamAccStatusDoc } from "../models/steamAccStatus";
import ModelProxy, { IProxyDoc } from "../models/proxy";

/**
 * start card farming for this account
 * @route
 */
export async function start(req: Request, res: Response): Promise<unknown> {
  const userId = req.body.userId;
  const accountName = req.body.accountName;

  const steam = SteamMap.get(userId, accountName);
  if (!steam) return res.status(400).send("This Steam account is not online.");

  if (SteamFarmer.has(userId, accountName))
    return res.status(400).send("This account is already farming cards.");

  const steamAccount = await ModelSteamAcc.findOne({ userId, accountName }).exec();
  if (!steamAccount) return res.status(400).send("This Steam account does not exist.");

  if (steamAccount.data.limited) return res.status(400).send("This steam account is limited.");
  if (!steamAccount.data.farmData?.length) return res.status(400).send("No cards to farm.");

  const status = await ModelSteamAccStatus.findOne({ userId, accountName }).exec();
  if (!status) return res.status(400).send("Steam account status not found.");

  const proxy = await ModelProxy.findById(status.proxyId).exec();
  if (!proxy) return res.status(500).send("Could not get proxy.");

  // starting farming process.
  try {
    await startFarming(userId, steamAccount, proxy);
  } catch (e) {
    console.error(e);
    res.status(500).send("unexpected error");
  }

  status.isFarming = true;
  await status.save();

  return res.status(200).send("okay");
}

/**
 * stop card farming for this account
 * @route
 */
export async function stop(req: Request, res: Response): Promise<unknown> {
  const userId = req.body.userId;
  const accountName = req.body.accountName;

  const steam = SteamMap.get(userId, accountName);
  if (!steam) return res.status(400).send("This Steam account is not online.");

  if (!SteamFarmer.has(userId, accountName)) {
    return res.status(400).send("This Steam account is not farming cards.");
  }

  const status = await stopFarming(userId, accountName);
  if (!status) throw new Error("Steam account status not found.");

  // restore any games that were idling before farming
  if (status.idlingAppIds?.length) {
    steam.clientGamesPlayed(status.idlingAppIds);
  }

  return res.send("okay");
}

/**
 * start card farming for this account
 * @helper
 */
export async function startFarming(
  userId: string,
  steamAccount: ISteamAccDoc,
  proxy: IProxyDoc
): Promise<void> {
  const steamId = steamAccount.data.steamId;
  const accountName = steamAccount.accountName;
  const cookie = steamAccount.auth.cookie;
  if (!cookie) return;

  let farmData = steamAccount.data.farmData || [];

  let firstTime = true;

  // steam card farming algorithm
  const runAlgo = async () => {
    console.log(`Running farm algo: ${steamAccount.accountName}`);

    // account should be online.
    const steam = SteamMap.get(userId, accountName);
    if (!steam) {
      stopFarmingInterval(userId, accountName);
      return;
    }

    // not the first time in this interval, get farming data again.
    if (!firstTime) {
      try {
        farmData = await SteamCommunity.getFarmingData(steamId, cookie, proxy);
        // save new farm data to steam account
        await ModelSteamAcc.findOneAndUpdate(
          { userId, accountName },
          { "data.farmData": farmData }
        ).exec();
      } catch (error) {
        console.error(`Fetching farm data failed: ${steamAccount.accountName}`);
        stopFarmingInterval(userId, accountName);
        // this will cause the account to reconnect by not setting forceDisconnect
        steam.destroyConnection();
        return;
      }
    }

    // stop farming if no more cards to farm and restore idling
    if (!farmData.length) {
      console.log(`Finished farming: ${steamAccount.accountName}`);
      await stopFarming(userId, accountName);
      // restore idling
      const status = await ModelSteamAccStatus.findOne({ userId, accountName }).exec();
      if (status?.idlingAppIds?.length) {
        steam.clientGamesPlayed(status.idlingAppIds);
      }
      return;
    }

    // get all appIds
    const appIds: number[] = [];
    for (const item of farmData) {
      appIds.push(item.appId);
    }

    // stop playing games.
    steam.clientGamesPlayed([]);

    // start after 10 seconds
    setTimeout(() => {
      steam.clientGamesPlayed(appIds);
    }, 10 * 1000);

    // second run interval won't be the first time anymore: get farmData
    firstTime = false;
  };

  await runAlgo();

  const intervalId = setInterval(
    () => runAlgo(),
    Number(process.env.STEAMFARMER_INTERVAL) * 60 * 1000
  );
  SteamFarmer.add(userId, accountName, intervalId);
}

/**
 * stop card farming for this account
 * @helper
 */
export async function stopFarming(
  userId: string,
  accountName: string,
  isFarming = false
): Promise<ISteamAccStatusDoc | null> {
  const steam = SteamMap.get(userId, accountName);
  if (!steam) throw new Error("Steam account is not online.");
  steam.clientGamesPlayed([]);
  stopFarmingInterval(userId, accountName);
  return await ModelSteamAccStatus.findOneAndUpdate({ userId, accountName }, { isFarming }).exec();
}

/**
 * stop farming interval for this account
 * @helper
 */
export function stopFarmingInterval(userId: string, accountName: string): void {
  const intervalId = SteamFarmer.remove(userId, accountName);
  if (intervalId) {
    clearInterval(intervalId);
  }
}
