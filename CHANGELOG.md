# Changelog

All notable changes to WaniTrack will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.12.1] - 2025-12-20

### Fixed
- **TypeScript Compilation**: Fixed type errors preventing successful build
  - Removed unused `viewportHeight` variable in `src/components/shared/info-tooltip.tsx:34`
  - Fixed `id` property type error in `src/lib/calculations/level-progression-forecast.ts` by updating `LevelProgressionForecastInput` interface to properly type subjects as `(Subject & { id: number })[]` to match repository layer data structure

### Technical
- Updated `src/components/shared/info-tooltip.tsx`: Removed unused `viewportHeight` declaration
- Updated `src/lib/calculations/level-progression-forecast.ts`: Changed `subjects` parameter type from `Subject[]` to `(Subject & { id: number })[]` in `LevelProgressionForecastInput` interface

## [2.12.0] - 2025-12-20

### Added
- **Forecast Page: Level Progression Forecast**: New feature showing projected level advancement based on lesson pace
  - Visual milestone card displaying current level → projected level
  - Accounts for user's current progress within their level
  - Shows levels gained and lessons completed during forecast period
  - Configurable via Settings: include vocabulary or radicals/kanji only
  - Celebration message when forecast predicts WaniKani completion
  - New setting: "Include vocabulary in level progression" (Settings → Forecast)
- **Forecast Page: Weekly View as Default**: Changed default chart view from daily to weekly for better overview

### Fixed
- **Forecast Page: Mobile UX Improvements**
  - Daily/Weekly toggle now full-width on mobile with equal button sizing
  - Weekly bars use stacked layout on mobile (week label above, bar fills width, stats below)
  - Daily view labels narrower on mobile (`w-16` instead of `w-20`) for better bar visibility
- **Forecast Page: Peak Day/Week Color Consistency**: Peak bars now use red + muted red instead of confusing red + green mix
  - Peak bars: vermillion-500 (existing items) + vermillion-300/600 (new lessons)
  - Normal bars: patina-500/400 (existing items) + patina-300/600 (new lessons)
- **Forecast Page: New Lessons Bar Color**: Changed from off-brand blue to muted green (patina-300/600) for consistency
- **Forecast Page: Tooltip Clipping**: Fixed bar chart tooltips getting cut off by container overflow
- **Forecast Page: Tooltip Flash**: Fixed tooltips "changing their mind" by hiding until position calculated
- **Forecast Page: Peak Day Background**: Removed translucent red background that looked awkward

### Improved
- **Forecast Page: User-Friendly Tooltips**: Simplified all tooltip language to avoid technical jargon
  - Removed references to SRS stages, variance calculations, and technical terms
  - Used everyday language for better accessibility
- **Forecast Page: Accuracy Disclaimer**: Added prominent notice explaining forecasts are estimates based on average accuracy

### Technical
- New files:
  - `src/lib/calculations/level-progression-forecast.ts` - Level progression calculation logic
  - `src/components/forecast/level-progression-card.tsx` - Milestone card component
- Updated `src/stores/settings-store.ts`: Added `forecastIncludeVocabulary` setting
- Updated `src/pages/settings.tsx`: Added "Forecast" section with vocabulary toggle
- Updated `src/pages/forecast.tsx`: Integrated level progression card with subjects/user data
- Updated `src/components/forecast/workload-chart.tsx`: Mobile responsive improvements, color fixes
- Updated `src/components/shared/info-tooltip.tsx`: Viewport boundary detection logic
- Updated workload forecast: Lessons now start from tomorrow instead of today

## [2.11.3] - 2025-12-20

### Fixed
- **Progress Page: Level Achievement Dates for Reset Levels**: Fixed missing completion dates for level milestones (10, 20, 30, 40, 50, 60) when users reset mid-level
  - Applied same sorting pattern from dashboard level progress component
  - Now prioritizes completed level progressions (those with `passed_at`) over abandoned ones
  - Falls back to most recent `created_at` for tie-breaking
  - Ensures accurate achievement dates display in milestone timeline
