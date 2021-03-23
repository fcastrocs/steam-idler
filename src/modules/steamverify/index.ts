/**
 * Stores Proxy, steamcm, and loginDetails to attempt relogin once user provides auth code
 */
import { IProxyDoc } from '../../models/proxy';

export interface LastLoginCongif {
  proxy: IProxyDoc;
  loginOptions: LoginOptions;
  type: 'email' | 'mobile';
}

const map: Map<string, LastLoginCongif> = new Map();

export default class SteamVerify {
  static set(userId: string, lastLoginCongif: LastLoginCongif): void {
    map.set(userId, lastLoginCongif);
    // remove after 2 minutes
    setTimeout(() => {
      map.delete(userId);
    }, 2 * 60 * 1000);
  }

  static get(userId: string): LastLoginCongif | undefined {
    return map.get(userId);
  }

  static remove(userId: string): boolean {
    return map.delete(userId);
  }
}
