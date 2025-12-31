<script setup lang="ts">
import { ref, h, computed } from 'vue'
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
  NSelect,
  type DropdownOption,
} from 'naive-ui'
import {
  getUsers,
  createUser,
  updateUser,
  batchDeleteUsers,
  resetUserPassword,
  getRecycleBinUsers,
  restoreUser,
  type User,
} from '@/api/users'
import ProTable from '@/components/common/ProTable.vue'

defineOptions({
  name: 'UserManagement',
})

const message = useMessage()
const dialog = useDialog()

// ProTable Reference
// ProTable Reference
const tableRef = ref()
const recycleBinTableRef = ref()

const handleStatusChange = async (row: User, value: boolean) => {
  // TODO: Add API for status update
  row.is_active = value
  message.success('状态更新成功 (模拟)')
}

// Columns Definition
const columns: DataTableColumns<User> = [
  { type: 'selection', fixed: 'left' },
  // ID column removed as requested "except id"
  { title: '用户名', key: 'username', width: 120, fixed: 'left', sorter: 'default' },
  { title: '昵称', key: 'nickname', width: 120, ellipsis: { tooltip: true } },
  { title: '邮箱', key: 'email', width: 200, ellipsis: { tooltip: true } },
  { title: '手机号', key: 'phone', width: 150 },
  { title: '性别', key: 'gender', width: 80, render: (row) => row.gender || '-' },
  {
    title: '状态',
    key: 'is_active',
    width: 100,
    filter: true,
    filterOptionValue: null,
    filterOptions: [
      { label: '启用', value: true as unknown as string },
      { label: '停用', value: false as unknown as string },
    ],
    render(row) {
      return h(
        NSwitch,
        {
          value: row.is_active,
          onUpdateValue: (value) => handleStatusChange(row, value),
        },
        { checked: () => '启用', unchecked: () => '停用' },
      )
    },
  },
  {
    title: '超级管理员',
    key: 'is_superuser',
    width: 120,
    render(row) {
      return row.is_superuser
        ? h(NTag, { type: 'warning', bordered: false }, { default: () => '是' })
        : '否'
    },
  },
  { title: '创建时间', key: 'created_at', width: 180, sorter: 'default' },
  {
    title: '最后登录',
    key: 'last_login',
    width: 180,
    render: (row) => row.last_login || '从未登录',
  },
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
  if (key === 'edit') handleEdit(row)
  if (key === 'delete') handleDelete(row)
  if (key === 'reset_password') handleResetPassword(row)
}

// Edit User
const handleEdit = (row: User) => {
  modalType.value = 'edit'
  createModel.value = {
    id: row.id,
    username: row.username,
    password: '',
    email: row.email || '',
    phone: row.phone || '',
    nickname: row.nickname || '',
    gender: row.gender || 'unknown',
    is_active: row.is_active,
    is_superuser: row.is_superuser,
  }
  showCreateModal.value = true
}

const modalType = ref<'create' | 'edit'>('create')

// Create User
const showCreateModal = ref(false)
const createFormRef = ref()
const createModel = ref({
  id: '',
  username: '',
  password: '',
  email: '',
  phone: '',
  nickname: '',
  gender: 'unknown',
  is_active: true,
  is_superuser: false,
})
const createRules = computed(() => {
  const rules = {
    username: { required: true, message: '请输入用户名', trigger: 'blur' },
    phone: { required: true, message: '请输入手机号', trigger: 'blur' },
  }
  if (modalType.value === 'create') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(rules as any).password = { required: true, message: '请输入密码', trigger: 'blur' }
  }
  return rules
})

