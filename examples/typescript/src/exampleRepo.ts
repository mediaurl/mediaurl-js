import { createRepositoryAddon, serveAddons } from "../../../dist";

import exampleAddon from "./example1";

const addon = createRepositoryAddon({
  id: "example-repo",
  name: "Example Repository",
  version: "1.0.0"
});

addon.addUrl("https://addons.watched.com/js/tmdb");
addon.addUrl("https://addons.watched.com/js/archive.org");
addon.addAddon(exampleAddon);

export default addon;
