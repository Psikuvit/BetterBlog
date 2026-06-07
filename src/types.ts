export type PostItem = {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  tags: string[]
  visibility: string
  coverImageUrl: string
  isPublic: boolean
  publishedAt: string | null
  sourcePreviewTitle: string | null
  sourcePreviewDescription: string | null
  sourcePreviewImage: string | null
  createdAt: string | null
  updatedAt: string | null
  authorId?: string | null
  author?: { id: string; username: string }
  authorUsername?: string | null
}

export type FeedOption<T extends string = string> = {
  value: T
  label: string
}

export type FeedSummary = {
  totalElements: number
  totalPages: number
}

export type ProfilePageProps = {
  params: Promise<{ username: string }>
}

export type ActivityLog = {
  id: string
  action: string
  resourceType: string
  resourceId?: string
  resourceName?: string
  details?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  createdAt: string
}

export type AdminUser = {
  id: string
  username: string
  email: string
  role: 'USER' | 'MODERATOR' | 'ADMIN'
  createdAt: string
  postsCount: number
  lastLoginAt?: string
}

export type Moderator = {
  id: string
  username: string
  email: string
  permissions: string[]
  assignedAt: string
  assignedBy: string
}

export type Config = {
  maxPostsPerUser: number
  allowUserRegistration: boolean
  requireEmailVerification: boolean
  maxSharingLinkExpiryDays: number
  defaultTokenExpiryDays: number
}

export type AdminActivityLog = {
  id: string
  action: string
  resourceType: string
  resourceId?: string
  resourceName?: string
  username: string
  severity: 'info' | 'warning' | 'critical'
  details?: Record<string, unknown>
  createdAt: string
}

export type Stats = {
  totalUsers: number
  totalPosts: number
  totalPublicPosts: number
  totalPrivatePosts: number
  moderatorsCount: number
  adminsCount: number
}

export type AdminPost = {
  id: string
  title: string
  excerpt: string
  visibility: string
  authorUsername: string
  authorName?: string
  createdAt: string
  madePrivateBy?: string
  madePrivateAt?: string
}

export type APIToken = {
  id: string
  name: string
  token: string
  scopes: string[]
  createdAt: string
  lastUsedAt?: string
  expiresAt?: string
}

export type TemporaryLink = {
  id: string
  postId: string
  token: string
  expiresAt: string
  createdAt: string
  accessCount: number
  maxAccess?: number
  post?: { id: string; title: string }
}

export type SharedPost = {
  id: string
  title: string
  visibility: string
}

export type PostDetail = {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  tags: string[]
  visibility: string
  coverImageUrl: string
  isPublic: boolean
  publishedAt: string | null
  sourceUrl: string | null
  sourcePreviewTitle: string | null
  sourcePreviewDescription: string | null
  sourcePreviewImage: string | null
  originalAuthor: string | null
  legacyId: string | null
  importedAt: string | null
  createdAt: string | null
  updatedAt: string | null
  authorId?: string | null
  authorName?: string | null
}

export type PreviewData = {
  url: string
  title: string
  description: string
  image: string
}

export type CreatedPost = {
  id: string
}
