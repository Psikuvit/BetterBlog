import { Model, Schema, Types, model, models } from 'mongoose'

export type UserRole = 'user' | 'moderator' | 'admin'

export interface IUser {
  _id: Types.ObjectId
  username: string
  email: string
  password: string
  bio: string
  avatarUrl: string
  role: UserRole
  preferences: Record<string, unknown>
  passwordResetTokenHash?: string | null
  passwordResetExpiresAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

type UserModel = Model<IUser>

const UserSchema = new Schema<IUser, UserModel>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 2,
      maxlength: 40,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    bio: {
      type: String,
      default: '',
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'moderator', 'admin'],
      default: 'user',
    },
    preferences: {
      type: Schema.Types.Mixed,
      default: {},
    },
    passwordResetTokenHash: {
      type: String,
      default: null,
    },
    passwordResetExpiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
)

UserSchema.index({ email: 1 }, { unique: true })
UserSchema.index({ username: 1 }, { unique: true })

const User = (models.User as UserModel | undefined) ?? model<IUser, UserModel>('User', UserSchema)

export default User
