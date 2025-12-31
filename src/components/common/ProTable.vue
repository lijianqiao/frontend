<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import {
  NDataTable,
  NCard,
  NSpace,
  NButton,
  NInput,
  NIcon,
  NDropdown,
  type DataTableColumns,
  type PaginationProps,
  type DropdownOption,
} from 'naive-ui'
import {
  SearchOutline as SearchIcon,
  RefreshOutline as RefreshIcon,
  AddOutline as AddIcon,
  TrashOutline as TrashIcon,
  DownloadOutline as DownloadIcon,
} from '@vicons/ionicons5'

// Define props with defaults
const props = withDefaults(
  defineProps<{
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    columns: DataTableColumns<any>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    request: (params: any) => Promise<{ data: any[]; total: number }>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rowKey?: (row: any) => string | number
    title?: string
    loading?: boolean
    searchPlaceholder?: string
    contextMenuOptions?: DropdownOption[]
    scrollX?: number
    showAdd?: boolean
    showRecycleBin?: boolean
    showBatchDelete?: boolean
  }>(),
  {
    scrollX: 1000,
    title: '',
    searchPlaceholder: '请输入关键字搜索...',
    loading: false,
    contextMenuOptions: () => [],
    showAdd: false,
    showRecycleBin: false,
    showBatchDelete: false,
  },
)

const emit = defineEmits<{
  (e: 'update:checked-row-keys', keys: Array<string | number>): void
  (e: 'add'): void
  (e: 'batch-delete', keys: Array<string | number>): void
  (e: 'reset'): void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (e: 'context-menu-select', key: string | number, row: any): void
  (e: 'recycle-bin'): void
}>()

// State
const tableLoading = ref(false)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data = ref<any[]>([])
const checkedRowKeys = ref<Array<string | number>>([])
const keyword = ref('')

const pagination = reactive<PaginationProps>({
  page: 1,
  pageSize: 10,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  itemCount: 0,
  prefix: ({ itemCount }) => `共 ${itemCount} 条`,
  onChange: (page: number) => {
    pagination.page = page
    handleSearch()
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize
    pagination.page = 1
    handleSearch()
  },
})

// Filters State
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const filters = ref<Record<string, any>>({})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleFiltersChange = (newFilters: Record<string, any>) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formattedFilters: Record<string, any> = {}
  Object.keys(newFilters).forEach((key) => {
    const val = newFilters[key]
    if (Array.isArray(val)) {
      if (val.length > 0) formattedFilters[key] = val[0]
    } else if (val !== null && val !== undefined) {
      formattedFilters[key] = val
    }
  })

  filters.value = formattedFilters
  pagination.page = 1
  handleSearch()
}

// Context Menu State
const showDropdown = ref(false)
const uniqueDropdownX = ref(0)
const uniqueDropdownY = ref(0)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const currentRow = ref<any>(null)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rowProps = (row: any) => {
  return {
    onContextmenu: (e: MouseEvent) => {
      if (!props.contextMenuOptions || props.contextMenuOptions.length === 0) return
      e.preventDefault()
      showDropdown.value = false
      nextTick().then(() => {
        showDropdown.value = true
        uniqueDropdownX.value = e.clientX
        uniqueDropdownY.value = e.clientY
        currentRow.value = row
      })
    },
  }
}

const handleContextMenuSelect = (key: string | number) => {
  showDropdown.value = false
  emit('context-menu-select', key, currentRow.value)
}

const clickOutside = () => {
  showDropdown.value = false
}

// API Request
const handleSearch = async () => {
  tableLoading.value = true
  try {
    const res = await props.request({
      page: pagination.page,
      page_size: pagination.pageSize,
      keyword: keyword.value,
      ...filters.value,
    })

    data.value = res.data
    pagination.itemCount = res.total
  } catch (error) {
    console.error('ProTable Request Error:', error)
  } finally {
    tableLoading.value = false
  }
}

const handleRefresh = () => {
  handleSearch()
}

const handleSearchClick = () => {
  pagination.page = 1
  handleSearch()
}

const handleResetClick = () => {
  keyword.value = ''
  emit('reset')
  pagination.page = 1
  handleSearch()
}

const handleCheck = (keys: Array<string | number>) => {
  checkedRowKeys.value = keys
  emit('update:checked-row-keys', keys)
}

