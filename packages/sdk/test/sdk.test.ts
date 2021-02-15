import { createApp, createAddon } from "../src";

const exported = [createApp, createAddon];

test("SDK should export all needed methods and properties", () => {
  expect(exported.every((fn) => fn)).toBeTruthy();
});
