import { AlertTriangle, Info } from 'lucide-react'
import { Modal } from './modal'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  const variants = {
    danger: {
      icon: AlertTriangle,
      iconColor: 'text-vermillion-500 dark:text-vermillion-400',
      bgColor: 'bg-vermillion-500/10 dark:bg-vermillion-500/20',
      borderColor: 'border-vermillion-500/20 dark:border-vermillion-500/30',
      buttonColor: 'bg-vermillion-500 hover:bg-vermillion-600 text-paper-100 dark:text-ink-100',
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-ochre',
      bgColor: 'bg-ochre/10',
      borderColor: 'border-ochre/20',
      buttonColor: 'bg-ochre hover:bg-ochre/90 text-paper-100',
    },
    info: {
      icon: Info,
      iconColor: 'text-patina-500 dark:text-patina-400',
      bgColor: 'bg-patina-500/10 dark:bg-patina-500/20',
      borderColor: 'border-patina-500/20 dark:border-patina-500/30',
      buttonColor: 'bg-patina-500 hover:bg-patina-600 text-paper-100',
    },
  }

  const config = variants[variant]
  const Icon = config.icon

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="p-6">
        {/* Icon */}
        <div
          className={`w-12 h-12 rounded-full ${config.bgColor} border ${config.borderColor} flex items-center justify-center mx-auto mb-4`}
        >
          <Icon className={`w-6 h-6 ${config.iconColor}`} />
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100 mb-2">
            {title}
          </h3>
          <p className="text-sm text-ink-400 dark:text-paper-300">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium rounded-md border border-paper-300 dark:border-ink-300 text-ink-100 dark:text-paper-100 hover:bg-paper-300 dark:hover:bg-ink-300 transition-smooth focus-ring"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-smooth focus-ring ${config.buttonColor}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}
