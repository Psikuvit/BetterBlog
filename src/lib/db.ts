import mongoose from 'mongoose'

export const connectDB = async () => {
    const uri = process.env.MONGODB_URI
    if (!uri) throw new Error('MONGODB_URI not set')
    return mongoose.connect(uri).then((m) => m.connection)
}
