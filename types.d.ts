/**
 * PeopleConnect SDK TypeScript Declarations
 * Type definitions for JavaScript SDK
 */

// Core Types
export type UserStatus = "Online" | "Away" | "Busy" | "Offline";
export type MessageType = "Text" | "Image" | "Video" | "Audio" | "File" | "Location" | "System" | "VoiceCall" | "VideoCall";
export type MessageStatus = "Sent" | "Delivered" | "Read" | "Deleted" | "Flagged";
export type ConversationType = "DirectMessage" | "Chatroom" | "BroadcastChannel";
export type ContactStatus = "Pending" | "Accepted" | "Rejected" | "Blocked";
export type ParticipantRole = "Member" | "Admin" | "Owner";
export type CallType = "voice" | "video";
export type CallDirection = "incoming" | "outgoing";
export type CallStatus = "completed" | "missed" | "rejected" | "failed";
export type ReportType = "spam" | "harassment" | "inappropriate" | "impersonation" | "other";
export type DevicePlatform = "web" | "ios" | "android";
export type Theme = "light" | "dark" | "system";
export type FontSize = "small" | "medium" | "large";
export type Visibility = "public" | "contacts" | "private" | "everyone" | "nobody";
export type Priority = "low" | "normal" | "high" | "urgent";

// User Types
export interface User {
  id: string;
  name: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  description?: string;
  status: UserStatus;
  statusMessage?: string;
  twoFactorEnabled?: boolean;
}

export interface UserProfile extends User {
  mobileNumber?: string;
  languageCode: string;
  createdAt: string;
}

// Authentication Types
export interface LoginRequest {
  username: string;
  password: string;
  portal?: "user" | "admin";
}

export interface RegisterRequest {
  name: string;
  username: string;
  password: string;
  email?: string;
  mobileNumber?: string;
  invitationCode?: string;
}

export interface LoginResponse {
  sessionId: string;
  accessToken: string;
  refreshToken: string;
  user: User;
  requiresTwoFactor?: boolean;
  requiresPasswordChange?: boolean;
  requiresTwoFactorSetup?: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface TwoFactorVerifyRequest {
  code: string;
  userId: string;
}

// Conversation Types
export interface Conversation {
  id: string;
  type: ConversationType;
  name?: string;
  avatarUrl?: string;
  description?: string;
  lastMessage?: Message;
  lastMessageAt?: string;
  unreadCount: number;
  isMuted?: boolean;
  isPinned?: boolean;
  isArchived?: boolean;
  participants: ConversationParticipant[];
}

export interface ConversationDetail extends Conversation {
  createdAt: string;
  createdBy?: string;
}

export interface ConversationParticipant {
  userId: string;
  user: User;
  role: ParticipantRole;
  joinedAt: string;
  isDeleted?: boolean;
}

export interface ConversationMember {
  userId: string;
  username: string;
  name: string;
  avatarUrl?: string;
  role: string;
  joinedAt: string;
  isOnline: boolean;
  isDeleted?: boolean;
}

export interface CreateDMRequest {
  userId: string;
}

export interface CreateChatroomRequest {
  name: string;
  description?: string;
  participantIds: string[];
}

export interface UpdateChatroomRequest {
  name?: string;
  description?: string;
  avatarUrl?: string;
}

// Message Types
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender: User;
  content?: string;
  type: MessageType;
  replyToMessageId?: string;
  replyToMessage?: Message;
  forwardedFromMessageId?: string;
  status: MessageStatus;
  attachments: Attachment[];
  reactions: Reaction[];
  createdAt: string;
  editedAt?: string;
}

export interface SendMessageRequest {
  content?: string;
  type?: string;
  replyToMessageId?: string;
  attachmentIds?: string[];
}

export interface EditMessageRequest {
  content: string;
}

export interface Attachment {
  id: string;
  fileName: string;
  originalFileName: string;
  contentType: string;
  fileSize: number;
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number;
  waveform?: number[];
}

export interface Reaction {
  userId: string;
  emoji: string;
  createdAt: string;
}

// Contact Types
export interface Contact {
  id: string;
  userId: string;
  contactUser: User;
  status: ContactStatus;
  nickname?: string;
  createdAt: string;
}

export interface BlockedContact {
  id: string;
  userId: string;
  name: string;
  username: string;
  avatarUrl?: string;
  blockedAt: string;
}

