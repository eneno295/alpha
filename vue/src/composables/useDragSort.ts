import { ref } from 'vue'

/**
 * 通用拖拽排序 Composable
 * @param onUpdate 拖拽完成后的回调函数，接收新的排序数组
 */
export function useDragSort<T>(onUpdate: (items: T[]) => void) {
  // 拖拽状态
  const dragIndex = ref<number | null>(null)
  const dropIndex = ref<number | null>(null)

  // 拖拽开始
  const onDragStart = (index: number) => {
    dragIndex.value = index
  }

  // 拖拽经过
  const onDragOver = (index: number) => {
    dropIndex.value = index
  }

  // 放下
  const onDrop = (items: T[], index: number) => {
    if (dragIndex.value === null || dragIndex.value === index) return

    // 复制数组
    const newItems = [...items]

    // 移动元素
    const [draggedItem] = newItems.splice(dragIndex.value, 1)
    newItems.splice(index, 0, draggedItem)

    // 调用回调
    onUpdate(newItems)

    // 重置状态
    dragIndex.value = null
    dropIndex.value = null
  }

  // 拖拽结束
  const onDragEnd = () => {
    dragIndex.value = null
    dropIndex.value = null
  }

  return {
    dragIndex,
    dropIndex,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
  }
}