- **Progress Page: Achievement Tooltip Readability**: Fixed poor contrast for date text in achievement tooltips
  - Date text now properly inverts contrast to match tooltip background
  - Light mode: lighter text (`text-paper-300`) on dark tooltip background
  - Dark mode: darker text (`text-ink-400`) on light tooltip background
  - Applied to both completion dates and progress indicators
- **Progress Page: Missing 5000 Guru Achievement**: Added missing milestone badge for reaching Guru on 5000 items
  - Guru milestones now include: 1, 100, 500, 1000, 2500, **5000**, All Guru
  - Matches the existing Burns milestone structure for consistency

### Technical
- Updated `src/lib/calculations/milestones.ts`:
  - Modified `getLevelMilestones()` to filter and sort progressions by `passed_at` presence (lines 170-179)
  - Added `5000` to Guru targets array (line 135)
- Updated `src/components/progress/milestone-timeline.tsx`:
  - Changed tooltip date text from `text-ink-400 dark:text-paper-300` to `text-paper-300 dark:text-ink-400` (lines 70, 75)

## [2.11.2] - 2025-12-20

### Fixed
- **Readiness Page: Dropdown Positioning**: Fixed mastery level dropdown extending off-screen on mobile
  - Dropdown now anchors to left on mobile (right on desktop)
  - Added max-width constraint to prevent overflow on narrow screens
  - Applied responsive positioning classes for improved mobile UX
- **Progress Page: Milestone Date Format**: Clarified ambiguous date display on journey timeline
  - Changed format from `MMM yy` (e.g., "Dec 25") to `MMM yyyy` (e.g., "Dec 2025")
  - Prevents confusion between abbreviated year and day of month
  - Applied to both mobile and desktop milestone displays
- **Dashboard: Level Progress Percentage Alignment**: Fixed percentage alignment on mobile layout
  - Percentage values now properly align to the right on mobile
  - Stats container uses `self-end` on mobile for correct positioning
  - Desktop layout unchanged
- **Leeches Page: Modal Height on Mobile**: Fixed detail modal extending beyond viewport
  - Added `max-h-[calc(100vh-2rem)]` constraint to prevent overflow
  - Enabled internal scrolling with `overflow-y-auto`
  - Close button and all content now accessible on all screen sizes

### Technical
- Updated `src/components/jlpt/jlpt-threshold-select.tsx`:
  - Changed dropdown positioning from `right-0` to `left-0 sm:left-auto sm:right-0`
  - Added `max-w-[calc(100vw-2rem)] sm:max-w-none` to dropdown container
- Updated `src/components/progress/level-60-projection.tsx`:
  - Changed date format from `'MMM yy'` to `'MMM yyyy'` (2 instances at lines 399, 452)
- Updated `src/components/dashboard/level-progress.tsx`:
  - Added `self-end sm:self-auto` to stats container for right-alignment on mobile
- Updated `src/components/shared/modal.tsx`:
  - Added `flex flex-col max-h-[calc(100vh-2rem)] overflow-y-auto` to modal container

## [2.11.1] - 2025-12-20

### Fixed
- **Dashboard Level Progress: Mobile Layout**: Fixed cramped stats display on narrow screens
  - Stats now stack vertically on mobile (type label on row 1, stats on row 2)
  - Desktop layout unchanged (horizontal with justify-between)
  - Improved spacing with responsive gap classes
  - Applied to radicals, kanji, and vocabulary progress rows

### Technical
- Updated `src/components/dashboard/level-progress.tsx`:
  - Changed stats container from `flex justify-between` to `flex flex-col sm:flex-row`
  - Added responsive alignment: `sm:items-center sm:justify-between`
  - Added responsive gaps: `gap-1 sm:gap-0` for row spacing, `gap-2 sm:gap-3` for stat items
  - Mobile breakpoint: 640px (Tailwind `sm`)

## [2.11.0] - 2025-12-20

### Added
- **Leeches Page: Interactive Detail Modal**: Click any leech item to view comprehensive details
  - **Large character display** with subject type badge (radical/kanji/vocabulary)
  - **Level and SRS stage** with color-coded SRS badge
  - **All meanings**: Display all accepted meanings for the item
  - **Readings breakdown**:
    - Kanji: On'yomi and Kun'yomi grouped separately
    - Vocabulary: All readings displayed
    - Radicals: Section hidden (no readings)
  - **Accuracy statistics**: Three-column grid showing overall, meaning, and reading accuracy percentages
  - **WaniKani link**: External link button to view item on WaniKani
  - Full dark/light mode support with smooth animations
  - Mobile responsive with scrollable content
