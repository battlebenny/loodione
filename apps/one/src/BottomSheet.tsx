import { useEffect, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'

type SheetState = 'closed' | 'entering' | 'open' | 'closing'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  const prevOpen = useRef(false)
  const [state, setState] = useState<SheetState>('closed')
  const [dragOffset, setDragOffset] = useState(0)
  const touchStartY = useRef(0)
  const isDragging = useRef(false)
  const bodyLocked = useRef(false)

  useEffect(() => {
    if (open && !prevOpen.current) setState('entering')
    else if (!open && prevOpen.current && state !== 'closed') setState('closing')
    prevOpen.current = open
  }, [open])

  useEffect(() => {
    if (state !== 'entering') return
    const frame = requestAnimationFrame(() => {
      void document.body.offsetHeight
      requestAnimationFrame(() => setState('open'))
    })
    return () => cancelAnimationFrame(frame)
  }, [state])

  useEffect(() => {
    if (state !== 'closing') return
    const timer = setTimeout(() => setState('closed'), 200)
    return () => clearTimeout(timer)
  }, [state])

  useEffect(() => {
    const shouldLock = state !== 'closed'
    if (shouldLock && !bodyLocked.current) {
      document.body.style.overflow = 'hidden'
      bodyLocked.current = true
    } else if (!shouldLock && bodyLocked.current) {
      document.body.style.overflow = ''
      bodyLocked.current = false
    }
    return () => {
      if (bodyLocked.current) {
        document.body.style.overflow = ''
        bodyLocked.current = false
      }
    }
  }, [state])

  useEffect(() => {
    if (state !== 'open') return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [state, onClose])

  const handleClose = useCallback(() => {
    if (state !== 'open') return
    onClose()
  }, [state, onClose])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.currentTarget.scrollTop > 0) { isDragging.current = false; return }
    touchStartY.current = e.touches[0]!.clientY
    isDragging.current = true
    setDragOffset(0)
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return
    const delta = e.touches[0]!.clientY - touchStartY.current
    if (delta > 0) setDragOffset(delta)
    else isDragging.current = false
  }, [])

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false
    if (dragOffset > 80) onClose()
    setDragOffset(0)
  }, [dragOffset, onClose])

  if (state === 'closed') return null

  const isOpen = state === 'open'

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[200] bg-black/35 transition-opacity duration-200"
        style={{ opacity: isOpen ? 1 : 0 }}
        onClick={handleClose}
      />
      <div
        className="fixed inset-x-0 bottom-0 z-[201] mx-auto flex max-h-[82vh] w-full max-w-[480px] flex-col rounded-t-[20px] bg-white dark:bg-[var(--color-surface-glass-dark)] backdrop-blur-xl pt-3 shadow-lg"
        style={{
          transform: isOpen ? `translateY(${dragOffset}px)` : 'translateY(100%)',
          transition: dragOffset > 0 ? 'none' : 'transform 250ms ease-out',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="mx-auto mb-4 h-1 w-9 shrink-0 rounded-full bg-black/20 dark:bg-white/20" />
        <div className="mb-4 flex items-center justify-between px-5">
          <h2 className="text-xl font-bold text-black/80 dark:text-white/80" style={{ fontFamily: 'var(--font-display)' }}>{title}</h2>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-black/40 dark:text-white/40 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="overflow-y-auto px-5 pb-[calc(24px+var(--safe-area-inset-bottom))]">
            {children}
          </div>
        </div>
      </div>
    </>,
    document.body,
  )
}
