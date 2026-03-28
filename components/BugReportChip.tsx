'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';

const BUG_ICONS = ['🐛', '🪲', '🐞', '🕷️', '🪳', '🐜', '🪰', '🦟', '🐝', '🦗'] as const;
const BUG_MESSAGES = [
  'Report a bug!',
  'Another one?',
  'Oh... ok!',
  "We'll fix it.",
  'Crush this bug!',
  'Bug spotted!',
  'Tell us what broke.',
  'Patch this bug.',
  'Found a glitch?',
  'Thanks a lot!',
] as const;

function getRandomItemExcluding(current: string, items: readonly string[]): string {
  if (items.length <= 1) return current;

  let next = current;
  while (next === current) {
    next = items[Math.floor(Math.random() * items.length)];
  }
  return next;
}

function getAudioContext(existing: AudioContext | null): AudioContext | null {
  if (existing) return existing;
  if (typeof window === 'undefined') return null;
  const AudioContextCtor =
    window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return null;
  return new AudioContextCtor();
}

function playClickSound(ctx: AudioContext | null) {
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    void ctx.resume();
  }

  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(1600, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(950, ctx.currentTime + 0.04);

  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.14, ctx.currentTime + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.075);

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.08);
}

export function BugReportChip() {
  const [icon, setIcon] = useState<string>(BUG_ICONS[0]);
  const [message, setMessage] = useState<string>(BUG_MESSAGES[0]);
  const didHoverRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const expandedWidthPx = Math.max(150, message.length * 8 + 44);

  return (
    <Link
      href="/report"
      className="bug-chip"
      aria-label="Report a bug"
      style={{ ['--bug-chip-expanded-width' as string]: `${expandedWidthPx}px` }}
      onMouseEnter={() => {
        didHoverRef.current = true;
        audioCtxRef.current = getAudioContext(audioCtxRef.current);
        playClickSound(audioCtxRef.current);
        setMessage(current => getRandomItemExcluding(current, BUG_MESSAGES));
      }}
      onMouseLeave={() => {
        if (!didHoverRef.current) return;
        setIcon(current => getRandomItemExcluding(current, BUG_ICONS));
        didHoverRef.current = false;
      }}
    >
      <span className="bug-chip-icon" aria-hidden="true">{icon}</span>
      <span className="bug-chip-overlay" aria-hidden="true">{message}</span>
    </Link>
  );
}
