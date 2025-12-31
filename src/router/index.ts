import { createRouter, createWebHistory } from 'vue-router'
import { createDiscreteApi } from 'naive-ui'
import { useUserStore } from '@/stores/user'

const { message, loadingBar } = createDiscreteApi(['message', 'loadingBar'])

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
      component: () => import('@/layouts/MainLayout.vue'),
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/dashboard/index.vue'),
          meta: {
            title: '仪表盘',
          },
        },
        {
          path: 'users',
          name: 'UserManagement',
          component: () => import('@/views/users/index.vue'),
          meta: {
            title: '用户管理',
            permission: 'sys:user:list',
          },
        },
        {
          path: 'roles',
          name: 'RoleManagement',
          component: () => import('@/views/roles/index.vue'),
          meta: {
            title: '角色管理',
            permission: 'sys:role:list',
          },
        },
        {
          path: 'menus',
          name: 'MenuManagement',
          component: () => import('@/views/menus/index.vue'),
          meta: {
            title: '菜单管理',
            permission: 'sys:menu:list',
          },
        },
        {
          path: 'logs/login',
          name: 'LoginLogs',
          component: () => import('@/views/logs/login/index.vue'),
          meta: {
            title: '登录日志',
            permission: 'sys:log:login:list',
          },
        },
        {
          path: 'logs/operation',
          name: 'OperationLogs',
          component: () => import('@/views/logs/operation/index.vue'),
          meta: {
            title: '操作日志',
            permission: 'sys:log:operation:list',
          },
        },
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
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/error/404.vue'),
      meta: { title: '404 Not Found' },
    },
  ],
})

router.beforeEach(async (to, from, next) => {
  loadingBar.start()
  const token = localStorage.getItem('access_token')
  const userStore = useUserStore()

  if (to.name !== 'Login' && !token) {
    message.error('请先登录')
    next({ name: 'Login' })
    return
  }

  if (token && !userStore.userInfo) {
    try {
      await userStore.fetchUserInfo()
    } catch (error) {
      console.error(error)
      // Fetch failed (e.g. invalid token), redirect to login
      userStore.logout()
      return
    }
  }

  if (to.name === 'Login' && token) {
    next({ name: 'Dashboard' })
    return
  }

  if (token && to.meta.permission) {
    const requiredPerm = to.meta.permission as string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isSuperuser = (userStore.userInfo as any)?.is_superuser
    const hasPerm =
      isSuperuser ||
      userStore.permissions.includes(requiredPerm) ||
      userStore.permissions.includes('*:*:*')
    if (!hasPerm) {
      message.warning('无权访问')
      next(false)
      loadingBar.error()
      return
    }
  }

  next()
})

router.afterEach((to) => {
  loadingBar.finish()
  if (to.meta.title) {
    document.title = `${to.meta.title as string} - Admin RBAC`
  }
})

export default router
