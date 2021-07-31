/**
 * Verifies the MediaURL Request
 * @param sig Base64 encoded string
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

  const result = JSON.parse(data);
  if (new Date(result.validUntil) < new Date()) {
    throw new Error("MediaURL signature timed out");
  }

  return result;
};
