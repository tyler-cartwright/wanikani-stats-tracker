import { KanjiGrid } from '@/components/kanji-grid/kanji-grid'
import { useDocumentTitle } from '@/hooks/use-document-title'

export function Kanji() {
  useDocumentTitle('Kanji')
  return <KanjiGrid />
}
