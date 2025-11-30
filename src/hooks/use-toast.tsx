import { useState, useCallback } from 'react'
import { Toast } from '@/components/shared/toast'

interface ToastOptions {
  message: string
  type?: 'success' | 'error' | 'info'
  duration?: number
}

export function useToast() {
  const [toasts, setToasts] = useState<Array<ToastOptions & { id: number }>>([])

  const showToast = useCallback((options: ToastOptions) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { ...options, id }])
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const ToastContainer = (
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  )

  return { showToast, ToastContainer }
}
