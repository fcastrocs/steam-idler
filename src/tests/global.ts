import path from "path"
import { config } from "dotenv"
config({ path: path.join(__dirname, "../../.env") });
import mongoose from "mongoose"

beforeAll(async (done) => {
    await mongoose.connect("mongodb+srv://steamidler-dev:PrF1saA6r6KsgxQX@cluster0.shhe1.mongodb.net/steamidler-dev?retryWrites=true&w=majority", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true
    });
    done();
})

afterAll(async (done) => {
    await mongoose.disconnect();
    done();
})