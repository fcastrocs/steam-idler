import SteamCM from "../../models/steamcm"
const steamcms: string[] = ['162.254.195.82:27017', '162.254.195.66:27017', '162.254.195.66:27019']

describe("SteamCM Controller", () => {

    test("add", async () => {
        let length = await SteamCM.add(steamcms);
        expect(length).toEqual(steamcms.length);
    })

    test("count", async () => {
        let count = await SteamCM.getCount();
        expect(count).toEqual(steamcms.length);
    })

    test("get", async () => {
        let steamcm = await SteamCM.getOne();
        expect(steamcm).not.toBeNull();
    })

    test("remove", async (done) => {
        let steamcm = await SteamCM.getOne();
        if (!steamcm) throw "Expected not null."
        await steamcm.remove()
        done();
    })

    test("count", async () => {
        let count = await SteamCM.getCount();
        expect(count).toEqual(steamcms.length - 1);
    })

    test("removeAll", async (done) => {
        await SteamCM.removeAll();
        done();
    })

    test("count", async () => {
        let count = await SteamCM.getCount();
        expect(count).toEqual(0);
    })

})