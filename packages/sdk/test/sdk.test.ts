import {
  createApp,
  createBundleAddon,
  createIptvAddon,
  createMultiAddonRouter,
  createRepositoryAddon,
  createSingleAddonRouter,
  createWorkerAddon,
  serveAddons,
} from "../src";

const exported = [
  createApp,
  createBundleAddon,
  createIptvAddon,
  createMultiAddonRouter,
  createRepositoryAddon,
  createSingleAddonRouter,
  createWorkerAddon,
  serveAddons,
];

test("SDK should export all needed methods and properties", () => {
  expect(exported.every((fn) => fn)).toBeTruthy();
});
