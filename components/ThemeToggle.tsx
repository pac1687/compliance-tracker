'use client';

import React, { useSyncExternalStore } from 'react';
import { Sun, Moon } from 'lucide-react';

const emptySubscribe = () => () => {};

export default function ThemeToggle() {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const isDark = useSyncExternalStore(
    (onStoreChange) => {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', onStoreChange);
      window.addEventListener('storage', onStoreChange);
      return () => {
        mediaQuery.removeEventListener('change', onStoreChange);
        window.removeEventListener('storage', onStoreChange);
      };
    },
    () => {
      if (typeof window === 'undefined') return false;
      return (
        localStorage.theme === 'dark' ||
        (!('theme' in localStorage) &&
          window.matchMedia('(prefers-color-scheme: dark)').matches)
      );
    },
    () => false
  );

  const toggleTheme = () => {
    const nextDark = !isDark;
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    }
    window.dispatchEvent(new Event('storage'));
  };

  if (!isClient) {
    return (
      <div className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-400 transition-transform hover:rotate-45" />
      ) : (
        <Moon className="h-4 w-4 text-slate-600 transition-transform hover:-rotate-12" />
      )}
    </button>
  );
}
