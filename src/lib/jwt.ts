import { SignJWT, jwtVerify, JWTPayload } from 'jose'

const encoder = new TextEncoder()
const getKey = () => {
  const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('JWT_SECRET not set')
  return encoder.encode(secret)
}

export type TokenPayload = { sub: string; email?: string; rm?: boolean } & JWTPayload

export const signAccessToken = async (payload: { sub: string; email?: string }) => {
  const key = getKey()
  const jwt = await new SignJWT({ sub: payload.sub, email: payload.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(key)
  return jwt
}

export const signRefreshToken = async (payload: { sub: string; email?: string; rememberMe?: boolean }) => {
  const key = getKey()
  const jwt = await new SignJWT({ sub: payload.sub, email: payload.email, rm: Boolean(payload.rememberMe) })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(payload.rememberMe ? '30d' : '7d')
    .sign(key)
  return jwt
}

export const verifyToken = async (token: string) => {
  const key = getKey()
  const { payload } = await jwtVerify(token, key)
  return payload as TokenPayload
}
