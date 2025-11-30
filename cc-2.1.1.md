# Roadmap for Enhanced Level Progress Calculations & Custom Modal System

## Overview
Two focused improvements to enhance UX consistency and data accuracy:
1. **Intelligent Level Averaging** - Filter out inactive periods for more accurate pace calculations
2. **Custom Modal System** - Replace browser `confirm()` with branded, consistent dialogs

---

## Part 1: Intelligent Level Averaging System

### Goal
Calculate a "learning pace" that represents active study periods, excluding extended breaks (vacations, multi-month gaps, etc.).

### Implementation Strategy

#### Step 1: Create Break Detection Utility
**File**: `src/lib/calculations/activity-analysis.ts`

```typescript
/**
 * Detects periods of inactivity in level progressions
 * Returns filtered progressions excluding break periods
 */

interface ActivityPeriod {
  level: number
  days: number
  isActive: boolean // false if this was a break period
  reason?: 'vacation' | 'extended_gap' | 'outlier'
}

// Detect breaks using multiple signals:
// 1. WaniKani vacation mode (check user.current_vacation_started_at)
// 2. Statistical outliers (levels taking 3x+ median time)
// 3. Configurable threshold (e.g., levels taking 60+ days)

function analyzeActivityPeriods(
  levelProgressions: LevelProgression[],
  options?: {
    outlierThreshold?: number // default: 3x median
    absoluteThreshold?: number // default: 60 days
  }
): ActivityPeriod[]

function getActiveLevelDurations(
  levelProgressions: LevelProgression[]
): Array<{ level: number; days: number }>

function calculateActiveAverage(
  levelProgressions: LevelProgression[]
): {
  activeAverage: number
  totalAverage: number
  excludedLevels: number[]
  method: 'median' | 'trimmed_mean' // use trimmed mean (drop top/bottom 10%)
}
```

**Key Logic**:
- Use **trimmed mean** (exclude top 10% and bottom 10% of level durations) rather than simple average
- Mark levels as "breaks" if they exceed 3× the median duration
- Provide transparency: show which levels were excluded and why

#### Step 2: Update Level Progress Calculations
**Files to modify**:
- `src/lib/calculations/level-progress.ts` - Add optional "active average" calculation
- `src/lib/calculations/forecasting.ts` - Update projection logic

**Changes**:

```typescript
// In level-progress.ts
export interface LevelProgressData {
  // ... existing fields
  averageDaysPerLevel: number // current total average
  activeDaysPerLevel: number // NEW: active learning average
  excludedLevels: number[] // NEW: which levels were filtered out
}

// In forecasting.ts
export interface Level60Projection {
  // ... existing fields
  expectedActive: Date // NEW: projection using active average
  averageDaysPerLevel: number // existing total average
  activeDaysPerLevel: number // NEW: active average
  excludedLevels: Array<{ // NEW: transparency
    level: number
    days: number
    reason: string
  }>
}

// Update projectLevel60Date to:
// 1. Accept an optional "useActiveAverage" flag
// 2. Calculate both total and active projections
// 3. Default to showing active projection as primary
```

#### Step 3: Update UI Components
**Files to modify**:
- `src/components/progress/level-60-projection.tsx`
- `src/components/dashboard/level-progress.tsx`

**Changes to Level60Projection component**:

