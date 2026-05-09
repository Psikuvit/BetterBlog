import mongoose from 'mongoose'

const globalAny: any = global

if (!globalAny._mongoConnection) {
  globalAny._mongoConnection = { conn: null, promise: null }
}

const connectDB = async () => {
  if (globalAny._mongoConnection.conn) return globalAny._mongoConnection.conn

  if (!globalAny._mongoConnection.promise) {
    const uri = process.env.MONGODB_URI
    if (!uri) throw new Error('MONGODB_URI not set')
    globalAny._mongoConnection.promise = mongoose.connect(uri).then((m) => m.connection)
  }

  globalAny._mongoConnection.conn = await globalAny._mongoConnection.promise
  return globalAny._mongoConnection.conn
}

export default connectDB
