/**
 * PeopleConnectSDK Main Class Tests (JavaScript SDK)
 *
 * Verifies SDK instantiation, service availability (15 services including invitations),
 * and top-level token management methods.
 */

import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { PeopleConnectSDK } from "../index.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createSDK(overrides = {}) {
  return new PeopleConnectSDK({
    baseUrl: "https://api.example.com/api",
    ...overrides,
  });
}

const originalFetch = global.fetch;
const originalConsoleLog = console.log;

beforeEach(() => {
  global.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({}),
    headers: new Headers(),
  });
  console.log = () => {};
});

afterEach(() => {
  global.fetch = originalFetch;
  console.log = originalConsoleLog;
});

// ===========================================================================
// Constructor
// ===========================================================================

describe("PeopleConnectSDK - constructor", () => {
  test("creates SDK instance without errors", () => {
    assert.doesNotThrow(() => createSDK());
  });

  test("accepts minimal config with only baseUrl", () => {
    const sdk = new PeopleConnectSDK({ baseUrl: "https://api.test.com" });
    assert.ok(sdk);
  });

  test("accepts full config with all optional callbacks", () => {
    const sdk = new PeopleConnectSDK({
      baseUrl: "https://api.test.com",
      timeout: 5000,
      onTokenRefresh: () => {},
      onUnauthorized: () => {},
      onError: () => {},
    });
    assert.ok(sdk);
  });
});

// ===========================================================================
// All 15 service properties exist (JS SDK has InvitationsService)
// ===========================================================================

describe("PeopleConnectSDK - service properties", () => {
  const sdk = createSDK();

  const serviceNames = [
    "auth",
    "users",
    "conversations",
    "messages",
    "contacts",
    "calls",
    "media",
    "notifications",
    "broadcasts",
    "announcements",
    "search",
    "devices",
    "twoFactor",
    "reports",
    "invitations",
  ];

  for (const name of serviceNames) {
    test(`has '${name}' service property`, () => {
      assert.ok(sdk[name], `Missing service: ${name}`);
      assert.equal(typeof sdk[name], "object");
    });
  }

  test("all 15 services are accessible", () => {
    let count = 0;
    for (const name of serviceNames) {
      if (sdk[name]) count++;
    }
    assert.equal(count, 15);
  });
});

// ===========================================================================
// Token management
// ===========================================================================

describe("PeopleConnectSDK - token management", () => {
  test("setTokens and getAccessToken work together", () => {
    const sdk = createSDK();
    assert.equal(sdk.getAccessToken(), null);

    sdk.setTokens({ accessToken: "my-at", refreshToken: "my-rt" });
    assert.equal(sdk.getAccessToken(), "my-at");
  });

  test("clearTokens resets accessToken to null", () => {
    const sdk = createSDK();
    sdk.setTokens({ accessToken: "at", refreshToken: "rt" });
    assert.equal(sdk.getAccessToken(), "at");

    sdk.clearTokens();
    assert.equal(sdk.getAccessToken(), null);
  });

  test("setTokens overwrites previous tokens", () => {
    const sdk = createSDK();
    sdk.setTokens({ accessToken: "first", refreshToken: "rt1" });
    sdk.setTokens({ accessToken: "second", refreshToken: "rt2" });
    assert.equal(sdk.getAccessToken(), "second");
  });

  test("clearTokens can be called when no tokens were set", () => {
    const sdk = createSDK();
    assert.doesNotThrow(() => sdk.clearTokens());
    assert.equal(sdk.getAccessToken(), null);
  });

  test("clearTokens then setTokens works", () => {
    const sdk = createSDK();
    sdk.setTokens({ accessToken: "first", refreshToken: "rt" });
    sdk.clearTokens();
    sdk.setTokens({ accessToken: "new", refreshToken: "new-rt" });
    assert.equal(sdk.getAccessToken(), "new");
  });
});

// ===========================================================================
// Service method existence
// ===========================================================================

