import {
  AddonRequest,
  createApp,
  createEngine,
  DirectoryRequest,
  ItemRequest,
  SourceRequest,
} from "@mediaurl/sdk";
import request from "supertest";
import { dummyAddon } from "../addon/dummyAddon";
import { TEST_ITEMS, TEST_SOURCES, TEST_SUBTITLES } from "../addon/testData";

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
    "dummy-test": "elephant",
  },
  name: "Elephants Dream",
  nameTranslations: {},
  episode: {},
};

const engine = createEngine([dummyAddon], { testMode: true });
const app = request(createApp(engine, { singleMode: false }));

test("action addon", async (done) => {
  app
    .post(`/${dummyAddon.getId()}/mediaurl.json`)
    .send(<AddonRequest>{ ...defaults })
    .expect(200, { ...dummyAddon.getProps(), sdkVersion })
    .end(requestEnd(done));
});

test("action directory", async (done) => {
  app
    .post(`/${dummyAddon.getId()}/mediaurl-directory.json`)
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
    .post(`/${dummyAddon.getId()}/mediaurl-item.json`)
    .send(<ItemRequest>itemDefaults)
    .expect(
      200,
      TEST_ITEMS.map((fn) => fn(true)).find(
        (i) => i.ids["dummy-test"] === "elephant"
      )
    )
    .end(requestEnd(done));
});

test("action source", async (done) => {
  app
    .post(`/${dummyAddon.getId()}/mediaurl-source.json`)
    .send(<SourceRequest>itemDefaults)
    .expect(200, TEST_SOURCES.elephant)
    .end(requestEnd(done));
});

test("action subtitle", async (done) => {
  app
    .post(`/${dummyAddon.getId()}/mediaurl-subtitle.json`)
    .send(<SourceRequest>itemDefaults)
    .expect(200, TEST_SUBTITLES.elephant)
    .end(requestEnd(done));
});

test("action subtitle (cached response)", async (done) => {
  app
    .post(`/${dummyAddon.getId()}/mediaurl-subtitle.json`)
    .send(<SourceRequest>itemDefaults)
    .expect(200, TEST_SUBTITLES.elephant)
    .end(requestEnd(done));
});

test("action selftest", async (done) => {
  app
    .post(`/${dummyAddon.getId()}/mediaurl-selftest.json`)
    .send()
    .expect(200, '"ok"')
    .end(requestEnd(done));
});

test("action server selftest", async (done) => {
  app
    .post("/mediaurl-selftest.json")
    .send()
    .expect(200, { "dummy-test": [200, "ok"] })
    .end(requestEnd(done));
});

test("action server", async (done) => {
  app
    .post(`/mediaurl.json`)
    .send()
    .expect(200, { type: "server", addons: ["dummy-test"] })
    .end(requestEnd(done));
});
