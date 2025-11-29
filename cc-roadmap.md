# WaniKani Statistics Tracker — Development Roadmap

> A study companion app for WaniKani users. Track progress, identify problem areas, forecast your journey to level 60.

---

## Project Vision

A Progressive Web App that feels like a well-crafted study journal — spacious, calm, functional. The interface should disappear, letting the data speak. Every interaction should feel considered, not cluttered.

**Core philosophy**: Ma (間) — the Japanese concept of negative space. Let the content breathe.

---

## Design System

### Color Palette
```css
/* Paper tones (light mode backgrounds) */
--paper-100: #FAF9F7;      /* Lightest - main background */
--paper-200: #F5F3EF;      /* Cards, elevated surfaces */
--paper-300: #EDE9E0;      /* Borders, dividers */
--paper-400: #D8D4CC;      /* Disabled states, subtle UI */

/* Ink tones (text and dark mode backgrounds) */
--ink-100: #1C1917;        /* Primary text, dark mode bg */
--ink-200: #292524;        /* Dark mode elevated surfaces */
--ink-300: #3D3835;        /* Secondary text */
--ink-400: #6B6560;        /* Tertiary text, labels */
--ink-500: #A8A29E;        /* Placeholder, disabled text */

/* Vermillion (primary accent - torii red) */
--vermillion-400: #D9534F; /* Hover state */
--vermillion-500: #C53D2D; /* Primary actions, key metrics */
--vermillion-600: #A33226; /* Active/pressed state */

/* Patina (secondary accent - aged copper green) */
--patina-400: #5A9182;     /* Hover state */
--patina-500: #4A7C6F;     /* Success states, positive trends */
--patina-600: #3D665B;     /* Active/pressed state */

/* Functional accents */
--indigo: #3D5467;         /* Links, interactive elements */
--ochre: #B8935A;          /* Warnings, attention */
--moss: #5C6B5A;           /* Muted success */

/* SRS Stage colors (desaturated versions) */
--srs-apprentice: #C9A0C9; /* Muted pink-purple */
--srs-guru: #7B9EB8;       /* Muted blue */
--srs-master: #8B9E8B;     /* Muted sage */
--srs-enlightened: #C4B078;/* Muted gold */
--srs-burned: #6B6560;     /* Warm grey */
```

### Typography
```css
/* Font families */
--font-display: 'Crimson Pro', Georgia, serif;
--font-body: 'Inter', system-ui, sans-serif;
--font-japanese: 'Noto Sans JP', sans-serif;

/* Scale (using fluid sizing) */
--text-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.8rem);
--text-sm: clamp(0.85rem, 0.8rem + 0.25vw, 0.9rem);
--text-base: clamp(1rem, 0.95rem + 0.25vw, 1.05rem);
--text-lg: clamp(1.15rem, 1.1rem + 0.3vw, 1.25rem);
--text-xl: clamp(1.35rem, 1.25rem + 0.5vw, 1.5rem);
--text-2xl: clamp(1.75rem, 1.5rem + 1vw, 2.25rem);
--text-3xl: clamp(2.25rem, 2rem + 1.5vw, 3rem);

/* Line heights */
--leading-tight: 1.2;
--leading-normal: 1.5;
--leading-relaxed: 1.7;

/* Font weights */
--weight-normal: 400;
--weight-medium: 500;
--weight-semibold: 600;
```

### Spacing
```css
/* Base unit: 4px */
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-10: 2.5rem;  /* 40px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
--space-20: 5rem;    /* 80px */
--space-24: 6rem;    /* 96px */
```

### Radius & Shadows
```css
/* Border radius */
--radius-sm: 0.25rem;
--radius-md: 0.5rem;
--radius-lg: 0.75rem;
--radius-xl: 1rem;
--radius-full: 9999px;

/* Shadows (subtle, warm-tinted) */
--shadow-sm: 0 1px 2px rgba(28, 25, 23, 0.04);
--shadow-md: 0 2px 8px rgba(28, 25, 23, 0.06);
--shadow-lg: 0 8px 24px rgba(28, 25, 23, 0.08);
--shadow-xl: 0 16px 48px rgba(28, 25, 23, 0.12);
```

