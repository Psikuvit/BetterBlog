import { model, models, Schema, Types, type Model } from 'mongoose'

export type PostVisibility = 'public' | 'private' | 'admin-private'

export interface IPost {
  _id: Types.ObjectId
  author: Types.ObjectId
  title: string
  slug: string
  excerpt: string
  content: string
  tags: string[]
  visibility: PostVisibility
  coverImageUrl: string
  isPublic: boolean
  publishedAt: Date | null
  sourcePreviewTitle?: string | null
  sourcePreviewDescription?: string | null
  sourcePreviewImage?: string | null
  originalAuthor?: string | null
  legacyId?: string | null
  sourceUrl?: string | null
  importedAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

type PostModel = Model<IPost>

const PostSchema = new Schema<IPost, PostModel>(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    excerpt: {
      type: String,
      default: '',
    },
    content: {
      type: String,
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    visibility: {
      type: String,
      enum: ['public', 'private', 'admin-private'],
      default: 'public',
    },
    coverImageUrl: {
      type: String,
      default: '',
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    sourcePreviewTitle: {
      type: String,
      default: null,
    },
    sourcePreviewDescription: {
      type: String,
      default: null,
    },
    sourcePreviewImage: {
      type: String,
      default: null,
    },
    originalAuthor: {
      type: String,
      default: null,
    },
    legacyId: {
      type: String,
      default: null,
    },
    sourceUrl: {
      type: String,
      default: null,
    },
    importedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
)

PostSchema.index({ author: 1, isPublic: 1, publishedAt: -1 })
PostSchema.index({ title: 'text', content: 'text', tags: 'text' })

PostSchema.pre('save', function syncVisibility() {
  this.isPublic = this.visibility === 'public'
})

const Post = (models.Post as PostModel | undefined) ?? model<IPost, PostModel>('Post', PostSchema)

export default Post