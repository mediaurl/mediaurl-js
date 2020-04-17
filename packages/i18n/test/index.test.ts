import { changeLanguage, i18n, init, tAll } from "../src";

const exported = [i18n, changeLanguage, init, tAll];

test("Module should export all needed methods and properties", () => {
  expect(exported.every((fn) => fn)).toBeTruthy();
});
