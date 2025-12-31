<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { login } from '@/api/auth'
import { useUserStore } from '@/stores/user'

defineOptions({
  name: 'LoginPage',
})

const router = useRouter()
const message = useMessage()
const userStore = useUserStore()

const formRef = ref()
const model = ref({
  username: '',
  password: '',
})

const rules = {
  username: {
    required: true,
    message: '请输入用户名',
    trigger: 'blur',
  },
  password: {
    required: true,
    message: '请输入密码',
    trigger: 'blur',
  },
}

const loading = ref(false)

const handleLogin = async (e: Event) => {
  e.preventDefault()
  formRef.value?.validate(async (errors: unknown) => {
    if (!errors) {
      loading.value = true
      try {
        const res = await login(model.value)
        // Fix: Direct access to properties based on actual API response
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = res as any
        const token = data.access_token
        const refreshToken = data.refresh_token

        userStore.setToken(token)
        localStorage.setItem('refresh_token', refreshToken)

        message.success('登录成功')
        router.push('/')
      } catch (error) {
        console.error(error)
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<template>
  <div class="login-container">
    <div class="login-bg-shape shape-1"></div>
    <div class="login-bg-shape shape-2"></div>

    <div class="login-card glass-effect">
      <div class="header">
        <div class="logo-text">Admin RBAC</div>
        <p class="subtitle">让管理更简单 高效 安全</p>
      </div>

      <n-form ref="formRef" :model="model" :rules="rules" size="large" :show-label="false">
        <n-form-item path="username">
          <n-input v-model:value="model.username" placeholder="用户名" @keydown.enter.prevent>
            <template #prefix>
              <span class="icon">👤</span>
            </template>
          </n-input>
        </n-form-item>
        <n-form-item path="password">
          <n-input
            v-model:value="model.password"
            type="password"
            show-password-on="click"
            placeholder="密码"
            @keydown.enter.prevent
          >
            <template #prefix>
              <span class="icon">🔒</span>
            </template>
          </n-input>
        </n-form-item>
        <n-button
          type="primary"
          block
          :loading="loading"
          attr-type="submit"
          @click="handleLogin"
          class="login-btn"
        >
          立即登录
        </n-button>
      </n-form>

      <div class="footer">
        <span>忘记密码?</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  overflow: hidden;
}

/* Background Shapes */
.login-bg-shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  z-index: 0;
  opacity: 0.6;
}

.shape-1 {
  width: 400px;
  height: 400px;
  background: linear-gradient(to right, #6366f1, #a855f7);
  top: -100px;
  left: -100px;
  animation: float 8s ease-in-out infinite alternate;
}

.shape-2 {
  width: 350px;
  height: 350px;
  background: linear-gradient(to right, #3b82f6, #06b6d4);
  bottom: -50px;
  right: -50px;
  animation: float 10s ease-in-out infinite alternate-reverse;
}

@keyframes float {
  0% {
    transform: translateY(0) scale(1);
  }
  100% {
    transform: translateY(40px) scale(1.1);
  }
}

.login-card {
  position: relative;
  width: 380px;
  padding: 48px 40px;
  z-index: 10;
  border-radius: 24px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.login-card:hover {
  transform: translateY(-5px);
}

.glass-effect {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.header {
  text-align: center;
  margin-bottom: 40px;
}

.logo-text {
  font-size: 28px;
  font-weight: 800;
  background: linear-gradient(120deg, #6366f1, #a855f7);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 8px;
  letter-spacing: -0.5px;
}

.subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 0;
  font-weight: 500;
}

.login-btn {
  height: 44px;
  font-size: 16px;
  margin-top: 12px;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  border: none;
  transition: all 0.3s ease;
}

.login-btn:hover {
  opacity: 0.9;
  transform: shadow(0 10px 20px rgba(99, 102, 241, 0.3));
}

.icon {
  font-size: 16px;
  opacity: 0.6;
}

.footer {
  margin-top: 24px;
  text-align: center;
  font-size: 14px;
  color: #64748b;
  cursor: pointer;
}

.footer:hover {
  color: #6366f1;
}
</style>