// Export CSV
const handleExport = () => {
  if (!data.value || data.value.length === 0) return

  const headers = props.columns
    .filter((col) => col.type !== 'selection' && col.type !== 'expand' && col.key !== 'actions')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((col: any) => col.title || col.key)

  const keys = props.columns
    .filter((col) => col.type !== 'selection' && col.type !== 'expand' && col.key !== 'actions')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((col: any) => col.key)

  const csvContent = [
    headers.join(','),
    ...data.value.map((row) =>
      keys
        .map((key) => {
          const val = row[key]
          return val === null || val === undefined ? '' : `"${val}"`
        })
        .join(','),
    ),
  ].join('\n')

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${props.title || 'data'}_export.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Expose methods to parent
defineExpose({
  reload: handleSearch,
  reset: handleResetClick,
})

onMounted(() => {
  handleSearch()
})
</script>

<template>
  <div class="pro-table" @click="clickOutside">
    <!-- Search Form Area -->
    <n-card class="search-card" :bordered="false" size="small">
      <div class="search-bar">
        <n-input
          v-model:value="keyword"
          :placeholder="searchPlaceholder || '请输入关键字搜索...'"
          @keydown.enter.prevent="handleSearchClick"
          class="search-input"
          clearable
        >
          <template #prefix>
            <n-icon><SearchIcon /></n-icon>
          </template>
        </n-input>
        <n-space>
          <n-button type="primary" @click="handleSearchClick">搜索</n-button>
          <n-button @click="handleResetClick">重置</n-button>
        </n-space>

        <div style="margin-left: auto">
          <n-button v-if="showRecycleBin" type="warning" ghost @click="$emit('recycle-bin')">
            <template #icon>
              <n-icon><TrashIcon /></n-icon>
            </template>
            回收站
          </n-button>
        </div>
      </div>
      <!-- Backward compatibility for custom search slot if needed -->
      <div v-if="$slots.search" style="margin-top: 12px">
        <slot name="search"></slot>
      </div>
    </n-card>

    <!-- Toolbar & Table Area -->
    <n-card class="table-card" :bordered="false" size="small">
      <!-- Toolbar -->
      <div class="toolbar">
        <div class="title">{{ title }}</div>
        <n-space>
          <slot name="toolbar-left">
            <n-button
              v-if="checkedRowKeys.length > 0 && showBatchDelete"
              type="error"
              @click="$emit('batch-delete', checkedRowKeys)"
            >
              <template #icon>
                <n-icon><TrashIcon /></n-icon>
              </template>
              批量删除
            </n-button>
          </slot>

          <!-- Create Button (Moved here, before Export) -->
          <n-button v-if="showAdd" type="primary" @click="$emit('add')">
            <template #icon>
              <n-icon><AddIcon /></n-icon>
            </template>
            新建
          </n-button>

          <n-button secondary @click="handleExport" title="导出 CSV">
            <template #icon>
              <n-icon><DownloadIcon /></n-icon>
            </template>
          </n-button>

          <n-button circle secondary @click="handleRefresh" title="刷新">
            <template #icon>
              <n-icon><RefreshIcon /></n-icon>
            </template>
          </n-button>
        </n-space>
      </div>

      <!-- Main Table -->
      <n-data-table
        :remote="true"
        :loading="loading || tableLoading"
        :columns="columns"
        :data="data"
        :pagination="pagination"
        :row-key="rowKey"
        :row-props="rowProps"
        @update:checked-row-keys="handleCheck"
        @update:filters="handleFiltersChange"
        :scroll-x="scrollX"
        flex-height
        style="height: 600px"
      />

      <!-- Context Menu -->
      <n-dropdown
        placement="bottom-start"
        trigger="manual"
        :x="uniqueDropdownX"
        :y="uniqueDropdownY"
        :options="contextMenuOptions"
        :show="showDropdown"
        :on-clickoutside="clickOutside"
        @select="handleContextMenuSelect"
      />
    </n-card>
  </div>
</template>

<style scoped>
.pro-table {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}

.search-card {
  border-radius: 8px;
}

.search-bar {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-input {
  width: 300px;
}

.table-card {
  border-radius: 8px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* Fix table height for flex-height */
:deep(.n-card__content) {
  display: flex;
  flex-direction: column;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.title {
  font-size: 16px;
  font-weight: 500;
}
</style>
