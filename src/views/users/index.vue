<script setup lang="ts">
import { ref, h } from 'vue'
import {
  NButton,
  NFormItem,
  NInput,
  NModal,
  NSwitch,
  useMessage,
  useDialog,
  type DataTableColumns,
  NTag,
  type DropdownOption,
} from 'naive-ui'
import { getUsers, createUser, batchDeleteUsers, resetUserPassword, type User } from '@/api/users'
import ProTable from '@/components/common/ProTable.vue'

defineOptions({
  name: 'UserManagement',
})

const message = useMessage()
const dialog = useDialog()

// ProTable Reference
const tableRef = ref()

const handleStatusChange = async (row: User, value: boolean) => {
  // TODO: Add API for status update
  row.is_active = value
  message.success('状态更新成功 (模拟)')
}

// Columns Definition
const columns: DataTableColumns<User> = [
  { type: 'selection' },
  { title: '用户名', key: 'username', sorter: 'default' },
  { title: '昵称', key: 'nickname', ellipsis: { tooltip: true } },
  { title: '邮箱', key: 'email', ellipsis: { tooltip: true } },
  { title: '手机号', key: 'phone' },
  {
    title: '状态',
    key: 'is_active',
    width: 100,
    render(row) {
      return h(
        NSwitch,
        {
          value: row.is_active,
          // loading: !!row['loading_status' as keyof User],
          onUpdateValue: (value) => handleStatusChange(row, value), // Ensure API call here in real app
        },
        { checked: () => '启用', unchecked: () => '停用' },
      )
    },
  },
  {
    title: '超级管理员',
    key: 'is_superuser',
    render(row) {
      return row.is_superuser
        ? h(NTag, { type: 'warning', bordered: false }, { default: () => '是' })
        : '否'
    },
  },
  { title: '创建时间', key: 'created_at', width: 180, sorter: 'default' },
]

// Data Request Function for ProTable
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const loadData = async (params: any) => {
  // Params includes: page, page_size, keyword
  const res = await getUsers(params)
  return {
    data: res.data.items,
    total: res.data.total,
  }
}

// Context Menu Options
const contextMenuOptions: DropdownOption[] = [
  { label: '编辑', key: 'edit' },
  { label: '重置密码', key: 'reset_password' },
  { label: '删除', key: 'delete' },
]

const handleContextMenuSelect = (key: string | number, row: User) => {
  if (key === 'edit') {
    // Edit logic not fully implemented in previous file (no handleEdit),
    // but let's assume we want to update.
    // For now show generic message or reuse create modal as edit modal if supported.
    message.info('编辑功能开发中')
  }
  if (key === 'delete') handleDelete(row)
  if (key === 'reset_password') handleResetPassword(row)
}

// Create User
const showCreateModal = ref(false)
const createFormRef = ref()
const createModel = ref({
  username: '',
  password: '',
  email: '',
  phone: '',
  nickname: '',
  is_active: true,
  is_superuser: false,
})
const createRules = {
  username: { required: true, message: '请输入用户名', trigger: 'blur' },
  password: { required: true, message: '请输入密码', trigger: 'blur' },
  phone: { required: true, message: '请输入手机号', trigger: 'blur' },
}

const handleCreate = () => {
  createModel.value = {
    username: '',
    password: '',
    email: '',
    phone: '',
    nickname: '',
    is_active: true,
    is_superuser: false,
  }
  showCreateModal.value = true
}

const submitCreate = (e: MouseEvent) => {
  e.preventDefault()
  createFormRef.value?.validate(async (errors: unknown) => {
    if (!errors) {
      try {
        await createUser(createModel.value)
        message.success('用户创建成功')
        showCreateModal.value = false
        tableRef.value?.reload()
      } catch {
        // Error handled in request interceptor
      }
    }
  })
}

// Reset Password
const showResetPwdModal = ref(false)
const resetPwdModel = ref({ userId: '', newPassword: '' })
const resetPwdFormRef = ref()

