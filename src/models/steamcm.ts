import mongoose, { Schema, Document } from 'mongoose';

export interface ISteamCM {
  ip: string;
  port: number;
}

// Schema methods will return ISteamCMDoc type
export interface ISteamCMDoc extends ISteamCM, Document {
  ip: string;
  port: number;
}

const SteamCMSchema = new Schema({
  ip: { type: String, required: true },
  port: { type: Number, required: true },
});

SteamCMSchema.index({ ip: 1, port: 1 }, { unique: true });

const ModelSteamCM = mongoose.model<ISteamCMDoc>('SteamCM', SteamCMSchema);

export default class SteamCM extends ModelSteamCM {
  static async add(steamcms: string[]): Promise<number> {
    await this.removeAll();
    const documents: ISteamCM[] = [];
    for (const steacm of steamcms) {
      const split = steacm.split(':');
      const doc: ISteamCM = {
        ip: split[0],
        port: Number(split[1]),
      };
      documents.push(new this(doc));
    }

    if (documents.length === 0) throw new Error('Empty documents array.');
    if (documents.length !== steamcms.length) throw new Error('Arra mistmatch.');
    const docs = await this.insertMany(documents);
    return docs.length;
  }

  static async removeAll(): Promise<void> {
    await this.deleteMany({}).exec();
  }

  static getCount(): Promise<number> {
    return this.countDocuments({}).exec();
  }

  static async getOne(): Promise<ISteamCMDoc | undefined> {
    const count: number = await this.getCount();
    const rand = Math.floor(Math.random() * count);
    const doc = await this.findOne().skip(rand).exec();
    if (doc) return doc;
    return undefined;
  }
}
