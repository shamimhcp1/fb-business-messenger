import {
  randomBytes,
  createCipheriv,
  createDecipheriv,
  pbkdf2Sync,
  scryptSync,
} from 'crypto'

const pass = process.env.ENCRYPTION_PASS || 'change-me'
const salt = 'fb-messenger-salt'

function getKey() {
  return pbkdf2Sync(pass, salt, 100_000, 32, 'sha256')
}

function getLegacyKey() {
  // Support tokens encrypted with the previous scrypt-based scheme
  return scryptSync(pass, salt, 32)
}

export function encrypt(plain: string) {
  const iv = randomBytes(12)
  const key = getKey()
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return {
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    data: encrypted.toString('base64'),
  }
}

export function decrypt(payload: { iv: string; tag: string; data: string }) {
  const iv = Buffer.from(payload.iv, 'base64')
  const tag = Buffer.from(payload.tag, 'base64')
  const data = Buffer.from(payload.data, 'base64')

  const attempt = (key: Buffer) => {
    const decipher = createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(data), decipher.final()])
  }

  try {
    return attempt(getKey()).toString('utf8')
  } catch (err) {
    try {
      return attempt(getLegacyKey()).toString('utf8')
    } catch {
      throw err
    }
  }
}

export function pack(enc: { iv: string; tag: string; data: string }) {
  return Buffer.from(JSON.stringify(enc)).toString('base64')
}

export function unpack(blob: string | null | undefined) {
  if (!blob) {
    throw new TypeError('Cannot unpack empty payload')
  }
  return JSON.parse(Buffer.from(blob, 'base64').toString('utf8')) as {
    iv: string
    tag: string
    data: string
  }
}