### Motion
```css
/* Transitions */
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);

--duration-fast: 150ms;
--duration-normal: 250ms;
--duration-slow: 400ms;

/* Prefer reduced motion */
@media (prefers-reduced-motion: reduce) {
  --duration-fast: 0ms;
  --duration-normal: 0ms;
  --duration-slow: 0ms;
}
```

---

## Japanese Language Integration

Japanese text appears as subtle supporting labels — never as primary UI text. Think of it as margin notes in a study journal.

### Usage Guidelines

1. **Placement**: Below or beside English labels, never replacing them
2. **Styling**: `--text-xs`, `--ink-400` color, `--weight-normal`
3. **Opacity**: 60-70% — visible but not competing
4. **Font**: `--font-japanese` (Noto Sans JP)

### Approved Labels

| English | Japanese | Context |
|---------|----------|---------|
| Dashboard | 概要 | Page header |
| Progress | 進捗 | Page header |
| Accuracy | 精度 | Page header |
| Leeches | 難点 | Page header |
| Level | 段階 | Stats |
| Reviews | 復習 | Stats |
| Lessons | 学習 | Stats |
| Burned | 完了 | SRS stage |

### Implementation
```jsx
<h1 className="text-2xl font-display">
  Dashboard
  <span className="block text-xs text-ink-400 font-japanese opacity-70">
    概要
  </span>
</h1>
```

---

## Technical Architecture

### Stack

- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui (customized to design system)
- **State**: Zustand (lightweight, no boilerplate)
- **Data fetching**: TanStack Query (caching, background refresh)
- **Charts**: Recharts (customizable, React-native)
- **Icons**: Lucide React
- **Deployment**: GitHub Pages (static build)

### Directory Structure
```
src/
├── components/
│   ├── ui/                    # shadcn/ui primitives (customized)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── tabs.tsx
│   │   └── ...
│   ├── layout/
│   │   ├── app-shell.tsx      # Main layout wrapper
│   │   ├── header.tsx         # Desktop tab navigation
│   │   ├── mobile-nav.tsx     # Mobile side drawer
│   │   └── page-container.tsx # Content area wrapper
│   ├── dashboard/
│   │   ├── hero-stats.tsx     # Level, reviews, lessons
│   │   ├── srs-summary.tsx    # Compact SRS distribution
│   │   ├── level-progress.tsx # Current level progress
│   │   └── review-forecast.tsx# Next 24h preview
│   ├── progress/
│   │   ├── level-timeline.tsx
│   │   ├── level-60-projection.tsx
│   │   └── assignments-table.tsx
│   ├── accuracy/
│   │   ├── accuracy-overview.tsx
│   │   ├── time-heatmap.tsx
│   │   └── type-breakdown.tsx
│   ├── leeches/
│   │   ├── priority-list.tsx
│   │   ├── confusion-pairs.tsx
│   │   └── root-causes.tsx
│   └── shared/
│       ├── stat-card.tsx
│       ├── progress-bar.tsx
│       ├── srs-badge.tsx
│       └── japanese-label.tsx
├── pages/
│   ├── dashboard.tsx
│   ├── progress.tsx
│   ├── accuracy.tsx
│   └── leeches.tsx
├── hooks/
│   ├── use-wanikani-api.ts
│   ├── use-theme.ts
│   └── use-mobile.ts
├── stores/
│   ├── user-store.ts
│   └── settings-store.ts
├── lib/
│   ├── api/
│   │   ├── client.ts
│   │   ├── endpoints.ts
│   │   └── types.ts
│   ├── calculations/
│   │   ├── srs-distribution.ts
│   │   ├── level-progress.ts
│   │   ├── accuracy.ts
│   │   ├── leeches.ts
│   │   └── forecasting.ts
│   └── utils/
│       ├── dates.ts
│       ├── formatting.ts
│       └── constants.ts
├── styles/
│   ├── globals.css            # Tailwind + custom properties
│   └── fonts.css              # Font imports
└── App.tsx
```

