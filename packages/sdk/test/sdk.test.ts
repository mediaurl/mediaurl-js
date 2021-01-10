import {
  createApp,
  createBundleAddon,
  createIptvAddon,
  createRepositoryAddon,
  createWorkerAddon,
  serveAddons,
} from "../src";

const exported = [
  createApp,
  createBundleAddon,
  createIptvAddon,
  createRepositoryAddon,
  createWorkerAddon,
  serveAddons,
];

test("SDK should export all needed methods and properties", () => {
  expect(exported.every((fn) => fn)).toBeTruthy();
});
