import { replayRecordFile } from "@mediaurl/sdk";
import { dummyAddon } from "../addon";
import { testAddon } from "../src";

test(`Test addon "${dummyAddon.getId()}"`, (done) => {
  testAddon(dummyAddon).then(done).catch(done);
});

test(`Replay recorded actions`, (done) => {
  replayRecordFile([dummyAddon], "addon/addon.record.js")
    .then(done)
    .catch(done);
});