### Tailwind Configuration
```js
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        paper: {
          100: '#FAF9F7',
          200: '#F5F3EF',
          300: '#EDE9E0',
          400: '#D8D4CC',
        },
        ink: {
          100: '#1C1917',
          200: '#292524',
          300: '#3D3835',
          400: '#6B6560',
          500: '#A8A29E',
        },
        vermillion: {
          400: '#D9534F',
          500: '#C53D2D',
          600: '#A33226',
        },
        patina: {
          400: '#5A9182',
          500: '#4A7C6F',
          600: '#3D665B',
        },
        srs: {
          apprentice: '#C9A0C9',
          guru: '#7B9EB8',
          master: '#8B9E8B',
          enlightened: '#C4B078',
          burned: '#6B6560',
        },
      },
      fontFamily: {
        display: ['Crimson Pro', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        japanese: ['Noto Sans JP', 'sans-serif'],
      },
    },
  },
};
```

---

## Component Specifications

### Layout Components

#### AppShell

The root layout component that handles responsive navigation.
```
┌─────────────────────────────────────────────────────┐
│  Header (desktop: tabs) / Mobile: hamburger         │
├─────────────────────────────────────────────────────┤
│                                                     │
│                                                     │
│                   Page Content                      │
│                   (max-w-6xl, centered)             │
│                                                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Desktop (1024px+)**:
- Fixed header with logo left, tab navigation center, actions right
- Tabs: Dashboard, Progress, Accuracy, Leeches
- Actions: Theme toggle, Settings dropdown

**Mobile (<1024px)**:
- Compact header with logo and hamburger
- Side drawer navigation (slides from left)
- Drawer contains: nav links, theme toggle, settings, logout

#### Header (Desktop)
```
┌──────────────────────────────────────────────────────────────┐
│  🔥 WK Stats          Dashboard  Progress  Accuracy  Leeches    ☀️ ⚙️ │
└──────────────────────────────────────────────────────────────┘
```

- Logo: Small icon + "WK Stats" in `font-display`
- Tabs: Text only, underline indicator on active
- Active tab: `vermillion-500` underline, 2px, smooth transition
- Hover: `paper-300` background

#### MobileNav (Side Drawer)
```
┌─────────────────┐
│  🔥 WK Stats    │
│                 │
│  Dashboard      │
│  概要           │
│                 │
│  Progress       │
│  進捗           │
│                 │
│  Accuracy       │
│  精度           │
│                 │
│  Leeches        │
│  難点           │
│                 │
│─────────────────│
│  ☀️ Light mode  │
│  ⚙️ Settings    │
│  🚪 Logout      │
└─────────────────┘
```

- Width: 280px
- Background: `paper-200`
- Overlay: `ink-100` at 50% opacity
- Slide animation: 300ms ease-out
- Close on: overlay click, escape key, nav item click

---

### Dashboard Components

The dashboard is a **glanceable summary**. No deep data here — just the essentials at a glance.

#### HeroStats

The first thing users see. Three key numbers, large and confident.
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│     Level 24                42              15              │
│     段階                  Reviews         Lessons           │
│                           復習             学習             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

- Level: `text-3xl`, `font-display`, `vermillion-500`
- Reviews/Lessons: `text-2xl`, `font-body`, `ink-100`
- Labels: `text-sm`, `ink-400`
- Japanese: `text-xs`, `ink-400`, 70% opacity
- Layout: Flex, space-between on desktop; stack on mobile
- Next review time shown subtly below reviews count

#### SRSSummary

Compact visual of SRS distribution. Not a full chart — just proportional bars.
```
┌─────────────────────────────────────────────────────────────┐
│  SRS Distribution                                           │
│                                                             │
│  Apprentice  ████████████░░░░░░░░░░░░░░░░░░░  142          │
│  Guru        ████████████████████░░░░░░░░░░░  287          │
│  Master      ██████████████░░░░░░░░░░░░░░░░░  198          │
│  Enlightened ██████████░░░░░░░░░░░░░░░░░░░░░  156          │
│  Burned      ████████████████████████████░░░  892          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

