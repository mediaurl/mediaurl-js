import * as crypto from "crypto";

const publicKey = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDRGLGD6gly5Ut0N34CsLwZJaxG
msFqWH3fnOwJiirzC4mfDyyjXuID3o6oSUiN7BNOz4oyt76ldC/XP3BqBJvhmoo7
wD3jzuxhWM+1zqzhuJKgedoL/slQtPHnpcAaZ2E2hEEyyHALoejyy/6ZxInZdILI
rl2iXzVO8gXUw97fDwIDAQAB
-----END PUBLIC KEY-----`;

/**
 * Verifies sig field
 * @param body express request body
 */
export const validateSignature = (sig: string): any => {
  if (!sig) {
    throw new Error("Missing MediaURL signature");
  }

  const decodedSig = Buffer.from(sig, "base64").toString();
  try {
    JSON.parse(decodedSig);
  } catch {
    throw new Error("Malformed MediaURL signature");
  }

  const { data, signature } = JSON.parse(decodedSig);

  const verifier = crypto.createVerify("SHA256");
  verifier.update(data);
  const isValid = verifier.verify(publicKey, signature, "base64");
  if (!isValid) {
    throw new Error("Invalid MediaURL signature");
  }

  const result = JSON.parse(data);
  if (new Date(result.validUntil) < new Date()) {
    throw new Error("MediaURL signature timed out");
  }

  return result;
};
