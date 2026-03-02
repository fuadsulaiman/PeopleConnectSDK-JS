/**
 * PeopleConnect SDK Types
 * JSDoc type definitions for the PeopleConnect API
 */

// ============================================================================
// Core Type Constants
// ============================================================================

/** @type {readonly ["Online", "Away", "Busy", "Offline"]} */
export const UserStatusValues = ["Online", "Away", "Busy", "Offline"];

/** @type {readonly ["Text", "Image", "Video", "Audio", "File", "Location", "System", "VoiceCall", "VideoCall"]} */
export const MessageTypeValues = ["Text", "Image", "Video", "Audio", "File", "Location", "System", "VoiceCall", "VideoCall"];

/** @type {readonly ["Sent", "Delivered", "Read", "Deleted", "Flagged"]} */
export const MessageStatusValues = ["Sent", "Delivered", "Read", "Deleted", "Flagged"];

/** @type {readonly ["DirectMessage", "Chatroom", "BroadcastChannel"]} */
export const ConversationTypeValues = ["DirectMessage", "Chatroom", "BroadcastChannel"];

/** @type {readonly ["Pending", "Accepted", "Rejected", "Blocked"]} */
export const ContactStatusValues = ["Pending", "Accepted", "Rejected", "Blocked"];

/** @type {readonly ["Member", "Admin", "Owner"]} */
export const ParticipantRoleValues = ["Member", "Admin", "Owner"];

/** @type {readonly ["voice", "video"]} */
export const CallTypeValues = ["voice", "video"];

/** @type {readonly ["incoming", "outgoing"]} */
export const CallDirectionValues = ["incoming", "outgoing"];

/** @type {readonly ["completed", "missed", "rejected", "failed"]} */
export const CallStatusValues = ["completed", "missed", "rejected", "failed"];

/** @type {readonly ["spam", "harassment", "inappropriate", "impersonation", "other"]} */
export const ReportTypeValues = ["spam", "harassment", "inappropriate", "impersonation", "other"];

/** @type {readonly ["web", "ios", "android"]} */
export const DevicePlatformValues = ["web", "ios", "android"];

/** @type {readonly ["light", "dark", "system"]} */
export const ThemeValues = ["light", "dark", "system"];

/** @type {readonly ["small", "medium", "large"]} */
export const FontSizeValues = ["small", "medium", "large"];

/** @type {readonly ["public", "contacts", "private", "everyone", "nobody"]} */
export const VisibilityValues = ["public", "contacts", "private", "everyone", "nobody"];

/** @type {readonly ["low", "normal", "high", "urgent"]} */
export const PriorityValues = ["low", "normal", "high", "urgent"];

// ============================================================================
// JSDoc Type Definitions
// ============================================================================

/**
 * @typedef {"Online" | "Away" | "Busy" | "Offline"} UserStatus
 * @typedef {"Text" | "Image" | "Video" | "Audio" | "File" | "Location" | "System" | "VoiceCall" | "VideoCall"} MessageType
 * @typedef {"Sent" | "Delivered" | "Read" | "Deleted" | "Flagged"} MessageStatus
 * @typedef {"DirectMessage" | "Chatroom" | "BroadcastChannel"} ConversationType
 * @typedef {"Pending" | "Accepted" | "Rejected" | "Blocked"} ContactStatus
 * @typedef {"Member" | "Admin" | "Owner"} ParticipantRole
 * @typedef {"voice" | "video"} CallType
 * @typedef {"incoming" | "outgoing"} CallDirection
 * @typedef {"completed" | "missed" | "rejected" | "failed"} CallStatus
 * @typedef {"spam" | "harassment" | "inappropriate" | "impersonation" | "other"} ReportType
 * @typedef {"web" | "ios" | "android"} DevicePlatform
 * @typedef {"light" | "dark" | "system"} Theme
 * @typedef {"small" | "medium" | "large"} FontSize
 * @typedef {"public" | "contacts" | "private" | "everyone" | "nobody"} Visibility
 * @typedef {"low" | "normal" | "high" | "urgent"} Priority
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} username
 * @property {string} [email]
 * @property {string} [avatarUrl]
 * @property {string} [description]
 * @property {UserStatus} status
 * @property {string} [statusMessage]
 * @property {boolean} [twoFactorEnabled]
 */

/**
 * @typedef {User & {
 *   mobileNumber?: string,
 *   languageCode: string,
 *   createdAt: string
 * }} UserProfile
 */

