import { Response, Request } from "express";
import crypto from "crypto";
import axios from "axios";
import User from "../models/user";
import { DiscordAccess, DiscordIdentity } from "../@types/controllers";

const clientId = process.env.DISCORD_CLIENT_ID;
const secret = process.env.DISCORD_SECRET_KEY;
const baseURL = "https://discord.com/api";

/**
 * start discord oauth2
 * @route
 */
export function login(req: Request, res: Response): void {
  if (req.session.loggedIn) {
    return res.redirect("/");
  }

  // hash sessionId
  const shasum = crypto.createHash("sha1");
  shasum.update(req.sessionID);
  const state = shasum.digest("hex");

  return res.redirect(
    `${baseURL}/oauth2/authorize?response_type=code&client_id=${clientId}&scope=identify&state=${state}`
  );
}

/**
 * recieves response from discord oauth2
 * @route
 */
export async function authorize(req: Request, res: Response): Promise<unknown> {
  if (req.session.loggedIn) {
    return res.redirect("/");
  }

  const code = req.query.code;
  const state = req.query.state;

  if (!code || !state) {
    return res.status(400);
  }

  // verify state === hashed sessionID
  const shasum = crypto.createHash("sha1");
  shasum.update(req.sessionID);
  const hashedSessionID = shasum.digest("hex");

  if (state !== hashedSessionID) {
    return res.status(400);
  }

  // get access token
  try {
    const access = await getAccessToken(`${code}`);
    const identity = await getIdentity(access.access_token);
    // update session and cookie
    await updateSession(req, identity);
    // save user
    await User.findOneAndUpdate(
      { userId: identity.id },
      {
        username: identity.username,
        avatar: identity.avatar,
        refresh_token: access.refresh_token,
        discriminator: identity.discriminator,
      },
      { upsert: true }
    ).exec();

    return res.send("okay");
  } catch (e) {
    if (typeof e !== "string") {
      return res.status(500).send("unexpected error");
    }
    return res.status(500).send(e);
  }
}

/**
 * destroy session
 * @route
 */
export async function logout(req: Request, res: Response): Promise<unknown> {
  if (!req.session.loggedIn) {
    return res.redirect("/");
  }

  req.session.destroy((err) => {
    if (err) res.status(500).send("something went wrong");
    return res.redirect("/");
  });
}

export async function updateSession(req: Request, identity: DiscordIdentity): Promise<void> {
  req.session.userId = identity.id;
  req.session.loggedIn = true;
  req.session.username = identity.username;
  req.session.avatar = identity.avatar;
  req.session.cookie.maxAge = 365 * 24 * 60 * 60 * 1000; // one year
  req.session.save((err) => {
    if (err) throw "could not update session.";
    Promise.resolve();
  });
}

async function getAccessToken(code: string): Promise<DiscordAccess> {
  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("client_secret", secret);
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("scope", "identify");

  try {
    const response = await axios.post(`${baseURL}/oauth2/token`, params);
    if (!response.data || !response.data.access_token) {
      throw "Did not receive discord access token.";
    }
    return response.data;
  } catch (error) {
    throw "Could not get discord access token.";
  }
}

export async function refreshAccessToken(refresh_token: string): Promise<DiscordAccess> {
  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("client_secret", secret);
  params.append("grant_type", "refresh_token");
  params.append("refresh_token", refresh_token);
  params.append("scope", "identify");

  try {
    const response = await axios.post(`${baseURL}/oauth2/token`, params);
    if (!response.data || !response.data.access_token) {
      throw "Did not receive refreshed discord access token";
    }
    return response.data;
  } catch (error) {
    throw "Could not refresh discord access token.";
  }
}

export async function getIdentity(access_token: string): Promise<DiscordIdentity> {
  try {
    const response = await axios.get(`${baseURL}/users/@me`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!response.data || !response.data.id) {
      throw "Did not receive discord user data.";
    }
    return response.data;
  } catch (e) {
    throw "Could not get discord identity.";
  }
}
