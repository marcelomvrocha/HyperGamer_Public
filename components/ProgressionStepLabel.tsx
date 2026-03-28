'use client';

import { getProgressionStep, type NextTarget } from '@/lib/progression';

const STEPS: Array<'Reps' | 'Tempo' | 'Pause' | 'Technique'> = [
  'Reps',
  'Tempo',
  'Pause',
  'Technique',
];

export function ProgressionStepLabel({ sets }: { sets: NextTarget['sets'] }) {
  const current = getProgressionStep(sets);
  const tooltip = 'Progression order: Reps → Tempo → Pause → Technique. Highlighted step is current.';

  return (
    <div
      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/60 px-2 py-1 text-[11px] font-medium text-slate-600 shadow-sm dark:bg-slate-900/60 dark:text-slate-300"
      title={tooltip}
      aria-label={tooltip}
    >
      {STEPS.map((step, idx) => {
        const active = step === current;
        return (
          <span key={step} className="inline-flex items-center gap-1">
            <span
              className={
                active
                  ? 'text-emerald-600 dark:text-emerald-300 font-semibold'
                  : 'text-slate-500/80'
              }
            >
              {step}
            </span>
            {idx < STEPS.length - 1 ? <span className="text-slate-400">→</span> : null}
          </span>
        );
      })}
    </div>
  );
}