/**
 * @typedef {Object} UserPreferences
 * @property {boolean} notificationsEnabled
 * @property {boolean} soundEnabled
 * @property {boolean} vibrationEnabled
 * @property {boolean} showOnlineStatus
 * @property {boolean} showReadReceipts
 * @property {boolean} showTypingIndicator
 * @property {Theme} theme
 * @property {FontSize} fontSize
 * @property {string} language
 */

/**
 * @typedef {Object} PrivacySettings
 * @property {Visibility} profileVisibility
 * @property {Visibility} lastSeenVisibility
 * @property {boolean} readReceiptsEnabled
 * @property {boolean} typingIndicatorEnabled
 */

/**
 * @typedef {Object} LoginRequest
 * @property {string} username
 * @property {string} password
 * @property {"user" | "admin"} [portal]
 */

/**
 * @typedef {Object} RegisterRequest
 * @property {string} name
 * @property {string} username
 * @property {string} password
 * @property {string} [email]
 * @property {string} [mobileNumber]
 * @property {string} [invitationCode]
 */

/**
 * @typedef {Object} ActiveWarning
 * @property {string} id
 * @property {string} reason
 * @property {string} createdAt
 * @property {string} moderatorName
 */

/**
 * @typedef {Object} LoginResponse
 * @property {string} sessionId
 * @property {string} accessToken
 * @property {string} refreshToken
 * @property {User} user
 * @property {boolean} [requiresTwoFactor]
 * @property {boolean} [requiresPasswordChange]
 * @property {boolean} [requiresTwoFactorSetup]
 * @property {number} [warningCount]
 * @property {ActiveWarning[]} [activeWarnings]
 */

/**
 * @typedef {Object} ChangePasswordRequest
 * @property {string} currentPassword
 * @property {string} newPassword
 */

/**
 * @typedef {Object} ResetPasswordRequest
 * @property {string} token
 * @property {string} newPassword
 */

/**
 * @typedef {Object} TwoFactorVerifyRequest
 * @property {string} code
 * @property {string} userId
 */

/**
 * @typedef {Object} Conversation
 * @property {string} id
 * @property {ConversationType} type
 * @property {string} [name]
 * @property {string} [avatarUrl]
 * @property {string} [description]
 * @property {Message} [lastMessage]
 * @property {string} [lastMessageAt]
 * @property {number} unreadCount
 * @property {boolean} [isMuted]
 * @property {boolean} [isPinned]
 * @property {boolean} [isArchived]
 * @property {ConversationParticipant[]} participants
 */

/**
 * @typedef {Conversation & {
 *   createdAt: string,
 *   createdBy?: string
 * }} ConversationDetail
 */

/**
 * @typedef {Object} ConversationParticipant
 * @property {string} userId
 * @property {User} user
 * @property {ParticipantRole} role
 * @property {string} joinedAt
 * @property {boolean} [isDeleted]
 */

/**
 * @typedef {Object} ConversationMember
 * @property {string} userId
 * @property {string} username
 * @property {string} name
 * @property {string} [avatarUrl]
 * @property {string} role
 * @property {string} joinedAt
 * @property {boolean} isOnline
 * @property {boolean} [isDeleted]
 */

/**
 * @typedef {Object} CreateDMRequest
 * @property {string} userId
 */

/**
 * @typedef {Object} CreateChatroomRequest
 * @property {string} name
 * @property {string} [description]
 * @property {string[]} participantIds
 */

/**
 * @typedef {Object} UpdateChatroomRequest
 * @property {string} [name]
 * @property {string} [description]
 * @property {string} [avatarUrl]
 */

/**
 * @typedef {Object} Attachment
 * @property {string} id
 * @property {string} fileName
 * @property {string} originalFileName
 * @property {string} contentType
 * @property {number} fileSize
 * @property {string} url
 * @property {string} [thumbnailUrl]
 * @property {number} [width]
 * @property {number} [height]
 * @property {number} [duration]
 * @property {number[]} [waveform]
 */

/**
 * @typedef {Object} Reaction
 * @property {string} userId
 * @property {string} emoji
 * @property {string} createdAt
 */

/**
 * @typedef {Object} Message
 * @property {string} id
 * @property {string} conversationId
 * @property {string} senderId
 * @property {User} sender
 * @property {string} [content]
 * @property {MessageType} type
 * @property {string} [replyToMessageId]
 * @property {Message} [replyToMessage]
 * @property {string} [forwardedFromMessageId]
 * @property {MessageStatus} status
 * @property {Attachment[]} attachments
 * @property {Reaction[]} reactions
 * @property {string} createdAt
 * @property {string} [editedAt]
 */

