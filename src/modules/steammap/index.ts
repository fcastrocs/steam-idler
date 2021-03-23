/**
 * Keeps Steam instances stored in a Map
 */

import Steam from "../steam";

// Map<userId, Map<accountName, Steam>>
const Accounts: Map<string, Map<string, Steam>> = new Map();

export default class SteamMap {
  static add(userId: string, acountName: string, steam: Steam): void {
    if (this.has(userId, acountName)) {
      throw new Error("This account is already being managed.");
    }
    let userAccounts = Accounts.get(userId);
    if (!userAccounts) {
      userAccounts = new Map();
    }

    userAccounts.set(acountName, steam);
    Accounts.set(userId, userAccounts);
  }

  static get(userId: string, accountName: string): Steam | null {
    const userAccounts = Accounts.get(userId);
    if (!userAccounts) return null;
    const steam = userAccounts.get(accountName);
    if (!steam) return null;
    return steam;
  }

  static has(userId: string, accountName: string): boolean {
    const steam = this.get(userId, accountName);
    if (!steam) return false;
    return true;
  }

  static remove(userId: string, accountName: string): Steam | null {
    const userAccounts = Accounts.get(userId);
    if (!userAccounts) return null;
    const steam = userAccounts.get(accountName);
    userAccounts.delete(accountName);
    return steam || null;
  }
}
