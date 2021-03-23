export declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DOMAIN: string;
      NODE_ENV: "development" | "production";
      MAILGUN_KEY: string;

      PROXYSERVICE_URL: string;
      PROXY_USER: string;
      PROXY_PASS: string;

      STEAMCMURL: string;
      STEAMCONNECTION_TIMEOUT: string;
      LOGIN_TIMEOUT: string;
      CMSG_TIMEOUT: string;
      STEAMCOMMUNITY_TIMEOUT: string;
      STEAMCOMMUNITY_RETRIES: string;
      SOCKET_TIMEOUT: string;
      STEAMCMS_URL: string;
      STEAMACCOUNT_RECCONNECT_RETRIES: string;
      STEAMFARMER_INTERVAL: string;

      SESSION_SECRET1: string;
      SESSION_SECRET2: string;
      SESSION_SECRET3: string;

      DISCORD_CLIENT_ID: string;
      DISCORD_SECRET_KEY: string;
    }
  }
}

export declare module "express-session" {
  interface SessionData {
    userId: string;
    loggedIn: boolean;
    username: string;
    avatar: string;
    admin: boolean;
  }
}
