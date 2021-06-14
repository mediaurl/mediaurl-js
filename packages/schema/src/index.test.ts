import { getClientValidators, getServerValidators } from "../src";

const movie = () => ({
  type: "movie",
  ids: { some: "id" },
});

const directory = () => ({
  type: "directory",
  id: null,
});

// const catalogResponse = () => ({
//   items: [movie(), directory()],
//   nextCursor: null,
// });

test("Validate movie item", () => {
  expect(getServerValidators().models.item.movie(movie())).toBeTruthy();
  expect(getClientValidators().models.item.movie(movie())).toBeTruthy();
});

test("Validate directory item with null as id", () => {
  expect(getServerValidators().models.item.directory(directory())).toBeTruthy();
  expect(getClientValidators().models.item.directory(directory())).toBeTruthy();
});

// test("Validate catalog response", () => {
//   expect(
//     getServerValidators().actions.catalog.response(catalogResponse())
//   ).toBeTruthy();
//   expect(
//     getClientValidators().actions.catalog.response(catalogResponse())
//   ).toBeTruthy();
// });
