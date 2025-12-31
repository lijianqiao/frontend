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
  NInputNumber,
  NSelect,
  NTreeSelect,
  type DropdownOption,
} from 'naive-ui'
import { getMenus, createMenu, updateMenu, deleteMenu, type Menu } from '@/api/menus'
import ProTable from '@/components/common/ProTable.vue'

defineOptions({
  name: 'MenuManagement',
})

const message = useMessage()
const dialog = useDialog()
const tableRef = ref()

// Data source for TreeSelect (flattened or tree)
const menuOptions = ref<Menu[]>([])

const columns: DataTableColumns<Menu> = [
  { title: '标题', key: 'title', width: 200, ellipsis: { tooltip: true } },
  { title: '名称', key: 'name', width: 150, ellipsis: { tooltip: true } },
  { title: '路径', key: 'path', ellipsis: { tooltip: true } },
  {
    title: '类型',
    key: 'type',
    width: 100,
    render(row) {
      const typeMap: Record<string, string> = {
        catalog: '目录',
        menu: '菜单',
        button: '按钮',
      }
      const typeColor: Record<string, 'default' | 'info' | 'success'> = {
        catalog: 'default',
        menu: 'info',
        button: 'success',
      }
      return h(
        NTag,
        { type: typeColor[row.type] || 'default', bordered: false },
        { default: () => typeMap[row.type] || row.type },
      )
    },
  },
  { title: '排序', key: 'sort', width: 80, sorter: 'default' },
  {
    title: '状态',
    key: 'is_active',
    width: 100,
    render(row) {
      return h(
        NTag,
        { type: row.is_active ? 'success' : 'error', bordered: false },
        { default: () => (row.is_active ? '启用' : '停用') },
      )
    },
  },
]

// Load Data
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const loadData = async (params: any) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { page, page_size, keyword } = params
  // API currently returns all menus (tree structure or flat), we might need to handle keyword filtering client side
  // if backend doesn't support it yet. But plan says backend will.
  const res = await getMenus({ keyword })

  // Fix: API returns PaginatedResponse
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = res.data as any
  const items = data.items || []
  const total = data.total || 0

  menuOptions.value = items // Store for TreeSelect

  return {
    data: items,
    total: total,
  }
}

// Context Menu
const contextMenuOptions: DropdownOption[] = [
  { label: '编辑', key: 'edit' },
  { label: '删除', key: 'delete' },
]

const handleContextMenuSelect = (key: string | number, row: Menu) => {
  if (key === 'edit') handleEdit(row)
  if (key === 'delete') handleDelete(row)
}

// Create/Edit
const showModal = ref(false)
const modalType = ref<'create' | 'edit'>('create')
const formRef = ref()
const model = ref({
  id: '',
  parent_id: null as string | null,
  title: '',
  name: '',
  path: '',
  component: '' as string | null,
  type: 'menu' as 'catalog' | 'menu' | 'button',
  icon: '' as string | null,
  sort: 0,
  permission: '' as string | null,
  hidden: false,
  is_active: true,
})

const rules = {
  title: { required: true, message: '请输入标题', trigger: 'blur' },
  name: { required: true, message: '请输入名称', trigger: 'blur' },
  type: { required: true, message: '请选择类型', trigger: 'blur' },
}

const handleCreate = () => {
  modalType.value = 'create'
  model.value = {
    id: '',
    parent_id: null,
    title: '',
    name: '',
    path: '',
    component: '',
    type: 'menu',
    icon: '',
    sort: 0,
    permission: '',
    hidden: false,
    is_active: true,
  }
  showModal.value = true
}

const handleEdit = (row: Menu) => {
  modalType.value = 'edit'
  model.value = {
    id: row.id,
    parent_id: row.parent_id,
    title: row.title,
    name: row.name,
    path: row.path,
    component: row.component || '',
    type: row.type,
    icon: row.icon || '',
    sort: row.sort,
    permission: row.permission || '',
    hidden: row.hidden,
    is_active: row.is_active,
  }
  showModal.value = true
}

