jest.mock("../src/utils/signature.ts", () => ({
  validateSignature(sig: string) {
    return {};
  }
}));

try {
  jest.mock("../dist/src/utils/signature.js", () => ({
    validateSignature(sig: string) {
      return {};
    }
  }));
} catch (error) {}