- **Leeches Page: Readings Display**: Primary reading shown in table view
  - Displays primary reading with type indicator (on/kun) for kanji
  - Shows primary reading for vocabulary items
  - Compact format that maintains mobile compatibility
- **CSV Export: Readings Columns**: Enhanced leech export with reading data
  - **Three new columns**:
    - `On'yomi`: Comma-separated list for kanji, "N/A" for other types
    - `Kun'yomi`: Comma-separated list for kanji, "N/A" for other types
    - `Reading`: Comma-separated list for vocabulary, "N/A" for other types
  - All readings exported for comprehensive analysis
- **Settings: Burned Leeches Control**: New setting to control whether burned items appear in leeches list
  - **New "Leeches" section** in Settings page with toggle switch
  - **Default behavior**: Excludes burned items (SRS stage 9) to focus on active problem items
  - **When enabled**: Shows all items that met leech criteria, including those that eventually burned
  - Info tooltip explains the feature
  - Setting persisted to localStorage
- **Export Section: Dynamic Byline**: Export description updates based on burned leeches setting
  - Shows "Excludes burned items." when setting is OFF
  - Shows "Includes burned items." when setting is ON
  - Provides clear indication of what will be exported

### Changed
- **Leech Data Model**: Extended to include comprehensive reading and meaning data
  - Added `readings` object with on'yomi, kun'yomi, vocabulary arrays plus primary reading and type
  - Added `allMeanings` array with all accepted meanings (not just primary)
  - Added `documentUrl` for direct WaniKani links
- **Leeches Detection**: Enhanced to support burned item filtering
  - Added optional `includeBurned` parameter to `detectLeeches` function
  - Filters out SRS stage 9 items when `includeBurned` is false
  - Applied to both leeches page display and CSV export

### Technical
- Updated `src/lib/calculations/leeches.ts`:
  - Added `LeechReadings` interface for structured reading data
  - Extended `LeechItem` interface with `readings`, `allMeanings`, and `documentUrl` fields
  - Added `extractReadings()` helper function to parse readings from subject types
  - Modified `detectLeeches()` to extract readings from KanjiSubject and VocabularySubject
  - Added `includeBurned` option to threshold parameter with filter logic
- Added `src/components/leeches/leech-detail-modal.tsx`:
  - New modal component using base `Modal` with `size="lg"`
  - Sections for character, level/SRS, meanings, readings, accuracy stats, and WaniKani link
  - Uses `getSRSStageName()` to convert SRS stage numbers to badge types
  - Conditional rendering for readings based on subject type
  - Full dark/light mode support with `paper-*` / `ink-*` color tokens
- Updated `src/components/leeches/priority-list.tsx`:
  - Extended `DisplayLeechItem` interface with `reading`, `readingType`, and `fullLeech` fields
  - Added modal state management with `useState`
  - Updated mapping to include primary reading extraction
  - Added `onClick` handler to open modal for selected leech
  - Integrated `LeechDetailModal` component
- Updated `src/lib/export/export-manager.ts`:
  - Modified `exportLeeches()` signature to accept `options?: { includeBurned?: boolean }`
  - Added three new CSV columns for readings (On'yomi, Kun'yomi, Reading)
  - Passes `includeBurned` option to `detectLeeches()` call
- Updated `src/components/settings/data-export-section.tsx`:
  - Retrieves `includeBurnedLeeches` from settings store
  - Passes option to `exportLeeches()` call
  - Dynamic byline text based on setting value
- Updated `src/stores/settings-store.ts`:
  - Added `includeBurnedLeeches` boolean state (default: false)
  - Added `setIncludeBurnedLeeches` action
  - Persisted via Zustand's localStorage middleware
- Updated `src/pages/settings.tsx`:
  - Added "Leeches" section with toggle for "Include Burned Items"
  - Info tooltip explaining the feature
  - Follows existing toggle pattern with vermillion active state
