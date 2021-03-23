import { Request, Response } from "express";
import axios from "axios";
import ModelProxy from "../models/proxy";
import ModelSteamCM from "../models/steamcm";
import ModelSteamAcc from "../models/steamaccount";
import ModelUser from "../models/user";
import * as ControllerSteamAccount from "../controllers/steamaccount";

axios.defaults.headers = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.190 Safari/537.36",
};

/**
 * Fetch proxies
 * @route
 */
export async function fetchProxies(req: Request, res: Response): Promise<unknown> {
  let response;

  try {
    response = await axios.get(`${process.env.PROXYSERVICE_URL}`);
  } catch (error) {
    return res.status(500).send("could not fetch proxies");
  }

  let proxies: string[] = response.data.split("\r\n").filter((proxy: string) => {
    if (!proxy) return false;
    return true;
  });

  proxies = [...new Set(proxies)];
  const count = await ModelProxy.add(proxies);
  res.send(count);
}

/**
 * Fetch SteamCMs
 * @route
 */
export async function fetchSteamCMs(req: Request, res: Response): Promise<unknown> {
  let response;

  try {
    response = await axios.get(`${process.env.STEAMCMS_URL}`);
  } catch (error) {
    return res.status(500).send("could not fetch steam cms");
  }

  let steamcms: string[] = response.data.response.serverlist;
  steamcms = [...new Set(steamcms)];
  const count = await ModelSteamCM.add(steamcms);
  res.send(count);
}

/**
 * Deactivate user account.
 */
export async function deleteUser(req: Request, res: Response): Promise<unknown> {
  const userId = req.body.userId;

  const user = await ModelUser.findOneAndDelete({ userId }).exec();
  if (!user) return res.status(404).send("user not found");

  // get all steam accounts
  const accounts = await ModelSteamAcc.find({ userId }).exec();
  if (!accounts) return res.send("okay");

  for (const account of accounts) {
    await ControllerSteamAccount.remove();
  }
}
