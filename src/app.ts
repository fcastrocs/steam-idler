import path from 'path';
import { config } from 'dotenv';
config({ path: path.join(__dirname, '../.env') });
import mongoose from 'mongoose';
import { v4 as uuid } from "uuid"

import * as utils from './modules/utils';
import ModelSteamCM from './models/steamcm';
import ModelProxy from './models/proxy';
import express, { NextFunction, Request, Response } from 'express';
import bodyParser from 'body-parser';
import MongoStore from "connect-mongo"
import session from "express-session";
import cors from "cors";

import routes from './routes';
const app = express();
const port = 3000;

(async () => {
  console.log('Connecting to DB...');
  await connectToDB();
  console.log('Fetching proxies...');
  await getProxies();
  console.log('Fetchings steamcms...');
  await getSteamCMs();
  console.log("Applying app middleware...");
  await appMiddleWare();
  console.log('Starting HTTP server...');
  const res = await startExpress();
  console.log(res);
})();

async function connectToDB() {
  await mongoose.connect(
    'mongodb+srv://steamidler-dev:PrF1saA6r6KsgxQX@cluster0.shhe1.mongodb.net/steamidler-dev?retryWrites=true&w=majority',
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
    }
  );
}

async function getProxies() {
  const proxies = await utils.fetchProxies();
  await ModelProxy.add(proxies);
}

async function getSteamCMs() {
  const steamcms = await utils.fetchSteamCMs();
  await ModelSteamCM.add(steamcms);
}

function startExpress() {
  return new Promise((resolve) => {
    app.listen(port, () => {
      resolve(`Listening at http://localhost:${port}`);
    });
  });
}

function appMiddleWare() {
  app.use(cors({ origin: 'http://localhost:8000', }))

  // sessions
  app.use(
    session({
      secret: process.env.SESSION_SECRET1,
      name: "session",
      genid: () => uuid(),
      cookie: {
        httpOnly: true,
        secure: false,
        maxAge: 5 * 60 * 1000 // 5 minutes
      },
      saveUninitialized: true,
      resave: false,
      store: MongoStore.create({ clientPromise: Promise.resolve(mongoose.connection.getClient()) })
    })
  )

  app.use(bodyParser.json());

  // bad json.
  app.use(function (err: Error, req: Request, res: Response, next: NextFunction) {
    if (err instanceof SyntaxError) {
      return res.status(400).send('Bad json.');
    }
    next();
  });

  app.use(routes);
}