```tsx
// Show active average as the primary "Expected" projection
// Add a subtle indicator showing filtered data

<div className="bg-vermillion-500/10 dark:bg-vermillion-500/20 border border-vermillion-500/20 dark:border-vermillion-500/30 rounded-lg p-8 mb-8 text-center">
  <div className="text-sm text-ink-400 dark:text-paper-300 mb-2">Estimated</div>
  <div className="text-2xl font-display font-semibold text-vermillion-500 mb-1">
    {format(projection.expectedActive, 'MMMM yyyy')}
  </div>
  <div className="text-sm text-ink-400 dark:text-paper-300">
    {formatDistanceToNow(projection.expectedActive, { addSuffix: false })} remaining
  </div>
  
  {/* NEW: Subtle indicator when data is filtered */}
  {projection.excludedLevels.length > 0 && (
    <div className="mt-4 text-xs text-ink-400 dark:text-paper-300">
      Based on {completedLevels - projection.excludedLevels.length} active levels
      <button 
        onClick={() => setShowExcludedLevels(true)}
        className="ml-2 text-vermillion-500 hover:underline"
      >
        (details)
      </button>
    </div>
  )}
</div>

// Update scenarios to show both:
const scenarios: Scenario[] = projection
  ? [
      {
        icon: Rocket,
        label: 'Fast track',
        date: projection.fastTrack,
        pace: '8 days/level',
        color: 'text-patina-500',
      },
      {
        icon: TrendingUp,
        label: 'Expected (active)',
        date: projection.expectedActive,
        pace: `${Math.round(projection.activeDaysPerLevel)} days/level`,
        color: 'text-ink-100',
      },
      {
        icon: Activity, // NEW: Show total average as reference
        label: 'All levels average',
        date: projection.expected,
        pace: `${Math.round(projection.averageDaysPerLevel)} days/level`,
        color: 'text-ink-400',
      },
      {
        icon: Turtle,
        label: 'Conservative',
        date: projection.conservative,
        pace: `${Math.round(projection.activeDaysPerLevel * 1.5)} days/level`,
        color: 'text-ink-400',
      },
    ]
  : []
```

**Add excluded levels details modal** (we'll build the modal system next):

```tsx
{showExcludedLevels && (
  <Modal onClose={() => setShowExcludedLevels(false)}>
    <div className="p-6">
      <h3 className="text-lg font-display font-semibold mb-4">
        Filtered Levels
      </h3>
      <p className="text-sm text-ink-400 dark:text-paper-300 mb-4">
        These levels were excluded from your active average to provide a more 
        accurate learning pace estimate:
      </p>
      <div className="space-y-2">
        {projection.excludedLevels.map(level => (
          <div key={level.level} className="flex justify-between text-sm p-2 bg-paper-300 dark:bg-ink-300 rounded">
            <span>Level {level.level}</span>
            <span>{level.days} days ({level.reason})</span>
          </div>
        ))}
      </div>
    </div>
  </Modal>
)}
```

#### Step 4: Settings Toggle
**File**: `src/stores/settings-store.ts`

Add user preference:

```typescript
interface SettingsState {
  // ... existing
  useActiveAverage: boolean // default: true
  
  // Actions
  setUseActiveAverage: (value: boolean) => void
}
```

**File**: `src/pages/settings.tsx`

Add toggle in settings:

```tsx
<div className="bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 p-6 shadow-sm">
  <h2 className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100 mb-4">
    Progress Calculations
  </h2>
  <div className="space-y-4">
    <label className="flex items-center justify-between">
      <div>
        <div className="text-sm font-medium text-ink-100 dark:text-paper-100">
          Use active learning average
        </div>
        <div className="text-xs text-ink-400 dark:text-paper-300 mt-1">
          Excludes extended breaks and vacation periods from pace calculations
        </div>
      </div>
      <input
        type="checkbox"
        checked={useActiveAverage}
        onChange={(e) => setUseActiveAverage(e.target.checked)}
        className="toggle" // style this appropriately
      />
    </label>
  </div>
</div>
```

---

## Part 2: Custom Modal System

### Goal
Replace all `confirm()`, `alert()`, and future dialog needs with a branded modal system that matches the app's warm, paper aesthetic.

### Implementation Strategy

#### Step 1: Create Modal Components
**File**: `src/components/shared/modal.tsx`

```tsx
import { ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Modal({ isOpen, onClose, children, size = 'md', className }: ModalProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
  }

  return (
    <>
      {/* Backdrop - warm charcoal tint matching mobile nav */}
      <div
        className="fixed inset-0 z-50 bg-ink-100/50 dark:bg-paper-100/20 transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal - centered, warm paper */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className={cn(
            'pointer-events-auto w-full bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 shadow-xl',
            'transform transition-all duration-300',
            sizeClasses[size],
            className
          )}
          role="dialog"
          aria-modal="true"
        >
          {children}
        </div>
      </div>
    </>
  )
}

// Close button component for consistency
export function ModalClose({ onClose }: { onClose: () => void }) {
  return (
    <button
      onClick={onClose}
      className="absolute top-4 right-4 p-2 rounded-md hover:bg-paper-300 dark:hover:bg-ink-300 transition-smooth focus-ring"
      aria-label="Close"
    >
      <X className="w-5 h-5 text-ink-400 dark:text-paper-300" />
    </button>
  )
}
```

**File**: `src/components/shared/confirm-dialog.tsx`

```tsx
import { AlertTriangle, Info, CheckCircle } from 'lucide-react'
import { Modal } from './modal'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  const variants = {
    danger: {
      icon: AlertTriangle,
      iconColor: 'text-vermillion-500 dark:text-vermillion-400',
      bgColor: 'bg-vermillion-500/10 dark:bg-vermillion-500/20',
      borderColor: 'border-vermillion-500/20 dark:border-vermillion-500/30',
      buttonColor: 'bg-vermillion-500 hover:bg-vermillion-600 text-paper-100 dark:text-ink-100',
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-ochre',
      bgColor: 'bg-ochre/10',
      borderColor: 'border-ochre/20',
      buttonColor: 'bg-ochre hover:bg-ochre/90 text-paper-100',
    },
    info: {
      icon: Info,
      iconColor: 'text-patina-500 dark:text-patina-400',
      bgColor: 'bg-patina-500/10 dark:bg-patina-500/20',
      borderColor: 'border-patina-500/20 dark:border-patina-500/30',
      buttonColor: 'bg-patina-500 hover:bg-patina-600 text-paper-100',
    },
  }

  const config = variants[variant]
  const Icon = config.icon

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="p-6">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-full ${config.bgColor} border ${config.borderColor} flex items-center justify-center mx-auto mb-4`}>
          <Icon className={`w-6 h-6 ${config.iconColor}`} />
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-display font-semibold text-ink-100 dark:text-paper-100 mb-2">
            {title}
          </h3>
          <p className="text-sm text-ink-400 dark:text-paper-300">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium rounded-md border border-paper-300 dark:border-ink-300 text-ink-100 dark:text-paper-100 hover:bg-paper-300 dark:hover:bg-ink-300 transition-smooth focus-ring"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-smooth focus-ring ${config.buttonColor}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}
