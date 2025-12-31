<script setup lang="ts">
import { ref, reactive } from 'vue'
import { NInput, NFormItem, type DataTableColumns } from 'naive-ui'
import { getLoginLogs, type LoginLog } from '@/api/logs'
import ProTable from '@/components/common/ProTable.vue'

defineOptions({
  name: 'LoginLogs',
})

const tableRef = ref()
const searchParams = reactive({
  ip_address: '',
})

const columns: DataTableColumns<LoginLog> = [
  { title: 'IP地址', key: 'ip_address', width: 140 },
  { title: '省份', key: 'province', width: 80 },
  { title: '城市', key: 'city', width: 80 },
  { title: '浏览器', key: 'browser' },
  { title: '操作系统', key: 'os' },
  { title: '设备', key: 'device' },
  { title: '登录时间', key: 'login_time', width: 180 },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const loadData = async (params: any) => {
  const { page, page_size } = params
  const res = await getLoginLogs({
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
  searchParams.ip_address = ''
}
</script>

<template>
  <div class="login-logs p-4">
    <ProTable
      ref="tableRef"
      title="登录日志"
      :columns="columns"
      :request="loadData"
      :row-key="(row) => row.id"
      @reset="handleReset"
    >
      <template #search>
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
