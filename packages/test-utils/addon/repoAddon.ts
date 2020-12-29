import { createRepositoryAddon } from "@mediaurl/sdk";
import { iptvAddon } from "./iptvAddon";
import { workerAddon } from "./workerAddon";

export const repoAddon = createRepositoryAddon({
  id: "mediaurl-repo-test",
  name: {
    cn: "示例存储库",
    de: "Test Repository",
    en: "Test Repository",
    ru: "Пример репозитория",
  },
  version: "1.0.0",
});

repoAddon.addAddon(workerAddon);
repoAddon.addAddon(iptvAddon);
