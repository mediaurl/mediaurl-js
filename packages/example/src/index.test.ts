import { replayRecordFile } from "@mediaurl/sdk";
import { testAddon } from "@mediaurl/test-utils";
import { iptvExampleAddon } from "./iptvExample";
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
    [repoExampleAddon, workerExampleAddon, iptvExampleAddon],
    "src/index"
  )
    .then(done)
    .catch(done);
});
