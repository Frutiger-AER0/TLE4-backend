import crypto from "crypto";

const KEY_HEX = process.env.IMAGE_ENCRYPTION_KEY;
if (!KEY_HEX) {
    throw new Error("IMAGE_ENCRYPTION_KEY not set in environment");
}
const KEY = Buffer.from(KEY_HEX, "hex"); // 32 bytes

export function encryptPath(plainText) {
    // AES-256-CBC with random IV
    const iv = crypto.randomBytes(16); // 16 bytes
    const cipher = crypto.createCipheriv("aes-256-cbc", KEY, iv);
    let encrypted = cipher.update(plainText, "utf8", "hex");
    encrypted += cipher.final("hex");
    // store iv + ciphertext (hex) as single hex string
    return iv.toString("hex") + encrypted;
}

export function decryptPath(encryptedHex) {
    // first 32 hex chars = 16 bytes IV
    const ivHex = encryptedHex.slice(0, 32);
    const cipherHex = encryptedHex.slice(32);
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", KEY, iv);
    let decrypted = decipher.update(cipherHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
}