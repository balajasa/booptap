import { ref, onUnmounted } from 'vue'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/firebase'
import type { UserProfile } from '@/types/user'

export function useAuthUser() {
  const isLoggedIn = ref(false)
  const avatarURL = ref<string | null>(null)

  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      isLoggedIn.value = true
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (userDoc.exists()) {
        const data = userDoc.data() as UserProfile
        avatarURL.value = data.photoURL ?? null
      }
    } else {
      isLoggedIn.value = false
      avatarURL.value = null
    }
  })

  onUnmounted(() => unsubscribe())

  return { isLoggedIn, avatarURL }
}
