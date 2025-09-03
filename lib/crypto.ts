import {
  randomBytes,
  createCipheriv,
  createDecipheriv,
  pbkdf2Sync,
} from 'crypto'

const pass = process.env.ENCRYPTION_PASS || 'change-me'
const salt = 'fb-messenger-salt'

function getKey() {
  return pbkdf2Sync(pass, salt, 100_000, 32, 'sha256')
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
  const key = getKey()
  const iv = Buffer.from(payload.iv, 'base64')
  const tag = Buffer.from(payload.tag, 'base64')
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.data, 'base64')),
    decipher.final(),
  ])
  return decrypted.toString('utf8')
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

