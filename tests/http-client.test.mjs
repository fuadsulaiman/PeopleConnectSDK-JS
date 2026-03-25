/**
 * HttpClient Unit Tests (JavaScript SDK)
 *
 * Tests for the internal HttpClient class exposed through the PeopleConnectSDK.
 * Uses Node.js built-in test runner (node:test) and assert module.
 */

import { describe, test, beforeEach, afterEach, mock } from "node:test";
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

function mockResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    headers: new Headers(),
  };
}

let fetchCalls = [];

function installFetchMock(implementation) {
  fetchCalls = [];
  global.fetch = async (...args) => {
    fetchCalls.push(args);
    if (implementation) return implementation(...args);
    return mockResponse({});
  };
}

function lastFetchCall() {
  return fetchCalls[fetchCalls.length - 1];
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

const originalFetch = global.fetch;
const originalConsoleLog = console.log;

beforeEach(() => {
  installFetchMock();
  console.log = () => {};
});

afterEach(() => {
  global.fetch = originalFetch;
  console.log = originalConsoleLog;
});

// ===========================================================================
// Token management
// ===========================================================================

describe("HttpClient - token management", () => {
  test("getAccessToken returns null initially", () => {
    const sdk = createSDK();
    assert.equal(sdk.getAccessToken(), null);
  });

  test("setTokens stores accessToken", () => {
    const sdk = createSDK();
    sdk.setTokens({ accessToken: "at-123", refreshToken: "rt-456" });
    assert.equal(sdk.getAccessToken(), "at-123");
  });

  test("clearTokens removes tokens", () => {
    const sdk = createSDK();
    sdk.setTokens({ accessToken: "at", refreshToken: "rt" });
    sdk.clearTokens();
    assert.equal(sdk.getAccessToken(), null);
  });

  test("setTokens can be called multiple times", () => {
    const sdk = createSDK();
    sdk.setTokens({ accessToken: "first", refreshToken: "rt1" });
    assert.equal(sdk.getAccessToken(), "first");
    sdk.setTokens({ accessToken: "second", refreshToken: "rt2" });
    assert.equal(sdk.getAccessToken(), "second");
  });
});

// ===========================================================================
// URL construction
// ===========================================================================

describe("HttpClient - URL construction", () => {
  test("trailing slash is stripped from base URL", async () => {
    const sdk = createSDK({ baseUrl: "https://api.example.com/api/" });
    installFetchMock(() => mockResponse({ id: 1 }));

    await sdk.auth.getCurrentUser();
    const [url] = lastFetchCall();
    assert.match(url, /^https:\/\/api\.example\.com\/api\/auth\/me/);
    assert.ok(!url.includes("api//auth"));
  });

  test("query params are appended to URL", async () => {
    const sdk = createSDK();
    installFetchMock(() =>
      mockResponse({ items: [], totalCount: 0, page: 1, pageSize: 10 })
    );

    await sdk.conversations.list({ page: 2, pageSize: 25, type: "Chatroom" });
    const [url] = lastFetchCall();
    assert.ok(url.includes("page=2"));
    assert.ok(url.includes("pageSize=25"));
    assert.ok(url.includes("type=Chatroom"));
  });

  test("undefined params are omitted from URL", async () => {
    const sdk = createSDK();
    installFetchMock(() =>
      mockResponse({ items: [], totalCount: 0, page: 1, pageSize: 10 })
    );

    await sdk.conversations.list({ page: 1, pageSize: undefined });
    const [url] = lastFetchCall();
    assert.ok(url.includes("page=1"));
    assert.ok(!url.includes("pageSize"));
  });

  test("boolean params are stringified", async () => {
    const sdk = createSDK();
    installFetchMock(() => mockResponse([]));

    await sdk.announcements.list(true);
    const [url] = lastFetchCall();
    assert.ok(url.includes("unreadOnly=true"));
  });
});

// ===========================================================================
// Authorization header
// ===========================================================================

describe("HttpClient - Authorization header", () => {
  test("no Authorization header when no token is set", async () => {
    const sdk = createSDK();
    installFetchMock(() => mockResponse({ id: "u1" }));

    await sdk.auth.getCurrentUser();
    const [, init] = lastFetchCall();
    assert.equal(init.headers["Authorization"], undefined);
  });

  test("Bearer token included after setTokens", async () => {
    const sdk = createSDK();
    sdk.setTokens({ accessToken: "my-token", refreshToken: "rt" });
    installFetchMock(() => mockResponse({ id: "u1" }));

    await sdk.auth.getCurrentUser();
    const [, init] = lastFetchCall();
    assert.equal(init.headers["Authorization"], "Bearer my-token");
  });

  test("no Authorization after clearTokens", async () => {
    const sdk = createSDK();
    sdk.setTokens({ accessToken: "at", refreshToken: "rt" });
    sdk.clearTokens();
    installFetchMock(() => mockResponse({ id: "u1" }));

    await sdk.auth.getCurrentUser();
    const [, init] = lastFetchCall();
    assert.equal(init.headers["Authorization"], undefined);
  });
});

// ===========================================================================
// Response unwrapping
// ===========================================================================

describe("HttpClient - response unwrapping", () => {
  test("unwraps { success, data } wrapper", async () => {
    const sdk = createSDK();
    const payload = { id: "u1", name: "Alice" };
    installFetchMock(() => mockResponse({ success: true, data: payload }));

    const result = await sdk.auth.getCurrentUser();
    assert.deepEqual(result, payload);
  });

  test("returns raw response when no wrapper", async () => {
    const sdk = createSDK();
    const payload = { id: "u1", name: "Alice" };
    installFetchMock(() => mockResponse(payload));

    const result = await sdk.auth.getCurrentUser();
    assert.deepEqual(result, payload);
  });

  test("returns empty object on unparseable body", async () => {
    const sdk = createSDK();
    installFetchMock(() => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError("bad");
      },
      headers: new Headers(),
    }));

    const result = await sdk.auth.getCurrentUser();
    assert.deepEqual(result, {});
  });
});

