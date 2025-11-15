export type Role = 'admin' | 'user' | 'user_pro' | 'guest'

export const roleLabelMap: Record<Role, string> = {
  admin: 'Admin role',
  user: 'User role',
  user_pro: 'Pro workspace',
  guest: 'Guest mode',
}
