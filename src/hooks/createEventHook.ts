import { onCleanup } from 'solid-js'

type IsAny<T> = unknown extends T ? ([keyof T] extends [never] ? false : true) : false

type cb<T> =
  IsAny<T> extends true
    ? (...param: any) => void
    : [T] extends [void]
        ? (...param: unknown[]) => void
        : (...param: [T, ...unknown[]]) => void

export type EventHookOn<T = any> = (fn: cb<T>) => { off: () => void }
export type EventHookOff<T = any> = (fn: cb<T>) => void
export type EventHookTrigger<T = any> = (
  ...param: IsAny<T> extends true ? unknown[] : [T, ...unknown[]]
) => Promise<unknown[]>

export interface EventHook<T = any> {
  off: EventHookOff<T>
  on: EventHookOn<T>
  trigger: EventHookTrigger<T>
}

export function createEventHook<T = any>(): EventHook<T> {
  const fns: Set<cb<T>> = new Set()

  const off = (fn: cb<T>) => {
    fns.delete(fn)
  }

  const on = (fn: cb<T>) => {
    fns.add(fn)
    const offFn = () => off(fn)

    onCleanup(offFn)

    return {
      off: offFn,
    }
  }

  const trigger: EventHookTrigger<T> = (...args) => {
    return Promise.all(Array.from(fns).map(fn => fn(...(args as [T, ...unknown[]]))))
  }

  return {
    on,
    off,
    trigger,
  }
}
