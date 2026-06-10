import { useState, useCallback } from 'react'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'

interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  // When set, the dialog shows a third action button and confirmWithSecondary
  // resolves 'secondary' when it is clicked
  secondaryText?: string
  variant?: 'danger' | 'warning' | 'info'
}

export type ConfirmResolution = 'confirm' | 'secondary' | false

export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const [resolvePromise, setResolvePromise] = useState<
    ((value: ConfirmResolution) => void) | null
  >(null)

  const confirmWithSecondary = useCallback(
    (opts: ConfirmOptions): Promise<ConfirmResolution> => {
      setOptions(opts)
      setIsOpen(true)

      return new Promise((resolve) => {
        setResolvePromise(() => resolve)
      })
    },
    []
  )

  const confirm = useCallback(
    (opts: ConfirmOptions): Promise<boolean> =>
      confirmWithSecondary(opts).then((resolution) => resolution === 'confirm'),
    [confirmWithSecondary]
  )

  const handleClose = useCallback(() => {
    setIsOpen(false)
    if (resolvePromise) {
      resolvePromise(false)
      setResolvePromise(null)
    }
  }, [resolvePromise])

  const handleConfirm = useCallback(() => {
    if (resolvePromise) {
      resolvePromise('confirm')
      setResolvePromise(null)
    }
    setIsOpen(false)
  }, [resolvePromise])

  const handleSecondary = useCallback(() => {
    if (resolvePromise) {
      resolvePromise('secondary')
      setResolvePromise(null)
    }
    setIsOpen(false)
  }, [resolvePromise])

  const ConfirmDialogComponent = options ? (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={handleClose}
      onConfirm={handleConfirm}
      onSecondary={handleSecondary}
      {...options}
    />
  ) : null

  return { confirm, confirmWithSecondary, ConfirmDialog: ConfirmDialogComponent }
}
