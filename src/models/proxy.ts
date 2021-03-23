import mongoose, { Schema, Document } from 'mongoose';

export interface IProxy {
  ip: string;
  port: number;
}

// Schema methods will return IProxyDoc type
export interface IProxyDoc extends IProxy, Document {
  ip: string;
  port: number;
}

const ProxySchema = new Schema({
  ip: { type: String, required: true },
  port: { type: Number, required: true },
});

ProxySchema.index({ ip: 1, port: 1 }, { unique: true });

const ModelProxy = mongoose.model<IProxyDoc>('Proxy', ProxySchema);

export default class Proxy extends ModelProxy {
  static async add(proxies: string[]): Promise<number> {
    await this.removeAll();
    const documents: IProxy[] = [];
    for (const proxy of proxies) {
      const split = proxy.split(':');
      const doc: IProxy = {
        ip: split[0],
        port: Number(split[1]),
      };
      documents.push(new this(doc));
    }

    if (documents.length === 0) throw new Error('Empty documents array.');
    if (documents.length !== proxies.length) throw new Error('Arra mistmatch.');
    const docs = await this.insertMany(documents);
    return docs.length;
  }

  static async removeAll(): Promise<void> {
    await this.deleteMany({}).exec();
  }

  static getCount(): Promise<number> {
    return this.countDocuments({}).exec();
  }

  static async getOne(): Promise<IProxyDoc | undefined> {
    const count: number = await this.getCount();
    const rand = Math.floor(Math.random() * count);
    const doc = await this.findOne().skip(rand).exec();
    if (doc) return doc;
    return undefined;
  }
}
