# Changelog

All notable changes to WaniTrack will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.6.0] - 2025-12-13

### Changed
- **Progress Page Redesign**: Complete visual and UX overhaul for improved data presentation
  - **Journey to Level 60 Card**: Now positioned at top of page as primary focus
    - Elegant hero estimate with understated typography and subtle vermillion accents (replaced dominant red block)
    - Tabbed scenario selection (Fast track / Expected / Conservative) with interactive segmented control
    - Scenario-reactive milestones that update dynamically based on selected projection
  - **Milestone Timeline**: Horizontal stepper design replacing vertical timeline
    - Shows 7 key milestones: Start (★), 10, 20, 30, 40, 50, 60
    - Mobile optimization: Shows 4 relevant milestones (Start, Previous completed, Next upcoming, L60)
    - Desktop: Shows all 7 milestones spanning full card width
    - Displays actual completion dates for past milestones, projected dates for future
    - Color-coded progress: Green (completed) → Red (current) → Grey (upcoming)
  - **Level History Chart**: Grid replaced with vertical bar chart for better data visualization
    - Vertical bars with levels on X-axis, days on Y-axis
    - Statistical 4-category classification using standard deviation: Fast, Good, Slow, Very Slow
    - Traffic light color scheme: Dark green → Green → Gold → Red
    - Smart tooltips that position above or inside bars based on height to prevent clipping
    - Proper dark mode support for all colors and icons
  - **Statistical Analysis**: Improved pace categorization algorithm
    - Fast: < (mean - 0.5 × σ)
    - Good: Within ±0.5σ of mean
    - Slow: Between +0.5σ and +1.5σ
    - Very Slow: > (mean + 1.5 × σ)
    - Better differentiation of outliers (e.g., 29d vs 160d levels properly classified separately)

### Fixed
- **Dark Mode Visibility**: All Progress page elements now properly visible in dark mode
  - Scenario tab icons use dark mode variants (`text-ink-400 dark:text-paper-300` when inactive)
  - Pace indicators ("X days/level") use proper contrast colors in both themes
  - Bar chart colors include dark mode variants for all pace categories
- **Milestone Date Accuracy**: Fixed completion date logic for historical milestones
  - Correctly identifies completed levels using `user.level > milestone.level`
  - Uses actual `passed_at` dates from WaniKani API for completed milestones
  - Fallback to next level's `unlocked_at` if `passed_at` is unavailable
- **Responsive Layout**: Removed horizontal scrolling on mobile devices
  - Milestones use full card width with flexible connecting lines
  - Adaptive spacing and sizing based on screen size
  - No overflow on any viewport size

### Technical
- Updated `src/pages/progress.tsx` - Swapped component order (Level60Projection now first)
- Updated `src/components/progress/level-60-projection.tsx`:
  - Added tabbed scenario state management with `selectedScenario` state
  - Built comprehensive milestone calculation (1, 10, 20, 30, 40, 50, 60) with actual/projected dates
  - Mobile-optimized milestone filtering (Start, Previous, Next, L60)
  - Horizontal stepper design with responsive rendering (mobile vs desktop)
  - Elegant hero redesign with centered typography and gradient accents
  - Dark mode support for all scenario colors
- Updated `src/components/progress/level-timeline.tsx`:
  - Converted from grid layout to vertical bar chart
  - Implemented statistical classification using standard deviation
  - Added `calculateStdDev()` helper function
  - Updated `determinePace()` to use mean and standard deviation
  - Traffic light color scheme with dark mode variants
  - Smart tooltip positioning logic
  - Responsive bar heights that fit container without scrolling

## [2.5.2] - 2025-12-09

### Fixed
- Kanji grid radical images now follow the same contrast rules as other subjects across SRS stages and themes; no more invisible radicals when switching between light/dark or different card backgrounds.

## [2.5.1] - 2025-12-09

### Changed
- Exam Readiness page now uses the skeleton loader during sync as well as DB fetch and is renamed internally to "Readiness" for clarity.

### Fixed
- Radicals without a kanji glyph now render their WaniKani-provided SVG fallback (preferring inline-styled SVGs) in the kanji grid and tooltip, eliminating the placeholder artefact.

## [2.5.0] - 2025-12-08