// ===========================================================================
// 401 handling & token refresh
// ===========================================================================

describe("HttpClient - 401 handling", () => {
  test("on 401 refreshes token and retries", async () => {
    let refreshCalled = false;
    const sdk = createSDK({
      onTokenRefresh: (tokens) => {
        refreshCalled = true;
        assert.equal(tokens.accessToken, "new-at");
      },
    });
    sdk.setTokens({ accessToken: "old-at", refreshToken: "valid-rt" });

    let callCount = 0;
    installFetchMock(async (url) => {
      callCount++;
      if (callCount === 1) return mockResponse({ message: "Unauthorized" }, 401);
      if (url.includes("/auth/refresh")) {
        return mockResponse({
          accessToken: "new-at",
          refreshToken: "new-rt",
          user: { id: "u1" },
          sessionId: "s1",
        });
      }
      return mockResponse({ id: "u1", name: "Alice" });
    });

    const result = await sdk.auth.getCurrentUser();
    assert.equal(result.name, "Alice");
    assert.ok(refreshCalled);
    assert.equal(sdk.getAccessToken(), "new-at");
  });

  test("401 without refreshToken throws and calls onError", async () => {
    let errorCalled = false;
    const sdk = createSDK({
      onError: () => {
        errorCalled = true;
      },
    });
    sdk.setTokens({ accessToken: "at", refreshToken: "" });
    installFetchMock(() => mockResponse({ message: "Unauthorized" }, 401));

    await assert.rejects(() => sdk.auth.getCurrentUser());
    assert.ok(errorCalled);
  });

  test("refresh failure calls onUnauthorized", async () => {
    let unauthorizedCalled = false;
    const sdk = createSDK({
      onUnauthorized: () => {
        unauthorizedCalled = true;
      },
    });
    sdk.setTokens({ accessToken: "old-at", refreshToken: "bad-rt" });

    let callCount = 0;
    installFetchMock(async () => {
      callCount++;
      if (callCount === 1) return mockResponse({}, 401);
      return mockResponse({ message: "Invalid" }, 401);
    });

    await assert.rejects(() => sdk.auth.getCurrentUser());
    assert.ok(unauthorizedCalled);
  });
});

// ===========================================================================
// Timeout
// ===========================================================================

describe("HttpClient - timeout", () => {
  test("throws Request timeout on AbortError", async () => {
    const sdk = createSDK({ timeout: 1 });
    installFetchMock(
      () =>
        new Promise((_, reject) => {
          setTimeout(() => {
            const err = new Error("aborted");
            err.name = "AbortError";
            reject(err);
          }, 50);
        })
    );

    await assert.rejects(() => sdk.auth.getCurrentUser(), {
      message: "Request timeout",
    });
  });
});

