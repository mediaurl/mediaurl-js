jest.mock("../dist/src/utils/signature.js", () => ({
  validateSignature(sig) {
    return {};
  }
}));