/**
 * @typedef {Object} SendMessageRequest
 * @property {string} [content]
 * @property {string} [type]
 * @property {string} [replyToMessageId]
 * @property {string[]} [attachmentIds]
 */

/**
 * @typedef {Object} EditMessageRequest
 * @property {string} content
 */

/**
 * @typedef {Object} Contact
 * @property {string} id
 * @property {string} userId
 * @property {User} contactUser
 * @property {ContactStatus} status
 * @property {string} [nickname]
 * @property {string} createdAt
 */

/**
 * @typedef {Object} BlockedContact
 * @property {string} id
 * @property {string} userId
 * @property {string} name
 * @property {string} username
 * @property {string} [avatarUrl]
 * @property {string} blockedAt
 */

/**
 * @typedef {Object} UserSearchResult
 * @property {string} id
 * @property {string} name
 * @property {string} username
 * @property {string} [avatarUrl]
 * @property {boolean} isContact
 * @property {boolean} isPending
 * @property {boolean} [isOnline]
 */

/**
 * @typedef {Object} ContactRequestList
 * @property {Contact[]} received
 * @property {Contact[]} sent
 */

/**
 * @typedef {Object} InitiateCallRequest
 * @property {string} [conversationId]
 * @property {string} [targetUserId]
 * @property {CallType} type
 */

/**
 * @typedef {Object} IceServer
 * @property {string | string[]} urls
 * @property {string} [username]
 * @property {string} [credential]
 */

/**
 * @typedef {Object} CallResponse
 * @property {string} callId
 * @property {string} [conversationId]
 * @property {CallType} type
 * @property {string} status
 * @property {IceServer[]} [iceServers]
 */

/**
 * @typedef {Object} CallParticipant
 * @property {string} userId
 * @property {string} userName
 * @property {string} [avatarUrl]
 * @property {string} joinedAt
 * @property {string} [leftAt]
 */

/**
 * @typedef {Object} CallHistoryItem
 * @property {string} id
 * @property {string} conversationId
 * @property {string} [conversationName]
 * @property {CallType} type
 * @property {CallDirection} direction
 * @property {CallStatus} status
 * @property {number} duration
 * @property {string} startedAt
 * @property {string} [endedAt]
 * @property {CallParticipant[]} participants
 */

/**
 * @typedef {Object} LiveKitTokenResponse
 * @property {string} token
 * @property {string} url
 * @property {string} roomName
 */

/**
 * @typedef {Object} UploadResponse
 * @property {string} id
 * @property {string} fileName
 * @property {string} originalFileName
 * @property {string} contentType
 * @property {number} fileSize
 * @property {string} downloadUrl
 * @property {string} [thumbnailUrl]
 * @property {number} [width]
 * @property {number} [height]
 * @property {number} [duration]
 * @property {number[]} [waveform]
 */

/**
 * @typedef {Object} UploadProgress
 * @property {number} loaded
 * @property {number} total
 * @property {number} percentage
 */

/**
 * @typedef {Object} Notification
 * @property {string} id
 * @property {string} type
 * @property {string} title
 * @property {string} [body]
 * @property {string} [data]
 * @property {string} [referenceId]
 * @property {boolean} isRead
 * @property {string} createdAt
 */

/**
 * @typedef {Object} BroadcastChannel
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} createdAt
 * @property {number} subscriberCount
 * @property {boolean} isSubscribed
 * @property {string} [imageUrl]
 * @property {boolean} [isPublic]
 * @property {boolean} [isActive]
 * @property {string} [type]
 */

/**
 * @typedef {Object} BroadcastMessage
 * @property {string} id
 * @property {string} channelId
 * @property {string} [channelName]
 * @property {string} [title]
 * @property {string} content
 * @property {Priority} [priority]
 * @property {string} createdAt
 * @property {string} [publishedAt]
 * @property {string} [publisherId]
 * @property {string} [publisherName]
 * @property {string} [imageUrl]
 * @property {string[]} mediaUrls
 */

/**
 * @typedef {Object} Announcement
 * @property {string} id
 * @property {string} title
 * @property {string} content
 * @property {string} [imageUrl]
 * @property {number} priority
 * @property {string} createdAt
 * @property {boolean} hasRead
 */

/**
 * @typedef {Object} MessageSearchResult
 * @property {string} id
 * @property {string} conversationId
 * @property {string} conversationName
 * @property {string} content
 * @property {string} senderName
 * @property {string} sentAt
 */

