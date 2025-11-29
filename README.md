# WaniTrack

A clean, focused statistics tracker for WaniKani learners. Analyzes your progress, identifies problem areas, and helps you understand your learning patterns.

## What it does

WaniTrack connects to your WaniKani account and provides detailed analytics on your kanji and vocabulary study. All processing happens in your browser—your API token and data never touch a server.

### Dashboard
Quick overview of your current state: available reviews and lessons, level progress, SRS distribution, and upcoming review forecast. See what's happening now and what's coming next.

### Accuracy Analysis
Break down your review accuracy by type (radicals, kanji, vocabulary), by level, and by time of day. Identify if you're stronger with meanings or readings, and spot patterns in when you perform best.

### Progress Tracking
Historical view of your level progression with projections to level 60. Three scenarios based on your actual pace: expected, fast track, and conservative estimates.

### Leech Detection
Automatically identifies items you're struggling with (10+ reviews, <75% accuracy) and ranks them by severity. Shows confusion pairs—similar items you're mixing up—and identifies problematic radicals that appear across multiple leeches.

## How to use it

1. Visit the deployed app at `https://tyler-cartwright.github.io/wanikani-stats-tracker`
2. Generate a WaniKani API token (read-only permissions) at [wanikani.com/settings/personal_access_tokens](https://www.wanikani.com/settings/personal_access_tokens)
3. Paste your token into the setup page
4. Browse your statistics

Your API token is stored locally in your browser. The app makes requests directly to WaniKani's API—no intermediary server, no data collection.

### Installing as a PWA

On iOS or Android, you can add WaniTrack to your home screen for a native app experience. It works offline with cached data.

**iOS**: Share button → Add to Home Screen
**Android**: Menu → Add to Home Screen

## Technical details

Built with React, TypeScript, and Tailwind CSS. Uses TanStack Query for intelligent data caching and Vite for the build pipeline. Deployed as a static site on GitHub Pages.

The app respects WaniKani's API rate limits (60 requests per minute) with built-in rate limiting. Different data types have different cache durations—your review summary refreshes every 30 seconds, while subject data (which rarely changes) is cached for an hour.

### Key calculations

**SRS Distribution**: Maps your items across the five main stages (Apprentice through Burned).

**Review Forecast**: Projects reviews for the next 2, 6, 12, and 24 hours based on SRS schedules.

**Level 60 Projection**: Three scenarios calculated from your historical pace. Accounts for your fastest and slowest levels to provide realistic estimates.

**Leech Severity**: Weighted score (40% incorrect answers, 30% review volume, 30% accuracy) to prioritize which items need attention first.

## Local development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Type check
npm run typecheck
```

The app uses environment-based configuration. In development, it runs on `/`. In production, the base path is automatically detected from the repository name for GitHub Pages deployment.

## Architecture notes

- **State management**: Zustand for auth/user state, TanStack Query for server state
- **Routing**: React Router with basename support for GitHub Pages subpaths
- **API client**: Custom client with automatic pagination, rate limiting, and error handling
- **Data flow**: All WaniKani API calls are abstracted through query hooks in `src/lib/api/queries.ts`
- **Calculations**: Pure functions in `src/lib/calculations/` for all analytics
- **Components**: Organized by feature area under `src/components/`

## Privacy

Your WaniKani API token is stored in browser localStorage. All API requests go directly from your browser to WaniKani's servers. This app doesn't have a backend and doesn't collect or store any data.

## License

MIT
