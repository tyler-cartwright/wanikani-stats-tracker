import { useState, useCallback } from 'react'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'

interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null)

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts)
    setIsOpen(true)

    return new Promise((resolve) => {
      setResolvePromise(() => resolve)
    })
  }, [])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    if (resolvePromise) {
      resolvePromise(false)
      setResolvePromise(null)
    }
  }, [resolvePromise])

  const handleConfirm = useCallback(() => {
    if (resolvePromise) {
      resolvePromise(true)
      setResolvePromise(null)
    }
    setIsOpen(false)
  }, [resolvePromise])

  const ConfirmDialogComponent = options ? (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={handleClose}
      onConfirm={handleConfirm}
      {...options}
    />
  ) : null

  return { confirm, ConfirmDialog: ConfirmDialogComponent }
}
