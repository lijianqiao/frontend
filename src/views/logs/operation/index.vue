<script setup lang="ts">
import { ref, reactive, h } from 'vue'
import { NInput, NFormItem, type DataTableColumns, NTag } from 'naive-ui'
import { getOperationLogs, type OperationLog } from '@/api/logs'
import ProTable from '@/components/common/ProTable.vue'

defineOptions({
  name: 'OperationLogs',
})

const tableRef = ref()
const searchParams = reactive({
  username: '',
  module: '',
  ip_address: '',
})

const columns: DataTableColumns<OperationLog> = [
  { title: '操作人', key: 'username', width: 100 },
  { title: '模块', key: 'module', width: 120 },
  { title: '内容', key: 'summary' },
  {
    title: '方法',
    key: 'method',
    width: 80,
    render(row) {
      return h(NTag, { type: 'info', size: 'small' }, { default: () => row.method })
    },
  },
  { title: '路径', key: 'path' },
  {
    title: '状态码',
    key: 'status_code',
    width: 80,
    render(row) {
      return h(
        NTag,
        { type: row.status_code < 400 ? 'success' : 'error', size: 'small' },
        { default: () => row.status_code },
      )
    },
  },
  { title: 'IP地址', key: 'ip_address', width: 130 },
  { title: '耗时(ms)', key: 'latency', width: 90 },
  { title: '操作时间', key: 'created_at', width: 180 },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const loadData = async (params: any) => {
  const { page, page_size } = params
  const res = await getOperationLogs({
    page,
    page_size,
    ...searchParams,
  })
  return {
    data: res.data.items,
    total: res.data.total,
  }
}

const handleReset = () => {
  searchParams.username = ''
  searchParams.module = ''
  searchParams.ip_address = ''
}
</script>

<template>
  <div class="operation-logs p-4">
    <ProTable
      ref="tableRef"
      title="操作日志"
      :columns="columns"
      :request="loadData"
      :row-key="(row) => row.id"
      @reset="handleReset"
    >
      <template #search>
        <n-form-item label="操作人">
          <n-input v-model:value="searchParams.username" placeholder="请输入操作人" clearable />
        </n-form-item>
        <n-form-item label="模块">
          <n-input v-model:value="searchParams.module" placeholder="请输入模块" clearable />
        </n-form-item>
        <n-form-item label="IP地址">
          <n-input v-model:value="searchParams.ip_address" placeholder="请输入IP地址" clearable />
        </n-form-item>
      </template>
    </ProTable>
  </div>
</template>

<style scoped>
.p-4 {
  padding: 16px;
}
</style>
