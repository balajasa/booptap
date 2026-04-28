import { createRouter, createWebHashHistory } from 'vue-router'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/firebase'

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void
    dataLayer: unknown[]
  }
}

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: () => import('@/layouts/DefaultLayout.vue'),
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
          path: 'calendar',
          name: 'Calendar',
          component: () => import('@/views/calendar/CalendarView.vue'),
        },
        {
          path: 'settings',
          name: 'Settings',
          component: () => import('@/views/settings/UserSettings.vue'),
        },
        {
          path: 'changelog',
          name: 'Changelog',
          component: () => import('@/views/settings/ChangelogView.vue'),
        },
        {
          path: 'account-settings',
          name: 'AccountSettings',
          component: () => import('@/views/settings/AccountSettings.vue'),
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

// 只解析一次，後續 navigation 直接用已解析的結果
const authReady = new Promise((resolve) => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    unsubscribe()
    resolve(user)
  })
})

router.beforeEach(async (to) => {
  const user = await authReady

  if (to.matched.some((r) => r.meta.requiresAuth) && !user) {
    return { name: 'Login' }
  }

  if (to.name === 'Login' && user) {
    return { name: 'Collection' }
  }
})

router.afterEach((to) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', {
      page_path: to.fullPath,
      page_title: to.name?.toString() ?? document.title,
    })
  }
})

export default router
