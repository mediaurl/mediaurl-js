module.exports = {
  root: true,
  "parser": "babel-eslint",
  "extends": ["eslint:recommended", "prettier"],
  "plugins": ["prettier"],
  "env": {
    node: true,
    es6: true,
  },
  "rules": {
    "prettier/prettier": ["error"],
    "no-console": 0,
  },
};