```

#### Step 2: Create Modal Hook for Easy Usage
**File**: `src/hooks/use-confirm.tsx`

```tsx
import { useState, useCallback, ReactNode } from 'react'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'

interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null)

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts)
    setIsOpen(true)

    return new Promise((resolve) => {
      setResolvePromise(() => resolve)
    })
  }, [])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    if (resolvePromise) {
      resolvePromise(false)
      setResolvePromise(null)
    }
  }, [resolvePromise])

  const handleConfirm = useCallback(() => {
    if (resolvePromise) {
      resolvePromise(true)
      setResolvePromise(null)
    }
    setIsOpen(false)
  }, [resolvePromise])

  const ConfirmDialogComponent = options ? (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={handleClose}
      onConfirm={handleConfirm}
      {...options}
    />
  ) : null

  return { confirm, ConfirmDialog: ConfirmDialogComponent }
}

// Usage example:
// const { confirm, ConfirmDialog } = useConfirm()
// 
// const handleDelete = async () => {
//   const confirmed = await confirm({
//     title: 'Delete item?',
//     message: 'This action cannot be undone.',
//     variant: 'danger'
//   })
//   if (confirmed) {
//     // do deletion
//   }
// }
// 
// return (
//   <>
//     <button onClick={handleDelete}>Delete</button>
//     {ConfirmDialog}
//   </>
// )
```

#### Step 3: Replace All Browser Confirms
Update these files to use the new modal system:

**Files to update**:
1. `src/components/layout/header.tsx` - logout confirmation
2. `src/components/layout/mobile-nav.tsx` - logout confirmation
3. `src/pages/settings.tsx` - force sync, disconnect confirmations
4. `src/components/settings/api-token-input.tsx` - logout confirmation

**Example for header.tsx**:

```tsx
import { useConfirm } from '@/hooks/use-confirm'

