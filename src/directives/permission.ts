import { useUserStore } from '@/stores/user'
import type { Directive, DirectiveBinding } from 'vue'

export const permission: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const { value } = binding
    const userStore = useUserStore()

    if (value && value instanceof Array && value.length > 0) {
      const hasPermission = userStore.hasAnyPermission(value)
      el.style.display = hasPermission ? '' : 'none'
    } else {
      throw new Error(`need roles! Like v-permission="['sys:user:add','sys:user:edit']"`)
    }
  },
  updated(el: HTMLElement, binding: DirectiveBinding) {
    const { value } = binding
    const userStore = useUserStore()

    if (value && value instanceof Array && value.length > 0) {
      const hasPermission = userStore.hasAnyPermission(value)
      el.style.display = hasPermission ? '' : 'none'
    }
  },
}
