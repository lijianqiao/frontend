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
import {
  getMenus,
  createMenu,
  updateMenu,
  deleteMenu,
  batchDeleteMenus,
  getRecycleBinMenus,
  restoreMenu,
  type Menu,
} from '@/api/menus'
import { formatDateTime } from '@/utils/date'
import ProTable from '@/components/common/ProTable.vue'

defineOptions({
  name: 'MenuManagement',
})

const message = useMessage()
const dialog = useDialog()
const tableRef = ref()
const recycleBinTableRef = ref()

// Data source for TreeSelect (flattened or tree)
const menuOptions = ref<Menu[]>([])

const columns: DataTableColumns<Menu> = [
  { title: '标题', key: 'title', width: 200, fixed: 'left', ellipsis: { tooltip: true } },
  { title: '名称', key: 'name', width: 150, ellipsis: { tooltip: true } },
  { title: '类型', key: 'type', width: 80, render: (row) => row.type }, // Simplified render or keep tag. I'll keep tag logic below but inline it or simplify. Let's keep the detailed render for Type.
  // Actually, I'll rewrite the whole block to be safe.
  { title: '图标', key: 'icon', width: 150, render: (row) => row.icon || '-' },
  { title: '路径', key: 'path', width: 200, ellipsis: { tooltip: true } },
  { title: '组件', key: 'component', width: 200, ellipsis: { tooltip: true } },
  { title: '权限', key: 'permission', width: 150, ellipsis: { tooltip: true } },
  { title: '排序', key: 'sort', width: 80, sorter: 'default' },
  {
    title: '隐藏',
    key: 'is_hidden',
    width: 80,
    render(row) {
      return h(
        NTag,
        { type: row.is_hidden ? 'warning' : 'success', bordered: false },
        { default: () => (row.is_hidden ? '是' : '否') },
      )
    },
  },
  {
    title: '创建时间',
    key: 'created_at',
    width: 180,
    sorter: 'default',
    render: (row) => formatDateTime(row.created_at),
  },
]

// Load Data
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const loadData = async (params: any) => {
  // Pass all params (page, page_size, keyword) to the API
  const res = await getMenus(params)

  // Fix: API returns PaginatedResponse
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = res.data as any
  const items = data.items || []
  const total = data.total || 0

  // Update store or local state if this logic is used for TreeSelect elsewhere
  // But here we just return for the table.
  // Note: If keyword is present, the backend might return a flat list or filtered tree.
  // We assume the backend handles the structure.
  if (!params.keyword) {
    // Only update the tree select options when loading the full list (no keyword)
    // or we could just always update it if the format is compatible.
    menuOptions.value = items
  }

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
  is_hidden: false,
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
    is_hidden: false,
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
    is_hidden: row.is_hidden,
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

// Recycle Bin
const showRecycleBin = ref(false)
const handleRecycleBin = () => {
  showRecycleBin.value = true
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const recycleBinRequest = async (params: any) => {
  const res = await getRecycleBinMenus(params)
  // Recycle bin API returns PaginatedResponse
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = res.data as any
  const items = data.items || []
  return {
    data: items,
    total: data.total || 0,
  }
}

const recycleBinContextMenuOptions: DropdownOption[] = [
  { label: '恢复', key: 'restore' },
  { label: '彻底删除', key: 'delete' },
]

const handleRecycleBinContextMenuSelect = async (key: string | number, row: Menu) => {
  if (key === 'restore') {
    try {
      await restoreMenu(row.id)
      message.success('恢复成功')
      tableRef.value?.reload()
      recycleBinTableRef.value?.reload()
    } catch {
      // Error handled
    }
  }
  if (key === 'delete') {
    dialog.warning({
      title: '彻底删除',
      content: `确定要彻底删除菜单 ${row.title} 吗? 此操作无法恢复!`,
      positiveText: '确认',
      negativeText: '取消',
      onPositiveClick: async () => {
        try {
          await batchDeleteMenus([row.id], true)
          message.success('彻底删除成功')
          recycleBinTableRef.value?.reload()
        } catch {
          // Error handled
        }
      },
    })
  }
}
</script>

<template>
  <div class="menu-management p-4">
    <ProTable
      ref="tableRef"
      title="菜单列表"
      :columns="columns"
      :request="loadData"
      :row-key="(row: Menu) => row.id"
      search-placeholder="搜索标题/名称/路径/权限标识"
      default-expand-all
      :context-menu-options="contextMenuOptions"
      @add="handleCreate"
      @context-menu-select="handleContextMenuSelect"
      @recycle-bin="handleRecycleBin"
      show-add
      show-recycle-bin
      show-batch-delete
      :scroll-x="1500"
    >
      <!-- Removed custom search slot -->
    </ProTable>

    <!-- Recycle Bin Modal -->
    <n-modal
      v-model:show="showRecycleBin"
      preset="card"
      title="回收站 (已删除菜单)"
      style="width: 900px"
    >
      <ProTable
        ref="recycleBinTableRef"
        :columns="columns"
        :request="recycleBinRequest"
        :row-key="(row: Menu) => row.id"
        :search-placeholder="'搜索删除了的菜单...'"
        :context-menu-options="recycleBinContextMenuOptions"
        @context-menu-select="handleRecycleBinContextMenuSelect"
        :scroll-x="1500"
      />
    </n-modal>

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
        <n-form-item label="隐藏" path="is_hidden">
          <n-switch v-model:value="model.is_hidden" />
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
