import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error("ENCRYPTION_KEY is not set");
  }

  if (key.length !== 64) {
    throw new Error("ENCRYPTION_KEY must be a 32-byte hex string");
  }

  return Buffer.from(key, "hex");
}

export function encrypt(plainText: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);

  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

export function decrypt(payload: string): string {
  const [ivHex, authTagHex, encryptedText] = payload.split(":");

  if (!ivHex || !authTagHex || !encryptedText) {
    throw new Error("Invalid encrypted payload");
  }

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getKey(),
    Buffer.from(ivHex, "hex")
  );

  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