const handleSubmit = (e: MouseEvent) => {
  e.preventDefault()
  formRef.value?.validate(async (errors: unknown) => {
    if (!errors) {
      try {
        const data = { ...model.value }
        if (data.component === '') data.component = null
        if (data.icon === '') data.icon = null
        if (data.permission === '') data.permission = null

        if (modalType.value === 'create') {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, ...createData } = data
          await createMenu(createData)
          message.success('创建成功')
        } else {
          await updateMenu(data.id, data)
          message.success('更新成功')
        }
        showModal.value = false
        tableRef.value?.reload()
      } catch {
        // Error handled
      }
    }
  })
}

const handleDelete = (row: Menu) => {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除菜单 ${row.title} 吗?`,
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteMenu(row.id)
        message.success('删除成功')
        tableRef.value?.reload()
      } catch {
        // Error handled
      }
    },
  })
}
</script>

<template>
  <div class="menu-management p-4">
    <ProTable
      ref="tableRef"
      title="菜单列表"
      :columns="columns"
      :request="loadData"
      :row-key="(row) => row.id"
      search-placeholder="搜索标题/名称/路径"
      default-expand-all
      :context-menu-options="contextMenuOptions"
      @add="handleCreate"
      @context-menu-select="handleContextMenuSelect"
    >
      <!-- Removed custom search slot -->
    </ProTable>

    <!-- Create/Edit Modal -->
    <n-modal
      v-model:show="showModal"
      preset="dialog"
      :title="modalType === 'create' ? '创建菜单' : '编辑菜单'"
      style="width: 600px"
    >
      <n-form ref="formRef" :model="model" :rules="rules" label-placement="left" label-width="100">
        <n-form-item label="上级菜单" path="parent_id">
          <n-tree-select
            v-model:value="model.parent_id"
            :options="menuOptions"
            key-field="id"
            label-field="title"
            placeholder="请选择上级菜单"
            clearable
          />
        </n-form-item>
        <n-form-item label="菜单类型" path="type">
          <n-select
            v-model:value="model.type"
            :options="[
              { label: '目录', value: 'catalog' },
              { label: '菜单', value: 'menu' },
              { label: '按钮', value: 'button' },
            ]"
          />
        </n-form-item>
        <n-form-item label="标题" path="title">
          <n-input v-model:value="model.title" />
        </n-form-item>
        <n-form-item label="名称 (Name)" path="name">
          <n-input v-model:value="model.name" placeholder="路由名称, 如: MenuManagement" />
        </n-form-item>
        <n-form-item label="路径 (Path)" path="path">
          <n-input v-model:value="model.path" placeholder="路由路径, 如: /menus" />
        </n-form-item>
        <n-form-item label="组件路径" path="component" v-if="model.type !== 'button'">
          <n-input
            v-model:value="model.component"
            placeholder="组件路径, 如: /views/menus/index.vue"
          />
        </n-form-item>
        <n-form-item label="权限标识" path="permission" v-if="model.type !== 'catalog'">
          <n-input v-model:value="model.permission" placeholder="如: sys:menu:list" />
        </n-form-item>
        <n-form-item label="排序" path="sort">
          <n-input-number v-model:value="model.sort" />
        </n-form-item>
        <n-form-item label="图标" path="icon">
          <n-input v-model:value="model.icon" />
        </n-form-item>
        <n-form-item label="状态" path="is_active">
          <n-switch v-model:value="model.is_active" />
        </n-form-item>
        <n-form-item label="隐藏" path="hidden">
          <n-switch v-model:value="model.hidden" />
        </n-form-item>
      </n-form>
      <template #action>
        <n-button @click="showModal = false">取消</n-button>
        <n-button type="primary" @click="handleSubmit">提交</n-button>
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
