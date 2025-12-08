import { cn } from '@/lib/utils/cn'

interface RadicalGlyphProps {
  url: string
  label?: string
  className?: string
  invert?: boolean
}

/**
 * Render WK radical images and recolor via simple CSS filters to match text color.
 * We avoid masking to prevent cross-origin SVG issues that can hide the glyph.
 */
export function RadicalGlyph({ url, label, className, invert = false }: RadicalGlyphProps) {
  const filterClass = invert ? 'invert brightness-110' : 'invert-0 brightness-100'

  return (
    <img
      src={url}
      alt={label}
      className={cn('inline-block object-contain', filterClass, className)}
      aria-label={label}
    />
  )
}
