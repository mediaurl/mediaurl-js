import { createRepositoryAddon } from "../../../src";
import { addon as exampleAddon } from "./example1";

export const addon = createRepositoryAddon({
  id: "example-repo",
  name: "Example Repository",
  version: "1.0.0"
});

addon.addUrl("https://addons.watched.com/js/tmdb");
addon.addUrl("https://addons.watched.com/js/archive.org");
addon.addAddon(exampleAddon);