- Updated `src/pages/leeches.tsx`:
  - Imports `includeBurnedLeeches` from settings store
  - Passes `{ includeBurned: includeBurnedLeeches }` to `detectLeeches()` call

## [2.10.0] - 2025-12-20

### Added
- **Progress Page: Level History Visualization Options**: Customizable display modes for level completion history
  - **New Settings Section**: "Level History Display" in Settings page with three visualization mode options
    - **Bar Chart (recommended)**: Vertical bars with logarithmic scale to handle outlier levels
    - **Level Cards**: Responsive grid of cards showing level number, days, and pace color
    - **Compact List**: Space-efficient colored badges in a flowing layout
  - **Logarithmic Scale for Bar Chart**: Solves disparity issue where outlier levels (100+ days) made regular levels (20-30 days) invisible
    - 800-day and 25-day levels now show ~2x visual difference instead of 32x linear difference
    - All bars remain visible and proportionally meaningful
    - Y-axis indicator shows "Scale: logarithmic" for clarity
  - **Consistent Card Design**: All level cards use neutral background with colored borders and text
    - Works uniformly across light and dark modes
    - Border and text colors indicate pace (fast/good/slow/very-slow)
  - **Preserved Features**: Standard deviation color coding maintained across all visualization modes
  - **Setting Persistence**: User's preferred visualization mode saved to localStorage

### Changed
- **Level History Bar Chart**: Switched from linear to logarithmic scale for better handling of level time disparities
  - Addresses common WaniKani user pattern: early levels taking hundreds of days before settling into consistent pace
  - Makes all bars readable regardless of outlier presence

### Technical
- Updated `src/stores/settings-store.ts`:
  - Added `levelHistoryMode` setting with type `'bar-chart' | 'cards' | 'compact-list'`
  - Added `setLevelHistoryMode` action
  - Default value: `'bar-chart'`
- Updated `src/pages/settings.tsx`:
  - Added "Level History Display" section with radio button UI
  - Three options with descriptions and tooltips explaining each visualization mode
- Updated `src/components/progress/level-timeline.tsx`:
  - Extracted bar chart rendering into `BarChartView` sub-component
  - Implemented logarithmic scale: `logScale = (days) => Math.log(days + 1)`
  - Created `CardsView` sub-component with responsive grid (5→8→10→12 columns)
  - Created `CompactListView` sub-component with colored pill badges
  - Added conditional rendering based on `levelHistoryMode` setting
  - All views maintain pace-based color coding and support dark mode

## [2.9.0] - 2025-12-20

### Added
- **Dashboard Level Progress Enhancement**: Navigate through level history with enhanced visualization
  - **Level Navigation**: Arrow buttons to browse previous levels while defaulting to current level
    - Left/right chevron buttons to step through levels
    - Left arrow disabled at level 1, right arrow disabled at current level
    - Selected level displayed in header
  - **Layered Progress Bars**: Visualize the gap between lessons started and items passed
    - Background layer (muted): Shows lessons started count
    - Foreground layer (vibrant): Shows guru'd items overlaid on top
    - Clear visual representation of learning progress vs mastery
  - **Enhanced Stats Display**: Both started and guru counts shown for each subject type
    - Format: "X/Y started · Z/Y guru · N%"
    - Radicals, kanji, and vocabulary all show dual metrics
  - **Past Level Completion Info**: Historical levels show completion date and duration
    - Format: "Passed MMM d, yyyy · X days"
    - Current level shows "X kanji to level up" or "Ready to level up!"
    - Not started levels show "Not started"

### Fixed
- **Reset Level Handling**: Correctly display completion status and duration for levels that were reset mid-level
  - Improved level progression record selection to prioritize completed progressions over abandoned ones
  - Fixes issue where reset levels showed "in progress" with incorrect day counts (e.g., 135 days instead of actual 20 days)
  - Now sorts progressions to find the one with `passed_at` for reset levels
  - Better validation in footer to ensure passed levels display completion date

