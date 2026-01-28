'use client';

import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface TypewriterEffectProps {
  words: string[];
  className?: string;
  typingSpeed?: number;
  deletingSpeed?: number;
  delayBetweenWords?: number;
}

export function TypewriterEffect({
  words,
  className,
  typingSpeed = 100,
  deletingSpeed = 50,
  delayBetweenWords = 2000,
}: TypewriterEffectProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const longestWord = useMemo(
    () => words.reduce((longest, word) => (word.length > longest.length ? word : longest), ''),
    [words]
  );

  useEffect(() => {
    const currentWord = words[currentWordIndex];

    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          // Typing
          if (currentText.length < currentWord.length) {
            setCurrentText(currentWord.slice(0, currentText.length + 1));
          } else {
            // Finished typing, wait then start deleting
            setTimeout(() => setIsDeleting(true), delayBetweenWords);
          }
        } else {
          // Deleting
          if (currentText.length > 0) {
            setCurrentText(currentText.slice(0, -1));
          } else {
            // Finished deleting, move to next word
            setIsDeleting(false);
            setCurrentWordIndex((prev) => (prev + 1) % words.length);
          }
        }
      },
      isDeleting ? deletingSpeed : typingSpeed
    );

    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, currentWordIndex, words, typingSpeed, deletingSpeed, delayBetweenWords]);

  return (
    <span className={cn('relative inline-flex items-baseline justify-center', className)}>
      {/* Invisible word to reserve width and avoid layout shift */}
      <span className="invisible pointer-events-none select-none whitespace-pre">
        {longestWord}
      </span>

      {/* Actual text + cursor overlayed to keep cursor next to last character */}
      <span className="absolute inset-0 flex items-baseline justify-center">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600 whitespace-pre">
          {currentText}
        </span>
        <span className="inline-block w-[3px] h-[0.85em] ml-0.5 bg-gradient-to-b from-violet-600 to-indigo-600 animate-[blink_1s_step-end_infinite] rounded-sm" />
      </span>
    </span>
  );
}
