<script setup lang="ts">
import { h, ref, computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { NIcon, type MenuOption, NBreadcrumb, NBreadcrumbItem, NDropdown } from 'naive-ui'
import {
  BookOutline as BookIcon,
  PersonOutline as PersonIcon,
  WineOutline as WineIcon,
  MenuOutline as MenuIcon,
  LogOutOutline as LogoutIcon,
  PersonCircleOutline as UserIcon,
} from '@vicons/ionicons5'
import { useUserStore } from '@/stores/user'

defineOptions({
  name: 'MainLayout',
})

const userStore = useUserStore()
const route = useRoute()

function renderIcon(icon: unknown) {
  return () => h(NIcon, null, { default: () => h(icon as object) })
}

const menuOptions: MenuOption[] = [
  {
    label: () =>
      h(
        RouterLink,
        {
          to: {
            name: 'Dashboard',
          },
        },
        { default: () => '仪表盘' },
      ),
    key: 'dashboard',
    icon: renderIcon(BookIcon),
  },
  {
    label: () =>
      h(
        RouterLink,
        {
          to: {
            name: 'UserManagement',
          },
        },
        { default: () => '用户管理' },
      ),
    key: 'users',
    icon: renderIcon(PersonIcon),
  },
  {
    label: () =>
      h(
        RouterLink,
        {
          to: {
            name: 'RoleManagement',
          },
        },
        { default: () => '角色管理' },
      ),
    key: 'roles',
    icon: renderIcon(WineIcon),
  },
  {
    label: () =>
      h(
        RouterLink,
        {
          to: {
            name: 'MenuManagement',
          },
        },
        { default: () => '菜单管理' },
      ),
    key: 'menus',
    icon: renderIcon(MenuIcon),
  },
]

const collapsed = ref(false)

const handleLogout = () => {
  userStore.logout()
}

const userDropdownOptions = [
  {
    label: '退出登录',
    key: 'logout',
    icon: renderIcon(LogoutIcon),
  },
]

const handleUserDropdownSelect = (key: string) => {
  if (key === 'logout') {
    handleLogout()
  }
}

const activeKey = computed(() => {
  // Map route name to menu key
  if (route.name === 'UserManagement') return 'users'
  if (route.name === 'RoleManagement') return 'roles'
  if (route.name === 'MenuManagement') return 'menus'
  return 'dashboard'
})

const breadcrumbs = computed(() => {
  return route.matched.filter((r) => r.meta && r.meta.title).map((r) => r.meta.title as string)
})
</script>

<template>
  <n-layout has-sider position="absolute">
    <n-layout-sider
      bordered
      collapse-mode="width"
      :collapsed-width="64"
      :width="240"
      :collapsed="collapsed"
      show-trigger
      @collapse="collapsed = true"
      @expand="collapsed = false"
      class="sidebar"
    >
      <div class="logo">
        <div class="logo-icon">A</div>
        <span v-if="!collapsed" class="logo-title">Admin RBAC</span>
      </div>
      <n-menu
        :collapsed="collapsed"
        :collapsed-width="64"
        :collapsed-icon-size="22"
        :options="menuOptions"
        :value="activeKey"
      />
    </n-layout-sider>

    <n-layout class="main-content">
      <n-layout-header bordered class="header">
        <div class="header-left">
          <n-breadcrumb>
            <n-breadcrumb-item>首页</n-breadcrumb-item>
            <n-breadcrumb-item v-for="item in breadcrumbs" :key="item">
              {{ item }}
            </n-breadcrumb-item>
          </n-breadcrumb>
        </div>

        <div class="header-right">
          <n-dropdown :options="userDropdownOptions" @select="handleUserDropdownSelect">
            <div class="user-profile">
              <n-icon size="20" :component="UserIcon" />
              <span class="username">管理员</span>
            </div>
          </n-dropdown>
        </div>
      </n-layout-header>

      <n-layout-content
        content-style="padding: 24px; min-height: calc(100vh - 64px); background-color: #f8fafc;"
      >
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>

<style scoped>
.sidebar {
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
  z-index: 10;
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-bottom: 1px solid #eee;
  overflow: hidden;
  gap: 12px;
}

.logo-icon {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  color: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
  flex-shrink: 0;
}

.logo-title {
  font-size: 18px;
  font-weight: 700;
  color: #333;
  white-space: nowrap;
}

.header {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.user-profile:hover {
  background-color: #f1f5f9;
}

.username {
  font-size: 14px;
  font-weight: 500;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