- Horizontal bars, full width
- Bar height: 8px, `radius-full`
- Bar colors: SRS colors from palette
- Counts: Right-aligned, `text-sm`, `ink-300`
- No grid lines, no axes — pure data

#### LevelProgress

Current level completion status.
```
┌─────────────────────────────────────────────────────────────┐
│  Level 24 Progress                          Day 8           │
│                                                             │
│  Radicals      ●●●●●●●●●●○○              10/12  83%        │
│  Kanji         ●●●●●●●●●●●●●●●○○○○○○○    15/22  68%        │
│  Vocabulary    ●●●●●●○○○○○○○○○○○○○○      6/20   30%        │
│                                                             │
│  ─────────────────────────────────────────────────          │
│  7 kanji to level up                                        │
└─────────────────────────────────────────────────────────────┘
```

- Progress shown as dot indicators (filled/empty circles)
- Or thin progress bars if dots get too crowded
- "Day X" shows time on current level
- Footer message: kanji remaining for level-up requirement

#### ReviewForecast

Minimal 24-hour preview.
```
┌─────────────────────────────────────────────────────────────┐
│  Next 24 Hours                                              │
│                                                             │
│  Now          42 reviews                                    │
│  +2h          18 more                                       │
│  +6h          35 more                                       │
│  +12h         52 more                                       │
│                                                             │
│  Peak: 4:00 PM (67 reviews)                                 │
└─────────────────────────────────────────────────────────────┘
```

- Simple list, not a chart
- Times relative ("Now", "+2h")
- Highlight peak time
- Subtle visual indicator of relative volume (optional mini bar)

---

### Progress Page Components

Comprehensive view of learning journey.

#### LevelTimeline

Visual timeline of completed levels.
```
┌─────────────────────────────────────────────────────────────┐
│  Level History                                              │
│                                                             │
│  Average: 12 days  |  Fastest: 8 days  |  Slowest: 21 days │
│                                                             │
│  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐        │
│  │  1  │  2  │  3  │  4  │  5  │ ... │ 23  │ 24  │        │
│  │ 14d │ 12d │ 10d │ 8d  │ 15d │     │ 11d │  ●  │        │
│  └─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘        │
│                                                             │
│  Color indicates pace: ■ Fast  ■ Average  ■ Slow           │
└─────────────────────────────────────────────────────────────┘
```

- Grid of level cards
- Each card shows level number and duration
- Color coding: patina (fast), ink-400 (average), ochre (slow)
- Current level has pulsing dot indicator
- Clicking a level could expand details (future feature)

#### Level60Projection

Estimated completion date with scenarios.
```
┌─────────────────────────────────────────────────────────────┐
│  Journey to Level 60                                        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │        Estimated: March 2026                        │   │
│  │        ~14 months remaining                         │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Scenarios                                                  │
│  ─────────────────────────────────────────────────────────  │
│  🚀 Fast track    Dec 2025    (8 days/level)               │
│  📊 Expected      Mar 2026    (12 days/level)              │
│  🐢 Conservative  Aug 2026    (18 days/level)              │
│                                                             │
│  Milestones                                                 │
│  ─────────────────────────────────────────────────────────  │
│  Level 30    ✓ Completed                                    │
│  Level 40    ~June 2025                                     │
│  Level 50    ~November 2025                                 │
│  Level 60    ~March 2026                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

- Hero section with primary estimate
- Scenario cards with different paces
- Milestone checklist with dates

#### AssignmentsTable

Searchable, filterable, sortable table of all items.
```
┌─────────────────────────────────────────────────────────────┐
│  All Items                                      1,847 total │
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────────────┐  │
│  │ Type: All ▼ │ │ SRS: All  ▼ │ │ 🔍 Search...        │  │
│  └─────────────┘ └─────────────┘ └──────────────────────┘  │
│                                                             │
│  Character   Meaning          Type    Level   SRS    Acc   │
│  ─────────────────────────────────────────────────────────  │
│  大          big, large       Kanji   1       Guru   94%   │
│  大きい      big              Vocab   2       Master 88%   │
│  大学        university       Vocab   3       Enl.   91%   │
│  ...                                                        │
│                                                             │
│  ← 1 2 3 ... 37 →                              50 per page │
└─────────────────────────────────────────────────────────────┘
```

- shadcn/ui Table component
- Filters: dropdowns for type, SRS stage
- Search: debounced, searches character and meanings
- Sortable columns (click header)
- Pagination or virtual scrolling for performance
- Row click opens item detail sheet/modal

---

### Accuracy Page Components

Deep dive into review performance.

#### AccuracyOverview

Primary accuracy metrics with meaning vs reading comparison.
```
┌─────────────────────────────────────────────────────────────┐
│  Overall Accuracy                                           │
│                                                             │
│        ┌─────────────────┐                                  │
│        │                 │                                  │
│        │      87%        │      Meaning: 91%                │
│        │    Overall      │      Reading: 83%                │
│        │                 │                                  │
│        └─────────────────┘      12,847 total reviews        │
│                                                             │
│  💡 Your reading accuracy is 8% lower than meaning.         │
│     Consider focusing on reading practice.                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

