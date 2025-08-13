import { ref } from 'vue'

interface ToastInstance {
  show: (message: string, duration?: number) => void
  hide: () => void
}

const toastInstance = ref<ToastInstance | null>(null)

export function useToast() {
  const showSuccessMessage = (message: string, duration?: number) => {
    if (toastInstance.value) {
      toastInstance.value.show(message, duration)
    }
  }

  const setToastInstance = (instance: ToastInstance) => {
    toastInstance.value = instance
  }

  return {
    showSuccessMessage,
    setToastInstance
  }
}
