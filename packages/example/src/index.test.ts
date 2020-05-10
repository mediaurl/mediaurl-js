import { createEngine, replayRecordFile } from "@watchedcom/sdk";
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
  const engine = createEngine([repoExampleAddon, workerExampleAddon]);
  replayRecordFile(engine, "src/index").then(done).catch(done);
});
