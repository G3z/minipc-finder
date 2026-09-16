import { useEffect, useState } from 'preact/hooks';

type Theme = 'light' | 'dark' | 'system';
const themes: { value: Theme; label: string; icon: string }[] = [
  { value: 'light', label: 'Use light theme', icon: '☀' }, { value: 'dark', label: 'Use dark theme', icon: '◐' }, { value: 'system', label: 'Use system theme', icon: '◉' },
];
const applyTheme = (theme: Theme) => { const resolved = theme === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme; document.documentElement.dataset.theme = resolved; document.documentElement.style.colorScheme = resolved; };

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system');
  useEffect(() => { const stored = localStorage.getItem('theme'); const initial: Theme = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'; setTheme(initial); applyTheme(initial); }, []);
  useEffect(() => { const media = matchMedia('(prefers-color-scheme: dark)'); const change = () => theme === 'system' && applyTheme('system'); media.addEventListener('change', change); return () => media.removeEventListener('change', change); }, [theme]);
  const selectTheme = (next: Theme) => { localStorage.setItem('theme', next); setTheme(next); applyTheme(next); };
  return <div class="theme-toggle" role="group" aria-label="Color theme">{themes.map(({ value, label, icon }) => <button type="button" aria-label={label} aria-pressed={theme === value} onClick={() => selectTheme(value)}>{icon}</button>)}</div>;
}
