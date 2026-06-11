import { useEffect, useState } from 'react'
import { Download, Loader2, RefreshCw, Share2 } from 'lucide-react'
import { Modal, ModalClose } from '@/components/shared/modal'
import type { ShareCardData } from '@/lib/share-cards/types'
import { canvasToPngBlob, renderShareCard } from '@/lib/share-cards/renderer'
import { canShareFiles, shareCardBlob } from '@/lib/share-cards/share'
import { downloadBlobFile, generateShareCardFilename } from '@/lib/export/file-utils'

interface ShareCardModalProps {
  isOpen: boolean
  onClose: () => void
  data: ShareCardData | null
  title: string
}

type RenderState =
  | { status: 'rendering' }
  | { status: 'ready'; blob: Blob; url: string }
  | { status: 'error' }

export function ShareCardModal({ isOpen, onClose, data, title }: ShareCardModalProps) {
  const [render, setRender] = useState<RenderState>({ status: 'rendering' })
  const [attempt, setAttempt] = useState(0)
  const [shareFailed, setShareFailed] = useState(false)
  const supportsShare = canShareFiles()

  useEffect(() => {
    if (!isOpen || !data) return

    let stale = false
    setRender({ status: 'rendering' })
    setShareFailed(false)

    renderShareCard(data)
      .then(canvasToPngBlob)
      .then((blob) => {
        if (stale) return
        setRender({ status: 'ready', blob, url: URL.createObjectURL(blob) })
      })
      .catch((error) => {
        console.error('Failed to render share card:', error)
        if (!stale) setRender({ status: 'error' })
      })

    return () => {
      stale = true
    }
  }, [isOpen, data, attempt])

  // Revoke the preview object URL once it's replaced or the modal unmounts
  const previewUrl = render.status === 'ready' ? render.url : null
  useEffect(() => {
    if (!previewUrl) return
    return () => URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  if (!data) return null

  const filename = generateShareCardFilename(data.username, data.kind)

  // Uses the already-rendered blob synchronously — Safari only allows
  // navigator.share inside the user-gesture call chain
  const handleShare = async () => {
    if (render.status !== 'ready') return
    try {
      await shareCardBlob(render.blob, filename, title)
    } catch (error) {
      console.error('Failed to share card:', error)
      setShareFailed(true)
    }
  }

  const handleDownload = () => {
    if (render.status !== 'ready') return
    downloadBlobFile(render.blob, filename)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" labelledBy="share-card-title">
      <ModalClose onClose={onClose} />
      <div className="px-6 pb-6">
        <h3
          id="share-card-title"
          className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100 mb-4"
        >
          {title}
        </h3>

        {/* Preview */}
        <div className="aspect-square w-full rounded-lg border border-paper-300 dark:border-ink-300 overflow-hidden mb-4 bg-paper-300/30 dark:bg-ink-300/30">
          {render.status === 'rendering' && (
            <div className="w-full h-full flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-ink-400 dark:text-paper-300" />
            </div>
          )}
          {render.status === 'ready' && (
            <img src={render.url} alt={`${title} preview`} className="w-full h-full" />
          )}
          {render.status === 'error' && (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-sm text-ink-400 dark:text-paper-300">
              <span>Couldn't create the card</span>
              <button
                onClick={() => setAttempt((n) => n + 1)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md border border-paper-300 dark:border-ink-300 text-ink-100 dark:text-paper-100 hover:bg-paper-300 dark:hover:bg-ink-300 transition-smooth focus-ring"
              >
                <RefreshCw className="w-4 h-4" />
                Try again
              </button>
            </div>
          )}
        </div>

        {shareFailed && (
          <p className="text-sm text-vermillion-500 dark:text-vermillion-400 mb-4">
            Sharing didn't work — you can still download the image.
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {supportsShare && (
            <button
              onClick={handleShare}
              disabled={render.status !== 'ready'}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-vermillion-500 hover:bg-vermillion-600 text-paper-100 dark:text-ink-100 transition-smooth focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          )}
          <button
            onClick={handleDownload}
            disabled={render.status !== 'ready'}
            className={
              supportsShare
                ? 'flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md border border-paper-300 dark:border-ink-300 text-ink-100 dark:text-paper-100 hover:bg-paper-300 dark:hover:bg-ink-300 transition-smooth focus-ring disabled:opacity-50 disabled:cursor-not-allowed'
                : 'flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-vermillion-500 hover:bg-vermillion-600 text-paper-100 dark:text-ink-100 transition-smooth focus-ring disabled:opacity-50 disabled:cursor-not-allowed'
            }
          >
            <Download className="w-4 h-4" />
            Download PNG
          </button>
        </div>
      </div>
    </Modal>
  )
}
