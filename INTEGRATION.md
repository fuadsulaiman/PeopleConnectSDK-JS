# PeopleConnect JavaScript SDK -- Integration Guide

Step-by-step integration guides for popular frameworks, real-time features, and production best practices.

---

## Table of Contents

- [Next.js](#nextjs)
- [React (Vite/CRA)](#react-vitecra)
- [Vue.js](#vuejs)
- [Node.js (Bots and Automation)](#nodejs-bots-and-automation)
- [SignalR Real-Time Setup](#signalr-real-time-setup)
- [File Upload Handling](#file-upload-handling)
- [Authentication Flow](#authentication-flow)
- [Token Refresh Mechanism](#token-refresh-mechanism)
- [Best Practices and Common Pitfalls](#best-practices-and-common-pitfalls)
- [Browser Compatibility Notes](#browser-compatibility-notes)
- [Server-Side Rendering Considerations](#server-side-rendering-considerations)

---

## Next.js

### 1. Install Dependencies

```bash
npm install @peopleconnect/sdk @microsoft/signalr
```

### 2. Create the SDK Provider

Create a context provider so the SDK instance is shared across all components. Since the SDK uses browser APIs (`fetch`, `localStorage`), it must only be initialized on the client.

```javascript
// src/lib/peopleconnect.js
'use client';

import { createContext, useContext, useRef } from 'react';
import { PeopleConnectSDK } from '@peopleconnect/sdk';

const SDKContext = createContext(null);

export function PeopleConnectProvider({ children, baseUrl }) {
  const sdkRef = useRef(null);

  if (!sdkRef.current) {
    sdkRef.current = new PeopleConnectSDK({
      baseUrl,
      onTokenRefresh: (tokens) => {
        localStorage.setItem('pc_access_token', tokens.accessToken);
        localStorage.setItem('pc_refresh_token', tokens.refreshToken);
      },
      onUnauthorized: () => {
        localStorage.removeItem('pc_access_token');
        localStorage.removeItem('pc_refresh_token');
        window.location.href = '/login';
      },
    });

    // Restore tokens if they exist
    const accessToken = typeof window !== 'undefined'
      ? localStorage.getItem('pc_access_token')
      : null;
    const refreshToken = typeof window !== 'undefined'
      ? localStorage.getItem('pc_refresh_token')
      : null;

    if (accessToken && refreshToken) {
      sdkRef.current.setTokens({ accessToken, refreshToken });
    }
  }

  return (
    <SDKContext.Provider value={sdkRef.current}>
      {children}
    </SDKContext.Provider>
  );
}

export function useSDK() {
  const sdk = useContext(SDKContext);
  if (!sdk) {
    throw new Error('useSDK must be used within a PeopleConnectProvider');
  }
  return sdk;
}
```

### 3. Add the Provider to Your Layout

```javascript
// src/app/layout.js
import { PeopleConnectProvider } from '@/lib/peopleconnect';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <PeopleConnectProvider baseUrl={process.env.NEXT_PUBLIC_API_URL}>
          {children}
        </PeopleConnectProvider>
      </body>
    </html>
  );
}
```

Add the environment variable:

```env
# .env.local
NEXT_PUBLIC_API_URL=https://your-server.com/api
```

### 4. Use in Components

```javascript
// src/app/chat/page.js
'use client';

import { useEffect, useState } from 'react';
import { useSDK } from '@/lib/peopleconnect';

export default function ChatPage() {
  const sdk = useSDK();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadConversations() {
      try {
        const { items } = await sdk.conversations.list({ page: 1, pageSize: 50 });
        setConversations(items);
      } catch (err) {
        console.error('Failed to load conversations:', err.message);
      } finally {
        setLoading(false);
      }
    }

    loadConversations();
  }, [sdk]);

  if (loading) return <div>Loading conversations...</div>;

  return (
    <div>
      <h1>Conversations</h1>
      <ul>
        {conversations.map((conv) => (
          <li key={conv.id}>
            {conv.name || conv.participants.map(p => p.user.name).join(', ')}
            {conv.unreadCount > 0 && <span> ({conv.unreadCount} unread)</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### 5. Login Page

```javascript
// src/app/login/page.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSDK } from '@/lib/peopleconnect';

export default function LoginPage() {
  const sdk = useSDK();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setError('');

    try {
      const { user, accessToken, refreshToken, requiresTwoFactor } = await sdk.auth.login({
        username,
        password,
      });

      // Store tokens
      localStorage.setItem('pc_access_token', accessToken);
      localStorage.setItem('pc_refresh_token', refreshToken);

      if (requiresTwoFactor) {
        router.push('/two-factor');
      } else {
        router.push('/chat');
      }
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form onSubmit={handleLogin}>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
      <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" />
      <button type="submit">Login</button>
    </form>
  );
}
```

### 6. Protecting Routes (Middleware)

```javascript
// src/middleware.js
import { NextResponse } from 'next/server';

export function middleware(request) {
  // Client-side tokens are in localStorage, which is not accessible in middleware.
  // Use cookies for SSR-compatible auth, or rely on client-side redirect.
  // This example shows a simple client-side approach.
  return NextResponse.next();
}

// For client-side protection, create a wrapper component:
```

```javascript
// src/components/auth-guard.js
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSDK } from '@/lib/peopleconnect';

export function AuthGuard({ children }) {
  const sdk = useSDK();
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('pc_access_token');
    if (!token) {
      router.replace('/login');
      return;
    }

    sdk.auth.getCurrentUser()
      .then(() => setAuthenticated(true))
      .catch(() => {
        localStorage.removeItem('pc_access_token');
        localStorage.removeItem('pc_refresh_token');
        router.replace('/login');
      });
  }, [sdk, router]);

  if (!authenticated) return <div>Checking authentication...</div>;
  return children;
}
```

---

## React (Vite/CRA)

### 1. Install Dependencies

```bash
npm install @peopleconnect/sdk @microsoft/signalr
```

### 2. Create the SDK Instance

```javascript
// src/sdk.js
import { PeopleConnectSDK } from '@peopleconnect/sdk';

const sdk = new PeopleConnectSDK({
  baseUrl: import.meta.env.VITE_API_URL, // Vite
  // baseUrl: process.env.REACT_APP_API_URL, // CRA

  onTokenRefresh: (tokens) => {
    localStorage.setItem('pc_access_token', tokens.accessToken);
    localStorage.setItem('pc_refresh_token', tokens.refreshToken);
  },

  onUnauthorized: () => {
    localStorage.removeItem('pc_access_token');
    localStorage.removeItem('pc_refresh_token');
    window.location.href = '/login';
  },
});

// Restore tokens on app load
const accessToken = localStorage.getItem('pc_access_token');
const refreshToken = localStorage.getItem('pc_refresh_token');
if (accessToken && refreshToken) {
  sdk.setTokens({ accessToken, refreshToken });
}

export default sdk;
```

### 3. Create a Custom Hook

```javascript
// src/hooks/useConversations.js
import { useState, useEffect } from 'react';
import sdk from '../sdk';

export function useConversations(page = 1, pageSize = 20) {
  const [conversations, setConversations] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const result = await sdk.conversations.list({ page, pageSize });
        if (!cancelled) {
          setConversations(result.items);
          setTotalCount(result.totalCount);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [page, pageSize]);

  return { conversations, totalCount, loading, error };
}
```

### 4. Use in Components

```javascript
// src/components/ConversationList.jsx
import { useConversations } from '../hooks/useConversations';

export function ConversationList({ onSelect }) {
  const { conversations, loading, error } = useConversations();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <ul>
      {conversations.map((conv) => (
        <li key={conv.id} onClick={() => onSelect(conv)}>
          <strong>{conv.name || 'Direct Message'}</strong>
          {conv.lastMessage && <p>{conv.lastMessage.content}</p>}
          {conv.unreadCount > 0 && <span className="badge">{conv.unreadCount}</span>}
        </li>
      ))}
    </ul>
  );
}
```

### 5. Message Input with File Upload

```javascript
// src/components/MessageInput.jsx
import { useState, useRef } from 'react';
import sdk from '../sdk';

export function MessageInput({ conversationId, onMessageSent }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef(null);

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim() && !fileInputRef.current?.files?.length) return;

    setSending(true);
    try {
      let attachmentIds = [];

      // Upload files first
      if (fileInputRef.current?.files?.length) {
        const files = Array.from(fileInputRef.current.files);
        const { uploaded } = await sdk.media.uploadMultiple(files, conversationId);
        attachmentIds = uploaded.map((u) => u.id);
      }

      // Send the message
      const message = await sdk.messages.send(conversationId, {
        content: text.trim() || undefined,
        attachmentIds: attachmentIds.length > 0 ? attachmentIds : undefined,
      });

      setText('');
      fileInputRef.current.value = '';
      onMessageSent?.(message);
    } catch (err) {
      alert('Failed to send: ' + err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSend}>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message..."
        disabled={sending}
      />
      <input ref={fileInputRef} type="file" multiple />
      <button type="submit" disabled={sending}>
        {sending ? 'Sending...' : 'Send'}
      </button>
    </form>
  );
}
```

### 6. Environment Variables

**Vite** (`.env`):
```env
VITE_API_URL=https://your-server.com/api
VITE_SIGNALR_URL=https://your-server.com
```

**Create React App** (`.env`):
```env
REACT_APP_API_URL=https://your-server.com/api
REACT_APP_SIGNALR_URL=https://your-server.com
```

---

## Vue.js

### 1. Install Dependencies

```bash
npm install @peopleconnect/sdk @microsoft/signalr
```

### 2. Create an SDK Plugin

```javascript
// src/plugins/peopleconnect.js
import { PeopleConnectSDK } from '@peopleconnect/sdk';

const sdk = new PeopleConnectSDK({
  baseUrl: import.meta.env.VITE_API_URL,

  onTokenRefresh: (tokens) => {
    localStorage.setItem('pc_access_token', tokens.accessToken);
    localStorage.setItem('pc_refresh_token', tokens.refreshToken);
  },

  onUnauthorized: () => {
    localStorage.removeItem('pc_access_token');
    localStorage.removeItem('pc_refresh_token');
    window.location.href = '/login';
  },
});

// Restore tokens
const accessToken = localStorage.getItem('pc_access_token');
const refreshToken = localStorage.getItem('pc_refresh_token');
if (accessToken && refreshToken) {
  sdk.setTokens({ accessToken, refreshToken });
}

export default sdk;

// Vue plugin
export const PeopleConnectPlugin = {
  install(app) {
    app.config.globalProperties.$sdk = sdk;
    app.provide('sdk', sdk);
  },
};
```

### 3. Register the Plugin

```javascript
// src/main.js
import { createApp } from 'vue';
import App from './App.vue';
import { PeopleConnectPlugin } from './plugins/peopleconnect';

const app = createApp(App);
app.use(PeopleConnectPlugin);
app.mount('#app');
```

### 4. Use with Composition API

```vue
<!-- src/views/ChatView.vue -->
<template>
  <div>
    <div v-if="loading">Loading conversations...</div>
    <div v-else-if="error">Error: {{ error }}</div>
    <ul v-else>
      <li v-for="conv in conversations" :key="conv.id" @click="openConversation(conv)">
        <strong>{{ conv.name || 'Direct Message' }}</strong>
        <span v-if="conv.unreadCount > 0" class="badge">{{ conv.unreadCount }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue';

const sdk = inject('sdk');

const conversations = ref([]);
const loading = ref(true);
const error = ref(null);

onMounted(async () => {
  try {
    const result = await sdk.conversations.list({ page: 1, pageSize: 50 });
    conversations.value = result.items;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
});

function openConversation(conv) {
  // Navigate or emit event
}
</script>
```

### 5. Composable for Messages

```javascript
// src/composables/useMessages.js
import { ref, watch } from 'vue';
import sdk from '@/plugins/peopleconnect';

export function useMessages(conversationId) {
  const messages = ref([]);
  const hasMore = ref(false);
  const loading = ref(false);

  async function loadMessages() {
    loading.value = true;
    try {
      const result = await sdk.messages.list(conversationId.value, { limit: 50 });
      messages.value = result.items;
      hasMore.value = result.hasMore;
    } catch (err) {
      console.error('Failed to load messages:', err.message);
    } finally {
      loading.value = false;
    }
  }

  async function loadOlder() {
    if (!hasMore.value || loading.value || messages.value.length === 0) return;

    loading.value = true;
    try {
      const result = await sdk.messages.list(conversationId.value, {
        limit: 50,
        before: messages.value[0].id,
      });
      messages.value = [...result.items, ...messages.value];
      hasMore.value = result.hasMore;
    } finally {
      loading.value = false;
    }
  }

  async function sendMessage(content, attachmentIds) {
    const msg = await sdk.messages.send(conversationId.value, {
      content,
      attachmentIds,
    });
    messages.value.push(msg);
    return msg;
  }

  watch(conversationId, loadMessages, { immediate: true });

  return { messages, hasMore, loading, loadOlder, sendMessage };
}
```

### 6. Login View

```vue
<!-- src/views/LoginView.vue -->
<template>
  <form @submit.prevent="handleLogin">
    <div v-if="error" class="error">{{ error }}</div>
    <input v-model="username" placeholder="Username" required />
    <input v-model="password" type="password" placeholder="Password" required />
    <button type="submit" :disabled="submitting">
      {{ submitting ? 'Logging in...' : 'Login' }}
    </button>
  </form>
</template>

<script setup>
import { ref, inject } from 'vue';
import { useRouter } from 'vue-router';

const sdk = inject('sdk');
const router = useRouter();

const username = ref('');
const password = ref('');
const error = ref('');
const submitting = ref(false);

async function handleLogin() {
  error.value = '';
  submitting.value = true;

  try {
    const { accessToken, refreshToken, requiresTwoFactor } = await sdk.auth.login({
      username: username.value,
      password: password.value,
    });

    localStorage.setItem('pc_access_token', accessToken);
    localStorage.setItem('pc_refresh_token', refreshToken);

    if (requiresTwoFactor) {
      router.push('/two-factor');
    } else {
      router.push('/chat');
    }
  } catch (err) {
    error.value = err.message;
  } finally {
    submitting.value = false;
  }
}
</script>
```

---

## Node.js (Bots and Automation)

### Prerequisites

- Node.js 18+ (for native `fetch`)
- For Node.js 16-17, install `node-fetch` and set it as the global `fetch`

### 1. Basic Bot Setup

```javascript
// bot.js
import { PeopleConnectSDK } from '@peopleconnect/sdk';
import * as signalR from '@microsoft/signalr';

const API_URL = process.env.API_URL || 'https://your-server.com/api';
const SIGNALR_URL = process.env.SIGNALR_URL || 'https://your-server.com';
const BOT_USERNAME = process.env.BOT_USERNAME;
const BOT_PASSWORD = process.env.BOT_PASSWORD;

const sdk = new PeopleConnectSDK({
  baseUrl: API_URL,
  onTokenRefresh: (tokens) => {
    currentToken = tokens.accessToken;
    console.log('Tokens refreshed');
  },
});

let currentToken = null;

async function start() {
  // Login
  const { user, accessToken } = await sdk.auth.login({
    username: BOT_USERNAME,
    password: BOT_PASSWORD,
  });
  currentToken = accessToken;
  console.log(`Bot logged in as ${user.name} (${user.id})`);

  // Connect to ChatHub
  const chatHub = new signalR.HubConnectionBuilder()
    .withUrl(`${SIGNALR_URL}/hubs/chat`, {
      accessTokenFactory: () => currentToken,
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .build();

  chatHub.on('ReceiveMessage', async (message) => {
    if (message.sender.id === user.id) return; // Skip own messages

    console.log(`[${message.conversationId}] ${message.sender.name}: ${message.content}`);

    // Process commands
    const content = (message.content || '').trim().toLowerCase();

    if (content === '/help') {
      await sdk.messages.send(message.conversationId, {
        content: 'Available commands:\n/help - Show this help\n/time - Current server time\n/ping - Check bot status',
        replyToMessageId: message.id,
      });
    } else if (content === '/time') {
      await sdk.messages.send(message.conversationId, {
        content: `Server time: ${new Date().toISOString()}`,
        replyToMessageId: message.id,
      });
    } else if (content === '/ping') {
      await sdk.messages.send(message.conversationId, {
        content: 'Pong!',
        replyToMessageId: message.id,
      });
    }
  });

  chatHub.onreconnecting(() => console.log('SignalR reconnecting...'));
  chatHub.onreconnected(() => console.log('SignalR reconnected'));
  chatHub.onclose(() => {
    console.log('SignalR connection closed. Attempting restart in 5 seconds...');
    setTimeout(() => chatHub.start(), 5000);
  });

  await chatHub.start();
  console.log('Bot is online and listening for messages.');
}

start().catch(console.error);
```

### 2. Run with Environment Variables

```bash
API_URL=https://your-server.com/api \
SIGNALR_URL=https://your-server.com \
BOT_USERNAME=helpdesk-bot \
BOT_PASSWORD='BotP@ss1' \
node bot.js
```

### 3. Automation Script (No Real-Time)

For one-off tasks that do not need real-time listening:

```javascript
// scripts/send-announcement.js
import { PeopleConnectSDK } from '@peopleconnect/sdk';

const sdk = new PeopleConnectSDK({
  baseUrl: process.env.API_URL,
});

async function main() {
  await sdk.auth.login({
    username: process.env.BOT_USERNAME,
    password: process.env.BOT_PASSWORD,
  });

  // Get all conversations
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const result = await sdk.conversations.list({ page, pageSize: 50 });

    for (const conv of result.items) {
      try {
        await sdk.messages.send(conv.id, {
          content: 'Scheduled maintenance tonight at 11 PM UTC. Expected downtime: 30 minutes.',
        });
        console.log(`Sent to: ${conv.name || conv.id}`);
      } catch (err) {
        console.error(`Failed for ${conv.id}: ${err.message}`);
      }
    }

    hasMore = result.items.length === 50;
    page++;
  }

  await sdk.auth.logout();
  console.log('Done.');
}

main().catch(console.error);
```

### 4. Node.js 16 Compatibility

For Node.js 16-17 (which lack native `fetch`):

```bash
npm install node-fetch@3
```

```javascript
// Add at the top of your entry file:
import fetch, { Headers, Request, Response } from 'node-fetch';

if (!globalThis.fetch) {
  globalThis.fetch = fetch;
  globalThis.Headers = Headers;
  globalThis.Request = Request;
  globalThis.Response = Response;
}

// Now import and use the SDK normally
import { PeopleConnectSDK } from '@peopleconnect/sdk';
```

---

## SignalR Real-Time Setup

### Complete Real-Time Manager

This pattern creates a centralized real-time manager that integrates with the SDK.

```javascript
// src/services/realtime.js
import * as signalR from '@microsoft/signalr';

export class RealtimeManager {
  constructor(sdk, signalrUrl) {
    this.sdk = sdk;
    this.signalrUrl = signalrUrl;
    this.chatHub = null;
    this.presenceHub = null;
    this.notificationHub = null;
    this.listeners = new Map();
  }

  async connect() {
    const token = this.sdk.getAccessToken();
    if (!token) throw new Error('Not authenticated');

    await Promise.all([
      this.connectChat(token),
      this.connectPresence(token),
      this.connectNotifications(token),
    ]);
  }

  async connectChat(token) {
    this.chatHub = new signalR.HubConnectionBuilder()
      .withUrl(`${this.signalrUrl}/hubs/chat`, {
        accessTokenFactory: () => this.sdk.getAccessToken(),
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .build();

    // Message events
    this.chatHub.on('ReceiveMessage', (msg) => this.emit('message', msg));
    this.chatHub.on('MessageEdited', (convId, msg) => this.emit('messageEdited', { conversationId: convId, message: msg }));
    this.chatHub.on('MessageDeleted', (convId, msgId) => this.emit('messageDeleted', { conversationId: convId, messageId: msgId }));

    // Typing events
    this.chatHub.on('TypingStarted', (convId, userId, userName) =>
      this.emit('typingStarted', { conversationId: convId, userId, userName }));
    this.chatHub.on('TypingStopped', (convId, userId) =>
      this.emit('typingStopped', { conversationId: convId, userId }));

    // Reaction events
    this.chatHub.on('ReactionAdded', (convId, msgId, reaction) =>
      this.emit('reactionAdded', { conversationId: convId, messageId: msgId, reaction }));
    this.chatHub.on('ReactionRemoved', (convId, msgId, userId, emoji) =>
      this.emit('reactionRemoved', { conversationId: convId, messageId: msgId, userId, emoji }));

    // Read receipt events
    this.chatHub.on('MessageRead', (convId, userId, msgId) =>
      this.emit('messageRead', { conversationId: convId, userId, messageId: msgId }));

    // Conversation events
    this.chatHub.on('ConversationUpdated', (conv) => this.emit('conversationUpdated', conv));
    this.chatHub.on('AddedToConversation', (conv) => this.emit('addedToConversation', conv));
    this.chatHub.on('RemovedFromConversation', (convId) => this.emit('removedFromConversation', convId));

    await this.chatHub.start();
  }

  async connectPresence(token) {
    this.presenceHub = new signalR.HubConnectionBuilder()
      .withUrl(`${this.signalrUrl}/hubs/presence`, {
        accessTokenFactory: () => this.sdk.getAccessToken(),
      })
      .withAutomaticReconnect()
      .build();

    this.presenceHub.on('UserOnline', (userId) => this.emit('userOnline', userId));
    this.presenceHub.on('UserOffline', (userId) => this.emit('userOffline', userId));
    this.presenceHub.on('OnlineUsers', (users) => this.emit('onlineUsers', users));

    await this.presenceHub.start();
  }

  async connectNotifications(token) {
    this.notificationHub = new signalR.HubConnectionBuilder()
      .withUrl(`${this.signalrUrl}/hubs/notifications`, {
        accessTokenFactory: () => this.sdk.getAccessToken(),
      })
      .withAutomaticReconnect()
      .build();

    this.notificationHub.on('ReceiveNotification', (notification) =>
      this.emit('notification', notification));

    await this.notificationHub.start();
  }

  // Typing indicators
  async startTyping(conversationId) {
    await this.chatHub?.invoke('StartTyping', conversationId);
  }

  async stopTyping(conversationId) {
    await this.chatHub?.invoke('StopTyping', conversationId);
  }

  // Event emitter
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.listeners.get(event).delete(callback);
  }

  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(data));
    }
  }

  async disconnect() {
    await Promise.all([
      this.chatHub?.stop(),
      this.presenceHub?.stop(),
      this.notificationHub?.stop(),
    ]);
  }
}
```

### Using the RealtimeManager

```javascript
import { PeopleConnectSDK } from '@peopleconnect/sdk';
import { RealtimeManager } from './services/realtime';

const sdk = new PeopleConnectSDK({ baseUrl: 'https://your-server.com/api' });
const realtime = new RealtimeManager(sdk, 'https://your-server.com');

// Login
await sdk.auth.login({ username: 'alice', password: 'pass' });

// Connect real-time
await realtime.connect();

// Subscribe to events
realtime.on('message', (msg) => {
  console.log('New message:', msg.content);
  // Update your UI state
});

realtime.on('typingStarted', ({ conversationId, userName }) => {
  console.log(`${userName} is typing...`);
});

realtime.on('userOnline', (userId) => {
  console.log(`User ${userId} is now online`);
});

realtime.on('notification', (notification) => {
  console.log('Notification:', notification.title);
});

// Send typing indicator
await realtime.startTyping('conv-uuid');
// ... user types ...
await realtime.stopTyping('conv-uuid');

// Cleanup
await realtime.disconnect();
```

---

## File Upload Handling

### Single File Upload with Message

```javascript
async function sendFileMessage(conversationId, file, caption) {
  // 1. Upload the file
  const uploadResult = await sdk.media.upload(file, conversationId);

  // 2. Send a message with the attachment
  const message = await sdk.messages.send(conversationId, {
    content: caption || undefined,
    attachmentIds: [uploadResult.id],
  });

  return message;
}

// Usage
const fileInput = document.getElementById('file-input');
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) {
    await sendFileMessage('conv-uuid', file, 'Here is the document');
  }
});
```

### Multiple File Upload

```javascript
async function sendMultipleFiles(conversationId, files) {
  const { uploaded, errors } = await sdk.media.uploadMultiple(files, conversationId);

  if (errors.length > 0) {
    console.warn('Some files failed to upload:', errors);
  }

  if (uploaded.length > 0) {
    const message = await sdk.messages.send(conversationId, {
      content: `Shared ${uploaded.length} file(s)`,
      attachmentIds: uploaded.map((u) => u.id),
    });
    return message;
  }
}
```

### Voice Message Recording and Upload

```javascript
let mediaRecorder = null;
let audioChunks = [];

async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
  audioChunks = [];

  mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
  mediaRecorder.start();
}

async function stopRecordingAndSend(conversationId) {
  return new Promise((resolve) => {
    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const duration = Math.round(audioChunks.length * 0.1); // Approximate; use actual timing

      const uploadResult = await sdk.media.uploadVoice(audioBlob, conversationId, duration);

      const message = await sdk.messages.send(conversationId, {
        attachmentIds: [uploadResult.id],
        type: 'Audio',
      });

      resolve(message);
    };
    mediaRecorder.stop();
  });
}
```

### Displaying Media

```javascript
function renderAttachment(attachment) {
  const contentType = attachment.contentType;

  if (contentType.startsWith('image/')) {
    // Use thumbnail for preview, full URL for lightbox
    const thumbUrl = sdk.media.getThumbnailUrl(attachment.id);
    const fullUrl = sdk.media.getDownloadUrl(attachment.id);
    return `<a href="${fullUrl}" target="_blank"><img src="${thumbUrl}" alt="${attachment.originalFileName}" /></a>`;
  }

  if (contentType.startsWith('video/')) {
    const streamUrl = sdk.media.getStreamUrl(attachment.id);
    return `<video src="${streamUrl}" controls width="400"></video>`;
  }

  if (contentType.startsWith('audio/')) {
    const streamUrl = sdk.media.getStreamUrl(attachment.id);
    return `<audio src="${streamUrl}" controls></audio>`;
  }

  // Generic file download
  const downloadUrl = sdk.media.getDownloadUrl(attachment.id);
  return `<a href="${downloadUrl}" download>${attachment.originalFileName} (${formatFileSize(attachment.fileSize)})</a>`;
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}
```

---

## Authentication Flow

### Complete Authentication State Machine

```
                  +-------------------+
                  |    Not Logged In  |
                  +-------------------+
                           |
                     login() called
                           |
                           v
                  +-------------------+
                  |   Login Request   |---------> Error: show message
                  +-------------------+
                           |
                       Success
                           |
              +------------+------------+
              |            |            |
     requiresTwoFactor  requiresPW   Normal
              |          Change        |
              v            |           v
     +----------------+   |   +-------------------+
     | 2FA Prompt     |   |   |   Authenticated   |<----+
     +----------------+   |   +-------------------+     |
              |            |           |                  |
        verifyTwoFactor    |     401 received             |
              |            |           |                  |
              v            v           v                  |
     +----------------+  Password  +------------------+  |
     | Authenticated  |  Change    | Token Refresh    |--+
     +----------------+  Screen    +------------------+
                                           |
                                      Refresh failed
                                           |
                                           v
                                   onUnauthorized()
                                   (redirect to login)
```

### Cookie-Based Authentication Alternative

If you prefer cookies over localStorage (for HttpOnly cookie security):

```javascript
// Instead of storing tokens in localStorage, use a lightweight API route
// to set HttpOnly cookies on your same-domain server.

const sdk = new PeopleConnectSDK({
  baseUrl: '/api', // Proxied through your Next.js/Express server
  onTokenRefresh: async (tokens) => {
    // Send tokens to your server to store in HttpOnly cookies
    await fetch('/auth/store-tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tokens),
      credentials: 'include',
    });
  },
});
```

### Persisting Authentication with sessionStorage

For higher security (tokens cleared when browser tab closes):

```javascript
const sdk = new PeopleConnectSDK({
  baseUrl: 'https://your-server.com/api',
  onTokenRefresh: (tokens) => {
    sessionStorage.setItem('pc_access_token', tokens.accessToken);
    sessionStorage.setItem('pc_refresh_token', tokens.refreshToken);
  },
  onUnauthorized: () => {
    sessionStorage.clear();
    window.location.href = '/login';
  },
});
```

---

## Token Refresh Mechanism

### How It Works Internally

The SDK's `HttpClient` handles token refresh automatically. Here is the flow in detail:

1. **Any API call returns HTTP 401**: The SDK checks if it has a refresh token and the request is not already a refresh request.

2. **Refresh in progress?**
   - If another refresh is already happening, the current request is added to a queue. When refresh completes, all queued requests are retried.

3. **Execute refresh**: The SDK sends `POST /auth/refresh` with the current refresh token.

4. **On success**:
   - New `accessToken` and `refreshToken` are stored internally.
   - The `onTokenRefresh` callback is called so you can persist the new tokens.
   - All queued requests are retried with the new access token.
   - The original request is retried and its result returned.

5. **On failure**:
   - All queued requests are rejected.
   - The `onUnauthorized` callback is called.
   - The error propagates to the original caller.

### Key Behaviors

- **Concurrent requests**: If 5 requests all get 401 at the same time, only 1 refresh call is made. All 5 are queued and retried.
- **No infinite loops**: Refresh requests themselves (to `/auth/refresh`) skip the refresh logic, preventing infinite recursion.
- **Thread safety**: The `isRefreshing` flag and `refreshQueue` array coordinate concurrent access.

### Manual Token Refresh

You can trigger a refresh manually (rarely needed):

```javascript
try {
  const response = await sdk.auth.refreshToken(currentRefreshToken);
  sdk.setTokens({
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
  });
} catch (err) {
  console.error('Manual refresh failed:', err.message);
  sdk.clearTokens();
}
```

---

## Best Practices and Common Pitfalls

### Do

1. **Store tokens securely**: Use `localStorage` or `sessionStorage` in browsers; use environment variables or secure storage in Node.js.

2. **Always handle errors**: Every SDK method can throw. Use try/catch or `.catch()`.

3. **Use the `onTokenRefresh` callback**: This ensures your persisted tokens stay in sync with the SDK's internal state.

4. **Use the `onUnauthorized` callback**: Redirect users to the login page when their session is unrecoverable.

5. **Set a reasonable timeout**: The default 30 seconds is fine for most cases. Lower it for real-time-sensitive operations.

6. **Upload files before sending messages**: Upload with `sdk.media.upload()`, get the file ID, then include it in `sdk.messages.send()`.

7. **Use cursor-based pagination for messages**: Use the `before` and `after` parameters instead of page numbers for reliable scrolling.

8. **Dispose SignalR connections on logout**: Call `.stop()` on all hub connections before clearing tokens.

### Do Not

1. **Do not create multiple SDK instances**: Use a single instance throughout your application. Multiple instances have separate token states.

2. **Do not call `setTokens()` after `login()`**: The `login()` method stores tokens internally. Calling `setTokens()` again is redundant (though harmless).

3. **Do not store tokens in plain cookies without HttpOnly**: Use `localStorage`/`sessionStorage` or HttpOnly cookies set by your server.

4. **Do not ignore the `requiresTwoFactor` flag**: If a login response has `requiresTwoFactor: true`, the user is NOT fully authenticated yet. You must call `verifyTwoFactor()`.

5. **Do not poll for new messages**: Use SignalR for real-time messages. The SDK's `messages.list()` is for loading message history, not polling.

6. **Do not hardcode the base URL**: Use environment variables so you can switch between development and production.

7. **Do not assume file upload always succeeds**: Check the `errors` array from `uploadMultiple()` and handle partial failures gracefully.

### Common Pitfalls

| Pitfall | Explanation | Solution |
|---------|-------------|----------|
| "Request timeout" on large uploads | Default 30s timeout is too short for large files | Increase `timeout` in SDK config |
| Tokens not persisting across page reload | Forgot to restore tokens from storage on init | Call `sdk.setTokens()` at startup |
| 401 loop | Refresh token is also expired | Ensure `onUnauthorized` clears state and redirects |
| Messages appear out of order | Using `after` pagination but not sorting | Sort messages by `createdAt` client-side |
| Duplicate messages on reconnect | SignalR reconnect replays events | Deduplicate by message ID in your state |
| Avatar upload returns wrong URL | `uploadAvatar` returns `{ url }` but you expect `{ avatarUrl }` | The SDK wraps it as `{ avatarUrl: response.url }` |

---

## Browser Compatibility Notes

### Required APIs

The SDK relies on these Web APIs:

| API | Used For | Minimum Browser Support |
|-----|----------|------------------------|
| `fetch()` | All HTTP requests | Chrome 42, Firefox 39, Safari 10.1 |
| `FormData` | File uploads | All modern browsers |
| `AbortController` | Request timeouts | Chrome 66, Firefox 57, Safari 12.1 |
| `URL` | URL construction | Chrome 32, Firefox 19, Safari 7 |
| `async`/`await` | All SDK methods | Chrome 55, Firefox 52, Safari 10.1 |
| `class` syntax | SDK structure | Chrome 49, Firefox 45, Safari 10 |
| Optional chaining `?.` | Internal code | Chrome 80, Firefox 72, Safari 13.1 |

### Effective Minimum Versions (No Polyfills)

- Chrome 80+
- Firefox 72+
- Safari 13.1+
- Edge 80+ (Chromium)

### Polyfills for Older Browsers

If you need to support older browsers, add these polyfills:

```bash
npm install whatwg-fetch abort-controller core-js
```

```javascript
// Add at the top of your entry point
import 'whatwg-fetch';              // Polyfills fetch
import 'abort-controller/polyfill'; // Polyfills AbortController
import 'core-js/stable';           // Polyfills newer JS features
```

### Content Security Policy (CSP)

If your app uses CSP headers, ensure you allow connections to the PeopleConnect API:

```
Content-Security-Policy: connect-src 'self' https://your-server.com wss://your-server.com;
```

The `wss://` protocol is needed for SignalR WebSocket connections.

---

## Server-Side Rendering Considerations

### The SDK Uses Browser APIs

The SDK depends on `fetch`, `FormData`, `URL`, and `AbortController`. These are not available in all server-side environments.

### Next.js App Router (Recommended Approach)

Mark SDK-dependent code as client-only:

```javascript
'use client'; // This directive is required

import { PeopleConnectSDK } from '@peopleconnect/sdk';
```

Never import or use the SDK in:
- Server Components (files without `'use client'`)
- `page.js` files that are Server Components by default
- `layout.js` server-side code
- `middleware.js`
- API Routes (`/app/api/...`)

### Next.js Pages Router

Use dynamic imports to prevent the SDK from being included in the server bundle:

```javascript
// pages/chat.js
import dynamic from 'next/dynamic';

const ChatComponent = dynamic(() => import('../components/Chat'), {
  ssr: false,
  loading: () => <div>Loading chat...</div>,
});

export default function ChatPage() {
  return <ChatComponent />;
}
```

### Nuxt.js (Vue SSR)

Use the `<ClientOnly>` wrapper or the `.client.js` suffix:

```vue
<!-- pages/chat.vue -->
<template>
  <ClientOnly>
    <ChatComponent />
    <template #fallback>
      <div>Loading chat...</div>
    </template>
  </ClientOnly>
</template>
```

Or use a client-only plugin:

```javascript
// plugins/peopleconnect.client.js
import { PeopleConnectSDK } from '@peopleconnect/sdk';

export default defineNuxtPlugin(() => {
  const sdk = new PeopleConnectSDK({
    baseUrl: useRuntimeConfig().public.apiUrl,
  });

  return {
    provide: { sdk },
  };
});
```

### Server-Side API Calls (Node.js 18+)

If you genuinely need to make PeopleConnect API calls from the server (e.g., in a Next.js API route or a server action), Node.js 18+ has native `fetch`, so the SDK works:

```javascript
// app/api/messages/route.js (Next.js Route Handler)
import { PeopleConnectSDK } from '@peopleconnect/sdk';

const sdk = new PeopleConnectSDK({
  baseUrl: process.env.PEOPLECONNECT_API_URL,
});

export async function POST(request) {
  const { conversationId, content } = await request.json();

  // Authenticate as a service account
  await sdk.auth.login({
    username: process.env.SERVICE_USERNAME,
    password: process.env.SERVICE_PASSWORD,
  });

  const message = await sdk.messages.send(conversationId, { content });

  return Response.json({ success: true, messageId: message.id });
}
```

### Hydration Warnings

If you initialize the SDK during render and the server does not have the same state as the client, you may get hydration mismatches. Avoid this by:

1. Initializing the SDK only in `useEffect` or `onMounted`.
2. Using `useRef` (React) or `ref` (Vue) to hold the SDK instance.
3. Never rendering SDK-dependent data in the initial server-side HTML.

---

## Further Resources

- [README.md](./README.md) -- Full API reference and method documentation
- [TypeScript SDK](https://github.com/fuadsulaiman/PeopleConnect-SDK) -- If you prefer a compiled TypeScript SDK
- [PeopleConnect API Documentation](https://your-server.com/swagger) -- Swagger/OpenAPI docs (development mode)