const handleCreate = () => {
  modalType.value = 'create'
  createModel.value = {
    id: '',
    username: '',
    password: '',
    email: '',
    phone: '',
    nickname: '',
    gender: 'unknown',
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
        if (modalType.value === 'create') {
          await createUser(createModel.value)
          message.success('用户创建成功')
        } else {
          // We need updateUser API.
          // Assuming it exists or I will add it.
          // For now, let's use a placeholder or check prompts.
          // User asked for "Edit module". I must implement it.
          // I will add `updateUser` to imports in next step.
          await updateUser(createModel.value.id, createModel.value)
          message.success('用户更新成功')
        }
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

// Delete
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

// Recycle Bin
const showRecycleBin = ref(false)
const handleRecycleBin = () => {
  showRecycleBin.value = true
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const recycleBinRequest = async (params: any) => {
  const res = await getRecycleBinUsers(params)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = res.data as any
  return {
    data: data.items,
    total: data.total,
  }
}

const recycleBinContextMenuOptions: DropdownOption[] = [
  { label: '恢复', key: 'restore' },
  { label: '彻底删除', key: 'delete' },
]

const handleRecycleBinContextMenuSelect = async (key: string | number, row: User) => {
  if (key === 'restore') {
    try {
      await restoreUser(row.id)
      message.success('恢复成功')
      tableRef.value?.reload() // Refresh main table
      recycleBinTableRef.value?.reload() // Refresh recycle bin
    } catch {
      // Error handled
    }
  }
  if (key === 'delete') {
    dialog.warning({
      title: '彻底删除',
      content: `确定要彻底删除用户 ${row.username} 吗? 此操作无法恢复!`,
      positiveText: '确认',
      negativeText: '取消',
      onPositiveClick: async () => {
        try {
          await batchDeleteUsers([row.id], true)
          message.success('彻底删除成功')
          recycleBinTableRef.value?.reload() // Refresh recycle bin
        } catch {
          // Error handled
        }
      },
    })
  }
}
//   { title: '昵称', key: 'nickname' },
//   { title: '删除时间', key: 'updated_at', render: (_) => 'N/A' }, // API doesn't seem to return deleted_at, maybe use updated_at? Or just standard fields.
//   // Actually, standard fields are fine.
//   { title: '邮箱', key: 'email' },
// ]
</script>

<template>
  <div class="user-management p-4">
    <ProTable
      ref="tableRef"
      title="用户列表"
      :columns="columns"
      :request="loadData"
      :row-key="(row: User) => row.id"
      :context-menu-options="contextMenuOptions"
      search-placeholder="搜索用户名/昵称/邮箱/手机号"
      @add="handleCreate"
      @batch-delete="handleBatchDelete"
      @context-menu-select="handleContextMenuSelect"
      @recycle-bin="handleRecycleBin"
      show-add
      show-recycle-bin
      show-batch-delete
    >
      <!-- ... -->
    </ProTable>

    <!-- Recycle Bin Modal -->
    <n-modal
      v-model:show="showRecycleBin"
      preset="card"
      title="回收站 (已删除用户)"
      style="width: 800px"
    >
      <ProTable
        ref="recycleBinTableRef"
        :columns="columns"
        :request="recycleBinRequest"
        :row-key="(row: User) => row.id"
        :search-placeholder="'搜索删除了的用户...'"
        :context-menu-options="recycleBinContextMenuOptions"
        @context-menu-select="handleRecycleBinContextMenuSelect"
      />
    </n-modal>

    <!-- Create/Edit Modal -->
    <n-modal
      v-model:show="showCreateModal"
      preset="dialog"
      :title="modalType === 'create' ? '创建用户' : '编辑用户'"
    >
      <n-form
        ref="createFormRef"
        :model="createModel"
        :rules="createRules"
        label-placement="left"
        label-width="auto"
      >
        <n-form-item label="用户名" path="username">
          <n-input v-model:value="createModel.username" :disabled="modalType === 'edit'" />
        </n-form-item>
        <n-form-item label="密码" path="password" v-if="modalType === 'create'">
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
        <n-form-item label="性别" path="gender">
          <n-select
            v-model:value="createModel.gender"
            :options="[
              { label: '男', value: 'male' },
              { label: '女', value: 'female' },
              { label: '保密', value: 'unknown' },
            ]"
          />
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