### Technical
- Updated `src/lib/calculations/level-progress.ts`:
  - Extended `SubjectProgressData` interface to track both `started` (lessons completed) and `guru` (passed items)
  - Added `passedAt` and `isCurrentLevel` fields to `LevelProgressData` interface
  - Modified `calculateLevelProgress()` signature to accept `selectedLevel`, `userCurrentLevel`, and `levelPassedAt`
  - Updated calculation logic to count both `started_at !== null` and `srs_stage >= 5` separately
  - Days calculation now uses `passed_at` as end date for completed levels instead of current date
- Added `src/components/shared/layered-progress-bar.tsx`:
  - New component for overlapping progress visualization
  - Props: `backgroundValue`, `foregroundValue`, color classes, height, animation
  - Uses absolute positioning for layered bars with proper dark mode support
- Updated `src/components/dashboard/level-progress.tsx`:
  - Added state management for `selectedLevel` with `useState` and `useEffect`
  - Implemented level navigation with ChevronLeft/ChevronRight icons from lucide-react
  - Enhanced progression finding logic to handle reset levels (sort by `passed_at` presence)
  - Updated stats display to show both started and guru metrics
  - Replaced `ProgressBar` with `LayeredProgressBar` component
  - Improved footer with conditional rendering based on level status (current/passed/in-progress/not-started)
  - Added date formatting with `date-fns` format function

## [2.8.1] - 2025-12-14

### Fixed
- **Accuracy Page Skeleton Loading**: All accuracy components now show proper structured skeletons instead of loading text
  - **Accuracy Distribution**: Shows label/range/stats placeholders for each bucket with progress bars and footer
  - **Accuracy by Level (Time Heatmap)**: Shows title, level bars, stats, and insight box placeholders instead of "Loading accuracy by level..." text
  - **Type Breakdown**: Shows label/accuracy/count row with progress bar for each type (radicals, kanji, vocabulary)
  - Consistent with loading patterns across the rest of the application

## [2.8.0] - 2025-12-14

### Added
- **Progress Page Enhancement**: Three new comprehensive progress tracking components
  - **Knowledge Stability**: Monitor how well learned items "stick" in memory
    - Large stability ratio percentage showing solid vs fragile items
    - Visual breakdown bar (solid items in green, fragile items in red)
    - Breakdown by subject type (radicals, kanji, vocabulary)
    - "At-risk items" modal with configurable display limits (10/25/50/All)
    - Fragile items: those that passed Guru but fell back to Apprentice
    - Solid items: those that passed Guru and remain at Guru+ stages
    - Excludes burned items (permanently stable)
  - **Burn Velocity**: Track burn progress and trends over time
    - Circular progress ring showing total burn percentage
    - Burn statistics for 7/30/90 day periods with daily rates
    - Trend indicators (up/down/stable) comparing current vs previous periods
    - Projected "all burned" completion date based on current velocity
    - Remaining items counter
  - **Milestone Timeline**: Visual achievement journey with badges
    - Guru milestones: First Guru, 100, 500, 1000, 2500, All Guru (based on `passed_at`)
    - Burn milestones: First Burn, 100, 500, 1000, 2500, 5000, All Burned (based on `burned_at`)
    - Level milestones: 10, 20, 30, 40, 50, 60
    - Grid and timeline view toggle
    - Achievement badges with tooltips showing dates and descriptions
    - Next milestone preview with progress bar
    - Grayed out badges for upcoming achievements

### Fixed
- **Knowledge Stability Calculation**: Fixed logic to properly identify passed items
  - Now uses `passed_at` timestamp instead of `passed` boolean (consistent with rest of codebase)
  - Correctly counts items that have reached Guru stage
  - Properly tracks items that fell back from Guru to Apprentice
- **Level Milestone Tracking**: Fixed achievement detection for completed levels
  - Now uses `currentLevel > target` instead of relying on `passed_at` in progressions
  - Correctly shows levels as achieved when user has passed them (e.g., level 14 user shows level 10 as achieved)
  - Eliminates negative "X to go" display for already-completed levels

### Technical
- Added `src/lib/calculations/knowledge-stability.ts`:
  - `calculateKnowledgeStability()` - Main stability calculation
  - `getAtRiskItems()` - Identifies and sorts fragile items by SRS stage
  - TypeScript interfaces: `KnowledgeStability`, `AtRiskItem`, `TypeBreakdown`
