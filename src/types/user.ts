export interface UserProfile {
  email: string
  userID: string
  role: 'super_admin' | 'admin' | 'member' | 'user'
  status?: 'active' | 'disabled'
  createdAt: string
  lastLogin?: string
  photoURL?: string
}

export interface CurrentUser {
  uid: string
  email: string
  userID: string
  role: UserProfile['role']
  photoURL?: string
}
