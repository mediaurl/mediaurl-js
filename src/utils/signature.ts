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
export const validateSignature = (body: any): void => {
    const { sig } = body;

    if (!sig) {
        throw new Error("No sig field passed in body");
    }

    console.log({ sig });

    const decodedSig = Buffer.from(sig, "base64").toString();

    try {
        JSON.parse(decodedSig);
    } catch {
        throw new Error("Malformed sig field");
    }

    const { data, signature } = JSON.parse(decodedSig);

    const verifier = crypto.createVerify("SHA256");

    verifier.update(data);

    const isValid = verifier.verify(publicKey, signature, "base64");

    if (!isValid) {
        throw new Error("Invalid signature");
    }

    const { validUntil } = JSON.parse(data);

    if (new Date(validUntil) < new Date()) {
        throw new Error("Signature data timed out");
    }
};
