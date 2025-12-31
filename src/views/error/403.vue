<script setup lang="ts">
import { useRouter } from 'vue-router'
import { NResult, NButton } from 'naive-ui'

defineOptions({
  name: 'ForbiddenError',
})

const router = useRouter()
</script>

<template>
  <div class="error-page">
    <n-result status="403" title="403 禁止访问" description="抱歉，您没有权限访问该页面">
      <template #footer>
        <n-button type="primary" @click="router.push('/')">返回首页</n-button>
      </template>
    </n-result>
  </div>
</template>

<style scoped>
.error-page {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f8fafc;
}
</style>
