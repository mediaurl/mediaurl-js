jest.mock("@mediaurl/sdk/dist/utils/signature", () => ({
  validateSignature(sig) {
    return {};
  },
}));