const handleResetPassword = (row: User) => {
  resetPwdModel.value = { userId: row.id, newPassword: '' }
  showResetPwdModal.value = true
}

const submitResetPwd = (e: MouseEvent) => {
  e.preventDefault()
  resetPwdFormRef.value?.validate(async (errors: unknown) => {
    if (!errors) {
      try {
        await resetUserPassword(resetPwdModel.value.userId, resetPwdModel.value.newPassword)
        message.success('密码重置成功')
        showResetPwdModal.value = false
      } catch {
        // Error handled
      }
    }
  })
}

// Delete
const handleDelete = (row: User) => {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除用户 ${row.username} 吗?`,
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await batchDeleteUsers([row.id])
        message.success('用户已删除')
        tableRef.value?.reload()
      } catch {
        // Error handled
      }
    },
  })
}

const handleBatchDelete = (ids: Array<string | number>) => {
  dialog.warning({
    title: '批量删除',
    content: `确定要删除选中的 ${ids.length} 个用户吗?`,
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await batchDeleteUsers(ids as string[])
        message.success('批量删除成功')
        tableRef.value?.reload()
      } catch {
        // Error handled
      }
    },
  })
}
</script>

<template>
  <div class="user-management p-4">
    <ProTable
      ref="tableRef"
      title="用户列表"
      :columns="columns"
      :request="loadData"
      :row-key="(row) => row.id"
      :context-menu-options="contextMenuOptions"
      search-placeholder="搜索用户名/昵称/邮箱/手机号"
      @add="handleCreate"
      @batch-delete="handleBatchDelete"
      @context-menu-select="handleContextMenuSelect"
    >
      <!-- Removed custom search slot -->

      <!-- Custom Toolbar Buttons if needed -->
    </ProTable>

    <!-- Create Modal -->
    <n-modal v-model:show="showCreateModal" preset="dialog" title="创建用户">
      <n-form
        ref="createFormRef"
        :model="createModel"
        :rules="createRules"
        label-placement="left"
        label-width="auto"
      >
        <n-form-item label="用户名" path="username">
          <n-input v-model:value="createModel.username" />
        </n-form-item>
        <n-form-item label="密码" path="password">
          <n-input v-model:value="createModel.password" type="password" show-password-on="click" />
        </n-form-item>
        <n-form-item label="手机号" path="phone">
          <n-input v-model:value="createModel.phone" />
        </n-form-item>
        <n-form-item label="邮箱" path="email">
          <n-input v-model:value="createModel.email" />
        </n-form-item>
        <n-form-item label="昵称" path="nickname">
          <n-input v-model:value="createModel.nickname" />
        </n-form-item>
        <n-form-item label="状态" path="is_active">
          <n-switch v-model:value="createModel.is_active" />
        </n-form-item>
        <n-form-item label="超级管理员" path="is_superuser">
          <n-switch v-model:value="createModel.is_superuser" />
        </n-form-item>
      </n-form>
      <template #action>
        <n-button @click="showCreateModal = false">取消</n-button>
        <n-button type="primary" @click="submitCreate">提交</n-button>
      </template>
    </n-modal>

    <!-- Reset Password Modal -->
    <n-modal v-model:show="showResetPwdModal" preset="dialog" title="重置密码">
      <n-form
        ref="resetPwdFormRef"
        :model="resetPwdModel"
        :rules="{ newPassword: { required: true, message: '请输入新密码' } }"
      >
        <n-form-item label="新密码" path="newPassword">
          <n-input
            v-model:value="resetPwdModel.newPassword"
            type="password"
            show-password-on="click"
          />
        </n-form-item>
      </n-form>
      <template #action>
        <n-button @click="showResetPwdModal = false">取消</n-button>
        <n-button type="primary" @click="submitResetPwd">提交</n-button>
      </template>
    </n-modal>
  </div>
</template>

<style scoped>
.p-4 {
  padding: 16px;
  height: 100%;
}
</style>
