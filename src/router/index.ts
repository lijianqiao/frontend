import { createRouter, createWebHistory } from 'vue-router'
import { createDiscreteApi } from 'naive-ui'
import { $alert } from '@/utils/alert' // Use Global Alert
import { useUserStore } from '@/stores/user'

const { loadingBar } = createDiscreteApi(['loadingBar'])

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/login/index.vue'),
      meta: { title: '登录' },
    },
    {
      path: '/',
      name: 'MainLayout',
      component: () => import('@/layouts/MainLayout.vue'),
      children: [
        // Static routes removed. Dynamic routes will be added here.
      ],
    },
    {
      path: '/403',
      name: 'Forbidden',
      component: () => import('@/views/error/403.vue'),
      meta: { title: '403 Forbidden' },
    },
    {
      path: '/500',
      name: 'ServerError',
      component: () => import('@/views/error/500.vue'),
      meta: { title: '500 Server Error' },
    },
  ],
})

router.beforeEach(async (to, from, next) => {
  loadingBar.start()
  let token = localStorage.getItem('access_token')
  const userStore = useUserStore()

  // Startup Token Check: Access Token missing but Refresh Token exists?
  if (!token && localStorage.getItem('refresh_token')) {
    const refreshed = await userStore.initialTokenRefresh()
    if (refreshed) {
      token = localStorage.getItem('access_token')
    }
  }

  if (to.name !== 'Login' && !token) {
    $alert.error('请先登录')
    next({ name: 'Login' })
    return
  }

  if (token && !userStore.userInfo) {
    try {
      await userStore.fetchUserInfo()
    } catch (error) {
      console.error(error)
      userStore.logout()
      return
    }
  }

  // Dynamic Routing Logic
  if (token && !userStore.isRoutesLoaded) {
    try {
      const { routes } = await userStore.fetchUserMenus()

      // Add dynamic routes as children of MainLayout
      // Add dynamic routes as children of MainLayout
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      routes.forEach((route: any) => {
        router.addRoute('MainLayout', route)
      })

      // Also add 404 route at the end
      router.addRoute({
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () => import('@/views/error/404.vue'),
        meta: { title: '404 Not Found' },
      })

      // Hack to ensure addRoute takes effect
      next({ ...to, replace: true })
      return
    } catch (error) {
      console.error('Failed to generate dynamic routes', error)
      userStore.logout()
      return
    }
  }

  if (to.name === 'Login' && token) {
    next({ path: '/dashboard' })
    return
  }

  if (token && to.path === '/') {
    next({ path: '/dashboard' })
    return
  }

  if (token && to.meta.permission) {
    const requiredPerm = to.meta.permission as string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isSuperuser = (userStore.userInfo as any)?.is_superuser

    // Check perm
    const hasPerm =
      isSuperuser ||
      userStore.permissions.includes(requiredPerm) ||
      userStore.permissions.includes('*:*:*') ||
      userStore.hasMenu(to.name as string) // Optional double check

    if (!hasPerm) {
      $alert.warning('无权访问')
      next({ name: 'Forbidden' }) // Ensure Forbidden route exists or redirect to 404?
      // Since we don't have a Forbidden page in static routes map above (only 404/500/Login/Main),
      // we might want to redirect to 404 or add a Forbidden page.
      // For now, let's just abort or use 404.
      // But wait, the previous code redirected to 'Forbidden'?
      // Checking old code... it did next({ name: 'Forbidden' }).
      // I don't see 'Forbidden' defined in the old static routes!
      // Maybe it was handled by NotFound? Or it was broken?
      // I will assume NotFound for now or just return false.
      // Actually, let's keep it consistent. If 'Forbidden' is not defined, router will warn.
      loadingBar.error()
      return
    }
  }

  next()
})

router.afterEach((to) => {
  loadingBar.finish()
  if (to.meta.title) {
    const title = import.meta.env.VITE_SITE_TITLE || 'Admin RBAC'
    document.title = `${to.meta.title as string} - ${title}`
  }
})

export default router