describe("PeopleConnectSDK - key service methods exist", () => {
  const sdk = createSDK();

  test("auth has login, register, logout, getCurrentUser", () => {
    assert.equal(typeof sdk.auth.login, "function");
    assert.equal(typeof sdk.auth.register, "function");
    assert.equal(typeof sdk.auth.logout, "function");
    assert.equal(typeof sdk.auth.getCurrentUser, "function");
  });

  test("conversations has list, get, createDM, createChatroom", () => {
    assert.equal(typeof sdk.conversations.list, "function");
    assert.equal(typeof sdk.conversations.get, "function");
    assert.equal(typeof sdk.conversations.createDM, "function");
    assert.equal(typeof sdk.conversations.createChatroom, "function");
  });

  test("messages has list, send, edit, delete, react", () => {
    assert.equal(typeof sdk.messages.list, "function");
    assert.equal(typeof sdk.messages.send, "function");
    assert.equal(typeof sdk.messages.edit, "function");
    assert.equal(typeof sdk.messages.delete, "function");
    assert.equal(typeof sdk.messages.react, "function");
  });

  test("contacts has list, block, unblock, getBlocked", () => {
    assert.equal(typeof sdk.contacts.list, "function");
    assert.equal(typeof sdk.contacts.block, "function");
    assert.equal(typeof sdk.contacts.unblock, "function");
    assert.equal(typeof sdk.contacts.getBlocked, "function");
  });

  test("media has upload, getDownloadUrl, getThumbnailUrl", () => {
    assert.equal(typeof sdk.media.upload, "function");
    assert.equal(typeof sdk.media.getDownloadUrl, "function");
    assert.equal(typeof sdk.media.getThumbnailUrl, "function");
  });

  test("invitations has list, get, create, resend, revoke, delete", () => {
    assert.equal(typeof sdk.invitations.list, "function");
    assert.equal(typeof sdk.invitations.get, "function");
    assert.equal(typeof sdk.invitations.create, "function");
    assert.equal(typeof sdk.invitations.resend, "function");
    assert.equal(typeof sdk.invitations.revoke, "function");
    assert.equal(typeof sdk.invitations.delete, "function");
  });
});

// ===========================================================================
// Instance independence
// ===========================================================================

describe("PeopleConnectSDK - instance independence", () => {
  test("two SDK instances do not share tokens", () => {
    const sdk1 = createSDK();
    const sdk2 = createSDK();

    sdk1.setTokens({ accessToken: "token-1", refreshToken: "rt-1" });
    assert.equal(sdk1.getAccessToken(), "token-1");
    assert.equal(sdk2.getAccessToken(), null);
  });
});

// ===========================================================================
// Media URL helpers
// ===========================================================================

describe("PeopleConnectSDK - media URL helpers", () => {
  test("getDownloadUrl constructs correct URL with token", () => {
    const sdk = createSDK();
    sdk.setTokens({ accessToken: "my-at", refreshToken: "rt" });

    const url = sdk.media.getDownloadUrl("file-123");
    assert.equal(
      url,
      "https://api.example.com/api/media/file-123/download?token=my-at"
    );
  });

  test("getThumbnailUrl constructs correct URL", () => {
    const sdk = createSDK();
    sdk.setTokens({ accessToken: "my-at", refreshToken: "rt" });

    const url = sdk.media.getThumbnailUrl("file-456");
    assert.equal(
      url,
      "https://api.example.com/api/media/file-456/thumbnail?token=my-at"
    );
  });

  test("getStreamUrl constructs correct URL", () => {
    const sdk = createSDK();
    sdk.setTokens({ accessToken: "my-at", refreshToken: "rt" });

    const url = sdk.media.getStreamUrl("file-789");
    assert.equal(
      url,
      "https://api.example.com/api/media/file-789/stream?token=my-at"
    );
  });

  test("URL helpers accept explicit token parameter", () => {
    const sdk = createSDK();
    const url = sdk.media.getDownloadUrl("file-1", "explicit-token");
    assert.ok(url.includes("token=explicit-token"));
  });

  test("URL helpers use null token when none set and none provided", () => {
    const sdk = createSDK();
    const url = sdk.media.getDownloadUrl("file-1");
    assert.ok(url.includes("token=null"));
  });
});
