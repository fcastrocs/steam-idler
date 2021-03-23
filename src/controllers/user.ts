import { Request, Response } from "express";
import SteamAccount from "../models/steamaccount";
import { refreshAccessToken, getIdentity, updateSession } from "./auth";
import User from "../models/user";
import { accountCleanUp } from "./steamaccount";

/**
 * Returns all steam accounts for this user
 * @route
 */
export async function steamAccounts(req: Request, res: Response): Promise<void> {
  const steamAccounts = await SteamAccount.find({ userId: req.session.userId })
    .select("-auth")
    .exec();
  res.send(steamAccounts);
}

/**
 * Return steam accounts with accountName
 * @route
 */
export async function steamAccount(req: Request, res: Response): Promise<void> {
  const steamAccount = await SteamAccount.findOne({
    userId: req.session.userId,
    accountName: req.body.accountName,
  })
    .select("-auth")
    .exec();
  res.send(steamAccount);
}

/**
 * Refresh discord identity
 * @route
 */
export async function refreshIdentity(req: Request, res: Response): Promise<unknown> {
  const userId = req.session.userId;
  const user = await User.findOne({ userId }).exec();
  if (!user) return res.status(400).send("User not found.");

  try {
    const discordAccess = await refreshAccessToken(user.refresh_token);
    const identity = await getIdentity(discordAccess.access_token);
    await updateSession(req, identity);
    await User.findOneAndUpdate(
      { userId },
      {
        username: identity.username,
        avatar: identity.avatar,
        refresh_token: discordAccess.refresh_token,
        discriminator: identity.discriminator,
      }
    ).exec();
  } catch (error) {
    console.error(error);
    return res.status(500).send("something went wrong while trying to update discord identity");
  }
  res.send("okay");
}

/**
 * Delete user and all user data
 */
export async function deleteUser(req: RequestId, res: Response): Promise<unknown> {
  const userId = req.session.userId || "";
  const user = await User.findOneAndDelete({ user }).exec();
  if (!user) return res.status(404).send("user not found");
  await removeSteamAccounts(userId);
  res.send("okay");
}

/**
 * Remove steam accounts for this userid
 */
export async function removeUserData(userId: string): Promise<void> {
  // find and delete all steam accounts
  const accounts = await SteamAccount.find({ userId }).exec();
  if (!accounts.length) return;
  await SteamAccount.deleteMany({ userId }).exec();

  // clean up after account
  for (const account of accounts) {
    await accountCleanUp(userId, account);
  }
}
