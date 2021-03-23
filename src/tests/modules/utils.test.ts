import * as Util from "../../modules/utils"

describe("Utils Module", () => {
    test("fetch proxies", async () => {
        let proxies = await Util.fetchProxies();
        expect(proxies.length).toBeGreaterThan(0)
    })

    test("fetch steamcms", async () => {
        let steamcms = await Util.fetchSteamCMs();
        expect(steamcms.length).toBeGreaterThan(0);
    })
})