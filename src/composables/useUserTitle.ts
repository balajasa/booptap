import type { UserProfile } from '@/types/user'

const ADMIN_ROLES: UserProfile['role'][] = ['super_admin', 'admin']

export function getUserTitle(role: UserProfile['role'], checkinCount: number): string {
  if (ADMIN_ROLES.includes(role)) return '永遠的旅人'
  if (checkinCount === 0) return '初心者'
  if (checkinCount <= 99) return '旅人'
  if (checkinCount <= 299) return '探險家'
  if (checkinCount <= 499) return '浪跡者'
  if (checkinCount <= 998) return '行者'
  return '傳說旅人'
}
