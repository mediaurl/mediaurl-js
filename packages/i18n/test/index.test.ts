import { changeLanguage, i18next, init, tAll } from "../src";

const exported = [i18next, changeLanguage, init, tAll];

test("Module should export all needed methods and properties", () => {
  expect(exported.every(fn => fn)).toBeTruthy();
});
