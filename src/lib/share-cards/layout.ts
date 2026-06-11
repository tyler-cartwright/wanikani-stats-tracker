// Pure layout: ShareCardData -> a flat list of draw nodes. The canvas renderer
// is a dumb interpreter of this list, so every visual decision lives here
// where it can be tested in node. Fixed 1080x1080 layout, no text measurement
// — labels are truncated by character count instead.
import { format } from 'date-fns'
import { parseLocalDate } from '@/lib/calculations/activity-capture'
import type { ShareCardData, YearInReviewCardData } from './types'
import { CARD_COLORS, CARD_SIZE, FONT_BODY, FONT_DISPLAY } from './theme'

export type DrawNode =
  | { type: 'rect'; x: number; y: number; w: number; h: number; fill: string; radius?: number }
  | {
      type: 'text'
      x: number
      y: number
      text: string
      font: string
      fill: string
      align: 'left' | 'center' | 'right'
      maxWidth?: number
    }
  | { type: 'line'; x1: number; y1: number; x2: number; y2: number; stroke: string; width: number }

const MARGIN = 72
const CENTER = CARD_SIZE / 2
const CONTENT_RIGHT = CARD_SIZE - MARGIN
const CONTENT_WIDTH = CARD_SIZE - MARGIN * 2

const ICON_GLYPHS = { flame: '🔥', star: '⭐', trophy: '🏆' } as const

function display(size: number, weight = 600): string {
  return `${weight} ${size}px ${FONT_DISPLAY}`
}

function body(size: number, weight = 400): string {
  return `${weight} ${size}px ${FONT_BODY}`
}

export function truncateLabel(text: string, max: number): string {
  if (text.length <= max) return text
  return `${text.slice(0, max - 1).trimEnd()}…`
}

function formatIsoDate(iso: string): string {
  return format(new Date(iso), 'MMMM d, yyyy')
}

function chrome(username: string, dateLabel: string | null): DrawNode[] {
  return [
    { type: 'rect', x: 0, y: 0, w: CARD_SIZE, h: CARD_SIZE, fill: CARD_COLORS.background },
    { type: 'rect', x: 0, y: 0, w: CARD_SIZE, h: 14, fill: CARD_COLORS.accent },
    {
      type: 'text',
      x: MARGIN,
      y: 116,
      text: truncateLabel(username, 24),
      font: body(30, 500),
      fill: CARD_COLORS.textMuted,
      align: 'left',
      maxWidth: CONTENT_WIDTH / 2,
    },
    ...(dateLabel
      ? [
          {
            type: 'text',
            x: CONTENT_RIGHT,
            y: 116,
            text: dateLabel,
            font: body(30),
            fill: CARD_COLORS.textMuted,
            align: 'right',
          } satisfies DrawNode,
        ]
      : []),
    {
      type: 'line',
      x1: MARGIN,
      y1: 968,
      x2: CONTENT_RIGHT,
      y2: 968,
      stroke: CARD_COLORS.border,
      width: 2,
    },
    {
      type: 'text',
      x: MARGIN,
      y: 1024,
      text: '🔥 WaniTrack',
      font: body(32, 600),
      fill: CARD_COLORS.text,
      align: 'left',
    },
    {
      type: 'text',
      x: CONTENT_RIGHT,
      y: 1024,
      text: 'wanitrack.com',
      font: body(30),
      fill: CARD_COLORS.textMuted,
      align: 'right',
    },
  ]
}

interface StatRow {
  label: string
  value: string
}

function statRows(rows: StatRow[], startY: number, rowHeight: number): DrawNode[] {
  const nodes: DrawNode[] = []
  rows.forEach((row, i) => {
    const y = startY + i * rowHeight
    nodes.push(
      {
        type: 'text',
        x: MARGIN + 24,
        y,
        text: row.label,
        font: body(34),
        fill: CARD_COLORS.textMuted,
        align: 'left',
        maxWidth: CONTENT_WIDTH * 0.6,
      },
      {
        type: 'text',
        x: CONTENT_RIGHT - 24,
        y,
        text: row.value,
        font: body(40, 600),
        fill: CARD_COLORS.text,
        align: 'right',
      }
    )
    if (i < rows.length - 1) {
      nodes.push({
        type: 'line',
        x1: MARGIN + 24,
        y1: y + rowHeight / 2 - 14,
        x2: CONTENT_RIGHT - 24,
        y2: y + rowHeight / 2 - 14,
        stroke: CARD_COLORS.border,
        width: 2,
      })
    }
  })
  return nodes
}

