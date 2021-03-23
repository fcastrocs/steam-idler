/**
 * Proto encode and decoder
 */
import { Type } from 'protobufjs';
import Steam from './resources';
const Protos = Steam.protos;

export function decode(type: string, body: Buffer): AnyObject {
  let proto: Type;
  try {
    proto = Protos.lookupType(type);
  } catch (e) {
    throw new Error(`Proto not found. ${type}`);
  }

  const payload = proto.decode(body);
  return proto.toObject(payload);
}

export function encode(type: string, body: AnyObject): Uint8Array {
  let proto: Type;
  try {
    proto = Protos.lookupType(type);
  } catch (e) {
    throw new Error(`Proto not found. ${type}`);
  }

  const message = proto.create(body);

  const err = proto.verify(message);
  if (err) {
    throw new Error(err);
  }

  return proto.encode(message).finish();
}
