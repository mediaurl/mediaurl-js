import {
  createApp,
  createBundleAddon,
  createRepositoryAddon,
  createRouter,
  createWorkerAddon,
  serveAddons,
  testAddon
} from "../src";

const exported = [
  createWorkerAddon,
  createRepositoryAddon,
  createBundleAddon,
  createRouter,
  createApp,
  serveAddons,
  testAddon
];

test("SDK should export all needed methods and properties", () => {
  expect(exported.every(fn => fn)).toBeTruthy();
});
