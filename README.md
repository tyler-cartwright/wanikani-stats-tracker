# WaniTrack

A comprehensive analytics platform for WaniKani learners. Track your progress, identify problem areas, and optimize your kanji and vocabulary study with detailed insights—all processed locally in your browser.

**Live App:** [wanitrack.com](https://wanitrack.com) | **Version:** 2.12.1

---

## Features

### Dashboard
Real-time overview of your WaniKani journey:
- Current level, available reviews/lessons, next review time
- SRS distribution chart showing items across all stages (Apprentice → Burned)
- Level progress tracking with layered progress bars (lessons started vs items guru'd)
- Review forecast for upcoming hours and days
- Navigate through historical level data

### Progress Tracking
Long-term analysis and projections:
- **Level Timeline**: Visual history of all completed levels with customizable display modes (bar chart, cards, compact list)
- **Level 60 Projections**: Multiple scenarios based on your actual pace (expected, active, fast track, conservative)
- **Intelligent Break Detection**: Automatically identifies inactive periods for more accurate projections
- **Assignments Table**: Comprehensive searchable list with filtering by type and SRS stage

### Workload Forecasting
Plan your lesson pace and predict future review workload:
- **Lesson Pace Configuration**: Set lessons per day (0-999) and forecast period (7-180 days) with presets or custom values
- **Workload Metrics**: Track peak day, average daily reviews, stabilization point, and total reviews over the forecast period
- **Level Progression Forecast**: Projects what level you'll reach based on your lesson pace, accounting for your current progress
- **Interactive Charts**: Daily or weekly view of projected workload, split between existing items and new lessons
- **Breakdown Analysis**: Percentage split showing reviews from existing items vs new lessons
- **Configurable Settings**: Control whether vocabulary is included in level progression calculations (Settings → Forecast)

### Leech Detection
Identify and tackle your problem items:
- Automatic detection of items with low accuracy (<75%) and high review counts (10+)
- Severity ranking system accounting for accuracy, incorrect count, and review volume
- **Interactive Detail Modal**: Click any leech to view readings, meanings, accuracy breakdown, and WaniKani link
- **Confusion Pairs**: Identifies visually similar items you're mixing up
- **Root Cause Analysis**: Finds problematic radicals appearing across multiple leeches
- **CSV Export**: Export leech data with readings for external analysis
- **Burned Leeches Setting**: Control whether burned items appear in your leeches list

### Kanji Grid
Browse and analyze your kanji collection:
- Grid view of all kanji with SRS stage colors
- Filter by type, SRS stage, and search by character or meaning
- View removed curriculum items (optional)
- Interactive tooltips with detailed information

### Readiness Tools
Prepare for JLPT exams:
- Grade-based readiness assessment (N5-N1)
- Configurable SRS thresholds (Apprentice, Guru, Master, Enlightened)
- Track mastery progress for each JLPT level
- Detailed breakdown by kanji, vocabulary, and overall readiness

### Accuracy Insights
Understand your performance patterns:
- Accuracy distribution across all items
- Time-based accuracy heatmap by level
- Type breakdown (radicals, kanji, vocabulary)
- Recent items performance tracking

### Settings & Data Management
Full control over your data and preferences:
- **Data Export**: Export complete WaniKani data as JSON or leeches as CSV
- **Sync Management**: Force full sync, view last sync status
- **Calculation Preferences**: Active learning averages, averaging methods (trimmed mean vs median)
- **Display Options**: Dark/light mode, level history visualization, grid display settings
- **Privacy**: Disconnect and clear all local data anytime

---

## How It Works

WaniTrack is a **Progressive Web App** that connects directly to the WaniKani API. All data processing happens locally in your browser using IndexedDB for storage.

**Your data never touches a server**—everything stays on your device.

### Privacy & Security
- ✅ Direct connection to WaniKani API only
- ✅ No intermediary servers
- ✅ No analytics or tracking
- ✅ API token stored locally in your browser
- ✅ All calculations performed client-side

**Recommendation:** Use a read-only API token (write permissions not needed).

---

## Getting Started

### For Users

1. **Get your API token** from [WaniKani Settings](https://www.wanikani.com/settings/personal_access_tokens)
2. **Visit** [wanitrack.com](https://wanitrack.com)
3. **Enter your token** and start exploring your stats

### Install as PWA

Add WaniTrack to your home screen for a native app experience:

- **iOS**: Share button → Add to Home Screen
- **Android**: Menu → Add to Home Screen
- **Desktop**: Look for the install icon in your browser's address bar

### Browser Requirements
- Modern browser with IndexedDB and Service Worker support
- ~15MB available storage
- Tested on Chrome/Edge 90+, Firefox 88+, Safari 14+

---

## Tech Stack

**Frontend:**
- React 18 + TypeScript
- Tailwind CSS 4 for styling
- React Router for navigation
- Vite for build tooling

**State & Data:**
- TanStack Query for server state management
- Zustand for global state (auth, settings)
- IndexedDB for local data persistence
- Custom API client with rate limiting and delta sync

**Deployment:**
- Static site on GitHub Pages
- PWA with offline support via Workbox

---

## Development

### Setup
```bash
# Clone repository
git clone https://github.com/tyler-cartwright/wanikani-stats-tracker.git
cd wanikani-stats-tracker

# Install dependencies
npm install

# Run development server
npm run dev
# → http://localhost:5173

# Type check
npm run typecheck

# Build for production
npm run build

# Preview production build
npm run preview
```

### Project Structure
```
src/
├── components/         # UI components (organized by feature)
│   ├── dashboard/      # Dashboard page components
│   ├── progress/       # Progress tracking components
│   ├── forecast/       # Workload forecasting components
│   ├── leeches/        # Leech detection components
│   ├── settings/       # Settings page components
│   └── shared/         # Reusable UI components
├── pages/              # Route-level page components
├── lib/                # Core business logic
│   ├── api/           # WaniKani API client & types
│   ├── db/            # IndexedDB repositories
│   ├── sync/          # Data synchronization
│   ├── calculations/  # Analytics & statistics
│   └── export/        # Data export system
├── stores/            # Zustand state management
├── hooks/             # Custom React hooks
└── styles/            # Global CSS with Tailwind
```

### Architecture Highlights
- **Repository Pattern**: Clean abstraction for IndexedDB access
- **Pure Calculation Functions**: All analytics are framework-independent and testable
- **Delta Sync**: Efficient data fetching using `updated_after` timestamps
- **Rate Limiting**: Respects WaniKani's 60 requests/minute limit
- **Code Splitting**: Lazy-loaded routes for optimal bundle size

---

## Contributing

This is a personal project, but feedback and bug reports are welcome!

- **Issues**: [GitHub Issues](https://github.com/tyler-cartwright/wanikani-stats-tracker/issues)
- **Discussions**: [GitHub Discussions](https://github.com/tyler-cartwright/wanikani-stats-tracker/discussions)

---

## Troubleshooting

If you encounter issues:

1. Try **"Force Full Sync"** in Settings
2. Check browser console for errors (F12)
3. Verify your API token is valid at [WaniKani Settings](https://www.wanikani.com/settings/personal_access_tokens)
4. Try disconnecting and reconnecting
5. Open an issue on GitHub with details

---

## Version History

See [CHANGELOG.md](CHANGELOG.md) for detailed release notes and version history.

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- **WaniKani** for the excellent API and kanji learning platform
- **WaniKani Community** for inspiration and feedback
- All the amazing open-source libraries that made this possible

---

## Links

- **Live App**: [wanitrack.com](https://wanitrack.com)
- **Repository**: [GitHub](https://github.com/tyler-cartwright/wanikani-stats-tracker)
- **WaniKani**: [wanikani.com](https://www.wanikani.com)
- **WaniKani API Docs**: [docs.api.wanikani.com](https://docs.api.wanikani.com)
