import type { RouteRecordRaw } from 'vue-router'
import type { Menu } from '@/api/menus'

// Glob all views to allow dynamic import lookup
const modules = import.meta.glob('@/views/**/*.vue')

/**
 * Generate Vue Router routes from backend menu data.
 * @param menus List of menus from backend
 * @returns Array of RouteRecordRaw
 */

export function generateRoutes(menus: Menu[]): RouteRecordRaw[] {
  const routes: RouteRecordRaw[] = []

  for (const menu of menus) {
    // Skip if type is permission or if no component (unless handled otherwise)
    if (menu.type === 'PERMISSION') continue

    // Resolve Component
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let component: any

    if (menu.component?.toUpperCase() === 'LAYOUT') {
      // Map 'Layout' to a passthrough component so children can render
      component = () => import('@/layouts/RouterView.vue')
    } else if (menu.component) {
      const key = `/src${menu.component}`
      if (modules[key]) {
        component = modules[key]
      } else {
        component = () => import('@/views/error/404.vue')
      }
    } else {
      if (menu.type === 'MENU') {
        component = () => import('@/views/error/404.vue')
      }
    }

    const route: RouteRecordRaw = {
      path: menu.path,
      name: menu.name, // 重要提示：必须与数据库中的唯一名称匹配
      component: component,
      meta: {
        title: menu.title,
        icon: menu.icon,
        is_hidden: menu.is_hidden,
        permission: menu.permission,
        sort: menu.sort,
      },
      children: [],
    }

    if (menu.children && menu.children.length > 0) {
      route.children = generateRoutes(menu.children)
    }
    routes.push(route)
  }

  return routes
}
