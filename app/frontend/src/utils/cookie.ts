type Serializable = string | number | boolean | Record<string, unknown> | Array<unknown>

export type CookieOptions = {
  days?: number
  path?: string
  secure?: boolean
  sameSite?: 'Strict' | 'Lax' | 'None'
}

const hasDocument = typeof document !== 'undefined'

const toCookieString = <T extends Serializable>(value: T) => encodeURIComponent(JSON.stringify(value))

const readCookieRecord = () => {
  if (!hasDocument) return []
  return document.cookie.split(';').map((chunk) => chunk.trim()).filter(Boolean)
}

export const getCookieValue = <T = unknown>(name: string, fallback?: T): T | null => {
  if (!hasDocument) return fallback ?? null

  const cookie = readCookieRecord().find((entry) => entry.startsWith(`${name}=`))
  if (!cookie) return fallback ?? null

  const value = cookie.split('=').slice(1).join('=')
  if (!value || value === 'undefined') return fallback ?? null

  try {
    return JSON.parse(decodeURIComponent(value)) as T
  } catch (error) {
    console.error(`Failed to parse cookie ${name}`, error)
    return fallback ?? null
  }
}

export const setCookieValue = <T extends Serializable>(name: string, value: T, options: CookieOptions = {}) => {
  if (!hasDocument) return

  const { days = 30, path = '/', secure = true, sameSite = 'Lax' } = options
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()
  const cookieParts = [
    `${name}=${toCookieString(value)}`,
    `expires=${expires}`,
    `path=${path}`,
    `SameSite=${sameSite}`,
  ]

  if (secure) {
    cookieParts.push('Secure')
  }

  document.cookie = cookieParts.join('; ')
}

export const deleteCookieValue = (name: string, path = '/') => {
  if (!hasDocument) return
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`
}

export default {
  getCookieValue,
  setCookieValue,
  deleteCookieValue,
}