- Large circular progress indicator for overall
- Side-by-side bars for meaning vs reading
- Contextual insight message

#### TimeHeatmap

Performance by hour of day.
```
┌─────────────────────────────────────────────────────────────┐
│  Performance by Time of Day                    🌅 Morning   │
│                                                  Person     │
│                                                             │
│     12a  2a  4a  6a  8a  10a 12p  2p  4p  6p  8p  10p      │
│    ┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐      │
│    │ · │ · │ · │░░░│███│███│▓▓▓│▓▓▓│▓▓▓│▓▓▓│░░░│ · │      │
│    └───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘      │
│                                                             │
│  Best: 8-9 AM (94%)    Worst: 10-11 PM (79%)               │
│                                                             │
│  💡 You perform best in the morning. Schedule difficult     │
│     reviews before noon for better retention.               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

- Horizontal heatmap (12 or 24 cells)
- Color intensity = accuracy
- Empty cells for hours with no data
- Summary stats below
- Personality label (morning/evening person)

#### TypeBreakdown

Accuracy by item type with detailed stats.
```
┌─────────────────────────────────────────────────────────────┐
│  Accuracy by Type                                           │
│                                                             │
│  Radicals                                                   │
│  ████████████████████████████████████░░░░░░  92%   480     │
│                                                             │
│  Kanji                                                      │
│  ████████████████████████████████░░░░░░░░░░  85%   2,104   │
│                                                             │
│  Vocabulary                                                 │
│  ██████████████████████████████████░░░░░░░░  88%   5,892   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

- Simple horizontal bars
- Percentage + item count
- Color matches type (could use subtle type-specific colors)

---

### Leeches Page Components

Problem item management.

#### PriorityList

Top items needing attention, ranked by severity.
```
┌─────────────────────────────────────────────────────────────┐
│  Priority Study List                           24 leeches   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  1.  読む        to read                            │   │
│  │      Accuracy: 45%  |  Reviews: 38  |  Severity: 92 │   │
│  │      Focus: Reading  ·  "む" ending confusion       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  2.  飲む        to drink                           │   │
│  │      Accuracy: 52%  |  Reviews: 31  |  Severity: 85 │   │
│  │      Focus: Reading  ·  Confused with 読む          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ...                                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

- Cards for each leech
- Large character, meaning
- Key stats inline
- Recommendation/focus area
- Click to see full item detail

#### ConfusionPairs

Items commonly confused with each other.
```
┌─────────────────────────────────────────────────────────────┐
│  Confusion Pairs                                            │
│                                                             │
│  These similar items are both giving you trouble.           │
│                                                             │
│  ┌────────────────────┬──┬────────────────────┐            │
│  │  読む              │⚡│  飲む              │            │
│  │  to read           │  │  to drink          │            │
│  │  52%               │  │  45%               │            │
│  └────────────────────┴──┴────────────────────┘            │
│                                                             │
│  ┌────────────────────┬──┬────────────────────┐            │
│  │  入る              │⚡│  人                │            │
│  │  to enter          │  │  person            │            │
│  │  61%               │  │  58%               │            │
│  └────────────────────┴──┴────────────────────┘            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

