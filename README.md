# WaniTrack

A comprehensive statistics tracker and analytics platform for WaniKani learners. Provides deep insights into your progress, identifies problem areas, and helps optimize your learning strategy.

## Overview

WaniTrack is a Progressive Web App (PWA) that connects to your WaniKani account via the official API to provide detailed analytics on your kanji and vocabulary study. All data processing happens locally in your browser using IndexedDB for storage. Your API token and learning data never touch a server—everything stays on your device.

**Live App:** [https://wanitrack.com](https://wanitrack.com)

### Progress Tracking
Historical view of your level progression with projections to level 60. Multiple projection scenarios based on your actual pace: expected, expected active (excludes detected breaks), fast track, and conservative estimates. Intelligent break detection identifies inactive periods to provide more accurate projections.

### Leech Detection
Automatically identifies items you're struggling with (10+ reviews, <75% accuracy) and ranks them by severity. Shows confusion pairs—similar items you're mixing up—and identifies problematic radicals that appear across multiple leeches. Export your leech list as CSV for external analysis.

### Data Export & Settings
Export your complete WaniKani data as JSON (subjects, assignments, review statistics, level progressions) for backup or external analysis. Configure calculation preferences like active learning averages, break detection, and averaging methods (trimmed mean vs median) to customize your Level 60 projections.

### Dashboard
Your command center for daily WaniKani activity:
- **Hero Stats:** Current level, available reviews, available lessons, next review time
- **SRS Distribution Chart:** Visual breakdown of items across all SRS stages (Apprentice → Burned)
- **Level Progress:** Track radicals, kanji, and vocabulary progress toward next level
- **Review Forecast:** Predictions for upcoming reviews (next 2h, 6h, 12h, 24h) with hourly breakdown
- **Guru Forecast:** Items approaching Guru stage (one correct review away)
- **Real-time Updates:** Summary data refreshes every 30 seconds

### Progress Tracking
Long-term progress analysis and projections:
- **Level Timeline:** Historical visualization of all completed levels with duration
- **Level 60 Projections:** Multiple scenarios based on your actual pace:
  - **Expected:** Based on total average (all levels)
  - **Expected Active:** Based on active learning periods (excludes detected breaks)
  - **Fast Track:** 8 days/level speed run baseline
  - **Conservative:** Active average × 1.5 for buffer
- **Intelligent Break Detection:** Automatically identifies inactive periods using statistical outlier detection or custom thresholds
- **Configurable Averaging:**
  - Trimmed mean (removes top/bottom 10%)
  - Median
  - Toggle between total vs active learning averages
- **Assignments Table:** Comprehensive paginated list with filtering by type, SRS stage, and search

On iOS or Android, you can add WaniTrack to your home screen for a native app experience.

**iOS**: Share button → Add to Home Screen
**Android**: Menu → Add to Home Screen
**Desktop**: Look for the install icon in your browser's address bar

```
severity = (incorrect_score × 0.4) + (volume_score × 0.3) + (accuracy_score × 0.3)

Built with React, TypeScript, and Tailwind CSS. Uses IndexedDB for local data persistence, TanStack Query for intelligent data caching, and Vite for the build pipeline. Deployed as a static site on GitHub Pages.

The app respects WaniKani's API rate limits (60 requests per minute) with built-in rate limiting. Delta sync using `updated_after` timestamps ensures only changed data is fetched. Your review summary refreshes every 30 seconds to keep the dashboard current.

- accuracy_score = 100 - accuracy_percentage
  (Accuracy penalty)
```

Higher severity (closer to 100) = more urgent to review

### Confusion Pairs
Identifies visually similar items causing mix-ups:
- Compares characters between all detected leeches
- Character overlap and similarity scoring
- Groups items that share components
- Helps identify systematic confusion patterns

**Level 60 Projection**: Multiple scenarios calculated from your historical pace: expected (total average), expected active (excludes breaks), fast track (8 days/level), and conservative (active average × 1.5). Accounts for your fastest and slowest levels to provide realistic estimates.

## Local Development

### Prerequisites
- Node.js 18+ (for npm)
- Git

### Setup
```bash
# Clone repository
git clone https://github.com/tyler-cartwright/wanikani-stats-tracker.git
cd wanikani-stats-tracker

# Install dependencies
npm install

# Run development server
npm run dev
# App runs on http://localhost:5173/

# Type check
npm run typecheck

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Configuration
- **Development:** Runs on `/` (root path)
- **Production:** Automatically detects GitHub Pages subdirectory from repository name
- **Base URL:** Configured dynamically in `vite.config.ts`

### Project Structure
```
/
├── src/
│   ├── components/          # UI components organized by feature
│   │   ├── dashboard/       # Dashboard page components
│   │   ├── progress/        # Progress tracking components
│   │   ├── accuracy/        # Accuracy analysis components
│   │   ├── leeches/         # Leech detection components
│   │   ├── settings/        # Settings page components
│   │   ├── layout/          # Layout components (header, nav, shell)
│   │   └── shared/          # Reusable UI components
│   ├── pages/               # Route-level page components
│   ├── lib/                 # Core business logic
│   │   ├── api/            # WaniKani API client & types
│   │   ├── db/             # IndexedDB database & repositories
│   │   ├── sync/           # Data synchronization manager
│   │   ├── calculations/   # Analytics & statistics
│   │   ├── cache/          # Cache management & versioning
│   │   ├── export/         # Data export system
│   │   └── utils/          # Utility functions
│   ├── stores/             # Zustand state management
│   ├── hooks/              # Custom React hooks
│   └── styles/             # Global CSS with Tailwind
├── public/                 # Static assets (icons, manifest)
└── dist/                   # Build output (generated)
```

### Architecture Patterns
- **State Management:**
  - Zustand for global auth/settings state
  - TanStack Query for server state
  - React hooks for local component state

- **Data Layer:**
  - Repository pattern for IndexedDB access
  - Type-safe API client with error handling
  - Automatic pagination and rate limiting

- **Calculations:**
  - Pure functions in `src/lib/calculations/`
  - Testable, framework-independent
  - Memoized for performance

- **Components:**
  - Feature-based organization
  - Shared components for reusability
  - Lazy loading for code splitting

## Browser Support

### Minimum Requirements
- Modern browser with:
  - IndexedDB support
  - Service Worker support (for PWA features)
  - ES2020+ JavaScript
  - ~15MB available storage

### Tested Browsers
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+ (iOS 14+)

## Privacy & Security

### Data Storage
- **API Token:** Stored in browser `localStorage` (never transmitted to third parties)
- **Cache Data:** Stored in browser `IndexedDB` (never leaves your device)
- **Settings:** Stored in browser `localStorage`

### Network Requests
- **All requests go directly to WaniKani API** (`https://api.wanikani.com/v2/`)
- **No intermediary servers**
- **No analytics or tracking**
- **No third-party services**

- **State management**: Zustand for auth/user state, TanStack Query for server state
- **Data persistence**: IndexedDB for local caching with delta sync support
- **Routing**: React Router with basename support for GitHub Pages subpaths
- **API client**: Custom client with automatic pagination, rate limiting, and error handling
- **Data flow**: All WaniKani API calls are abstracted through query hooks in `src/lib/api/queries.ts`
- **Calculations**: Pure functions in `src/lib/calculations/` for all analytics
- **Components**: Organized by feature area under `src/components/`

### Security Best Practices
- Use read-only API token (write permissions not needed)
- Rotate your API token periodically
- Use "Disconnect" in settings to clear all local data before lending device
- Browser security protects localStorage/IndexedDB from other websites

## Version Information

**Current Version:** 2.3.0

See [CHANGELOG.md](CHANGELOG.md) for full version history and release notes.

## Contributing

This is a personal project, but feedback and bug reports are welcome:
- **Issues:** [GitHub Issues](https://github.com/tyler-cartwright/wanikani-stats-tracker/issues)
- **Discussions:** [GitHub Discussions](https://github.com/tyler-cartwright/wanikani-stats-tracker/discussions)

## Version History

See [CHANGELOG.md](CHANGELOG.md) for detailed release notes and version history.

## License

MIT License - see [LICENSE](LICENSE) file for details

## Acknowledgments

- **WaniKani:** For the excellent API and kanji learning platform
- **Community:** WaniKani forums for inspiration and feedback
- **Libraries:** All the amazing open-source tools that made this possible

## Support

If you encounter issues:
1. Try "Force Full Sync" in Settings
2. Check browser console for errors (F12)
3. Verify API token is valid at [wanikani.com/settings/personal_access_tokens](https://www.wanikani.com/settings/personal_access_tokens)
4. Try disconnecting and reconnecting
5. Open an issue on GitHub with details

## Links

- **Live App:** [https://tyler-cartwright.github.io/wanikani-stats-tracker](https://tyler-cartwright.github.io/wanikani-stats-tracker)
- **Repository:** [https://github.com/tyler-cartwright/wanikani-stats-tracker](https://github.com/tyler-cartwright/wanikani-stats-tracker)
- **WaniKani:** [https://www.wanikani.com](https://www.wanikani.com)
- **WaniKani API Docs:** [https://docs.api.wanikani.com](https://docs.api.wanikani.com)
