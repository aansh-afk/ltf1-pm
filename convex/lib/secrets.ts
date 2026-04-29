// Authenticated symmetric encryption for stored secrets (e.g. BYOK API keys).
//
// Uses AES-256-GCM via the Web Crypto API, which is available inside the
// Convex V8 runtime. Ciphertext is stored as a versioned, base64-encoded
// "nonce:ciphertext" string, prefixed with `v2:` so we can still decrypt
// legacy `btoa(apiKey)` material written before this migration.
//
// Required environment:
//   SECRET_ENCRYPTION_KEY — base64-encoded 32-byte key. Generate with:
//     openssl rand -base64 32
//
// Old base64-encoded values continue to round-trip; callers should re-encrypt
// them on next user-initiated update.

const VERSION_PREFIX = "v2:";

function base64ToBytes(input: string): Uint8Array {
  const binary = atob(input);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function loadKey(): Promise<CryptoKey> {
  const raw = process.env.SECRET_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "SECRET_ENCRYPTION_KEY is not configured. Set a base64 32-byte key in Convex env.",
    );
  }
  const keyBytes = base64ToBytes(raw);
  if (keyBytes.length !== 32) {
    throw new Error(
      "SECRET_ENCRYPTION_KEY must decode to 32 bytes (use `openssl rand -base64 32`).",
    );
  }
  return crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
}

/**
 * Encrypt a plaintext secret. Output format: `v2:<base64(nonce|ciphertext)>`.
 */
export async function encryptSecret(plaintext: string): Promise<string> {
  const key = await loadKey();
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(plaintext);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, key, data),
  );

  const combined = new Uint8Array(nonce.length + ciphertext.length);
  combined.set(nonce, 0);
  combined.set(ciphertext, nonce.length);
  return VERSION_PREFIX + bytesToBase64(combined);
}

/**
 * Decrypt a stored secret. Accepts both the new `v2:` AES-GCM format and the
 * legacy `btoa(apiKey)` strings written before encryption was introduced.
 */
export async function decryptSecret(stored: string): Promise<string> {
  if (!stored) return "";

  if (stored.startsWith(VERSION_PREFIX)) {
    const key = await loadKey();
    const combined = base64ToBytes(stored.slice(VERSION_PREFIX.length));
    if (combined.length < 13) {
      throw new Error("Encrypted secret payload is too short to decode.");
    }
    const nonce = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: nonce },
      key,
      ciphertext,
    );
    return new TextDecoder().decode(plaintext);
  }

  // Legacy values were stored as `btoa(apiKey)` plus an optional `apiKey`
  // raw field. Round-trip via atob so the caller still gets the plaintext.
  try {
    return atob(stored);
  } catch {
    // If atob fails the row is unrecognised; surface an explicit error so
    // callers can prompt the user to re-enter the key.
    throw new Error("Unable to decode legacy secret payload.");
  }
}

/**
 * Best-effort masked rendering for UI ("****abcd"). Falls back to `****` if
 * the decryption fails — never returns plaintext on error.
 */
export async function maskSecret(stored: string): Promise<string> {
  try {
    const plaintext = await decryptSecret(stored);
    return "****" + plaintext.slice(-4);
  } catch {
    return "****";
  }
}
