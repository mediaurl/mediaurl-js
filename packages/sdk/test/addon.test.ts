import * as request from "supertest";
import {
  AddonRequest,
  createApp,
  DirectoryRequest,
  ItemRequest,
  SourceRequest
} from "../src";
import * as addon from "./example-addon";

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
  region: "UK"
};
const itemDefaults = {
  ...defaults,
  type: "movie",
  ids: {
    id: "elephant",
    example1: "elephant"
  },
  name: "Elephants Dream",
  episode: {}
};

const app = request(createApp([addon.addon]));

test("action addon", async done => {
  app
    .post(`/${addon.addon.getId()}/addon`)
    .send(<AddonRequest>{ ...defaults })
    .expect(200, addon.addon.getProps())
    .end(requestEnd(done));
});

test("action directory", async done => {
  app
    .post(`/${addon.addon.getId()}/directory`)
    .send(<DirectoryRequest>{
      ...defaults,
      id: ""
    })
    .expect(200, { items: addon.EXAMPLE_ITEMS, hasMore: false })
    .end(requestEnd(done));
});

test("action item", async done => {
  app
    .post(`/${addon.addon.getId()}/item`)
    .send(<ItemRequest>itemDefaults)
    .expect(
      200,
      addon.EXAMPLE_ITEMS.find(i => i.ids.example1 === "elephant")
    )
    .end(requestEnd(done));
});

test("action source", async done => {
  app
    .post(`/${addon.addon.getId()}/source`)
    .send(<SourceRequest>itemDefaults)
    .expect(200, addon.EXAMPLE_SOURCES.elephant)
    .end(requestEnd(done));
});

test("action subtitle", async done => {
  app
    .post(`/${addon.addon.getId()}/subtitle`)
    .send(<SourceRequest>itemDefaults)
    .expect(200, addon.EXAMPLE_SUBTITLES.elephant)
    .end(requestEnd(done));
});

test("action subtitle (cached response)", async done => {
  app
    .post(`/${addon.addon.getId()}/subtitle`)
    .send(<SourceRequest>itemDefaults)
    .expect(200, addon.EXAMPLE_SUBTITLES.elephant)
    .end(requestEnd(done));
});