- Side-by-side cards
- Visual connection indicator
- Combined severity indicator
- Click either side for detail

#### RootCauses

Components causing cascading problems.
```
┌─────────────────────────────────────────────────────────────┐
│  Root Cause Radicals                                        │
│                                                             │
│  These components are causing problems in multiple items.   │
│  Study these first!                                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  亻  (person radical)                               │   │
│  │  Affecting 8 leech items                            │   │
│  │  休, 体, 住, 位, 作, 使, 供, 例                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

- Component character large
- Count of affected items
- List of affected items (clickable)

---

## Shared Components

### StatCard

Reusable stat display component.

**Variants:**
- `default`: Paper background, ink text
- `highlight`: Vermillion accent for primary metrics
- `success`: Patina accent for positive trends
- `warning`: Ochre accent for attention items

**Props:**
```typescript
interface StatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  japaneseLabel?: string;
  variant?: 'default' | 'highlight' | 'success' | 'warning';
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}
```

### ProgressBar

Thin, elegant progress indicator.

**Props:**
```typescript
interface ProgressBarProps {
  value: number;        // 0-100
  color?: string;       // Tailwind color class
  height?: 'sm' | 'md'; // 4px or 8px
  showLabel?: boolean;  // Show percentage
  animated?: boolean;   // Animate on mount
}
```

### SRSBadge

Small badge showing SRS stage.

**Props:**
```typescript
interface SRSBadgeProps {
  stage: 'apprentice' | 'guru' | 'master' | 'enlightened' | 'burned';
  size?: 'sm' | 'md';
}
```

### JapaneseLabel

Consistent Japanese supporting text.

**Props:**
```typescript
interface JapaneseLabelProps {
  text: string;
  className?: string;
}
```

**Implementation:**
```jsx
<span className="block text-xs text-ink-400 font-japanese opacity-70">
  {text}
