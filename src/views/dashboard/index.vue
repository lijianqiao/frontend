<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NGrid, NGi, NCard, NStatistic, NIcon, NSpace, NTag } from 'naive-ui'
import {
  PersonOutline as UserIcon,
  PeopleOutline as RoleIcon,
  ListOutline as MenuIcon,
  LogInOutline as LoginIcon,
} from '@vicons/ionicons5'
import { getDashboardStats, type DashboardStats } from '@/api/dashboard'

defineOptions({
  name: 'DashboardPage',
})

const stats = ref<DashboardStats>({
  total_users: 0,
  active_users: 0,
  total_roles: 0,
  total_menus: 0,
  today_login_count: 0,
  today_operation_count: 0,
  login_trend: [],
  recent_logins: [],
})

const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const res = await getDashboardStats()
    // Type assertion or check if needed, request.ts handles structure
    if (res.data) {
      stats.value = res.data
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="dashboard">
    <n-grid :x-gap="16" :y-gap="16" cols="1 s:2 m:4" responsive="screen">
      <n-gi>
        <n-card hoverable class="stat-card">
          <n-statistic label="总用户数" :value="stats.total_users">
            <template #prefix>
              <n-icon color="#6366f1">
                <UserIcon />
              </n-icon>
            </template>
            <template #suffix>
              <span class="sub-text">active: {{ stats.active_users }}</span>
            </template>
          </n-statistic>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card hoverable class="stat-card">
          <n-statistic label="总角色数" :value="stats.total_roles">
            <template #prefix>
              <n-icon color="#a855f7">
                <RoleIcon />
              </n-icon>
            </template>
          </n-statistic>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card hoverable class="stat-card">
          <n-statistic label="总菜单数" :value="stats.total_menus">
            <template #prefix>
              <n-icon color="#ec4899">
                <MenuIcon />
              </n-icon>
            </template>
          </n-statistic>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card hoverable class="stat-card">
          <n-statistic label="今日登录" :value="stats.today_login_count">
            <template #prefix>
              <n-icon color="#10b981">
                <LoginIcon />
              </n-icon>
            </template>
          </n-statistic>
        </n-card>
      </n-gi>
    </n-grid>

    <n-grid :x-gap="16" :y-gap="16" cols="1" style="margin-top: 16px">
      <n-gi>
        <n-card title="最近登录日志" hoverable>
          <!-- Simple Table or List for Recent Logins -->
          <n-space vertical>
            <div v-for="log in stats.recent_logins" :key="log.id" class="log-item">
              <n-space justify="space-between" align="center">
                <n-space align="center">
                  <n-tag :type="log.status ? 'success' : 'error'" size="small">
                    {{ log.status ? '成功' : '失败' }}
                  </n-tag>
                  <span class="username">{{ log.username }}</span>
                  <span class="ip">{{ log.ip }}</span>
                </n-space>
                <span class="time">{{ new Date(log.created_at).toLocaleString() }}</span>
              </n-space>
            </div>
            <div v-if="stats.recent_logins.length === 0" style="text-align: center; color: #999">
              暂无数据
            </div>
          </n-space>
        </n-card>
      </n-gi>
    </n-grid>
  </div>
</template>

<style scoped>
.dashboard {
  padding: 0;
}
.stat-card {
  border-radius: 12px;
}
.sub-text {
  font-size: 12px;
  color: #9ca3af;
  margin-left: 8px;
}
.log-item {
  padding: 12px;
  border-bottom: 1px solid #f3f4f6;
  transition: background-color 0.2s;
}
.log-item:hover {
  background-color: #f9fafb;
}
.log-item:last-child {
  border-bottom: none;
}
.username {
  font-weight: 500;
}
.ip {
  color: #6b7280;
  font-size: 13px;
}
.time {
  color: #9ca3af;
  font-size: 13px;
}
</style>