- Added `src/lib/calculations/burn-velocity.ts`:
  - `calculateBurnVelocity()` - Main velocity calculation
  - `calculateBurnPeriod()` - Period-based burn counting
  - `calculateTrend()` - Trend comparison algorithm (>10% = up/down)
  - TypeScript interfaces: `BurnVelocity`, `BurnPeriod`
- Added `src/lib/calculations/milestones.ts`:
  - `calculateMilestones()` - Main milestone orchestration
  - `getBurnMilestones()` - Burn achievement tracking
  - `getGuruMilestones()` - Guru achievement tracking (using `passed_at`)
  - `getLevelMilestones()` - Level completion tracking
  - TypeScript interfaces: `Milestone`, `MilestoneTimeline`
- Added `src/components/progress/knowledge-stability.tsx`:
  - Main component with stability display and modal
  - Configurable at-risk item display limits
  - Loading skeleton matching component layout
- Added `src/components/progress/burn-velocity.tsx`:
  - `ProgressRing` SVG component for circular progress
  - `VelocityStat` component for period statistics
  - Loading skeleton with responsive design
- Added `src/components/progress/milestone-timeline.tsx`:
  - `MilestoneBadge` component with tooltips
  - `MilestoneTimelineItem` for chronological list view
  - `NextMilestonePreview` with progress bar
  - Grid/timeline view toggle
  - Loading skeleton
- Updated `src/pages/progress.tsx`:
  - New component order: Level60Projection → KnowledgeStability → BurnVelocity → MilestoneTimeline → LevelTimeline
  - All components maintain consistent spacing and responsive design

## [2.7.0] - 2025-12-14

### Added
- **Kanji Grid: Hidden Items Filter**: New setting to control visibility of curriculum-removed items
  - Items with `hidden_at` timestamp (removed from WaniKani curriculum) now hidden by default
  - Settings page includes "Show Removed Items" toggle in new "Kanji Grid" section
  - Helpful tooltip explains these are items studied before removal but no longer taught to new students
  - Filter respects whether user completed lessons before removal

### Changed
- **Readiness Page Hero Redesign**: Complete visual transformation for achievement-focused presentation
  - **Centered Hero Section**: Achievement is now the main character, not the color
    - Elegant centered layout matching Progress page's "Estimated Completion" aesthetic
    - Small uppercase label "CURRENT PROGRESS" with large grade number in ink colors
    - Secondary stats line with dot separators: "X kanji · Y% coverage · NZ level"
    - Subtle gradient divider with vermillion center accent
    - Threshold indicator badge: "Guru threshold · 1,995/2,136 Jōyō in WaniKani"
  - **Refined Metrics Grid**: Three key metrics remain but with reduced prominence
    - Jōyō Kanji ring reduced from 140px to 120px
    - Reading Coverage and JLPT numbers reduced from text-5xl to text-3xl
    - Numbers now in ink colors (not colored) with small colored icons for subtle accents
    - Labels more prominent than values for better hierarchy
  - **Updated Skeleton**: Loading state matches new centered hero design
- **Kanji Grid: SRS Filter Button Colors**: Buttons now match kanji block color scheme
  - Locked: Gray (paper-300/ink-300)
  - Apprentice: Purple (srs-apprentice)
  - Guru: Blue (srs-guru)
  - Master: Green (srs-master)
  - Enlightened: Gold (srs-enlightened)
  - Burned: Gray (srs-burned)
  - Visual consistency makes filtering more intuitive
- **Progress Page: Badge Wrapping**: Method indicator badge uses flex layout for graceful wrapping
  - Converts from inline text with `•` separators to flex container with visual dot separators
  - Items wrap at semantic boundaries (not mid-word) on small screens
  - Maintains rounded pill appearance even when wrapped
- **Progress Page: Modal Animations**: Excluded levels modal now uses app-standard animations
  - Replaced custom modal with shared `Modal` component
  - Consistent fade + scale animation (300ms, cubic-bezier ease-out)
  - Accessibility improvements: escape key, backdrop click, focus management
  - Mobile spacing improvements: responsive layout, increased padding and gaps

