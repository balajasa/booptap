import { createRouter, createWebHashHistory } from 'vue-router'
import { auth } from '@/firebase'

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

router.beforeEach((to) => {
  if (to.name === 'Login' && auth.currentUser) {
    return { name: 'Collection' }
  }
})

export default router