function layoutLevelUp(data: Extract<ShareCardData, { kind: 'level-up' }>): DrawNode[] {
  const rows: StatRow[] = [
    { label: 'Items passed', value: data.stats.itemsPassed.toLocaleString() },
    { label: 'Items burned', value: data.stats.itemsBurned.toLocaleString() },
  ]
  if (data.stats.daysOnPreviousLevel !== null) {
    rows.push({
      label: `Level ${data.level - 1} took`,
      value: `${data.stats.daysOnPreviousLevel.toLocaleString()} days`,
    })
  }

  return [
    ...chrome(data.username, data.reachedAt ? formatIsoDate(data.reachedAt) : null),
    {
      type: 'text',
      x: CENTER,
      y: 312,
      text: 'LEVEL UP',
      font: body(36, 600),
      fill: CARD_COLORS.accent,
      align: 'center',
    },
    {
      type: 'text',
      x: CENTER,
      y: 478,
      text: `Level ${data.level}`,
      font: display(160),
      fill: CARD_COLORS.text,
      align: 'center',
      maxWidth: CONTENT_WIDTH,
    },
    ...statRows(rows, 640, 100),
  ]
}

function layoutMilestone(data: Extract<ShareCardData, { kind: 'milestone' }>): DrawNode[] {
  return [
    ...chrome(data.username, data.achievedAt ? formatIsoDate(data.achievedAt) : null),
    { type: 'text', x: CENTER, y: 360, text: ICON_GLYPHS[data.icon], font: body(110), fill: CARD_COLORS.text, align: 'center' },
    {
      type: 'text',
      x: CENTER,
      y: 408,
      text: 'MILESTONE',
      font: body(36, 600),
      fill: CARD_COLORS.accent,
      align: 'center',
    },
    {
      type: 'text',
      x: CENTER,
      y: 564,
      text: truncateLabel(data.label, 20),
      font: display(120),
      fill: CARD_COLORS.text,
      align: 'center',
      maxWidth: CONTENT_WIDTH,
    },
    {
      type: 'text',
      x: CENTER,
      y: 648,
      text: truncateLabel(data.description, 52),
      font: body(36),
      fill: CARD_COLORS.textMuted,
      align: 'center',
      maxWidth: CONTENT_WIDTH,
    },
  ]
}

function layoutYearReview(data: YearInReviewCardData): DrawNode[] {
  const rows: StatRow[] = [
    { label: 'Reviews answered', value: data.totalReviews.toLocaleString() },
    { label: 'Lessons completed', value: data.totalLessons.toLocaleString() },
    { label: 'Active days', value: data.activeDays.toLocaleString() },
    { label: 'Longest streak', value: `${data.longestStreak.toLocaleString()} days` },
  ]
  if (data.busiestDay) {
    rows.push({
      label: `Busiest day (${format(parseLocalDate(data.busiestDay.date), 'MMM d')})`,
      value: data.busiestDay.total.toLocaleString(),
    })
  }

  const nodes: DrawNode[] = [
    ...chrome(data.username, null),
    {
      type: 'text',
      x: CENTER,
      y: 224,
      text: 'YEAR IN REVIEW',
      font: body(36, 600),
      fill: CARD_COLORS.accent,
      align: 'center',
    },
    {
      type: 'text',
      x: CENTER,
      y: 356,
      text: `${data.year}`,
      font: display(130),
      fill: CARD_COLORS.text,
      align: 'center',
    },
    ...statRows(rows, 470, 88),
  ]

  if (data.milestones.length > 0) {
    nodes.push({
      type: 'text',
      x: CENTER,
      y: 900,
      text: truncateLabel(`🏆 ${data.milestones.join(' · ')}`, 56),
      font: body(30, 500),
      fill: CARD_COLORS.positive,
      align: 'center',
      maxWidth: CONTENT_WIDTH,
    })
  }

  if (data.trackedFrom) {
    nodes.push({
      type: 'text',
      x: CENTER,
      y: 944,
      text: `Tracked from ${format(parseLocalDate(data.trackedFrom), 'MMMM d')}`,
      font: body(26),
      fill: CARD_COLORS.textMuted,
      align: 'center',
    })
  }

  return nodes
}

export function layoutShareCard(data: ShareCardData): DrawNode[] {
  switch (data.kind) {
    case 'level-up':
      return layoutLevelUp(data)
    case 'milestone':
      return layoutMilestone(data)
    case 'year-review':
      return layoutYearReview(data)
  }
}
