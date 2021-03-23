import mongoose, { Schema, Document } from 'mongoose';

export interface ISteamAccStatus {
  state: 'online' | 'offline' | 'in-game' | 'reconnecting' | 'error';
  error: string;
  proxyId?: mongoose.Types.ObjectId;
  idlingAppIds?: number[];
  ePersonaState?: number;
  isFarming?: boolean;
}

export interface ISteamAccStatusDoc extends ISteamAccStatus, Document {
  userId: mongoose.Types.ObjectId;
  accountName: string;
}

const SteamAccStatusSchema = new Schema<ISteamAccStatusDoc>({
  userId: { type: mongoose.Types.ObjectId, required: true },
  accountName: { type: String, required: true },
  state: { type: String, required: true },
  error: { type: String, default: "" },
  proxyId: { type: mongoose.Types.ObjectId },
  idlingAppIds: { type: Array, default: [] },
  ePersonaState: { type: Number, default: 1 }, // 1 means online
  isFarming: { type: Boolean, default: false }
});

SteamAccStatusSchema.index({ userId: 1, accountName: 1 }, { unique: true });

export default mongoose.model<ISteamAccStatusDoc>('SteamAccountStatus', SteamAccStatusSchema);