export interface UserSearchResult {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  isContact: boolean;
  isPending: boolean;
  isOnline?: boolean;
}

export interface ContactRequestList {
  received: Contact[];
  sent: Contact[];
}

// Call Types
export interface InitiateCallRequest {
  conversationId?: string;
  targetUserId?: string;
  type: CallType;
}

export interface CallResponse {
  callId: string;
  conversationId?: string;
  type: CallType;
  status: string;
  iceServers?: IceServer[];
}

export interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface CallHistoryItem {
  id: string;
  conversationId: string;
  conversationName?: string;
  type: CallType;
  direction: CallDirection;
  status: CallStatus;
  duration: number;
  startedAt: string;
  endedAt?: string;
  participants: CallParticipant[];
}

export interface CallParticipant {
  userId: string;
  userName: string;
  avatarUrl?: string;
  joinedAt: string;
  leftAt?: string;
}

export interface LiveKitTokenResponse {
  token: string;
  url: string;
  roomName: string;
}

// Media Types
export interface UploadResponse {
  id: string;
  fileName: string;
  originalFileName: string;
  contentType: string;
  fileSize: number;
  downloadUrl: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number;
  waveform?: number[];
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// Notification Types
export interface Notification {
  id: string;
  type: string;
  title: string;
  body?: string;
  data?: string;
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}

// Broadcast Types
export interface BroadcastChannel {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  subscriberCount: number;
  isSubscribed: boolean;
  imageUrl?: string;
  isPublic?: boolean;
  isActive?: boolean;
  type?: string;
}

export interface BroadcastMessage {
  id: string;
  channelId: string;
  channelName?: string;
  title?: string;
  content: string;
  priority?: Priority;
  createdAt: string;
  publishedAt?: string;
  publisherId?: string;
  publisherName?: string;
  imageUrl?: string;
  mediaUrls: string[];
}

// Announcement Types
export interface Announcement {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  priority: number;
  createdAt: string;
  hasRead: boolean;
}

// Search Types
export interface SearchResult {
  users: UserSearchResult[];
  messages: MessageSearchResult[];
  conversations: ConversationSearchResult[];
}

export interface MessageSearchResult {
  id: string;
  conversationId: string;
  conversationName: string;
  content: string;
  senderName: string;
  sentAt: string;
}

export interface ConversationSearchResult {
  id: string;
  name: string;
  type: string;
  imageUrl?: string;
  participantCount: number;
}

export interface GlobalSearchRequest {
  query: string;
  types?: ("users" | "conversations" | "messages")[];
  limit?: number;
}

export interface ConversationSearchRequest {
  conversationId: string;
  query: string;
  limit?: number;
  before?: string;
  after?: string;
}

// Device Types
export interface Device {
  id: string;
  name: string;
  platform: DevicePlatform;
  lastActive: string;
  ipAddress?: string;
  location?: string;
  isCurrent: boolean;
  createdAt: string;
  browser?: string;
}

export interface RegisterDeviceRequest {
  token: string;
  platform: DevicePlatform;
  deviceName?: string;
}

// Two-Factor Types
export interface TwoFactorSetupResponse {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface BackupCodesResponse {
  codes: string[];
  generatedAt: string;
}

// Report Types
export interface CreateReportRequest {
  reportedUserId?: string;
  reportedMessageId?: string;
  reportedConversationId?: string;
  reportType: ReportType;
  description: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reportedUserId?: string;
  reportedMessageId?: string;
  reportedConversationId?: string;
  reportType: string;
  description: string;
  status: string;
  createdAt: string;
}

// Invitation Types
export interface Invitation {
  id: string;
  code: string;
  email: string;
  isUsed: boolean;
  usedAt?: string;
  expiresAt: string;
  isExpired: boolean;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  usedByUserId?: string;
  usedByName?: string;
}

export interface InvitationListResponse {
  items: Invitation[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface InvitationStats {
  total: number;
  pending: number;
  used: number;
  expired: number;
}

export interface CreateInvitationRequest {
  email: string;
  expiryDays?: number;
}

export interface ResendInvitationRequest {
  expiryDays?: number;
}

export type InvitationStatus = 'all' | 'pending' | 'used' | 'expired';

export interface InvitationListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: InvitationStatus;
}

// Pagination Types
export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore?: boolean;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

// API Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, string[]>;
}

// SDK Configuration Types
export interface SDKConfig {
  baseUrl: string;
  timeout?: number;
  onTokenRefresh?: (tokens: AuthTokens) => void;
  onUnauthorized?: () => void;
  onError?: (error: ApiError) => void;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Service Classes
export class AuthService {
  login(data: LoginRequest): Promise<LoginResponse>;
  register(data: RegisterRequest): Promise<LoginResponse>;
  logout(): Promise<void>;
  refreshToken(refreshToken: string): Promise<LoginResponse>;
  getCurrentUser(): Promise<UserProfile>;
  checkUsername(username: string): Promise<{ available: boolean }>;
  verifyTwoFactor(data: TwoFactorVerifyRequest): Promise<LoginResponse>;
  forgotPassword(identifier: string): Promise<void>;
  resetPassword(data: ResetPasswordRequest): Promise<void>;
  changePassword(data: ChangePasswordRequest): Promise<void>;
  deleteAccount(): Promise<void>;
  verifyEmail(token: string): Promise<void>;
  resendVerification(email: string): Promise<void>;
}

export class UserService {
  getProfile(): Promise<UserProfile>;
  getUser(userId: string): Promise<User>;
  uploadAvatar(file: File): Promise<{ avatarUrl: string }>;
  deleteAvatar(): Promise<void>;
}

export class ConversationsService {
  list(params?: PaginationParams & { type?: string }): Promise<PaginatedResponse<Conversation>>;
  get(id: string): Promise<ConversationDetail>;
  createDM(data: CreateDMRequest): Promise<Conversation>;
  createChatroom(data: CreateChatroomRequest): Promise<Conversation>;
  update(id: string, data: UpdateChatroomRequest): Promise<Conversation>;
  delete(id: string): Promise<void>;
  leave(id: string): Promise<void>;
  addParticipants(id: string, userIds: string[]): Promise<void>;
  removeParticipant(id: string, userId: string): Promise<void>;
  updateParticipantRole(id: string, userId: string, role: ParticipantRole): Promise<void>;
  getMembers(id: string): Promise<ConversationMember[]>;
  mute(id: string, until?: string): Promise<void>;
  unmute(id: string): Promise<void>;
  archive(id: string): Promise<void>;
  unarchive(id: string): Promise<void>;
  clear(id: string): Promise<void>;
  pin(id: string): Promise<void>;
  unpin(id: string): Promise<void>;
  markAsRead(id: string, lastMessageId?: string): Promise<void>;
  uploadAvatar(id: string, file: File): Promise<{ avatarUrl: string }>;
}

export class MessagesService {
  list(conversationId: string, params?: { limit?: number; before?: string; after?: string }): Promise<{ items: Message[]; hasMore: boolean }>;
  get(conversationId: string, messageId: string): Promise<Message>;
  send(conversationId: string, data: SendMessageRequest): Promise<Message>;
  edit(conversationId: string, messageId: string, data: EditMessageRequest): Promise<Message>;
  delete(conversationId: string, messageId: string, forEveryone?: boolean): Promise<void>;
  react(conversationId: string, messageId: string, emoji: string): Promise<void>;
  removeReaction(conversationId: string, messageId: string, emoji: string): Promise<void>;
  forward(conversationId: string, messageId: string, targetConversationIds: string[]): Promise<void>;
}

export class ContactsService {
  list(params?: PaginationParams & { search?: string }): Promise<PaginatedResponse<Contact>>;
  getRequests(): Promise<ContactRequestList>;
  searchUsers(query: string, limit?: number): Promise<UserSearchResult[]>;
  sendRequest(userId: string, nickname?: string): Promise<Contact>;
  acceptRequest(contactId: string): Promise<Contact>;
  rejectRequest(contactId: string): Promise<void>;
  update(contactId: string, nickname?: string): Promise<Contact>;
  remove(contactId: string): Promise<void>;
  block(userId: string): Promise<void>;
  unblock(userId: string): Promise<void>;
  getBlocked(): Promise<BlockedContact[]>;
}

export class CallsService {
  initiate(data: InitiateCallRequest): Promise<CallResponse>;
  accept(callId: string): Promise<CallResponse>;
  reject(callId: string): Promise<void>;
  end(callId: string): Promise<void>;
  getHistory(params?: PaginationParams): Promise<PaginatedResponse<CallHistoryItem>>;
  get(callId: string): Promise<CallHistoryItem>;
  delete(callId: string): Promise<void>;
  getIceServers(): Promise<IceServer[]>;
  getLiveKitToken(conversationId: string): Promise<LiveKitTokenResponse>;
}

export class MediaService {
  upload(file: File, conversationId?: string): Promise<UploadResponse>;
  uploadMultiple(files: File[], conversationId?: string): Promise<{ uploaded: UploadResponse[]; errors: string[] }>;
  uploadVoice(audioBlob: Blob, conversationId: string, duration: number): Promise<UploadResponse>;
  get(fileId: string): Promise<UploadResponse>;
  delete(fileId: string): Promise<void>;
  getConversationMedia(conversationId: string, params?: PaginationParams & { type?: string }): Promise<PaginatedResponse<Attachment>>;
  getDownloadUrl(fileId: string, token?: string): string;
  getThumbnailUrl(fileId: string, token?: string): string;
  getStreamUrl(fileId: string, token?: string): string;
}

export class NotificationsService {
  list(params?: PaginationParams): Promise<PaginatedResponse<Notification> & { unreadCount: number }>;
  getUnreadCount(): Promise<number>;
  markAsRead(notificationId: string): Promise<void>;
  markAllAsRead(): Promise<void>;
  delete(notificationId: string): Promise<void>;
}

export class BroadcastsService {
  getChannels(): Promise<BroadcastChannel[]>;
  getSubscriptions(): Promise<BroadcastChannel[]>;
  subscribe(channelId: string): Promise<void>;
  unsubscribe(channelId: string): Promise<void>;
  getMessages(channelId: string, limit?: number): Promise<PaginatedResponse<BroadcastMessage>>;
  getFeed(limit?: number): Promise<PaginatedResponse<BroadcastMessage>>;
}

export class AnnouncementsService {
  list(unreadOnly?: boolean): Promise<Announcement[]>;
  markAsRead(announcementId: string): Promise<void>;
  dismiss(announcementId: string): Promise<void>;
}

export class SearchService {
  search(request: GlobalSearchRequest): Promise<SearchResult>;
  searchInConversation(request: ConversationSearchRequest): Promise<MessageSearchResult[]>;
  searchUsers(query: string, limit?: number): Promise<UserSearchResult[]>;
}

export class DevicesService {
  list(): Promise<Device[]>;
  register(data: RegisterDeviceRequest): Promise<void>;
  remove(deviceId: string): Promise<void>;
  removeAllOthers(): Promise<void>;
}

export class TwoFactorService {
  enable(password: string): Promise<TwoFactorSetupResponse>;
  disable(password: string, code: string): Promise<void>;
  verify(code: string): Promise<void>;
  getBackupCodes(): Promise<BackupCodesResponse>;
  regenerateBackupCodes(password: string): Promise<BackupCodesResponse>;
}

export class ReportsService {
  create(data: CreateReportRequest): Promise<Report>;
}

export class InvitationsService {
  list(params?: InvitationListParams): Promise<InvitationListResponse>;
  get(id: string): Promise<Invitation>;
  getStats(): Promise<InvitationStats>;
  create(request: CreateInvitationRequest): Promise<Invitation>;
  resend(id: string, request?: ResendInvitationRequest): Promise<Invitation>;
  revoke(id: string): Promise<Invitation>;
  delete(id: string): Promise<void>;
}

// Main SDK Class
export class PeopleConnectSDK {
  readonly auth: AuthService;
  readonly users: UserService;
  readonly conversations: ConversationsService;
  readonly messages: MessagesService;
  readonly contacts: ContactsService;
  readonly calls: CallsService;
  readonly media: MediaService;
  readonly notifications: NotificationsService;
  readonly broadcasts: BroadcastsService;
  readonly announcements: AnnouncementsService;
  readonly search: SearchService;
  readonly devices: DevicesService;
  readonly twoFactor: TwoFactorService;
  readonly reports: ReportsService;
  readonly invitations: InvitationsService;

  constructor(config: SDKConfig);
  setTokens(tokens: AuthTokens): void;
  clearTokens(): void;
  getAccessToken(): string | null;
}

export default PeopleConnectSDK;
