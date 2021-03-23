import mongoose, { Schema, Document } from "mongoose";

export interface User {
  userId: string;
  username: string;
  avatar: string;
  refresh_token: string;
  discriminator: string;
  deactivated: boolean;
}

export interface UserDoc extends User, Document {}

const UserSchema = new Schema({
  userId: { type: String, required: true, index: true, unique: true },
  username: { type: String, required: true },
  avatar: { type: String, required: true },
  refresh_token: { type: String, required: true },
  discriminator: { type: String, required: true },
  deactivated: { type: Boolean, default: false },
});

export default mongoose.model<UserDoc>("User", UserSchema);
