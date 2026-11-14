# WaniTrack

A comprehensive analytics platform for WaniKani learners. Track your progress, identify problem areas, and optimize your kanji and vocabulary study with detailed insights—all processed locally in your browser.

**Live App:** [wanitrack.com](https://wanitrack.com) | **Version:** 2.26.0 <!-- x-release-please-version -->

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

### Activity Heatmap
Your study history, captured locally and visualized:
- GitHub-style year calendar of daily reviews and lessons (recorded on every sync — WaniKani's API no longer provides review history, so it accumulates forward from your first sync)
- Daily study streaks: current (with a same-day grace period), longest ever, busiest day, lifetime totals
- **Share Cards**: square PNG stat cards for your current level, achieved milestones, and a year in review — share via the system share sheet or download

### Workload Forecasting
Plan your lesson pace and predict future review workload:
- **Lesson Pace Configuration**: Set lessons per day (0-100) and forecast period (7-180 days) with presets or custom values
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

### Leech Trainer
Treat your leeches, don't just diagnose them:
- Self-graded flashcard sessions — reveal, grade "Got it" / "Needs work", missed cards recycle until cleared
- Three item pools: leeches, recently failed (misses from the last week), or your current level
- **Confusion-Pair Mode**: drills visually similar leeches against each other, showing the lookalike on every reveal
- Vocabulary pronunciation audio with optional play-on-reveal
- Session results with first-try accuracy, stored locally for upcoming history features
- Purely local: your WaniKani reviews and SRS are never touched

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
- Detailed kanji breakdown per grade, opened in a focused modal with filter controls (All / Known / Unknown)

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
- **Display Options**: Dark/light mode, level history visualization, grid display settings
- **Privacy**: Disconnect and clear all local data anytime

---

## How It Works

WaniTrack is a **Progressive Web App** that connects directly to the WaniKani API. All data processing happens locally in your browser using IndexedDB for storage.

**Your data never touches a server**—everything stays on your device.

### Privacy & Security
- ✅ Direct connection to WaniKani API only
- ✅ No intermediary servers between you and WaniKani — your token and study data never leave your browser
- ✅ Privacy-respecting, cookieless analytics (Cloudflare Web Analytics — no personal data)
- ✅ Anonymous first-party usage statistics (see below), with an opt-out in Settings and on the landing page; Global Privacy Control is honoured
- ✅ API token stored locally in your browser
- ✅ All calculations performed client-side

#### Usage statistics

To find out whether WaniTrack is used enough to keep running, the app sends a handful of anonymous events to a first-party Cloudflare Worker at `wanitrack.com/api/event` (source in [`worker/`](worker/)):

| Event | Sent when | Contains |
|---|---|---|
| `landing` | The landing page loads | App version only |
| `connect` / `connect_fail` | A token is validated | Hashed account ID, or the failure type |
| `open` | The app loads | Hashed account ID; whether local data was cached; whether it's the installed app |
| `view` | A page is opened | Hashed account ID; page name |
| `error` | A sync, crash or auth error happens | Error type and HTTP status; hashed account ID if known |

The hashed account ID is `SHA-256` of your WaniKani account's internal UUID, re-hashed on the server with a secret key. **Your API token, username, level and study data are never sent.** IP addresses and user agents are not stored, nothing is shared with third parties, and records are deleted after 90 days. Turn it off under Settings → Privacy (or the link on the landing page); browsers sending Global Privacy Control are opted out automatically. The full design is in [`docs/analytics-plan.md`](docs/analytics-plan.md).

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
- Deployed per release, not per merge (see [Releasing](#releasing))

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

## Releasing

Merging to `main` does **not** deploy. Releases are managed by [release-please](https://github.com/googleapis/release-please):

1. Merge feature and fix PRs to `main` as normal (squash merge). **The PR title becomes the commit message, so it must be a [Conventional Commit](https://www.conventionalcommits.org/):** `feat: …` → minor bump, listed under *Added*; `fix: …` → patch bump, under *Fixed*; `perf:`/`revert:` → *Changed*; `refactor:` → *Technical*; `docs:`, `chore:`, `ci:`, `test:`, `build:`, `style:` → no release entry. Add `!` (e.g. `feat!:`) for a breaking change.
2. On each merge, the **Release** workflow updates one open PR titled `chore: release X.Y.Z`. It bumps `package.json`, `package-lock.json` and the README version, and adds the release to `CHANGELOG.md`. Edit `CHANGELOG.md` on that PR's branch to turn the generated bullets into fuller notes.
3. Merging the release PR tags `vX.Y.Z`, publishes a GitHub Release and deploys to wanitrack.com.

To redeploy `main` without a new release (e.g. after a failed deploy), run **Deploy to GitHub Pages** manually from the Actions tab. The footer shows the version and the short commit SHA of the running build.

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
