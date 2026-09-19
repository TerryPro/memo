/* eslint-disable react-refresh/only-export-components */
import * as React from "react"

export type Theme = "dark" | "light" | "system"
export type Palette = "emerald" | "neutral" | "tangerine"
type ResolvedTheme = "dark" | "light"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
  defaultPalette?: Palette
  paletteStorageKey?: string
  disableTransitionOnChange?: boolean
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  palette: Palette
  setPalette: (palette: Palette) => void
}

const COLOR_SCHEME_QUERY = "(prefers-color-scheme: dark)"
const THEME_VALUES: Theme[] = ["dark", "light", "system"]
const PALETTE_VALUES: Palette[] = ["emerald", "neutral", "tangerine"]

const ThemeProviderContext = React.createContext<
  ThemeProviderState | undefined
>(undefined)

function isTheme(value: string | null): value is Theme {
  if (value === null) {
    return false
  }

  return THEME_VALUES.includes(value as Theme)
}

function isPalette(value: string | null): value is Palette {
  if (value === null) {
    return false
  }

  return PALETTE_VALUES.includes(value as Palette)
}

function getSystemTheme(): ResolvedTheme {
  if (window.matchMedia(COLOR_SCHEME_QUERY).matches) {
    return "dark"
  }

  return "light"
}

function disableTransitionsTemporarily() {
  const style = document.createElement("style")
  style.appendChild(
    document.createTextNode(
      "*,*::before,*::after{-webkit-transition:none!important;transition:none!important}"
    )
  )
  document.head.appendChild(style)

  return () => {
    window.getComputedStyle(document.body)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        style.remove()
      })
    })
  }
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  if (target.isContentEditable) {
    return true
  }

  const editableParent = target.closest(
    "input, textarea, select, [contenteditable='true']"
  )
  if (editableParent) {
    return true
  }

  return false
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "theme",
  defaultPalette = "emerald",
  paletteStorageKey = "palette",
  disableTransitionOnChange = true,
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(() => {
    const storedTheme = localStorage.getItem(storageKey)
    if (isTheme(storedTheme)) {
      return storedTheme
    }

    return defaultTheme
  })

  const [palette, setPaletteState] = React.useState<Palette>(() => {
    const storedPalette = localStorage.getItem(paletteStorageKey)
    if (isPalette(storedPalette)) {
      return storedPalette
    }

    return defaultPalette
  })

  const setTheme = React.useCallback(
    (nextTheme: Theme) => {
      localStorage.setItem(storageKey, nextTheme)
      setThemeState(nextTheme)
    },
    [storageKey]
  )

  const setPalette = React.useCallback(
    (nextPalette: Palette) => {
      localStorage.setItem(paletteStorageKey, nextPalette)
      setPaletteState(nextPalette)
    },
    [paletteStorageKey]
  )

  React.useEffect(() => {
    document.documentElement.setAttribute("data-palette", palette)
  }, [palette])

  const applyTheme = React.useCallback(
    (nextTheme: Theme) => {
      const root = document.documentElement
      const resolvedTheme =
        nextTheme === "system" ? getSystemTheme() : nextTheme
      const restoreTransitions = disableTransitionOnChange
        ? disableTransitionsTemporarily()
        : null

      root.classList.remove("light", "dark")
      root.classList.add(resolvedTheme)

      if (restoreTransitions) {
        restoreTransitions()
      }
    },
    [disableTransitionOnChange]
  )

  React.useEffect(() => {
    applyTheme(theme)

    if (theme !== "system") {
      return undefined
    }

    const mediaQuery = window.matchMedia(COLOR_SCHEME_QUERY)
    const handleChange = () => {
      applyTheme("system")
    }

    mediaQuery.addEventListener("change", handleChange)

    return () => {
      mediaQuery.removeEventListener("change", handleChange)
    }
  }, [theme, applyTheme])

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) {
        return
      }

      if (event.metaKey || event.ctrlKey || event.altKey) {
        return
      }

      if (isEditableTarget(event.target)) {
        return
      }

      if (event.key.toLowerCase() !== "d") {
        return
      }

      setThemeState((currentTheme) => {
        const nextTheme =
          currentTheme === "dark"
            ? "light"
            : currentTheme === "light"
              ? "dark"
              : getSystemTheme() === "dark"
                ? "light"
                : "dark"

        localStorage.setItem(storageKey, nextTheme)
        return nextTheme
      })
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [storageKey])

  React.useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.storageArea !== localStorage) {
        return
      }

      if (event.key === storageKey) {
        setThemeState(isTheme(event.newValue) ? event.newValue : defaultTheme)
        return
      }

      if (event.key === paletteStorageKey) {
        setPaletteState(
          isPalette(event.newValue) ? event.newValue : defaultPalette
        )
      }
    }

    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [defaultTheme, defaultPalette, storageKey, paletteStorageKey])

  const value = React.useMemo(
    () => ({
      theme,
      setTheme,
      palette,
      setPalette,
    }),
    [theme, setTheme, palette, setPalette]
  )

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = React.useContext(ThemeProviderContext)

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }

  return context
}
