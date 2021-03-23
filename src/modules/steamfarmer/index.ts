/**
 * Keeps intervalIds of accounts that are farming cards
 */

// Map<userId, Map<accountName, intervalId>>
const IntervalIds: Map<string, Map<string, NodeJS.Timeout>> = new Map();

export default class SteamFarm {
  static add(userId: string, acountName: string, intervalId: NodeJS.Timeout): void {
    if (this.has(userId, acountName)) {
      throw new Error("This account is already being managed.");
    }
    let userAccounts = IntervalIds.get(userId);
    if (!userAccounts) {
      userAccounts = new Map();
    }

    userAccounts.set(acountName, intervalId);
    IntervalIds.set(userId, userAccounts);
  }

  static get(userId: string, accountName: string): NodeJS.Timeout | null {
    const userAccounts = IntervalIds.get(userId);
    if (!userAccounts) return null;
    const intervalId = userAccounts.get(accountName);
    if (!intervalId) return null;
    return intervalId;
  }

  static has(userId: string, accountName: string): boolean {
    const intervalId = this.get(userId, accountName);
    if (!intervalId) return false;
    return true;
  }

  static remove(userId: string, accountName: string): NodeJS.Timeout | null {
    const userAccounts = IntervalIds.get(userId);
    if (!userAccounts) return null;
    const intervalId = userAccounts.get(accountName);
    userAccounts.delete(accountName);
    return intervalId || null;
  }
}
