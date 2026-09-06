import { computed, ref } from 'vue'
import { toFiatText } from '@/utils/format'

/** 结果面板 USDT / RMB 展示切换 */
export function useFiatUnit() {
  const asCny = ref(false)
  const unit = computed(() => (asCny.value ? 'RMB' : 'USDT'))
  const toggleFiat = () => {
    asCny.value = !asCny.value
  }
  const fiat = (v: string) => toFiatText(v, asCny.value)
  return { unit, toggleFiat, fiat }
}
