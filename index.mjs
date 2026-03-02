/**
 * PeopleConnect SDK
 *
 * A comprehensive JavaScript SDK for interacting with the PeopleConnect API.
 * Supports authentication, messaging, calls, contacts, media, and more.
 *
 * @example
 * ```javascript
 * import { PeopleConnectSDK } from '@peopleconnect/sdk';
 *
 * const sdk = new PeopleConnectSDK({
 *   baseUrl: 'https://api.example.com/api',
 *   onTokenRefresh: (tokens) => localStorage.setItem('tokens', JSON.stringify(tokens)),
 * });
 *
 * // Login
 * const { user, accessToken } = await sdk.auth.login({
 *   username: 'john',
 *   password: 'password123',
 * });
 *
 * // Set tokens
 * sdk.setTokens({ accessToken, refreshToken });
 *
 * // Get conversations
 * const conversations = await sdk.conversations.list();
 * ```
 */

// ============================================================================
// HTTP Client
// ============================================================================

class HttpClient {
  /**
   * @param {import('./types').SDKConfig} config
   */
  constructor(config) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.timeout = config.timeout || 30000;
    this.onTokenRefresh = config.onTokenRefresh;
    this.onUnauthorized = config.onUnauthorized;
    this.onError = config.onError;
    this.accessToken = null;
    this.refreshToken = null;
    this.isRefreshing = false;
    this.refreshQueue = [];
  }

  /**
   * @param {import('./types').AuthTokens | null} tokens
   */
  setTokens(tokens) {
    this.accessToken = tokens?.accessToken || null;
    this.refreshToken = tokens?.refreshToken || null;
  }

  /**
   * @returns {string | null}
   */
  getAccessToken() {
    return this.accessToken;
  }

  /**
   * @param {string} url
   * @param {Record<string, string | number | boolean | undefined>} [params]
   * @returns {string}
   */
  buildUrl(url, params) {
    const fullUrl = new URL(url.startsWith('http') ? url : `${this.baseUrl}${url}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          fullUrl.searchParams.append(key, String(value));
        }
      });
    }
    return fullUrl.toString();
  }

  /**
   * @template T
   * @param {Object} config
   * @param {'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'} config.method
   * @param {string} config.url
   * @param {*} [config.data]
   * @param {Record<string, string | number | boolean | undefined>} [config.params]
   * @param {Record<string, string>} [config.headers]
   * @returns {Promise<T>}
   */
  async request(config) {
    const { method, url, data, params, headers = {} } = config;

    const requestHeaders = { ...headers };

    if (this.accessToken) {
      requestHeaders['Authorization'] = `Bearer ${this.accessToken}`;
    }

    let body;
    if (data) {
      if (data instanceof FormData) {
        body = data;
      } else {
        requestHeaders['Content-Type'] = 'application/json';
        body = JSON.stringify(data);
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(this.buildUrl(url, params), {
        method,
        headers: requestHeaders,
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 401 && this.refreshToken && !url.includes('/auth/refresh')) {
        return this.handleTokenRefresh(config);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = {
          message: errorData.message || `HTTP ${response.status}`,
          code: errorData.code,
          details: errorData.details,
        };
        if (this.onError) this.onError(error);
        throw new Error(error.message);
      }

      const responseData = await response.json().catch(() => ({}));

      // Unwrap API response if wrapped
      if (responseData && typeof responseData === 'object' && 'success' in responseData && 'data' in responseData) {
        return responseData.data;
      }

      return responseData;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  /**
   * @template T
   * @param {Object} config
   * @returns {Promise<T>}
   */
  async handleTokenRefresh(config) {
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.refreshQueue.push({
          resolve: (token) => {
            this.accessToken = token;
            this.request(config).then(resolve).catch(reject);
          },
          reject,
        });
      });
    }

    this.isRefreshing = true;

    try {
      const response = await this.request({
        method: 'POST',
        url: '/auth/refresh',
        data: { refreshToken: this.refreshToken },
      });

      this.accessToken = response.accessToken;
      this.refreshToken = response.refreshToken;
      if (this.onTokenRefresh) {
        this.onTokenRefresh({ accessToken: response.accessToken, refreshToken: response.refreshToken });
      }

      this.refreshQueue.forEach(({ resolve }) => resolve(response.accessToken));
      this.refreshQueue = [];

      return this.request(config);
    } catch (error) {
      this.refreshQueue.forEach(({ reject }) => reject(error));
      this.refreshQueue = [];
      if (this.onUnauthorized) this.onUnauthorized();
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * @template T
   * @param {string} url
   * @param {Record<string, string | number | boolean | undefined>} [params]
   * @returns {Promise<T>}
   */
  async get(url, params) {
    return this.request({ method: 'GET', url, params });
  }

  /**
   * @template T
   * @param {string} url
   * @param {*} [data]
   * @param {Record<string, string | number | boolean | undefined>} [params]
   * @returns {Promise<T>}
   */
  async post(url, data, params) {
    return this.request({ method: 'POST', url, data, params });
  }

  /**
   * @template T
   * @param {string} url
   * @param {*} [data]
   * @returns {Promise<T>}
   */
  async put(url, data) {
    return this.request({ method: 'PUT', url, data });
  }

  /**
   * @template T
   * @param {string} url
   * @param {*} [data]
   * @returns {Promise<T>}
   */
  async patch(url, data) {
    return this.request({ method: 'PATCH', url, data });
  }

  /**
   * @template T
   * @param {string} url
   * @param {Record<string, string | number | boolean | undefined>} [params]
   * @returns {Promise<T>}
   */
  async delete(url, params) {
    return this.request({ method: 'DELETE', url, params });
  }

  /**
   * @template T
   * @param {string} url
   * @param {FormData} formData
   * @returns {Promise<T>}
   */
  async upload(url, formData) {
    return this.request({ method: 'POST', url, data: formData });
  }
}

// ============================================================================
// Auth Service
// ============================================================================

class AuthService {
  /**
   * @param {HttpClient} http
   */
  constructor(http) {
    this.http = http;
  }

  /**
   * Login with username and password
   * @param {import('./types').LoginRequest} data
   * @returns {Promise<import('./types').LoginResponse>}
   */
  async login(data) {
    const response = await this.http.post('/auth/login', {
      ...data,
      portal: data.portal || 'user',
    });
    this.http.setTokens({ accessToken: response.accessToken, refreshToken: response.refreshToken });
    return response;
  }

  /**
   * Register a new user account
   * @param {import('./types').RegisterRequest} data
   * @returns {Promise<import('./types').LoginResponse>}
   */
  async register(data) {
    const response = await this.http.post('/auth/register', data);
    this.http.setTokens({ accessToken: response.accessToken, refreshToken: response.refreshToken });
    return response;
  }

  /**
   * Logout the current user
   * @returns {Promise<void>}
   */
  async logout() {
    await this.http.post('/auth/logout');
    this.http.setTokens(null);
  }

  /**
   * Refresh the access token
   * @param {string} refreshToken
   * @returns {Promise<import('./types').LoginResponse>}
   */
  async refreshToken(refreshToken) {
    return this.http.post('/auth/refresh', { refreshToken });
  }

  /**
   * Get the current authenticated user
   * @returns {Promise<import('./types').UserProfile>}
   */
  async getCurrentUser() {
    return this.http.get('/auth/me');
  }

  /**
   * Check if a username is available
   * @param {string} username
   * @returns {Promise<{available: boolean}>}
   */
  async checkUsername(username) {
    return this.http.get('/auth/check-username', { username });
  }

  /**
   * Verify two-factor authentication code
   * @param {import('./types').TwoFactorVerifyRequest} data
   * @returns {Promise<import('./types').LoginResponse>}
   */
  async verifyTwoFactor(data) {
    return this.http.post('/two-factor/verify', data);
  }

  /**
   * Request password reset email
   * @param {string} identifier
   * @returns {Promise<void>}
   */
  async forgotPassword(identifier) {
    await this.http.post('/auth/forgot-password', { identifier });
  }

  /**
   * Reset password with token
   * @param {import('./types').ResetPasswordRequest} data
   * @returns {Promise<void>}
   */
  async resetPassword(data) {
    await this.http.post('/auth/reset-password', data);
  }

  /**
   * Change password for authenticated user
   * @param {import('./types').ChangePasswordRequest} data
   * @returns {Promise<void>}
   */
  async changePassword(data) {
    await this.http.post('/auth/change-password', data);
  }

  /**
   * Delete the user's account
   * @returns {Promise<void>}
   */
  async deleteAccount() {
    await this.http.delete('/auth/account');
  }

  /**
   * Verify email address
   * @param {string} token
   * @returns {Promise<void>}
   */
  async verifyEmail(token) {
    await this.http.post('/auth/verify-email', { token });
  }

  /**
   * Resend verification email
   * @param {string} email
   * @returns {Promise<void>}
   */
  async resendVerification(email) {
    await this.http.post('/auth/resend-verification', { email });
  }
}

// ============================================================================
// User Service
// ============================================================================

class UserService {
  /**
   * @param {HttpClient} http
   */
  constructor(http) {
    this.http = http;
  }

  /**
   * Get user profile
   * @returns {Promise<import('./types').UserProfile>}
   */
  async getProfile() {
    return this.http.get('/auth/me');
  }

  /**
   * Get a user by ID
   * @param {string} userId
   * @returns {Promise<import('./types').User>}
   */
  async getUser(userId) {
    return this.http.get(`/users/${userId}`);
  }

  /**
   * Upload user avatar
   * @param {File} file
   * @returns {Promise<{avatarUrl: string}>}
   */
  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await this.http.upload('/auth/avatar', formData);
    return { avatarUrl: response.url };
  }

  /**
   * Delete user avatar
   * @returns {Promise<void>}
   */
  async deleteAvatar() {
    await this.http.delete('/auth/avatar');
  }
}

// ============================================================================
// Conversations Service
// ============================================================================

class ConversationsService {
  /**
   * @param {HttpClient} http
   */
  constructor(http) {
    this.http = http;
  }

  /**
   * List all conversations
   * @param {Object} [params]
   * @param {number} [params.page]
   * @param {number} [params.pageSize]
   * @param {string} [params.type]
   * @returns {Promise<import('./types').PaginatedResponse<import('./types').Conversation>>}
   */
  async list(params) {
    return this.http.get('/conversations', params);
  }

  /**
   * Get a conversation by ID
   * @param {string} id
   * @returns {Promise<import('./types').ConversationDetail>}
   */
  async get(id) {
    return this.http.get(`/conversations/${id}`);
  }

  /**
   * Create a direct message conversation
   * @param {import('./types').CreateDMRequest} data
   * @returns {Promise<import('./types').Conversation>}
   */
  async createDM(data) {
    return this.http.post('/conversations/dm', data);
  }

  /**
   * Create a chatroom
   * @param {import('./types').CreateChatroomRequest} data
   * @returns {Promise<import('./types').Conversation>}
   */
  async createChatroom(data) {
    return this.http.post('/conversations/chatroom', data);
  }

  /**
   * Update a chatroom
   * @param {string} id
   * @param {import('./types').UpdateChatroomRequest} data
   * @returns {Promise<import('./types').Conversation>}
   */
  async update(id, data) {
    return this.http.put(`/conversations/${id}`, data);
  }

  /**
   * Delete a conversation
   * @param {string} id
   * @returns {Promise<void>}
   */
  async delete(id) {
    await this.http.delete(`/conversations/${id}`);
  }

  /**
   * Leave a conversation
   * @param {string} id
   * @returns {Promise<void>}
   */
  async leave(id) {
    await this.http.post(`/conversations/${id}/leave`);
  }

  /**
   * Add participants to a chatroom
   * @param {string} id
   * @param {string[]} userIds
   * @returns {Promise<void>}
   */
  async addParticipants(id, userIds) {
    await this.http.post(`/conversations/${id}/participants`, { userIds });
  }

  /**
   * Remove a participant from a chatroom
   * @param {string} id
   * @param {string} userId
   * @returns {Promise<void>}
   */
  async removeParticipant(id, userId) {
    await this.http.delete(`/conversations/${id}/participants/${userId}`);
  }

  /**
   * Update participant role
   * @param {string} id
   * @param {string} userId
   * @param {import('./types').ParticipantRole} role
   * @returns {Promise<void>}
   */
  async updateParticipantRole(id, userId, role) {
    await this.http.patch(`/conversations/${id}/participants/${userId}/role`, { role });
  }

  /**
   * Get conversation members
   * @param {string} id
   * @returns {Promise<import('./types').ConversationMember[]>}
   */
  async getMembers(id) {
    return this.http.get(`/conversations/${id}/members`);
  }

  /**
   * Mute a conversation
   * @param {string} id
   * @param {string} [until]
   * @returns {Promise<void>}
   */
  async mute(id, until) {
    await this.http.post(`/conversations/${id}/mute`, { until });
  }

  /**
   * Unmute a conversation
   * @param {string} id
   * @returns {Promise<void>}
   */
  async unmute(id) {
    await this.http.post(`/conversations/${id}/unmute`);
  }

  /**
   * Archive a conversation
   * @param {string} id
   * @returns {Promise<void>}
   */
  async archive(id) {
    await this.http.post(`/conversations/${id}/archive`);
  }

  /**
   * Unarchive a conversation
   * @param {string} id
   * @returns {Promise<void>}
   */
  async unarchive(id) {
    await this.http.post(`/conversations/${id}/unarchive`);
  }

  /**
   * Clear conversation messages
   * @param {string} id
   * @returns {Promise<void>}
   */
  async clear(id) {
    await this.http.post(`/conversations/${id}/clear`);
  }

  /**
   * Pin a conversation
   * @param {string} id
   * @returns {Promise<void>}
   */
  async pin(id) {
    await this.http.post(`/conversations/${id}/pin`);
  }

  /**
   * Unpin a conversation
   * @param {string} id
   * @returns {Promise<void>}
   */
  async unpin(id) {
    await this.http.post(`/conversations/${id}/unpin`);
  }

  /**
   * Mark conversation as read
   * @param {string} id
   * @param {string} [lastMessageId]
   * @returns {Promise<void>}
   */
  async markAsRead(id, lastMessageId) {
    await this.http.post(`/conversations/${id}/read`, { lastMessageId });
  }

  /**
   * Upload chatroom avatar
   * @param {string} id
   * @param {File} file
   * @returns {Promise<{avatarUrl: string}>}
   */
  async uploadAvatar(id, file) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.upload(`/conversations/${id}/avatar`, formData);
  }
}

// ============================================================================
// Messages Service
// ============================================================================

class MessagesService {
  /**
   * @param {HttpClient} http
   */
  constructor(http) {
    this.http = http;
  }

  /**
   * Get messages in a conversation
   * @param {string} conversationId
   * @param {Object} [params]
   * @param {number} [params.limit]
   * @param {string} [params.before]
   * @param {string} [params.after]
   * @returns {Promise<{items: import('./types').Message[], hasMore: boolean}>}
   */
  async list(conversationId, params) {
    return this.http.get(`/conversations/${conversationId}/messages`, params);
  }

  /**
   * Get a single message
   * @param {string} conversationId
   * @param {string} messageId
   * @returns {Promise<import('./types').Message>}
   */
  async get(conversationId, messageId) {
    return this.http.get(`/conversations/${conversationId}/messages/${messageId}`);
  }

  /**
   * Send a message
   * @param {string} conversationId
   * @param {import('./types').SendMessageRequest} data
   * @returns {Promise<import('./types').Message>}
   */
  async send(conversationId, data) {
    return this.http.post(`/conversations/${conversationId}/messages`, data);
  }

  /**
   * Edit a message
   * @param {string} conversationId
   * @param {string} messageId
   * @param {import('./types').EditMessageRequest} data
   * @returns {Promise<import('./types').Message>}
   */
  async edit(conversationId, messageId, data) {
    return this.http.put(`/conversations/${conversationId}/messages/${messageId}`, data);
  }

  /**
   * Delete a message
   * @param {string} conversationId
   * @param {string} messageId
   * @param {boolean} [forEveryone=false]
   * @returns {Promise<void>}
   */
  async delete(conversationId, messageId, forEveryone = false) {
    await this.http.delete(`/conversations/${conversationId}/messages/${messageId}`, { forEveryone });
  }

  /**
   * React to a message
   * @param {string} conversationId
   * @param {string} messageId
   * @param {string} emoji
   * @returns {Promise<void>}
   */
  async react(conversationId, messageId, emoji) {
    await this.http.post(`/conversations/${conversationId}/messages/${messageId}/reactions`, { emoji });
  }

  /**
   * Remove reaction from a message
   * @param {string} conversationId
   * @param {string} messageId
   * @param {string} emoji
   * @returns {Promise<void>}
   */
  async removeReaction(conversationId, messageId, emoji) {
    await this.http.delete(`/conversations/${conversationId}/messages/${messageId}/reactions`, { emoji });
  }

  /**
   * Forward a message to other conversations
   * @param {string} conversationId
   * @param {string} messageId
   * @param {string[]} targetConversationIds
   * @returns {Promise<void>}
   */
  async forward(conversationId, messageId, targetConversationIds) {
    await this.http.post(`/conversations/${conversationId}/messages/${messageId}/forward`, {
      conversationIds: targetConversationIds,
    });
  }
}

// ============================================================================
// Contacts Service
// ============================================================================

class ContactsService {
  /**
   * @param {HttpClient} http
   */
  constructor(http) {
    this.http = http;
  }

  /**
   * List contacts
   * @param {Object} [params]
   * @param {number} [params.page]
   * @param {number} [params.pageSize]
   * @param {string} [params.search]
   * @returns {Promise<import('./types').PaginatedResponse<import('./types').Contact>>}
   */
  async list(params) {
    return this.http.get('/contacts', params);
  }

  /**
   * Get contact requests (received and sent)
   * @returns {Promise<import('./types').ContactRequestList>}
   */
  async getRequests() {
    return this.http.get('/contacts/requests');
  }

  /**
   * Search for users to add as contacts
   * @param {string} query
   * @param {number} [limit=20]
   * @returns {Promise<import('./types').UserSearchResult[]>}
   */
  async searchUsers(query, limit = 20) {
    return this.http.get('/contacts/search', { query, limit });
  }

  /**
   * Send a contact request
   * @param {string} userId
   * @param {string} [nickname]
   * @returns {Promise<import('./types').Contact>}
   */
  async sendRequest(userId, nickname) {
    return this.http.post('/contacts', { UserId: userId, Nickname: nickname });
  }

  /**
   * Accept a contact request
   * @param {string} contactId
   * @returns {Promise<import('./types').Contact>}
   */
  async acceptRequest(contactId) {
    return this.http.post(`/contacts/requests/${contactId}/accept`);
  }

  /**
   * Reject a contact request
   * @param {string} contactId
   * @returns {Promise<void>}
   */
  async rejectRequest(contactId) {
    await this.http.post(`/contacts/requests/${contactId}/reject`);
  }

  /**
   * Update contact nickname
   * @param {string} contactId
   * @param {string} [nickname]
   * @returns {Promise<import('./types').Contact>}
   */
  async update(contactId, nickname) {
    return this.http.put(`/contacts/${contactId}`, { Nickname: nickname });
  }

  /**
   * Remove a contact
   * @param {string} contactId
   * @returns {Promise<void>}
   */
  async remove(contactId) {
    await this.http.delete(`/contacts/${contactId}`);
  }

  /**
   * Block a user
   * @param {string} userId
   * @returns {Promise<void>}
   */
  async block(userId) {
    await this.http.post(`/contacts/block/${userId}`);
  }

  /**
   * Unblock a user
   * @param {string} userId
   * @returns {Promise<void>}
   */
  async unblock(userId) {
    await this.http.delete(`/contacts/block/${userId}`);
  }

  /**
   * Get blocked contacts
   * @returns {Promise<import('./types').BlockedContact[]>}
   */
  async getBlocked() {
    return this.http.get('/contacts/blocked');
  }
}

// ============================================================================
// Calls Service
// ============================================================================

class CallsService {
  /**
   * @param {HttpClient} http
   */
  constructor(http) {
    this.http = http;
  }

  /**
   * Initiate a call
   * @param {import('./types').InitiateCallRequest} data
   * @returns {Promise<import('./types').CallResponse>}
   */
  async initiate(data) {
    return this.http.post('/calls/initiate', data);
  }

  /**
   * Accept a call
   * @param {string} callId
   * @returns {Promise<import('./types').CallResponse>}
   */
  async accept(callId) {
    return this.http.post(`/calls/${callId}/accept`);
  }

  /**
   * Reject a call
   * @param {string} callId
   * @returns {Promise<void>}
   */
  async reject(callId) {
    await this.http.post(`/calls/${callId}/reject`);
  }

  /**
   * End a call
   * @param {string} callId
   * @returns {Promise<void>}
   */
  async end(callId) {
    await this.http.post(`/calls/${callId}/end`);
  }

  /**
   * Get call history
   * @param {Object} [params]
   * @param {number} [params.page]
   * @param {number} [params.pageSize]
   * @returns {Promise<import('./types').PaginatedResponse<import('./types').CallHistoryItem>>}
   */
  async getHistory(params) {
    return this.http.get('/calls/history', params);
  }

  /**
   * Get call details
   * @param {string} callId
   * @returns {Promise<import('./types').CallHistoryItem>}
   */
  async get(callId) {
    return this.http.get(`/calls/${callId}`);
  }

  /**
   * Delete call record
   * @param {string} callId
   * @returns {Promise<void>}
   */
  async delete(callId) {
    await this.http.delete(`/calls/${callId}`);
  }

  /**
   * Get ICE servers for WebRTC
   * @returns {Promise<import('./types').IceServer[]>}
   */
  async getIceServers() {
    return this.http.get('/calls/ice-servers');
  }

  /**
   * Get LiveKit token for group calls
   * @param {string} conversationId
   * @returns {Promise<import('./types').LiveKitTokenResponse>}
   */
  async getLiveKitToken(conversationId) {
    return this.http.post('/calls/livekit/token', { conversationId });
  }
}

// ============================================================================
// Media Service
// ============================================================================

class MediaService {
  /**
   * @param {HttpClient} http
   * @param {string} baseUrl
   */
  constructor(http, baseUrl) {
    this.http = http;
    this.baseUrl = baseUrl;
  }

  /**
   * Upload a file
   * @param {File} file
   * @param {string} [conversationId]
   * @returns {Promise<import('./types').UploadResponse>}
   */
  async upload(file, conversationId) {
    const formData = new FormData();
    formData.append('file', file);

    const url = `/media/upload${conversationId ? `?conversationId=${conversationId}` : ''}`;
    return this.http.upload(url, formData);
  }

  /**
   * Upload multiple files
   * @param {File[]} files
   * @param {string} [conversationId]
   * @returns {Promise<{uploaded: import('./types').UploadResponse[], errors: string[]}>}
   */
  async uploadMultiple(files, conversationId) {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    const url = `/media/upload/multiple${conversationId ? `?conversationId=${conversationId}` : ''}`;
    return this.http.upload(url, formData);
  }

  /**
   * Upload a voice message
   * @param {Blob} audioBlob
   * @param {string} conversationId
   * @param {number} duration
   * @returns {Promise<import('./types').UploadResponse>}
   */
  async uploadVoice(audioBlob, conversationId, duration) {
    const formData = new FormData();
    formData.append('file', audioBlob, 'voice-message.webm');

    return this.http.upload(
      `/media/voice?conversationId=${conversationId}&durationSeconds=${duration}`,
      formData
    );
  }

  /**
   * Get file info
   * @param {string} fileId
   * @returns {Promise<import('./types').UploadResponse>}
   */
  async get(fileId) {
    return this.http.get(`/media/${fileId}`);
  }

  /**
   * Delete a file
   * @param {string} fileId
   * @returns {Promise<void>}
   */
  async delete(fileId) {
    await this.http.delete(`/media/${fileId}`);
  }

  /**
   * Get media in a conversation
   * @param {string} conversationId
   * @param {Object} [params]
   * @param {number} [params.page]
   * @param {number} [params.pageSize]
   * @param {string} [params.type]
   * @returns {Promise<import('./types').PaginatedResponse<import('./types').Attachment>>}
   */
  async getConversationMedia(conversationId, params) {
    return this.http.get(`/media/conversation/${conversationId}`, params);
  }

  /**
   * Get file download URL
   * @param {string} fileId
   * @param {string} [token]
   * @returns {string}
   */
  getDownloadUrl(fileId, token) {
    const accessToken = token || this.http.getAccessToken();
    return `${this.baseUrl}/media/${fileId}/download?token=${accessToken}`;
  }

  /**
   * Get file thumbnail URL
   * @param {string} fileId
   * @param {string} [token]
   * @returns {string}
   */
  getThumbnailUrl(fileId, token) {
    const accessToken = token || this.http.getAccessToken();
    return `${this.baseUrl}/media/${fileId}/thumbnail?token=${accessToken}`;
  }

  /**
   * Get file stream URL
   * @param {string} fileId
   * @param {string} [token]
   * @returns {string}
   */
  getStreamUrl(fileId, token) {
    const accessToken = token || this.http.getAccessToken();
    return `${this.baseUrl}/media/${fileId}/stream?token=${accessToken}`;
  }
}

// ============================================================================
// Notifications Service
// ============================================================================

class NotificationsService {
  /**
   * @param {HttpClient} http
   */
  constructor(http) {
    this.http = http;
  }

  /**
   * Get notifications
   * @param {Object} [params]
   * @param {number} [params.page]
   * @param {number} [params.pageSize]
   * @returns {Promise<import('./types').PaginatedResponse<import('./types').Notification> & {unreadCount: number}>}
   */
  async list(params) {
    return this.http.get('/notifications', params);
  }

  /**
   * Get unread count
   * @returns {Promise<number>}
   */
  async getUnreadCount() {
    const response = await this.http.get('/notifications/count');
    return response.unread;
  }

  /**
   * Mark notification as read
   * @param {string} notificationId
   * @returns {Promise<void>}
   */
  async markAsRead(notificationId) {
    await this.http.post(`/notifications/${notificationId}/read`);
  }

  /**
   * Mark all notifications as read
   * @returns {Promise<void>}
   */
  async markAllAsRead() {
    await this.http.post('/notifications/read-all');
  }

  /**
   * Delete a notification
   * @param {string} notificationId
   * @returns {Promise<void>}
   */
  async delete(notificationId) {
    await this.http.delete(`/notifications/${notificationId}`);
  }
}

// ============================================================================
// Broadcasts Service
// ============================================================================

class BroadcastsService {
  /**
   * @param {HttpClient} http
   */
  constructor(http) {
    this.http = http;
  }

  /**
   * Get all broadcast channels
   * @returns {Promise<import('./types').BroadcastChannel[]>}
   */
  async getChannels() {
    const response = await this.http.get('/broadcasts/channels');
    return response.items || [];
  }

  /**
   * Get subscribed channels
   * @returns {Promise<import('./types').BroadcastChannel[]>}
   */
  async getSubscriptions() {
    return this.http.get('/broadcasts/channels/subscribed');
  }

  /**
   * Subscribe to a channel
   * @param {string} channelId
   * @returns {Promise<void>}
   */
  async subscribe(channelId) {
    await this.http.post(`/broadcasts/channels/${channelId}/subscribe`);
  }

  /**
   * Unsubscribe from a channel
   * @param {string} channelId
   * @returns {Promise<void>}
   */
  async unsubscribe(channelId) {
    await this.http.delete(`/broadcasts/channels/${channelId}/subscribe`);
  }

  /**
   * Get channel messages
   * @param {string} channelId
   * @param {number} [limit=50]
   * @returns {Promise<import('./types').PaginatedResponse<import('./types').BroadcastMessage>>}
   */
  async getMessages(channelId, limit = 50) {
    const messages = await this.http.get(`/broadcasts/channels/${channelId}/messages`, { limit });
    return { items: messages, totalCount: messages.length, page: 1, pageSize: limit };
  }

  /**
   * Get feed from all subscribed channels
   * @param {number} [limit=50]
   * @returns {Promise<import('./types').PaginatedResponse<import('./types').BroadcastMessage>>}
   */
  async getFeed(limit = 50) {
    const messages = await this.http.get('/broadcasts/messages/feed', { limit });
    return { items: messages, totalCount: messages.length, page: 1, pageSize: limit };
  }
}

// ============================================================================
// Announcements Service
// ============================================================================

class AnnouncementsService {
  /**
   * @param {HttpClient} http
   */
  constructor(http) {
    this.http = http;
  }

  /**
   * Get announcements
   * @param {boolean} [unreadOnly=false]
   * @returns {Promise<import('./types').Announcement[]>}
   */
  async list(unreadOnly = false) {
    return this.http.get('/announcements/my', { unreadOnly });
  }

  /**
   * Mark announcement as read
   * @param {string} announcementId
   * @returns {Promise<void>}
   */
  async markAsRead(announcementId) {
    await this.http.post(`/announcements/${announcementId}/read`);
  }

  /**
   * Dismiss announcement
   * @param {string} announcementId
   * @returns {Promise<void>}
   */
  async dismiss(announcementId) {
    await this.http.post(`/announcements/${announcementId}/dismiss`);
  }
}

// ============================================================================
// Search Service
// ============================================================================

class SearchService {
  /**
   * @param {HttpClient} http
   */
  constructor(http) {
    this.http = http;
  }

  /**
   * Global search across users, conversations, and messages
   * @param {import('./types').GlobalSearchRequest} request
   * @returns {Promise<import('./types').SearchResult>}
   */
  async search(request) {
    return this.http.get('/search', {
      q: request.query,
      type: request.types?.[0],
      limit: request.limit,
    });
  }

  /**
   * Search within a conversation
   * @param {import('./types').ConversationSearchRequest} request
   * @returns {Promise<import('./types').MessageSearchResult[]>}
   */
  async searchInConversation(request) {
    return this.http.get(`/search/conversations/${request.conversationId}`, {
      q: request.query,
      limit: request.limit,
      before: request.before,
      after: request.after,
    });
  }

  /**
   * Search users only
   * @param {string} query
   * @param {number} [limit=20]
   * @returns {Promise<import('./types').UserSearchResult[]>}
   */
  async searchUsers(query, limit = 20) {
    const result = await this.search({ query, types: ['users'], limit });
    return result.users || [];
  }
}

// ============================================================================
// Devices Service
// ============================================================================

class DevicesService {
  /**
   * @param {HttpClient} http
   */
  constructor(http) {
    this.http = http;
  }

  /**
   * Get all devices/sessions
   * @returns {Promise<import('./types').Device[]>}
   */
  async list() {
    return this.http.get('/auth/sessions');
  }

  /**
   * Register a device for push notifications
   * @param {import('./types').RegisterDeviceRequest} data
   * @returns {Promise<void>}
   */
  async register(data) {
    await this.http.post('/devices/register', {
      DeviceToken: data.token,
      Platform: data.platform,
      DeviceName: data.deviceName,
    });
  }

  /**
   * Remove a device/session
   * @param {string} deviceId
   * @returns {Promise<void>}
   */
  async remove(deviceId) {
    await this.http.delete(`/auth/sessions/${deviceId}`);
  }

  /**
   * Remove all other sessions
   * @returns {Promise<void>}
   */
  async removeAllOthers() {
    await this.http.delete('/auth/sessions');
  }
}

// ============================================================================
// Two-Factor Service
// ============================================================================

class TwoFactorService {
  /**
   * @param {HttpClient} http
   */
  constructor(http) {
    this.http = http;
  }

  /**
   * Enable two-factor authentication
   * @param {string} password
   * @returns {Promise<import('./types').TwoFactorSetupResponse>}
   */
  async enable(password) {
    return this.http.post('/two-factor/enable', { password });
  }

  /**
   * Disable two-factor authentication
   * @param {string} password
   * @param {string} code
   * @returns {Promise<void>}
   */
  async disable(password, code) {
    await this.http.post('/two-factor/disable', { password, code });
  }

  /**
   * Verify two-factor code
   * @param {string} code
   * @returns {Promise<void>}
   */
  async verify(code) {
    await this.http.post('/two-factor/verify', { code });
  }

  /**
   * Get backup codes
   * @returns {Promise<import('./types').BackupCodesResponse>}
   */
  async getBackupCodes() {
    return this.http.get('/two-factor/backup-codes');
  }

  /**
   * Regenerate backup codes
   * @param {string} password
   * @returns {Promise<import('./types').BackupCodesResponse>}
   */
  async regenerateBackupCodes(password) {
    return this.http.post('/two-factor/regenerate-backup-codes', { password });
  }
}

// ============================================================================
// Reports Service
// ============================================================================

class ReportsService {
  /**
   * @param {HttpClient} http
   */
  constructor(http) {
    this.http = http;
  }

  /**
   * Create a report
   * @param {import('./types').CreateReportRequest} data
   * @returns {Promise<import('./types').Report>}
   */
  async create(data) {
    return this.http.post('/reports', data);
  }
}

// ============================================================================
// Invitations Service
// ============================================================================

class InvitationsService {
  /**
   * @param {HttpClient} http
   */
  constructor(http) {
    this.http = http;
  }

  /**
   * Get paginated list of invitations
   * @param {import('./types').InvitationListParams} [params]
   * @returns {Promise<import('./types').InvitationListResponse>}
   */
  async list(params) {
    return this.http.get('/invitations', {
      page: params?.page,
      pageSize: params?.pageSize,
      search: params?.search,
      status: params?.status,
    });
  }

  /**
   * Get invitation by ID
   * @param {string} id
   * @returns {Promise<import('./types').Invitation>}
   */
  async get(id) {
    return this.http.get(`/invitations/${id}`);
  }

  /**
   * Get invitation statistics
   * @returns {Promise<import('./types').InvitationStats>}
   */
  async getStats() {
    return this.http.get('/invitations/stats');
  }

  /**
   * Create a new invitation
   * @param {import('./types').CreateInvitationRequest} request
   * @returns {Promise<import('./types').Invitation>}
   */
  async create(request) {
    return this.http.post('/invitations', request);
  }

  /**
   * Resend an invitation (extends expiry)
   * @param {string} id
   * @param {import('./types').ResendInvitationRequest} [request]
   * @returns {Promise<import('./types').Invitation>}
   */
  async resend(id, request) {
    return this.http.post(`/invitations/${id}/resend`, request || {});
  }

  /**
   * Revoke an invitation
   * @param {string} id
   * @returns {Promise<import('./types').Invitation>}
   */
  async revoke(id) {
    return this.http.post(`/invitations/${id}/revoke`);
  }

  /**
   * Delete an invitation
   * @param {string} id
   * @returns {Promise<void>}
   */
  async delete(id) {
    return this.http.delete(`/invitations/${id}`);
  }
}

// ============================================================================
// Main SDK Class
// ============================================================================

class PeopleConnectSDK {
  /**
   * @param {import('./types').SDKConfig} config
   */
  constructor(config) {
    this.http = new HttpClient(config);

    /** @type {AuthService} */
    this.auth = new AuthService(this.http);
    /** @type {UserService} */
    this.users = new UserService(this.http);
    /** @type {ConversationsService} */
    this.conversations = new ConversationsService(this.http);
    /** @type {MessagesService} */
    this.messages = new MessagesService(this.http);
    /** @type {ContactsService} */
    this.contacts = new ContactsService(this.http);
    /** @type {CallsService} */
    this.calls = new CallsService(this.http);
    /** @type {MediaService} */
    this.media = new MediaService(this.http, config.baseUrl);
    /** @type {NotificationsService} */
    this.notifications = new NotificationsService(this.http);
    /** @type {BroadcastsService} */
    this.broadcasts = new BroadcastsService(this.http);
    /** @type {AnnouncementsService} */
    this.announcements = new AnnouncementsService(this.http);
    /** @type {SearchService} */
    this.search = new SearchService(this.http);
    /** @type {DevicesService} */
    this.devices = new DevicesService(this.http);
    /** @type {TwoFactorService} */
    this.twoFactor = new TwoFactorService(this.http);
    /** @type {ReportsService} */
    this.reports = new ReportsService(this.http);
    /** @type {InvitationsService} */
    this.invitations = new InvitationsService(this.http);
  }

  /**
   * Set authentication tokens
   * @param {import('./types').AuthTokens} tokens
   */
  setTokens(tokens) {
    this.http.setTokens(tokens);
  }

  /**
   * Clear authentication tokens
   */
  clearTokens() {
    this.http.setTokens(null);
  }

  /**
   * Get current access token
   * @returns {string | null}
   */
  getAccessToken() {
    return this.http.getAccessToken();
  }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PeopleConnectSDK, default: PeopleConnectSDK };
}

export { PeopleConnectSDK };
export default PeopleConnectSDK;
