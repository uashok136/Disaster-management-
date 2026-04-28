import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App.jsx';
import '@/index.css';

const THEME_STORAGE_KEY = 'disaster_theme_preference_v1';

const resolveTheme = (theme) => {
  if (theme !== 'system' || typeof window === 'undefined') {
    return theme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyStoredTheme = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY) || 'system';
  const resolvedTheme = resolveTheme(storedTheme);

  document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
  document.documentElement.style.colorScheme = resolvedTheme;
};

applyStoredTheme();

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