// ===========================================================================
// FormData handling
// ===========================================================================

describe("HttpClient - FormData handling", () => {
  test("does not set Content-Type for FormData", async () => {
    const sdk = createSDK();
    sdk.setTokens({ accessToken: "at", refreshToken: "rt" });
    installFetchMock(() =>
      mockResponse({ avatarUrl: "http://example.com/av.jpg" })
    );

    // Use the users uploadAvatar which creates FormData internally
    const file = new File(["data"], "avatar.png", { type: "image/png" });
    await sdk.users.uploadAvatar(file);

    const [, init] = lastFetchCall();
    assert.equal(init.headers["Content-Type"], undefined);
    assert.ok(init.body instanceof FormData);
  });

  test("sets Content-Type application/json for plain objects", async () => {
    const sdk = createSDK();
    installFetchMock(() =>
      mockResponse({
        accessToken: "at",
        refreshToken: "rt",
        user: { id: "u1" },
        sessionId: "s1",
      })
    );

    await sdk.auth.login({ username: "alice", password: "pass" });
    const [, init] = lastFetchCall();
    assert.equal(init.headers["Content-Type"], "application/json");
    assert.equal(typeof init.body, "string");
  });
});

// ===========================================================================
// Error callbacks
// ===========================================================================

describe("HttpClient - error callbacks", () => {
  test("onError receives error info on non-ok response", async () => {
    let receivedError = null;
    const sdk = createSDK({
      onError: (err) => {
        receivedError = err;
      },
    });
    installFetchMock(() =>
      mockResponse({ message: "Not Found", code: "NOT_FOUND" }, 404)
    );

    await assert.rejects(() => sdk.auth.getCurrentUser(), {
      message: "Not Found",
    });
    assert.equal(receivedError.message, "Not Found");
    assert.equal(receivedError.code, "NOT_FOUND");
  });

  test("error message defaults to HTTP status when body has no message", async () => {
    const sdk = createSDK();
    installFetchMock(() => ({
      ok: false,
      status: 500,
      json: async () => ({}),
      headers: new Headers(),
    }));

    await assert.rejects(() => sdk.auth.getCurrentUser(), {
      message: "HTTP 500",
    });
  });

  test("handles unparseable error body", async () => {
    const sdk = createSDK();
    installFetchMock(() => ({
      ok: false,
      status: 502,
      json: async () => {
        throw new SyntaxError("bad");
      },
      headers: new Headers(),
    }));

    await assert.rejects(() => sdk.auth.getCurrentUser(), {
      message: "HTTP 502",
    });
  });
});

// ===========================================================================
// HTTP methods
// ===========================================================================

describe("HttpClient - HTTP methods", () => {
  test("GET request has no body", async () => {
    const sdk = createSDK();
    installFetchMock(() => mockResponse({}));

    await sdk.auth.getCurrentUser();
    const [, init] = lastFetchCall();
    assert.equal(init.method, "GET");
    assert.equal(init.body, undefined);
  });

  test("POST request includes JSON body", async () => {
    const sdk = createSDK();
    installFetchMock(() =>
      mockResponse({
        accessToken: "at",
        refreshToken: "rt",
        user: { id: "u1" },
        sessionId: "s1",
      })
    );

    await sdk.auth.login({ username: "alice", password: "pass" });
    const [, init] = lastFetchCall();
    assert.equal(init.method, "POST");
    const body = JSON.parse(init.body);
    assert.equal(body.username, "alice");
  });

  test("PUT request uses PUT method", async () => {
    const sdk = createSDK();
    installFetchMock(() => mockResponse({}));

    await sdk.conversations.update("c1", { name: "New" });
    const [, init] = lastFetchCall();
    assert.equal(init.method, "PUT");
  });

  test("DELETE request uses DELETE method", async () => {
    const sdk = createSDK();
    installFetchMock(() => mockResponse({}));

    await sdk.auth.deleteAccount();
    const [, init] = lastFetchCall();
    assert.equal(init.method, "DELETE");
  });

  test("PATCH request uses PATCH method", async () => {
    const sdk = createSDK();
    installFetchMock(() => mockResponse({}));

    await sdk.conversations.updateParticipantRole("c1", "u1", "Admin");
    const [, init] = lastFetchCall();
    assert.equal(init.method, "PATCH");
  });
});
