import type { MaybeAccessor } from '../access'
import { observable } from 'solid-js'
import { access } from '../access'

export function until<T>(value: MaybeAccessor<T>) {
  const obsv = observable(() => access(value))
  let lastUnsubscribe: (() => void) | null
  const toBe = (v: any) => {
    return new Promise<T>((resolve) => {
      if (lastUnsubscribe) {
        lastUnsubscribe()
        lastUnsubscribe = null
      }
      const { unsubscribe } = obsv.subscribe((newValue) => {
        if (newValue === v) {
          resolve(newValue)
          unsubscribe()
        }
      })
      lastUnsubscribe = unsubscribe
    })
  }
  return {
    toBe,
  }
}