export function Header() {
  // ... existing code
  const { confirm, ConfirmDialog } = useConfirm()

  const handleLogout = async () => {
    const confirmed = await confirm({
      title: 'Disconnect Account?',
      message: "You'll need to re-enter your API token to reconnect.",
      confirmText: 'Disconnect',
      cancelText: 'Cancel',
      variant: 'warning',
    })

    if (confirmed) {
      await clearAuth()
      setShowMenu(false)
    }
  }

  return (
    <>
      <header className="...">
        {/* existing header content */}
      </header>
      {ConfirmDialog}
    </>
  )
}
```

**Example for settings.tsx**:

```tsx
import { useConfirm } from '@/hooks/use-confirm'

export function Settings() {
  const { confirm, ConfirmDialog } = useConfirm()

  const handleForceSync = async () => {
    const confirmed = await confirm({
      title: 'Force Full Sync?',
      message: 'This will re-download all your data from WaniKani. Your existing cache will be cleared.',
      confirmText: 'Continue',
      cancelText: 'Cancel',
      variant: 'warning',
    })

    if (confirmed) {
      await forceSync()
    }
  }

  const handleLogout = async () => {
    const confirmed = await confirm({
      title: 'Disconnect & Clear Data?',
      message: 'This will clear your API token and all locally cached data. This action cannot be undone.',
      confirmText: 'Disconnect',
      cancelText: 'Cancel',
      variant: 'danger',
    })

    if (confirmed) {
      await clearAuth()
    }
  }

  return (
    <>
      {/* settings content */}
      {ConfirmDialog}
    </>
  )
}
```

#### Step 4: Create Toast Notification System (Bonus)
While we're building the modal system, add non-blocking notifications for success states.

**File**: `src/components/shared/toast.tsx`

```tsx
import { useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  duration?: number
  onClose: () => void
}

export function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  const types = {
    success: {
      icon: CheckCircle,
      bg: 'bg-patina-500/10 dark:bg-patina-500/20',
      border: 'border-patina-500/20 dark:border-patina-500/30',
      iconColor: 'text-patina-500 dark:text-patina-400',
    },
    error: {
      icon: AlertCircle,
      bg: 'bg-vermillion-500/10 dark:bg-vermillion-500/20',
      border: 'border-vermillion-500/20 dark:border-vermillion-500/30',
      iconColor: 'text-vermillion-500 dark:text-vermillion-400',
    },
    info: {
      icon: Info,
      bg: 'bg-paper-300 dark:bg-ink-300',
      border: 'border-paper-400 dark:border-ink-400',
      iconColor: 'text-ink-400 dark:text-paper-300',
    },
  }

  const config = types[type]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 max-w-sm',
        'bg-paper-200 dark:bg-ink-200 rounded-lg border shadow-lg',
        'transform transition-all duration-300',
        config.border
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.bg}`}>
          <Icon className={`w-5 h-5 ${config.iconColor}`} />
        </div>
        <p className="text-sm text-ink-100 dark:text-paper-100 flex-1 pt-2">
          {message}
        </p>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-paper-300 dark:hover:bg-ink-300 transition-smooth"
        >
          <X className="w-4 h-4 text-ink-400 dark:text-paper-300" />
        </button>
      </div>
    </div>
  )
}
```

**File**: `src/hooks/use-toast.tsx`

```tsx
import { useState, useCallback } from 'react'
import { Toast } from '@/components/shared/toast'

interface ToastOptions {
  message: string
  type?: 'success' | 'error' | 'info'
  duration?: number
}

export function useToast() {
  const [toasts, setToasts] = useState<Array<ToastOptions & { id: number }>>([])

  const showToast = useCallback((options: ToastOptions) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { ...options, id }])
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const ToastContainer = (
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  )

  return { showToast, ToastContainer }
}
```

