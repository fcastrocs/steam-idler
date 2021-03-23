interface LoginOptions {
  accountName: string;
  password?: string;
  machineName?: string;
  clientOsType?: number;
  shouldRememberPassword?: true;
  twoFactorCode?: string;
  loginKey?: string;
  shaSentryfile?: Buffer;
  authCode?: string;
  protocolVersion?: 65580;
  supportsRateLimitResponse?: true;
  machineId?: Buffer;
}

interface PackageInfo {
  packageid: number;
  billingtype: number;
  licensetype: number;
  appids: number[];
}

interface AppInfo {
  appid: string;
  common: {
    clienticon: string;
    icon: string;
    logo: string;
    logo_small: string;
    name: string;
    type: string;
  };
}

interface Game {
  name: string;
  appid: string;
  logo: string;
}

interface AccountAuth {
  accountName: string;
  sentry: Buffer;
  loginKey: string;
  machineName: string;
  webNonce: string;
  password: string;
  cookie?: Cookie;
}

interface AccountData {
  steamId: string;
  limited: boolean;
  vac: boolean;
  avatar: string;
  nickname: string;
  communityBanned: boolean;
  locked: boolean;
  games: Game[];
  inventory?: Item[];
  farmData?: FarmData[];
}

interface ChangeStatusOption extends AnyObject {
  personaState?: number = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
  playerName?: string;
}

interface GamesPlayedOption extends AnyObject {
  gamesPlayed: { gameId: number }[];
}

interface RequestFreeLicenseOption extends AnyObject {
  appids: number[];
}

type sentry = Buffer;

interface CMsgProtoBufHeader {
  steamid: Long;
  clientSessionid: number;
  jobidSource: Long;
}