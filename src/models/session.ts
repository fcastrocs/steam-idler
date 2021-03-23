import mongoose, { Schema, Document } from 'mongoose';

export interface User {
    userID: string;
    sessionId: string;
}

// Schema methods will return IProxyDoc type
export interface UserDoc extends User, Document { }

const UserSchema = new Schema({
    userID: { type: String, required: true, index: true, unique: true },
    sessionId: { type: String, required: true },
});



export default mongoose.model<UserDoc>('Proxy', UserSchema);