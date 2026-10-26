import { useEffect, useState } from 'react'

const STORAGE_KEY = 'school-manager-theme'

function getInitial(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return stored === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  } catch {
    return false
  }
}

export function useDarkMode() {
  const [isDark, setIsDark] = useState(getInitial)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    try {
      localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light')
    } catch {
      // ignore storage errors (private browsing, etc.)
    }
  }, [isDark])

  return { isDark, toggle: () => setIsDark((v) => !v) }
}