### Fixed
- **Settings Persistence**: Theme and all user preferences now survive app version updates
  - `clearLocalStorageExceptAuth()` now preserves both `wanikani-auth` AND `wanikani-settings`
  - Previously only auth token was preserved, causing theme reset to light mode on updates
- **Stale Chunk Errors**: Automatic recovery when navigating after new deployment
  - Created `lazyWithRetry()` wrapper for all lazy-loaded pages
  - Detects chunk load errors (old chunks missing after deployment)
  - Automatically reloads page to fetch new chunks (max 1 retry via sessionStorage)
  - Seamless experience - no error UI shown, just smooth reload
- **Progress Page: Skeleton Responsiveness**: Loading states now match component responsive behavior
  - Level60Projection skeleton: 4 milestones on mobile, 7 on desktop (was 7 always)
  - LevelTimeline skeleton: 8 bars on mobile, 15 on desktop with overflow-x-auto
  - Stats and legend use responsive gaps (gap-4 sm:gap-6)
- **Progress Page: Modal Mobile Layout**: Excluded levels modal better formatted on small screens
  - Increased spacing from space-y-2 to space-y-3
  - List items stack vertically on mobile, side-by-side on desktop (flex-col sm:flex-row)
  - Improved readability with responsive gaps and padding

### Technical
- Updated `src/stores/settings-store.ts`:
  - Added `showHiddenItems` boolean setting (default: false)
  - Added `setShowHiddenItems()` action
- Updated `src/components/kanji-grid/kanji-grid.tsx`:
  - Imported and applied `excludeHiddenSubjects` filter based on setting
  - Added `showHiddenItems` to enrichment dependencies
- Updated `src/lib/calculations/kanji-grid.ts`:
  - Added `hidden_at: string | null` to `EnrichedSubject` interface
  - Updated `enrichSubjectsWithSRS()` to preserve `hidden_at` field from subjects
- Updated `src/pages/settings.tsx`:
  - Added "Kanji Grid" settings section with toggle switch
- Updated `src/components/kanji-grid/kanji-grid-filters.tsx`:
  - Replaced uniform vermillion button colors with stage-specific colors
  - Added `stageColors` mapping object for active/inactive states
- Updated `src/components/progress/level-60-projection.tsx`:
  - Removed green badge (lines 37-57)
  - Added centered hero section with large grade display, stats line, divider, and badge
  - Refined three metrics: smaller sizes, ink-colored numbers, subtle icons
  - Imported `Modal` component and replaced custom modal markup
  - Enhanced mobile spacing in modal list items
  - Fixed badge flex layout for responsive wrapping
- Updated `src/components/jlpt/jlpt-hero.tsx`:
  - Removed `GraduationCap` icon import
  - Added `SRS_THRESHOLD_LABELS` import and `useSettingsStore` hook
  - Replaced green badge with centered hero section
  - Updated three metrics with reduced sizing and ink colors
- Updated `src/pages/readiness.tsx`:
  - Updated skeleton to match new centered hero layout
  - Refined metrics skeleton structure (label above, smaller circle)
- Updated `src/lib/cache/cache-manager.ts`:
  - `clearLocalStorageExceptAuth()` now preserves `wanikani-settings` in addition to `wanikani-auth`
- Created `src/lib/utils/lazy-with-retry.ts`:
  - Implements chunk load error detection and automatic page reload
  - Uses sessionStorage to prevent infinite reload loops
- Updated `src/App.tsx`:
  - All lazy-loaded pages now use `lazyWithRetry()` instead of `lazy()`
  - Removed unused `lazy` import from React

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

- **2.8.1** (Dec 14, 2025) - Fixed Accuracy Distribution skeleton loading state
- **2.8.0** (Dec 14, 2025) - Progress page enhancement: Knowledge Stability, Burn Velocity, Milestone Timeline
- **2.7.0** (Dec 14, 2025) - Readiness hero redesign, hidden items filter, UX improvements
- **2.6.0** (Dec 13, 2025) - Progress page redesign with journey milestones and level history chart
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
