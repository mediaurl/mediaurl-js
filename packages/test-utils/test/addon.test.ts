import { replayRecordFile } from "@mediaurl/sdk";
import { iptvAddon, repoAddon, workerAddon } from "../addon";
import { testAddon } from "../src";

test(`Test addon "${workerAddon.getId()}"`, (done) => {
  testAddon(workerAddon).then(done).catch(done);
});

test(`Test addon "${repoAddon.getId()}"`, (done) => {
  testAddon(repoAddon).then(done).catch(done);
});

test(`Replay recorded actions`, (done) => {
  replayRecordFile([repoAddon, workerAddon, iptvAddon], "addon/addon.record.js")
    .then(done)
    .catch(done);
});
