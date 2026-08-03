import { useCallback, useRef, useState, type PointerEvent } from 'react'

const DISMISS_THRESHOLD = 80

/** Gives a bottom-sheet handle a progressive pointer drag and dismiss gesture. */
export function useBottomSheetDrag(onDismiss: () => void) {
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const startY = useRef<number | null>(null)

  const reset = useCallback(() => {
    startY.current = null
    setIsDragging(false)
    setDragOffset(0)
  }, [])

  const onPointerDown = useCallback((event: PointerEvent<HTMLElement>) => {
    startY.current = event.clientY
    setIsDragging(true)
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }, [])

  const onPointerMove = useCallback((event: PointerEvent<HTMLElement>) => {
    if (startY.current === null) return
    setDragOffset(Math.max(0, event.clientY - startY.current))
  }, [])

  const onPointerUp = useCallback((event: PointerEvent<HTMLElement>) => {
    if (startY.current === null) return
    const offset = Math.max(0, event.clientY - startY.current)
    if (offset >= DISMISS_THRESHOLD) onDismiss()
    reset()
  }, [onDismiss, reset])

  return { dragOffset, isDragging, handleProps: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: reset } }
}
