import { useState, ReactNode, useEffect } from 'react'
import { Modal } from '@/components/shared/modal'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface DrilldownModalProps<T> {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  items: T[]
  renderListItem: (item: T, onClick: () => void) => ReactNode
  renderDetail: (item: T) => ReactNode
  listHeaderContent?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function DrilldownModal<T>({
  isOpen,
  onClose,
  title,
  description,
  items,
  renderListItem,
  renderDetail,
  listHeaderContent,
  size = 'lg',
}: DrilldownModalProps<T>) {
  const [selectedItem, setSelectedItem] = useState<T | null>(null)

  // Reset to list view when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Small delay to allow modal close animation to complete
      const timer = setTimeout(() => setSelectedItem(null), 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  const handleItemClick = (item: T) => {
    setSelectedItem(item)
  }

  const handleBack = () => {
    setSelectedItem(null)
  }

  const isDetailView = selectedItem !== null

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={size}>
      <div className="relative overflow-hidden">
        {/* List View */}
        <div
          className={cn(
            'transition-transform duration-300 ease-out',
            isDetailView ? '-translate-x-full' : 'translate-x-0'
          )}
        >
          <div className="p-6">
            {/* Header */}
            <div className="mb-4">
              <h3 className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100">
                {title}
              </h3>
              {description && (
                <p className="text-sm text-ink-400 dark:text-paper-300 mt-2">
                  {description}
                </p>
              )}
            </div>

            {/* Optional header content (limit selector, hints, etc.) */}
            {listHeaderContent && <div className="mb-4">{listHeaderContent}</div>}

            {/* Items list */}
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {items.map((item, index) => (
                <div key={index}>{renderListItem(item, () => handleItemClick(item))}</div>
              ))}
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="w-full mt-6 px-4 py-2 text-sm font-medium rounded-md bg-vermillion-500 hover:bg-vermillion-600 text-paper-100 dark:text-ink-100 transition-smooth focus-ring"
            >
              Close
            </button>
          </div>
        </div>

        {/* Detail View */}
        <div
          className={cn(
            'absolute inset-0 transition-transform duration-300 ease-out',
            isDetailView ? 'translate-x-0' : 'translate-x-full'
          )}
        >
          <div className="p-6 h-full overflow-y-auto">
            {selectedItem && (
              <>
                {/* Back button */}
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 mb-4 px-3 py-2 text-sm font-medium rounded-md bg-paper-300 dark:bg-ink-300 hover:bg-paper-400 dark:hover:bg-ink-400 text-ink-100 dark:text-paper-100 transition-smooth focus-ring"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to list
                </button>

                {/* Detail content */}
                {renderDetail(selectedItem)}

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="w-full mt-4 px-4 py-2 text-sm font-medium rounded-md bg-vermillion-500 hover:bg-vermillion-600 text-paper-100 dark:text-ink-100 transition-smooth focus-ring"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
