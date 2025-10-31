import { ref } from 'vue'

/**
 * 通用拖拽排序 Composable（支持鼠标和触摸事件）
 * @param onUpdate 拖拽完成后的回调函数，接收新的排序数组
 */
export function useDragSort<T>(onUpdate: (items: T[]) => void) {
  // 拖拽状态
  const dragIndex = ref<number | null>(null)
  const dropIndex = ref<number | null>(null)
  const touchStartY = ref<number | null>(null)

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
    touchStartY.value = null
  }

  // 拖拽结束
  const onDragEnd = () => {
    dragIndex.value = null
    dropIndex.value = null
    touchStartY.value = null
  }

  // 触摸开始
  const onTouchStart = (index: number, event: TouchEvent) => {
    event.preventDefault()
    dragIndex.value = index
    touchStartY.value = event.touches[0].clientY
  }

  // 触摸移动（仅更新 dropIndex，不立即触发 drop）
  const onTouchMove = (event: TouchEvent, getElementIndex: (element: Element) => number) => {
    if (dragIndex.value === null) return

    event.preventDefault()
    const touch = event.touches[0]

    // 获取触摸位置下的元素
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY)
    if (!elementBelow) return

    // 查找对应的卡片元素
    let cardElement: Element | null = elementBelow
    while (cardElement && !cardElement.classList.contains('task-card') && cardElement.parentElement) {
      cardElement = cardElement.parentElement
    }

    if (cardElement && cardElement.classList.contains('task-card')) {
      const targetIndex = getElementIndex(cardElement)
      if (targetIndex !== -1) {
        dropIndex.value = targetIndex
      }
    }
  }

  // 触摸结束（触发 drop）
  const onTouchEnd = (items: T[]) => {
    if (dragIndex.value !== null && dropIndex.value !== null && dragIndex.value !== dropIndex.value) {
      onDrop(items, dropIndex.value)
    } else {
      // 如果没有移动到新位置，只重置状态
      dragIndex.value = null
      dropIndex.value = null
      touchStartY.value = null
    }
  }

  return {
    dragIndex,
    dropIndex,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  }
}

