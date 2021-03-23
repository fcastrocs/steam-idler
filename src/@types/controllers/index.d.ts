/**
 * steamaccount controller 
 */
import { Types } from "mongoose";
import Steam from "../../modules/steam";

interface AddBody {
  userId: string;
  accountName: string;
  password: string;
  code?: string;
}

interface LoginRes {
  auth: AccountAuth;
  data: AccountData;
  steam: Steam;
  proxyId: Types.ObjectId;
}

/**
 * auth controller 
 */
interface DiscordAccess {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  token_type: string;
}

interface DiscordIdentity {
  id: string;
  username: string;
  discriminator: string;
  avatar: string;
}