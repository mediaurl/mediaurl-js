import {
  createApp,
  createBundleAddon,
  createMultiAddonRouter,
  createRepositoryAddon,
  createSingleAddonRouter,
  createWorkerAddon,
  serveAddons
} from "../src";

const exported = [
  createApp,
  createSingleAddonRouter,
  createMultiAddonRouter,
  serveAddons,
  createBundleAddon,
  createRepositoryAddon,
  createWorkerAddon
];

test("SDK should export all needed methods and properties", () => {
  expect(exported.every(fn => fn)).toBeTruthy();
});
