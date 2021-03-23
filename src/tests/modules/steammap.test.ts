import SteamMap from "../../modules/steammap"
import Mongoose from "mongoose"
import Steam from "../../modules/steam"

const USERID = Mongoose.Types.ObjectId().toHexString();
const STEAMID = "123";
const STEAM = new Steam();

describe("Steam Map module", () => {

    test("add", (done) => {
        SteamMap.add(USERID, STEAMID, STEAM);
        done();
    })

    test("add", (done) => {
        // should fail to add duplicate
        try {
            SteamMap.add(USERID, STEAMID, STEAM);
            throw "Was able to add duplicate steam instance."
        } catch (e) {
            done();
        }
    })

    test("get", () => {
        const steam = SteamMap.get(USERID, STEAMID)
        expect(steam).toEqual(STEAM);
    })

    test("has", () => {
        const bool = SteamMap.has(USERID, STEAMID);
        expect(bool).toEqual(true);
    })

    test('remove', () => {
        const bool = SteamMap.remove(USERID, STEAMID);
        expect(bool).toEqual(true);
    })

    test('remove', () => {
        // remove Steam Instance not in user map
        const bool = SteamMap.remove(USERID, STEAMID);
        expect(bool).toEqual(false);
    })

    test("has", () => {
        // has Steam Instance not in user map
        const bool = SteamMap.has(USERID, STEAMID);
        expect(bool).toEqual(false);
    })

    test("get", () => {
        // get Steam Instance not in user map
        const steam = SteamMap.get(USERID, STEAMID)
        expect(steam).toEqual(null);
    })

    test("add", () => {
        // add two steam instances
        SteamMap.add(USERID, STEAMID, STEAM);
        const userId = Mongoose.Types.ObjectId().toHexString();
        const steam = new Steam();
        const steamId = "321"
        SteamMap.add(userId, steamId, steam)

        const res = SteamMap.get(USERID, STEAMID);
        const res2 = SteamMap.get(userId, steamId);

        expect(res).toEqual(STEAM)
        expect(res2).toEqual(steam)
    })
});