</span>
```

---

## Page Specifications

### Dashboard (`/`)

**Purpose**: Quick status check. User should get full picture in <5 seconds.

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│  Header                                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  HeroStats (Level, Reviews, Lessons)                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌────────────────────────┐  ┌────────────────────────┐   │
│  │  LevelProgress         │  │  SRSSummary            │   │
│  │                        │  │                        │   │
│  └────────────────────────┘  └────────────────────────┘   │
│                                                             │
│  ┌────────────────────────┐  ┌────────────────────────┐   │
│  │  ReviewForecast        │  │  LeechAlert            │   │
│  │                        │  │  (if leeches > 0)      │   │
│  └────────────────────────┘  └────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Mobile**: Single column, stacked vertically.

**Data requirements:**
- User level, subscription status
- Current lessons/reviews count
- Summary (next 24h reviews)
- Assignments (for level progress, SRS counts)
- Leech count (for alert)

### Progress (`/progress`)

**Purpose**: Detailed journey tracking and item management.

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│  Header                                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  LevelTimeline                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Level60Projection                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  AssignmentsTable                                   │   │
│  │  (full width, paginated)                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Data requirements:**
- Level progressions (history)
- All assignments
- All subjects (for display)

### Accuracy (`/accuracy`)

**Purpose**: Deep performance analysis.

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│  Header                                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  AccuracyOverview                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌────────────────────────┐  ┌────────────────────────┐   │
│  │  TypeBreakdown         │  │  MeaningVsReading      │   │
│  └────────────────────────┘  └────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  TimeHeatmap                                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  LevelAccuracyChart                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Data requirements:**
- Review statistics (all)
- Subjects (for grouping)

### Leeches (`/leeches`)

**Purpose**: Problem item identification and study guidance.

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│  Header                                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  LeechSummary (counts by severity)                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌────────────────────────┐  ┌────────────────────────┐   │
│  │  RootCauses            │  │  ConfusionPairs        │   │
│  └────────────────────────┘  └────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  PriorityList (scrollable)                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Data requirements:**
- Review statistics
- Subjects (for display, components)
- Assignments (for SRS stage context)

---

## Implementation Phases

### Phase 1: Foundation (This prompt)

**Goal**: Visual skeleton with design system, no functionality.

**Deliverables:**
1. Vite + React project setup
2. Tailwind configuration with full design system
3. shadcn/ui installed and customized
4. All layout components (AppShell, Header, MobileNav)
5. All page shells with placeholder content
6. Shared components (StatCard, ProgressBar, etc.)
7. Dark mode support
8. Responsive behavior

**Placeholder data**: Hard-coded mock data that looks realistic.

**No API integration** — this is purely visual.

### Phase 2: Data Layer

**Goal**: API integration and state management.

**Deliverables:**
1. WaniKani API client
2. TanStack Query setup
3. Zustand stores
4. IndexedDB caching layer
5. Token management (secure storage)
6. Data sync logic

### Phase 3: Dashboard Features

**Goal**: Fully functional dashboard.

**Deliverables:**
1. Real data in HeroStats
2. Real SRS distribution
3. Real level progress
4. Real review forecast
5. Leech count integration

### Phase 4: Progress Features

**Goal**: Fully functional progress page.

**Deliverables:**
1. Level timeline with real data
2. Level 60 projection calculator
3. Assignments table with filtering/sorting
4. Item detail sheet

### Phase 5: Accuracy Features

**Goal**: Fully functional accuracy page.

**Deliverables:**
1. Accuracy calculations
2. Time-of-day analysis
3. Type breakdown
4. Level-by-level accuracy

### Phase 6: Leeches Features

**Goal**: Fully functional leeches page.

**Deliverables:**
1. Leech detection algorithm
2. Severity scoring
3. Confusion pair detection
4. Root cause analysis
5. Priority list generation

### Phase 7: Polish & PWA

**Goal**: Production-ready PWA.

**Deliverables:**
1. Service worker
2. Offline support
3. Install prompt
4. Performance optimization
5. Error boundaries
6. Loading states
7. Empty states

---

## PWA Requirements

### Responsive Breakpoints
```css
/* Mobile first approach */
sm: 640px   /* Large phones, small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Small laptops, tablets landscape */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large desktops */
```

### Touch Targets

- Minimum 44x44px for all interactive elements
- Generous padding on mobile
- Swipe gestures for navigation (optional enhancement)

### Offline Strategy

- Cache static assets on install
- Cache API responses with stale-while-revalidate
- Show cached data when offline
- Indicate offline status subtly
- Queue actions for when back online (future)

### Performance Targets

- First Contentful Paint: <1.5s
- Largest Contentful Paint: <2.5s
- Time to Interactive: <3.5s
- Cumulative Layout Shift: <0.1

---

## Development Commands
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to GitHub Pages
npm run deploy

# Run type checking
npm run typecheck

# Run linting
npm run lint
```

---

## Notes for Claude Code

### Priority Order

1. Get the design system tokens into Tailwind config first
2. Build AppShell with responsive navigation before anything else
3. Create shared components before page-specific ones
4. Use shadcn/ui primitives — don't reinvent buttons, cards, etc.
5. Mock data should look realistic (Japanese characters, plausible numbers)

### Design Principles to Maintain

1. **Space over density** — when in doubt, add more padding
2. **Typography hierarchy** — size and weight, not color, creates hierarchy
3. **Subtle interactions** — hover states should be gentle, not flashy
4. **Japanese text is decoration** — never functional, always secondary
5. **Color has meaning** — vermillion for actions, patina for success, ochre for warning

### Things to Avoid

- Emoji in navigation or primary UI (use Lucide icons)
- Gradients on cards or buttons
- Multiple font weights in the same element
- Dense data tables without room to breathe
- Animated elements that distract from content

---

*End of roadmap. Begin with Phase 1: Foundation.*
