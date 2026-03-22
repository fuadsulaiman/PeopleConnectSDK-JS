# PeopleConnect JavaScript SDK

Official JavaScript SDK for the PeopleConnect real-time communication platform. Build chat applications, integrate messaging, manage contacts, handle voice/video calls, and more -- all from plain JavaScript with zero external dependencies.

---

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Module Formats](#module-formats)
- [Authentication](#authentication)
- [Services Reference](#services-reference)
  - [Auth Service](#auth-service)
  - [Users Service](#users-service)
  - [Conversations Service](#conversations-service)
  - [Messages Service](#messages-service)
  - [Contacts Service](#contacts-service)
  - [Calls Service](#calls-service)
  - [Media Service](#media-service)
  - [Notifications Service](#notifications-service)
  - [Broadcasts Service](#broadcasts-service)
  - [Announcements Service](#announcements-service)
  - [Search Service](#search-service)
  - [Devices Service](#devices-service)
  - [Two-Factor Service](#two-factor-service)
  - [Reports Service](#reports-service)
  - [Invitations Service](#invitations-service)
- [Real-Time Integration](#real-time-integration)
- [Web App Integration](#web-app-integration)
- [Node.js Integration](#nodejs-integration)
- [Error Handling](#error-handling)
- [Type Support](#type-support)
- [API Reference Table](#api-reference-table)
- [Browser Compatibility](#browser-compatibility)
- [License](#license)

---

## Overview

The PeopleConnect JavaScript SDK provides a complete client for the PeopleConnect API. It is designed for both browser and Node.js environments, giving you everything you need to build real-time communication features into any JavaScript application.

### Key Features

| Feature | Description |
|---------|-------------|
| **Zero Dependencies** | Pure JavaScript -- no `axios`, no `node-fetch`, no polyfills needed in modern environments |
| **JSDoc Annotated** | Full JSDoc annotations throughout the source for IDE autocompletion and inline docs |
| **TypeScript Ready** | Ships with `types.d.ts` declarations -- first-class TypeScript support without compiling |
| **Dual Module Format** | ES Modules (`.mjs`) and CommonJS (`.js`) -- works with `import` and `require()` |
| **Automatic Token Refresh** | Transparent access token renewal when a 401 is received; queued requests retry automatically |
| **15 Service Modules** | Auth, Users, Conversations, Messages, Contacts, Calls, Media, Notifications, Broadcasts, Announcements, Search, Devices, TwoFactor, Reports, Invitations |
| **Lightweight** | ~39 KB unminified source; no bundler required |

### Requirements

- **Browser**: Any modern browser with `fetch`, `FormData`, `AbortController`, and ES6+ support (Chrome 66+, Firefox 57+, Safari 12+, Edge 79+)
- **Node.js**: 18+ (native `fetch`), or 16+ with a `fetch` polyfill such as `node-fetch`

---

## Installation

### npm / yarn / pnpm

```bash
npm install @peopleconnect/sdk
```

```bash
yarn add @peopleconnect/sdk
```

```bash
pnpm add @peopleconnect/sdk
```

### CDN / Script Tag

For quick prototyping or non-bundled environments, load the SDK directly in a `<script>` tag:

```html
<script src="path/to/peopleconnect-sdk/index.js"></script>
<script>
  const sdk = new PeopleConnectSDK({
    baseUrl: 'https://your-server.com/api',
  });
</script>
```

When loaded via `<script>`, the `PeopleConnectSDK` class is available as a global.

---

## Quick Start

```javascript
import { PeopleConnectSDK } from '@peopleconnect/sdk';

// 1. Initialize
const sdk = new PeopleConnectSDK({
  baseUrl: 'https://your-server.com/api',
  onTokenRefresh: (tokens) => {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
  },
  onUnauthorized: () => {
    window.location.href = '/login';
  },
});

// 2. Authenticate
const { user, accessToken, refreshToken } = await sdk.auth.login({
  username: 'alice',
  password: 'SecureP@ss1',
});
console.log('Logged in as', user.name);

// 3. Restore tokens on page reload
sdk.setTokens({
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
});

// 4. Fetch conversations
const { items: conversations } = await sdk.conversations.list({ page: 1, pageSize: 20 });

// 5. Send a message
const message = await sdk.messages.send(conversations[0].id, {
  content: 'Hello from the JS SDK!',
});

// 6. Logout
await sdk.auth.logout();
```

---

## Configuration

Create an SDK instance by passing an `SDKConfig` object to the constructor.

```javascript
const sdk = new PeopleConnectSDK(config);
```

### SDKConfig Options

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `baseUrl` | `string` | Yes | -- | The base URL of the PeopleConnect API, including `/api` (e.g., `https://your-server.com/api`). A trailing slash is automatically stripped. |
| `timeout` | `number` | No | `30000` | Request timeout in milliseconds. If a request takes longer, it is aborted with an `"Request timeout"` error. |
| `onTokenRefresh` | `(tokens: AuthTokens) => void` | No | -- | Called whenever the SDK successfully refreshes the access token. Use this to persist the new tokens. Receives `{ accessToken, refreshToken }`. |
| `onUnauthorized` | `() => void` | No | -- | Called when the user's session cannot be recovered (refresh token is expired or missing). Typically used to redirect to a login page. |
| `onError` | `(error: ApiError) => void` | No | -- | Called on every API error before the promise rejects. Receives `{ message, code?, details? }`. Useful for centralized error logging. |

### Example: Full Configuration

```javascript
const sdk = new PeopleConnectSDK({
  baseUrl: 'https://chat.example.com/api',
  timeout: 15000,

  onTokenRefresh: (tokens) => {
    sessionStorage.setItem('access_token', tokens.accessToken);
    sessionStorage.setItem('refresh_token', tokens.refreshToken);
  },

  onUnauthorized: () => {
    sessionStorage.clear();
    window.location.replace('/login');
  },

  onError: (error) => {
    console.error(`[PeopleConnect API] ${error.code || 'UNKNOWN'}: ${error.message}`);
    if (error.details) {
      Object.entries(error.details).forEach(([field, messages]) => {
        console.error(`  ${field}: ${messages.join(', ')}`);
      });
    }
  },
});
```

---

## Module Formats

The SDK ships in three module formats. The `package.json` `exports` field ensures bundlers and Node.js automatically select the right one.

### ES Modules (recommended)

```javascript
import { PeopleConnectSDK } from '@peopleconnect/sdk';
```

Resolved to `index.mjs` by bundlers and Node.js (with `"type": "module"` or `.mjs` extension).

### CommonJS

```javascript
const { PeopleConnectSDK } = require('@peopleconnect/sdk');
```

Resolved to `index.js` (the main entry point).

### Browser Script Tag

```html
<script src="node_modules/@peopleconnect/sdk/index.js"></script>
<script>
  // PeopleConnectSDK is available globally
  const sdk = new PeopleConnectSDK({ baseUrl: '/api' });
</script>
```

The `index.js` file includes both `module.exports` for CommonJS and `export` statements for ESM. When loaded via a plain `<script>` tag (no `type="module"`), the class attaches to the global scope through the class declaration.

---

## Authentication

### Login

```javascript
const response = await sdk.auth.login({
  username: 'alice',
  password: 'SecureP@ss1',
});

// response contains:
// {
//   sessionId: 'uuid',
//   accessToken: 'jwt...',
//   refreshToken: 'jwt...',
//   user: { id, name, username, ... },
//   requiresTwoFactor?: boolean,     // true if 2FA is required
//   requiresPasswordChange?: boolean, // true if password reset is forced
//   requiresTwoFactorSetup?: boolean, // true if 2FA setup is mandatory
//   warningCount?: number,
//   activeWarnings?: [{ id, reason, createdAt, moderatorName }]
// }
```

On successful login, the SDK **automatically stores the tokens internally**. You do not need to call `setTokens()` after login.

### Two-Factor Authentication Flow

If `response.requiresTwoFactor` is `true`, the user must verify with a TOTP code before gaining access:

```javascript
const loginResponse = await sdk.auth.login({
  username: 'alice',
  password: 'SecureP@ss1',
});

if (loginResponse.requiresTwoFactor) {
  // Prompt the user for their 2FA code
  const code = prompt('Enter your 2FA code:');

  const verifiedResponse = await sdk.auth.verifyTwoFactor({
    code: code,
    userId: loginResponse.user.id,
  });

  console.log('2FA verified, logged in as', verifiedResponse.user.name);
}
```

### Token Refresh Flow

The SDK handles token refresh transparently:

1. A request returns HTTP 401.
2. The SDK sends `POST /auth/refresh` with the stored refresh token.
3. If successful, the new tokens are stored internally and the `onTokenRefresh` callback fires.
4. The original request is retried with the new access token.
5. Any additional requests that arrived during refresh are queued and retried automatically.
6. If refresh fails, `onUnauthorized` fires and the error propagates.

```
Request ──401──> SDK detects 401
                   │
                   ├── POST /auth/refresh
                   │     ├── Success: store new tokens, retry original request
                   │     │             fire onTokenRefresh callback
                   │     └── Failure: fire onUnauthorized callback
                   │                  reject all queued requests
                   │
                   └── Concurrent requests during refresh are queued
                       and retried with the new token
```

### Restoring a Session

On page reload or app restart, restore tokens from storage:

```javascript
const accessToken = localStorage.getItem('accessToken');
const refreshToken = localStorage.getItem('refreshToken');

if (accessToken && refreshToken) {
  sdk.setTokens({ accessToken, refreshToken });

  // Verify the session is still valid
  try {
    const user = await sdk.auth.getCurrentUser();
    console.log('Session restored for', user.name);
  } catch (err) {
    // Token expired and refresh failed -- redirect to login
    sdk.clearTokens();
  }
}
```

### Logout

```javascript
await sdk.auth.logout();
// Tokens are automatically cleared internally
// Also clear your local storage:
localStorage.removeItem('accessToken');
localStorage.removeItem('refreshToken');
```

---

## Services Reference

The SDK exposes 15 service modules, each accessible as a property of the `PeopleConnectSDK` instance.

```javascript
const sdk = new PeopleConnectSDK({ baseUrl: '...' });

sdk.auth            // AuthService
sdk.users           // UserService
sdk.conversations   // ConversationsService
sdk.messages        // MessagesService
sdk.contacts        // ContactsService
sdk.calls           // CallsService
sdk.media           // MediaService
sdk.notifications   // NotificationsService
sdk.broadcasts      // BroadcastsService
sdk.announcements   // AnnouncementsService
sdk.search          // SearchService
sdk.devices         // DevicesService
sdk.twoFactor       // TwoFactorService
sdk.reports         // ReportsService
sdk.invitations     // InvitationsService
```

---

### Auth Service

Handles user authentication, registration, password management, and account operations.

#### `sdk.auth.login(data)`

Authenticate with username and password. Tokens are stored internally on success.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `data.username` | `string` | Yes | Username |
| `data.password` | `string` | Yes | Password |
| `data.portal` | `"user" \| "admin"` | No | Login portal (defaults to `"user"`) |

**Returns:** `Promise<LoginResponse>`

```javascript
const { user, accessToken, refreshToken, requiresTwoFactor } = await sdk.auth.login({
  username: 'alice',
  password: 'SecureP@ss1',
});
```

#### `sdk.auth.register(data)`

Register a new user account. Tokens are stored internally on success.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `data.name` | `string` | Yes | Display name |
| `data.username` | `string` | Yes | Username |
| `data.password` | `string` | Yes | Password |
| `data.email` | `string` | No | Email address |
| `data.mobileNumber` | `string` | No | Phone number |
| `data.invitationCode` | `string` | No | Invitation code (required when invite-only mode is enabled) |

**Returns:** `Promise<LoginResponse>`

```javascript
const { user } = await sdk.auth.register({
  name: 'Alice Smith',
  username: 'alice',
  password: 'SecureP@ss1',
  email: 'alice@example.com',
});
```

#### `sdk.auth.logout()`

Log out and clear internal tokens. Sends a request to invalidate the session server-side.

**Returns:** `Promise<void>`

```javascript
await sdk.auth.logout();
```

#### `sdk.auth.refreshToken(refreshToken)`

Manually refresh the access token. Normally handled automatically by the SDK.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `refreshToken` | `string` | Yes | The current refresh token |

**Returns:** `Promise<LoginResponse>`

```javascript
const response = await sdk.auth.refreshToken('current-refresh-token');
```

#### `sdk.auth.getCurrentUser()`

Get the authenticated user's full profile.

**Returns:** `Promise<UserProfile>`

```javascript
const profile = await sdk.auth.getCurrentUser();
console.log(profile.name, profile.username, profile.email);
```

#### `sdk.auth.checkUsername(username)`

Check whether a username is available for registration.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | `string` | Yes | The username to check |

**Returns:** `Promise<{ available: boolean }>`

```javascript
const { available } = await sdk.auth.checkUsername('alice');
if (available) {
  console.log('Username is available!');
}
```

#### `sdk.auth.verifyTwoFactor(data)`

Verify a two-factor authentication code during login.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `data.code` | `string` | Yes | 6-digit TOTP code |
| `data.userId` | `string` | Yes | User ID from the initial login response |

**Returns:** `Promise<LoginResponse>`

```javascript
const response = await sdk.auth.verifyTwoFactor({
  code: '123456',
  userId: 'user-uuid',
});
```

#### `sdk.auth.forgotPassword(identifier)`

Request a password reset. The server sends a reset link to the user's email.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `identifier` | `string` | Yes | Username or email |

**Returns:** `Promise<void>`

```javascript
await sdk.auth.forgotPassword('alice@example.com');
```

#### `sdk.auth.resetPassword(data)`

Reset the password using a token from the reset email.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `data.token` | `string` | Yes | Reset token from the email link |
| `data.newPassword` | `string` | Yes | The new password |

**Returns:** `Promise<void>`

```javascript
await sdk.auth.resetPassword({
  token: 'reset-token-from-email',
  newPassword: 'NewSecureP@ss1',
});
```

#### `sdk.auth.changePassword(data)`

Change the password for the currently authenticated user.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `data.currentPassword` | `string` | Yes | Current password |
| `data.newPassword` | `string` | Yes | New password |

**Returns:** `Promise<void>`

```javascript
await sdk.auth.changePassword({
  currentPassword: 'OldP@ss1',
  newPassword: 'NewP@ss2',
});
```

#### `sdk.auth.deleteAccount()`

Permanently delete the authenticated user's account.

**Returns:** `Promise<void>`

```javascript
await sdk.auth.deleteAccount();
```

#### `sdk.auth.verifyEmail(token)`

Verify an email address using a token sent to the user's email.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `token` | `string` | Yes | Verification token from the email |

**Returns:** `Promise<void>`

```javascript
await sdk.auth.verifyEmail('verification-token');
```

#### `sdk.auth.resendVerification(email)`

Resend the email verification message.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | `string` | Yes | Email address to resend to |

**Returns:** `Promise<void>`

```javascript
await sdk.auth.resendVerification('alice@example.com');
```

---

### Users Service

Manage user profiles and avatars.

#### `sdk.users.getProfile()`

Get the authenticated user's profile (alias for `sdk.auth.getCurrentUser()`).

**Returns:** `Promise<UserProfile>`

```javascript
const profile = await sdk.users.getProfile();
```

#### `sdk.users.getUser(userId)`

Get another user's public profile by their ID.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | `string` | Yes | Target user's ID |

**Returns:** `Promise<User>`

```javascript
const user = await sdk.users.getUser('user-uuid');
console.log(user.name, user.status);
```

#### `sdk.users.uploadAvatar(file)`

Upload a new avatar image for the authenticated user.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file` | `File` | Yes | Image file (browser `File` object) |

**Returns:** `Promise<{ avatarUrl: string }>`

```javascript
const fileInput = document.getElementById('avatar-input');
const { avatarUrl } = await sdk.users.uploadAvatar(fileInput.files[0]);
console.log('New avatar URL:', avatarUrl);
```

#### `sdk.users.deleteAvatar()`

Remove the authenticated user's avatar.

**Returns:** `Promise<void>`

```javascript
await sdk.users.deleteAvatar();
```

---

### Conversations Service

Create, manage, and interact with direct messages and chatrooms.

#### `sdk.conversations.list(params?)`

Get a paginated list of the user's conversations.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `params.page` | `number` | No | Page number (1-based) |
| `params.pageSize` | `number` | No | Items per page |
| `params.type` | `string` | No | Filter by type: `"DirectMessage"`, `"Chatroom"`, `"BroadcastChannel"` |

**Returns:** `Promise<PaginatedResponse<Conversation>>`

```javascript
const { items, totalCount, page, pageSize } = await sdk.conversations.list({
  page: 1,
  pageSize: 20,
  type: 'Chatroom',
});
```

#### `sdk.conversations.get(id)`

Get full details for a single conversation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Conversation ID |

**Returns:** `Promise<ConversationDetail>`

```javascript
const conversation = await sdk.conversations.get('conv-uuid');
console.log(conversation.name, conversation.participants.length);
```

#### `sdk.conversations.createDM(data)`

Create or retrieve a direct message conversation with another user.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `data.userId` | `string` | Yes | The other user's ID |

**Returns:** `Promise<Conversation>`

```javascript
const dm = await sdk.conversations.createDM({ userId: 'other-user-uuid' });
```

#### `sdk.conversations.createChatroom(data)`

Create a new group chatroom.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `data.name` | `string` | Yes | Chatroom name |
| `data.description` | `string` | No | Chatroom description |
| `data.participantIds` | `string[]` | Yes | Array of user IDs to add as members |

**Returns:** `Promise<Conversation>`

```javascript
const chatroom = await sdk.conversations.createChatroom({
  name: 'Project Alpha',
  description: 'Discussion channel for Project Alpha',
  participantIds: ['user-1', 'user-2', 'user-3'],
});
```

#### `sdk.conversations.update(id, data)`

Update a chatroom's name, description, or avatar URL.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Chatroom ID |
| `data.name` | `string` | No | New name |
| `data.description` | `string` | No | New description |
| `data.avatarUrl` | `string` | No | New avatar URL |

**Returns:** `Promise<Conversation>`

```javascript
const updated = await sdk.conversations.update('chatroom-uuid', {
  name: 'Project Alpha (Archived)',
  description: 'This project is now archived.',
});
```

#### `sdk.conversations.delete(id)`

Delete a conversation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Conversation ID |

**Returns:** `Promise<void>`

```javascript
await sdk.conversations.delete('conv-uuid');
```

#### `sdk.conversations.leave(id)`

Leave a chatroom. You will no longer receive messages from this conversation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Conversation ID |

**Returns:** `Promise<void>`

```javascript
await sdk.conversations.leave('chatroom-uuid');
```

#### `sdk.conversations.addParticipants(id, userIds)`

Add members to a chatroom.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Chatroom ID |
| `userIds` | `string[]` | Yes | User IDs to add |

**Returns:** `Promise<void>`

```javascript
await sdk.conversations.addParticipants('chatroom-uuid', ['user-4', 'user-5']);
```

#### `sdk.conversations.removeParticipant(id, userId)`

Remove a member from a chatroom.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Chatroom ID |
| `userId` | `string` | Yes | User ID to remove |

**Returns:** `Promise<void>`

```javascript
await sdk.conversations.removeParticipant('chatroom-uuid', 'user-4');
```

#### `sdk.conversations.updateParticipantRole(id, userId, role)`

Change a member's role in a chatroom.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Chatroom ID |
| `userId` | `string` | Yes | User ID |
| `role` | `"Member" \| "Admin" \| "Owner"` | Yes | New role |

**Returns:** `Promise<void>`

```javascript
await sdk.conversations.updateParticipantRole('chatroom-uuid', 'user-2', 'Admin');
```

#### `sdk.conversations.getMembers(id)`

Get all members of a conversation with their online status.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Conversation ID |

**Returns:** `Promise<ConversationMember[]>`

```javascript
const members = await sdk.conversations.getMembers('chatroom-uuid');
members.forEach(m => {
  console.log(m.name, m.role, m.isOnline ? 'online' : 'offline');
});
```

#### `sdk.conversations.mute(id, until?)`

Mute notifications for a conversation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Conversation ID |
| `until` | `string` | No | ISO 8601 datetime to mute until (omit for indefinite) |

**Returns:** `Promise<void>`

```javascript
// Mute for 8 hours
const until = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
await sdk.conversations.mute('conv-uuid', until);

// Mute indefinitely
await sdk.conversations.mute('conv-uuid');
```

#### `sdk.conversations.unmute(id)`

Unmute a conversation.

**Returns:** `Promise<void>`

```javascript
await sdk.conversations.unmute('conv-uuid');
```

#### `sdk.conversations.archive(id)`

Archive a conversation (hides it from the main list).

**Returns:** `Promise<void>`

```javascript
await sdk.conversations.archive('conv-uuid');
```

#### `sdk.conversations.unarchive(id)`

Unarchive a conversation.

**Returns:** `Promise<void>`

```javascript
await sdk.conversations.unarchive('conv-uuid');
```

#### `sdk.conversations.clear(id)`

Clear all messages in a conversation (for the current user).

**Returns:** `Promise<void>`

```javascript
await sdk.conversations.clear('conv-uuid');
```

#### `sdk.conversations.pin(id)`

Pin a conversation to the top of the list.

**Returns:** `Promise<void>`

```javascript
await sdk.conversations.pin('conv-uuid');
```

#### `sdk.conversations.unpin(id)`

Unpin a conversation.

**Returns:** `Promise<void>`

```javascript
await sdk.conversations.unpin('conv-uuid');
```

#### `sdk.conversations.markAsRead(id, lastMessageId?)`

Mark a conversation as read.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Conversation ID |
| `lastMessageId` | `string` | No | ID of the last read message |

**Returns:** `Promise<void>`

```javascript
await sdk.conversations.markAsRead('conv-uuid', 'message-uuid');
```

#### `sdk.conversations.uploadAvatar(id, file)`

Upload a chatroom avatar image.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Chatroom ID |
| `file` | `File` | Yes | Image file |

**Returns:** `Promise<{ avatarUrl: string }>`

```javascript
const { avatarUrl } = await sdk.conversations.uploadAvatar('chatroom-uuid', imageFile);
```

---

### Messages Service

Send, edit, delete, react to, and forward messages within conversations.

#### `sdk.messages.list(conversationId, params?)`

Fetch messages in a conversation with cursor-based pagination.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `conversationId` | `string` | Yes | Conversation ID |
| `params.limit` | `number` | No | Number of messages to fetch |
| `params.before` | `string` | No | Fetch messages before this message ID (for scrolling up) |
| `params.after` | `string` | No | Fetch messages after this message ID (for new messages) |

**Returns:** `Promise<{ items: Message[], hasMore: boolean }>`

```javascript
// Initial load
const { items: messages, hasMore } = await sdk.messages.list('conv-uuid', {
  limit: 50,
});

// Load older messages (scroll up)
if (hasMore) {
  const older = await sdk.messages.list('conv-uuid', {
    limit: 50,
    before: messages[0].id,
  });
}
```

#### `sdk.messages.get(conversationId, messageId)`

Get a single message by ID.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `conversationId` | `string` | Yes | Conversation ID |
| `messageId` | `string` | Yes | Message ID |

**Returns:** `Promise<Message>`

```javascript
const message = await sdk.messages.get('conv-uuid', 'msg-uuid');
```

#### `sdk.messages.send(conversationId, data)`

Send a message to a conversation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `conversationId` | `string` | Yes | Conversation ID |
| `data.content` | `string` | No | Text content |
| `data.type` | `string` | No | Message type (defaults to `"Text"`) |
| `data.replyToMessageId` | `string` | No | ID of the message being replied to |
| `data.attachmentIds` | `string[]` | No | IDs of pre-uploaded attachments |

**Returns:** `Promise<Message>`

```javascript
// Text message
const msg = await sdk.messages.send('conv-uuid', {
  content: 'Hello!',
});

// Reply to a message
const reply = await sdk.messages.send('conv-uuid', {
  content: 'I agree!',
  replyToMessageId: 'original-msg-uuid',
});

// Message with attachments
const upload = await sdk.media.upload(file, 'conv-uuid');
const msg = await sdk.messages.send('conv-uuid', {
  content: 'Check out this file',
  attachmentIds: [upload.id],
});
```

#### `sdk.messages.edit(conversationId, messageId, data)`

Edit an existing message.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `conversationId` | `string` | Yes | Conversation ID |
| `messageId` | `string` | Yes | Message ID |
| `data.content` | `string` | Yes | New content |

**Returns:** `Promise<Message>`

```javascript
const edited = await sdk.messages.edit('conv-uuid', 'msg-uuid', {
  content: 'Updated message text',
});
```

#### `sdk.messages.delete(conversationId, messageId, forEveryone?)`

Delete a message.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `conversationId` | `string` | Yes | Conversation ID |
| `messageId` | `string` | Yes | Message ID |
| `forEveryone` | `boolean` | No | If `true`, deletes for all participants. If `false` (default), deletes only for the current user. |

**Returns:** `Promise<void>`

```javascript
// Delete for myself only
await sdk.messages.delete('conv-uuid', 'msg-uuid');

// Delete for everyone
await sdk.messages.delete('conv-uuid', 'msg-uuid', true);
```

#### `sdk.messages.react(conversationId, messageId, emoji)`

Add an emoji reaction to a message.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `conversationId` | `string` | Yes | Conversation ID |
| `messageId` | `string` | Yes | Message ID |
| `emoji` | `string` | Yes | Emoji character (e.g., `"thumbsup"`, `"heart"`) |

**Returns:** `Promise<void>`

```javascript
await sdk.messages.react('conv-uuid', 'msg-uuid', 'thumbsup');
```

#### `sdk.messages.removeReaction(conversationId, messageId, emoji)`

Remove your reaction from a message.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `conversationId` | `string` | Yes | Conversation ID |
| `messageId` | `string` | Yes | Message ID |
| `emoji` | `string` | Yes | Emoji to remove |

**Returns:** `Promise<void>`

```javascript
await sdk.messages.removeReaction('conv-uuid', 'msg-uuid', 'thumbsup');
```

#### `sdk.messages.forward(conversationId, messageId, targetConversationIds)`

Forward a message to one or more conversations.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `conversationId` | `string` | Yes | Source conversation ID |
| `messageId` | `string` | Yes | Message ID to forward |
| `targetConversationIds` | `string[]` | Yes | Destination conversation IDs |

**Returns:** `Promise<void>`

```javascript
await sdk.messages.forward('conv-uuid', 'msg-uuid', [
  'other-conv-1',
  'other-conv-2',
]);
```

---

### Contacts Service

Manage contacts, send/accept requests, search users, and handle blocking.

#### `sdk.contacts.list(params?)`

Get a paginated list of the user's contacts.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `params.page` | `number` | No | Page number |
| `params.pageSize` | `number` | No | Items per page |
| `params.search` | `string` | No | Search filter by name or username |

**Returns:** `Promise<PaginatedResponse<Contact>>`

```javascript
const { items: contacts, totalCount } = await sdk.contacts.list({
  page: 1,
  pageSize: 50,
  search: 'alice',
});
```

#### `sdk.contacts.getRequests()`

Get pending contact requests (both received and sent).

**Returns:** `Promise<ContactRequestList>` -- `{ received: Contact[], sent: Contact[] }`

```javascript
const { received, sent } = await sdk.contacts.getRequests();
console.log(`${received.length} incoming, ${sent.length} outgoing requests`);
```

#### `sdk.contacts.searchUsers(query, limit?)`

Search for users by name or username to add as contacts.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | `string` | Yes | Search query |
| `limit` | `number` | No | Max results (default: `20`) |

**Returns:** `Promise<UserSearchResult[]>`

```javascript
const users = await sdk.contacts.searchUsers('bob', 10);
users.forEach(u => {
  console.log(u.name, u.isContact ? '(already a contact)' : '');
});
```

#### `sdk.contacts.sendRequest(userId, nickname?)`

Send a contact request to another user.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | `string` | Yes | Target user ID |
| `nickname` | `string` | No | Optional nickname for the contact |

**Returns:** `Promise<Contact>`

```javascript
const contact = await sdk.contacts.sendRequest('user-uuid', 'Bobby');
```

#### `sdk.contacts.acceptRequest(contactId)`

Accept a received contact request.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `contactId` | `string` | Yes | Contact request ID |

**Returns:** `Promise<Contact>`

```javascript
const contact = await sdk.contacts.acceptRequest('contact-uuid');
```

#### `sdk.contacts.rejectRequest(contactId)`

Reject a received contact request.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `contactId` | `string` | Yes | Contact request ID |

**Returns:** `Promise<void>`

```javascript
await sdk.contacts.rejectRequest('contact-uuid');
```

#### `sdk.contacts.update(contactId, nickname?)`

Update a contact's nickname.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `contactId` | `string` | Yes | Contact ID |
| `nickname` | `string` | No | New nickname (or `null`/`undefined` to clear) |

**Returns:** `Promise<Contact>`

```javascript
const updated = await sdk.contacts.update('contact-uuid', 'Bob the Builder');
```

#### `sdk.contacts.remove(contactId)`

Remove a user from your contacts.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `contactId` | `string` | Yes | Contact ID |

**Returns:** `Promise<void>`

```javascript
await sdk.contacts.remove('contact-uuid');
```

#### `sdk.contacts.block(userId)`

Block a user. Blocked users cannot send you messages or call you.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | `string` | Yes | User ID to block |

**Returns:** `Promise<void>`

```javascript
await sdk.contacts.block('user-uuid');
```

#### `sdk.contacts.unblock(userId)`

Unblock a previously blocked user.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | `string` | Yes | User ID to unblock |

**Returns:** `Promise<void>`

```javascript
await sdk.contacts.unblock('user-uuid');
```

#### `sdk.contacts.getBlocked()`

Get a list of all blocked users.

**Returns:** `Promise<BlockedContact[]>`

```javascript
const blocked = await sdk.contacts.getBlocked();
blocked.forEach(b => {
  console.log(`${b.name} blocked at ${b.blockedAt}`);
});
```

---

### Calls Service

Manage voice and video calls, including WebRTC (1:1) and LiveKit (group) calls.

#### `sdk.calls.initiate(data)`

Start a new call.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `data.targetUserId` | `string` | Conditional | User ID for a 1:1 call (provide either this or `conversationId`) |
| `data.conversationId` | `string` | Conditional | Conversation ID for a group call |
| `data.type` | `"voice" \| "video"` | Yes | Call type |

**Returns:** `Promise<CallResponse>`

```javascript
// 1:1 video call
const call = await sdk.calls.initiate({
  targetUserId: 'user-uuid',
  type: 'video',
});

// Group voice call
const groupCall = await sdk.calls.initiate({
  conversationId: 'chatroom-uuid',
  type: 'voice',
});
```

#### `sdk.calls.accept(callId)`

Accept an incoming call.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `callId` | `string` | Yes | Call ID |

**Returns:** `Promise<CallResponse>`

```javascript
const call = await sdk.calls.accept('call-uuid');
```

#### `sdk.calls.reject(callId)`

Reject an incoming call.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `callId` | `string` | Yes | Call ID |

**Returns:** `Promise<void>`

```javascript
await sdk.calls.reject('call-uuid');
```

#### `sdk.calls.end(callId)`

End an active call.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `callId` | `string` | Yes | Call ID |

**Returns:** `Promise<void>`

```javascript
await sdk.calls.end('call-uuid');
```

#### `sdk.calls.getHistory(params?)`

Get the user's call history with pagination.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `params.page` | `number` | No | Page number |
| `params.pageSize` | `number` | No | Items per page |

**Returns:** `Promise<PaginatedResponse<CallHistoryItem>>`

```javascript
const { items: calls, totalCount } = await sdk.calls.getHistory({
  page: 1,
  pageSize: 20,
});

calls.forEach(call => {
  console.log(`${call.type} call - ${call.status} - ${call.duration}s`);
});
```

#### `sdk.calls.get(callId)`

Get details of a specific call.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `callId` | `string` | Yes | Call ID |

**Returns:** `Promise<CallHistoryItem>`

```javascript
const call = await sdk.calls.get('call-uuid');
```

#### `sdk.calls.delete(callId)`

Delete a call from history.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `callId` | `string` | Yes | Call ID |

**Returns:** `Promise<void>`

```javascript
await sdk.calls.delete('call-uuid');
```

#### `sdk.calls.getIceServers()`

Get ICE server (STUN/TURN) configuration for WebRTC calls.

**Returns:** `Promise<IceServer[]>`

```javascript
const iceServers = await sdk.calls.getIceServers();
// Use with RTCPeerConnection:
const pc = new RTCPeerConnection({ iceServers });
```

#### `sdk.calls.getLiveKitToken(conversationId)`

Get a LiveKit access token for joining a group video call.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `conversationId` | `string` | Yes | Conversation/room ID |

**Returns:** `Promise<LiveKitTokenResponse>` -- `{ token, url, roomName }`

```javascript
const { token, url, roomName } = await sdk.calls.getLiveKitToken('chatroom-uuid');
// Use with @livekit/client:
// const room = new Room();
// await room.connect(url, token);
```

---

### Media Service

Upload, download, and manage media files (images, videos, audio, documents).

#### `sdk.media.upload(file, conversationId?)`

Upload a single file.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file` | `File` | Yes | File to upload (browser `File` object) |
| `conversationId` | `string` | No | Associate the upload with a conversation |

**Returns:** `Promise<UploadResponse>`

```javascript
const result = await sdk.media.upload(file, 'conv-uuid');
console.log('Uploaded:', result.id, result.downloadUrl);
```

#### `sdk.media.uploadMultiple(files, conversationId?)`

Upload multiple files in one request.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `files` | `File[]` | Yes | Array of files |
| `conversationId` | `string` | No | Associate with a conversation |

**Returns:** `Promise<{ uploaded: UploadResponse[], errors: string[] }>`

```javascript
const { uploaded, errors } = await sdk.media.uploadMultiple(fileList, 'conv-uuid');
console.log(`${uploaded.length} succeeded, ${errors.length} failed`);
```

#### `sdk.media.uploadVoice(audioBlob, conversationId, duration)`

Upload a voice message recording.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `audioBlob` | `Blob` | Yes | Audio blob (typically WebM or OGG) |
| `conversationId` | `string` | Yes | Conversation ID |
| `duration` | `number` | Yes | Duration in seconds |

**Returns:** `Promise<UploadResponse>`

```javascript
// After recording with MediaRecorder:
const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
const result = await sdk.media.uploadVoice(audioBlob, 'conv-uuid', 12);

// Then send as a message
await sdk.messages.send('conv-uuid', {
  attachmentIds: [result.id],
  type: 'Audio',
});
```

#### `sdk.media.get(fileId)`

Get metadata about an uploaded file.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fileId` | `string` | Yes | File ID |

**Returns:** `Promise<UploadResponse>`

```javascript
const fileInfo = await sdk.media.get('file-uuid');
console.log(fileInfo.originalFileName, fileInfo.fileSize, fileInfo.contentType);
```

#### `sdk.media.delete(fileId)`

Delete an uploaded file.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fileId` | `string` | Yes | File ID |

**Returns:** `Promise<void>`

```javascript
await sdk.media.delete('file-uuid');
```

#### `sdk.media.getConversationMedia(conversationId, params?)`

Get all media shared in a conversation with pagination and type filtering.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `conversationId` | `string` | Yes | Conversation ID |
| `params.page` | `number` | No | Page number |
| `params.pageSize` | `number` | No | Items per page |
| `params.type` | `string` | No | Filter by type: `"image"`, `"video"`, `"audio"`, `"file"` |

**Returns:** `Promise<PaginatedResponse<Attachment>>`

```javascript
const { items: images } = await sdk.media.getConversationMedia('conv-uuid', {
  type: 'image',
  page: 1,
  pageSize: 20,
});
```

#### `sdk.media.getDownloadUrl(fileId, token?)`

Generate a direct download URL for a file. This method is **synchronous**.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fileId` | `string` | Yes | File ID |
| `token` | `string` | No | Access token override (uses the SDK's token by default) |

**Returns:** `string`

```javascript
const url = sdk.media.getDownloadUrl('file-uuid');
window.open(url); // Opens download in browser
```

#### `sdk.media.getThumbnailUrl(fileId, token?)`

Generate a thumbnail URL for an image or video. This method is **synchronous**.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fileId` | `string` | Yes | File ID |
| `token` | `string` | No | Access token override |

**Returns:** `string`

```javascript
const thumbUrl = sdk.media.getThumbnailUrl('file-uuid');
// Use in an <img> tag:
// <img src={thumbUrl} alt="thumbnail" />
```

#### `sdk.media.getStreamUrl(fileId, token?)`

Generate a streaming URL for audio or video files. This method is **synchronous**.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fileId` | `string` | Yes | File ID |
| `token` | `string` | No | Access token override |

**Returns:** `string`

```javascript
const streamUrl = sdk.media.getStreamUrl('file-uuid');
// Use in a <video> or <audio> tag:
// <video src={streamUrl} controls />
```

---

### Notifications Service

Manage push notifications and in-app notification state.

#### `sdk.notifications.list(params?)`

Get paginated notifications with the unread count.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `params.page` | `number` | No | Page number |
| `params.pageSize` | `number` | No | Items per page |

**Returns:** `Promise<PaginatedResponse<Notification> & { unreadCount: number }>`

```javascript
const { items, unreadCount, totalCount } = await sdk.notifications.list({
  page: 1,
  pageSize: 20,
});
console.log(`${unreadCount} unread out of ${totalCount} total`);
```

#### `sdk.notifications.getUnreadCount()`

Get the count of unread notifications.

**Returns:** `Promise<number>`

```javascript
const unread = await sdk.notifications.getUnreadCount();
```

#### `sdk.notifications.markAsRead(notificationId)`

Mark a single notification as read.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `notificationId` | `string` | Yes | Notification ID |

**Returns:** `Promise<void>`

```javascript
await sdk.notifications.markAsRead('notif-uuid');
```

#### `sdk.notifications.markAllAsRead()`

Mark all notifications as read.

**Returns:** `Promise<void>`

```javascript
await sdk.notifications.markAllAsRead();
```

#### `sdk.notifications.delete(notificationId)`

Delete a notification.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `notificationId` | `string` | Yes | Notification ID |

**Returns:** `Promise<void>`

```javascript
await sdk.notifications.delete('notif-uuid');
```

---

### Broadcasts Service

Subscribe to broadcast channels and consume broadcast message feeds.

#### `sdk.broadcasts.getChannels()`

Get all available broadcast channels.

**Returns:** `Promise<BroadcastChannel[]>`

```javascript
const channels = await sdk.broadcasts.getChannels();
channels.forEach(ch => {
  console.log(ch.name, `${ch.subscriberCount} subscribers`, ch.isSubscribed ? '(subscribed)' : '');
});
```

#### `sdk.broadcasts.getSubscriptions()`

Get channels the current user is subscribed to.

**Returns:** `Promise<BroadcastChannel[]>`

```javascript
const subscriptions = await sdk.broadcasts.getSubscriptions();
```

#### `sdk.broadcasts.subscribe(channelId)`

Subscribe to a broadcast channel.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `channelId` | `string` | Yes | Channel ID |

**Returns:** `Promise<void>`

```javascript
await sdk.broadcasts.subscribe('channel-uuid');
```

#### `sdk.broadcasts.unsubscribe(channelId)`

Unsubscribe from a broadcast channel.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `channelId` | `string` | Yes | Channel ID |

**Returns:** `Promise<void>`

```javascript
await sdk.broadcasts.unsubscribe('channel-uuid');
```

#### `sdk.broadcasts.getMessages(channelId, limit?)`

Get messages from a specific broadcast channel.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `channelId` | `string` | Yes | Channel ID |
| `limit` | `number` | No | Max messages to return (default: `50`) |

**Returns:** `Promise<PaginatedResponse<BroadcastMessage>>`

```javascript
const { items: messages } = await sdk.broadcasts.getMessages('channel-uuid', 25);
```

#### `sdk.broadcasts.getFeed(limit?)`

Get a combined feed of messages from all subscribed channels.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | `number` | No | Max messages to return (default: `50`) |

**Returns:** `Promise<PaginatedResponse<BroadcastMessage>>`

```javascript
const { items: feed } = await sdk.broadcasts.getFeed(50);
feed.forEach(msg => {
  console.log(`[${msg.channelName}] ${msg.content}`);
});
```

---

### Announcements Service

View and manage system-wide announcements from administrators.

#### `sdk.announcements.list(unreadOnly?)`

Get announcements.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `unreadOnly` | `boolean` | No | If `true`, return only unread announcements (default: `false`) |

**Returns:** `Promise<Announcement[]>`

```javascript
// All announcements
const all = await sdk.announcements.list();

// Only unread
const unread = await sdk.announcements.list(true);
```

#### `sdk.announcements.markAsRead(announcementId)`

Mark an announcement as read.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `announcementId` | `string` | Yes | Announcement ID |

**Returns:** `Promise<void>`

```javascript
await sdk.announcements.markAsRead('announcement-uuid');
```

#### `sdk.announcements.dismiss(announcementId)`

Dismiss an announcement (hide it permanently).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `announcementId` | `string` | Yes | Announcement ID |

**Returns:** `Promise<void>`

```javascript
await sdk.announcements.dismiss('announcement-uuid');
```

---

### Search Service

Search across users, conversations, and messages globally or within a conversation.

#### `sdk.search.search(request)`

Perform a global search.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `request.query` | `string` | Yes | Search query |
| `request.types` | `string[]` | No | Types to search: `"users"`, `"conversations"`, `"messages"` |
| `request.limit` | `number` | No | Max results per type |

**Returns:** `Promise<SearchResult>` -- `{ users, messages, conversations }`

```javascript
const results = await sdk.search.search({
  query: 'meeting notes',
  types: ['messages', 'conversations'],
  limit: 10,
});

console.log(`Found ${results.messages.length} messages, ${results.conversations.length} conversations`);
```

#### `sdk.search.searchInConversation(request)`

Search for messages within a specific conversation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `request.conversationId` | `string` | Yes | Conversation to search in |
| `request.query` | `string` | Yes | Search query |
| `request.limit` | `number` | No | Max results |
| `request.before` | `string` | No | Search before this date (ISO 8601) |
| `request.after` | `string` | No | Search after this date (ISO 8601) |

**Returns:** `Promise<MessageSearchResult[]>`

```javascript
const results = await sdk.search.searchInConversation({
  conversationId: 'conv-uuid',
  query: 'budget report',
  limit: 20,
});
```

#### `sdk.search.searchUsers(query, limit?)`

Search for users only (convenience method that wraps `search()`).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | `string` | Yes | Search query |
| `limit` | `number` | No | Max results (default: `20`) |

**Returns:** `Promise<UserSearchResult[]>`

```javascript
const users = await sdk.search.searchUsers('alice', 10);
```

---

### Devices Service

Manage active sessions and register devices for push notifications.

#### `sdk.devices.list()`

Get all active sessions/devices for the current user.

**Returns:** `Promise<Device[]>`

```javascript
const devices = await sdk.devices.list();
devices.forEach(d => {
  console.log(d.name, d.platform, d.isCurrent ? '(this device)' : '', d.lastActive);
});
```

#### `sdk.devices.register(data)`

Register a device for push notifications.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `data.token` | `string` | Yes | Push notification token (FCM, APNs) |
| `data.platform` | `"web" \| "ios" \| "android"` | Yes | Device platform |
| `data.deviceName` | `string` | No | Human-readable device name |

**Returns:** `Promise<void>`

```javascript
// Register for FCM push notifications
await sdk.devices.register({
  token: 'fcm-device-token',
  platform: 'web',
  deviceName: 'Chrome on Windows',
});
```

#### `sdk.devices.remove(deviceId)`

Remove a session/device (logs it out).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `deviceId` | `string` | Yes | Session/device ID |

**Returns:** `Promise<void>`

```javascript
await sdk.devices.remove('session-uuid');
```

#### `sdk.devices.removeAllOthers()`

Remove all sessions except the current one.

**Returns:** `Promise<void>`

```javascript
await sdk.devices.removeAllOthers();
```

---

### Two-Factor Service

Enable, disable, and manage two-factor authentication (TOTP).

#### `sdk.twoFactor.enable(password)`

Enable 2FA for the current user. Returns the setup information including a QR code URL for authenticator apps.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `password` | `string` | Yes | Current password for verification |

**Returns:** `Promise<TwoFactorSetupResponse>` -- `{ secret, qrCodeUrl, backupCodes }`

```javascript
const { secret, qrCodeUrl, backupCodes } = await sdk.twoFactor.enable('MyPassword1');

// Display QR code for the user to scan with an authenticator app
// qrCodeUrl is an otpauth:// URL that can be rendered as a QR code
console.log('Scan this QR code:', qrCodeUrl);
console.log('Or enter manually:', secret);
console.log('Save these backup codes:', backupCodes);
```

#### `sdk.twoFactor.disable(password, code)`

Disable 2FA for the current user.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `password` | `string` | Yes | Current password |
| `code` | `string` | Yes | Current TOTP code from authenticator app |

**Returns:** `Promise<void>`

```javascript
await sdk.twoFactor.disable('MyPassword1', '123456');
```

#### `sdk.twoFactor.verify(code)`

Verify a TOTP code (used during 2FA setup to confirm it works).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `code` | `string` | Yes | 6-digit code |

**Returns:** `Promise<void>`

```javascript
await sdk.twoFactor.verify('123456');
```

#### `sdk.twoFactor.getBackupCodes()`

Retrieve existing backup codes.

**Returns:** `Promise<BackupCodesResponse>` -- `{ codes, generatedAt }`

```javascript
const { codes, generatedAt } = await sdk.twoFactor.getBackupCodes();
console.log(`${codes.length} codes generated at ${generatedAt}`);
```

#### `sdk.twoFactor.regenerateBackupCodes(password)`

Generate new backup codes (invalidates the old ones).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `password` | `string` | Yes | Current password |

**Returns:** `Promise<BackupCodesResponse>`

```javascript
const { codes } = await sdk.twoFactor.regenerateBackupCodes('MyPassword1');
console.log('New backup codes:', codes);
```

---

### Reports Service

Submit reports about users or messages for moderation review.

#### `sdk.reports.create(data)`

Create a new report.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `data.reportedUserId` | `string` | No | User ID being reported (provide at least one target) |
| `data.reportedMessageId` | `string` | No | Message ID being reported |
| `data.reportedConversationId` | `string` | No | Conversation ID being reported |
| `data.reportType` | `string` | Yes | One of: `"spam"`, `"harassment"`, `"inappropriate"`, `"impersonation"`, `"other"` |
| `data.description` | `string` | Yes | Detailed description of the issue |

**Returns:** `Promise<Report>`

```javascript
// Report a user
const report = await sdk.reports.create({
  reportedUserId: 'user-uuid',
  reportType: 'harassment',
  description: 'This user is sending unwanted messages repeatedly.',
});

// Report a message
const report = await sdk.reports.create({
  reportedMessageId: 'msg-uuid',
  reportType: 'spam',
  description: 'This message contains spam links.',
});
```

---

### Invitations Service

Manage invitation codes for invite-only registration mode.

#### `sdk.invitations.list(params?)`

Get a paginated list of invitations.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `params.page` | `number` | No | Page number |
| `params.pageSize` | `number` | No | Items per page |
| `params.search` | `string` | No | Search by email |
| `params.status` | `string` | No | Filter: `"all"`, `"pending"`, `"used"`, `"expired"` |

**Returns:** `Promise<InvitationListResponse>`

```javascript
const { items, totalCount, totalPages } = await sdk.invitations.list({
  page: 1,
  pageSize: 20,
  status: 'pending',
});
```

#### `sdk.invitations.get(id)`

Get a single invitation by ID.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Invitation ID |

**Returns:** `Promise<Invitation>`

```javascript
const invitation = await sdk.invitations.get('invite-uuid');
console.log(invitation.code, invitation.email, invitation.isUsed);
```

#### `sdk.invitations.getStats()`

Get invitation statistics.

**Returns:** `Promise<InvitationStats>` -- `{ total, pending, used, expired }`

```javascript
const stats = await sdk.invitations.getStats();
console.log(`Total: ${stats.total}, Pending: ${stats.pending}, Used: ${stats.used}`);
```

#### `sdk.invitations.create(request)`

Create a new invitation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `request.email` | `string` | Yes | Email to send the invitation to |
| `request.expiryDays` | `number` | No | Days until expiration |

**Returns:** `Promise<Invitation>`

```javascript
const invitation = await sdk.invitations.create({
  email: 'newuser@example.com',
  expiryDays: 7,
});
console.log('Invitation code:', invitation.code);
```

#### `sdk.invitations.resend(id, request?)`

Resend an invitation email and optionally extend the expiry.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Invitation ID |
| `request.expiryDays` | `number` | No | New expiry period in days |

**Returns:** `Promise<Invitation>`

```javascript
const updated = await sdk.invitations.resend('invite-uuid', { expiryDays: 14 });
```

#### `sdk.invitations.revoke(id)`

Revoke an invitation so it can no longer be used.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Invitation ID |

**Returns:** `Promise<Invitation>`

```javascript
const revoked = await sdk.invitations.revoke('invite-uuid');
```

#### `sdk.invitations.delete(id)`

Permanently delete an invitation record.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Invitation ID |

**Returns:** `Promise<void>`

```javascript
await sdk.invitations.delete('invite-uuid');
```

---

## Real-Time Integration

The SDK handles REST API calls. For real-time features (instant messages, typing indicators, presence, call signaling), combine it with `@microsoft/signalr`.

### Setting Up SignalR with the SDK

```bash
npm install @microsoft/signalr
```

```javascript
import { PeopleConnectSDK } from '@peopleconnect/sdk';
import * as signalR from '@microsoft/signalr';

const sdk = new PeopleConnectSDK({
  baseUrl: 'https://your-server.com/api',
  onTokenRefresh: (tokens) => {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    // Reconnect SignalR with new token
    reconnectSignalR(tokens.accessToken);
  },
});

// Login first
const { accessToken } = await sdk.auth.login({
  username: 'alice',
  password: 'SecureP@ss1',
});

// Build SignalR connections
function buildConnection(hubPath, token) {
  return new signalR.HubConnectionBuilder()
    .withUrl(`https://your-server.com${hubPath}`, {
      accessTokenFactory: () => token,
    })
    .withAutomaticReconnect()
    .build();
}

// Chat Hub - messages, typing, reactions, read receipts
const chatHub = buildConnection('/hubs/chat', accessToken);

chatHub.on('ReceiveMessage', (message) => {
  console.log('New message:', message.content);
});

chatHub.on('TypingStarted', (conversationId, userId, userName) => {
  console.log(`${userName} is typing in ${conversationId}...`);
});

chatHub.on('TypingStopped', (conversationId, userId) => {
  console.log(`User stopped typing in ${conversationId}`);
});

chatHub.on('MessageEdited', (conversationId, message) => {
  console.log('Message edited:', message.id);
});

chatHub.on('MessageDeleted', (conversationId, messageId) => {
  console.log('Message deleted:', messageId);
});

chatHub.on('ReactionAdded', (conversationId, messageId, reaction) => {
  console.log(`Reaction ${reaction.emoji} added to ${messageId}`);
});

chatHub.on('ReactionRemoved', (conversationId, messageId, userId, emoji) => {
  console.log(`Reaction ${emoji} removed from ${messageId}`);
});

chatHub.on('MessageRead', (conversationId, userId, messageId) => {
  console.log(`User ${userId} read up to ${messageId}`);
});

await chatHub.start();

// Send typing indicator
await chatHub.invoke('StartTyping', conversationId);
await chatHub.invoke('StopTyping', conversationId);

// Presence Hub - online/offline status
const presenceHub = buildConnection('/hubs/presence', accessToken);

presenceHub.on('UserOnline', (userId) => {
  console.log(`User ${userId} came online`);
});

presenceHub.on('UserOffline', (userId) => {
  console.log(`User ${userId} went offline`);
});

presenceHub.on('OnlineUsers', (onlineUsers) => {
  console.log('Currently online:', onlineUsers);
});

await presenceHub.start();

// Notification Hub - push notifications
const notificationHub = buildConnection('/hubs/notifications', accessToken);

notificationHub.on('ReceiveNotification', (notification) => {
  console.log('Notification:', notification.title);
});

await notificationHub.start();
```

### SignalR Hub Reference

| Hub | Path | Purpose |
|-----|------|---------|
| ChatHub | `/hubs/chat` | Messages, typing indicators, reactions, read receipts |
| PresenceHub | `/hubs/presence` | Online/offline status, last seen |
| CallHub | `/hubs/call` | WebRTC signaling for 1:1 calls |
| NotificationHub | `/hubs/notifications` | Real-time push notifications |

---

## Web App Integration

### Next.js

See [INTEGRATION.md](./INTEGRATION.md#nextjs) for a complete Next.js setup guide.

### React (Vite / CRA)

See [INTEGRATION.md](./INTEGRATION.md#react-vitecra) for a complete React setup guide.

### Vue.js

See [INTEGRATION.md](./INTEGRATION.md#vuejs) for a complete Vue.js setup guide.

---

## Node.js Integration

The SDK works in Node.js 18+ out of the box (native `fetch`). For Node.js 16-17, install `node-fetch`.

### Basic Server-Side Usage

```javascript
import { PeopleConnectSDK } from '@peopleconnect/sdk';

const sdk = new PeopleConnectSDK({
  baseUrl: 'https://your-server.com/api',
});

// Authenticate as a service account
const { user } = await sdk.auth.login({
  username: 'bot-account',
  password: 'BotP@ssword1',
});

// Send an automated message
await sdk.messages.send('conv-uuid', {
  content: 'This is an automated notification from the server.',
});
```

### Building a Bot

```javascript
import { PeopleConnectSDK } from '@peopleconnect/sdk';
import * as signalR from '@microsoft/signalr';

const sdk = new PeopleConnectSDK({
  baseUrl: 'https://your-server.com/api',
});

const { accessToken } = await sdk.auth.login({
  username: 'helpdesk-bot',
  password: 'BotP@ss1',
});

// Listen for incoming messages via SignalR
const chatHub = new signalR.HubConnectionBuilder()
  .withUrl('https://your-server.com/hubs/chat', {
    accessTokenFactory: () => accessToken,
  })
  .withAutomaticReconnect()
  .build();

chatHub.on('ReceiveMessage', async (message) => {
  // Do not respond to own messages
  if (message.sender.username === 'helpdesk-bot') return;

  // Auto-reply
  if (message.content.toLowerCase().includes('help')) {
    await sdk.messages.send(message.conversationId, {
      content: 'Hello! How can I assist you today? Type "faq" for common questions.',
      replyToMessageId: message.id,
    });
  }
});

await chatHub.start();
console.log('Bot is online and listening for messages.');
```

---

## Error Handling

All SDK methods return Promises. Errors are thrown as standard `Error` objects with the server's error message.

### Try/Catch Pattern

```javascript
try {
  await sdk.auth.login({ username: 'alice', password: 'wrong' });
} catch (error) {
  console.error('Login failed:', error.message);
  // error.message contains the server's error message, e.g.:
  // "Invalid username or password"
  // "Account is locked"
  // "Request timeout"
}
```

### Global Error Callback

Use the `onError` callback for centralized error handling. This fires **before** the promise rejects, so you can use it for logging while still handling errors locally.

```javascript
const sdk = new PeopleConnectSDK({
  baseUrl: 'https://your-server.com/api',
  onError: (error) => {
    // error: { message: string, code?: string, details?: Record<string, string[]> }

    // Log to your monitoring service
    analytics.trackError('PeopleConnect API', error.message, error.code);

    // Handle validation errors
    if (error.details) {
      Object.entries(error.details).forEach(([field, messages]) => {
        console.warn(`Validation error on ${field}: ${messages.join(', ')}`);
      });
    }
  },
});
```

### Common Error Scenarios

| Error Message | Cause | Resolution |
|---------------|-------|------------|
| `"Request timeout"` | Request exceeded the configured timeout | Increase `timeout` in config or check network |
| `"HTTP 401"` | Authentication failed or token expired | SDK will auto-refresh; if that fails, `onUnauthorized` fires |
| `"HTTP 403"` | Insufficient permissions | Check user's role and permissions |
| `"HTTP 404"` | Resource not found | Verify the ID exists |
| `"HTTP 429"` | Rate limit exceeded | Implement backoff/retry logic |
| `"HTTP 413"` | File too large | Reduce file size before uploading |
| Validation messages | Invalid request data | Check `error.details` for field-specific messages |

---

## Type Support

### TypeScript Projects

The SDK ships with `types.d.ts`, providing full type definitions. TypeScript projects get autocompletion and type checking automatically.

```typescript
import { PeopleConnectSDK } from '@peopleconnect/sdk';
import type { Message, Conversation, User, LoginResponse } from '@peopleconnect/sdk';

const sdk = new PeopleConnectSDK({
  baseUrl: 'https://your-server.com/api',
});

// Full type inference on all methods
const response: LoginResponse = await sdk.auth.login({
  username: 'alice',
  password: 'pass',
});

const conversations: PaginatedResponse<Conversation> = await sdk.conversations.list();
```

### JavaScript Projects (IDE Autocompletion)

Even in plain JavaScript projects, IDEs like VS Code will pick up the JSDoc annotations and `types.d.ts` file for autocompletion, parameter hints, and hover documentation. No configuration needed -- it works automatically when the package is installed via npm.

### Importing Types Separately

You can import type constants for validation:

```javascript
import { UserStatusValues, MessageTypeValues, ContactStatusValues } from '@peopleconnect/sdk/types';

// UserStatusValues = ["Online", "Away", "Busy", "Offline"]
// MessageTypeValues = ["Text", "Image", "Video", "Audio", "File", "Location", "System", "VoiceCall", "VideoCall"]

if (UserStatusValues.includes(someStatus)) {
  // Valid status
}
```

---

## API Reference Table

Complete mapping of SDK methods to API endpoints.

### Auth

| Method | HTTP | Endpoint |
|--------|------|----------|
| `auth.login(data)` | POST | `/auth/login` |
| `auth.register(data)` | POST | `/auth/register` |
| `auth.logout()` | POST | `/auth/logout` |
| `auth.refreshToken(token)` | POST | `/auth/refresh` |
| `auth.getCurrentUser()` | GET | `/auth/me` |
| `auth.checkUsername(username)` | GET | `/auth/check-username/{username}` |
| `auth.verifyTwoFactor(data)` | POST | `/auth/2fa/verify` |
| `auth.forgotPassword(identifier)` | POST | `/auth/forgot-password` |
| `auth.resetPassword(data)` | POST | `/auth/reset-password` |
| `auth.changePassword(data)` | POST | `/auth/change-password` |
| `auth.deleteAccount()` | DELETE | `/auth/account` |
| `auth.verifyEmail(token)` | POST | `/auth/verify-email` |
| `auth.resendVerification(email)` | POST | `/auth/resend-verification` |

### Users

| Method | HTTP | Endpoint |
|--------|------|----------|
| `users.getProfile()` | GET | `/auth/me` |
| `users.getUser(userId)` | GET | `/users/{userId}` |
| `users.uploadAvatar(file)` | POST | `/auth/avatar` |
| `users.deleteAvatar()` | DELETE | `/auth/avatar` |

### Conversations

| Method | HTTP | Endpoint |
|--------|------|----------|
| `conversations.list(params)` | GET | `/conversations` |
| `conversations.get(id)` | GET | `/conversations/{id}` |
| `conversations.createDM(data)` | POST | `/conversations/dm` |
| `conversations.createChatroom(data)` | POST | `/conversations/chatroom` |
| `conversations.update(id, data)` | PUT | `/conversations/{id}` |
| `conversations.delete(id)` | DELETE | `/conversations/{id}` |
| `conversations.leave(id)` | POST | `/conversations/{id}/leave` |
| `conversations.addParticipants(id, userIds)` | POST | `/conversations/{id}/participants` |
| `conversations.removeParticipant(id, userId)` | DELETE | `/conversations/{id}/participants/{userId}` |
| `conversations.updateParticipantRole(id, userId, role)` | PATCH | `/conversations/{id}/participants/{userId}/role` |
| `conversations.getMembers(id)` | GET | `/conversations/{id}/members` |
| `conversations.mute(id, until)` | POST | `/conversations/{id}/mute` |
| `conversations.unmute(id)` | POST | `/conversations/{id}/unmute` |
| `conversations.archive(id)` | POST | `/conversations/{id}/archive` |
| `conversations.unarchive(id)` | POST | `/conversations/{id}/unarchive` |
| `conversations.clear(id)` | POST | `/conversations/{id}/clear` |
| `conversations.pin(id)` | POST | `/conversations/{id}/pin` |
| `conversations.unpin(id)` | POST | `/conversations/{id}/unpin` |
| `conversations.markAsRead(id, msgId)` | POST | `/conversations/{id}/read` |
| `conversations.uploadAvatar(id, file)` | POST | `/conversations/{id}/avatar` |

### Messages

| Method | HTTP | Endpoint |
|--------|------|----------|
| `messages.list(convId, params)` | GET | `/conversations/{convId}/messages` |
| `messages.get(convId, msgId)` | GET | `/conversations/{convId}/messages/{msgId}` |
| `messages.send(convId, data)` | POST | `/conversations/{convId}/messages` |
| `messages.edit(convId, msgId, data)` | PUT | `/conversations/{convId}/messages/{msgId}` |
| `messages.delete(convId, msgId, forEveryone)` | DELETE | `/conversations/{convId}/messages/{msgId}` |
| `messages.react(convId, msgId, emoji)` | POST | `/conversations/{convId}/messages/{msgId}/reactions` |
| `messages.removeReaction(convId, msgId, emoji)` | DELETE | `/conversations/{convId}/messages/{msgId}/reactions` |
| `messages.forward(convId, msgId, targets)` | POST | `/conversations/{convId}/messages/{msgId}/forward` |

### Contacts

| Method | HTTP | Endpoint |
|--------|------|----------|
| `contacts.list(params)` | GET | `/contacts` |
| `contacts.getRequests()` | GET | `/contacts/requests` |
| `contacts.searchUsers(query, limit)` | GET | `/contacts/search` |
| `contacts.sendRequest(userId, nickname)` | POST | `/contacts` |
| `contacts.acceptRequest(contactId)` | POST | `/contacts/requests/{contactId}/accept` |
| `contacts.rejectRequest(contactId)` | POST | `/contacts/requests/{contactId}/reject` |
| `contacts.update(contactId, nickname)` | PUT | `/contacts/{contactId}` |
| `contacts.remove(contactId)` | DELETE | `/contacts/{contactId}` |
| `contacts.block(userId)` | POST | `/contacts/block/{userId}` |
| `contacts.unblock(userId)` | DELETE | `/contacts/block/{userId}` |
| `contacts.getBlocked()` | GET | `/contacts/blocked` |

### Calls

| Method | HTTP | Endpoint |
|--------|------|----------|
| `calls.initiate(data)` | POST | `/calls/initiate` |
| `calls.accept(callId)` | POST | `/calls/{callId}/accept` |
| `calls.reject(callId)` | POST | `/calls/{callId}/reject` |
| `calls.end(callId)` | POST | `/calls/{callId}/end` |
| `calls.getHistory(params)` | GET | `/calls/history` |
| `calls.get(callId)` | GET | `/calls/{callId}` |
| `calls.delete(callId)` | DELETE | `/calls/{callId}` |
| `calls.getIceServers()` | GET | `/calls/ice-servers` |
| `calls.getLiveKitToken(convId)` | POST | `/calls/livekit/token` |

### Media

| Method | HTTP | Endpoint |
|--------|------|----------|
| `media.upload(file, convId)` | POST | `/media/upload` |
| `media.uploadMultiple(files, convId)` | POST | `/media/upload/multiple` |
| `media.uploadVoice(blob, convId, dur)` | POST | `/media/voice` |
| `media.get(fileId)` | GET | `/media/{fileId}` |
| `media.delete(fileId)` | DELETE | `/media/{fileId}` |
| `media.getConversationMedia(convId)` | GET | `/media/conversation/{convId}` |
| `media.getDownloadUrl(fileId)` | -- | `/media/{fileId}/download` (sync URL builder) |
| `media.getThumbnailUrl(fileId)` | -- | `/media/{fileId}/thumbnail` (sync URL builder) |
| `media.getStreamUrl(fileId)` | -- | `/media/{fileId}/stream` (sync URL builder) |

### Notifications

| Method | HTTP | Endpoint |
|--------|------|----------|
| `notifications.list(params)` | GET | `/notifications` |
| `notifications.getUnreadCount()` | GET | `/notifications/count` |
| `notifications.markAsRead(id)` | POST | `/notifications/{id}/read` |
| `notifications.markAllAsRead()` | POST | `/notifications/read-all` |
| `notifications.delete(id)` | DELETE | `/notifications/{id}` |

### Broadcasts

| Method | HTTP | Endpoint |
|--------|------|----------|
| `broadcasts.getChannels()` | GET | `/broadcasts/channels` |
| `broadcasts.getSubscriptions()` | GET | `/broadcasts/channels/subscribed` |
| `broadcasts.subscribe(channelId)` | POST | `/broadcasts/channels/{channelId}/subscribe` |
| `broadcasts.unsubscribe(channelId)` | DELETE | `/broadcasts/channels/{channelId}/subscribe` |
| `broadcasts.getMessages(channelId)` | GET | `/broadcasts/channels/{channelId}/messages` |
| `broadcasts.getFeed(limit)` | GET | `/broadcasts/messages/feed` |

### Announcements

| Method | HTTP | Endpoint |
|--------|------|----------|
| `announcements.list(unreadOnly)` | GET | `/announcements/my` |
| `announcements.markAsRead(id)` | POST | `/announcements/{id}/read` |
| `announcements.dismiss(id)` | POST | `/announcements/{id}/dismiss` |

### Search

| Method | HTTP | Endpoint |
|--------|------|----------|
| `search.search(request)` | GET | `/search` |
| `search.searchInConversation(request)` | GET | `/search/conversations/{convId}` |
| `search.searchUsers(query, limit)` | GET | `/search` (type=users) |

### Devices

| Method | HTTP | Endpoint |
|--------|------|----------|
| `devices.list()` | GET | `/auth/sessions` |
| `devices.register(data)` | POST | `/devices/register` |
| `devices.remove(deviceId)` | DELETE | `/auth/sessions/{deviceId}` |
| `devices.removeAllOthers()` | DELETE | `/auth/sessions` |

### Two-Factor

| Method | HTTP | Endpoint |
|--------|------|----------|
| `twoFactor.enable(password)` | POST | `/auth/2fa/enable` |
| `twoFactor.disable(password, code)` | POST | `/auth/2fa/disable` |
| `twoFactor.verify(code)` | POST | `/auth/2fa/verify` |
| `twoFactor.getBackupCodes()` | GET | `/auth/2fa/backup-codes` |
| `twoFactor.regenerateBackupCodes(pw)` | POST | `/auth/2fa/backup-codes/regenerate` |

### Reports

| Method | HTTP | Endpoint |
|--------|------|----------|
| `reports.create(data)` | POST | `/reports` |

### Invitations

| Method | HTTP | Endpoint |
|--------|------|----------|
| `invitations.list(params)` | GET | `/invitations` |
| `invitations.get(id)` | GET | `/invitations/{id}` |
| `invitations.getStats()` | GET | `/invitations/stats` |
| `invitations.create(request)` | POST | `/invitations` |
| `invitations.resend(id, request)` | POST | `/invitations/{id}/resend` |
| `invitations.revoke(id)` | POST | `/invitations/{id}/revoke` |
| `invitations.delete(id)` | DELETE | `/invitations/{id}` |

---

## Browser Compatibility

The SDK uses the following browser APIs:

| API | Required | Polyfill Available |
|-----|----------|-------------------|
| `fetch` | Yes | [whatwg-fetch](https://www.npmjs.com/package/whatwg-fetch) |
| `FormData` | Yes (for uploads) | Built-in in all modern browsers |
| `AbortController` | Yes (for timeouts) | [abort-controller](https://www.npmjs.com/package/abort-controller) |
| `URL` | Yes | Built-in in all modern browsers |
| ES6 Classes, async/await | Yes | Transpile with Babel if needed |

**Minimum browser versions (no polyfills needed):**

| Browser | Version |
|---------|---------|
| Chrome | 66+ |
| Firefox | 57+ |
| Safari | 12+ |
| Edge | 79+ (Chromium) |
| Node.js | 18+ (native fetch), 16+ with polyfill |

---

## License

MIT
