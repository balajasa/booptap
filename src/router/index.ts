import { createRouter, createWebHashHistory } from 'vue-router'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/firebase'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: () => import('@/layouts/DefaultLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: '/collection' },
        {
          path: 'herenow',
          name: 'HereNow',
          component: () => import('@/views/checkin/HereNow.vue'),
        },
        {
          path: 'collection',
          name: 'Collection',
          component: () => import('@/views/checkin/PhotoCollection.vue'),
        },
        {
          path: 'settings',
          name: 'Settings',
          component: () => import('@/views/settings/UserSettings.vue'),
        },
      ],
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/auth/LoginView.vue'),
    },
    { path: '/:pathMatch(.*)*', redirect: '/collection' },
  ],
})

function getCurrentUser() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      resolve(user)
    })
  })
}

router.beforeEach(async (to) => {
  const user = await getCurrentUser()

  if (to.matched.some((r) => r.meta.requiresAuth) && !user) {
    return { name: 'Login' }
  }

  if (to.name === 'Login' && user) {
    return { name: 'Collection' }
  }
})

export default router
