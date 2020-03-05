import { createRepositoryAddon } from "@watchedcom/sdk";
import { addonWorkerExample as exampleAddon } from "./workerExample";

export const addonRepoExample = createRepositoryAddon({
  id: "watched-repo-example",
  name: {
    cn: "示例存储库",
    de: "Beispiel Repository",
    en: "Example Repository",
    ru: "Пример репозитория"
  },
  version: "1.0.0"
});

// addonRepoExample.addUrl("https://addons.watched.com/js/tmdb");
// addonRepoExample.addUrl("https://addons.watched.com/js/archive.org");
addonRepoExample.addAddon(exampleAddon);
