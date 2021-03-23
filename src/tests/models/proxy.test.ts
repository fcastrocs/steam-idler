import ModelProxy from "../../models/proxy"
const proxies: string[] = ['162.254.195.82:27017', '162.254.195.66:27017', '162.254.195.66:27019']

describe("Proxy Controller", () => {
    test("add", async () => {
        const length = await ModelProxy.add(proxies);
        expect(length).toEqual(proxies.length);
    })

    test("count", async () => {
        const count = await ModelProxy.getCount();
        expect(count).toEqual(proxies.length);
    })

    test("get", async () => {
        const proxy = await ModelProxy.getOne();
        expect(proxy).not.toBeNull();
    })

    test("remove", async (done) => {
        const proxy = await ModelProxy.getOne();
        if (!proxy) throw "Expected not null."
        await ModelProxy.remove(proxy)
        done();
    })

    test("count", async () => {
        const count = await ModelProxy.getCount();
        expect(count).toEqual(proxies.length - 1);
    })

    test("removeAll", async (done) => {
        await ModelProxy.removeAll();
        done();
    })

    test("count", async () => {
        const count = await ModelProxy.getCount();
        expect(count).toEqual(0);
    })

})