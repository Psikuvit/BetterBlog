import { model, models, Schema, Types, type Model } from 'mongoose'

export interface IPost {
  _id: Types.ObjectId
  author: Types.ObjectId
  title: string
  slug: string
  excerpt: string
  content: string
  isPublic: boolean
  publishedAt: Date | null
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
    isPublic: {
      type: Boolean,
      default: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
)

PostSchema.index({ author: 1, isPublic: 1, publishedAt: -1 })

const Post = (models.Post as PostModel | undefined) ?? model<IPost, PostModel>('Post', PostSchema)

export default Post