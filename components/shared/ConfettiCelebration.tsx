'use client';

import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiCelebrationProps {
  onComplete?: () => void;
  message?: string;
}

const MOTIVATIONAL_QUOTES = [
  "You helped make a difference today!",
  "A cleaner city starts with you!",
  "Your civic duty is much appreciated!",
  "Every report brings us closer to a better tomorrow.",
  "Thank you for being an active citizen!",
  "Small actions lead to massive changes!"
];

export function ConfettiCelebration({ onComplete }: ConfettiCelebrationProps) {
  const [quote, setQuote] = useState("You helped make a difference today!");

  useEffect(() => {
    setQuote(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);
  }, []);
  useEffect(() => {
    const duration = 2.5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);

    const timeout = setTimeout(() => {
      if (onComplete) onComplete();
    }, 4000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="w-20 h-20 mx-auto bg-[var(--saffron-light)] text-[var(--saffron)] rounded-full flex items-center justify-center text-4xl mb-4 shadow-inner">
          🎉
        </div>
        <h2 className="text-2xl font-bold mb-2 text-[var(--ink)]" style={{ fontFamily: 'var(--font-mukta)' }}>Awesome Job!</h2>
        <p className="text-[var(--ink-muted)] mb-6">{quote}</p>
        <button 
          onClick={onComplete}
          className="btn-primary w-full justify-center"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
