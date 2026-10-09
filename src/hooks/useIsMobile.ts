import { useSyncExternalStore } from 'react'

const QUERY = '(pointer: coarse)'
const get = () => typeof matchMedia !== 'undefined' && matchMedia(QUERY).matches

function subscribe(cb: () => void) {
  const m = matchMedia(QUERY)
  m.addEventListener('change', cb)
  return () => m.removeEventListener('change', cb)
}

export const isTouchDevice = get

export function useIsMobile() {
  return useSyncExternalStore(subscribe, get, () => false)
}