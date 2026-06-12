import type { TrainerCard } from '@/lib/calculations/trainer-pools'
import { AudioButton } from './audio-button'

interface QuizCardProps {
  card: TrainerCard
  phase: 'front' | 'revealed'
  onReveal: () => void
  onPlayAudio: (url: string) => void
  failedAudioUrl: string | null
}

export function QuizCard({ card, phase, onReveal, onPlayAudio, failedAudioUrl }: QuizCardProps) {
  if (phase === 'front') {
    return (
      <button
        onClick={onReveal}
        className="w-full min-h-[20rem] flex flex-col items-center justify-center gap-6 p-8 rounded-lg border border-paper-300 dark:border-ink-300 bg-paper-200 dark:bg-ink-200 hover:bg-paper-300 dark:hover:bg-ink-300 transition-smooth shadow-sm cursor-pointer focus-ring"
      >
        <span className="text-7xl sm:text-8xl font-japanese text-ink-100 dark:text-paper-100">
          {card.character}
        </span>
        <span className="text-sm text-ink-400 dark:text-paper-300">
          Tap to reveal <span className="hidden sm:inline">(Space)</span>
        </span>
      </button>
    )
  }

  return (
    <div className="w-full min-h-[20rem] flex flex-col items-center justify-center gap-5 p-8 rounded-lg border border-paper-300 dark:border-ink-300 bg-paper-200 dark:bg-ink-200 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="text-5xl sm:text-6xl font-japanese text-ink-100 dark:text-paper-100">
          {card.character}
        </span>
        <span className="px-2 py-1 rounded-md bg-paper-300 dark:bg-ink-300 text-xs font-medium text-ink-400 dark:text-paper-300 capitalize">
          {card.type}
        </span>
        {card.audioUrl && (
          <AudioButton
            url={card.audioUrl}
            onPlay={onPlayAudio}
            failed={failedAudioUrl === card.audioUrl}
          />
        )}
      </div>

      {/* Readings */}
      {card.type === 'radical' ? (
        <div className="text-sm text-ink-400 dark:text-paper-300">Radicals have no reading</div>
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {card.type === 'kanji' ? (
            <>
              {card.readings.onyomi.map((reading, idx) => (
                <span
                  key={`on-${idx}`}
                  className="px-3 py-1.5 rounded-md bg-paper-300/50 dark:bg-ink-300/50 text-lg font-japanese text-ink-100 dark:text-paper-100"
                >
                  {reading}
                  <span className="text-xs text-ink-400 dark:text-paper-300 ml-1.5">on</span>
                </span>
              ))}
              {card.readings.kunyomi.map((reading, idx) => (
                <span
                  key={`kun-${idx}`}
                  className="px-3 py-1.5 rounded-md bg-paper-300/50 dark:bg-ink-300/50 text-lg font-japanese text-ink-100 dark:text-paper-100"
                >
                  {reading}
                  <span className="text-xs text-ink-400 dark:text-paper-300 ml-1.5">kun</span>
                </span>
              ))}
            </>
          ) : (
            card.readings.vocabulary.map((reading, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 rounded-md bg-paper-300/50 dark:bg-ink-300/50 text-lg font-japanese text-ink-100 dark:text-paper-100"
              >
                {reading}
              </span>
            ))
          )}
        </div>
      )}

      {/* Meanings */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {card.allMeanings.map((meaning, idx) => (
          <span
            key={idx}
            className="px-3 py-1.5 rounded-md bg-paper-300/50 dark:bg-ink-300/50 text-base text-ink-100 dark:text-paper-100"
          >
            {meaning}
          </span>
        ))}
      </div>
    </div>
  )
}
