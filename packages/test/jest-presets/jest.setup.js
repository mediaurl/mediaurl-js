jest.mock("@watchedcom/sdk/dist/utils/signature", () => ({
  validateSignature(sig) {
    return {};
  }
}));
