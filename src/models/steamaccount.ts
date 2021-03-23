import mongoose, { Schema, Document } from "mongoose";

export interface ISteamAcc {
  userId: string;
  accountName: string;
  data: AccountData;
  auth: AccountAuth;
}

export interface ISteamAccDoc extends ISteamAcc, Document {}

const SteamSchema = new Schema({
  userId: { type: String, required: true, index: true },
  accountName: { type: String, required: true, index: true, unique: true },
  data: { type: Object, required: true },
  auth: { type: Object, required: true },
});

SteamSchema.index({ userId: 1, accountName: 1 }, { unique: true });

export default mongoose.model<ISteamAccDoc>("SteamAccount", SteamSchema);
