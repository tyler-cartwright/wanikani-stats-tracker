import { useEffect } from 'react'

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title
      ? `${title} | WaniTrack`
      : 'WaniTrack — WaniKani Statistics Dashboard'
  }, [title])
}