### Changed
- **JLPT Readiness → Exam Readiness**: Complete pivot from JLPT to official Jōyō kanji (常用漢字) system
  - Route changed: `/jlpt` → `/readiness` (old route redirects automatically)
  - Navigation updated: "JLPT" → "Readiness" in header and mobile nav
  - Page renamed: "Exam Readiness" with focus on official government-defined kanji standards

### Added
- **Jōyō Kanji System**: Official 2,136 kanji organized by Japanese school grades
  - Grade 1 (80 kanji, Age 6-7)
  - Grade 2 (160 kanji, Age 7-8)
  - Grade 3 (200 kanji, Age 8-9)
  - Grade 4 (200 kanji, Age 9-10)
  - Grade 5 (185 kanji, Age 10-11)
  - Grade 6 (181 kanji, Age 11-12)
  - Secondary School (1,130 kanji, Age 12-18)
  - Data source: [davidluzgouveia/kanji-data](https://github.com/davidluzgouveia/kanji-data)
- **Three Key Metrics**:
  - Jōyō Kanji Progress: Track completion through official grade levels
  - Reading Coverage: Frequency-based estimate of real-world kanji coverage (based on newspaper corpus research)
  - Approximate JLPT Level: Rough mapping to JLPT N5-N1 with disclaimers
- **Grade Cards**: Display progress by school grade with age context and completion status (90%+ = Complete)
- **JLPT Mapping Table**: Visual reference showing grade completion → JLPT level correlation
- **Frequency Coverage Algorithm**: Research-based estimation (500 kanji ≈ 80%, 1000 ≈ 90%, 1600 ≈ 99%)
- **Comprehensive Documentation**: Footer explains Jōyō system, WaniKani coverage, and JLPT mapping methodology
- **Tooltips**: Info icons on metrics explaining calculations and limitations
- **Skeleton Loading**: Full-page skeleton UI matching content structure for smooth loading experience

### Removed
- **Vocabulary Tracking**: Removed from exam readiness calculations (too subjective for JLPT/Jōyō correlation)
  - Deleted `src/data/jlpt/jlpt-vocabulary.json`
  - Simplified UI to kanji-only tracking
  - Updated types to remove vocabulary fields

### Fixed
- **Kanji Box Colors**: Fixed inconsistent SRS colors and contrast issues
  - Now uses app's official SRS color scheme (`bg-srs-apprentice`, `bg-srs-guru`, `bg-srs-master`, `bg-srs-enlightened`, `bg-srs-burned`)
  - Proper text contrast in both light and dark modes (`text-ink-100 dark:text-paper-100`)
  - Fixed Guru-level kanji visibility in light mode (was using light background + white text)
- **Progress Bar Visibility**: Fixed contrast issues at 70-89% completion range
  - Now uses SRS color scheme for consistency
  - 90%+: `bg-srs-master` (muted green)
  - 70-89%: `bg-srs-enlightened` (muted gold) - improved contrast
  - <70%: `bg-vermillion-500` (red)
- **Kanji Count Clarity**: Updated label to show "X of 2,136 Jōyō kanji are in WaniKani"
  - Makes it clear why users see ~1,995 instead of 2,136 (WaniKani doesn't teach all Jōyō kanji)

### Technical
- Added `src/data/jlpt/joyo-kanji.json` - 2,136 Jōyō kanji organized by grade
- Updated `src/data/jlpt/types.ts` - New types: `JoyoGrade`, `JoyoLevelData`, `JoyoReadinessResult`, `JOYO_GRADE_INFO`
- Updated `src/data/jlpt/index.ts` - Exports for Jōyō system (`JOYO_KANJI`, `JOYO_COUNTS`, `JOYO_GRADES`)
- Rewrote `src/lib/calculations/jlpt-readiness.ts`:
  - Grade-based progression tracking
  - Frequency coverage calculation (piecewise linear interpolation)
  - JLPT approximation logic
  - Removed vocabulary matching
- Updated all JLPT components for Jōyō system:
  - `src/components/jlpt/jlpt-hero.tsx` - Three metrics, tooltips, grade context
  - `src/components/jlpt/jlpt-level-card.tsx` - Grade labels with age ranges, SRS colors
  - `src/components/jlpt/jlpt-level-detail.tsx` - Removed vocabulary tab, improved sorting
  - `src/components/jlpt/jlpt-item-grid.tsx` - Consistent SRS color scheme
- Updated `src/pages/jlpt.tsx` - Skeleton loading, JLPT mapping table, updated footer
- Updated `src/pages/settings.tsx` - Renamed "JLPT Readiness" → "Exam Readiness"
- Updated `src/App.tsx` - New route and redirect
- Updated `src/components/layout/header.tsx` and `mobile-nav.tsx` - Navigation labels

## [2.4.2] - 2025-12-08

### Removed
- **Assignments Table from Progress Page**: Removed redundant subjects table component
  - Deleted `src/components/progress/assignments-table.tsx` (398 lines)
  - Subjects browsing now consolidated in dedicated Subject Grid page (`/kanji`)
  - Reduced Progress page bundle size from ~24KB to ~13.9KB

## [2.4.1] - 2025-12-08

### Fixed
- **Mobile Navigation Overflow**: Added scrolling to mobile drawer when content exceeds viewport height
  - Prevents menu items from being cut off on landscape mode, small devices, or with large accessibility fonts
  - Applied `overflow-y-auto` to drawer container
- **Touch Device Tooltips**: Implemented tap-to-select pattern for Subject Grid on touch devices
  - First tap selects cell and shows tooltip with item details
  - Second tap on same cell navigates to WaniKani
  - Tap elsewhere dismisses tooltip
  - Desktop mouse behavior unchanged (hover shows tooltip, click navigates immediately)
  - Selected cells show visual feedback (ring outline, scale, shadow)

### Added
- `useTouchDevice` hook for reliable touch device detection using `pointer: coarse` media query
- Touch-aware interaction handlers in Subject Grid components
- Visual selection state for grid cells on touch devices

## [2.4.0] - 2025-12-08

### Added
- **Subject Grid Page**: Visual overview of all WaniKani learning items
  - New `/kanji` route (renamed from kanji-specific to all subjects)
  - Displays radicals, kanji, and vocabulary in a unified grid
  - Color-coded top borders to distinguish subject types:
    - Blue (#00AAFF) for radicals
    - Pink (#FF00AA) for kanji
    - Purple (#AA00FF) for vocabulary
  - SRS stage colors for cell backgrounds (locked through burned)
  - Flexible cell widths to accommodate multi-character vocabulary
  - Radical image support for radicals without character representations
- **Grid Features**:
  - Dual view modes: flat grid or grouped by level
  - Filtering by level range (1-60)
  - Filtering by SRS stage
  - Filtering by subject type (radical/kanji/vocabulary)
  - Search by character, meaning, or reading
  - Hover tooltips with item details
  - Click to open item on WaniKani
- **Performance Optimizations**:
  - Lazy-loaded level sections via Intersection Observer
  - Memoized cell components
  - Deferred search for responsive typing
- **Navigation**: Added "Kanji" link to header and mobile nav

### Technical
- Added `src/pages/kanji.tsx` - Subject grid page
- Added `src/components/kanji-grid/` - Grid component suite
- Added `src/lib/calculations/kanji-grid.ts` - Subject enrichment and filtering
- Updated `src/App.tsx` with new route
- Updated navigation components with new link

## [2.3.0] - 2025-12-02

### Added
- **Data Export System**: Comprehensive backup and analysis capabilities
  - JSON exports for subjects, assignments, review statistics, level progressions, sync metadata, app settings, and optional API token
  - CSV export for leech analysis with detailed columns (character, meaning, type, level, accuracy, reviews, severity, etc.)
  - Export metadata including version, timestamp, username, and export type
  - File size estimation before export
  - Export history tracking
- **Enhanced Hidden Item Tracking**: Intelligent filtering system for items removed from WaniKani curriculum
  - `excludeHiddenSubjects()` for curriculum counts
  - `excludeHiddenUnstartedAssignments()` for progress tracking (counts items you learned before removal)
  - `excludeHiddenFromReviews()` for review forecasts
  - `excludeHiddenStats()` for accuracy calculations
  - Ensures fair, accurate statistics reflecting actual learning progress

### Changed
- **Complete Caching Architecture Overhaul**: Fixed stale data issues across the application
  - Introduced cache version management system (`version-manager.ts`)
  - Automatic cache invalidation on app version changes
  - Clears IndexedDB, Service Worker cache, and React Query cache when version changes
  - Prevents data schema mismatches across updates
  - Improved cache manager with coordinated invalidation
- Updated data export section UI with better organization and size indicators
- Enhanced settings page with clearer export options
- Improved sync system to work with new cache management

### Fixed
- Stale data persistence after app updates
- Hidden items incorrectly appearing in various calculations and displays
- Users now properly credited for items learned before curriculum removal
- Dashboard and progress tracking now accurately reflect user's actual learning history

### Technical
- Added `src/lib/cache/version-manager.ts` for version-based cache management
- Added `src/lib/cache/cache-manager.ts` for coordinated cache invalidation
- Added `src/lib/export/export-manager.ts` for data export logic
- Added `src/lib/export/file-utils.ts` for file generation and downloads
- Added `src/lib/utils/filters.ts` for comprehensive hidden item filtering
- Enhanced `src/stores/export-store.ts` for export state management
- Refactored database initialization to include version tracking
- Updated TanStack Query configuration for better cache coordination

## [2.2.0] - 2025-11-30

### Added
- Customizable averaging calculations for Level 60 projections
  - Enhanced settings page with progress calculation options
  - User-configurable break detection thresholds
  - Toggle between active learning average and total average
  - Choice between trimmed mean and median averaging methods
- Updated app icon for better visual identity

### Changed
- Level timeline now shows excluded levels with visual indicators
- Level 60 projection displays which levels were excluded from calculations
- Progress calculation settings persist across sessions
- Improved level duration analysis with more transparency

### Fixed
- Review counter now properly syncs down after completing reviews on WaniKani
- Sync now correctly updates available review count when items are completed
- Missed files in averaging implementation now properly included

### Technical
- Enhanced `src/lib/calculations/activity-analysis.ts` with custom threshold support
- Updated `src/stores/settings-store.ts` with new progress calculation settings
- Improved level timeline and projection components with better configurability
- Streamlined PWA manifest creation for improved deployment process

## [2.1.1] - 2025-11-30

### Added
- **Intelligent Level Averaging**: Advanced break detection for accurate Level 60 projections
  - Statistical outlier detection (levels >3× median pace)
  - Identifies inactive periods (vacations, breaks) automatically
  - Active learning average excludes detected breaks
  - Multiple projection scenarios: expected, expected active, fast track, conservative
- **Custom Modal System**: Reusable modal component for better UX
  - Consistent modal styling across application
  - Focus management and keyboard navigation
  - Backdrop click and ESC key to close
- **Toast Notification System**: User feedback for actions
  - Success, error, info, and warning toast types
  - Auto-dismiss with configurable duration
  - Stacking support for multiple toasts
  - Custom hook `useToast()` for easy integration
- **Confirm Dialog Component**: User confirmation for destructive actions
  - Custom hook `useConfirm()` for programmatic access
  - Configurable title, message, and action buttons
  - Used for disconnect/clear data confirmation
- **Activity Analysis Module**: `src/lib/calculations/activity-analysis.ts`
  - Break detection algorithms
  - Active vs total average calculations
  - Configurable averaging methods (trimmed mean, median)

### Changed
- Level 60 projection now shows multiple scenarios with detailed breakdown
- Settings page redesigned with better organization and new calculation options
- API token input now uses custom modal instead of browser alert
- Disconnect action now requires confirmation via custom dialog

### Improved
- Accuracy distribution chart now shows histogram instead of duplicate meaning/reading breakdown
- More accurate level duration calculations using unlock timestamps instead of first lesson date
- Better visual feedback for all user actions
- Enhanced progress tracking with activity analysis

### Technical
- Added `src/components/shared/modal.tsx` - Reusable modal component
- Added `src/components/shared/toast.tsx` - Toast notification system
- Added `src/components/shared/confirm-dialog.tsx` - Confirmation dialog
- Added `src/hooks/use-toast.tsx` - Toast management hook
- Added `src/hooks/use-confirm.tsx` - Confirmation dialog hook
- Added `src/lib/calculations/activity-analysis.ts` - Break detection and averaging
- Enhanced `src/stores/settings-store.ts` with new settings options
- Updated all components to use consistent error/success feedback

## [2.1.0] - 2025-11-29

### Added
- **IndexedDB Integration**: Persistent local database for offline data access
  - Database schema with 5 object stores: `sync_metadata`, `subjects`, `assignments`, `review_statistics`, `level_progressions`
  - Type-safe repository pattern for data access
  - ~15MB storage for complete dataset
  - Survives page refreshes and app restarts
- **Delta Sync System**: Efficient API usage with incremental updates
  - Uses WaniKani API's `updated_after` parameter
  - Only fetches data that changed since last sync
  - Tracks last sync timestamps per data type
  - Significantly reduces API calls and bandwidth
- **Sync Manager**: Orchestrates data synchronization
  - Automatic sync on app load
  - Manual sync trigger in settings
  - Force full sync option (re-download all data)
  - Progress callbacks for long operations
- **Initial Sync Flow**: First-time user experience
  - Full-screen sync overlay with progress indicators
  - Shows which data types are being fetched
  - Prevents interaction until sync completes
  - Smooth transition to dashboard when ready
- **Sync Status Indicator**: Real-time sync feedback
  - Shows sync in progress with spinner
  - Displays last sync timestamp
  - Indicates sync errors
- **Sync Store**: Zustand store for sync state management
  - Tracks sync progress and status
  - Manages last sync timestamps
  - Coordinates sync operations

### Changed
- All data queries now read from IndexedDB instead of direct API calls
- API calls now only happen during sync operations
- Dashboard and all pages load instantly from cached data
- Settings page now includes comprehensive data management section
- App now works offline after initial sync

### Technical
- Added `src/lib/db/database.ts` - IndexedDB wrapper
- Added `src/lib/db/schema.ts` - Database schema definitions
- Added `src/lib/db/sync-metadata.ts` - Sync timestamp management
- Added `src/lib/db/repositories/` - Data access repositories for each entity
- Added `src/lib/sync/sync-manager.ts` - Synchronization orchestration
- Added `src/hooks/use-sync.ts` - React hook for sync operations
- Added `src/components/shared/initial-sync.tsx` - First-time sync UI
- Added `src/components/shared/sync-status.tsx` - Sync status indicator
- Added `src/stores/sync-store.ts` - Sync state management
- Refactored `src/lib/api/queries.ts` to use cached data
- Updated `src/lib/api/endpoints.ts` to support delta sync parameters

## [2.0.0] - 2025-11-29

### Initial Release

WaniTrack v2.0.0 - Complete WaniKani statistics tracker and analytics platform.

#### Features

**Dashboard Page**
- Hero stats: current level, available reviews, available lessons, next review time
- SRS distribution chart with all stages (Apprentice → Burned)
- Level progress tracker (radicals, kanji, vocabulary)
- Review forecast (next 2h, 6h, 12h, 24h) with hourly breakdown
- Guru forecast showing items approaching Guru stage
- Real-time updates every 30 seconds

**Progress Tracking Page**
- Level timeline with historical level completion visualization
- Level 60 projection with three scenarios (expected, fast track, conservative)
- Comprehensive assignments table with pagination, filtering, and search
- Fastest/slowest level statistics
- Average pace calculations

**Accuracy Analysis Page**
- Overall accuracy percentage across all reviews
- Type breakdown (radicals, kanji, vocabulary)
- Meaning vs reading accuracy comparison
- Accuracy distribution by level (all 60 levels)
- Performance patterns and insights

**Leech Detection Page**
- Automatic leech detection (10+ reviews, <75% accuracy)
- Severity scoring algorithm (0-100 weighted score)
- Priority list sorted by severity
- Confusion pairs detection (similar items being mixed up)
- Root cause analysis (problematic radicals appearing across leeches)
- Detailed statistics per item

**Settings Page**
- Account information display (username, level, subscription, start date)
- API token management
- Disconnect and clear data option
- Placeholder for future settings

**Setup Page**
- API token input and validation
- First-time onboarding flow

#### Technical Implementation

**Architecture**
- React 18.3.1 with TypeScript 5.6.2
- React Router 6.28.0 for navigation
- Zustand 5.0.8 for global state management
- TanStack Query 5.90.11 for server state
- Tailwind CSS 4.0.0 for styling
- Vite 6.0.5 for build tooling

**Design System**
- "Ink & paper" theme with warm colors (not stark white/black)
- Japanese-inspired accents (torii red #E63946, aged copper green)
- Custom typography with Crimson Pro (serif) and Inter (sans-serif)
- Noto Sans JP for Japanese characters
- Dark mode support
- Fully responsive design
- Mobile-first approach with dedicated mobile navigation

**API Integration**
- Custom WaniKani API v2 client
- Rate limiting (1 request/second, respects 60/minute limit)
- Automatic pagination handling
- Typed response interfaces
- Error handling with typed exceptions
- Progress callbacks for long operations

**State Management**
- Auth store: API token, user data
- User store: WaniKani user information
- Settings store: User preferences, theme
- TanStack Query: Server state caching

**PWA Capabilities**
- Progressive Web App with offline support
- Installable on iOS, Android, and desktop
- Service worker for asset caching
- PWA manifest with custom icons
- Standalone display mode
- Auto-update on new version deployment

**Build & Deploy**
- GitHub Pages static hosting
- Automated deployment via GitHub Actions
- Dynamic base path detection for subdirectory deployment
- SPA routing with 404.html fallback
- Build-time TypeScript checking

**Code Quality**
- Strict TypeScript with no unused variables
- Comprehensive type definitions for WaniKani API
- Error boundaries for component isolation
- Component-based architecture with feature organization
- Pure calculation functions for testability
- Repository pattern for data access

#### Key Calculations

**SRS Distribution**
- Maps numeric SRS stages (0-9) to named categories
- Visualizes learning pipeline health

**Review Forecasting**
- Scans all assignments for `available_at` timestamps
- Provides cumulative totals for multiple time windows
- Hourly breakdown for 24-hour period
- Peak hour detection

**Level Progress**
- Tracks 90% kanji → Guru leveling requirement
- Monitors radicals, kanji, vocabulary separately
- Days on current level calculation

**Level 60 Projection**
- Three scenarios: expected (total avg), fast track (8d/level), conservative (avg × 1.5)
- Based on historical level completion data
- Accounts for fastest and slowest levels

**Leech Severity**
- Weighted algorithm: 40% incorrect count, 30% volume, 30% accuracy
- Prioritizes items needing immediate attention
- 0-100 scale for easy comparison

**Confusion Pairs**
- Character similarity analysis between leeches
- Identifies systematic mix-ups

**Root Cause Analysis**
- Finds radicals appearing in multiple problem items
- Minimum threshold: 3+ affected items
- Sorted by impact

#### Browser Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+ (iOS 14+)
- Requires IndexedDB, Service Workers, ES2020+

#### Privacy & Security
- Client-side only (no backend)
- All requests go directly to WaniKani API
- API token stored in browser localStorage
- No data collection or analytics
- No third-party services

---

## Version History Summary

- **2.5.2** (Dec 9, 2025) - Radical image contrast matches text/SRS colors across themes
- **2.5.1** (Dec 9, 2025) - Readiness skeleton during sync; fallback radical SVGs
- **2.5.0** (Dec 8, 2025) - Exam Readiness pivot to Jōyō system, new metrics/UI
- **2.4.0** (Dec 8, 2025) - Subject grid page with radicals, kanji, vocabulary visualization
- **2.3.0** (Dec 2, 2025) - Data export system, hidden item tracking, caching overhaul
- **2.2.0** (Nov 30, 2025) - Customizable averaging, review counter fix, icon update
- **2.1.1** (Nov 30, 2025) - Intelligent level averaging, modal system, toast notifications
- **2.1.0** (Nov 29, 2025) - IndexedDB integration, delta sync, offline capabilities
- **2.0.0** (Nov 29, 2025) - Initial release with complete feature set

---

## Notes

### Semantic Versioning
WaniTrack follows [semantic versioning](https://semver.org/):
- **Major (X.0.0)**: Breaking changes, major feature overhauls
- **Minor (x.Y.0)**: New features, non-breaking changes
- **Patch (x.y.Z)**: Bug fixes, minor improvements

### Release Dates
All dates in this changelog are in YYYY-MM-DD format.

### Links
- [Latest Release](https://github.com/tyler-cartwright/wanikani-stats-tracker/releases/latest)
- [All Releases](https://github.com/tyler-cartwright/wanikani-stats-tracker/releases)
- [Repository](https://github.com/tyler-cartwright/wanikani-stats-tracker)
- [Live App](https://tyler-cartwright.github.io/wanikani-stats-tracker)