/**
 * @typedef {Object} ConversationSearchResult
 * @property {string} id
 * @property {string} name
 * @property {string} type
 * @property {string} [imageUrl]
 * @property {number} participantCount
 */

/**
 * @typedef {Object} SearchResult
 * @property {UserSearchResult[]} users
 * @property {MessageSearchResult[]} messages
 * @property {ConversationSearchResult[]} conversations
 */

/**
 * @typedef {Object} GlobalSearchRequest
 * @property {string} query
 * @property {("users" | "conversations" | "messages")[]} [types]
 * @property {number} [limit]
 */

/**
 * @typedef {Object} ConversationSearchRequest
 * @property {string} conversationId
 * @property {string} query
 * @property {number} [limit]
 * @property {string} [before]
 * @property {string} [after]
 */

/**
 * @typedef {Object} Device
 * @property {string} id
 * @property {string} name
 * @property {DevicePlatform} platform
 * @property {string} lastActive
 * @property {string} [ipAddress]
 * @property {string} [location]
 * @property {boolean} isCurrent
 * @property {string} createdAt
 * @property {string} [browser]
 */

/**
 * @typedef {Object} RegisterDeviceRequest
 * @property {string} token
 * @property {DevicePlatform} platform
 * @property {string} [deviceName]
 */

/**
 * @typedef {Object} TwoFactorSetupResponse
 * @property {string} secret
 * @property {string} qrCodeUrl
 * @property {string[]} backupCodes
 */

/**
 * @typedef {Object} BackupCodesResponse
 * @property {string[]} codes
 * @property {string} generatedAt
 */

/**
 * @typedef {Object} CreateReportRequest
 * @property {string} [reportedUserId]
 * @property {string} [reportedMessageId]
 * @property {string} [reportedConversationId]
 * @property {ReportType} reportType
 * @property {string} description
 */

/**
 * @typedef {Object} Report
 * @property {string} id
 * @property {string} reporterId
 * @property {string} [reportedUserId]
 * @property {string} [reportedMessageId]
 * @property {string} [reportedConversationId]
 * @property {string} reportType
 * @property {string} description
 * @property {string} status
 * @property {string} createdAt
 */

/**
 * @typedef {Object} Invitation
 * @property {string} id
 * @property {string} code
 * @property {string} email
 * @property {boolean} isUsed
 * @property {string} [usedAt]
 * @property {string} expiresAt
 * @property {boolean} isExpired
 * @property {string} createdBy
 * @property {string} createdByName
 * @property {string} createdAt
 * @property {string} [usedByUserId]
 * @property {string} [usedByName]
 */

/**
 * @typedef {Object} InvitationListResponse
 * @property {Invitation[]} items
 * @property {number} totalCount
 * @property {number} page
 * @property {number} pageSize
 * @property {number} totalPages
 */

/**
 * @typedef {Object} InvitationStats
 * @property {number} total
 * @property {number} pending
 * @property {number} used
 * @property {number} expired
 */

/**
 * @typedef {Object} CreateInvitationRequest
 * @property {string} email
 * @property {number} [expiryDays]
 */

/**
 * @typedef {Object} ResendInvitationRequest
 * @property {number} [expiryDays]
 */

/**
 * @typedef {"all" | "pending" | "used" | "expired"} InvitationStatus
 */

/**
 * @typedef {Object} InvitationListParams
 * @property {number} [page]
 * @property {number} [pageSize]
 * @property {string} [search]
 * @property {InvitationStatus} [status]
 */

/**
 * @template T
 * @typedef {Object} PaginatedResponse
 * @property {T[]} items
 * @property {number} totalCount
 * @property {number} page
 * @property {number} pageSize
 * @property {boolean} [hasMore]
 */

/**
 * @typedef {Object} PaginationParams
 * @property {number} [page]
 * @property {number} [pageSize]
 */

/**
 * @template T
 * @typedef {Object} ApiResponse
 * @property {boolean} success
 * @property {T} data
 * @property {string} [message]
 */

/**
 * @typedef {Object} ApiError
 * @property {string} message
 * @property {string} [code]
 * @property {Record<string, string[]>} [details]
 */

/**
 * @typedef {Object} SDKConfig
 * @property {string} baseUrl
 * @property {number} [timeout]
 * @property {(tokens: AuthTokens) => void} [onTokenRefresh]
 * @property {() => void} [onUnauthorized]
 * @property {(error: ApiError) => void} [onError]
 */

/**
 * @typedef {Object} AuthTokens
 * @property {string} accessToken
 * @property {string} refreshToken
 */
