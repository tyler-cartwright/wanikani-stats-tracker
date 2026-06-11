// Card brand constants. Canvas can't use Tailwind classes, so the palette is
// hardcoded here — keep in sync with the @theme tokens in src/styles/globals.css.
// Cards always render in the light "paper" brand style regardless of app dark
// mode, so the shared image looks the same wherever it's posted.

export const CARD_SIZE = 1080

export const CARD_COLORS = {
  background: '#FAF9F7', // paper-100
  surface: '#F5F3EF', // paper-200
  border: '#EDE9E0', // paper-300
  text: '#1C1917', // ink-100
  textMuted: '#6B6560', // ink-400
  accent: '#C53D2D', // vermillion-500
  positive: '#4A7C6F', // patina-500
} as const

// Crimson Pro / Inter are loaded app-wide from Google Fonts; the renderer
// waits for them, with these stacks as the offline fallback.
export const FONT_DISPLAY = '"Crimson Pro", Georgia, serif'
export const FONT_BODY = 'Inter, system-ui, sans-serif'
