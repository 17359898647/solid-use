import type { MaybeAccessor } from '../access'
import { observable } from 'solid-js'
import { access } from '../access'

export interface IUntilTypeReturn {
  toBe: (v: any) => Promise<void>
}

export function until(value: MaybeAccessor): IUntilTypeReturn {
  const obsv = observable(() => access(value))
  let lastUnsubscribe: (() => void) | null
  const toBe = (v: any) => {
    return new Promise<void>((resolve) => {
      if (lastUnsubscribe) {
        lastUnsubscribe()
        lastUnsubscribe = null
      }
      const { unsubscribe } = obsv.subscribe((newValue) => {
        if (newValue === v) {
          resolve()
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
