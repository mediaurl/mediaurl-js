import {
  AddonRequest,
  createApp,
  createEngine,
  DirectoryRequest,
  ItemRequest,
  SourceRequest,
} from "@mediaurl/sdk";
import request from "supertest";
import {
  EXAMPLE_ITEMS,
  EXAMPLE_SOURCES,
  EXAMPLE_SUBTITLES,
} from "./exampleData";
import { workerExampleAddon } from "./workerExample";

const sdkVersion = require("@mediaurl/sdk/package.json").version;

const requestEnd = (done: (err?: Error) => void, log: boolean = false) => (
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
    "worker-example": "elephant",
  },
  name: "Elephants Dream",
  nameTranslations: {},
  episode: {},
};

const engine = createEngine([workerExampleAddon]);
const app = request(createApp(engine));

test("action addon", async (done) => {
  app
    .post(`/${workerExampleAddon.getId()}/addon`)
    .send(<AddonRequest>{ ...defaults })
    .expect(200, { ...workerExampleAddon.getProps(), sdkVersion })
    .end(requestEnd(done));
});

test("action directory", async (done) => {
  app
    .post(`/${workerExampleAddon.getId()}/directory`)
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
      items: EXAMPLE_ITEMS.map((fn) => fn(false)),
      nextCursor: null,
    })
    .end(requestEnd(done));
});

test("action item", async (done) => {
  app
    .post(`/${workerExampleAddon.getId()}/item`)
    .send(<ItemRequest>itemDefaults)
    .expect(
      200,
      EXAMPLE_ITEMS.map((fn) => fn(true)).find(
        (i) => i.ids["worker-example"] === "elephant"
      )
    )
    .end(requestEnd(done));
});

test("action source", async (done) => {
  app
    .post(`/${workerExampleAddon.getId()}/source`)
    .send(<SourceRequest>itemDefaults)
    .expect(200, EXAMPLE_SOURCES.elephant)
    .end(requestEnd(done));
});

test("action subtitle", async (done) => {
  app
    .post(`/${workerExampleAddon.getId()}/subtitle`)
    .send(<SourceRequest>itemDefaults)
    .expect(200, EXAMPLE_SUBTITLES.elephant)
    .end(requestEnd(done));
});

test("action subtitle (cached response)", async (done) => {
  app
    .post(`/${workerExampleAddon.getId()}/subtitle`)
    .send(<SourceRequest>itemDefaults)
    .expect(200, EXAMPLE_SUBTITLES.elephant)
    .end(requestEnd(done));
});
