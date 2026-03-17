const crypto = require("crypto");

const SECRET = process.env.JWT_SECRET || "staffhub-dev-secret";

function base64url(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function sign(input) {
  return crypto
    .createHmac("sha256", SECRET)
    .update(input)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function createToken(payload, expiresInSeconds = 60 * 60 * 24 * 7) {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + expiresInSeconds };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedBody = base64url(JSON.stringify(body));
  const signature = sign(`${encodedHeader}.${encodedBody}`);
  return `${encodedHeader}.${encodedBody}.${signature}`;
}

function verifyToken(token) {
  const [encodedHeader, encodedBody, signature] = token.split(".");

  if (!encodedHeader || !encodedBody || !signature) {
    throw new Error("Malformed token");
  }

  const expectedSignature = sign(`${encodedHeader}.${encodedBody}`);

  if (expectedSignature !== signature) {
    throw new Error("Invalid signature");
  }

  const payload = JSON.parse(Buffer.from(encodedBody, "base64").toString("utf8"));

  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Token expired");
  }

  return payload;
}

module.exports = {
  createToken,
  verifyToken
};
