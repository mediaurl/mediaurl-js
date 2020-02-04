jest.mock("./src/utils/signature", () => ({
  validateSignature(sig: string) {
    return {};
  }
}));
