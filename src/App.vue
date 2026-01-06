<script setup lang="ts">
import {
  NConfigProvider,
  NMessageProvider,
  NDialogProvider,
  NNotificationProvider,
  NGlobalStyle,
  zhCN,
  dateZhCN,
} from 'naive-ui'
import GlobalAlerts from '@/components/common/GlobalAlerts.vue'
</script>

<template>
  <n-config-provider
    :locale="zhCN"
    :date-locale="dateZhCN"
    :theme-overrides="{
      common: {
        primaryColor: '#6366f1',
        primaryColorHover: '#818cf8',
        primaryColorPressed: '#4f46e5',
        borderRadius: '8px',
      },
      Button: {
        borderRadiusMedium: '8px',
        fontWeight: '500',
      },
      Card: {
        borderRadius: '12px',
      },
      Input: {
        borderRadius: '8px',
      },
    }"
  >
    <n-global-style />
    <!-- Keep providers for now, but Message/Notification might be deprecated if we replace all -->
    <n-message-provider>
      <n-dialog-provider>
        <n-notification-provider>
          <GlobalAlerts />
          <router-view />
        </n-notification-provider>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<style scoped></style>
