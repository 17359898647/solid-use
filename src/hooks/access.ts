import type { Accessor } from 'solid-js'
import { isFunction } from 'lodash-es'

export type MaybeAccessor<T = any> = T | Accessor<T>
export type MaybeAccessorValue<T extends MaybeAccessor<any>> = T extends () => any ? ReturnType<T> : T

export type AnyObject = Record<PropertyKey, any>
export type AnyStatic = [] | any[] | AnyObject
export type AnyFunction = (...args: any[]) => any
export type AddMaybeAccessor<T> = {
  [P in keyof T]: T[P] extends AnyFunction ? T[P] : MaybeAccessor<T[P]>;
}
export function access<T extends MaybeAccessor<any>>(v: T): MaybeAccessorValue<T> {
  return isFunction(v) && !v.length ? v() : v
}

export function accessWith<T>(
  valueOrFn: T,
  ...args: T extends AnyFunction ? Parameters<T> : never
): T extends AnyFunction ? ReturnType<T> : T {
  return isFunction(valueOrFn) ? valueOrFn(...args) : valueOrFn
}
