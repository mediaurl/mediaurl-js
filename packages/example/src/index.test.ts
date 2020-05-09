import { createAddonHandlers, replayRecordFile } from "@watchedcom/sdk";
import { testAddon } from "@watchedcom/test";
import { repoExampleAddon } from "./repoExample";
import { workerExampleAddon } from "./workerExample";

test(`Test addon "${workerExampleAddon.getId()}"`, (done) => {
  testAddon(workerExampleAddon).then(done).catch(done);
});

test(`Test addon "${repoExampleAddon.getId()}"`, (done) => {
  testAddon(repoExampleAddon).then(done).catch(done);
});

test(`Replay recorded actions`, (done) => {
  replayRecordFile(
    createAddonHandlers([repoExampleAddon, workerExampleAddon]),
    "src/index"
  )
    .then(done)
    .catch(done);
});
