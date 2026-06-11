// Canvas renderer — the thin, browser-only interpreter of the layout draw
// list. Deliberately untested: vitest runs in node with no canvas; everything
// decision-shaped lives in layout.ts/data-prep.ts where it is tested.
import type { ShareCardData } from './types'
import type { DrawNode } from './layout'
import { layoutShareCard } from './layout'
import { CARD_SIZE, FONT_BODY, FONT_DISPLAY } from './theme'

// document.fonts.ready can resolve before lazily-loaded faces exist, so also
// request the specific faces the cards draw with. A failed load (offline,
// fonts not in the SW cache) falls back to the stacks' system fonts.
async function ensureFontsLoaded(): Promise<void> {
  try {
    await Promise.all([
      document.fonts.load(`600 160px ${FONT_DISPLAY}`),
      document.fonts.load(`400 36px ${FONT_BODY}`),
      document.fonts.load(`600 40px ${FONT_BODY}`),
      document.fonts.ready,
    ])
  } catch {
    // Fallback fonts are acceptable; never block card generation on fonts
  }
}

function drawNode(ctx: CanvasRenderingContext2D, node: DrawNode): void {
  switch (node.type) {
    case 'rect':
      ctx.fillStyle = node.fill
      if (node.radius) {
        ctx.beginPath()
        ctx.roundRect(node.x, node.y, node.w, node.h, node.radius)
        ctx.fill()
      } else {
        ctx.fillRect(node.x, node.y, node.w, node.h)
      }
      break
    case 'text':
      ctx.font = node.font
      ctx.fillStyle = node.fill
      ctx.textAlign = node.align
      ctx.textBaseline = 'alphabetic'
      if (node.maxWidth !== undefined) {
        ctx.fillText(node.text, node.x, node.y, node.maxWidth)
      } else {
        ctx.fillText(node.text, node.x, node.y)
      }
      break
    case 'line':
      ctx.strokeStyle = node.stroke
      ctx.lineWidth = node.width
      ctx.beginPath()
      ctx.moveTo(node.x1, node.y1)
      ctx.lineTo(node.x2, node.y2)
      ctx.stroke()
      break
  }
}

// Renders at a fixed 1080x1080 actual pixels — already retina-grade for a
// shared image, so no devicePixelRatio scaling is involved; the on-screen
// preview is just an <img> of the final PNG.
export async function renderShareCard(data: ShareCardData): Promise<HTMLCanvasElement> {
  await ensureFontsLoaded()

  const canvas = document.createElement('canvas')
  canvas.width = CARD_SIZE
  canvas.height = CARD_SIZE

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D is not supported in this browser')

  for (const node of layoutShareCard(data)) {
    drawNode(ctx, node)
  }

  return canvas
}

export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('Failed to encode the card as PNG'))
      }
    }, 'image/png')
  })
}
