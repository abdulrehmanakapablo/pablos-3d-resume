import { useCallback, useSyncExternalStore } from 'react'

const get = () => !!document.fullscreenElement
function subscribe(cb: () => void) {
  document.addEventListener('fullscreenchange', cb)
  return () => document.removeEventListener('fullscreenchange', cb)
}

export function useFullscreen() {
  const active = useSyncExternalStore(subscribe, get, () => false)
  const supported = typeof document !== 'undefined' && typeof document.documentElement.requestFullscreen === 'function'

  const toggle = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
        return
      }
      await document.documentElement.requestFullscreen()
      const o = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }
      await o.lock?.('landscape').catch(() => undefined)
    } catch {
      /* unsupported (iOS Safari) */
    }
  }, [])

  return { active, supported, toggle }
}