import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

export function formatDateTime(date: string | null | undefined, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) return 'N/A'
  return dayjs(date).tz('Asia/Shanghai').format(format)
}
