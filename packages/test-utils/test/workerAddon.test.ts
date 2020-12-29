import {
  AddonRequest,
  createApp,
  createEngine,
  DirectoryRequest,
  ItemRequest,
  SourceRequest,
} from "@mediaurl/sdk";
import request from "supertest";
import { TEST_ITEMS, TEST_SOURCES, TEST_SUBTITLES } from "../addon/testData";
import { workerAddon } from "../addon/workerAddon";

const sdkVersion = require("@mediaurl/sdk/package.json").version;

const requestEnd = (done: (err?: Error) => void, log = false) => (
  err: Error,
  res?: request.Response
) => {
  if (log) console.warn(res?.status, res?.header, res?.text);
  done(err);
};

const defaults = {
  sig: "mock",
  language: "en",
  region: "UK",
};

const itemDefaults: ItemRequest = {
  ...defaults,
  type: "movie",
  ids: {
    id: "elephant",
    "worker-test": "elephant",
  },
  name: "Elephants Dream",
  nameTranslations: {},
  episode: {},
};

const engine = createEngine([workerAddon], { testMode: true });
const app = request(createApp(engine));

test("action addon", async (done) => {
  app
    .post(`/${workerAddon.getId()}/addon.json`)
    .send(<AddonRequest>{ ...defaults })
    .expect(200, { ...workerAddon.getProps(), sdkVersion })
    .end(requestEnd(done));
});

test("action directory", async (done) => {
  app
    .post(`/${workerAddon.getId()}/directory.json`)
    .send(<DirectoryRequest>{
      ...defaults,
      id: "",
      adult: false,
      search: "",
      sort: "",
      filter: {},
      cursor: null,
    })
    .expect(200, {
      items: TEST_ITEMS.map((fn) => fn(false)),
      nextCursor: null,
    })
    .end(requestEnd(done));
});

test("action item", async (done) => {
  app
    .post(`/${workerAddon.getId()}/item.json`)
    .send(<ItemRequest>itemDefaults)
    .expect(
      200,
      TEST_ITEMS.map((fn) => fn(true)).find(
        (i) => i.ids["worker-test"] === "elephant"
      )
    )
    .end(requestEnd(done));
});

test("action source", async (done) => {
  app
    .post(`/${workerAddon.getId()}/source.json`)
    .send(<SourceRequest>itemDefaults)
    .expect(200, TEST_SOURCES.elephant)
    .end(requestEnd(done));
});

test("action subtitle", async (done) => {
  app
    .post(`/${workerAddon.getId()}/subtitle.json`)
    .send(<SourceRequest>itemDefaults)
    .expect(200, TEST_SUBTITLES.elephant)
    .end(requestEnd(done));
});

test("action subtitle (cached response)", async (done) => {
  app
    .post(`/${workerAddon.getId()}/subtitle.json`)
    .send(<SourceRequest>itemDefaults)
    .expect(200, TEST_SUBTITLES.elephant)
    .end(requestEnd(done));
});
