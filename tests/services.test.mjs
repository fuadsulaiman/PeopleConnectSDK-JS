/**
 * Service-Level Unit Tests (JavaScript SDK)
 *
 * Tests for key service methods including AuthService, ConversationsService,
 * MessagesService, MediaService, ContactsService, CallsService,
 * InvitationsService, and others.
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
// AuthService
// ===========================================================================

describe("AuthService", () => {
  test("login sets tokens after successful response", async () => {
    const sdk = createSDK();
    installFetchMock(() =>
      mockResponse({
        accessToken: "new-at",
        refreshToken: "new-rt",
        user: { id: "u1", name: "Alice", username: "alice" },
        sessionId: "s1",
      })
    );

    const result = await sdk.auth.login({
      username: "alice",
      password: "pass",
    });
    assert.equal(result.accessToken, "new-at");
    assert.equal(sdk.getAccessToken(), "new-at");
  });

  test("login sends portal:user by default", async () => {
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
    const body = JSON.parse(init.body);
    assert.equal(body.portal, "user");
  });

  test("login sends custom portal when specified", async () => {
    const sdk = createSDK();
    installFetchMock(() =>
      mockResponse({
        accessToken: "at",
        refreshToken: "rt",
        user: { id: "u1" },
        sessionId: "s1",
      })
    );

    await sdk.auth.login({
      username: "admin",
      password: "pass",
      portal: "admin",
    });
    const body = JSON.parse(lastFetchCall()[1].body);
    assert.equal(body.portal, "admin");
  });

  test("register sets tokens after successful response", async () => {
    const sdk = createSDK();
    installFetchMock(() =>
      mockResponse({
        accessToken: "reg-at",
        refreshToken: "reg-rt",
        user: { id: "u2" },
        sessionId: "s2",
      })
    );

    const result = await sdk.auth.register({
      name: "Bob",
      username: "bob",
      password: "pass",
    });
    assert.equal(result.accessToken, "reg-at");
    assert.equal(sdk.getAccessToken(), "reg-at");
  });

  test("register sends invitationCode when provided", async () => {
    const sdk = createSDK();
    installFetchMock(() =>
      mockResponse({
        accessToken: "at",
        refreshToken: "rt",
        user: { id: "u1" },
        sessionId: "s1",
      })
    );

    await sdk.auth.register({
      name: "Bob",
      username: "bob",
      password: "pass",
      invitationCode: "INV-123",
    });
    const body = JSON.parse(lastFetchCall()[1].body);
    assert.equal(body.invitationCode, "INV-123");
  });

  test("logout clears tokens", async () => {
    const sdk = createSDK();
    sdk.setTokens({ accessToken: "at", refreshToken: "rt" });
    installFetchMock(() => mockResponse({}));

    await sdk.auth.logout();
    assert.equal(sdk.getAccessToken(), null);
  });

  test("logout calls POST /auth/logout", async () => {
    const sdk = createSDK();
    installFetchMock(() => mockResponse({}));

    await sdk.auth.logout();
    const [url, init] = lastFetchCall();
    assert.ok(url.includes("/auth/logout"));
    assert.equal(init.method, "POST");
  });

  test("getCurrentUser calls GET /auth/me", async () => {
    const sdk = createSDK();
    installFetchMock(() => mockResponse({ id: "u1", name: "Alice" }));

    const user = await sdk.auth.getCurrentUser();
    assert.equal(user.id, "u1");
    const [url, init] = lastFetchCall();
    assert.ok(url.includes("/auth/me"));
    assert.equal(init.method, "GET");
  });

  test("checkUsername passes username in URL path", async () => {
    const sdk = createSDK();
    installFetchMock(() => mockResponse({ available: true }));

    const result = await sdk.auth.checkUsername("newuser");
    assert.equal(result.available, true);
    assert.ok(lastFetchCall()[0].includes("/auth/check-username/newuser"));
  });

  test("forgotPassword sends identifier", async () => {
    const sdk = createSDK();
    installFetchMock(() => mockResponse({}));

    await sdk.auth.forgotPassword("alice@test.com");
    const body = JSON.parse(lastFetchCall()[1].body);
    assert.equal(body.identifier, "alice@test.com");
  });

  test("changePassword sends current and new password", async () => {
    const sdk = createSDK();
    installFetchMock(() => mockResponse({}));

    await sdk.auth.changePassword({
      currentPassword: "old",
      newPassword: "new",
    });
    const body = JSON.parse(lastFetchCall()[1].body);
    assert.equal(body.currentPassword, "old");
    assert.equal(body.newPassword, "new");
  });

  test("deleteAccount calls DELETE /auth/account", async () => {
    const sdk = createSDK();
    installFetchMock(() => mockResponse({}));

    await sdk.auth.deleteAccount();
    const [url, init] = lastFetchCall();
    assert.ok(url.includes("/auth/account"));
    assert.equal(init.method, "DELETE");
  });
});

// ===========================================================================
// ConversationsService
// ===========================================================================

describe("ConversationsService", () => {
  test("list passes pagination params", async () => {
    const sdk = createSDK();
    installFetchMock(() =>
      mockResponse({ items: [], totalCount: 0, page: 2, pageSize: 10 })
    );

    await sdk.conversations.list({ page: 2, pageSize: 10 });
    const [url] = lastFetchCall();
    assert.ok(url.includes("page=2"));
    assert.ok(url.includes("pageSize=10"));
  });

  test("get fetches conversation by ID", async () => {
    const sdk = createSDK();
    installFetchMock(() =>
      mockResponse({ id: "c1", type: "DirectMessage" })
    );

    const result = await sdk.conversations.get("c1");
    assert.equal(result.id, "c1");
    assert.ok(lastFetchCall()[0].includes("/conversations/c1"));
  });

  test("createDM sends userId", async () => {
    const sdk = createSDK();
    installFetchMock(() => mockResponse({ id: "c1" }));

    await sdk.conversations.createDM({ userId: "u2" });
    const body = JSON.parse(lastFetchCall()[1].body);
    assert.equal(body.userId, "u2");
  });

  test("createChatroom sends name and participantIds", async () => {
    const sdk = createSDK();
    installFetchMock(() => mockResponse({ id: "c2" }));

    await sdk.conversations.createChatroom({
      name: "Test Room",
      participantIds: ["u1", "u2"],
    });
    const body = JSON.parse(lastFetchCall()[1].body);
    assert.equal(body.name, "Test Room");
    assert.deepEqual(body.participantIds, ["u1", "u2"]);
  });

  test("addParticipants sends userIds", async () => {
    const sdk = createSDK();
    installFetchMock(() => mockResponse({}));

    await sdk.conversations.addParticipants("c1", ["u3", "u4"]);
    const [url, init] = lastFetchCall();
    assert.ok(url.includes("/conversations/c1/participants"));
    assert.equal(init.method, "POST");
    const body = JSON.parse(init.body);
    assert.deepEqual(body.userIds, ["u3", "u4"]);
  });

  test("removeParticipant uses DELETE with correct URL", async () => {
    const sdk = createSDK();
    installFetchMock(() => mockResponse({}));

    await sdk.conversations.removeParticipant("c1", "u4");
    const [url, init] = lastFetchCall();
    assert.ok(url.includes("/conversations/c1/participants/u4"));
    assert.equal(init.method, "DELETE");
  });

  test("pin and unpin use correct endpoints", async () => {
    const sdk = createSDK();
    installFetchMock(() => mockResponse({}));

    await sdk.conversations.pin("c1");
    assert.ok(lastFetchCall()[0].includes("/conversations/c1/pin"));

    await sdk.conversations.unpin("c1");
    assert.ok(lastFetchCall()[0].includes("/conversations/c1/unpin"));
  });

  test("archive and unarchive use correct endpoints", async () => {
    const sdk = createSDK();
    installFetchMock(() => mockResponse({}));

    await sdk.conversations.archive("c1");
    assert.ok(lastFetchCall()[0].includes("/conversations/c1/archive"));

    await sdk.conversations.unarchive("c1");
    assert.ok(lastFetchCall()[0].includes("/conversations/c1/unarchive"));
  });

  test("markAsRead sends lastMessageId", async () => {
    const sdk = createSDK();
    installFetchMock(() => mockResponse({}));

    await sdk.conversations.markAsRead("c1", "msg-99");
    const body = JSON.parse(lastFetchCall()[1].body);
    assert.equal(body.lastMessageId, "msg-99");
  });
});

// ===========================================================================
// MessagesService
// ===========================================================================

describe("MessagesService", () => {
  test("send constructs correct request", async () => {
    const sdk = createSDK();
    installFetchMock(() =>
      mockResponse({ id: "m1", content: "Hello!" })
    );

    const result = await sdk.messages.send("c1", {
      content: "Hello!",
      type: "Text",
      replyToMessageId: "m0",
      attachmentIds: ["att-1"],
    });
    const [url, init] = lastFetchCall();
    assert.ok(url.includes("/conversations/c1/messages"));
    assert.equal(init.method, "POST");
    const body = JSON.parse(init.body);
    assert.equal(body.content, "Hello!");
    assert.equal(body.type, "Text");
    assert.equal(body.replyToMessageId, "m0");
    assert.deepEqual(body.attachmentIds, ["att-1"]);
    assert.equal(result.id, "m1");
  });

  test("list passes pagination params", async () => {
    const sdk = createSDK();
    installFetchMock(() => mockResponse({ items: [], hasMore: false }));

    await sdk.messages.list("c1", { limit: 50, before: "cursor-abc" });
    const [url] = lastFetchCall();
    assert.ok(url.includes("limit=50"));
    assert.ok(url.includes("before=cursor-abc"));
  });

  test("edit sends content via PUT", async () => {
    const sdk = createSDK();
    installFetchMock(() => mockResponse({ id: "m1", content: "Updated" }));

    await sdk.messages.edit("c1", "m1", { content: "Updated" });
    const [url, init] = lastFetchCall();
    assert.ok(url.includes("/conversations/c1/messages/m1"));
    assert.equal(init.method, "PUT");
    assert.equal(JSON.parse(init.body).content, "Updated");
  });

  test("delete uses DELETE with forEveryone param", async () => {
    const sdk = createSDK();
    installFetchMock(() => mockResponse({}));

    await sdk.messages.delete("c1", "m1", true);
    const [url, init] = lastFetchCall();
    assert.ok(url.includes("forEveryone=true"));
    assert.equal(init.method, "DELETE");
  });

  test("delete defaults forEveryone to false", async () => {
    const sdk = createSDK();
    installFetchMock(() => mockResponse({}));

    await sdk.messages.delete("c1", "m1");
    assert.ok(lastFetchCall()[0].includes("forEveryone=false"));
  });

  test("react sends emoji", async () => {
    const sdk = createSDK();
    installFetchMock(() => mockResponse({}));

    await sdk.messages.react("c1", "m1", "thumbsup");
    const [url, init] = lastFetchCall();
    assert.ok(url.includes("/messages/m1/reactions"));
    assert.equal(init.method, "POST");
    assert.equal(JSON.parse(init.body).emoji, "thumbsup");
  });

  test("removeReaction sends emoji via DELETE", async () => {
    const sdk = createSDK();
    installFetchMock(() => mockResponse({}));

    await sdk.messages.removeReaction("c1", "m1", "thumbsup");
    const [url, init] = lastFetchCall();
    assert.ok(url.includes("/messages/m1/reactions"));
    assert.ok(url.includes("emoji=thumbsup"));
    assert.equal(init.method, "DELETE");
  });

  test("forward sends target conversation IDs", async () => {
    const sdk = createSDK();
    installFetchMock(() => mockResponse({}));

    await sdk.messages.forward("c1", "m1", ["c2", "c3"]);
    const body = JSON.parse(lastFetchCall()[1].body);
    assert.deepEqual(body.conversationIds, ["c2", "c3"]);
  });
});

// ===========================================================================
// MediaService
// ===========================================================================

describe("MediaService", () => {
  test("upload creates FormData", async () => {
    const sdk = createSDK();
    installFetchMock(() =>
      mockResponse({ id: "file-1", fileName: "test.png" })
    );

    const file = new File(["data"], "test.png", { type: "image/png" });
    const result = await sdk.media.upload(file, "c1");
    assert.equal(result.id, "file-1");
    const [url, init] = lastFetchCall();
    assert.ok(url.includes("/media/upload"));
    assert.ok(url.includes("conversationId=c1"));
    assert.ok(init.body instanceof FormData);
  });

  test("upload without conversationId omits query param", async () => {
    const sdk = createSDK();
    installFetchMock(() => mockResponse({ id: "file-1" }));

    const file = new File(["data"], "test.png", { type: "image/png" });
    await sdk.media.upload(file);
    const [url] = lastFetchCall();
    assert.ok(!url.includes("conversationId"));
  });

  test("uploadVoice sends duration param", async () => {
    const sdk = createSDK();
    installFetchMock(() => mockResponse({ id: "voice-1" }));

    const blob = new Blob(["audio"], { type: "audio/webm" });
    await sdk.media.uploadVoice(blob, "c1", 15);
    const [url] = lastFetchCall();
    assert.ok(url.includes("durationSeconds=15"));
    assert.ok(url.includes("conversationId=c1"));
  });

  test("delete calls correct endpoint", async () => {
    const sdk = createSDK();
    installFetchMock(() => mockResponse({}));

    await sdk.media.delete("file-1");
    const [url, init] = lastFetchCall();
    assert.ok(url.includes("/media/file-1"));
    assert.equal(init.method, "DELETE");
  });

  test("getConversationMedia passes params correctly", async () => {
    const sdk = createSDK();
    installFetchMock(() =>
      mockResponse({ items: [], totalCount: 0, page: 1, pageSize: 20 })
    );

    await sdk.media.getConversationMedia("c1", { page: 1, pageSize: 20, type: "image" });
    const [url] = lastFetchCall();
    assert.ok(url.includes("/media/conversation/c1"));
    assert.ok(url.includes("type=image"));
  });
});

// ===========================================================================
// ContactsService
// ===========================================================================

describe("ContactsService", () => {
  test("block calls POST /contacts/block/{userId}", async () => {
    const sdk = createSDK();
    installFetchMock(() => mockResponse({}));

    await sdk.contacts.block("u123");
    const [url, init] = lastFetchCall();
    assert.ok(url.includes("/contacts/block/u123"));
    assert.equal(init.method, "POST");
  });

  test("unblock calls DELETE /contacts/block/{userId}", async () => {
    const sdk = createSDK();
    installFetchMock(() => mockResponse({}));

    await sdk.contacts.unblock("u123");
    const [url, init] = lastFetchCall();
    assert.ok(url.includes("/contacts/block/u123"));
    assert.equal(init.method, "DELETE");
  });

  test("getBlocked returns array", async () => {
    const sdk = createSDK();
    installFetchMock(() =>
      mockResponse([
        { id: "b1", userId: "u1", name: "Bob", username: "bob", blockedAt: "" },
      ])
    );

    const result = await sdk.contacts.getBlocked();
    assert.equal(result.length, 1);
    assert.equal(result[0].userId, "u1");
  });

  test("sendRequest sends UserId and Nickname", async () => {
    const sdk = createSDK();
    installFetchMock(() =>
      mockResponse({ id: "c1", status: "Pending" })
    );

    await sdk.contacts.sendRequest("u2", "Alice");
    const body = JSON.parse(lastFetchCall()[1].body);
    assert.equal(body.UserId, "u2");
    assert.equal(body.Nickname, "Alice");
  });

  test("searchUsers sends query and limit", async () => {
    const sdk = createSDK();
    installFetchMock(() => mockResponse([]));

    await sdk.contacts.searchUsers("bob", 10);
    const [url] = lastFetchCall();
    assert.ok(url.includes("query=bob"));
    assert.ok(url.includes("limit=10"));
  });
});

// ===========================================================================
// CallsService
// ===========================================================================

describe("CallsService", () => {
  test("initiate sends call request", async () => {
    const sdk = createSDK();
    installFetchMock(() =>
      mockResponse({ callId: "call-1", type: "voice" })
    );

    const result = await sdk.calls.initiate({
      targetUserId: "u2",
      type: "voice",
    });
    assert.equal(result.callId, "call-1");
    assert.ok(lastFetchCall()[0].includes("/calls/initiate"));
  });

  test("getHistory passes pagination params", async () => {
    const sdk = createSDK();
    installFetchMock(() =>
      mockResponse({ items: [], totalCount: 0, page: 1, pageSize: 20 })
    );

    await sdk.calls.getHistory({ page: 1, pageSize: 20 });
    const [url] = lastFetchCall();
    assert.ok(url.includes("/calls/history"));
    assert.ok(url.includes("page=1"));
  });

  test("getIceServers calls correct endpoint", async () => {
    const sdk = createSDK();
    installFetchMock(() =>
      mockResponse([{ urls: "stun:stun.example.com" }])
    );

    const servers = await sdk.calls.getIceServers();
    assert.equal(servers.length, 1);
    assert.ok(lastFetchCall()[0].includes("/calls/ice-servers"));
  });

  test("getLiveKitToken sends conversationId", async () => {
    const sdk = createSDK();
    installFetchMock(() =>
      mockResponse({ token: "lk-token", url: "wss://lk.example.com", roomName: "room-1" })
    );

    const result = await sdk.calls.getLiveKitToken("c1");
    assert.equal(result.token, "lk-token");
    const body = JSON.parse(lastFetchCall()[1].body);
    assert.equal(body.conversationId, "c1");
  });
});

// ===========================================================================
// InvitationsService (JS SDK exclusive)
// ===========================================================================

describe("InvitationsService", () => {
  test("list passes pagination and filter params", async () => {
    const sdk = createSDK();
    installFetchMock(() =>
      mockResponse({ items: [], totalCount: 0, page: 1, pageSize: 20 })
    );

    await sdk.invitations.list({
      page: 1,
      pageSize: 20,
      search: "alice",
      status: "pending",
    });
    const [url] = lastFetchCall();
    assert.ok(url.includes("/invitations"));
    assert.ok(url.includes("page=1"));
    assert.ok(url.includes("search=alice"));
    assert.ok(url.includes("status=pending"));
  });

  test("get fetches invitation by ID", async () => {
    const sdk = createSDK();
    installFetchMock(() =>
      mockResponse({ id: "inv-1", code: "ABC123" })
    );

    const result = await sdk.invitations.get("inv-1");
    assert.equal(result.id, "inv-1");
    assert.ok(lastFetchCall()[0].includes("/invitations/inv-1"));
  });

  test("getStats calls /invitations/stats", async () => {
    const sdk = createSDK();
    installFetchMock(() =>
      mockResponse({ total: 10, pending: 3, used: 5, expired: 2 })
    );

    const stats = await sdk.invitations.getStats();
    assert.equal(stats.total, 10);
    assert.equal(stats.pending, 3);
  });

  test("create sends invitation request", async () => {
    const sdk = createSDK();
    installFetchMock(() =>
      mockResponse({ id: "inv-1", code: "NEW123" })
    );

    await sdk.invitations.create({ email: "bob@test.com", expiryDays: 7 });
    const body = JSON.parse(lastFetchCall()[1].body);
    assert.equal(body.email, "bob@test.com");
    assert.equal(body.expiryDays, 7);
  });

  test("resend calls POST /invitations/{id}/resend", async () => {
    const sdk = createSDK();
    installFetchMock(() => mockResponse({ id: "inv-1" }));

    await sdk.invitations.resend("inv-1", { expiryDays: 14 });
    const [url, init] = lastFetchCall();
    assert.ok(url.includes("/invitations/inv-1/resend"));
    assert.equal(init.method, "POST");
  });

  test("revoke calls POST /invitations/{id}/revoke", async () => {
    const sdk = createSDK();
    installFetchMock(() => mockResponse({ id: "inv-1" }));

    await sdk.invitations.revoke("inv-1");
    const [url, init] = lastFetchCall();
    assert.ok(url.includes("/invitations/inv-1/revoke"));
    assert.equal(init.method, "POST");
  });

  test("delete calls DELETE /invitations/{id}", async () => {
    const sdk = createSDK();
    installFetchMock(() => mockResponse({}));

    await sdk.invitations.delete("inv-1");
    const [url, init] = lastFetchCall();
    assert.ok(url.includes("/invitations/inv-1"));
    assert.equal(init.method, "DELETE");
  });
});

// ===========================================================================
// NotificationsService
// ===========================================================================

describe("NotificationsService", () => {
  test("getUnreadCount returns number", async () => {
    const sdk = createSDK();
    installFetchMock(() => mockResponse({ total: 10, unread: 3 }));

    const count = await sdk.notifications.getUnreadCount();
    assert.equal(count, 3);
  });

  test("markAsRead calls correct endpoint", async () => {
    const sdk = createSDK();
    installFetchMock(() => mockResponse({}));

    await sdk.notifications.markAsRead("n1");
    assert.ok(lastFetchCall()[0].includes("/notifications/n1/read"));
  });

  test("markAllAsRead calls correct endpoint", async () => {
    const sdk = createSDK();
    installFetchMock(() => mockResponse({}));

    await sdk.notifications.markAllAsRead();
    assert.ok(lastFetchCall()[0].includes("/notifications/read-all"));
  });
});

// ===========================================================================
// BroadcastsService
// ===========================================================================

describe("BroadcastsService", () => {
  test("getChannels returns array from paginated response", async () => {
    const sdk = createSDK();
    installFetchMock(() =>
      mockResponse({
        items: [{ id: "ch1", name: "News" }],
        totalCount: 1,
        page: 1,
        pageSize: 20,
      })
    );

    const channels = await sdk.broadcasts.getChannels();
    assert.equal(channels.length, 1);
    assert.equal(channels[0].name, "News");
  });

  test("subscribe/unsubscribe use correct methods", async () => {
    const sdk = createSDK();
    installFetchMock(() => mockResponse({}));

    await sdk.broadcasts.subscribe("ch1");
    assert.ok(lastFetchCall()[0].includes("/broadcasts/channels/ch1/subscribe"));
    assert.equal(lastFetchCall()[1].method, "POST");

    await sdk.broadcasts.unsubscribe("ch1");
    assert.ok(lastFetchCall()[0].includes("/broadcasts/channels/ch1/subscribe"));
    assert.equal(lastFetchCall()[1].method, "DELETE");
  });
});

// ===========================================================================
// SearchService
// ===========================================================================

describe("SearchService", () => {
  test("search sends query params correctly", async () => {
    const sdk = createSDK();
    installFetchMock(() =>
      mockResponse({ users: [], messages: [], conversations: [] })
    );

    await sdk.search.search({ query: "hello", types: ["users"], limit: 10 });
    const [url] = lastFetchCall();
    assert.ok(url.includes("q=hello"));
    assert.ok(url.includes("type=users"));
    assert.ok(url.includes("limit=10"));
  });

  test("searchUsers extracts users from result", async () => {
    const sdk = createSDK();
    installFetchMock(() =>
      mockResponse({
        users: [{ id: "u1", name: "Alice", username: "alice" }],
        messages: [],
        conversations: [],
      })
    );

    const users = await sdk.search.searchUsers("alice", 5);
    assert.equal(users.length, 1);
    assert.equal(users[0].username, "alice");
  });
});

// ===========================================================================
// TwoFactorService
// ===========================================================================

describe("TwoFactorService", () => {
  test("enable sends password", async () => {
    const sdk = createSDK();
    installFetchMock(() =>
      mockResponse({ secret: "ABCD", qrCodeUrl: "otpauth://...", backupCodes: [] })
    );

    const result = await sdk.twoFactor.enable("my-password");
    assert.equal(result.secret, "ABCD");
    const body = JSON.parse(lastFetchCall()[1].body);
    assert.equal(body.password, "my-password");
  });

  test("disable sends password and code", async () => {
    const sdk = createSDK();
    installFetchMock(() => mockResponse({}));

    await sdk.twoFactor.disable("my-password", "123456");
    const body = JSON.parse(lastFetchCall()[1].body);
    assert.equal(body.password, "my-password");
    assert.equal(body.code, "123456");
  });
});

// ===========================================================================
// ReportsService
// ===========================================================================

describe("ReportsService", () => {
  test("create sends report data", async () => {
    const sdk = createSDK();
    installFetchMock(() => mockResponse({ id: "r1" }));

    await sdk.reports.create({
      reportedUserId: "u1",
      reportType: "spam",
      description: "Spam messages",
    });
    const body = JSON.parse(lastFetchCall()[1].body);
    assert.equal(body.reportedUserId, "u1");
    assert.equal(body.reportType, "spam");
  });
});

// ===========================================================================
// UserService
// ===========================================================================

describe("UserService", () => {
  test("getUser fetches by userId", async () => {
    const sdk = createSDK();
    installFetchMock(() =>
      mockResponse({ id: "u1", name: "Alice" })
    );

    const user = await sdk.users.getUser("u1");
    assert.equal(user.id, "u1");
    assert.ok(lastFetchCall()[0].includes("/users/u1"));
  });

  test("uploadAvatar sends FormData", async () => {
    const sdk = createSDK();
    installFetchMock(() => mockResponse({ url: "https://example.com/av.jpg" }));

    const file = new File(["img"], "avatar.jpg", { type: "image/jpeg" });
    const result = await sdk.users.uploadAvatar(file);
    assert.equal(result.avatarUrl, "https://example.com/av.jpg");
    assert.ok(lastFetchCall()[1].body instanceof FormData);
  });

  test("deleteAvatar calls DELETE /auth/avatar", async () => {
    const sdk = createSDK();
    installFetchMock(() => mockResponse({}));

    await sdk.users.deleteAvatar();
    const [url, init] = lastFetchCall();
    assert.ok(url.includes("/auth/avatar"));
    assert.equal(init.method, "DELETE");
  });
});

// ===========================================================================
// DevicesService
// ===========================================================================

describe("DevicesService", () => {
  test("register sends device data with correct field names", async () => {
    const sdk = createSDK();
    installFetchMock(() => mockResponse({}));

    await sdk.devices.register({
      token: "fcm-token",
      platform: "android",
      deviceName: "Pixel 7",
    });
    const body = JSON.parse(lastFetchCall()[1].body);
    assert.equal(body.DeviceToken, "fcm-token");
    assert.equal(body.Platform, "android");
    assert.equal(body.DeviceName, "Pixel 7");
  });

  test("removeAllOthers calls DELETE /auth/sessions", async () => {
    const sdk = createSDK();
    installFetchMock(() => mockResponse({}));

    await sdk.devices.removeAllOthers();
    const [url, init] = lastFetchCall();
    assert.ok(url.includes("/auth/sessions"));
    assert.equal(init.method, "DELETE");
  });
});

// ===========================================================================
// AnnouncementsService
// ===========================================================================

describe("AnnouncementsService", () => {
  test("list fetches announcements", async () => {
    const sdk = createSDK();
    installFetchMock(() =>
      mockResponse([{ id: "a1", title: "Update" }])
    );

    const result = await sdk.announcements.list();
    assert.equal(result.length, 1);
    assert.ok(lastFetchCall()[0].includes("/announcements/my"));
  });

  test("dismiss calls correct endpoint", async () => {
    const sdk = createSDK();
    installFetchMock(() => mockResponse({}));

    await sdk.announcements.dismiss("a1");
    assert.ok(lastFetchCall()[0].includes("/announcements/a1/dismiss"));
  });
});
