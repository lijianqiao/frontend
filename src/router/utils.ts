import type { RouteRecordRaw } from 'vue-router'
import type { Menu } from '@/api/menus'

// Glob all views to allow dynamic import lookup
const modules = import.meta.glob('@/views/**/*.vue')

/**
 * Generate Vue Router routes from backend menu data.
 * @param menus List of menus from backend
 * @returns Array of RouteRecordRaw
 */
// Fallback mapping for menus with null component in DB
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FALLBACK_COMPONENT_MAP: Record<string, any> = {
  UserMgmt: () => import('@/views/users/index.vue'),
  RoleMgmt: () => import('@/views/roles/index.vue'),
  MenuMgmt: () => import('@/views/menus/index.vue'),
  LoginLog: () => import('@/views/logs/login/index.vue'),
  OperationLog: () => import('@/views/logs/operation/index.vue'),
  Dashboard: () => import('@/views/dashboard/index.vue'),
}

export function generateRoutes(menus: Menu[]): RouteRecordRaw[] {
  const routes: RouteRecordRaw[] = []
  // Debug modules keys once
  if (Object.keys(modules).length > 0) {
    // console.log('[Router] Available Modules:', Object.keys(modules)) // Comment out to reduce noise
  }

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
      // Ensure path starts with /src/views/ or match key in modules
      // Backend usually saves: /views/dashboard/index.vue
      // Import keys are: /src/views/dashboard/index.vue
      const key = `/src${menu.component}`
      if (modules[key]) {
        component = modules[key]
      } else {
        console.warn(`[Router] Component not found: ${key}`)
        // Fallback or leave undefined? If undefined, route is invalid.
        component = () => import('@/views/error/404.vue')
      }
    } else {
      // Fallback for missing component
      if (FALLBACK_COMPONENT_MAP[menu.name]) {
        component = FALLBACK_COMPONENT_MAP[menu.name]
        console.log(`[Router] Using fallback component for ${menu.name}`)
      } else if (menu.type === 'MENU') {
        console.warn(`[Router] Menu ${menu.name} has no component!`)
        component = () => import('@/views/error/404.vue')
      }
    }

    // Define Route
    // If it's a catalog (no valid component), we might just skip adding it as a route
    // but still process its children. However, sidebar needs it.
    // In Vue Router, nested routes need a component to render <router-view>.
    // If a menu is a folder, it might not need a route, just children.
    // BUT, we are adding these as children of MainLayout.

    const route: RouteRecordRaw = {
      path: menu.path,
      name: menu.name, // Important: Must match unique name in DB
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

    // Only add to routes if it has a component OR has children (which means it might be a parent route)
    // Actually, invalid component routes should probably not be added to Router config,
    // unless they are just grouping for Sidebar (which store logic handles).
    // For Router, only actual pages matter.
    // If a folder has no component, it technically shouldn't be a route unless it redirects.

    // Simplification: We only care about Leaf nodes (actual pages) to be added as flat routes or nested?
    // Vue Router prefers nested.

    routes.push(route)
  }

  return routes
}
