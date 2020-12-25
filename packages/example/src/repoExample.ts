import { createRepositoryAddon } from "@mediaurl/sdk";
import { iptvExampleAddon } from "./iptvExample";
import { workerExampleAddon } from "./workerExample";

export const repoExampleAddon = createRepositoryAddon({
  id: "mediaurl-repo-example",
  name: {
    cn: "示例存储库",
    de: "Beispiel Repository",
    en: "Example Repository",
    ru: "Пример репозитория",
  },
  version: "1.0.0",
});

repoExampleAddon.addAddon(workerExampleAddon);
repoExampleAddon.addAddon(iptvExampleAddon);