**Usage in sync operations** (`src/hooks/use-sync.ts`):

```tsx
// Add toast to sync hook
const { showToast, ToastContainer } = useToast()

const sync = useCallback(async (force = false) => {
  // ... existing sync logic
  
  try {
    const result = await syncFn(token, setProgress)
    
    if (result.success) {
      showToast({
        message: 'Data synced successfully',
        type: 'success',
      })
    }
    
    return result
  } catch (err) {
    showToast({
      message: err instanceof Error ? err.message : 'Sync failed',
      type: 'error',
    })
    throw err
  }
}, [token, showToast])

return { sync, ToastContainer, /* ... */ }
```

---

## Testing Checklist

### Part 1: Active Average
- [ ] Active average correctly excludes outliers (3x+ median)
- [ ] UI shows both active and total averages
- [ ] Excluded levels are displayed with reasons
- [ ] Settings toggle properly switches calculation method
- [ ] Level 60 projection updates based on active average
- [ ] Edge cases: users with <3 completed levels, users with all levels similar

### Part 2: Modal System
- [ ] Modals appear centered with proper backdrop
- [ ] Escape key closes modals
- [ ] Click outside closes modals
- [ ] Logout confirmation works in header
- [ ] Logout confirmation works in mobile nav
- [ ] Force sync confirmation works
- [ ] Disconnect confirmation works
- [ ] Modal animations are smooth (300ms)
- [ ] Focus is trapped within modal when open
- [ ] Modals are accessible (aria labels, keyboard nav)
- [ ] Toasts auto-dismiss after 3 seconds
- [ ] Multiple toasts stack properly

---

## File Structure Summary

### New Files
```
src/
├── components/
│   └── shared/
│       ├── modal.tsx                    # Base modal component
│       ├── confirm-dialog.tsx           # Confirmation dialog
│       └── toast.tsx                    # Toast notification
├── hooks/
│   ├── use-confirm.tsx                  # Confirmation hook
│   └── use-toast.tsx                    # Toast hook
└── lib/
    └── calculations/
        └── activity-analysis.ts          # Break detection logic
```

### Modified Files
```
src/
├── components/
│   ├── dashboard/
│   │   └── level-progress.tsx           # Show active average
│   ├── layout/
│   │   ├── header.tsx                   # Use confirm modal
│   │   └── mobile-nav.tsx               # Use confirm modal
│   ├── progress/
│   │   └── level-60-projection.tsx      # Show active projections
│   └── settings/
│       └── api-token-input.tsx          # Use confirm modal
├── hooks/
│   └── use-sync.ts                      # Add toast notifications
├── lib/
│   └── calculations/
│       ├── forecasting.ts               # Use active average
│       └── level-progress.ts            # Calculate active average
├── pages/
│   └── settings.tsx                     # Add average toggle, use modals
└── stores/
    └── settings-store.ts                # Add useActiveAverage preference
```

---

## Design Tokens to Maintain Consistency

All modals and dialogs should use:

**Spacing**:
- Modal padding: `p-6` (24px)
- Content spacing: `space-y-4` between sections
- Button gap: `gap-3` (12px)

**Colors**:
- Background: `bg-paper-200 dark:bg-ink-200`
- Border: `border-paper-300 dark:border-ink-300`
- Backdrop: `bg-ink-100/50 dark:bg-paper-100/20`
- Danger: `bg-vermillion-500` / `text-vermillion-500`
- Success: `bg-patina-500` / `text-patina-500`
- Warning: `bg-ochre` / `text-ochre`

**Typography**:
- Title: `text-lg font-display font-semibold`
- Body: `text-sm text-ink-400 dark:text-paper-300`
- Button text: `text-sm font-medium`

**Transitions**:
- Duration: `300ms` (consistent with mobile nav)
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (from globals.css)

---

This roadmap provides Claude Code with clear, actionable steps to implement both features while maintaining your app's design language and UX consistency. Each component is self-contained and follows your existing patterns.
