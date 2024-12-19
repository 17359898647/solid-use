import type { Accessor, Setter } from 'solid-js'
import type { MaybeAccessor } from './access'
import type { EventHookOn } from './createEventHook'
import { createEffect, createSignal, on, onMount } from 'solid-js'
import { noop } from '../common'
import { access } from './access'
import { createEventHook } from './createEventHook'
import { until } from './until'

type MaybePromise<T> = Promise<T> | T
type IAxiosPromise<T, U> = (Params: U) => MaybePromise<T>
interface IAxiosOptions<T> {
  /**
   * @default false
   * @description If set to true, it will execute the promise on mount.
   */
  immediate?: boolean
  initialData?: T
  onError?: (e: any) => void
  onFinally?: () => void
  onSuccess?: (data: T) => void
  /**
   * @default true
   * @description If set to false, it will not reset the state to initialData before executing the promise.
   */
  resetOnExecute?: boolean
}
interface IUseAxiosReturn<T, P> {
  abort: () => void
  data: Accessor<T | undefined>
  error: Accessor<any>
  execute: (params?: MaybeAccessor<P>) => Promise<T | undefined>
  finished: Accessor<boolean>
  loading: Accessor<boolean>
  mutate: Setter<T | undefined>
  onError: EventHookOn
  onFinally: EventHookOn
  onSuccess: EventHookOn<T | undefined>
  refresh: () => Promise<T | undefined>
}
const ABORT_ERROR = new Error('Aborted')
export function useAxios<T, P>(fetch: IAxiosPromise<T, P>): IUseAxiosReturn<T, P>
export function useAxios<T, P>(fetch: IAxiosPromise<T, P>, options: IAxiosOptions<T>): IUseAxiosReturn<T, P>
export function useAxios<T, P>(params: MaybeAccessor<P>, fetch: IAxiosPromise<T, P>): IUseAxiosReturn<T, P>
export function useAxios<T, P>(
  params: MaybeAccessor<P>,
  fetch: IAxiosPromise<T, P>,
  options: IAxiosOptions<T>
): IUseAxiosReturn<T, P>
export function useAxios<T = any, P = any>(...args: any[]): IUseAxiosReturn<T, P> {
  let fetch: IAxiosPromise<T, P>
  let params: MaybeAccessor<P>
  let options: IAxiosOptions<T> = {}
  if (args.length === 1) {
    [fetch] = args
  }
  if (args.length === 2 && typeof args[1] !== 'object') {
    [params, fetch] = args
  }
  else if (typeof args[1] === 'object') {
    [fetch, options] = args
  }
  if (args.length === 3) {
    [params, fetch, options] = args
  }
  const { immediate = true, resetOnExecute = true, onSuccess = noop, onError = noop, onFinally = noop, initialData } = options
  const successEvent = createEventHook<T | undefined>()
  const errorEvent = createEventHook<any>()
  const finallyEvent = createEventHook<any>()
  const [data, setData] = createSignal<T | undefined>(initialData)
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal<any>()
  const [finished, setFinished] = createSignal(false)
  let activeRequestCount = 0
  let lastReject: (reason?: unknown) => void

  const resetData = () => {
    if (resetOnExecute) {
      setData(() => initialData)
    }
  }
  const { toBe } = until(finished)
  const waitUntilFinished = () => {
    return new Promise<T | undefined>((resolve, reject) => {
      toBe(true).then(() => (error() ? reject(error()) : resolve(data())))
    })
  }

  const promise = {
    then: (...args: any[]) => waitUntilFinished().then(...args),
    catch: (...args: any[]) => waitUntilFinished().catch(...args),
  } as Promise<T | undefined>

  const execute = (_params?: MaybeAccessor<P>) => {
    // eslint-disable-next-line no-async-promise-executor
    new Promise<T>(async (resolve, reject) => {
      activeRequestCount++
      setFinished(false)
      setLoading(true)
      resetData()
      setError()
      if (lastReject) {
        lastReject(ABORT_ERROR)
      }
      lastReject = reject
      try {
        const result = await fetch(access(_params) ?? access(params))
        resolve(result)
      }
      catch (error) {
        reject(error)
      }
      finally {
        activeRequestCount--
      }
    })
      .then((result) => {
        setData(() => result)
        successEvent.trigger(result)
        onSuccess(result)
      })
      .catch((error) => {
        if (error === ABORT_ERROR || activeRequestCount !== 0)
          return
        setError(error)
        errorEvent.trigger(error)
        onError(error)
      })
      .finally(() => {
        if (activeRequestCount !== 0)
          return
        setLoading(false)
        setFinished(true)
        finallyEvent.trigger()
        onFinally()
      })

    return promise
  }

  const refresh = () => execute(params)
  const abort = () => {
    lastReject?.(ABORT_ERROR)
    resetData()
    setError()
    setLoading(false)
  }

  onMount(() => {
    immediate && execute()
  })

  createEffect(
    on(() => access(params), execute, {
      defer: true,
    }),
  )

  return {
    data,
    error,
    execute,
    loading,
    finished,
    mutate: setData,
    onError: errorEvent.on,
    onFinally: finallyEvent.on,
    onSuccess: successEvent.on,
    refresh,
    abort,
  }
}
